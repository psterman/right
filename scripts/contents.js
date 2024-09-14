
let currentPopup = null;
// 从存储中检索选中的搜索引擎
// 假设这是在 contents.js 中的现有代码
let selectedEngines = []; // 声明全局变量
// 当文档加载时从 Chrome 存储中加载 selectedEngines
document.addEventListener('DOMContentLoaded', function () {
    var sidebarUrl = document.getElementById('preview') ? document.getElementById('preview').src : '';
    chrome.storage.sync.set({ 'initialSidebarUrl': sidebarUrl }, function () {
        console.log('Initial sidebar URL saved to storage.');
    });
    chrome.storage.sync.get('selectedEngines', function (result) {
        selectedEngines = result.selectedEngines || [];
        // 如果页面加载时有选中文本，可以在这里调用 showSearchLinks
    });
});

// 当接收到从 options.js 发送的更新消息时
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateSelectedEngines') {
        selectedEngines = request.selectedEngines; // 更新全局变量
        console.log('Selected engines updated in content script:', selectedEngines);

        // 如果需要，可以在这里调用 showSearchLinks 函数
        // 例如，如果当前有选中的文本
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            showSearchLinks(selectedText, window.event.clientX, window.event.clientY, selectedEngines);
        }
    }
});
// 发送选中文本到后台脚本
function sendMessageToBackground(selectedText) {
    chrome.runtime.sendMessage({ msg: "setsearch", value: selectedText });
}

// 监听鼠标按下事件，点击页面任意位置关闭弹出菜单
document.addEventListener('mousedown', function (e) {
    if (currentPopup && !currentPopup.contains(e.target)) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
});

// 在 contents.js 文件中，确保 showSearchLinks 函数在用户选中文本后被调用
/* document.addEventListener('mouseup', function (e) {
    var selection = window.getSelection();
    if (!selection.isCollapsed) {
        // 用户选择了文本，发送 'setpage' 动作到后台脚本
        chrome.runtime.sendMessage({
            action: 'setpage',
            query: selection.toString() // 发送选中的文本
        });
    }
});
 */
// 监听鼠标弹起事件，以捕获用户选择的文本
document.addEventListener('mouseup', function (e) {
    handleTextSelection(e);
});

// 监听 input 和 textarea 的 select 事件
document.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('select', function (e) {
        handleTextSelection(e);
    });
});

