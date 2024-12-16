// 在全局范围内添加这些变量
// 全局变量
let currentTab = 'write';
let currentPopup = null;
// 从存储中检索选中的搜索引擎
// 假设这是在 contents.js 中的现有代码
let selectedEngines = {
    top: [],
    bottom: []
};
let isPopupJustCreated = false;
let isFirstClickOutside = false;
let longPressEnabled = true;
let ctrlSelectEnabled = true;
let currentNotification = null; // 全局变量，用于跟踪当前显示的通知
let id2enginemap = {};// 在初始化函数中（例如 DOMContentLoaded 事件监听器中）添加
let engineItems = [];
let dragStartPoint = {};
let direction;

chrome.storage.sync.get('id2enginemap', function (result) {
    if (result.id2enginemap) {
        id2enginemap = result.id2enginemap;
        console.log('已加载 id2enginemap:', id2enginemap);
    }
});
let directionSearchEnabled = false;
let directionEngines = {};
let cursorStyleElement = null;
const actionTemplates = {
    'copy': '复制选中文本',
    'save': '保存选中文本',
    'refresh': '刷新页面',
    'sidepanel': '在侧边栏打开'
};
// 获取当前选择的光标
function getCurrentCursor() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('selectedCursor', (data) => {
            resolve(data.selectedCursor || 'default');
        });
    });
}

let lastCursorUrl = null; // 用于存储上一次应用的光标URL

function applyCursor() {
    getCurrentCursor().then(cursorUrl => {
        console.log('Applying cursor:', cursorUrl);

        if (cursorUrl !== lastCursorUrl) { // 只有在光标URL发生变化时才应用新的样式
            if (cursorUrl && cursorUrl !== 'default') {
                const css = `
                    body, body * {
                        cursor: url(${cursorUrl}), auto !important;
                    }
                `;
                console.log('Applying custom cursor style.');
                applyStyles(css);
            } else {
                console.log('Removing custom cursor style.');
                removeStyles();
            }
            lastCursorUrl = cursorUrl; // 更新上一次应用的光标URL
        } else {
            console.log('Cursor URL has not changed, no action taken.');
        }
    }).catch(error => {
        console.error('Error getting current cursor:', error);
    });
}

// 在重置光标的逻辑中，确保更新 lastCursorUrl
function resetCursor() {
    lastCursorUrl = null; // 重置 lastCursorUrl
    removeStyles(); // 移除自定义光标样式
    console.log('Cursor has been reset to default.');
}
// 应用样式
function applyStyles(css) {
    if (!cursorStyleElement) {
        cursorStyleElement = document.createElement('style');
        cursorStyleElement.id = 'custom-cursor-style';
        document.head.appendChild(cursorStyleElement);
    }
    cursorStyleElement.textContent = css;
}

// 移除样式
function removeStyles() {
    if (cursorStyleElement) {
        cursorStyleElement.remove();
        cursorStyleElement = null;
    }
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.selectedCursor) {
        console.log('Storage change detected:', changes.selectedCursor);
        applyCursor();
    }
});
// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'updateCursor':
            console.log('Update cursor command received.');
            applyCursor(); // 更新光标
            break;
        case 'resetCursor':
            console.log('Reset cursor command received.');
            resetCursor(); // 重置光标
            break;
        default:
            console.log('Unknown action:', request.action);
    }
});

// 初始应用光标
applyCursor();
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


const searchEngineIcons = []; // 存储所有搜索引擎图标的元素
function saveAISearchEngines() {
    chrome.storage.sync.set({ aiSearchEngines: aiSearchEngines }, function () {
        console.log('AI搜索引擎已保存:', aiSearchEngines);
    });
}
/* 
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
]; */
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM内容已加载，准备保存AI搜索引擎');
    saveAISearchEngines();
});
// 添加悬浮图标
function addFloatingIcon() {
    let isSidebarOpen = false; // 跟踪侧边栏状态

    const floatingIcon = document.createElement('div');
    floatingIcon.id = 'extension-floating-icon';
    // 使用更美观的图标
    floatingIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V20M4 12H20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
    `;// 添加悬停效果
    floatingIcon.addEventListener('mouseenter', () => {
        floatingIcon.style.backgroundColor = '#0056b3';
        floatingIcon.style.boxShadow = '-4px 4px 12px rgba(0,0,0,0.2)';
    });

    floatingIcon.addEventListener('mouseleave', () => {
        floatingIcon.style.backgroundColor = '#007AFF';
        floatingIcon.style.boxShadow = '-2px 2px 8px rgba(0,0,0,0.15)';
    });

    floatingIcon.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        right: 0 !important;
        width: 40px !important;
        height: 48px !important;
        background-color: #007AFF !important;
        color: white !important;
        border-radius: 12px 0 0 12px !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        font-size: 24px !important;
        font-weight: 500 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important;
        cursor: pointer !important;
        z-index: 2147483647 !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
        transition: background-color 0.3s ease !important;
         transform: translateY(-50%) !important;      // [修改] 确保初始就有这个transform

    `;

    // 创建命令菜单
    const menu = document.createElement('div');
    menu.id = 'extension-floating-menu';
    menu.style.cssText = `
   position: fixed !important;
        right: 48px !important;
        background-color: white !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        display: none !important;
        z-index: 2147483646 !important;
        overflow: hidden !important;
        transition: opacity 0.2s ease !important;    // [修改] 只对透明度添加过渡效果
        opacity: 1 !important;
        transform: translateY(-50%) !important;      // [修改] 固定transform
        padding: 4px 0 !important;
        border: 1px solid #E0E0E0 !important;
        min-width: 150px !important;
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
        padding: 8px 16px !important;
            cursor: pointer !important;
            white-space: nowrap !important;
            transition: background-color 0.2s ease !important;  // [修改] 只对背景色添加过渡效果
            display: flex !important;
            align-items: center !important;
            font-size: 13px !important;
            color: #333333 !important;
            background-color: white !important;
            font-weight: normal !important;
            line-height: 1.4 !important;
        `;
        // 修改悬停效果
        menuItem.addEventListener('mouseover', () => {
            menuItem.style.backgroundColor = '#F0F0F0';
        });

        menuItem.addEventListener('mouseout', () => {
            menuItem.style.backgroundColor = 'white';
        });
        const iconSpan = document.createElement('span');
        iconSpan.textContent = item.icon;
        iconSpan.style.cssText = `
              display: inline-flex !important;
        justify-content: center !important;
        align-items: center !important;
        width: 20px !important;                       // [修改] 减小图标区域
        margin-right: 8px !important;                 // [修改] 减小间距
        font-size: 14px !important;                   // [修改] 调整图标大小
        opacity: 0.7 !important;
        `;
        const textSpan = document.createElement('span');
        textSpan.textContent = item.text;

        menuItem.appendChild(iconSpan);
        menuItem.appendChild(textSpan);
        // 添加悬停效果
        floatingIcon.addEventListener('mouseenter', () => {
            floatingIcon.style.transform = 'translateY(-50%) translateX(-2px)';
            floatingIcon.style.backgroundColor = '#0056b3';
            floatingIcon.style.boxShadow = '-4px 4px 12px rgba(0,0,0,0.2)';
        });

        floatingIcon.addEventListener('mouseleave', () => {
            floatingIcon.style.transform = 'translateY(-50%)';
            floatingIcon.style.backgroundColor = '#007AFF';
            floatingIcon.style.boxShadow = '-2px 2px 8px rgba(0,0,0,0.15)';
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
        menu.style.top = `${iconRect.top}px`;  // [修改] 确保垂直对齐
        menu.style.display = 'block';
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(-50%)';  // [修改] 使用固定的transform
    }

    function hideMenu() {
        menu.style.opacity = '0';
        menu.style.display = 'none';
        menu.style.transform = 'translateY(-50%)';  // [修改] 保持相同的transform
    }
    // 步骤 9: 添加鼠标悬停视觉反馈
    floatingIcon.addEventListener('mouseenter', () => {
        floatingIcon.style.transform = 'translateY(-50%) translateX(-2px)';
        floatingIcon.style.backgroundColor = 'rgba(0, 122, 255, 0.9)';
    });

    floatingIcon.addEventListener('mouseleave', () => {
        floatingIcon.style.transform = 'translateY(-50%)';
        floatingIcon.style.backgroundColor = 'rgba(0, 122, 255, 0.8)';
    });
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
            floatingIcon.innerHTML = '+';
        }
    }
    // 移除重复的事件监听器，合并逻辑
    let isMenuVisible = false;

    floatingIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        isMenuVisible = !isMenuVisible;

        if (isMenuVisible) {
            showMenu();
        } else {
            hideMenu();
        }

        // 如果需要同时切换侧边栏，可以在这里调用
        // toggleSidebar();  // 建议移除这个功能，因为现在是用来显示菜单的
    });

    // 步骤 6: 添加点击外部关闭功能
    document.addEventListener('click', (e) => {
        if (isMenuVisible && !menu.contains(e.target) && !floatingIcon.contains(e.target)) {
            isMenuVisible = false;
            hideMenu();
        }
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
    applyCursor();
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
    //可控制弹搜开关
    const popupMenuToggle = document.getElementById('popupMenuToggle');

    // 从存储中获取开关状态
    chrome.storage.sync.get('popupMenuEnabled', function (data) {
        popupMenuToggle.checked = data.popupMenuEnabled || false;
    });

    // 监听开关状态变化
    popupMenuToggle.addEventListener('change', function () {
        const isEnabled = popupMenuToggle.checked;
        chrome.storage.sync.set({ popupMenuEnabled: isEnabled }, function () {
            console.log('Popup menu enabled:', isEnabled);
            // 发送消息给 content.js
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'togglePopupMenu', enabled: isEnabled });
                }
            });
        });
    });
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
        // 1. 更新全局变量
        selectedEngines = request.selectedEngines;
        console.log('搜索引擎更新:', selectedEngines);

        // 2. 如果当前有搜索框显示，更新显示
        if (currentPopup) {
            updateSearchEngineDisplay();
        }

        // 3. 如果当前有选中的文本，更新搜索链接
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            // 使用当前鼠标位置或存储的位置
            const position = {
                x: window.event ? window.event.clientX : lastMousePosition.x,
                y: window.event ? window.event.clientY : lastMousePosition.y
            };

            showSearchLinks(selectedText, position.x, position.y, selectedEngines);
        }

        // 4. 可选：发送响应确认更新完成
        if (sendResponse) {
            sendResponse({ success: true });
        }
    }
});

