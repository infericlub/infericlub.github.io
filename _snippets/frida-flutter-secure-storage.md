---
title: "Frida hook: dump FlutterSecureStorage reads"
author: fnox
date: 2026-05-02
tags: [mobile, flutter, android, frida]
description: "Intercept FlutterSecureStorage.read calls in a Flutter Android app and print key/value pairs. Useful when a Flutter binary keeps secrets in encrypted prefs."
---

```javascript
Java.perform(function () {
    var SS = Java.use("com.it_nomads.fluttersecurestorage.FlutterSecureStorage");

    SS.read.overload("java.lang.String").implementation = function (key) {
        var v = this.read(key);
        console.log("[FSS] read(" + key + ") = " + v);
        return v;
    };

    SS.readAll.implementation = function () {
        var m = this.readAll();
        console.log("[FSS] readAll() = " + JSON.stringify(m));
        return m;
    };
});
```