function handleTextSelection(e) {
    var selection = window.getSelection();
    var target = e.target;
    var selectedText = '';
    var x = e.clientX;
    var y = e.clientY;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        selectedText = target.value.substring(target.selectionStart, target.selectionEnd).trim();

        // 修改条件检查，确保在输入框中有文本时显示菜单
        if (selectedText !== '') {
            showInputContextMenu(target, x, y);
        }
    } else if (!selection.isCollapsed) {
        selectedText = selection.toString().trim();
        if (selectedText) {
            showSearchLinks(selectedText, x, y, selectedEngines);
        }
    }
}
function showSearchLinks(selectedText, x, y, currentEngine) {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null; // 更新 currentPopup
    }
    var popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.borderRadius = '20px';
    popup.style.backgroundColor = 'black';
    popup.className = 'search-popup flex-container';

    var style = document.createElement('style');
    style.innerHTML = '.search-popup a { text-decoration: none; }';
    document.head.appendChild(style);

    popup.style.maxWidth = 'auto';
    popup.style.overflow = 'auto';

    var screenWidth = window.innerWidth;
    var menuWidth = 300;
    var menuOffset = 10;

    if (x + menuWidth + menuOffset > screenWidth) {
        popup.style.right = (screenWidth - x + menuOffset) + 'px';
        popup.style.left = 'auto';
    } else {
        popup.style.left = (x + menuOffset) + 'px';
        popup.style.right = 'auto';
    }

    popup.style.top = y + 'px';
    popup.style.zIndex = '9999';
    popup.style.borderRadius = '20px';
    popup.style.backgroundColor = 'black';
    popup.className = 'search-popup flex-container';

    var searchLinksContainer = document.createElement('div');
    searchLinksContainer.style.display = 'flex';
    searchLinksContainer.style.flexWrap = 'wrap'; // 添加这行以允许链接换行

    chrome.storage.sync.get(['websiteList', 'selectedEngines'], function (data) {
        var websiteList = data.websiteList || [];
        var selectedEngines = data.selectedEngines || [];

        // 创建一个数组来存储所有要显示的链接
        var allLinks = [];

        // 处理 websiteList
        websiteList.forEach(function (website) {
            if (website.checked) {
                allLinks.push({
                    name: website.name,
                    action: function () {
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: website.url + encodeURIComponent(selectedText),
                            openSidebar: false,
                        });
                        document.body.removeChild(popup);
                        currentPopup = null;
                    }
                });
            }
        });
        // 创建一个映射对象，将搜索引擎名称映射到其URL基础字符串
        const engineUrlMap = {
            'Google': 'https://www.google.com/search?q=',
            'Bing': 'https://www.bing.com/search?q=',
            'DuckDuckGo': 'https://duckduckgo.com/?q=',
            'Baidu': 'https://www.baidu.com/s?wd=',
            'Yandex': 'https://yandex.com/search/?text=',
            'Deepl': 'https://www.deepl.com/zh/translator#en/-hans/',
            'Doubao': 'https://www.doubao.com/chat/',
            'download': 'https://9xbuddy.in/process?url=',
            'Tongyi': 'https://tongyi.aliyun.com/qianwen/',
            'Kimi': 'https://kimi.moonshot.cn/',
            'Yuanbao': 'https://yuanbao.tencent.com/bot/chat',
            'Mita': 'https://metaso.cn/',
            'Yiyan': 'https://yiyan.baidu.com/',
            'Poe': 'https://poe.com/ChatGPT',
            'Perplexity': 'https://www.perplexity.ai/',
            'Chatgpt': 'https://chatgpt.com/',
            'Gemini': 'https://gemini.google.com/',
            'bookmarks': 'https://v.flomoapp.com/'
            // 可以根据需要添加更多搜索引擎
        };

        // 确保selectedEngines中的每个引擎都有其对应的urlBase
        selectedEngines.forEach(function (engine) {
            // 使用映射对象获取正确的urlBase，如果找不到则使用一个默认值或空字符串
            const urlBase = engineUrlMap[engine.name] || '';

            // 确保urlBase不为空再添加到链接数组中
            if (urlBase) {
                allLinks.push({
                    name: engine.name,
                    action: function () {
                        // 使用获取到的urlBase构建搜索链接
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: urlBase + encodeURIComponent(selectedText),
                            openSidebar: false,
                        });
                        document.body.removeChild(popup);
                        currentPopup = null;
                    }
                });
            }
        });

        // 创建并添加所有链接
        allLinks.forEach(function (link) {
            var actionLink = createActionLink(link.name, link.action);
            searchLinksContainer.appendChild(actionLink);
        });
    });

    // 读取复选框的状态
    chrome.storage.sync.get(['copyCheckbox', 'deleteCheckbox', 'jumpCheckbox', 'closeCheckbox', 'refreshCheckbox', 'pasteCheckbox', 'downloadCheckbox', 'closesidepanelCheckbox'], function (checkboxes) {
        var showCopy = checkboxes.copyCheckbox;
        var showJump = checkboxes.jumpCheckbox;
        var showClose = checkboxes.closeCheckbox;
        var showRefresh = checkboxes.refreshCheckbox;
        var showPaste = checkboxes.pasteCheckbox;
        var showDownload = checkboxes.downloadCheckbox;
        var showDelete = checkboxes.deleteCheckbox;
        var showclosesidepanel = checkboxes.closesidepanelCheckbox;

        // 添加复制、跳转和关闭选项到搜索链接容器
        if (showCopy) {
            var searchLinkCopy = createActionLink('复制', function () {
                var textToCopy = selectedText;

                var tempTextArea = document.createElement('textarea');
                tempTextArea.value = textToCopy;
                document.body.appendChild(tempTextArea);

                tempTextArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempTextArea);

                document.body.removeChild(popup);
                currentPopup = null;
            });
            searchLinksContainer.appendChild(searchLinkCopy);
        }

        // 以下是在文本框上右键点击时显示的上下文菜单中的删除链接
        // 修改后的 deleteSelectedText 函数
        function deleteSelectedText(inputElement) {
            var start = inputElement.selectionStart;
            var end = inputElement.selectionEnd;
            if (start !== end) {
                var newValue = inputElement.value.substring(0, start) + inputElement.value.substring(end);
                inputElement.value = newValue;
                inputElement.focus(); // 确保输入框仍然获得焦点
                // 将光标移至删除后的位置
                inputElement.setSelectionRange(start, start);
            }
        }

        // 创建删除选中文本的链接时，确保传递正确的 inputElement
        if (showDelete) {
            var searchLinkCut = createActionLink('删除选中文本', function () {
                // 调用 deleteSelectedText 函数并传递正确的 inputElement
                deleteSelectedText(e.target);
                // 隐藏弹出菜单
                hideInputContextMenu();
            });
            searchLinksContainer.appendChild(searchLinkCut);
        }
        if (showJump) {

            chrome.storage.sync.get('savedPages', function (items) {
                if (items.savedPages) {
                    var savedPages = items.savedPages;

                    var workmodel = createActionLink('收藏', function () {
                        // 发送消息请求 background.js 打开主页和侧边栏的页面
                        chrome.runtime.sendMessage({
                            action: 'openHomepageAndSidebar',
                            urls: {
                                homepageUrl: savedPages.homepageUrl,  // 主页网址
                                sidebarUrl: savedPages.sidebarUrl    // 侧边栏网址
                            }
                        });
                    });

                    searchLinksContainer.appendChild(workmodel);

                }
            });
            searchLinksContainer.appendChild(toggleSidebarLink);
        }
        if (showclosesidepanel) {
            var searchLinkOpenSidebar = createActionLink('开关', function () {
                var currentUrl = window.location.href;


                // 发送当前页面URL和sidebarUrl到侧边栏，等待响应
                chrome.runtime.sendMessage({
                    action: 'setpage',
                    query: currentUrl,

                }, function (response) {
                    if (response && response.ready) {
                        // 侧边栏已准备好加载新的URL
                        // 加载存储的previousUrl
                        chrome.runtime.sendMessage({
                            action: 'loadSidebarUrl',

                        });
                    }
                });
            });
            searchLinksContainer.appendChild(searchLinkOpenSidebar);
        }
        if (showClose) {
            var searchLinkClose1 = createActionLink('关闭', function () {
                chrome.runtime.sendMessage({ action: "closeTab" });
            });
            searchLinksContainer.appendChild(searchLinkClose1);
        }

        if (showRefresh) {
            var searchLinkRefresh = createActionLink('刷新', function () {
                // 先移除弹出菜单
                document.body.removeChild(popup);
                currentPopup = null;

                // 然后刷新当前页面
                window.location.reload();
            });
            searchLinksContainer.appendChild(searchLinkRefresh);
        }
        /*   if (showPaste) {
              var searchLinkOpenSidebar = createActionLink('开关', function () {
                  // 获取当前页面的 URL
                  var currentUrl = window.location.href;
  
                  // 发送消息，包含 action 和当前页面的 URL 作为 query
                  chrome.runtime.sendMessage({
                      action: 'setpage',
                      query: currentUrl // 使用当前页面的 URL 作为 query
                  });
              });
              searchLinksContainer.appendChild(searchLinkOpenSidebar);
          } */
        if (showDownload) {
            var searchLinkDownload = createActionLink('下载', function () {
                // 先移除弹出菜单
                document.body.removeChild(popup);
                currentPopup = null;

                // 然后刷新当前页面下载
                window.location.reload();
            });
            searchLinksContainer.appendChild(searchLinkDownload);
        }
    });



    // 默认搜索引擎链接
    var engines = getEnginesByType(currentEngine);
    // 过滤只显示用户勾选的搜索引擎
    engines = engines.filter(engine => selectedEngines.some(selected => selected.name === engine.name));
    engines.forEach(engine => {
        var searchLink = createSearchLink(engine.name, engine.urlBase, selectedText);
        searchLinksContainer.appendChild(searchLink);
    });



    popup.appendChild(searchLinksContainer);
    document.body.appendChild(popup);
    currentPopup = popup;


    function createActionLink(text, clickHandler) {
        var link = document.createElement('a');
        link.textContent = text;
        link.style.color = 'white';
        link.style.padding = '5px 10px';
        link.style.cursor = 'pointer';
        link.style.backgroundColor = 'black';
        link.style.transition = 'background-color 0.3s';

        link.addEventListener('mouseover', function () {
            this.style.backgroundColor = 'rgb(37, 138, 252)';
        });
        link.addEventListener('mouseout', function () {
            this.style.backgroundColor = 'black';
        });
        link.addEventListener('click', clickHandler);

        return link;
    }

    function createSearchLink(name, urlBase, searchText) {
        var link = document.createElement('a');
        link.href = urlBase + encodeURIComponent(searchText);
        link.textContent = name;
        link.style.color = 'white';
        link.style.padding = '5px 10px';
        link.style.cursor = 'pointer';
        link.style.backgroundColor = 'black';
        link.style.transition = 'background-color 0.3s';
        link.style.whiteSpace = 'nowrap';
        link.target = '_blank';

        link.addEventListener('mouseover', function () {
            this.style.backgroundColor = 'rgb(37, 138, 252)';
        });
        link.addEventListener('mouseout', function () {
            this.style.backgroundColor = 'black';
        });

        return link;
    }

    function getEnginesByType(type) {
        switch (type) {
            case 'googleImage':
                return [
                    { name: '百度', urlBase: 'https://image.baidu.com/search/index?word=' },
                    { name: '谷歌', urlBase: 'https://www.google.com/search?tbm=isch&q=' },
                    { name: '微信', urlBase: 'https://image.sogou.com/search?query=' }, // 微信图片搜索可能没有直接对应的链接，这里使用搜狗作为示例
                    { name: '昵图', urlBase: 'https://www.nipic.com/search/index.html?key=' }
                ];
            case 'douban':
                return [
                    { name: '大师兄', urlBase: 'http://www.dsxz.org/search.php?keyword=' }, // 示例链接，可能需要根据实际情况调整
                    { name: '低端影视', urlBase: 'http://www.ddys.tv/e/search/result.html?keyword=' }, // 同上
                    { name: '豆瓣', urlBase: 'https://movie.douban.com/subject_search?search_text=' }
                ];
            case 'neteaseMusic':
                return [{ name: '网易云', urlBase: 'https://music.163.com/#/search/m/?keywords=' },
                { name: 'QQ音乐', urlBase: 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=' },
                { name: '酷狗', urlBase: 'https://www.kugou.com/yy/index.php?r=search/song&keyword=' },
                { name: '酷我', urlBase: 'https://www.kuwo.cn/search/list?key=' }
                ];
            case 'zhihu':
                return [
                    { name: '知乎', urlBase: 'https://www.zhihu.com/search?type=content&q=' },
                    { name: '小红书', urlBase: 'https://www.xiaohongshu.com/search_result.html?keyword=' }, // 示例链接，实际可能需要调整
                    { name: '什么值得买', urlBase: 'https://search.smzdm.com/?c=home&s=' },
                    { name: 'Wiki', urlBase: 'https://www.wikipedia.org/w/index.php?search=' }
                ];
            default:
                return [
                    /*   { name: '百度', urlBase: 'https://www.baidu.com/s?wd=' },
                      { name: '谷歌', urlBase: 'https://www.google.com/search?q=' },
                      { name: '抖音', urlBase: 'https://www.douyin.com/search/' },
                      { name: '微信', urlBase: 'https://weixin.sogou.com/weixin?type=2&query=' },
                      { name: 'weibo', urlBase: 'https://s.weibo.com/weibo?q=' } */


                ];
        }
    }
}
// 为所有输入框和文本区域添加事件监听
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
        input.addEventListener('contextmenu', handleContextMenu);
    });
});
function handleInputFocus(e) {
    const input = e.target;
    const rect = input.getBoundingClientRect();
    showInputContextMenu(input, rect.left, rect.bottom);
}
// 修改 showInputContextMenu，调整位置计算等
function showInputContextMenu(inputElement, x, y) {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }

    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.borderRadius = '20px';
    popup.style.backgroundColor = 'black';
    popup.className = 'search-popup flex-container';

    const style = document.createElement('style');
    style.innerHTML = '.search-popup a { text-decoration: none; }';
    document.head.appendChild(style);

    popup.style.maxWidth = 'auto';
    popup.style.overflow = 'auto';

    const screenWidth = window.innerWidth;
    const menuWidth = 300;
    const menuOffset = 10;

    if (x + menuWidth + menuOffset > screenWidth) {
        popup.style.right = (screenWidth - x + menuOffset) + 'px';
        popup.style.left = 'auto';
    } else {
        popup.style.left = (x + menuOffset) + 'px';
        popup.style.right = 'auto';
    }

    popup.style.top = y + 'px';
    popup.style.zIndex = '9999';
    popup.style.borderRadius = '20px';
    popup.className = 'search-popup flex-container';

    const searchLinksContainer = document.createElement('div');
    searchLinksContainer.style.display = 'flex';
    searchLinksContainer.style.flexWrap = 'wrap';

    const pasteLink = createActionLink('粘贴', function () {
        navigator.clipboard.readText().then(text => {
            inputElement.value = text;
            hideInputContextMenu();
        });
    });

    const clearLink = createActionLink('清空', function () {
        inputElement.value = '';
        hideInputContextMenu();
    });
    const selectAllLink = createActionLink('全选', function () {
        // 执行全选操作
        inputElement.select();
        // 隐藏输入框上下文菜单
        hideInputContextMenu();
    });

    searchLinksContainer.appendChild(pasteLink);
    searchLinksContainer.appendChild(clearLink);
    searchLinksContainer.appendChild(selectAllLink);

    popup.appendChild(searchLinksContainer);
    document.body.appendChild(popup);
    currentPopup = popup;
}