// 添加鼠标位置跟踪
let lastMousePosition = { x: 0, y: 0 };
document.addEventListener('mousemove', function (e) {
    lastMousePosition.x = e.clientX;
    lastMousePosition.y = e.clientY;
});
// 3. 添加更新搜索引擎显示的函数
function updateSearchEngineDisplay() {
    const topGrid = currentPopup.querySelector('.top-grid');
    const bottomGrid = currentPopup.querySelector('.bottom-grid');

    // 清空现有内容
    topGrid.innerHTML = '';
    bottomGrid.innerHTML = '';

    // 添加顶部引擎
    selectedEngines.top.forEach(engine => {
        const engineElement = createEngineElement(engine);
        topGrid.appendChild(engineElement);
    });

    // 添加底部引擎
    selectedEngines.bottom.forEach(engine => {
        const engineElement = createEngineElement(engine);
        bottomGrid.appendChild(engineElement);
    });
}
// 4. 创建引擎元素的辅助函数
function createEngineElement(engine) {
    const div = document.createElement('div');
    div.className = 'engine-item';
    div.textContent = engine.name;
    div.setAttribute('data-url', engine.url);
    div.setAttribute('data-type', engine.type);

    div.addEventListener('click', () => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            const searchUrl = engine.url.replace('%s', encodeURIComponent(selectedText));
            window.open(searchUrl, '_blank');
        }
    });

    return div;
}
// 5. 修改初始化加载代码
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get('selectedEngines', function (result) {
        if (result.selectedEngines) {
            selectedEngines = result.selectedEngines;
            console.log('已加载搜索引擎设置:', selectedEngines);
        }
    });
});
// 发送选中文本到后台脚本
function sendMessageToBackground(selectedText) {
    chrome.runtime.sendMessage({ msg: "setsearch", value: selectedText });
}

// 监听鼠标按下事件，点击页面任意位置关闭弹出菜单
document.addEventListener('mousedown', function (e) {
    if (currentPopup && !currentPopup.contains(e.target)) {
        if (!isFirstClickOutside) {
            // 这是第一次在弹窗外点击
            isFirstClickOutside = true;
        }
        // 不要在这里关闭弹窗
    } else if (currentPopup) {
        // 点击在弹窗内，重置标志
        isFirstClickOutside = false;
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
        if (selectedText && !e.ctrlKey && !e.altKey) {
            showSearchLinks(selectedText, x, y, selectedEngines);
        }
    }
}
// 新增: 添加这两个变量到文件顶部
let lastPopupTime = 0;
const POPUP_COOLDOWN = 2000; // 5秒冷却时间
let isPopupMenuEnabled = false;

// 初始化时从存储中获取状态
chrome.storage.sync.get('popupMenuEnabled', function (data) {
    isPopupMenuEnabled = data.popupMenuEnabled || false;
});

// 监听来自 options.js 的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'togglePopupMenu') {
        isPopupMenuEnabled = request.enabled;
        if (!isPopupMenuEnabled) {
            disablePopupMenu();
        }
    }
});

function enablePopupMenu() {
    console.log('Popup menu enabled');
    // 启用相关功能
}

