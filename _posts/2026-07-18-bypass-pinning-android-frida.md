---
layout: post
title: "bypass de SSL pinning em Android com Frida"
date: 2026-01-02 16:20:00 -0300
author: fnox
tags: [mobile, android, frida, reverse-engineering, https]
lang: pt
excerpt: "três caminhos pra burlar pinning em apps Android, TrustManager genérico, OkHttp CertificatePinner, e o caso chato quando o pinning é nativo."
---

Pinning de certificado em Android tem três encarnações comuns:

1. `SSLContext.init(...)` recebe uma lista de `TrustManager` que o desenvolvedor montou na mão pra aceitar só o cert do servidor.
2. A app usa **OkHttp** com `CertificatePinner` configurado por host.
3. O pinning vive em código **nativo** (`libssl.so` recompilada, ou checagem no JNI). É o caso que dá trabalho.

Esse post foca nos dois primeiros. O terceiro caso é tópico pra outro dia.

## intercepção via TrustManager

A ideia: substituir os `TrustManager` que vão pro `SSLContext.init` por um que aceita qualquer cadeia. Isso resolve a app "do livro" que rola seu próprio `X509TrustManager`.

```javascript
// pinning-bypass.js
Java.perform(function () {
    var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    var SSLContext = Java.use("javax.net.ssl.SSLContext");

    var TrustAll = Java.registerClass({
        name: "club.inferi.TrustAll",
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function (chain, authType) { },
            checkServerTrusted: function (chain, authType) { },
            getAcceptedIssuers: function () { return []; },
        }
    });

    var tms = [TrustAll.$new()];

    var init = SSLContext.init.overload(
        "[Ljavax.net.ssl.KeyManager;",
        "[Ljavax.net.ssl.TrustManager;",
        "java.security.SecureRandom"
    );

    init.implementation = function (kms, _ignored, sr) {
        console.log("[+] SSLContext.init, swapping TrustManagers");
        init.call(this, kms, tms, sr);
    };
});
```

## OkHttp CertificatePinner

Se a app usa OkHttp (e a maioria das modernas usa) é bem provável que tenha `CertificatePinner` configurado. Aí o `TrustManager` swap não resolve, porque a checagem acontece **depois** do handshake. Patch direto no método:

```javascript
try {
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");

    CertificatePinner.check.overload(
        "java.lang.String",
        "java.util.List"
    ).implementation = function (host, peerCerts) {
        console.log("[+] okhttp3.CertificatePinner.check bypass: " + host);
        return; // não joga SSLPeerUnverifiedException
    };
} catch (e) {
    console.log("[!] okhttp3 não carregado: " + e);
}
```

`Java.use(...)` lança se a classe não estiver no classloader, então o `try` é importante, não é todo APK que linka OkHttp.

## rodando

```text
$ frida -U -f com.target.app -l pinning-bypass.js --no-pause
[+] SSLContext.init, swapping TrustManagers
[+] okhttp3.CertificatePinner.check bypass: api.target.com
```

Se você está com Burp/mitmproxy escutando na máquina e configurou o proxy no device (ou em `iptables` se está rodando com root), o tráfego HTTPS começa a aparecer em texto.

## quando não funciona

- **APK com integrity check / RASP.** Apps "endurecidas" detectam que o Frida server está rodando (porta TCP, nomes de thread, `/proc/self/maps`). Frida + `frida-magisk-gadget` + scripts anti-RASP são o caminho, mas é gato e rato.
- **Pinning em código nativo.** A checagem rola dentro do JNI ou de uma `libssl.so` modificada estaticamente. Aí você precisa achar a função em IDA/Ghidra e patchear (`r2frida`, `Interceptor.attach` em endereços, ou rebuild da `.so`).
- **App usa BoringSSL diretamente.** Sem `okhttp3.CertificatePinner` no path, com handshake feito em código nativo. Mesmo problema do anterior.

## limpeza

Não deixe o `frida-server` rodando no device depois. E não esqueça de derrubar o `iptables` REDIRECT se você jogou tudo pro Burp:

```bash
$ adb shell su -c iptables -t nat -F
```

Se o objetivo é só ler o tráfego, é o suficiente. Se a meta é entender a lógica do app, este é o começo, não o fim.