function createActionLink(text, action) {
    const link = document.createElement('a');
    link.textContent = text;
    link.style.color = 'white';
    link.style.padding = '5px 10px';
    link.style.cursor = 'pointer';
    link.style.backgroundColor = 'black';
    link.style.transition = 'background-color 0.3s';

    link.addEventListener('mouseover', function () {
        this.style.backgroundColor = 'rgb(37, 138, 252)';
    });

    link.addEventListener('mouseout', function () {
        this.style.backgroundColor = 'black';
    });

    link.addEventListener('click', action);

    return link;
}
let inputs = document.querySelectorAll('input, textarea');
// 在输入框的 focus 事件中触发弹出菜单
inputs.forEach(input => {
    input.addEventListener('focus', function (e) {
        // 'this' 在这里的上下文中引用的是 input 元素
        var x = e.clientX;
        var y = e.clientY;
        showInputContextMenu(this, x, y); // 使用 'this' 代替未定义的 inputElement
    });
});
//粘贴or清空点击后菜单消失
function hideInputContextMenu() {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
}
/* // contents.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'openSidebar') {
        // 使用 chrome.sidePanel.open 或其他逻辑来打开侧边栏
        chrome.sidePanel.open({
            url: request.url,
            windowId: sender.tab.windowId
        });
    }
});
 */
