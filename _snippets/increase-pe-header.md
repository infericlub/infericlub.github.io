---
title: "Increase PE's SizeOfImage field"
author: estr3llas
---

```cpp
void IncreaseSizeOfImage(PPEB peb) {
    const auto ldr_data = peb->LoaderData;
    const auto& [flink, blink] = ldr_data->InLoadOrderModuleList;

    // Retrieve the record of our PE from NTDLL's POV
    const auto pe = reinterpret_cast<peb::PLDR_DATA_TABLE_ENTRY>(flink->Flink);

    // Get the PE's SizeOfImage field
    auto pSize = &pe->SizeOfImage;

    // Increase it by an arbitrary number
    *pSize = static_cast<
        ULONG > (
            static_cast< INT_PTR > (pe->SizeOfImage + 0x10000000));
 }
```
