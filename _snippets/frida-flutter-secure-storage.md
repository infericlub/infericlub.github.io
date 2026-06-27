---
title: "Frida hook: dump FlutterSecureStorage reads"
author: dsm
---

```javascript
Java.perform(function () {
    var flutterSecureStorage = null;

    try {
        flutterSecureStorage = Java.use("com.it_nomads.fluttersecurestorage.FlutterSecureStorage");

        if (flutterSecureStorage) {
            console.log("> FlutterSecureStorage found");

            flutterSecureStorage.read.overload('java.lang.String').implementation = function (key) {
                var data = this.read(key);
                console.log("Reading Data | Key: " + key + " | Data: " + data);
                return data;
            };

            flutterSecureStorage.write.overload('java.lang.String', 'java.lang.String').implementation = function (key, value) {
                console.log("Writing Data | Key: " + key + " | Data: " + value);
                return this.write(key, value);
            };
        }
    } catch (err) {
        console.log("[!] FlutterSecureStorage not found yet. Retrying...");
        setTimeout(arguments.callee, 5000); // you can change the time here if you prefer
    }
});
```
