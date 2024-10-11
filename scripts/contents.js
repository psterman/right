// 在全局范围内添加这些变量
let currentPopup = null;
// 从存储中检索选中的搜索引擎
// 假设这是在 contents.js 中的现有代码
let selectedEngines = []; // 声明全局变量
let longPressEnabled = true;
let ctrlSelectEnabled = true;
let currentNotification = null; // 全局变量，用于跟踪当前显示的通知
let id2enginemap = {};// 在初始化函数中（例如 DOMContentLoaded 事件监听器中）添加
chrome.storage.sync.get('id2enginemap', function (result) {
    if (result.id2enginemap) {
        id2enginemap = result.id2enginemap;
        console.log('已加载 id2enginemap:', id2enginemap);
    }
});
let directionSearchEnabled = false;
let directionEngines = {};

chrome.storage.sync.get(['selectedEngines', 'directionSearchEnabled', 'directionEngines', 'id2enginemap'], function (result) {
    selectedEngines = result.selectedEngines || [];
    directionSearchEnabled = result.directionSearchEnabled || false;
    directionEngines = result.directionEngines || {};
    id2enginemap = result.id2enginemap || {};

    initializeSearch();
});
//更新background对应的searchengines-id2enginemap搜索引擎列表
function getIdToEngineMap(callback) {
    chrome.runtime.sendMessage({ action: "getIdToEngineMap" }, function (response) {
        if (response && response.id2enginemap) {
            callback(response.id2enginemap);
        }
    });
}

