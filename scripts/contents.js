// 添加悬浮图标
function addFloatingIcon() {
    let isSidebarOpen = false; // 跟踪侧边栏状态

    const floatingIcon = document.createElement('div');
    floatingIcon.id = 'extension-floating-icon';
    floatingIcon.innerHTML = '?';
    floatingIcon.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        right: 10px !important;
        width: 40px !important;
        height: 40px !important;
        background-color: rgba(0, 122, 255, 0.8) !important;
        color: white !important;
        border-radius: 50% !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-size: 20px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important;
        cursor: pointer !important;
        z-index: 2147483647 !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
        transition: background-color 0.3s ease !important;
    `;

    // 创建命令菜单
    const menu = document.createElement('div');
    menu.id = 'extension-floating-menu';
    menu.style.cssText = `
        position: fixed !important;
        right: 10px !important;
        background-color: rgba(255, 255, 255, 0.95) !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        display: none !important;
        z-index: 2147483646 !important;
        overflow: hidden !important;
        transition: opacity 0.3s ease, transform 0.3s ease !important;
        opacity: 0 !important;
        transform: scale(0.95) !important;
        padding: 5px 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important;
    `;

    const menuItems = [
        {
            text: '关闭图标',
            icon: '✕',
            action: () => {
                floatingIcon.style.display = 'none';
                menu.style.display = 'none';
            }
        },
        {
            text: '打开设置',
            icon: '⚙️',
            action: () => {
                chrome.runtime.sendMessage({ action: 'openOptionsPage' });
            }
        }, { text: '打开侧边栏', icon: '◧', action: () => chrome.runtime.sendMessage({ action: 'toggleSidePanel' }) },

        {
            text: '激活搜索',
            icon: '🔍',
            action: () => {
                if (typeof createSearchPopup === 'function') {
                    createSearchPopup();
                } else {
                    console.error('createSearchPopup function is not defined');
                }
            }
        }
    ];

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 10px 15px !important;
            cursor: pointer !important;
            white-space: nowrap !important;
            transition: background-color 0.2s ease !important;
            display: flex !important;
            align-items: center !important;
            font-size: 14px !important;
            color: #333 !important;
        `;

        const iconSpan = document.createElement('span');
        iconSpan.textContent = item.icon;
        iconSpan.style.cssText = `
            display: inline-flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: 20px !important;
            margin-right: 10px !important;
            font-size: 16px !important;
        `;

        const textSpan = document.createElement('span');
        textSpan.textContent = item.text;

        menuItem.appendChild(iconSpan);
        menuItem.appendChild(textSpan);

        menuItem.addEventListener('mouseover', () => {
            menuItem.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
        });
        menuItem.addEventListener('mouseout', () => {
            menuItem.style.backgroundColor = 'transparent';
        });
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            item.action();
            hideMenu();
        });
        menu.appendChild(menuItem);
    });

    document.body.appendChild(floatingIcon);
    document.body.appendChild(menu);

    function showMenu() {
        const iconRect = floatingIcon.getBoundingClientRect();
        menu.style.top = `${iconRect.bottom + 10}px`;
        menu.style.display = 'block';
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        });
    }

    function hideMenu() {
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.95)';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }

    // 切换侧边栏的函数
    function toggleSidebar() {
        if (isSidebarOpen) {
            chrome.runtime.sendMessage({ action: 'closeSidePanel' });
        } else {
            chrome.runtime.sendMessage({ action: 'openSidePanel' });
        }
        isSidebarOpen = !isSidebarOpen;
        updateIconAppearance();
    }

    // 更新图标外观以反映侧边栏状态
    function updateIconAppearance() {
        if (isSidebarOpen) {
            floatingIcon.style.backgroundColor = 'rgba(255, 59, 48, 0.8)'; // 红色表示打开
            floatingIcon.innerHTML = 'X';
        } else {
            floatingIcon.style.backgroundColor = 'rgba(0, 122, 255, 0.8)'; // 蓝色表示关闭
            floatingIcon.innerHTML = '?';
        }
    }

    // 点击图标时切换侧边栏
    floatingIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // 鼠标划过图标时显示菜单
    floatingIcon.addEventListener('mouseenter', showMenu);

    floatingIcon.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!menu.matches(':hover')) {
                hideMenu();
            }
        }, 50);
    });

    menu.addEventListener('mouseleave', () => {
        if (!floatingIcon.matches(':hover')) {
            hideMenu();
        }
    });

    // 监听来自背景脚本的消息，以同步侧边栏状态
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateSidebarState') {
            isSidebarOpen = request.isOpen;
            updateIconAppearance();
        }
    });
}

