let isPinned = false;
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
    if (currentPopup && !currentPopup.contains(e.target) && !isPinned) {
        currentPopup.style.display = 'none';
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

    // 修改这部分
    if (!currentPopup) {
        currentPopup = document.createElement('div');
        currentPopup.style.position = 'relative';
        currentPopup.style.padding = '25px 25px 25px 25px'; // 为关闭按钮留出空间
        currentPopup.style.zIndex = '9999';
        currentPopup.style.borderRadius = '20px';
        currentPopup.style.backgroundColor = 'black';
        currentPopup.className = 'search-popup flex-container';
        document.body.appendChild(currentPopup);
    }
    updatePopupPosition(currentPopup, x, y);
    currentPopup.innerHTML = '';

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
    const pinButton = createActionLink('📌', togglePin);
    searchLinksContainer.appendChild(pinButton);

    currentPopup.appendChild(searchLinksContainer);
    currentPopup.style.display = 'block';
}
function updatePopupPosition(popup, x, y) {
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
        currentPopup.style.display = 'block';
        centerPopup(currentPopup);
        return;
        updatePopupVisibility();
    }
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '10000';
    popup.style.width = '300px';
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
    toolbar.style.padding = '0';
    toolbar.style.height = '30px';
    toolbar.style.width = '100%';
    toolbar.style.cursor = 'move';

    // 创建置顶按钮
    const pinButton = document.createElement('button');
    pinButton.innerHTML = isPinned ? '📍' : '📌';
    pinButton.style.cssText = `
        cursor: pointer;
        font-size: 16px;
        color: ${isPinned ? '#007bff' : '#666'};
        border: none;
        background-color: transparent;
        height: 30px;
        width: 30px;
        line-height: 30px;
        border-radius: 2px;
    `;
    updatePinButtonState(pinButton); // 新函数
    pinButton.onclick = togglePin;
    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.position = 'absolute';
    closeButton.style.cursor = 'pointer';
    closeButton.style.top = '15px';
    closeButton.style.right = '150px';
    closeButton.style.fontSize = '16px';
    closeButton.style.color = '#666';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.height = '20px';
    closeButton.style.width = '20px';
    closeButton.style.lineHeight = '20px';
    closeButton.style.marginRight = '0'; // 新增这行代码
    closeButton.style.borderRadius = '2px';
    closeButton.textContent = 'x';
    closeButton.style.cssText = pinButton.style.cssText;
    closeButton.onclick = closeSearchPopup;

    // 鼠标悬停效果
    closeButton.addEventListener('mouseover', function () {
        closeButton.style.color = 'red';
    });
    closeButton.addEventListener('mouseout', function () {
        closeButton.style.color = '#666';
    });
    toolbar.appendChild(pinButton);
    toolbar.appendChild(closeButton);
    popup.appendChild(toolbar);

    function togglePin() {
        isPinned = !isPinned;
        const pinButton = currentPopup.querySelector('button');
        if (isPinned) {
            pinButton.innerHTML = '📍';
            pinButton.style.color = '#007bff';
            currentPopup.style.display = 'block'; // 确保悬浮窗可见
            chrome.storage.local.set({
                popupPosition: { top: currentPopup.style.top, left: currentPopup.style.left },
                isPinned: true
            });
        } else {
            pinButton.innerHTML = '📌';
            pinButton.style.color = '#666';
            chrome.storage.local.remove(['popupPosition', 'isPinned']);
        }
    }

    function handleOutsideClick(e) {
        if (currentPopup && !currentPopup.contains(e.target) && !isPinned) {
            closeSearchPopup();
        }
    }
    chrome.storage.local.get('popupPosition', function (result) {
        if (result.popupPosition) {
            popup.style.top = result.popupPosition.top;
            popup.style.left = result.popupPosition.left;
            popup.style.transform = 'none';
            isPinned = true;
            pinButton.innerHTML = '📍';
            pinButton.style.color = '#007bff';
        }
    });

    // 添加全局点击事件监听器
    // 修改: 更新全局点击事件监听器
    document.addEventListener('mousedown', function (e) {
        if (!popup.contains(e.target)) {
            if (!isPinned) {
                closeSearchPopup();
            }
        }
    });

    // 修改: 更新 makeDraggable 函数调用
    makeDraggable(popup, toolbar, function () {
        if (isPinned) {
            chrome.storage.local.set({ popupPosition: { top: popup.style.top, left: popup.style.left } });
        }
    });

    // 创建搜索区域
    const searchArea = document.createElement('div');
    searchArea.style.display = 'flex';
    searchArea.style.justifyContent = 'center';
    searchArea.style.alignItems = 'center';
    searchArea.style.padding = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入搜索词...';
    input.style.flex = '1';
    input.style.height = '30px'; // 与工具栏等高
    input.style.fontSize = '14px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px 0 0 4px';
    input.style.padding = '0 10px';
    input.style.boxSizing = 'border-box'; // 包括边框在内的宽度和高度
    input.style.color = 'black'; // 设置文字颜色为黑色
    input.style.backgroundColor = 'white'; // 设置背景色为白色
    input.style.outline = 'none'; // 移除焦点时的轮廓

    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.height = '30px'; // 与工具栏等高
    searchButton.style.width = '80px'; // 搜索按钮宽度
    searchButton.style.fontSize = '14px';
    searchButton.style.backgroundColor = '#007bff';
    searchButton.style.color = 'white';
    searchButton.style.border = '1px solid #007bff';
    searchButton.style.borderRadius = '0 4px 4px 0';
    searchButton.style.boxSizing = 'border-box'; // 包括边框在内的宽度和高度
    searchButton.onclick = () => {
        const searchText = input.value.trim();
        if (searchText) {
            performSearch(searchText);
            if (!isPinned) {
                closeSearchPopup();
            }
        }
    };

    searchArea.appendChild(input);
    searchArea.appendChild(searchButton);
    popup.appendChild(searchArea);

    document.body.appendChild(popup);
    currentPopup = popup;
    centerPopup(popup);
    currentPopup.style.display = 'block';
    input.focus();
    input.addEventListener('keypress', onKeyPress);
    document.addEventListener('keydown', onKeyDown);

    // 激活输入框时改变颜色
    input.addEventListener('focus', () => {
        input.style.borderColor = searchButton.style.backgroundColor;
    });
    input.addEventListener('blur', () => {
        input.style.borderColor = '#ccc';
    });
    // 修改全局点击事件监听器
    document.removeEventListener('mousedown', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    makeDraggable(popup, toolbar, function () {
        if (isPinned) {
            chrome.storage.local.set({ popupPosition: { top: popup.style.top, left: popup.style.left } });
        }
    });
    // 新增: 阻止点击悬浮窗内部导致关闭
    popup.addEventListener('mousedown', function (e) {
        e.stopPropagation();
    });
}
// 新增: 更新置顶按钮状态的函数
function updatePinButtonState(button) {
    button.innerHTML = isPinned ? '📍' : '📌';
    button.style.cssText = `
        cursor: pointer;
        font-size: 16px;
        color: ${isPinned ? '#007bff' : '#666'};
        border: none;
        background-color: transparent;
        height: 30px;
        width: 30px;
        line-height: 30px;
        border-radius: 2px;
    `;
}
// 修改: 更新 togglePin 函数
function togglePin(button) {
    isPinned = !isPinned;
    updatePinButtonState(button);
    savePopupState();

    // 更新事件监听器
    document.removeEventListener('mousedown', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
}
// 新增: 保存悬浮窗位置的函数
function savePopupPosition() {
    if (currentPopup && isPinned) {
        chrome.storage.local.set({
            popupPosition: { top: currentPopup.style.top, left: currentPopup.style.left }
        });
    }
}
function updatePopupVisibility() {
    if (currentPopup) {
        currentPopup.style.display = 'block';
    }
}
// 新增: 保存悬浮窗状态的函数
function savePopupState() {
    chrome.storage.local.set({
        isPinned: isPinned,
        popupPosition: currentPopup ? { top: currentPopup.style.top, left: currentPopup.style.left } : null
    });
}

function centerPopup(popup) {
    const rect = popup.getBoundingClientRect();
    popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}
function makeDraggable(element, handle, callback) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if (callback) callback();
    }
}
// 执行搜索
function performSearch(searchText) {
    const defaultEngine = 'https://www.google.com/search?q=';
    const searchUrl = defaultEngine + encodeURIComponent(searchText);
    chrome.runtime.sendMessage({
        action: "setpage",
        query: searchUrl
    });
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "showPopup") {
        createSearchPopup();
    }
});
function onKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const searchText = event.target.value.trim();
        if (searchText) {
            performSearch(searchText);
            // 修改: 只在未钉住时关闭悬浮窗
            if (!isPinned) {
                closeSearchPopup();
            }
        }
    }
}
// 修改: 更新 closeSearchPopup 函数
function closeSearchPopup() {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
        document.removeEventListener('mousedown', handleOutsideClick);
        isPinned = false; // 重置置顶状态
        savePopupState();
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
// 在页面加载时检查是否有保存的位置和置顶状态
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['popupPosition', 'isPinned'], function (result) {
        isPinned = result.isPinned || false;
        if (result.popupPosition || isPinned) {
            createSearchPopup();
            if (result.popupPosition) {
                currentPopup.style.top = result.popupPosition.top;
                currentPopup.style.left = result.popupPosition.left;
            }
            const pinButton = currentPopup.querySelector('button');
            updatePinButtonState(pinButton);
        }
    });
});