let selectedIndex = -1;
let engineItems = [];
function saveAISearchEngines() {
    chrome.storage.sync.set({ aiSearchEngines: aiSearchEngines }, function () {
        console.log('AI搜索引擎已保存:', aiSearchEngines);
    });
}
const aiSearchEngines = [
    { name: 'AI搜索', url: 'https://example.com/ai-search?q=%s' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/?q=%s' },
    { name: 'Devy', url: 'https://devy.ai/search?q=%s' },
    { name: '360AI搜索', url: 'https://ai.360.com/search?q=%s' },
    { name: 'ThinkAny', url: 'https://www.thinkany.ai/search?q=%s' },
    { name: '秘塔', url: 'https://metaso.cn/?q=%s' },
    { name: '开搜AI', url: 'https://kaiso.ai/?q=%s' },
    { name: 'WebPilot', url: 'https://www.webpilot.ai/search?q=%s' },
    { name: 'Consensus', url: 'https://consensus.app/search/?q=%s' },
    { name: 'YOU', url: 'https://you.com/search?q=%s' },
    { name: 'phind', url: 'https://www.phind.com/search?q=%s' }
];
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM内容已加载，准备保存AI搜索引擎');
    saveAISearchEngines();
});
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
        },
        {
            text: '切换侧边栏',
            icon: '◧',
            action: () => {
                chrome.runtime.sendMessage({ action: 'toggleSidePanel' }, (response) => {
                    if (response && response.success) {
                        // 更新图标或文本以反映侧边栏的新状态
                        this.text = response.isOpen ? '关闭侧边栏' : '打开侧边栏';
                        // 如果你想更新图标,也可以在这里更新
                    }
                });
            }
        },
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

        if (selectedText !== '') {
            showInputContextMenu(target, x, y);
        }
    } else if (!selection.isCollapsed) {
        selectedText = selection.toString().trim();
        if (selectedText) {
            showSearchLinks(selectedText, x, y, selectedEngines);
        }
    } else if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
}
function showSearchLinks(selectedText, x, y, currentEngine) {
    console.log('showSearchLinks called with:', { selectedText, x, y, currentEngine });

    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }

    var popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '2147483647';
    popup.style.borderRadius = '20px';
    popup.style.backgroundColor = 'black';
    popup.className = 'search-popup flex-container';
    popup.style.maxWidth = 'auto';
    popup.style.overflow = 'auto';

    var searchLinksContainer = document.createElement('div');
    searchLinksContainer.style.display = 'flex';
    searchLinksContainer.style.flexWrap = 'wrap';
    console.log('Before adding search engine links');
    // 默认搜索引擎链接
    var engines = getEnginesByType(currentEngine);
    console.log('Engines:', engines);
    engines = engines.filter(engine => selectedEngines.some(selected => selected.name === engine.name));
    console.log('Filtered engines:', engines);
    engines.forEach(engine => {
        var searchLink = createSearchLink(engine.name, engine.urlBase, selectedText);
        searchLinksContainer.appendChild(searchLink);
    });
    console.log('After adding search engine links');

    // 统一处理所有复选框状态和创建相应的功能链接
    chrome.storage.sync.get([
        'copyCheckbox', 'deleteCheckbox', 'jumpCheckbox', 'closeCheckbox',
        'refreshCheckbox', 'pasteCheckbox', 'downloadCheckbox', 'closesidepanelCheckbox',
        'savedPages'
    ], function (items) {
        console.log('Retrieved checkbox states:', items);
        const actions = [
            {
                id: 'copyCheckbox', text: '复制', action: () => {
                    console.log('Copy action triggered');
                    // 修改: 使用 navigator.clipboard.writeText() 来复制文本
                    navigator.clipboard.writeText(selectedText).then(() => {
                        console.log('文本已复制');
                        // 新增: 显示成功通知
                        showNotification('已复制到剪贴板');
                        removePopup();
                    }).catch(err => {
                        console.error('复制失败:', err);
                        // 新增: 显示失败通知
                        showNotification('复制失败，请重试', 3000);
                    });
                }
            },
            {
                id: 'deleteCheckbox', text: '删除选中文本', action: () => {
                    console.log('Delete action triggered');
                    // 实现删除逻辑
                    removePopup();
                }
            },
            {
                id: 'jumpCheckbox', text: '收藏', action: () => {
                    console.log('Jump action triggered');
                    // 实现收藏逻辑
                    removePopup();
                }
            },
            {
                id: 'closeCheckbox', text: '关闭', action: () => {
                    console.log('Close action triggered');
                    chrome.runtime.sendMessage({ action: "closeTab" }, () => {
                        removePopup();
                    });
                }
            },
            {
                id: 'refreshCheckbox', text: '刷新', action: () => {
                    console.log('Refresh action triggered');
                    removePopup();
                    setTimeout(() => {
                        location.reload();
                    }, 100);
                }
            },
            {
                id: 'pasteCheckbox', text: '粘贴', action: () => {
                    console.log('Paste action triggered');
                    // 实现粘贴逻辑
                    removePopup();
                }
            },
            {
                id: 'downloadCheckbox', text: '下载', action: () => {
                    console.log('Download action triggered');
                    // 实现下载逻辑
                    removePopup();
                }
            },
            {
                id: 'closesidepanelCheckbox', text: '开关', action: () => {
                    console.log('Toggle sidepanel action triggered');
                    // 实现开关侧边栏逻辑
                    removePopup();
                }
            }
        ];

        console.log('Before adding action links');
        actions.forEach(({ id, text, action }) => {
            console.log(`Checking ${id}: ${items[id]}`);
            if (items[id]) {
                console.log(`Creating action link for ${text}`);
                var actionLink = createActionLink(text, action);
                searchLinksContainer.appendChild(actionLink);
                console.log(`Added ${text} link to container`);
            }
        });
        console.log('After adding action links');
        console.log('Search links container content:', searchLinksContainer.innerHTML); // 新增：显示容器内容

        popup.appendChild(searchLinksContainer);
        document.body.appendChild(popup);
        currentPopup = popup;

        console.log('Popup added to body');
        console.log('Popup content:', popup.innerHTML); // 新增：显示整个弹出窗口的内容
        // 添加全局点击事件监听器来检查点击是否被捕获
        document.addEventListener('click', function globalClickHandler(e) {
            console.log('Global click event captured', e.target);
            // 移除这个监听器，以免影响其他功能
            document.removeEventListener('click', globalClickHandler);
        }, true);
        adjustPopupPosition(popup, x, y);
        console.log('Popup position adjusted');
    });
}


function removePopup() {
    console.log('Removing popup');
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
        console.log('Popup removed');
    } else {
        console.log('No popup to remove');
    }
}

