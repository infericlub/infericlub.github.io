---
title: "Find user accounts where AES-only Kerberos is unset"
author: v3lkro
date: 2026-06-04
tags: [active-directory, kerberos, audit]
description: "List user accounts whose msDS-SupportedEncryptionTypes still allows RC4. Useful when an AD admin claims 'we enforced AES everywhere already'."
---

```powershell
Get-ADUser -Filter * `
    -Properties msDS-SupportedEncryptionTypes, ServicePrincipalName, PasswordLastSet |
    Where-Object {
        $_.SamAccountName -notlike "*$" -and (
            $null -eq $_.'msDS-SupportedEncryptionTypes' -or
            ($_.'msDS-SupportedEncryptionTypes' -band 0x4) -eq 0x4   # RC4_HMAC_MD5
        )
    } |
    Select SamAccountName, `
           @{n="EncTypes"; e={ '0x{0:X}' -f $_.'msDS-SupportedEncryptionTypes' }}, `
           PasswordLastSet, `
           @{n="HasSPN"; e={ [bool]$_.ServicePrincipalName }} |
    Sort PasswordLastSet
```