function disablePopupMenu() {
    console.log('Popup menu disabled');
    // 禁用相关功能
    // 例如，移除当前显示的悬浮菜单
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
}
function showSearchLinks(selectedText, x, y, currentEngine) {
    if (!isPopupMenuEnabled) {
        console.log('Popup menu is disabled, not showing search links');
        return;
    }
    // 在创建新弹出菜单前，确保移除旧的
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }
    // 继续执行显示悬浮菜单的逻辑
    // 新增: 添加时间检查逻辑
    const currentTime = Date.now();
    if (currentTime - lastPopupTime < POPUP_COOLDOWN) {
        console.log('悬浮窗冷却中，请稍后再试');
        return; // 如果冷却时间未到，直接返回
    }

    console.log('showSearchLinks called with:', { selectedText, x, y, currentEngine });

    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
    }

    var popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.zIndex = '2147483647';
    popup.style.borderRadius = '18px'; // 调整圆角
    popup.className = 'search-popup flex-container';
    popup.style.overflow = 'hidden'; // 隐藏溢出内容
    popup.style.padding = '0px'; // 添加内边距

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
                id: 'deleteCheckbox', text: '翻译', action: () => {
                    console.log('Translate action triggered');
                    const translationUrl = `https://www.deepl.com/en/translator#en/zh-hant/${encodeURIComponent(selectedText)}`;
                    chrome.runtime.sendMessage({
                        action: 'setpage',
                        query: translationUrl,
                        openSidebar: true // 假设你想在侧边栏打开
                    }, (response) => {
                        if (response && response.success) {
                            console.log('Translation page opened in sidebar');
                        } else {
                            console.error('Failed to open translation page');
                        }
                        removePopup();
                    });
                }
            },
            {
                id: 'closeCheckbox', text: '转发', action: () => {
                    console.log('QR Code generation triggered');
                    const selectedText = window.getSelection().toString().trim();
                    const currentPageUrl = window.location.href;

                    if (selectedText || currentPageUrl) {
                        // 创建包含选中文本的URL
                        const textUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedText)}`;

                        // 创建包含当前页面URL的二维码
                        const pageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentPageUrl)}`;

                        // 创建一个HTML页面，其中包含两个二维码图片
                        const qrCodeHtml = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>二维码生成</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; }
                    .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                    h2 { color: #333; text-align: center; }
                    .qr-codes { display: flex; justify-content: space-around; flex-wrap: wrap; }
                    .qr-code { text-align: center; margin: 10px; }
                    img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
                    p { margin-top: 10px; font-size: 14px; color: #666; max-width: 200px; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>微信扫描二维码，转发到手机</h2>
                    <div class="qr-codes">
                        <div class="qr-code">
                            <img src="${textUrl}" alt="选中文本的二维码">
                            <p>选中的文本：${selectedText}</p>
                        </div>
                        <div class="qr-code">
                            <img src="${pageUrl}" alt="当前页面的二维码">
                            <p>当前页面链接：${currentPageUrl}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;

                        // 将HTML内容转换为Blob
                        const blob = new Blob([qrCodeHtml], { type: 'text/html;charset=utf-8' });
                        const blobUrl = URL.createObjectURL(blob);

                        // 使用setpage action在侧边栏中打开二维码页面
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: blobUrl,
                            openSidebar: true
                        }, (response) => {
                            if (response && response.success) {
                                console.log('QR Code page opened in sidebar');
                            } else {
                                console.error('Failed to open QR Code page');
                            }
                            removePopup();
                        });
                    } else {
                        console.log('No text selected and no page URL available');
                        showNotification('无法生成二维码，请选择文本或确保页面已加载');
                    }
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
                id: 'pasteCheckbox', text: '保存', action: () => {
                    console.log('Save record action triggered');
                    const selectedText = window.getSelection().toString().trim();
                    const currentUrl = window.location.href; // 获取当前页面的 URL

                    if (selectedText) {
                        chrome.storage.sync.get('savedRecords', function (data) {
                            const records = data.savedRecords || [];
                            records.push({
                                text: selectedText,
                                url: currentUrl, // 确保这里保存了 URL
                                timestamp: Date.now()
                            });
                            chrome.storage.sync.set({ savedRecords: records }, function () {
                                console.log('Record saved:', { text: selectedText, url: currentUrl });
                                showNotification('记录已保存');
                            });
                        });
                    } else {
                        console.log('No text selected');
                        showNotification('请先选择文本');
                    }
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
        document.addEventListener('keydown', function escListener(e) {
            if (e.key === 'Escape') {
                removePopup();
                // 移除事件监听器，避免多次添加
                document.removeEventListener('keydown', escListener);
            }
        });
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
        // 新增: 更新最后显示悬浮窗的时间
        lastPopupTime = currentTime;

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

// 添加全局键盘事件监听器
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        removePopup();
        console.log('Popup closed by ESC key');
    }
});
function removePopup() {
    console.log('Attempting to remove popup');
    if (currentPopup) {
        if (document.body.contains(currentPopup)) {
            try {
                document.body.removeChild(currentPopup);
                console.log('Popup successfully removed from DOM');
            } catch (error) {
                console.error('Error removing popup:', error);
            }
        } else {
            console.warn('Popup not found in DOM');
        }
        currentPopup = null;
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
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 999999;
        font-family: system-ui;
        animation: fadeInOut 2s ease-in-out;
    `;
    notification.textContent = message;

    // 移除旧的通知
    const oldNotification = document.querySelector('.drag-notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    notification.classList.add('drag-notification');
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
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
        }); removePopup();
        searchLinksContainer.appendChild(copyLink);
    }

    // 翻译
    if (showDelete) {
        var searchLinkTranslate = createActionLink('翻译', function () {
            console.log('Translate action triggered');
            const translationUrl = `https://www.deepl.com/en/translator#en/zh-hant/${encodeURIComponent(selectedText)}`;
            chrome.runtime.sendMessage({
                action: 'setpage',
                query: translationUrl,
                openSidebar: true // 假设你想在侧边栏打开
            }, (response) => {
                if (response && response.success) {
                    console.log('Translation page opened in sidebar');
                } else {
                    console.error('Failed to open translation page');
                }
                removePopup();
            });
        });
        searchLinksContainer.appendChild(searchLinkTranslate);
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
}
function createActionLink(text, clickHandler) {
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
        const dx = x2 - x1;  // X轴位移
        const dy = y2 - y1;  // Y轴位移

        // 移除阈值检查，直接计算方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平移动为主
            if (dx > 0) {
                if (dy > dx / 2) return 'right-down';
                if (dy < -dx / 2) return 'right-up';
                return 'right';
            } else {
                if (dy > -dx / 2) return 'left-down';
                if (dy < dx / 2) return 'left-up';
                return 'left';
            }
        } else {
            // 垂直移动为主
            if (dy > 0) {
                if (dx > dy / 2) return 'right-down';
                if (dx < -dy / 2) return 'left-down';
                return 'down';
            } else {
                if (dx > -dy / 2) return 'right-up';
                if (dx < dy / 2) return 'left-up';
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
        // 新增: 移除当前的搜索弹出菜单
        if (currentPopup) {
            document.body.removeChild(currentPopup);
            currentPopup = null;
        }

        // 新增: 移除当前的通知
        if (currentNotification) {
            document.body.removeChild(currentNotification);
            currentNotification = null;
        }
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

            // 检查方向搜索是否启用
            chrome.storage.sync.get('directionSearchEnabled', function (result) {
                if (!result.directionSearchEnabled) {
                    // 如果方向搜索被禁用，显示提示信息
                    showSearchNotification("请在设置中打开此方向搜索", "", direction);
                } else if (isLink) {
                    showSearchNotification("在侧边栏打开链接", "", direction);
                } else if (directionEngines[`direction-${direction}`]) {
                    const engineName = directionEngines[`direction-${direction}`];
                    showSearchNotification(engineName, selectedText, direction);
                }
            });
        }

        return false;
    }
    // 添加 Esc 键监听器
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            removeDragNotification();
        }
    });
    function showSearchNotification(engineName, searchText, direction) {
        if (currentNotification) {
            document.body.removeChild(currentNotification);
            currentNotification = null;
        }

        const notification = document.createElement('div');
        notification.id = 'drag-search-notification';

        // 设置圆环容器
        notification.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 255, 255, 0.5); // 添加半透明背景
        border: 6px solid rgba(0, 0, 0, 0.8);
        border-radius: 50%;
        z-index: 1;
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        pointer-events: none;
        opacity: 0.9;
    `;

        // 创建文本元素
        const textElement = document.createElement('div');
        textElement.style.cssText = `
        position: absolute;
        width: 100%;
        text-align: center;
        color: black;
        font-size: 14px;
        font-weight: bold;
        z-index: 12;
    `;
        textElement.textContent = engineName;

        // 创建SVG容器
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "112");
        svg.setAttribute("height", "112");
        svg.style.cssText = `
        position: absolute;
        left: -6px;
        top: -6px;
        z-index: 2;
    `;// 新增：创建圆环 ⬇️
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        ring.setAttribute("cx", "56");
        ring.setAttribute("cy", "56");
        ring.setAttribute("r", "50");
        ring.setAttribute("stroke", "rgba(0, 0, 0, 0.8)");
        ring.setAttribute("stroke-width", "6");
        ring.setAttribute("fill", "none");
        // 创建圆弧扇形路径
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        // 圆环和圆弧的参数
        const centerX = 56;
        const centerY = 56;
        const outerRadius = 56;  // 略小于圆环内径
        const innerRadius = 45;  // 圆弧的内径
        const arcAngle = 30;     // 圆弧扇形的角度（单侧）

        // 创建圆弧扇形路径函数
        function createArcPath(baseAngle) {
            const startAngle = baseAngle - arcAngle;
            const endAngle = baseAngle + arcAngle;

            const startOuterX = centerX + outerRadius * Math.cos(startAngle * Math.PI / 180);
            const startOuterY = centerY + outerRadius * Math.sin(startAngle * Math.PI / 180);
            const endOuterX = centerX + outerRadius * Math.cos(endAngle * Math.PI / 180);
            const endOuterY = centerY + outerRadius * Math.sin(endAngle * Math.PI / 180);

            const startInnerX = centerX + innerRadius * Math.cos(startAngle * Math.PI / 180);
            const startInnerY = centerY + innerRadius * Math.sin(startAngle * Math.PI / 180);
            const endInnerX = centerX + innerRadius * Math.cos(endAngle * Math.PI / 180);
            const endInnerY = centerY + innerRadius * Math.sin(endAngle * Math.PI / 180);

            return `
            M ${startOuterX},${startOuterY}
            A ${outerRadius},${outerRadius} 0 0 1 ${endOuterX},${endOuterY}
            L ${endInnerX},${endInnerY}
            A ${innerRadius},${innerRadius} 0 0 0 ${startInnerX},${startInnerY}
            Z
        `;
        }

        // 设置初始路径
        path.setAttribute("fill", "white");
        path.style.transition = "transform 0.3s ease-out";

        // 根据方向设置初始角度
        const directionAngles = {
            'left': 180,
            'right': 0,
            'up': 270,
            'down': 90,
            'left-up': 225,
            'right-up': 315,
            'left-down': 135,
            'right-down': 45
        };

        const initialAngle = directionAngles[direction] || 0;
        path.setAttribute("d", createArcPath(initialAngle));
        svg.appendChild(ring);     // 先添加圆环
        svg.appendChild(path);
        // 4. 更改元素添加顺序
        notification.appendChild(svg);           // 再添加 SVG
        notification.appendChild(textElement);    // 最后添加文本
        document.body.appendChild(notification);
        currentNotification = notification;

        // 添加过渡动画
        notification.style.transition = 'opacity 0.3s ease-in-out';
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        return path; // 返回路径元素以供后续更新
    }

    // 更新圆弧位置的函数
    function updateArcPosition(e) {
        if (currentNotification && dragStartPoint) {
            const path = currentNotification.querySelector('path');
            if (path) {
                const dx = e.clientX - dragStartPoint.x;
                const dy = e.clientY - dragStartPoint.y;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                // 更新圆弧路径
                path.setAttribute("d", createArcPath(angle));
            }
        }
    }

    // 在 dragover 事件中更新圆弧位置
    document.addEventListener('dragover', updateArcPosition);
    // 更新拖拽时的旋转逻辑
    document.addEventListener('dragover', function (e) {
        if (currentNotification && dragStartPoint) {
            const indicator = currentNotification.querySelector('div');
            if (indicator) {
                const dx = e.clientX - dragStartPoint.x;
                const dy = e.clientY - dragStartPoint.y;

                // 计算角度
                let angle = Math.atan2(dy, dx) * (180 / Math.PI);
                // 调整角度使三角形指向正确方向
                angle = angle - 90;
                if (angle < 0) angle += 360;

                // 应用旋转到三角形指示器
                indicator.style.transform = `rotate(${angle}deg)`;
            }
        }
    });
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
    function getNormalizedAction(actionName) {
        if (!actionName) return '';

        // 转换为小写并移除空格
        const normalized = actionName.toLowerCase().trim();

        // 扩展动作名称映射，确保包含所有可能的中文表述
        const actionMap = {
            '复制选中文本': 'copy',
            '复制': 'copy',
            'copy': 'copy',
            '选中文本保存到书签页面': 'save',
            '保存': 'save',
            'save': 'save',
            '收藏': 'save',
            '刷新页面': 'refresh',
            '刷新': 'refresh',
            'refresh': 'refresh',
            '在侧边栏打开': 'sidepanel',
            '侧边栏': 'sidepanel',
            'sidepanel': 'sidepanel',
            '二维码': 'qrcode',           // 新增
            'qrcode': 'qrcode'
        };

        // 添加调试日志
        console.log('Action name before normalization:', actionName);
        console.log('Normalized action:', actionMap[normalized] || normalized);

        return actionMap[normalized] || normalized;
    }
    // 修改 drop 函数
    function drop(e) {
        if (bypass(e.target)) return false;

        removeDragNotification();
        e.preventDefault();
        e.stopPropagation();

        // 检查拖拽内容类型
        let dropData = '';
        let isImage = false;
        let imageUrl = '';

        // 检查是否是图片文件
        if (e.dataTransfer.types.includes('Files')) {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                isImage = true;
                imageUrl = URL.createObjectURL(file);
                dropData = imageUrl;
            }
        }
        // 检查是否是HTML中的图片
        else if (e.dataTransfer.types.includes('text/html')) {
            const html = e.dataTransfer.getData('text/html');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const img = tempDiv.querySelector('img');
            if (img) {
                isImage = true;
                imageUrl = img.src;
                dropData = imageUrl;
            }
        }
        // [新增] 检查是否是blob URL的图片
        else {
            const textData = e.dataTransfer.getData('text/plain');
            if (textData.startsWith('blob:') || textData.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                isImage = true;
                imageUrl = textData;
                dropData = textData;
            } else {
                dropData = textData;
            }
        }
        // 如果不是图片,获取普通文本
        if (!isImage) {
            dropData = e.dataTransfer.getData('text/plain');
        }

        console.log('拖拽的内容:', dropData);
        console.log('是否为图片:', isImage);

        // 检查是否为链接
        const isLink = !isImage && (dropData.startsWith('http://') || dropData.startsWith('https://'));
        // 检查是否为文本
        const isText = !isImage && dropData && !isLink;

        chrome.storage.sync.get(['directionSearchEnabled', 'directionEngines'], function (result) {
            if (!result.directionSearchEnabled) {
                console.log('方向搜索已禁用');
                return;
            }

            const dragDirection = direction;
            const directionKey = `direction-${dragDirection}`;

            console.log('当前方向:', dragDirection);
            console.log('方向设置:', result.directionEngines);

            if (!dragDirection || !result.directionEngines || !result.directionEngines[directionKey]) {
                console.log('未找到对应方向的搜索引擎:', directionKey);
                return;
            }

            // 获取该方向配置的动作名称
            const actionName = result.directionEngines[directionKey];
            console.log('配置的动作:', actionName);

            // 标准化动作名称
            const normalizedAction = getNormalizedAction(actionName);
            console.log('标准化后的动作:', normalizedAction);

            // 如果是链接且动作是二维码，则改为在侧边栏打开
            if (isLink && normalizedAction === 'qrcode') {
                console.log('检测到链接，在侧边栏打开:', dropData);
                chrome.runtime.sendMessage({
                    action: 'setpage',
                    query: dropData,
                    foreground: false
                }, function (response) {
                    if (response && response.success) {
                        showNotification('已在侧边栏打开链接');
                    }
                });
                return;
            }

            // 根据标准化后的动作名称进行匹配
            switch (normalizedAction) {
                case 'refresh':
                    console.log('执行刷新操作');
                    try {
                        window.location.reload();
                        showNotification('页面刷新中...');
                    } catch (error) {
                        console.error('刷新失败:', error);
                        showNotification('刷新失败');
                    }
                    break;

                case 'copy':
                    // 如果是图片,复制图片URL
                    const textToCopy = isImage ? imageUrl : dropData;
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            showNotification(isImage ? '图片链接已复制' : '文本已复制');
                            console.log('已复制:', textToCopy);
                        })
                        .catch(err => {
                            console.error('复制失败:', err);
                            showNotification('复制失败');
                        });
                    break;

                case 'save':
                    chrome.storage.sync.get('savedRecords', function (data) {
                        const records = data.savedRecords || [];
                        records.push({
                            text: isImage ? '图片: ' + imageUrl : dropData,
                            timestamp: new Date().getTime(),
                            url: window.location.href,
                            isImage: isImage
                        });
                        chrome.storage.sync.set({ savedRecords: records }, () => {
                            showNotification(isImage ? '图片已保存' : '文本已保存');
                        });
                    });
                    break;
                case 'sidepanel':
                    console.log('Opening in sidepanel:', dropData);
                    chrome.runtime.sendMessage({
                        action: 'toggleSidePanel'
                    }, (response) => {
                        if (response && response.success) {
                            showNotification('已在侧边栏打开');
                        }
                    });
                    break;
                case 'qrcode':
                    console.log('Generating QR code for:', dropData);
                    let qrCodeHtml;

                    if (isImage) {
                        // 为图片生成特殊的二维码页面
                        qrCodeHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>图片二维码</title>
            <style>
                body { 
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                    background: #f5f5f5;
                }
                .qr-container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .preview-image {
                    max-width: 300px;
                    max-height: 300px;
                    margin: 10px auto;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .qr-image {
                    margin: 20px auto;
                    max-width: 200px;
                    height: auto;
                }
                .image-url {
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    word-break: break-all;
                    background: #fff;
                    text-align: left;
                    max-height: 60px;
                    overflow-y: auto;
                    font-size: 12px;
                    color: #666;
                }
                h3 {
                    color: #333;
                    margin: 15px 0;
                }
                .copy-button {
                    margin: 10px;
                    padding: 5px 15px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .copy-button:hover {
                    background: #45a049;
                }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <h3>图片预览</h3>
                <img class="preview-image" src="${imageUrl}" alt="Preview Image">
                <h3>图片链接二维码</h3>
                <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(imageUrl)}" alt="QR Code">
                <div class="image-url">
                    <p>图片链接: ${imageUrl}</p>
                </div>
                <button class="copy-button" onclick="navigator.clipboard.writeText('${imageUrl}').then(() => alert('图片链接已复制'))">
                    复制图片链接
                </button>
            </div>
        </body>
        </html>
        `;
                    } else if (isLink) {
                        // 为链接生成二维码页面
                        qrCodeHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>链接二维码</title>
            <style>
                body { 
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                    background: #f5f5f5;
                }
                .qr-container {
                    max-width: 400px;
                    margin: 20px auto;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .qr-image {
                    margin: 20px auto;
                    max-width: 200px;
                    height: auto;
                }
                .link-preview {
                    margin-top: 20px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    word-break: break-all;
                    background: #fff;
                    text-align: left;
                    max-height: 100px;
                    overflow-y: auto;
                    font-size: 14px;
                }
                h3 {
                    color: #333;
                    margin: 15px 0;
                }
                .copy-button {
                    margin: 10px;
                    padding: 5px 15px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .copy-button:hover {
                    background: #1976D2;
                }
                .visit-button {
                    margin: 10px;
                    padding: 5px 15px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
                .visit-button:hover {
                    background: #45a049;
                }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <h3>链接二维码</h3>
                <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dropData)}" alt="QR Code">
                <div class="link-preview">
                    <h3>链接预览:</h3>
                    <p>${dropData}</p>
                </div>
                <button class="copy-button" onclick="navigator.clipboard.writeText('${dropData}').then(() => alert('链接已复制'))">
                    复制链接
                </button>
                <a href="${dropData}" target="_blank" class="visit-button">访问链接</a>
            </div>
        </body>
        </html>
        `;
                    } else {
                        // 为普通文本生成二维码页面
                        qrCodeHtml = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>文本二维码</title>
            <style>
                body { 
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                    background: #f5f5f5;
                }
                .qr-container {
                    max-width: 300px;
                    margin: 20px auto;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .text-preview {
                    margin-top: 20px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    word-break: break-all;
                    background: #fff;
                    text-align: left;
                    max-height: 200px;
                    overflow-y: auto;
                }
                h3 {
                    color: #333;
                    margin-bottom: 10px;
                }
                .qr-image {
                    margin: 0 auto;
                    max-width: 200px;
                    height: auto;
                }
                .copy-button {
                    margin: 10px;
                    padding: 5px 15px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .copy-button:hover {
                    background: #1976D2;
                }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dropData)}" alt="QR Code">
                <div class="text-preview">
                    <h3>文本预览:</h3>
                    <p>${dropData}</p>
                </div>
                <button class="copy-button" onclick="navigator.clipboard.writeText('${dropData}').then(() => alert('文本已复制'))">
                    复制文本
                </button>
            </div>
        </body>
        </html>
        `;
                    }

                    try {
                        const blob = new Blob([qrCodeHtml], { type: 'text/html' });
                        const blobUrl = URL.createObjectURL(blob);

                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: blobUrl,
                            foreground: false
                        }, function (response) {
                            if (chrome.runtime.lastError) {
                                console.error('Runtime error:', chrome.runtime.lastError);
                                showNotification('二维码生成失败');
                                return;
                            }

                            if (response && response.ready) {
                                console.log('QR code page opened successfully');
                                let notificationText = isImage ? '图片二维码已生成' :
                                    isLink ? '链接二维码已生成' :
                                        '文本二维码已生成';
                                showNotification(notificationText);
                            } else {
                                console.error('Failed to open QR code page');
                                console.log('Response:', response);
                                showNotification('二维码生成失败');
                            }
                        });
                    } catch (error) {
                        console.error('Error generating QR code:', error);
                        showNotification('二维码生成失败');
                    }
                    break;

                default:
                    // 处理搜索引擎,根据内容类型传递不同的搜索内容
                    handleSearchEngine(actionName, dropData, e.altKey);
                    break;
            }
        });

        return false;
    }
    function handleSearchEngine(engineName, searchText, isAltPressed) {
        console.log('Handling search engine:', engineName, 'Search text:', searchText);

        // 从storage获取搜索引擎映射
        chrome.storage.sync.get(['id2enginemap'], function (result) {
            const engineMap = result.id2enginemap || {};
            console.log('Available engines:', engineMap);

            // 从用户配置中查找搜索引擎
            let matchedEngine = Object.values(engineMap).find(engine =>
            (typeof engine === 'object' && engine.name &&
                engine.name.toLowerCase() === engineName.toLowerCase())
            );

            // 如果没找到，但engineMap中有直接的URL映射
            if (!matchedEngine && engineMap[engineName.toLowerCase()]) {
                matchedEngine = {
                    name: engineName,
                    url: engineMap[engineName.toLowerCase()]
                };
            }

            if (!matchedEngine) {
                console.error('No URL template found for engine:', engineName);
                showNotification('未找到对应的搜索引擎');
                return;
            }

            console.log('Matched engine:', matchedEngine);

            // 替换搜索词并构建URL
            const searchUrl = matchedEngine.url.replace('%s', encodeURIComponent(searchText));
            console.log('Search URL:', searchUrl);

            if (isAltPressed) {
                chrome.runtime.sendMessage({
                    action: 'openInNewTab',
                    url: searchUrl,
                    active: false
                });
            } else {
                chrome.runtime.sendMessage({
                    action: 'setpage',
                    query: searchUrl,
                    foreground: false
                });
            }
        });
    }
    // 新增: 添加 dragend 事件监听器
    document.addEventListener('dragend', function (e) {
        removeDragNotification();
    });
    function initializeActionTemplates() {
        chrome.storage.sync.get('id2enginemap', function (result) {
            let id2enginemap = result.id2enginemap || {};

            // 添加功能模板
            Object.keys(actionTemplates).forEach(action => {
                id2enginemap[action] = action; // 使用action作为标识符
            });

            // 保存更新后的映射
            chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {
                console.log('功能模板已添加到id2enginemap');
            });
        });
    }

    // 在页面加载时初始化
    document.addEventListener('DOMContentLoaded', function () {
        initializeActionTemplates();
        // ... 其他初始化代码 ...
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
// 1. 修改全局变量定义



// 定义标签配置
const TAB_CONFIG = [
    { id: 'askai', text: '问AI', icon: '🤖', color: '#4CAF50' },  // 将第一项改为"问AI"
    { id: 'regularsearch', text: '搜索', icon: '🔍', color: '#2196F3' },  // 保持 id 不变
    { id: 'imagesearch', text: 'AI 搜图', icon: '🖼️', color: '#9C27B0' },
    { id: 'summary', text: '常用', icon: '📚', color: '#2E7D32' },
    /*  { id: 'music', text: '音乐生成', icon: '🎵', color: '#E91E63' },
     { id: 'solve', text: '解题答疑', icon: '❓', color: '#00BCD4' },
     { id: 'study', text: '学术搜索', icon: '📖', color: '#795548' }, */
    {
        id: 'more',
        text: '打开设置',
        icon: '⚙️', // 修改为齿轮图标
        color: '#607D8B',
        action: () => {
            // 发送消息给 background.js
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });

            // 关闭当前菜单
            if (currentPopup) {
                document.body.removeChild(currentPopup);
                currentPopup = null;
            }
        }
    }
];