function adjustPopupPosition(popup, x, y) {
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
// 在全局范围内添加这个函数
function showNotification(message, duration = 2000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(notification);

    // 淡入效果
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // 淡出并移除
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}
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
        const copyLink = createActionLink('复制', function () {
            console.log('Copy function called');
            // 复制逻辑
            navigator.clipboard.writeText(selectedText).then(() => {
                console.log('文本已复制');
                showNotification('已复制到剪贴板');
                removePopup();
            }).catch(err => {
                console.error('复制失败:', err);
                showNotification('复制失败，请重试', 3000);
            });
        });
        searchLinksContainer.appendChild(copyLink);
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
// 为所有输入框和文本区域添加事件监听
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('mouseup', handleTextSelection);
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
} function createActionLink(text, clickHandler) {
    console.log(`Creating action link: ${text}`);
    var link = document.createElement('div'); // 改为 div 元素
    link.textContent = text;
    link.style.cssText = `
        color: white;
        padding: 5px 10px;
        cursor: pointer;
        background-color: black;
        transition: background-color 0.3s;
        display: block;
        margin: 5px 0;
        text-decoration: none;
        position: relative;
        z-index: 2147483647;
        user-select: none;
    `;

    link.addEventListener('mouseover', function (e) {
        console.log(`Mouse over on ${text} link`);
        this.style.backgroundColor = 'rgb(37, 138, 252)';
        e.stopPropagation();
    });

    link.addEventListener('mouseout', function (e) {
        console.log(`Mouse out on ${text} link`);
        this.style.backgroundColor = 'black';
        e.stopPropagation();
    });

    function handleClick(event) {
        console.log(`Clicked/Mouse down on ${text} link`);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log('Before executing clickHandler for', text);
        try {
            clickHandler();
        } catch (error) {
            console.error(`Error in clickHandler for ${text}:`, error);
        }
        console.log('After executing clickHandler for', text);
        return false;
    }

    link.addEventListener('mousedown', handleClick);
    link.addEventListener('click', handleClick);

    console.log(`Action link created for ${text}`);
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




    // 添加一个函数来获取方向搜索引擎设置
    function getDirectionEngines(callback) {
        chrome.storage.sync.get('directionEngines', (data) => {
            callback(data.directionEngines || {});
        });
    }

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

    // 修改 dragover 函数
    function dragover(e) {
        if (bypass(e.target))
            return false;

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        const { x, y } = dragStartPoint;
        const newDirection = getDirection(x, y, e.clientX, e.clientY);

        if (newDirection && newDirection !== direction) {
            direction = newDirection;
            const selectedText = window.getSelection().toString().trim();

            // 新增: 检查是否为链接
            const isLink = e.dataTransfer.types.includes('text/uri-list');

            if (directionSearchEnabled) {
                if (isLink) {
                    // 如果是链接，显示固定的提示
                    showSearchNotification("在侧边栏打开链接", "", direction);
                } else if (directionEngines[`direction-${direction}`]) {
                    // 如果不是链接，保持原有的方向搜索逻辑
                    const engineName = directionEngines[`direction-${direction}`];
                    showSearchNotification(engineName, selectedText, direction);
                }
            }
        }

        return false;
    }
    // 添加 Esc 键监听器
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            removeDragNotification();
        }
    });

    // 显示搜索提示的函数
    function showSearchNotification(engineName, searchText, direction) {
        // 如果存在当前通知，先移除它
        if (currentNotification) {
            document.body.removeChild(currentNotification);
            currentNotification = null;
        }

        const notification = document.createElement('div');
        notification.id = 'drag-search-notification';
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        transition: opacity 0.3s ease-out;
        opacity: 0;
    `;

        // 修改: 根据是否为链接显示不同的提示内容
        if (engineName === "在侧边栏打开链接") {
            notification.innerHTML = `${engineName}，按Esc键取消。`;
        } else {
            notification.innerHTML = `将使用${engineName}搜索"<span style="color: red;">${searchText.substring(0, 50)}${searchText.length > 50 ? '...' : ''}</span>"，按Esc键取消。`;
        }

        document.body.appendChild(notification);

        // 设置当前通知
        currentNotification = notification;

        // 确保元素已经被添加到 DOM 中后设置不透明
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 0);
    }

    // 修改 removeDragNotification 函数
    function removeDragNotification() {
        if (currentNotification) {
            currentNotification.style.opacity = '0';
            setTimeout(() => {
                if (currentNotification && currentNotification.parentNode) {
                    document.body.removeChild(currentNotification);
                }
                currentNotification = null;
            }, 300); // 等待淡出动画完成
        }
    }

    // 添加 ESC 键监听器来移除通知
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            removeDragNotification();
        }
    });
    // 修改 drop 函数
    function drop(e) {
        if (bypass(e.target)) return false;

        // 立即移除提示
        removeDragNotification();

        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        console.log('拖拽事件触发');

        let isImage = false;
        let imageUrl = '';
        // 新增: 添加链接相关变量
        let isLink = false;
        let linkUrl = '';
        // 检查是否拖动的是图片文件或HTML
        if (e.dataTransfer.types.includes('text/html') && e.dataTransfer.getData('text/html').includes('<img')) {
            isImage = true;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = e.dataTransfer.getData('text/html');
            const imgElement = tempDiv.querySelector('img');
            if (imgElement) {
                imageUrl = imgElement.src || imgElement.currentSrc;
            }
            console.log('拖动数据中包含图片HTML');
        } else if (e.target.tagName.toLowerCase() === 'img') {
            isImage = true;
            imageUrl = e.target.src || e.target.currentSrc;
            console.log('拖动的是网页中的图片元素');
        }
        else if (e.dataTransfer.types.includes('text/uri-list')) {
            isLink = true;
            linkUrl = e.dataTransfer.getData('text/uri-list');
            console.log('拖动的是链接');
        }
        console.log('是否为图片:', isImage);
        console.log('图片URL:', imageUrl);
        // 新增: 输出链接相关信息
        console.log('是否为链接:', isLink);
        console.log('链接URL:', linkUrl);
        var dropData = e.dataTransfer.getData('text/plain');
        console.log('原始拖放数据 (dropData):', dropData);

        chrome.storage.sync.get(['directionSearchEnabled', 'directionEngines', 'id2enginemap'], function (result) {
            console.log('方向搜索启用状态:', result.directionSearchEnabled);
            console.log('方向搜索引擎设置:', result.directionEngines);
            console.log('id2enginemap:', result.id2enginemap);

            if (result.directionSearchEnabled !== true) {
                console.log('搜索功能已禁用，不执行任何搜索');
                return;
            }

            const dragDirection = direction;
            console.log('拖动方向:', dragDirection);

            let searchUrl;
            // 修改: 更新searchText的赋值逻辑，优先考虑链接
            let searchText = isImage ? imageUrl : (isLink ? linkUrl : dropData);
            console.log('搜索文本 (searchText):', searchText);

            if (isImage) {
                // 对于图片，使用默认的图片搜索引擎（这里假设使用百度图片）
                searchUrl = 'https://image.baidu.com/search/index?tn=baiduimage&word=' + encodeURIComponent(searchText);
                console.log('图片搜索URL:', searchUrl);
            } else if (isLink || linkUrl) {
                // 如果是链接，直接使用链接URL
                searchUrl = searchText;
                console.log('链接URL:', searchUrl);
            } else {
                // 对于普通文本，使用方向搜索
                const dragDirection = direction;
                console.log('拖动方向:', dragDirection);

                if (dragDirection && result.directionEngines[`direction-${dragDirection}`]) {
                    const engineName = result.directionEngines[`direction-${dragDirection}`];
                    console.log('执行方向搜索，使用引擎:', engineName);

                    let engineUrl = result.id2enginemap[engineName.toLowerCase()];

                    console.log('从 id2enginemap 获取的 URL:', engineUrl);

                    if (!engineUrl) {
                        console.log('在 id2enginemap 中未找到引擎 URL，使用默认搜索');
                        engineUrl = 'https://www.google.com/search?q=%s';
                    }

                    searchUrl = engineUrl.replace('%s', encodeURIComponent(searchText));
                } else {
                    console.log('执行默认文本搜索');
                    searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(searchText);
                }
            }

            console.log('最终使用的搜索URL:', searchUrl);

            // 执行搜索
            chrome.runtime.sendMessage({
                action: 'setpage',
                query: searchUrl,
                foreground: e.altKey
            }, function (response) {
                console.log('发送消息后的响应:', response);
            });
        });

        return false;
    }
    // 新增: 添加 dragend 事件监听器
    document.addEventListener('dragend', function (e) {
        removeDragNotification();
    });
    function normalizeUrl(url) {
        return url.replace(/^https?:\/\//, '').toLowerCase().replace(/\/$/, '');
    }
    // 添加一个监听器来接收来自 options.js 的更新
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.action === 'updateDirectionSearchSettings') {
            directionSearchEnabled = request.directionSearchEnabled;
            directionEngines = request.directionEngines;
            console.log('方向搜索设置已更新:', directionSearchEnabled, directionEngines);
        }
    });


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
    document.addEventListener('keydown', escListener);
    document.addEventListener('keydown', handleKeyNavigation);


    // 修改 popup 的样式
    popup.style.cssText = `
       position: fixed;
        left: 50%;
        top: 43%;
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
    // 修改 1: 添加 ESC 键监听器
    document.addEventListener('keydown', function escListener(e) {
        if (e.key === 'Escape') {
            closeSearchPopup();
            // 移除事件监听器，避免多次添加
            document.removeEventListener('keydown', escListener);
        }
    });
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
    `;
        item.addEventListener('click', () => performSearch(input.value.trim(), url));
        // 添加鼠标悬停效果
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
        });

        item.addEventListener('click', () => {
            const searchText = globalSearchInput.value.trim();
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
    const shouldShowEngineList = !showMultiMenu;
    input.type = 'text';
    input.placeholder = '输入搜索词...';
    input.value = initialText; // 新增: 设置初始文本
    globalSearchInput = input;
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

    // 修改 1: 更新输入框的键盘事件监听器
    input.addEventListener('keydown', function (e) {
        if (topEngineListContainer.style.display === 'block' || bottomEngineListContainer.style.display === 'block') {
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
    // 修改 3: 更新输入框的事件监听器
    input.addEventListener('input', function () {
        if (shouldShowEngineList) {
            updateEngineList();
        } else {
            // 在 24 宫格界面，不显示搜索引擎列表
            if (topEngineListContainer) topEngineListContainer.style.display = 'none';
            if (bottomEngineListContainer) bottomEngineListContainer.style.display = 'none';
        }
    });
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
    multiMenu1.style.marginBottom = '10px';
    multiMenu1.style.maxWidth = '400px';
    multiMenu1.style.minWidth = '300px';
    multiMenu1.style.marginTop = '0'; // 修改：确保没有顶部边距
    // 创建第二个12宫格菜单（13-24）
    const multiMenu2 = createMultiMenu(13, 24);
    multiMenu2.style.display = showMultiMenu ? 'grid' : 'none';
    multiMenu2.style.width = '100%';
    multiMenu2.style.maxWidth = '400px';
    multiMenu2.style.marginTop = '10px';
    multiMenu2.style.minWidth = '300px';
    multiMenu2.style.marginTop = '10px'; // 添加一些顶部边距
    loadEnginesIntoGrid(multiMenu1, multiMenu2);

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
    // 首先，定义 AI 搜索引擎列表（保持不变）

    // 修改 updateEngineList 函数
    function updateEngineList() {
        const searchText = input.value.trim();
        if (searchText && shouldShowEngineList) {
            chrome.storage.sync.get('id2enginemap', function (data) {
                const engines = data.id2enginemap || {};
                topEngineListContainer.innerHTML = '';
                bottomEngineListContainer.innerHTML = '';
                engineItems = [];

                // 填充普通搜索引擎列表（topEngineListContainer）
                const engineEntries = Object.entries(engines);
                const displayCount = Math.min(engineEntries.length, 10); // 可以调整显示的普通搜索引擎数量

                for (let i = 0; i < displayCount; i++) {
                    const [name, url] = engineEntries[i];
                    const item = createEngineItem(name, url);
                    topEngineListContainer.appendChild(item);
                    engineItems.push(item);
                }

                // 填充 AI 搜索引擎列表（bottomEngineListContainer）
                aiSearchEngines.forEach(engine => {
                    const item = createEngineItem(engine.name, engine.url);
                    bottomEngineListContainer.appendChild(item);
                    engineItems.push(item);
                });

                topEngineListContainer.style.display = 'block';
                bottomEngineListContainer.style.display = 'block';
                selectedIndex = -1;
            });
        } else {
            topEngineListContainer.style.display = 'none';
            bottomEngineListContainer.style.display = 'none';
            engineItems = [];
            selectedIndex = -1;
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
let globalSearchInput;
let currentSelectedIndex = -1;
function createMultiMenu(start, end) {
    const menu = document.createElement('div');
    menu.className = 'multi-menu';
    menu.style.cssText = `
            display: grid;
           display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background-color: #ccc;
        padding: 1px;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
        `;

    for (let i = start; i <= end; i++) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.style.cssText = `
           background-color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            color: #333;
            user-select: none;
            aspect-ratio: 1 / 1;
            padding: 5px;
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        item.setAttribute('data-index', i - 1);
        item.addEventListener('click', handleSearchClick);
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
        });
        menu.appendChild(item);
    }

    return menu;
}


