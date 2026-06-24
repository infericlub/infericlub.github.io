---
layout: post
title: "tracing syscalls with eBPF: a primer"
date: 2026-01-01 09:30:00 -0300
author: k0re
tags: [linux, ebpf, kernel, observability]
lang: en
excerpt: "a working openat() tracer in under 60 lines of C + Python, and the kernel-side bits worth understanding before you reach for bpftrace."
---

`bpftrace` is great, but reaching for it before you understand what's underneath leaves you with the wrong intuitions when something breaks. This post writes a minimal `openat(2)` tracer in eBPF + libbpf-style Python, and points at the kernel-side details that matter the moment you leave the "hello world" zone.

## the eBPF program

A `kprobe` fires whenever the kernel enters a named function. We attach to `__x64_sys_openat`, pull the second argument (the filename pointer), and ship a small event to userspace via a ring buffer.

```c
// openat.bpf.c
#include <linux/bpf.h>
#include <linux/ptrace.h>
#include <bpf/bpf_helpers.h>

struct event {
    __u32 pid;
    __u64 ts;
    char  comm[16];
    char  filename[256];
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 24);
} events SEC(".maps");

SEC("kprobe/__x64_sys_openat")
int kprobe__sys_openat(struct pt_regs *ctx)
{
    struct event *e;
    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;

    e->pid = bpf_get_current_pid_tgid() >> 32;
    e->ts  = bpf_ktime_get_ns();
    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    const char *fn = (const char *)PT_REGS_PARM2(ctx);
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename), fn);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

Three small things worth pointing at:

- `BPF_MAP_TYPE_RINGBUF` is the only ring-buffer type you should reach for in 2026. It's lock-free, single-producer, and userspace polls it without a syscall per event.
- `PT_REGS_PARM2(ctx)` decodes the second argument out of the saved register state. The macro hides per-arch register naming, same code builds on arm64 once you swap the kprobe target name.
- `bpf_probe_read_user_str` is the *only* safe way to dereference a userspace pointer from kernel context. Touching it directly would page-fault and the verifier won't load the program.

## the userspace loader

`BCC` is fine for primers; `libbpf-bootstrap` is what you'd ship. Either is more code than makes sense here, so we use BCC for brevity:

```python
# openat.py
from bcc import BPF

with open("openat.bpf.c") as f:
    prog = f.read()

b = BPF(text=prog)

def handle(cpu, data, size):
    e = b["events"].event(data)
    print(f"{e.pid:6d} {e.comm.decode():16s} {e.filename.decode()}")

b["events"].open_ring_buffer(handle)
print(f"{'PID':>6} {'COMM':<16} FILENAME")
while True:
    try:
        b.ring_buffer_poll()
    except KeyboardInterrupt:
        break
```

Run it:

```text
# python openat.py
   PID COMM             FILENAME
  9412 bash             /etc/ld.so.cache
  9412 bash             /lib/x86_64-linux-gnu/libtinfo.so.6
  9412 bash             /home/k0re/.bashrc
```

## where the abstraction leaks

A few things bit me the first time I went past the primer:

1. **kprobes vs fentry.** `kprobe/__x64_sys_openat` works but pays an `int3` for every hit. On kernels ≥ 5.5 you should prefer `fentry/__x64_sys_openat`, which uses static-call-style trampolines and is materially cheaper. The C is the same; only the section name changes.
2. **syscall name drift.** The `__x64_` prefix exists because the syscall is wrapped by `SYSCALL_DEFINE*` macros that emit per-arch symbols. On older kernels the prefix doesn't exist; on aarch64 it's `__arm64_`. CO-RE (Compile Once, Run Everywhere) hides this with `BPF_KSYSCALL`, which you'll want before shipping anything.
3. **the verifier counts loops.** Your program is bounded, no unbounded loops, no recursion, no calls into anything that isn't a BPF helper. If it loads, it terminates. If it doesn't load, the error message is roughly as friendly as a kernel oops.

That's enough for the primer. The next post in this series goes after `tc` egress hooks and packet-level filtering, same vocabulary, different attach point.