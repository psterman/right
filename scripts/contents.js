
let currentPopup = null;
// 从存储中检索选中的搜索引擎
// 假设这是在 contents.js 中的现有代码
let selectedEngines = []; // 声明全局变量
// 当文档加载时从 Chrome 存储中加载 selectedEngines
document.addEventListener('DOMContentLoaded', function () {
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
            'Doubao': 'https://www.doubao.com/chat/',
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
    chrome.storage.sync.get(['copyCheckbox', 'deleteCheckbox', 'jumpCheckbox', 'closeCheckbox', 'refreshCheckbox', 'pasteCheckbox', 'downloadCheckbox'], function (checkboxes) {
        var showCopy = checkboxes.copyCheckbox;
        var showJump = checkboxes.jumpCheckbox;
        var showClose = checkboxes.closeCheckbox;
        var showRefresh = checkboxes.refreshCheckbox;
        var showPaste = checkboxes.pasteCheckbox;
        var showDownload = checkboxes.downloadCheckbox;
        var showDelete = checkboxes.deleteCheckbox;

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
            var openBookmarksInSidebar = createActionLink('侧边栏', function () {
                // 发送消息给后台脚本，指示需要在侧边栏打开书签列表
                chrome.runtime.sendMessage({
                    action: 'openBookmarksInSidebar',
                   
                    openSidebar: true,
                }, function (response) {
                    if (response && response.success) {
                        console.log("书签已在侧边栏打开");
                    } else {
                        console.error("无法在侧边栏打开书签");
                    }
                });
                document.body.removeChild(popup);
                currentPopup = null;
            });
            searchLinksContainer.appendChild(openBookmarksInSidebar);
        }

        if (showClose) {
            var searchLinkClose = createActionLink('关闭', function () {
                chrome.runtime.sendMessage({ action: "closeTab" });
            });
            searchLinksContainer.appendChild(searchLinkClose);
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
        if (showPaste) {
            // 创建粘贴链接
            var searchLinkPaste = createActionLink('刷新1', function () {
                // 先移除弹出菜单
                document.body.removeChild(popup);
                currentPopup = null;

                // 然后刷新当前页面
                window.location.reload();
            });
            searchLinksContainer.appendChild(searchLinkPaste);
        }
        if (showDownload) {
            var searchLinkDownload = createActionLink('刷新2', function () {
                // 先移除弹出菜单
                document.body.removeChild(popup);
                currentPopup = null;

                // 然后刷新当前页面
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
// 在输入框的 focus 事件中触发弹出菜单
inputElement.addEventListener('focus', function (e) {
    var x = e.clientX;
    var y = e.clientY;
    showInputContextMenu(inputElement, x, y);
});
//粘贴or清空点击后菜单消失
function hideInputContextMenu() {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
}
// contents.js

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'openSidebar') {
        // 使用 chrome.sidePanel.open 或其他逻辑来打开侧边栏
        chrome.sidePanel.open({
            url: request.url,
            windowId: sender.tab.windowId
        });
    }
});

