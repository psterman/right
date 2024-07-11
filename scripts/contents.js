
let currentPopup = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateSearchEngines') {
        // 这里处理接收到的搜索引擎更新
        console.log('Search engines updated in content script:', request.searchEngines);
        // 执行更新操作，例如更改页面上的搜索框行为
        updateSearchBehavior(request.searchEngines);
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
    } else if (!selection.isCollapsed) {
        selectedText = selection.toString().trim();
    }

    if (selectedText) {
        showSearchLinks(selectedText, x, y, 'baidu');
    } else {
        hideSearchLinks();
    }
}
function showSearchLinks(selectedText, x, y, currentEngine) {

    if (currentPopup) {
        document.body.removeChild(currentPopup);
    }

    // 读取用户勾选的复选框状态
    chrome.storage.sync.get('websiteList', function (data) {

        if (data.websiteList) {
            data.websiteList.forEach(function (website) {
                // 仅添加用户勾选的网站到搜索链接容器
                if (website.checked) {
                    var customSearchLink = createActionLink(website.name, function () {
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: website.url + encodeURIComponent(selectedText),
                            openSidebar: false
                        });
                        document.body.removeChild(popup);
                        currentPopup = null;
                    });
                    searchLinksContainer.appendChild(customSearchLink);
                }
            });
            
            // 读取复选框的状态
            chrome.storage.sync.get(['copyCheckbox', 'jumpCheckbox', 'closeCheckbox', 'screenshotCheckbox'], function (checkboxes) {
                var showCopy = checkboxes.copyCheckbox;
                var showJump = checkboxes.jumpCheckbox;
                var showClose = checkboxes.closeCheckbox;
                var showscreen = checkboxes.screenshotCheckbox;

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

                if (showJump) {
                    var openLinkInSidebar = createActionLink('跳转', function () {
                        chrome.runtime.sendMessage({
                            action: 'setpage',
                            query: selectedText,
                            openSidebar: true
                        });
                        document.body.removeChild(popup);
                        currentPopup = null;
                    });
                    searchLinksContainer.appendChild(openLinkInSidebar);
                }

                if (showClose) {
                    var searchLinkClose = createActionLink('关闭', function () {
                        document.body.removeChild(popup);
                        currentPopup = null;
                    });
                    searchLinksContainer.appendChild(searchLinkClose);
                }

                if (showscreen) {
                    var screenshotLink = createActionLink('截图', function () {
                        // 显示一个覆盖层或对话框来指导用户
                        showScreenshotInstructions();
                    });
                    searchLinksContainer.appendChild(screenshotLink);
                }

                function showScreenshotInstructions() {
                    // 创建一个覆盖层
                    var overlay = document.createElement('div');
                    overlay.id = 'screenshot-instructions-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.zIndex = '10000';
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // 半透明背景

                    // 创建截图指令的文本
                    var instructionsText = document.createElement('p');
                    var instructionMessage = '';
                    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
                        instructionMessage = '请按下 Command + Shift + 3 或 Command + Shift + 4 来截图。';
                    } else {
                        instructionMessage = '请按下 Print Screen 键来截图。';
                    }
                    instructionsText.innerText = instructionMessage;
                    instructionsText.style.position = 'fixed';
                    instructionsText.style.top = '48%';
                    instructionsText.style.left = '50%';
                    instructionsText.style.transform = 'translate(-50%, -50%)';
                    instructionsText.style.color = '#fff';
                    instructionsText.style.fontSize = '20px';

                    // 将指令文本添加到覆盖层
                    overlay.appendChild(instructionsText);

                    // 添加关闭按钮
                    var closeButton = document.createElement('button');
                    closeButton.innerText = '关闭';
                    closeButton.style.position = 'fixed';
                    closeButton.style.top = '50%';
                    closeButton.style.left = '50%';
                    closeButton.style.transform = 'translate(-50%, -50%)';
                    closeButton.style.zIndex = '10001'; // 高于覆盖层
                    closeButton.onclick = function () {
                        document.body.removeChild(overlay);
                        currentPopup = null;
                    };

                    // 将关闭按钮添加到覆盖层
                    overlay.appendChild(closeButton);

                    // 将覆盖层添加到文档体
                    document.body.appendChild(overlay);
                }

            });
        } else {
            console.error("No custom search engines found.");
        }
    });
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
}

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