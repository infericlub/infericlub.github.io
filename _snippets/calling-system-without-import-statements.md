---
title: "Calling os.system Without import Statements"
author: astreuw
---

```python
#!/usr/bin/env python3

# Note: this is clearly bad practice and should not be used in real projects.
# It is not confirmed that this will work in the future

for module in object.__subclasses__():
  if "_wrap_close" in str(module):
    for method in module.__init__.__globals__.values():
      if "function system" in str(system := method):
        system("id")
```
