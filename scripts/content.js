let searchPopup = {
    currentPopup: null,
    isPinned: false,
    selectedEngines: []
};
//输入框
function createSearchPopup() {
    if (!searchPopup.isPinned) {
        document.addEventListener('mousedown', handleOutsideClick);
    }
    if (searchPopup.currentPopup) {
        searchPopup.currentPopup.style.display = 'block';
        return;
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
    toolbar.style.padding = '0 10px';
    toolbar.style.height = '30px';
    toolbar.style.width = '100%';
    toolbar.style.cursor = 'move';
    // 创建置顶按钮
    const pinButton = document.createElement('button');
    pinButton.innerHTML = '📌';
    pinButton.style.cssText = `
        cursor: pointer;
        font-size: 16px;
        color: #666;
        border: none;
        background-color: transparent;
        height: 30px;
        width: 30px;
        line-height: 30px;
        border-radius: 2px;
    `;
    pinButton.onclick = togglePin;

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
    closeButton.style.marginRight = '0'; // 新增这行代码
    closeButton.style.borderRadius = '2px';
    closeButton.textContent = '×';
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
        searchPopup.isPinned = !searchPopup.isPinned;
        const pinButton = searchPopup.currentPopup.querySelector('button');
        pinButton.innerHTML = searchPopup.isPinned ? '📍' : '📌';
        pinButton.style.color = searchPopup.isPinned ? '#007bff' : '#666';

        chrome.storage.local.set({ 'isPinned': searchPopup.isPinned });

        if (searchPopup.isPinned) {
            chrome.storage.local.set({
                'popupPosition': {
                    top: searchPopup.currentPopup.style.top,
                    left: searchPopup.currentPopup.style.left
                }
            });
        } else {
            chrome.storage.local.remove('popupPosition');
        }

        // 更新事件监听器
        if (searchPopup.isPinned) {
            document.removeEventListener('mousedown', handleOutsideClick);
        } else {
            document.addEventListener('mousedown', handleOutsideClick);
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
    searchPopup.currentPopup = popup;
    currentPopup = popup;
    centerPopup(popup);

    // 5. 从存储中恢复固定状态和位置
    chrome.storage.local.get(['isPinned', 'popupPosition'], function (result) {
        if (result.isPinned) {
            searchPopup.isPinned = true;
            pinButton.innerHTML = '📍';
            pinButton.style.color = '#007bff';
            if (result.popupPosition) {
                popup.style.top = result.popupPosition.top;
                popup.style.left = result.popupPosition.left;
            } else {
                centerPopup(popup);
            }
        } else {
            centerPopup(popup);
        }
    });
    makeDraggable(popup, toolbar);
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

    document.addEventListener('mousedown', handleOutsideClick);
    function handleOutsideClick(e) {
        if (searchPopup.currentPopup && !searchPopup.isPinned && !searchPopup.currentPopup.contains(e.target)) {
            closeSearchPopup();
        }
    }
    makeDraggable(popup, toolbar, function () {
        if (isPinned) {
            chrome.storage.local.set({ popupPosition: { top: popup.style.top, left: popup.style.left } });
        }
    });
}
function centerPopup(popup) {
    const rect = popup.getBoundingClientRect();
    popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}
// 添加一个函数来处理页面加载时的弹窗恢复
function restorePopupOnLoad() {
    chrome.storage.local.get(['isPinned', 'popupPosition'], function (result) {
        if (result.isPinned) {
            createSearchPopup();
            if (result.popupPosition) {
                searchPopup.currentPopup.style.top = result.popupPosition.top;
                searchPopup.currentPopup.style.left = result.popupPosition.left;
            }
        }
    });
}

// 8. 修改拖拽功能，确保只应用于悬浮窗
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
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
        if (searchPopup.isPinned) {
            chrome.storage.local.set({
                'popupPosition': {
                    top: element.style.top,
                    left: element.style.left
                }
            });
        }
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
        }
    }
}
function closeSearchPopup() {
    if (searchPopup.currentPopup) {
        if (searchPopup.isPinned) {
            searchPopup.currentPopup.style.display = 'none';
        } else {
            document.body.removeChild(searchPopup.currentPopup);
            searchPopup.currentPopup = null;
        }
        searchPopup.isPinned = false;
        chrome.storage.local.remove(['isPinned', 'popupPosition']);
    }
}
document.addEventListener('keydown', handleKeyDown);

function handleKeyDown(e) {
    if (e.key === 'Escape' && searchPopup.currentPopup) {
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
document.addEventListener('DOMContentLoaded', restorePopupOnLoad);