//引入拖拽代码了

(function () {

    function getDirection(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;

        const vx = Math.abs(dx);
        const vy = Math.abs(dy);

        const threshold = 4; // 4px to change the direction

        // 检查是否移动距离过短，不足以判断为有效方向
        if (vx < threshold && vy < threshold) {
            return null;
        }

        // 判断对角线方向
        if (vx >= threshold && vy >= threshold) {
            if (dx > 0 && dy > 0) {
                return 'right-down';
            } else if (dx > 0 && dy < 0) {
                return 'right-up';
            } else if (dx < 0 && dy > 0) {
                return 'left-down';
            } else if (dx < 0 && dy < 0) {
                return 'left-up';
            }
        }

        // 判断水平或垂直方向
        if (vx > vy) {
            if (dx > 0) {
                return 'right';
            } else {
                return 'left';
            }
        } else {
            if (dy > 0) {
                return 'down';
            } else {
                return 'up';
            }
        }
    }
    let dragStartPoint = {}
    let direction

    function dragstart(e) {
        if (bypass(e.target))
            return false

        var data = ''
        if (window.getSelection() && window.getSelection().anchorNode &&
            window.getSelection().anchorNode.parentNode === e.target.parentNode) {
            data = window.getSelection().toString()
        }
        // data = data || e.target.src || e.target.href || e.target.innerText
        if (!data) {
            data = data || e.target.href || (function (element) {
                while (!element.parentElement.href) {
                    element = element.parentElement
                }
                return element.parentElement.href
            })(e.target)
        }

        e.dataTransfer.setData('text/plain', data)
        e.dataTransfer.effectAllowed = 'move'

        dragStartPoint = { x: e.clientX, y: e.clientY }
        return false
    }

    function dragover(e) {
        if (bypass(e.target))
            return false

        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'

        const { x, y } = dragStartPoint
        const d = getDirection(x, y, e.clientX, e.clientY)

        if (d) {
            direction = d
            dragStartPoint = {
                x: e.clientX,
                y: e.clientY
            }
        }

        return false
    }

    function drop(e) {
        if (bypass(e.target)) return false;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        var dropData = '';
        var isLink = false;

        // 检查拖拽的数据是否为链接
        if (e.dataTransfer.types.includes('text/uri-list')) {
            // 如果是链接，获取链接的 URL
            dropData = e.dataTransfer.getData('text/uri-list');
            isLink = true;
        } else {
            // 否则，获取选中的文本
            dropData = window.getSelection().toString();
        }

        // 发送消息到后台脚本
        if (isLink) {
            // 如果是链接，发送 'openUrlInBackground' 动作
            chrome.runtime.sendMessage({
                action: 'setpage',
                query: dropData,
                foreground: e.shiftKey ? true : false, // 如果按下 Shift 键则在前台打开
            });
        } else {
            var searchText = dropData;
            // 如果是文本，发送 'searchWithDirection' 动作

            chrome.runtime.sendMessage({
                action: 'searchWithDirection',
                text: encodeURIComponent(dropData),
                direction: direction
            });
        }
        return false;
    }

    function bypass(element) {
        if (window[location.href])
            return true

        // if this element is already has event listener bypass it to keep original function work
        if (element.tagName === 'INPUT')
            return true
    }

    function DNDHandler(element) {
        if (bypass(element))
            return false

        element.removeEventListener('dragstart', dragstart, true)
        element.addEventListener('dragstart', dragstart, true)
        element.removeEventListener('dragover', dragover, true)
        element.addEventListener('dragover', dragover, true)
        element.removeEventListener('drop', drop, true)
        element.addEventListener('drop', drop, true)
    }

    document.querySelectorAll('*').forEach(node => {
        DNDHandler(node)
    })

    const config = { attributes: false, childList: true, subtree: true };

    const callback = function (mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === "childList" &&
                // means visible elements
                mutation.target.offsetParent !== null &&
                // means is added not removed
                mutation.addedNodes.length) {
                const node = mutation.target
                DNDHandler(node)
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.body, config);

    let url = location.href
    chrome.storage.sync.get(url, function (o) {
        if (o && o[url]) {
            window[url] = true
        }
    })

    function getHostName(url) {
        const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
            return match[2];
        } else {
            return null;
        }
    }

    chrome.storage.sync.get("domain-whitelist", o => {
        if (o && o["domain-whitelist"]) {
            let hostname = getHostName(url)
            let i = ~o["domain-whitelist"].indexOf(hostname)
            if (i)
                window[url] = true
        }
    })
})()
//输入框
function createSearchPopup() {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
    }
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = '10000';
    popup.style.width = '300px'; // 定义悬浮窗的宽度
    popup.style.background = 'white';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';
    popup.id = "searchPopup";

    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.alignItems = 'center';
    toolbar.style.padding = '5px';
    toolbar.style.height = '30px'; // 工具栏高度
    toolbar.style.width = '100%'; // 确保工具栏宽度为100%
    toolbar.style.backgroundColor = 'transparent'; 
    toolbar.style.borderTopLeftRadius = '5px';
    toolbar.style.borderTopRightRadius = '5px';

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '16px';
    closeButton.style.color = '#666';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.height = '30px';
    closeButton.style.width = '30px';
    closeButton.style.lineHeight = '30px';
    closeButton.style.padding = '0'; // 移除内边距
    closeButton.style.marginLeft = 'auto'; // 将按钮推到最右边
    closeButton.style.display = 'flex'; // 使用 flex 布局
    closeButton.style.justifyContent = 'center'; // 水平居中
    closeButton.style.alignItems = 'center'; // 垂直居中
    closeButton.style.borderRadius = '2px';
    closeButton.textContent = '×';
    closeButton.onclick = closeSearchPopup;

    // 鼠标悬停效果
    closeButton.addEventListener('mouseover', function () {
        closeButton.style.color = 'red';
    });
    closeButton.addEventListener('mouseout', function () {
        closeButton.style.color = '#666';
    });
    popup.style.cursor = 'move'; // 添加移动光标样式


    // 创建搜索引擎列表
    const engineList = document.createElement('div');
    engineList.style.display = 'flex'; // 新增: 使用flex布局
    engineList.style.justifyContent = 'center'; // 新增: 居中对齐
    engineList.style.width = '100%'; // 新增: 设置宽度
    engineList.style.marginTop = '10px'; // 新增: 添加顶部间距
    engineList.style.padding = '5px';
    engineList.style.borderTop = '1px solid #ccc';

    // 创建搜索引擎项目的函数
    function createEngineItem(name, url) {
        const item = document.createElement('div');
        item.style.padding = '5px';
        item.style.cursor = 'pointer';
        item.textContent = name;
        item.style.color = '#007bff';
        item.style.marginRight = '10px'; // 新增: 添加右侧间距

        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f0f0f0';
        });

        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'transparent';
        });

        item.addEventListener('click', () => {
            const searchText = input.value.trim();
            if (searchText) {
                performSearch(searchText, url);
            }
        });

        return item;
    }

    // 添加百度搜索引擎
    const baiduItem = createEngineItem('百度搜索', 'https://www.baidu.com/s?wd=');
    engineList.appendChild(baiduItem);

    // 添加 Bing 搜索引擎
    const bingItem = createEngineItem('Bing 搜索', 'https://www.bing.com/search?q=');
    engineList.appendChild(bingItem);

    popup.appendChild(engineList);


    // 添加拖拽功能
    let isDragging = false;
    let startX, startY;

    toolbar.onmousedown = function (e) {
        isDragging = true;
        // 修改 3: 计算鼠标相对于弹窗的位置
        startX = e.clientX - popup.offsetLeft;
        startY = e.clientY - popup.offsetTop;

        e.preventDefault();
    };

    document.onmousemove = function (e) {
        if (!isDragging) return;

        // 修改 4: 直接计算新位置
        let newLeft = e.clientX - startX;
        let newTop = e.clientY - startY;

        // 确保弹窗不会被拖出屏幕
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - popup.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - popup.offsetHeight));

        popup.style.left = newLeft + 'px';
        popup.style.top = newTop + 'px';
        popup.style.transform = 'none'; // 移除 transform
    };


    document.onmouseup = function () {
        isDragging = false;
    };
    toolbar.appendChild(closeButton);
    popup.appendChild(toolbar);

    // 创建搜索区域
    const searchArea = document.createElement('div');
    searchArea.style.display = 'flex';
    searchArea.style.flexDirection = 'column'; // 修改: 改为纵向排列
    searchArea.style.justifyContent = 'center';
    searchArea.style.alignItems = 'center';
    searchArea.style.padding = '10px';

    // 新增: 创建输入框容器
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.width = '100%';
    inputContainer.style.marginBottom = '10px'; // 新增: 添加底部间距

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入搜索词...';
    input.style.flex = '1';
    input.style.height = '30px'; // 与工具栏等高
    input.style.fontSize = '14px';
    input.style.border = '1px solid #007bff';
    input.style.borderRight = 'none'; // 新增: 移除右边框
    input.style.borderRadius = '4px 0 0 4px';
    input.style.padding = '0 10px';
    input.style.boxSizing = 'border-box'; // 包括边框在内的宽度和高度
    input.style.verticalAlign = 'top'; // 新增
    input.style.position = 'relative'; // 新增
    
    
    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.height = '30px'; // 与工具栏等高
    searchButton.style.width = '80px'; // 搜索按钮宽度
    searchButton.style.fontSize = '14px';
    searchButton.style.backgroundColor = '#007bff';
    searchButton.style.color = 'white';
    searchButton.style.border = '1px solid #007bff';
    searchButton.style.borderLeft = 'none'; // 新增: 移除左边框
    searchButton.style.borderRadius = '0 4px 4px 0';
    searchButton.style.boxSizing = 'border-box'; // 包括边框在内的宽度和高度
    searchButton.style.cursor = 'pointer';
    searchButton.style.verticalAlign = 'top'; // 新增
    searchButton.style.padding = '0 15px';
    searchButton.style.position = 'relative'; // 新增
    searchButton.style.left = '-1px'; // 新增

    // 新增: 添加焦点样式
    input.addEventListener('focus', () => {
        input.style.borderColor = '#007bff';
    });

    input.addEventListener('blur', () => {
        input.style.borderColor = '#007bff';
    });
    searchButton.onclick = () => {
        const searchText = input.value.trim();
        if (searchText) {
            performSearch(searchText, 'https://www.google.com/search?q=');
        }
    };

    searchArea.appendChild(inputContainer);
    searchArea.appendChild(engineList);
    popup.appendChild(searchArea);
    // 修改: 将输入框和搜索按钮添加到新的容器中
    inputContainer.appendChild(input);
    inputContainer.appendChild(searchButton);

    document.body.appendChild(popup);
    currentPopup = popup;
    // 修改 5: 添加 setTimeout 来重新计算初始位置
    setTimeout(() => {
        const rect = popup.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.transform = 'none';
    }, 0);
    input.focus();
    input.addEventListener('keypress', onKeyPress);
    document.addEventListener('keydown', onKeyDown);

   
}
// 执行搜索
function performSearch(searchText, engineUrl) {
    const searchUrl = engineUrl + encodeURIComponent(searchText);
    chrome.runtime.sendMessage({
        action: "setpage",
        query: searchUrl
    });
    closeSearchPopup();
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "showPopup") {
        createSearchPopup();
    }
});
function onKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 阻止默认行为，如表单提交
        const searchText = event.target.value.trim();
        if (searchText) {
            performSearch(searchText);
            closeSearchPopup();
        }
    }
}
function closeSearchPopup() {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
        document.removeEventListener('keydown', onKeyDown);
    }
}
function onKeyDown(event) {
    if (event.key === 'Escape') {
        closeSearchPopup();
        event.preventDefault(); // 阻止默认行为，如果有的话
    }
}
// 确保在页面加载时移除之前的悬浮窗
document.addEventListener('DOMContentLoaded', () => {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
});
// 新增: 全局变量
let mouseDownTimer;
let isMouseDown = false;
let startX, startY;
const LONG_PRESS_DURATION = 500; // 长按时间阈值，单位为毫秒
const MOVE_THRESHOLD = 5; // 允许的最小移动像素，用于区分静止和移动

// 新增: 事件监听器
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mousemove', handleMouseMove);

// 修改: 保留原有的键盘事件监听器
document.addEventListener('keydown', handleKeyDown);

// 新增: handleMouseDown 函数
function handleMouseDown(e) {
    // 只响应鼠标左键
    if (e.button !== 0) return;

    isMouseDown = true;
    startX = e.clientX;
    startY = e.clientY;

    mouseDownTimer = setTimeout(() => {
        if (isMouseDown && !hasMovedBeyondThreshold(e)) {
            // 调用原有的 createSearchPopup 函数
            createSearchPopup();
            e.preventDefault();
            e.stopPropagation();
        }
    }, LONG_PRESS_DURATION);
}

// 新增: handleMouseUp 函数
function handleMouseUp() {
    isMouseDown = false;
    clearTimeout(mouseDownTimer);
}

// 新增: handleMouseMove 函数
function handleMouseMove(e) {
    if (isMouseDown && hasMovedBeyondThreshold(e)) {
        clearTimeout(mouseDownTimer);
    }
}

// 新增: hasMovedBeyondThreshold 函数
function hasMovedBeyondThreshold(e) {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);
    return deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD;
}