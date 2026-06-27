---
title: "Increase PE's SizeOfImage field"
author: estr3llas
---

```cpp
bool TamperDllCharacteristics(DWORD_PTR moduleBase) {

    // retrieve the module's NT header
    const auto dos = reinterpret_cast<PIMAGE_DOS_HEADER>(moduleBase);
    const auto nt = reinterpret_cast<PIMAGE_NT_HEADERS>(moduleBase + dos->e_lfanew);

    // Access the DllCharacteristics and toggle the ASLR & Authenticode if set
    return nt->OptionalHeader.DllCharacteristics & (IMAGE_DLLCHARACTERISTICS_FORCE_INTEGRITY | IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE)
        ? (nt->OptionalHeader.DllCharacteristics &= ~(IMAGE_DLLCHARACTERISTICS_FORCE_INTEGRITY | IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE), true)
        : false
    ;
}
```