// 在页面加载完成后添加悬浮图标
document.addEventListener('DOMContentLoaded', addFloatingIcon);

// 为了确保在动态加载的页面上也能显示悬浮图标，我们可以使用 MutationObserver
const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('extension-floating-icon')) {
        addFloatingIcon();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
let currentPopup = null;
// 从存储中检索选中的搜索引擎
// 假设这是在 contents.js 中的现有代码
let selectedEngines = []; // 声明全局变量
let longPressEnabled = true;
let ctrlSelectEnabled = true;

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateSearchSettings') {
        longPressEnabled = request.settings.longPressEnabled;
        ctrlSelectEnabled = request.settings.ctrlSelectEnabled;
        console.log('Settings updated:', request.settings);
    }
});

// 当内容脚本首次加载时，请求当前设置
chrome.runtime.sendMessage({ action: 'getSettings' });
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



    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';
    popup.style.borderRadius = '20px';
    popup.style.backgroundColor = 'black';
    popup.className = 'search-popup flex-container';
    popup.style.padding = '0'; // 修改：移除内边距

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
                foreground: e.altKey ? true : false, // 如果按下 alt 键则在前台打开
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
function createSearchPopup(initialText = '', showMultiMenu = false) {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
    }
    const popup = document.createElement('div');
    // 修改 popup 的样式
    popup.style.cssText = `
       position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        width: 420px;
        max-height: 90vh;
        background: white;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 10px; // 添加内边距
        box-sizing: border-box; // 确保内边距不会增加总宽度
    `;
    popup.id = "searchPopup";

    // 新增：上方搜索引擎列表容器
    const topEngineListContainer = document.createElement('div');
    topEngineListContainer.style.cssText = `
        padding: 10px;
        border-bottom: 1px solid #ccc;
    `;
    popup.appendChild(topEngineListContainer);

    // 创建九宫格多功能菜单
    const multiMenu = createMultiMenu();
    multiMenu.style.display = showMultiMenu ? 'grid' : 'none';
    // 创建工具栏
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.alignItems = 'center';
    toolbar.style.padding = '5px';
    toolbar.style.backgroundColor = 'white'; // 修改：确保背景是白色
    toolbar.style.borderBottom = 'none'; // 移除底部边框
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
    engineList.style.borderTop = 'none'; // 移除顶部边框

    // 创建搜索引擎项目的函数
    function createEngineItem(name, url) {
        const item = document.createElement('div');
        item.textContent = name;
        item.style.cssText = `
            padding: 5px 10px;
            cursor: pointer;
            color: black;
            font-size: 14px;
            border-bottom: 1px solid #eee;
            height: 20px;
            line-height: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;
        item.addEventListener('mouseover', function () {
            this.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseout', function () {
            this.style.backgroundColor = 'transparent';
        });
        item.addEventListener('click', function () {
            performSearch(input.value.trim(), url);
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
        searchArea.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%; // 确保宽度为100%
        box-sizing: border-box; // 添加这一行
    `;
    // 新增: 创建输入框容器
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
        padding: 10px;
        display: flex;
        align-items: center;
        // 修改：添加固定定位
        position: sticky;
        top: 0;
        background: white;
        z-index: 1;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入搜索词...';
    input.value = initialText; // 新增: 设置初始文本
    input.style.cssText = `
        flex-grow: 1;
        height: 30px;
        border: 1px solid #ccc;
        border-right: none;
        border-radius: 4px 0 0 4px;
        padding: 0 10px;
        font-size: 14px;
        outline: none;
    `;
    input.value = initialText;
    // 新增: 创建清空按钮
    const clearButton = document.createElement('button');
    clearButton.innerHTML = '&#x2715;'; // 使用 ✕ 符号作为图标
    clearButton.style.position = 'absolute';
    clearButton.style.right = '105px'; // 修改: 调整位置，避免与搜索按钮重叠
    clearButton.style.top = '50%';
    clearButton.style.transform = 'translateY(-50%)';
    clearButton.style.border = 'none';
    clearButton.style.background = 'none';
    clearButton.style.cursor = 'pointer';
    clearButton.style.fontSize = '16px';
    clearButton.style.color = '#999';
    clearButton.style.padding = '0';
    clearButton.style.width = '20px';
    clearButton.style.height = '20px';
    clearButton.style.display = 'flex';
    clearButton.style.justifyContent = 'center';
    clearButton.style.alignItems = 'center';
    clearButton.style.visibility = 'hidden'; // 初始状态隐藏

    // 新增: 清空按钮点击事件
    clearButton.addEventListener('click', () => {
        input.value = '';
        input.focus();
        clearButton.style.visibility = 'hidden';
    });

    // 新增: 显示/隐藏清空按钮
    input.addEventListener('input', () => {
        clearButton.style.visibility = input.value ? 'visible' : 'hidden';
    });

    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.cssText = `
        height: 30px;
        width: 100px;
        font-size: 14px;
        background-color: #007bff;
        color: white;
        border: 1px solid #007bff;
        border-left: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
    `;

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


    // 创建第一个12宫格菜单（1-12）
    const multiMenu1 = createMultiMenu(1, 12);
    multiMenu1.style.display = showMultiMenu ? 'grid' : 'none';
    multiMenu1.style.width = '100%';
    multiMenu1.style.maxWidth = '400px';
    multiMenu1.style.minWidth = '300px';
    multiMenu1.style.marginTop = '0'; // 修改：确保没有顶部边距
    // 创建第二个12宫格菜单（13-24）
    const multiMenu2 = createMultiMenu(13, 24);
    multiMenu2.style.display = showMultiMenu ? 'grid' : 'none';
    multiMenu2.style.width = '100%';
    multiMenu2.style.maxWidth = '400px';
    multiMenu2.style.minWidth = '300px';
    multiMenu2.style.marginTop = '10px'; // 添加一些顶部边距
    searchArea.appendChild(multiMenu1);
    searchArea.appendChild(inputContainer);
    searchArea.appendChild(engineList);
    popup.appendChild(searchArea);
    searchArea.appendChild(multiMenu2);
    // 修改: 将输入框和搜索按钮添加到新的容器中
    inputContainer.appendChild(input);
    inputContainer.appendChild(clearButton);
    inputContainer.appendChild(searchButton);
    popup.appendChild(inputContainer);

    // 下方搜索引擎列表容器
    const bottomEngineListContainer = document.createElement('div');
    bottomEngineListContainer.style.cssText = `
         padding: 10px;
        border-top: 1px solid #ccc;
    `;
    popup.appendChild(bottomEngineListContainer);
    document.body.appendChild(popup);
    currentPopup = popup;
    // 修改 5: 添加 setTimeout 来重新计算初始位置
    setTimeout(() => {
        const rect = popup.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = rect.top + 'px';
        popup.style.transform = 'none';

        input.focus(); // 新增: 设置输入框焦点
        input.setSelectionRange(input.value.length, input.value.length); // 新增: 将光标移到文本末尾
    }, 0);
    //新增一个搜索列表
    const customEngineListContainer = document.createElement('div');
    customEngineListContainer.style.cssText = `
         width: 100%;
        background: white;
        border-top: 1px solid #ccc;
        max-height: 200px;
        overflow-y: auto;
        display: none;
    `;
    popup.appendChild(customEngineListContainer); // 将列表容器添加到 popup 而不是 inputContainer

    function updateEngineList() {
        const searchText = input.value.trim();
        if (searchText) {
            chrome.storage.sync.get('id2enginemap', function (data) {
                const engines = data.id2enginemap || {};
                topEngineListContainer.innerHTML = '';
                bottomEngineListContainer.innerHTML = '';

                const engineEntries = Object.entries(engines);
                const displayCount = Math.min(engineEntries.length, 10);

                for (let i = 0; i < displayCount; i++) {
                    const [name, url] = engineEntries[i];
                    const topItem = createEngineItem(name, url);
                    const bottomItem = createEngineItem(name, url);
                    topEngineListContainer.appendChild(topItem);
                    bottomEngineListContainer.appendChild(bottomItem);
                }

                topEngineListContainer.style.display = 'block';
                bottomEngineListContainer.style.display = 'block';
            });
        } else {
            topEngineListContainer.style.display = 'none';
            bottomEngineListContainer.style.display = 'none';
        }
    }
    function selectEngineItem(index) {
        if (index >= 0 && index < engineItems.length) {
            if (selectedIndex !== -1) {
                engineItems[selectedIndex].style.backgroundColor = 'transparent';
            }
            selectedIndex = index;
            engineItems[selectedIndex].style.backgroundColor = '#f0f0f0';
            engineItems[selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    input.addEventListener('keydown', function (e) {
        if (customEngineListContainer.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectEngineItem((selectedIndex + 1) % engineItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectEngineItem((selectedIndex - 1 + engineItems.length) % engineItems.length);
            } else if (e.key === 'Enter' && selectedIndex !== -1) {
                e.preventDefault();
                const selectedEngine = engineItems[selectedIndex];
                const engineName = selectedEngine.textContent;
                chrome.storage.sync.get('id2enginemap', function (data) {
                    const engineUrl = data.id2enginemap[engineName];
                    if (engineUrl) {
                        performSearch(input.value.trim(), engineUrl);
                    }
                });
            }
        }
    });
    input.addEventListener('input', updateEngineList);
    // 立即更新搜索引擎列表
    updateEngineList(topEngineListContainer, bottomEngineListContainer);


    // ... 其他代码 ...
}

function performSearch(searchText, engineUrl) {
    console.log('Performing search:', searchText, 'with engine:', engineUrl);
    const searchUrl = engineUrl.replace('%s', encodeURIComponent(searchText));
    console.log('Search URL:', searchUrl);
    chrome.runtime.sendMessage({
        action: "setpage",
        query: searchUrl
    }, function (response) {
        console.log('Response from background:', response);
    });
    closeSearchPopup();

    input.addEventListener('keypress', onKeyPress);
    document.addEventListener('keydown', onKeyDown);


}
function createMultiMenu(start, end) {
    const menu = document.createElement('div');
    menu.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            padding: 1px;
            background-color: #ccc;
            border-radius: 4px;
            margin-bottom: 10px;
            width: 100%;
            aspect-ratio: 4 / 3;
            box-sizing: border-box;
        `;

    for (let i = start; i <= end; i++) {
        const item = document.createElement('div');
        item.style.backgroundColor = 'white';
        item.style.display = 'flex';
        item.style.justifyContent = 'center';
        item.style.alignItems = 'center';
        item.style.cursor = 'pointer';
        item.style.fontSize = '14px';
        item.style.fontWeight = 'bold';
        item.style.color = '#333';
        item.style.userSelect = 'none';
        item.style.boxSizing = 'border-box';
        item.style.border = '1px solid #ccc';
        item.textContent = i.toString();
        item.onclick = () => {
            console.log(`功能 ${i} 被点击`);
            // 这里可以添加具体的功能实现
        };
        item.onmouseover = () => {
            item.style.backgroundColor = '#f0f0f0';
        };
        item.onmouseout = () => {
            item.style.backgroundColor = 'white';
        };
        menu.appendChild(item);
    }

    return menu;
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
document.addEventListener('keydown', handleKeyDown);

// 修改: 保留原有的键盘事件监听器
document.addEventListener('keydown', handleKeyDown);

// 修改鼠标事件处理函数
function handleMouseDown(e) {
    if (!longPressEnabled || e.button !== 0) return;

    isMouseDown = true;
    startX = e.clientX;
    startY = e.clientY;

    mouseDownTimer = setTimeout(() => {
        if (isMouseDown && !hasMovedBeyondThreshold(e)) {
            createSearchPopup('', e.altKey);
            e.preventDefault();
            e.stopPropagation();
        }
    }, LONG_PRESS_DURATION);
}

function handleMouseUp(e) {
    isMouseDown = false;
    clearTimeout(mouseDownTimer);

    if (ctrlSelectEnabled && e.ctrlKey) {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            createSearchPopup(selectedText, false);
            e.preventDefault();
            e.stopPropagation();
        }
    } else if (e.altKey) {
        createSearchPopup('', true);
        e.preventDefault();
        e.stopPropagation();
    }
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

let gridConfig = [];

chrome.storage.sync.get('gridConfig', function (result) {
    gridConfig = result.gridConfig || [];
    createGrid();
});

function createGrid() {
    const grid = document.createElement('div');
    grid.id = 'extension-24-grid';
    grid.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 5px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
  `;

    gridConfig.forEach((item, index) => {
        if (index < 24) {
            const cell = document.createElement('div');
            cell.textContent = item.name;
            cell.style.cssText = `
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f0f0f0;
        cursor: pointer;
      `;
            cell.addEventListener('click', () => executeGridAction(item));
            grid.appendChild(cell);
        }
    });

    // 如果配置项少于24个，用空白格子填充
    for (let i = gridConfig.length; i < 24; i++) {
        const cell = document.createElement('div');
        cell.style.cssText = `
      width: 50px;
      height: 50px;
      background-color: #f0f0f0;
    `;
        grid.appendChild(cell);
    }

    document.body.appendChild(grid);
}

function executeGridAction(item) {
    if (item.type === 'function') {
        try {
            new Function(item.action)();
        } catch (error) {
            console.error('执行函数时出错:', error);
        }
    } else if (item.type === 'url') {
        window.open(item.action, '_blank');
    }
}