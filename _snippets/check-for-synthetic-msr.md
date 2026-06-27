---
title: "Check for Synthetic MSR"
author: estr3llas
---

```c
// Reserved MSR Address Space, meaning all future processors will not implement MSRs in this range.
//
// Goes up to 0x400000FF
//
#define SYNTHETIC_MSR_RANGE_START 0x40000000

BOOLEAN CheckForSyntheticMSR() {

    __try {
        __readmsr(SYNTHETIC_MSR_RANGE_START);
    }
    __except(EXCEPTION_EXECUTE_HANDLER) {
        return FALSE;
    }

    // If by any chance __readmsr returns a value, and our handler does not gets executed, we are likely being virtualized
    return TRUE;
}
```