// 定义工具按钮配置
const TOOL_CONFIG = [
    { icon: '📎', title: '附加文件' },
    { icon: '📷', title: '截图' },
    { icon: '✂️', title: '剪切' },
    { icon: '🎤', title: '语音输入' }
];


function createSearchPopup(initialText = '', showMultiMenu = false) {
    console.log('Creating search popup');
    if (currentPopup) {
        document.body.removeChild(currentPopup);
    }

    const popup = document.createElement('div');
    popup.id = "searchPopup";

    // 基础样式设置
    popup.style.cssText = `
        position: fixed;
        left: 50%;
        top: 43%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        width: 600px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 90vh;
    `;

    // 组装界面组件
    const tabBar = createTabBar();
    const searchArea = createSearchArea(initialText);
    const contentArea = createContentArea();
    const engineListContainer = createEngineListContainer();

    // 组装界面
    popup.appendChild(tabBar);
    popup.appendChild(searchArea);
    popup.appendChild(contentArea);
    popup.appendChild(engineListContainer);

    // 设置事件监听
    setupPopupEventListeners(popup);

    // 添加到文档
    document.body.appendChild(popup);
    currentPopup = popup;

    // 初始化
    initializePopup(popup, initialText);

    return popup;
}
function createAIEngineMenu(parentPopup) {
    const parentRect = parentPopup.getBoundingClientRect();

    const aiMenu = document.createElement('div');
    aiMenu.style.cssText = `
        position: fixed;
        left: ${parentRect.left}px;
        bottom: ${window.innerHeight - parentRect.top + 10}px;
        width: ${parentRect.width}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: ${parseInt(parentPopup.style.zIndex) + 1};
        padding: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `;

    // 添加加载提示
    const loadingTip = document.createElement('div');
    loadingTip.textContent = '加载中...';
    loadingTip.style.textAlign = 'center';
    loadingTip.style.width = '100%';
    aiMenu.appendChild(loadingTip);

    // 从 storage 获取数据
    chrome.storage.sync.get(['aiSearchEngines'], function (data) {
        console.log('Loaded engines:', data);
        aiMenu.innerHTML = '';

        const engines = data.aiSearchEngines || [];


        if (engines.length === 0) {
            const noDataMsg = document.createElement('div');
            noDataMsg.textContent = '请先在扩展设置中配置AI搜索引擎';
            noDataMsg.style.cssText = `
                width: 100%;
                text-align: center;
                padding: 10px;
                color: #666;
            `;
            aiMenu.appendChild(noDataMsg);
            return;
        }

        engines.forEach(engine => {
            if (engine.enabled) {
                const engineButton = document.createElement('div');
                engineButton.style.cssText = `
                    padding: 8px 16px;
                    background: #f5f6f7;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #333;
                    transition: all 0.3s;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                `;

                engineButton.innerHTML = `
                    <span style="font-size: 16px;">🤖</span>
                    <span>${engine.name}</span>
                `;

                engineButton.addEventListener('mouseover', () => {
                    engineButton.style.backgroundColor = '#e9ecef';
                });
                engineButton.addEventListener('mouseout', () => {
                    engineButton.style.backgroundColor = '#f5f6f7';
                });

                engineButton.addEventListener('click', () => {
                    const searchText = parentPopup.querySelector('input').value.trim();
                    if (searchText) {
                        const searchUrl = engine.url.replace('%s', encodeURIComponent(searchText));
                        // 修改: 使用 setpage 在侧边栏打开
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: searchUrl,
                            foreground: false // false 表示在侧边栏打开
                        }, function (response) {
                            console.log('发送消息后的响应:', response);
                        });

                        // 关闭搜索弹窗
                        if (currentPopup) {
                            document.body.removeChild(currentPopup);
                            currentPopup = null;
                        }
                    }
                });

                aiMenu.appendChild(engineButton);
            }
        });
    });

    document.body.appendChild(aiMenu);
    return aiMenu;
}
// 加载并显示启用的图片搜索引擎
function loadEnabledImageSearchEngines(menu) {
    chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
        const engines = data.multiMenu1Engines || [];
        // 只获取启用的引擎
        const enabledEngines = engines.filter(engine => engine.enabled !== false);

        // 清空现有菜单
        menu.innerHTML = '';

        // 创建网格布局容器
        const grid = document.createElement('div');
        grid.className = 'search-grid';

        // 添加启用的搜索引擎
        enabledEngines.forEach(engine => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.textContent = engine.name;
            item.setAttribute('data-url', engine.url);
            item.addEventListener('click', () => {
                const searchUrl = engine.url.replace('%s', encodeURIComponent(selectedText));
                window.open(searchUrl, '_blank');
            });
            grid.appendChild(item);
        });

        menu.appendChild(grid);
    });
}
function createAIMenu(parentPopup, engines) {
    const parentRect = parentPopup.getBoundingClientRect();

    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        left: ${parentRect.left}px;
        bottom: ${window.innerHeight - parentRect.top + 10}px;
        width: ${parentRect.width}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: ${parseInt(parentPopup.style.zIndex) + 1};
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
    `;

    engines.forEach(engine => {
        const engineButton = document.createElement('div');
        engineButton.style.cssText = `
            padding: 8px 16px;
            background: #f5f6f7;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            transition: all 0.3s;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        `;

        engineButton.innerHTML = `
            <span style="font-size: 16px;">🤖</span>
            <span>${engine.name}</span>
        `;

        engineButton.addEventListener('mouseover', () => {
            engineButton.style.backgroundColor = '#e9ecef';
        });
        engineButton.addEventListener('mouseout', () => {
            engineButton.style.backgroundColor = '#f5f6f7';
        });

        engineButton.addEventListener('click', () => {
            const searchText = parentPopup.querySelector('input').value.trim();
            if (searchText) {
                const searchUrl = engine.url.replace('%s', encodeURIComponent(searchText));
                chrome.runtime.sendMessage({
                    action: 'setpage',
                    query: searchUrl,
                    foreground: false // 在侧边栏打开
                });

                // 关闭搜索弹窗
                if (currentPopup) {
                    document.body.removeChild(currentPopup);
                    currentPopup = null;
                }
            } else {
                showNotification('请输入搜索内容', 2000);
            }
        });

        menu.appendChild(engineButton);
    });

    document.body.appendChild(menu);
    return menu;
}
function createRegularSearchMenu(parentPopup) {
    const parentRect = parentPopup.getBoundingClientRect();

    const regularMenu = document.createElement('div');
    regularMenu.style.cssText = `
        position: fixed;
        left: ${parentRect.left}px;
        bottom: ${window.innerHeight - parentRect.top + 10}px;
        width: ${parentRect.width}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: ${parseInt(parentPopup.style.zIndex) + 1};
        padding: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `;

    // 添加加载提示
    const loadingTip = document.createElement('div');
    loadingTip.textContent = '加载中...';
    loadingTip.style.textAlign = 'center';
    loadingTip.style.width = '100%';
    regularMenu.appendChild(loadingTip);

    // 从 storage 获取数据，只获取已启用的搜索引擎
    chrome.storage.sync.get(['regularSearchEngines'], function (data) {
        console.log('Loaded regular engines:', data);
        regularMenu.innerHTML = '';

        const engines = data.regularSearchEngines || [];
        // 只过滤出已启用的搜索引擎
        const enabledEngines = engines.filter(engine => engine.enabled);

        if (enabledEngines.length === 0) {
            const noDataMsg = document.createElement('div');
            noDataMsg.textContent = '请先在扩展设置中启用常规搜索引擎';
            noDataMsg.style.cssText = `
                width: 100%;
                text-align: center;
                padding: 10px;
                color: #666;
            `;
            regularMenu.appendChild(noDataMsg);
            return;
        }

        enabledEngines.forEach(engine => {
            if (engine.enabled) { // 额外检查确保只显示已启用的引擎
                const engineButton = document.createElement('div');
                engineButton.style.cssText = `
                    padding: 8px 16px;
                    background: #f5f6f7;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #333;
                    transition: all 0.3s;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                `;

                engineButton.innerHTML = `
                    <span style="font-size: 16px;">🔍</span>
                    <span>${engine.name}</span>
                `;

                engineButton.addEventListener('mouseover', () => {
                    engineButton.style.backgroundColor = '#e9ecef';
                });
                engineButton.addEventListener('mouseout', () => {
                    engineButton.style.backgroundColor = '#f5f6f7';
                });

                engineButton.addEventListener('click', () => {
                    const searchText = parentPopup.querySelector('input').value.trim();
                    if (searchText) {
                        const searchUrl = engine.url.replace('%s', encodeURIComponent(searchText));
                        // 修改: 使用 setpage 在侧边栏打开
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: searchUrl,
                            foreground: false // false 表示在侧边栏打开
                        }, function (response) {
                            console.log('发送消息后的响应:', response);
                        });

                        // 关闭搜索弹窗
                        if (currentPopup) {
                            document.body.removeChild(currentPopup);
                            currentPopup = null;
                        }
                    }
                });

                regularMenu.appendChild(engineButton);
            }
        });
    });

    document.body.appendChild(regularMenu);
    return regularMenu;
}
// [修改点 5] 新增通用函数
function createEngineButton(engine, parentPopup, menu) {
    const engineButton = document.createElement('div');
    // ... 按钮样式和事件处理代码 ...
    return engineButton;
}
// 添加消息监听器来接收更新
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateSearchEngines') {
        console.log('Received updated engines:', request.aiEngines);
        // 可以在这里更新本地缓存的引擎列表
    }
});
// 添加一个显示通知的辅助函数
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

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

