//contents.js

let currentPopup = null;
let searchEngines = []; // 存储搜索引擎列表的变量

// 接收来自options.js的搜索引擎列表
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'updateSearchEngines') {
        searchEngines = message.searchEngines;
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
// 在整个文档上绑定事件监听器
document.addEventListener('copy', function (event) {
    var selectedText = window.getSelection().toString().trim();
    var x = event.clientX;
    var y = event.clientY;

    if (selectedText.length > 0) {
        showSearchLinks(selectedText, x, y, currentEngine);
    }
}); function showSearchLinks(selectedText, x, y, currentEngine) {
    if (currentPopup) {
        document.body.removeChild(currentPopup);
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

    // 读取自定义搜索引擎信息
    chrome.storage.sync.get('websiteList', function (data) {
        if (data.websiteList) {
            data.websiteList.forEach(website => {
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
            });
        } else {
            console.error("No custom search engines found.");
        }
    });

    // 默认搜索引擎链接
    var engines = getEnginesByType(currentEngine);

    engines.forEach(engine => {
        var searchLink = createSearchLink(engine.name, engine.urlBase, selectedText);
        searchLinksContainer.appendChild(searchLink);
    });

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

    var searchLinkClose = createActionLink('关闭', function () {
        document.body.removeChild(popup);
        currentPopup = null;
    });
    searchLinksContainer.appendChild(searchLinkClose);

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
// 获取保存在扩展程序选项中的搜索选项数组
chrome.storage.sync.get("searchOptions", function (result) {
    var searchOptions = result.searchOptions;

    // 如果存在搜索选项，则创建对应的菜单项，并绑定点击事件处理逻辑
    if (searchOptions && Array.isArray(searchOptions) && searchOptions.length > 0) {
        var menuItems = [];

        for (var i = 0; i < searchOptions.length; i++) {
            var searchOption = searchOptions[i];

            // 创建菜单项
            var menuItem = {
                id: 'menuItem' + i,
                title: searchOption.name,
                onclick: createActionLink(searchOption.urlBase)
            };

            menuItems.push(menuItem);
        }

        // 注册菜单项
        for (var j = 0; j < menuItems.length; j++) {
            chrome.contextMenus.create(menuItems[j]);
        }
    }
});
// 监听鼠标弹起事件，以捕获用户选择的文本

document.addEventListener('mouseup', function (e) {
    var selection = window.getSelection();
    var target = e.target;
    if (!selection.isCollapsed) {
        var selectedText = selection.toString().trim();
        var x = e.clientX;
        var y = e.clientY;
        showSearchLinks(selectedText, x, y, 'baidu'); // 调用菜单弹出函数，并传入选中的文本和坐标信息
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === "performSearch") {
        // 更新侧边栏的iframe以显示百度搜索结果
        var iframe = document.getElementById("preview");
        if (iframe) {
            iframe.src = request.query;
        }
    }
});
chrome.runtime.onMessage.addListener(function (request) {
    if (request.action === 'updateMenuItems') {
        updateContextMenu(request.menuItems);
    }
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateMenu') {
        // 使用新数据更新菜单
        updateContextMenu(request.menuItems);
    }
});

function updateContextMenu(menuItems) {
    // 移除现有菜单项（如果需要）
    removeExistingMenuItems();

    // 创建并添加新的菜单项
    menuItems.forEach(function (item) {
        createMenuItem(item);
    });
}

function removeExistingMenuItems() {
    // 根据实际情况移除现有菜单项
}

function createMenuItem(item) {
    var link = document.createElement('a');
    link.textContent = item.name;
    link.href = item.url;
    link.style.color = 'white';
    link.style.padding = '5px 10px';
    link.style.cursor = 'pointer';
    link.style.backgroundColor = 'black';
    link.style.transition = 'background-color 0.3s';
    // 添加更多样式和事件监听器

    // 将链接添加到当前的搜索链接容器中
    var searchLinksContainer = document.getElementById('searchLinksContainer');
    searchLinksContainer.appendChild(link);
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'updateCustomSearchEngine') {
        // 更新内存中的自定义搜索引擎设置
        customSearchEngineName = request.customSearchEngineName;
        customSearchEngineUrlBase = request.customSearchEngineUrlBase;
    }
});