// 修改: 加载搜索引擎到 multiMenu1 和 multiMenu2
function loadEnginesIntoGrid(multiMenu1, multiMenu2) {
    // 加载 AI 和综合搜索引擎到 multiMenu1
    const loadAIAndGeneralEngines = (menu) => {
        chrome.storage.sync.get(['searchengines'], function (data) {
            const engines = data.searchengines || {};
            const aiEngines = engines.ai || [];
            const generalEngines = engines.综合搜索 || [];
            const combinedEngines = [...aiEngines, ...generalEngines];
            const gridItems = menu.querySelectorAll('.grid-item');

            gridItems.forEach((item, index) => {
                if (index < combinedEngines.length) {
                    const engine = combinedEngines[index];
                    item.textContent = engine.name;
                    item.setAttribute('data-url', engine.url);
                    item.style.cursor = 'pointer';
                } else {
                    item.textContent = '';
                    item.removeAttribute('data-url');
                    item.style.cursor = 'default';
                    item.style.backgroundColor = 'transparent'; // 设置空格子为透明
                }
            });
        });
    };

    // 加载自定义搜索引擎到 multiMenu2
    const loadCustomEngines = (menu) => {
        chrome.storage.sync.get('id2enginemap', function (data) {
            const engines = data.id2enginemap || {};
            const engineEntries = Object.entries(engines);
            const gridItems = menu.querySelectorAll('.grid-item');

            gridItems.forEach((item, index) => {
                if (index < engineEntries.length) {
                    const [name, url] = engineEntries[index];
                    item.textContent = name;
                    item.setAttribute('data-url', url);
                    item.style.cursor = 'pointer';
                } else {
                    item.textContent = '';
                    item.removeAttribute('data-url');
                    item.style.cursor = 'default';
                    item.style.backgroundColor = 'transparent'; // 设置空格子为透明
                }
            });
        });
    };

    loadAIAndGeneralEngines(multiMenu1);
    loadCustomEngines(multiMenu2);
}
function handleSearchClick(event) {
    const searchText = globalSearchInput.value.trim();
    const engineurl = event.target.getAttribute('data-url');
    if (searchText && engineurl) {
        performSearch(searchText, engineurl);
    } else if (!searchText) {
        alert('请输入搜索关键词');
        globalSearchInput.focus();
    }
}

