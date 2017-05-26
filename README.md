# NAP

1. In tampermonkey (for chrome) install the following userscript:

```
// ==UserScript==
// @name         NAP
// @namespace    IB
// @version      0.1
// @match        https://*/*
// @require https://code.jquery.com/jquery-3.2.1.min.js
// @require https://raw.githubusercontent.com/bonny-bonev/NAP/master/nap.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==
```

2. Go to IB > Reports > Activity > Statements
3. Select "Year to Date" option and click "View"
4. In the report on top right corner click "Load IB trades info"
5. After the trades are loaded go to fill the NAP document (50 section 5)
6. On top right corner click "Fill NAP data"