function createTabBar() {
    const tabBar = document.createElement('div');
    tabBar.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px;
        gap: 8px;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
        overflow-x: auto;
        scrollbar-width: none;
    `;

    TAB_CONFIG.forEach(tab => {
        const tabElement = createTabElement(tab);

        // 为"问AI"和"搜索"标签添加特殊处理
        if (tab.id === 'imagesearch') {
            tabElement.addEventListener('click', () => {
                // 移除已存在的菜单
                const existingMenu = document.querySelector('.image-search-menu');
                if (existingMenu) {
                    document.body.removeChild(existingMenu);
                }

                // 创建图片搜索菜单
                const imageMenu = createImageSearchMenu(currentPopup);
                imageMenu.classList.add('image-search-menu');

                // 点击其他地方时关闭菜单
                const closeMenu = (e) => {
                    if (!imageMenu.contains(e.target) && !tabElement.contains(e.target)) {
                        document.body.removeChild(imageMenu);
                        document.removeEventListener('click', closeMenu);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            });
        }

        // 为阅读总结标签添加特殊处理
        if (tab.id === 'summary') {
            tabElement.addEventListener('click', () => {
                // 移除已存在的菜单
                const existingMenu = document.querySelector('.summary-menu');
                if (existingMenu) {
                    document.body.removeChild(existingMenu);
                }

                const summaryMenu = createSummaryMenu(currentPopup);
                summaryMenu.classList.add('summary-menu');

                // 点击其他地方时关闭菜单
                const closeMenu = (e) => {
                    if (!summaryMenu.contains(e.target) && !tabElement.contains(e.target)) {
                        document.body.removeChild(summaryMenu);
                        document.removeEventListener('click', closeMenu);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            });
        }
        if (tab.id === 'askai') {
            tabElement.addEventListener('click', () => {
                // 移除已存在的菜单
                const existingMenu = document.querySelector('.ai-engine-menu');
                if (existingMenu) {
                    document.body.removeChild(existingMenu);
                }

                const aiMenu = createAIEngineMenu(currentPopup);
                aiMenu.classList.add('ai-engine-menu');

                // 点击其他地方时关闭菜单
                const closeMenu = (e) => {
                    if (!aiMenu.contains(e.target) && !tabElement.contains(e.target)) {
                        document.body.removeChild(aiMenu);
                        document.removeEventListener('click', closeMenu);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            });
        } else if (tab.id === 'regularsearch') {
            tabElement.addEventListener('click', () => {
                // 移除已存在的菜单
                const existingMenu = document.querySelector('.regular-search-menu');
                if (existingMenu) {
                    document.body.removeChild(existingMenu);
                }

                const regularMenu = createRegularSearchMenu(currentPopup);
                regularMenu.classList.add('regular-search-menu');

                // 点击其他地方时关闭菜单
                const closeMenu = (e) => {
                    if (!regularMenu.contains(e.target) && !tabElement.contains(e.target)) {
                        document.body.removeChild(regularMenu);
                        document.removeEventListener('click', closeMenu);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeMenu);
                }, 0);
            });
        }

        tabBar.appendChild(tabElement);
    });

    return tabBar;
}
// 1. 添加缓存机制
let cachedEngines = {
    ai: null,
    regular: null,
    image: null,
    summary: null
};
// 创建阅读总结菜单的函数
function createSummaryMenu(parentPopup) {
    // 创建基础菜单结构
    const parentRect = parentPopup.getBoundingClientRect();
    const summaryMenu = document.createElement('div');
    summaryMenu.style.cssText = `
        position: fixed;
        left: ${parentRect.left}px;
        bottom: ${window.innerHeight - parentRect.top + 10}px;
        width: ${parentRect.width}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: ${parseInt(parentPopup.style.zIndex) + 1};
        padding: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `;

    // 检查是否有缓存数据
    if (cachedEngines.multiMenu1 || cachedEngines.ai || cachedEngines.regular) {
        // 使用缓存数据
        renderEngines(summaryMenu, [
            ...(cachedEngines.multiMenu1 || []),
            ...(cachedEngines.ai || []),
            ...(cachedEngines.regular || [])
        ], parentPopup);
    } else {
        // 显示加载提示
        const loadingTip = document.createElement('div');
        loadingTip.textContent = '加载中...';
        loadingTip.style.textAlign = 'center';
        loadingTip.style.width = '100%';
        summaryMenu.appendChild(loadingTip);

        // 加载数据
        chrome.storage.sync.get([
            'multiMenu1Engines',
            'aiSearchEngines',
            'regularSearchEngines'
        ], function (data) {
            // 更新缓存
            cachedEngines.multiMenu1 = (data.multiMenu1Engines || []).filter(engine => engine.enabled !== false);
            cachedEngines.ai = (data.aiSearchEngines || []).filter(engine => engine.enabled !== false);
            cachedEngines.regular = (data.regularSearchEngines || []).filter(engine => engine.enabled !== false);

            // 清除加载提示
            summaryMenu.innerHTML = '';

            // 渲染引擎按钮
            renderEngines(summaryMenu, [
                ...cachedEngines.multiMenu1,
                ...cachedEngines.ai,
                ...cachedEngines.regular
            ], parentPopup);
        });
    }

    document.body.appendChild(summaryMenu);
    return summaryMenu;
}

// 新增渲染引擎的辅助函数
function renderEngines(menu, engines, parentPopup) {
    // 使用 DocumentFragment 优化性能
    const fragment = document.createDocumentFragment();

    if (engines.length === 0) {
        const noDataMsg = document.createElement('div');
        noDataMsg.textContent = '请先在扩展设置中启用搜索引擎';
        noDataMsg.style.cssText = `
            width: 100%;
            text-align: center;
            padding: 10px;
            color: #666;
        `;
        fragment.appendChild(noDataMsg);
    } else {
        engines.forEach(engine => {
            const engineButton = createEngineButton(engine, parentPopup);
            fragment.appendChild(engineButton);
        });
    }

    menu.appendChild(fragment);
}

// 新增创建引擎按钮的辅助函数
function createEngineButton(engine, parentPopup) {
    const engineButton = document.createElement('div');
    engineButton.style.cssText = `
        padding: 8px 16px;
        background: #f5f6f7;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        color: #333;
        transition: all 0.3s;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    `;

    engineButton.innerHTML = `
        <span style="font-size: 16px;">📝</span>
        <span>${engine.name}</span>
    `;

    engineButton.addEventListener('mouseover', () => {
        engineButton.style.backgroundColor = '#e9ecef';
    });
    engineButton.addEventListener('mouseout', () => {
        engineButton.style.backgroundColor = '#f5f6f7';
    });

    engineButton.addEventListener('click', () => {
        const searchText = parentPopup.querySelector('input').value.trim();
        if (searchText) {
            const searchUrl = engine.url.replace('%s', encodeURIComponent(searchText));
            chrome.runtime.sendMessage({
                action: 'setpage',
                query: searchUrl,
                foreground: false
            });
            if (currentPopup) {
                document.body.removeChild(currentPopup);
                currentPopup = null;
            }
        } else {
            showNotification('请输入搜索内容', 2000);
        }
    });

    return engineButton;
}

// 添加预加载函数
function preloadEngineData() {
    chrome.storage.sync.get([
        'multiMenu1Engines',
        'aiSearchEngines',
        'regularSearchEngines'
    ], function (data) {
        cachedEngines.multiMenu1 = (data.multiMenu1Engines || []).filter(engine => engine.enabled !== false);
        cachedEngines.ai = (data.aiSearchEngines || []).filter(engine => engine.enabled !== false);
        cachedEngines.regular = (data.regularSearchEngines || []).filter(engine => engine.enabled !== false);
    });
}

// 在页面加载时预加载数据
document.addEventListener('DOMContentLoaded', preloadEngineData);

// 添加缓存更新监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateEngines') {
        preloadEngineData(); // 重新加载缓存数据
    }
});
// 添加创建图片搜索菜单的函数
function createImageSearchMenu(parentPopup) {
    const parentRect = parentPopup.getBoundingClientRect();
    const searchText = parentPopup.querySelector('input').value.trim();

    // 创建菜单容器
    const imageMenu = document.createElement('div');
    imageMenu.classList.add('image-menu');
    imageMenu.style.cssText = `
        position: fixed;
        left: ${parentRect.left}px;
        bottom: ${window.innerHeight - parentRect.top + 10}px;
        width: ${parentRect.width}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: ${parseInt(parentPopup.style.zIndex) + 1};
        padding: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    `;

    // 定义功能按钮
    const functionButtons = [
        { name: '复制', icon: '📋' },
        { name: '收藏', icon: '⭐' },
        { name: '刷新', icon: '🔄' },
        { name: '侧边栏', icon: '📑' },
        { name: '二维码', icon: '📱' }
    ];

    // 创建功能按钮
    functionButtons.forEach(button => {
        const buttonElement = document.createElement('div');
        buttonElement.style.cssText = `
            padding: 8px 16px;
            background: #f5f6f7;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            transition: all 0.3s;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        `;

        buttonElement.innerHTML = `
            <span style="font-size: 16px;">${button.icon}</span>
            <span>${button.name}</span>
        `;

        // 添加悬停效果
        buttonElement.addEventListener('mouseover', () => {
            buttonElement.style.backgroundColor = '#e9ecef';
        });
        buttonElement.addEventListener('mouseout', () => {
            buttonElement.style.backgroundColor = '#f5f6f7';
        });

        // 添加点击事件
        buttonElement.addEventListener('click', () => {
            switch (button.name) {
                case '复制':
                    if (searchText) {
                        navigator.clipboard.writeText(searchText)
                            .then(() => {
                                showNotification('已复制到剪贴板', 2000);
                                closePopups();
                            })
                            .catch(() => showNotification('复制失败', 2000));
                    } else {
                        showNotification('请输入要复制的内容', 2000);
                    }
                    break;

                case '收藏':
                  if (searchText) {
        chrome.storage.sync.get('savedRecords', function (data) {
            const records = data.savedRecords || [];
            records.push({
                text: searchText,
                timestamp: new Date().getTime(),
                url: window.location.href
            });
            chrome.storage.sync.set({ savedRecords: records }, () => {
                showNotification('已保存到书签页面', 2000);
                closePopups();
            });
        });
    } else {
        showNotification('请输入要保存的内容', 2000);
    }
    break;

                case '刷新':
                    try {
                        window.location.reload();
                        showNotification('页面刷新中...', 2000);
                        closePopups();
                    } catch (error) {
                        console.error('刷新失败:', error);
                        showNotification('刷新失败', 2000);
                    }
                    break;

                case '侧边栏':
                    chrome.runtime.sendMessage({
                        action: 'setpage',
                        query: window.location.href,
                        foreground: false
                    }, () => {
                        closePopups();
                    });
                    break;

                case '二维码':
                    if (searchText) {
                        console.log('Generating QR code for:', searchText);
                        let qrCodeHtml;

                        // 检查是否是链接
                        const isLink = searchText.startsWith('http://') || searchText.startsWith('https://');

                        if (isLink) {
                            // 为链接生成二维码页面
                            qrCodeHtml = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>链接二维码</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        text-align: center;
                        background: #f5f5f5;
                    }
                    .qr-container {
                        max-width: 400px;
                        margin: 20px auto;
                        padding: 20px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .qr-image {
                        margin: 20px auto;
                        max-width: 200px;
                        height: auto;
                    }
                    .link-preview {
                        margin-top: 20px;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        word-break: break-all;
                        background: #fff;
                        text-align: left;
                        max-height: 100px;
                        overflow-y: auto;
                        font-size: 14px;
                    }
                    h3 {
                        color: #333;
                        margin: 15px 0;
                    }
                    .copy-button {
                        margin: 10px;
                        padding: 5px 15px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .copy-button:hover {
                        background: #1976D2;
                    }
                    .visit-button {
                        margin: 10px;
                        padding: 5px 15px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                    }
                    .visit-button:hover {
                        background: #45a049;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <h3>链接二维码</h3>
                    <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(searchText)}" alt="QR Code">
                    <div class="link-preview">
                        <h3>链接预览:</h3>
                        <p>${searchText}</p>
                    </div>
                    <button class="copy-button" onclick="navigator.clipboard.writeText('${searchText}').then(() => alert('链接已复制'))">
                        复制链接
                    </button>
                    <a href="${searchText}" target="_blank" class="visit-button">访问链接</a>
                </div>
            </body>
            </html>`;
                        } else {
                            // 为普通文本生成二维码页面
                            qrCodeHtml = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>文本二维码</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        text-align: center;
                        background: #f5f5f5;
                    }
                    .qr-container {
                        max-width: 300px;
                        margin: 20px auto;
                        padding: 20px;
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .text-preview {
                        margin-top: 20px;
                        padding: 10px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        word-break: break-all;
                        background: #fff;
                        text-align: left;
                        max-height: 200px;
                        overflow-y: auto;
                    }
                    h3 {
                        color: #333;
                        margin-bottom: 10px;
                    }
                    .qr-image {
                        margin: 0 auto;
                        max-width: 200px;
                        height: auto;
                    }
                    .copy-button {
                        margin: 10px;
                        padding: 5px 15px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .copy-button:hover {
                        background: #1976D2;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(searchText)}" alt="QR Code">
                    <div class="text-preview">
                        <h3>文本预览:</h3>
                        <p>${searchText}</p>
                    </div>
                    <button class="copy-button" onclick="navigator.clipboard.writeText('${searchText}').then(() => alert('文本已复制'))">
                        复制文本
                    </button>
                </div>
            </body>
            </html>`;
                        }

                        try {
                            const blob = new Blob([qrCodeHtml], { type: 'text/html' });
                            const blobUrl = URL.createObjectURL(blob);

                            chrome.runtime.sendMessage({
                                action: 'setpage',
                                query: blobUrl,
                                foreground: false
                            }, function (response) {
                                if (chrome.runtime.lastError) {
                                    console.error('Runtime error:', chrome.runtime.lastError);
                                    showNotification('二维码生成失败');
                                    return;
                                }

                                if (response && response.success) {
                                    console.log('QR code page opened successfully');
                                    showNotification(isLink ? '链接二维码已生成' : '文本二维码已生成');
                                    closePopups();
                                } else {
                                    console.error('Failed to open QR code page');
                                    showNotification('二维码生成失败');
                                }
                            });
                        } catch (error) {
                            console.error('Error generating QR code:', error);
                            showNotification('二维码生成失败');
                        }
                    } else {
                        showNotification('请输入要生成二维码的内容', 2000);
                    }
                    break;
            }
        });

        imageMenu.appendChild(buttonElement);
    });

    // 添加到页面
    document.body.appendChild(imageMenu);

    // 点击其他区域关闭菜单
    const closeMenu = (e) => {
        if (!imageMenu.contains(e.target) && !parentPopup.contains(e.target)) {
            document.body.removeChild(imageMenu);
            document.removeEventListener('click', closeMenu);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);

    // 关闭所有弹出窗口的函数
    function closePopups() {
        if (currentPopup) {
            document.body.removeChild(currentPopup);
            currentPopup = null;
        }
        document.body.removeChild(imageMenu);
    }

    return imageMenu;
}
function createTabElement(tab) {
    const element = document.createElement('div');

    // 添加点击事件处理
    element.addEventListener('click', () => {
        if (tab.action) {
            tab.action();
        }
    });
    element.setAttribute('data-tab', tab.id);
    element.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 14px;
        color: #666;
        transition: all 0.3s;
        user-select: none;
        white-space: nowrap;
    `;

    element.innerHTML = `
        <span style="font-size: 16px;">${tab.icon}</span>
        <span>${tab.text}</span>
    `;

    element.addEventListener('mouseover', () => {
        element.style.backgroundColor = `${tab.color}22`;
    });
    element.addEventListener('mouseout', () => {
        element.style.backgroundColor = currentTab === tab.id ? `${tab.color}15` : 'transparent';
    });

    if (currentTab === tab.id) {
        element.style.backgroundColor = `${tab.color}15`;
        element.style.color = tab.color;
    }

    return element;
}

function createSearchArea(initialText) {
    const searchArea = document.createElement('div');
    searchArea.style.cssText = `
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        background: #f5f6f7;
        border-radius: 24px;
        padding: 8px 16px;
    `;

    const input = createSearchInput(initialText);
    const toolsContainer = createToolsContainer();

    inputContainer.appendChild(input);
    inputContainer.appendChild(toolsContainer);
    searchArea.appendChild(inputContainer);

    return searchArea;
}

function createContentArea() {
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
        display: none;  // 始终默认隐藏
        padding: 16px;
    `;
    contentArea.classList.add('content-area');
    return contentArea;
}

function createEngineListContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
        width: 100%;
        background: white;
        border-top: 1px solid #eee;
        max-height: 300px;
        overflow-y: auto;
        display: none;  // 始终默认隐藏
    `;
    return container;
}

function createSearchInput(initialText) {
    const input = document.createElement('input');
    input.style.cssText = `
        flex: 1;
        border: none;
        background: transparent;
        font-size: 14px;
        outline: none;
        padding: 0;
    `;
    input.placeholder = '搜索或输入问题...';
    input.value = initialText;

    input.addEventListener('input', handleSearchInput);
    input.addEventListener('keydown', handleInputKeydown);

    return input;
}

function createToolsContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        gap: 8px;
        margin-left: 8px;
    `;

    TOOL_CONFIG.forEach(tool => {
        container.appendChild(createToolButton(tool));
    });

    return container;
}

function createToolButton(tool) {
    const button = document.createElement('button');
    button.style.cssText = `
        border: none;
        background: none;
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
        border-radius: 50%;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
    `;

    button.innerHTML = tool.icon;
    button.title = tool.title;

    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#e9ecef';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'transparent';
    });

    return button;
}

function updateEngineList(searchText) {
    const container = currentPopup.querySelector('div:last-child');

    if (!searchText) {
        container.style.display = 'none';
        engineItems = [];
        return;
    }

    chrome.storage.sync.get(['id2enginemap', 'searchengines'], function (data) {
        const engines = data.id2enginemap || {};
        container.innerHTML = '';
        engineItems = [];

        // 添加普通搜索引擎
        Object.entries(engines).forEach(([name, url]) => {
            const item = createEngineItem(name, url);
            container.appendChild(item);
            engineItems.push(item);
        });

        // 添加 AI 搜索引擎
        const aiEngines = data.searchengines?.ai || [];
        aiEngines.forEach(engine => {
            const item = createEngineItem(engine.name, engine.url);
            container.appendChild(item);
            engineItems.push(item);
        });

        container.style.display = engineItems.length ? 'block' : 'none';
        selectedIndex = -1;
    });
}

