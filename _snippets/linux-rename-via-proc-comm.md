---
title: "Rename a running Linux process via /proc/self/comm"
author: k0re
date: 2026-05-19
tags: [linux, evasion, procfs]
description: "Two ways to change the name a process reports: prctl(PR_SET_NAME, ...) and writing /proc/self/comm. Both clamp to 15 chars."
---

```c
#include <sys/prctl.h>
#include <fcntl.h>
#include <unistd.h>
#include <string.h>

void rename_via_prctl(const char *name) {
    prctl(PR_SET_NAME, (unsigned long)name, 0, 0, 0);
}

void rename_via_procfs(const char *name) {
    int fd = open("/proc/self/comm", O_WRONLY);
    if (fd < 0) return;
    write(fd, name, strnlen(name, 15));
    close(fd);
}

int main(void) {
    rename_via_prctl("kworker/u8:1");
    // confirm: cat /proc/$$/comm
    pause();
}
```
