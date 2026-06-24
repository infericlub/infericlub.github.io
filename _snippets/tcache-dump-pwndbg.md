---
title: "Dump glibc tcache bins without pwndbg"
author: ratha
date: 2026-06-15
tags: [pwn, glibc, gdb, heap]
description: "A tiny gdb python command that walks every non-empty tcache bin and prints the linked list. Works on stock gdb, no pwndbg/gef needed."
---

```python
# save as tcache.py, then `source tcache.py` in gdb
import gdb

class TcacheDump(gdb.Command):
    def __init__(self):
        super().__init__("tcache_dump", gdb.COMMAND_USER)

    def invoke(self, arg, _):
        tc = gdb.parse_and_eval("(struct tcache_perthread_struct *)mp_.sbrk_base")
        # adjust offset if needed: tcache lives just after the heap base
        for i in range(64):
            cnt = int(tc["counts"][i])
            if cnt == 0:
                continue
            head = int(tc["entries"][i])
            size = 0x20 + i * 0x10
            chain = []
            p = head
            while p and len(chain) < cnt + 1:
                chain.append(hex(p))
                p = int(gdb.parse_and_eval(f"*(unsigned long*){p}"))
            print(f"size 0x{size:x} ({cnt}): " + " -> ".join(chain))

TcacheDump()
```