function createEngineItem(name, url) {
    const item = document.createElement('div');
    item.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.3s;
    `;

    item.innerHTML = `
        <span style="color: #666;">🔍</span>
        <span>${name}</span>
    `;

    item.addEventListener('mouseover', () => {
        item.style.backgroundColor = '#f5f6f7';
    });

    item.addEventListener('mouseout', () => {
        item.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', () => {
        const input = currentPopup.querySelector('input');
        performSearch(input.value.trim(), url);
    });

    return item;
}

function setupPopupEventListeners(popup) {
    // 阻止冒泡
    popup.addEventListener('mousedown', e => e.stopPropagation());

    // 修改: 使用具名函数便于移除
    const escHandler = function (e) {
        if (e.key === 'Escape') {
            closeSearchPopup();
        }
    };

    // 修改: 使用具名函数便于移除
    const clickOutsideHandler = function (e) {
        if (popup && !popup.contains(e.target)) {
            closeSearchPopup();
        }
    };

    // 新增: 存储事件处理函数引用
    popup._eventHandlers = {
        escHandler,
        clickOutsideHandler
    };

    // 修改: 添加事件监听器
    document.addEventListener('keydown', escHandler);
    document.addEventListener('mousedown', clickOutsideHandler);
}

function handleSearchInput(e) {
    const searchText = e.target.value.trim();
    const contentArea = currentPopup.querySelector('.content-area');
    contentArea.style.display = 'none'; // 输入时始终隐藏内容区域

    // 只在 AI 搜索标签下更新搜索引擎列表
    if (currentTab === 'askai') {
        updateEngineList(searchText);
    }
}
function handleInputKeydown(e) {
    const container = currentPopup.querySelector('div:last-child');

    if (container.style.display === 'block') {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectEngineItem((selectedIndex + 1) % engineItems.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectEngineItem((selectedIndex - 1 + engineItems.length) % engineItems.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex !== -1) {
                    engineItems[selectedIndex].click();
                }
                break;
        }
    }
}

function selectEngineItem(index) {
    if (selectedIndex !== -1 && engineItems[selectedIndex]) {
        engineItems[selectedIndex].style.backgroundColor = 'transparent';
    }
    selectedIndex = index;
    if (engineItems[selectedIndex]) {
        engineItems[selectedIndex].style.backgroundColor = '#f5f6f7';
        engineItems[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

function closeSearchPopup() {
    console.log('Closing search popup');
    if (currentPopup) {
        // 移除弹窗相关的事件监听器
        if (currentPopup._eventHandlers) {
            document.removeEventListener('keydown', currentPopup._eventHandlers.escHandler);
            document.removeEventListener('mousedown', currentPopup._eventHandlers.clickOutsideHandler);
        }

        document.body.removeChild(currentPopup);
        currentPopup = null;
        isFirstClickOutside = false;
    }
    console.log('Search popup closed, currentPopup:', currentPopup);
}
function performSearch(searchText, engineUrl) {
    const searchUrl = engineUrl.replace('%s', encodeURIComponent(searchText));
    chrome.runtime.sendMessage({
        action: "setpage",
        query: searchUrl
    });
    closeSearchPopup();
}

function initializePopup(popup, initialText) {
    setTimeout(() => {
        const input = popup.querySelector('input');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        isPopupJustCreated = false;
    }, 100);
}

function switchTab(tabId) {
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
        const isSelected = tab.getAttribute('data-tab') === tabId;
        tab.style.backgroundColor = isSelected ? `${getTabColor(tabId)}15` : 'transparent';
        tab.style.color = isSelected ? getTabColor(tabId) : '#666';
    });
    currentTab = tabId;
    updateContentArea(tabId);
}

function getTabColor(tabId) {
    const tab = TAB_CONFIG.find(t => t.id === tabId);
    return tab ? tab.color : '#666';
}

function updateContentArea(tabId) {
    const contentArea = currentPopup.querySelector('div:nth-child(3)');
    // 根据不同标签显示不同内容
    switch (tabId) {
        case 'write':
            contentArea.innerHTML = '写作助手功能开发中...';
            break;
        case 'image':
            contentArea.innerHTML = '图像生成功能开发中...';
            break;
        // 可以根据需要添加其他标签的内容
        default:
            contentArea.innerHTML = '功能开发中...';
    }
    contentArea.style.display = 'block';
}

// 保留原有的拖拽相关函数
function dragstart(e) {
    if (bypass(e.target)) return false;
    dragStartPoint = { x: e.clientX, y: e.clientY };
    e.dataTransfer.effectAllowed = 'move';
}

function dragover(e) {
    if (bypass(e.target)) return false;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // 计算拖拽方向
    const dx = e.clientX - dragStartPoint.x;
    const dy = e.clientY - dragStartPoint.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    if (Math.abs(angle) <= 45) direction = 'right';
    else if (Math.abs(angle) >= 135) direction = 'left';
    else if (angle > 45 && angle < 135) direction = 'down';
    else direction = 'up';

    // 更新拖拽提示
    updateDragNotification(e);
    return false;
}

// 添加消息监听器
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "showPopup") {
        createSearchPopup();
    }
});

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
let isIconSwitchMode = false; // 标记是否处于图标切换模式

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
// 修改加载图片搜索引擎的逻辑
function loadImageSearchEngines() {
    chrome.storage.sync.get(['imageSearchEngines', 'forceUpdate'], function (data) {
        const engines = data.imageSearchEngines || [];
        console.log('加载的图片搜索引擎数量：', engines.length);

        // 如果引擎数量异常或强制更新标记为true，重新初始化
        if (engines.length < 5 || data.forceUpdate) {
            console.log('触发重新初始化图片搜索引擎');
            // 这里会触发 options.js 中的初始化逻辑
            chrome.runtime.sendMessage({ action: 'resetImageEngines' });
        }

        // 使用加载的引擎更新界面
        updateImageSearchUI(engines);
    });
}

// 更新界面显示
function updateImageSearchUI(engines) {
    // 这里添加你的UI更新逻辑
    console.log('可用的图片搜索引擎：', engines);
}

// 修改: 加载搜索引擎到 multiMenu1 和 multiMenu2
function loadEnginesIntoGrid(multiMenu1, multiMenu2) {
    // 加载 AI 和综合搜索引擎到 multiMenu1
    const loadAIAndRegularEngines = (menu) => {
        chrome.storage.sync.get(['searchengines'], function (data) {
            const engines = data.searchengines || {};
            const aiEngines = engines.ai || [];
            const regularEngines = engines.regularsearch || []; // 修改键名
            const combinedEngines = [...aiEngines, ...regularEngines];
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
                    item.style.backgroundColor = 'transparent';
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
    searchEngineIcons.forEach((item, index) => {
        if (index === currentSelectedIndex) {
            item.element.style.transform = 'scale(1.2)';
            item.element.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
        } else {
            item.element.style.transform = 'scale(1)';
            item.element.style.boxShadow = 'none';
        }
    });
}

function handleKeyNavigation(event) {
    // 检查事件目标是否是输入框
    const isInputFocused = document.activeElement.tagName.toLowerCase() === 'input';

    if (isInputFocused) {
        // 如果输入框有焦点，不做任何处理，允许默认行为
        return;
    }

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
// 添加防抖变量
let debounceTimer;

function handleGlobalMouseUp(e) {
    // 添加防抖机制
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        console.log('Debounced handleGlobalMouseUp called');

        // 新增：处理 Ctrl 选中文本的情况
        if (e.shiftKey) {
            const selectedText = window.getSelection().toString().trim();
            if (selectedText) {
                console.log('Ctrl + text selection, creating search popup');
                createSearchPopup(selectedText, e.altKey);
                return; // 创建弹窗后直接返回，不执行后续逻辑
            }
        }

        // 新增：处理普通文本选择
        handleTextSelection(e);

        if (isPopupJustCreated) {
            // 如果悬浮窗刚刚被创建，不做任何操作
            console.log('Popup just created, returning');
            isPopupJustCreated = false; // 新增：重置标志
            return;
        }

        if (currentPopup && !currentPopup.contains(e.target)) {
            console.log('Click outside popup'); // 新增：日志
            if (!isFirstClickOutside) {
                // 第一次在悬浮窗外释放鼠标，不做任何操作
                console.log('First click outside, setting isFirstClickOutside to true'); // 新增：日志
                isFirstClickOutside = true;
            } else {
                // 第二次在悬浮窗外释放鼠标，关闭悬浮窗
                console.log('Second click outside, closing popup'); // 新增：日志
                closeSearchPopup();
            }
        } else {
            // 新增：处理点击在弹窗内部的情况
            console.log('Click inside popup or no popup exists');
            isFirstClickOutside = false; // 重置标志
        }
    }, 50); // 50毫秒的延迟
}

// 修改事件监听器，使用捕获阶段
document.addEventListener('mouseup', handleGlobalMouseUp, true);

function closeSearchPopup() {
    console.log('Closing search popup');
    if (currentPopup) {
        document.body.removeChild(currentPopup);
        currentPopup = null;
        isFirstClickOutside = false;
    }
    console.log('Search popup closed, currentPopup:', currentPopup);
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


// 修改：使用mousedown而不是mouseup来触发搜索弹窗
function handleMouseDown(e) {
    console.log('Mouse down event triggered', {
        ctrlKey: e.ctrlKey,
        button: e.button,
        target: e.target
    });

    if (e.button !== 0) return;

    if (e.ctrlKey) {
        console.log('Ctrl + click detected, attempting to create popup');
        e.preventDefault();
        e.stopPropagation();

        // 确保在创建新弹窗前关闭旧弹窗
        if (currentPopup) {
            console.log('Closing existing popup before creating new one');
            closeSearchPopup();
        }

        // 延迟一帧创建新弹窗，确保清理完成
        requestAnimationFrame(() => {
            const selectedText = window.getSelection().toString().trim();
            console.log('Creating new popup with text:', selectedText);
            createSearchPopup(selectedText, e.altKey);
        });
    }
}


// 3. 确保事件监听器只添加一次，并使用正确的选项
function setupEventListeners() {
    // 移除可能存在的旧监听器
    document.removeEventListener('mousedown', handleMouseDown, true);

    // 添加新的监听器，使用捕获阶段
    document.addEventListener('mousedown', handleMouseDown, true);

    console.log('Event listeners set up');
}

// 4. 在页面加载时设置事件监听器
document.addEventListener('DOMContentLoaded', setupEventListeners);
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
