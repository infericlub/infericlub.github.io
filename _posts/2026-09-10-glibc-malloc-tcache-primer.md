---
layout: post
title: "uma olhada nas internas do glibc malloc: tcache"
date: 2026-09-10 14:45:00 -0300
author: ratha
tags: [pwn, exploit, glibc, heap, linux]
lang: pt
excerpt: "tcache é a primeira parada quando você está aprendendo heap exploitation moderno — LIFO, sem checagens fortes, e a primitiva por trás de meia dúzia de técnicas."
---

Heap exploitation no glibc moderno (>= 2.26) gira em volta de uma estrutura chamada **tcache** — um cache thread-local de chunks recém-liberados, mantido em LIFO. Quase nada do que existia antes (fastbins, unsorted bin, etc) sumiu, mas o tcache fica na frente da fila, e como tem checagens propositalmente fracas, é onde a maioria das primitivas modernas começa.

Esse post mostra o comportamento básico com um programa de 15 linhas e usa o gdb pra olhar a estrutura interna.

## o caso mais simples

```c
// demo.c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char *a = malloc(0x60);
    char *b = malloc(0x60);

    free(a);
    free(b);

    char *c = malloc(0x60);
    char *d = malloc(0x60);

    printf("a=%p  b=%p\n", a, b);
    printf("c=%p  d=%p\n", c, d);
    // c == b, d == a
}
```

Compila sem ASLR pra ler os endereços:

```bash
$ gcc -no-pie -g demo.c -o demo
$ ./demo
a=0x4052a0  b=0x405310
c=0x405310  d=0x4052a0
```

Ou seja: `c == b`, `d == a`. O `free` mais recente é o primeiro a sair na próxima `malloc`. Pilha, não fila.

## olhando o tcache no gdb

Com a extensão [pwndbg](https://github.com/pwndbg/pwndbg) (ou gef) carregada:

```text
(gdb) b printf
(gdb) r
Breakpoint 1, ...

(gdb) tcache
tcachebins
0x70 [  2]: 0x405310 ◂— 0x4052a0 ◂— 0
```

A bin pro tamanho `0x70` (que é `0x60` de payload + `0x10` de metadata do chunk) tem 2 entradas:
- topo: `0x405310` (último `free` — o `b`)
- depois: `0x4052a0` (o `a`)

Esses endereços apontam pro `user data` do chunk, não pro header. O ponteiro `fd` do chunk (offset `0x10` no header) é o link pra próxima entrada da bin.

## a primitiva

A checagem de integridade do tcache é fraca: na hora de inserir, o glibc só guarda o ponteiro `fd` no header. Na hora de retirar, ele só lê o `fd` e o promove a próximo topo. **Não tem checagem de double-free** até o glibc 2.29 (que adicionou uma key no header pra detectar). E mesmo com a key, ela é só um magic value derivado do heap base — descobrível com uma leitura.

Isso quer dizer: se você consegue **escrever no `fd`** de um chunk que está no tcache (UAF clássico), a próxima `malloc(size)` te devolve o ponteiro que você escreveu lá. Isso é uma **arbitrary write→read primitive** sem precisar tocar libc imediatamente.

Esquema mental:

```text
malloc(0x60)  → a
malloc(0x60)  → b
free(a)
free(b)        tcache[0x70] = b → a → NULL
*(b)  = TARGET; corruption: tcache[0x70] = b → TARGET → ...
malloc(0x60)  → b      (topo da pilha)
malloc(0x60)  → TARGET (a próxima entrada agora aponta pra onde a gente quis)
```

A "corruption" é o passo que depende do bug que você achou — UAF, off-by-one que sobrescreve o `fd` do próximo chunk, overflow controlado, etc.

## o que vem depois

Tcache poisoning é só o começo. Em ordem de complexidade:

1. **Tcache poisoning** (escrita arbitrária num endereço escolhido).
2. **`__free_hook` / `__malloc_hook` overwrite** — funcionou até a glibc 2.34, que removeu os hooks. Hoje você reaponta uma struct estruturada (`FILE` vtables, `_dl_runtime_resolve_xsavec` no link_map, etc).
3. **House of Botcake** — combina double-free no unsorted bin com tcache pra ganhar leak + write em um bug só.
4. **House of Husk** / **House of Banana** — variantes mais novas que evitam o `tcache_perthread_struct` completamente.

Cada uma vale um post próprio. O ponto desse aqui era só fixar a intuição: o tcache é uma pilha por tamanho, com checagens propositalmente fracas, e a maioria das técnicas modernas de pwn começam fazendo essa pilha apontar pra um lugar que ela não devia.

> "Heap exploitation é leitura cuidadosa do source do glibc + paciência com o gdb." — coisa que alguém me falou em 2019 e que continua sendo o melhor conselho.

Pra ler depois: `malloc/malloc.c` no source do glibc, especialmente as funções `_int_free` e `__libc_malloc`. São longas mas legíveis, e cada técnica nova é uma releitura delas.