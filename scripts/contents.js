let currentPopup = null;
let isPinned = false;

function createSearchPopup() {
    if (currentPopup) {
        currentPopup.style.display = 'block';
        centerPopup(currentPopup);
        return;
    }

    const popup = document.createElement('div');
    popup.id = "searchPopup";
    popup.style.cssText = `
        position: fixed;
        z-index: 10000;
        width: 300px;
        background: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
    `;

    const toolbar = createToolbar();
    const searchArea = createSearchArea();

    popup.appendChild(toolbar);
    popup.appendChild(searchArea);

    document.body.appendChild(popup);
    currentPopup = popup;
    centerPopup(popup);

    // 确保只有一个事件监听器
    document.removeEventListener('mousedown', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);

    makeDraggable(popup, toolbar);
}

function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px;
        height: 30px;
        width: 100%;
        cursor: move;
    `;

    const pinButton = createButton('📌', togglePin);
    const closeButton = createButton('×', closeSearchPopup);

    toolbar.appendChild(pinButton);
    toolbar.appendChild(closeButton);

    return toolbar;
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
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
    button.onclick = onClick;
    return button;
}

function createSearchArea() {
    const searchArea = document.createElement('div');
    searchArea.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
        width: 100%;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入搜索词...';
    input.style.cssText = `
        flex: 1;
        height: 30px;
        font-size: 14px;
        border: 1px solid #ccc;
        border-radius: 4px 0 0 4px;
        padding: 0 10px;
        box-sizing: border-box;
        color: black;
        background-color: white;
        outline: none;
    `;

    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.cssText = `
        height: 30px;
        width: 80px;
        font-size: 14px;
        background-color: #007bff;
        color: white;
        border: 1px solid #007bff;
        border-radius: 0 4px 4px 0;
        box-sizing: border-box;
    `;
    searchButton.onclick = () => {
        const searchText = input.value.trim();
        if (searchText) {
            performSearch(searchText);
        }
    };

    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchButton.click();
        }
    });

    searchArea.appendChild(input);
    searchArea.appendChild(searchButton);

    return searchArea;
}

function centerPopup(popup) {
    const rect = popup.getBoundingClientRect();
    popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}

function togglePin() {
    isPinned = !isPinned;
    const pinButton = currentPopup.querySelector('button');
    pinButton.textContent = isPinned ? '📍' : '📌';
    pinButton.style.color = isPinned ? '#007bff' : '#666';
}

function handleOutsideClick(e) {
    if (currentPopup && !isPinned && !currentPopup.contains(e.target)) {
        closeSearchPopup();
    }
}

function closeSearchPopup() {
    if (currentPopup) {
        currentPopup.style.display = 'none';
        isPinned = false;
        const pinButton = currentPopup.querySelector('button');
        pinButton.textContent = '📌';
        pinButton.style.color = '#666';
    }
}

function performSearch(searchText) {
    console.log('Searching for:', searchText);
    // 这里添加您的搜索逻辑
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "showPopup") {
        createSearchPopup();
    }
});

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.stopPropagation();
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
        element.style.top = `${element.offsetTop - pos2}px`;
        element.style.left = `${element.offsetLeft - pos1}px`;
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
//输入框
function createSearchPopup() {
    if (currentPopup) {
        currentPopup.style.display = 'block';
        centerPopup(currentPopup);
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
        isPinned = !isPinned;
        const pinButton = currentPopup.querySelector('button');
        if (isPinned) {
            pinButton.innerHTML = '📍';
            pinButton.style.color = '#007bff';
        } else {
            pinButton.innerHTML = '📌';
            pinButton.style.color = '#666';
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
}
function centerPopup(popup) {
    const rect = popup.getBoundingClientRect();
    popup.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    popup.style.top = `${(window.innerHeight - rect.height) / 2}px`;
}

function makeDraggable(element, handle) {
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
    if (currentPopup) {
        currentPopup.style.display = 'none';
        isPinned = false;
        const pinButton = currentPopup.querySelector('button');
        pinButton.innerHTML = '📌';
        pinButton.style.color = '#666';
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