function highlightSelectedItem() {
    const allGridItems = document.querySelectorAll('.grid-item');
    allGridItems.forEach((item, index) => {
        if (index === currentSelectedIndex) {
            item.style.backgroundColor = '#e0e0e0';
            item.style.border = '2px solid #007bff';
        } else {
            item.style.backgroundColor = 'white';
            item.style.border = '1px solid #ccc';
        }
    });
}

function handleKeyNavigation(event) {
    const allGridItems = document.querySelectorAll('.grid-item');
    const totalItems = allGridItems.length;
    const columns = 4;

    switch (event.key) {
        case 'ArrowRight':
            currentSelectedIndex = (currentSelectedIndex + 1) % totalItems;
            break;
        case 'ArrowLeft':
            currentSelectedIndex = (currentSelectedIndex - 1 + totalItems) % totalItems;
            break;
        case 'ArrowDown':
            currentSelectedIndex = (currentSelectedIndex + columns) % totalItems;
            break;
        case 'ArrowUp':
            currentSelectedIndex = (currentSelectedIndex - columns + totalItems) % totalItems;
            break;
        case 'Enter':
            if (currentSelectedIndex !== -1) {
                allGridItems[currentSelectedIndex].click();
            }
            return;
        default:
            return;
    }

    event.preventDefault();
    highlightSelectedItem();
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
        document.removeEventListener('keydown', handleKeyNavigation);
        // 新增：移除 ESC 键监听器
        document.removeEventListener('keydown', escListener);
    }
}

// 新增：定义 escListener 函数
function escListener(e) {
    if (e.key === 'Escape') {
        closeSearchPopup();
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
// 添加键盘事件监听
document.addEventListener('keydown', handleKeyNavigation);
// 修改: 保留原有的键盘事件监听器
document.addEventListener('keydown', handleKeyDown);

// 修改鼠标事件处理函数
function handleMouseDown(e) {
    if (!longPressEnabled || e.button !== 0 || !e.ctrlKey) return;

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