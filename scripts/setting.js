
// 引入拖拽js
const uppercaseWords = (str) => str.replace(/^(.)|\s+(.)/g, (c) => c.toUpperCase());

// search engine settings
(function () {
    const searchEngines = document.getElementById('search-engines')

    const searchEngineNames = [
        "", // 添加空字符串作为第一个选项
        'google',
        'yahoo',
        'bing',
        'baidu',
        'yandex',
        'duckduckgo',
        'sogou',
        '360',
        'yahoo',
        'ecosia',
        'qwant',
        'findx',
        'amazon',
        'you',
        'bilibili',
        'youtube',
        'wikipedia'
    ]

    for (let name of searchEngineNames) {
        const engine = document.createElement('option')
        engine.innerText = uppercaseWords(name)
        searchEngines.appendChild(engine)
    }

    const component = 'engine'
    chrome.storage.sync.get(component, function (o) {
        if (o && o[component]) {
            const index = searchEngineNames.indexOf(o[component])
            if (index > -1) {
                searchEngines.selectedIndex = index
            }
        } else {
            // 如果没有找到匹配项，设置第一个选项（空字符串）为选中状态
            searchEngines.selectedIndex = 0;
        }
    })

    searchEngines.addEventListener('change', () => {
        chrome.storage.sync.set({
            [component]: searchEngineNames[searchEngines.selectedIndex]
        })
    })

    document.querySelector('.' + component + 'caption').innerText =
        chrome.i18n.getMessage(component + 'Title')

    //const directions = ['up', 'left', 'right', 'down']
     const directions = ['left-up', 'up', 'right-up', 'left', 'right', 'left-down', 'down', 'right-down']
    const prefix = 'direction-'

    directions.forEach(direction => {
        const d = document.querySelector(`#${prefix}${direction}`)

        for (let name of searchEngineNames) {
            const engine = document.createElement('option')
            engine.innerText = uppercaseWords(name)
            d.appendChild(engine)
        }

        d.addEventListener('change', () => {
            chrome.storage.sync.set({
                [`#${prefix}${direction}`]: searchEngineNames[d.selectedIndex]
            })
        })

        chrome.storage.sync.get([`#${prefix}${direction}`], function (o) {
            if (o && o[`#${prefix}${direction}`]) {
                const index = searchEngineNames.indexOf(o[`#${prefix}${direction}`])
                if (index > -1) {
                    d.selectedIndex = index
                }
            }
        })
    })

})();

// tabmode
(function () {
    const component = 'tabmode'

    var components = document.querySelectorAll('input[name="' + component + '"]')
    console.log(components)

    chrome.storage.sync.get(component, function (o) {
        if (o && o[component]) {
            for (var i = 0; i < components.length; i++) {
                if (components[i].value === o[component]) {
                    components[i].checked = true
                    break
                }
            }
        } else {
            var t = {}
            t[component] = components[0].value
            chrome.storage.sync.set(t)
            components[0].checked = true
        }
    })

    function clickHandler(e) {
        var t = {}
        t[this.name] = this.value
        chrome.storage.sync.set(t)
    }

    components.forEach((e) => {
        e.addEventListener('click', clickHandler, !0)
    })

    document.querySelector('.' + component + 'caption').innerText =
        chrome.i18n.getMessage(component + 'Title')
})();


(function () {
    let button = document.querySelector('.toggle');
    button.addEventListener('click', function () {
        let controls = document.querySelector('div[id="controls"]');

        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            if (tabs && tabs.length > 0) {
                var current = tabs[tabs.length - 1]
                let url = current.url;

                if (controls.style.display == 'none') {
                    controls.style.display = 'block';
                    button.innerText = 'Disable on this page'
                } else {
                    controls.style.display = 'none';
                    button.innerText = 'Enable on this page'
                }

                var o = {};
                o[url] = controls.style.display === 'none';
                chrome.storage.sync.set(o);

                chrome.scripting.executeScript(current.tabId, {
                    code: "window['" + url + "']=" + o[url],
                    allFrames: true,
                })
            }
        });

    });

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        if (tabs && tabs.length > 0) {
            var current = tabs[tabs.length - 1]
            let url = current.url;

            chrome.storage.sync.get(url, function (o) {
                let controls = document.querySelector('div[id="controls"]');
                if (o && o[url]) {
                    controls.style.display = 'none';
                    button.innerText = 'Enable on this page'
                } else {
                    controls.style.display = 'block';
                    button.innerText = 'Disable on this page'
                }
            })
        }
    })



    let RenderUI = o => {
        for (let dw of o["domain-whitelist"]) {
            UpdateUI(dw)
        }
    }

    let UpdateUI = dw => {
        let domain = document.createElement("label");
        domain.innerText = dw;
        let removeButton = document.createElement("button");
        removeButton.innerText = "x";
        removeButton.addEventListener("click", () => {
            chrome.storage.sync.get("domain-whitelist", o => {
                if (o && o["domain-whitelist"]) {
                    let dwl = o["domain-whitelist"]
                    let i = dwl.indexOf(dw);
                    dwl.splice(i, 1)
                    o["domain-whitelist"] = dwl;
                    chrome.storage.sync.set(o)

                    // remove DOM
                    let container = document.querySelector(".domain-whitelist")
                    for (let child of container.children) {
                        if (child.key == dw) {
                            container.removeChild(child);
                            break;
                        }
                    }
                } else {
                    o["domain-whitelist"] = [url.hostname]
                    chrome.storage.sync.set(o)
                }
            })
        })
        removeButton.classList.add("remove");
        let row = document.createElement("div");
        row.appendChild(removeButton);
        row.appendChild(domain);
        row.key = dw;
        row.classList.add("row")
        let container = document.querySelector(".domain-whitelist")
        container.appendChild(row);
    }


    chrome.storage.sync.get("domain-whitelist", o => {
        if (o && o["domain-whitelist"]) {
            RenderUI(o)
        }
    })

    document.querySelector("#add").addEventListener("click", () => {
        let domain = document.querySelector("input[name=add]").value
        try {
            let url = new URL(domain)
            chrome.storage.sync.get("domain-whitelist", o => {
                if (o && o["domain-whitelist"]) {
                    let dwl = o["domain-whitelist"]
                    dwl.push(url.hostname)
                    o["domain-whitelist"] = dwl;
                    chrome.storage.sync.set(o)
                } else {
                    o["domain-whitelist"] = [url.hostname]
                    chrome.storage.sync.set(o)
                }

                UpdateUI(url.hostname)
            })
        } catch (e) {
            document.querySelector(".error-tips").classList.add("visible");
            let st = setTimeout(() => {
                document.querySelector(".error-tips").classList.remove("visible");
                clearTimeout(st);
            }, 2800)
        }
    })

})();
