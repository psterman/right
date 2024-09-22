// 假设这个变量用于跟踪侧边栏的开关状态
let isSidePanelOpen = false;

if (typeof browser !== "undefined") {
	var qtest = browser.sidebarAction;
	if (typeof qtest !== "undefined") {
		browser.browserAction.onClicked.addListener(function () {
			browser.sidebarAction.toggle();
		});
	}
}
// Importing the constants
// eslint-disable-next-line no-undef
importScripts("constants.js");
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
chrome.runtime.onMessage.addListener(function request(request, sender, response) {
	// eye protection & autodim & shortcut
	switch (request.name) {
		case "bckreload":
			installation();
			break;
		case "sidepanelopen":
			response(!sender.documentId);
			break;
		case "getallpermissions":
			var result = "";
			chrome.permissions.getAll(function (permissions) {
				result = permissions.permissions;
				chrome.tabs.sendMessage(sender.tab.id, { text: "receiveallpermissions", value: result });
			});
			break;
		case "stefanbookmarkadd":
			// Permissions must be requested from inside a user gesture
			chrome.permissions.request({
				permissions: ["bookmarks"]
			}, function (granted) {
				// The callback argument will be true if the user granted the permissions.
				if (granted) {
					// todo send message back
				}
			});
			break;
	}
	return true;
});
//toggle-feature-openweb 复制当前主页到侧边栏
chrome.commands.onCommand.addListener(function (command) {
	if (command == "toggle-feature-openweb") {
		chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		}, function (tabs) {
			var tab = tabs[0];
			if (tab) {
				var currentpage = tab.url;
				chrome.sidePanel.open({ windowId: tab.windowId }, function () {
					setTimeout(function () {
						chrome.runtime.sendMessage({ msg: "setpage", value: currentpage });
					}, 500);
				});
			}
		});
	}
});
// contextMenus
function onClickHandler(info, tab) {
	if (info.menuItemId == "totlguideemenu") {
		chrome.tabs.create({ url: linkguide, active: true });
	} else if (info.menuItemId == "totldevelopmenu") {
		chrome.tabs.create({ url: linkdonate, active: true });
	} else if (info.menuItemId == "totlratemenu") {
		chrome.tabs.create({ url: writereview, active: true });
	} else if (info.menuItemId == "totlshareemail") {
		var sturnoffthelightemail = "mailto:your@email.com?subject=" + chrome.i18n.getMessage("sharetexta") + "&body=" + chrome.i18n.getMessage("sharetextb") + " " + linkproduct; chrome.tabs.create({ url: sturnoffthelightemail, active: true });
	} else if (info.menuItemId == "totlsharetwitter") {
		var slinkproductcodeurl = encodeURIComponent(chrome.i18n.getMessage("sharetextd") + " " + linkproduct); chrome.tabs.create({ url: "https://twitter.com/intent/tweet?text=" + slinkproductcodeurl, active: true });
	} else if (info.menuItemId == "totlsharefacebook") {
		chrome.tabs.create({ url: "https://www.facebook.com/sharer/sharer.php?u=" + linkproduct, active: true });
	} else if (info.menuItemId == "totlsubscribe") {
		chrome.tabs.create({ url: linkyoutube, active: true });
	} else if (info.menuItemId == "totlshareqq") {
		chrome.tabs.create({ url: "https://connect.qq.com/widget/shareqq/index.html?url=" + encodeURIComponent(linkproduct) + "&title=" + encodeURIComponent(chrome.i18n.getMessage("sharetextd")), active: true });
	} else if (info.menuItemId == "totlshareweibo") {
		chrome.tabs.create({ url: "https://service.weibo.com/share/share.php?url=" + linkproduct + "&title=" + encodeURIComponent(chrome.i18n.getMessage("sharetextd")), active: true });
	} else if (info.menuItemId == "totlsharevkontakte") {
		chrome.tabs.create({ url: "https://vk.com/share.php?url=" + linkproduct, active: true });
	} else if (info.menuItemId == "totlsharewhatsapp") {
		chrome.tabs.create({ url: "https://api.whatsapp.com/send?text=" + chrome.i18n.getMessage("sharetextd") + "%0a" + linkproduct, active: true });
	}
	else if (info.menuItemId == "totlsearchbaidu") {
		// 在侧边栏中打开百度搜索
		chrome.sidePanel.open({ windowId: tab.windowId }, function () {
			// 等待侧边栏打开后发送消息
			setTimeout(function () {
				sendMessageToBackground(info.selectionText);
			}, 500);
		});
		// 注册上下文菜单点击事件监听器
		chrome.contextMenus.onClicked.addListener(onClickHandler);
	} else if (info.menuItemId == "sppage") {
		chrome.tabs.query({
			active: true,
			lastFocusedWindow: true
		}, function (tabs) {
			var tab = tabs[0];
			if (tab) {
				var currentpage = tab.url;
				// console.log("currentpage= " + currentpage);
				chrome.sidePanel.open({ windowId: tab.windowId }, function () {
					// wait when panel is open, then send the message
					setTimeout(function () {
						chrome.runtime.sendMessage({ msg: "setpage", value: currentpage });
					}, 500);
				});
			}
		});
	} else if (info.menuItemId == "snpage") {
		var selectedlink = info.linkUrl;
		// console.log("selectedlink= " + selectedlink);
		chrome.sidePanel.open({ windowId: tab.windowId }, function () {
			// wait when panel is open, then send the message
			setTimeout(function () {
				chrome.runtime.sendMessage({ msg: "setpage", value: selectedlink });
			}, 500);
		});
	} else if (info.menuItemId == "slpage") {
		var searchquery = info.selectionText;
		// console.log("searchquery= " + searchquery);
		chrome.sidePanel.open({ windowId: tab.windowId }, function () {
			// wait when panel is open, then send the message
			setTimeout(function () {
				chrome.runtime.sendMessage({ msg: "setsearch", value: searchquery });
			}, 50);
		});
	}
	else if (info.menuItemId == "totlsearchbaidu") {
		var searchQuery = info.selectionText;
		chrome.runtime.sendMessage({ msg: "setsearch", value: searchQuery });
	}
}
// check to remove all contextmenus
if (chrome.contextMenus) {
	chrome.contextMenus.removeAll(function () {
		// console.log("contextMenus.removeAll callback");
	});
}
var sharemenusharetitle = chrome.i18n.getMessage("sharemenusharetitle");
var sharemenuwelcomeguidetitle = chrome.i18n.getMessage("sharemenuwelcomeguidetitle");
var sharemenutellafriend = chrome.i18n.getMessage("sharemenutellafriend");
var sharemenupostonx = chrome.i18n.getMessage("sharemenupostonx");
var sharemenupostonfacebook = chrome.i18n.getMessage("sharemenupostonfacebook");
var sharemenuratetitle = chrome.i18n.getMessage("sharemenuratetitle");
var sharemenudonatetitle = chrome.i18n.getMessage("sharemenudonatetitle");
var sharemenusubscribetitle = chrome.i18n.getMessage("desremyoutube");
var sharemenupostonweibo = chrome.i18n.getMessage("sharemenupostonweibo");
var sharemenupostonvkontakte = chrome.i18n.getMessage("sharemenupostonvkontakte");
var sharemenupostonwhatsapp = chrome.i18n.getMessage("sharemenupostonwhatsapp");
var sharemenupostonqq = chrome.i18n.getMessage("sharemenupostonqq");
function browsercontext(a, b, c, d) {
	var item = { "title": a, "type": "normal", "id": b, "contexts": contexts };
	var newitem;
	if (d != "") {
		item = Object.assign({}, item, { parentId: d });
	}
	if (c != "") {
		newitem = Object.assign({}, item, { icons: c });
	}
	try {
		// try show web browsers that do support "icons"
		// Firefox, Opera, Microsoft Edge
		return chrome.contextMenus.create(newitem);
	} catch (e) {
		// catch web browsers that do NOT show the icon
		// Google Chrome
		return chrome.contextMenus.create(item);
	}
}
var actionmenuadded = false;
if (chrome.contextMenus) {
	if (actionmenuadded == false) {
		actionmenuadded = true;
		var contexts = ["action"];
		browsercontext(sharemenuwelcomeguidetitle, "totlguideemenu", { "16": "images/IconGuide.png", "32": "images/IconGuide@2x.png" });
		browsercontext(sharemenudonatetitle, "totldevelopmenu", { "16": "images/IconDonate.png", "32": "images/IconDonate@2x.png" });
		browsercontext(sharemenuratetitle, "totlratemenu", { "16": "images/IconStar.png", "32": "images/IconStar@2x.png" });
		// Create a parent item and two children.
		var parent = null;
		parent = browsercontext(sharemenusharetitle, "totlsharemenu", { "16": "images/IconShare.png", "32": "images/IconShare@2x.png" });
		browsercontext(sharemenutellafriend, "totlshareemail", { "16": "images/IconEmail.png", "32": "images/IconEmail@2x.png" }, parent);
		chrome.contextMenus.create({ "title": "", "type": "separator", "id": "totlsepartorshare", "contexts": contexts, "parentId": parent });
		var uiLanguage = chrome.i18n.getUILanguage();
		if (uiLanguage.includes("zh")) {
			// Chinese users
			browsercontext(sharemenupostonweibo, "totlshareweibo", { "16": "images/IconWeibo.png", "32": "images/IconWeibo@2x.png" }, parent);
			browsercontext(sharemenupostonqq, "totlshareqq", { "16": "images/IconQQ.png", "32": "images/IconQQ@2x.png" }, parent);
		} else if (uiLanguage.includes("ru")) {
			// Russian users
			browsercontext(sharemenupostonvkontakte, "totlsharevkontakte", { "16": "images/IconVkontakte.png", "32": "images/IconVkontakte@2x.png" }, parent);
			browsercontext(sharemenupostonfacebook, "totlsharefacebook", { "16": "images/IconFacebook.png", "32": "images/IconFacebook@2x.png" }, parent);
			browsercontext(sharemenupostonwhatsapp, "totlsharewhatsapp", { "16": "images/IconWhatsApp.png", "32": "images/IconWhatsApp@2x.png" }, parent);
			browsercontext(sharemenupostonx, "totlsharetwitter", { "16": "images/IconTwitter.png", "32": "images/IconTwitter@2x.png" }, parent);
		} else {
			// all users
			browsercontext(sharemenupostonfacebook, "totlsharefacebook", { "16": "images/IconFacebook.png", "32": "images/IconFacebook@2x.png" }, parent);
			browsercontext(sharemenupostonwhatsapp, "totlsharewhatsapp", { "16": "images/IconWhatsApp.png", "32": "images/IconWhatsApp@2x.png" }, parent);
			browsercontext(sharemenupostonx, "totlsharetwitter", { "16": "images/IconTwitter.png", "32": "images/IconTwitter@2x.png" }, parent);
		}
		chrome.contextMenus.create({ "title": "", "type": "separator", "id": "totlsepartor", "contexts": contexts });
		browsercontext(sharemenusubscribetitle, "totlsubscribe", { "16": "images/IconYouTube.png", "32": "images/IconYouTube@2x.png" });
		chrome.contextMenus.onClicked.addListener(onClickHandler);
	}
}
var contextmenus;
chrome.storage.sync.get(["contextmenus"], function (items) {
	contextmenus = items.contextmenus; if (contextmenus == null) contextmenus = true;
	if (contextmenus) { checkcontextmenus(); }
});
// context menu for page and link and selection
var menuitems = null;
var contextmenuadded = false;
var contextarraypage = [];
var contextarraylink = [];
var contextarrayselection = [];
function addwebpagecontext(a, b, c, d) {
	var k;
	var addvideolength = b.length;
	for (k = 0; k < addvideolength; k++) {
		var contextvideo = b[k];
		menuitems = chrome.contextMenus.create({ "title": a, "type": "normal", "id": d, "contexts": [contextvideo] });
		c.push(menuitems);
	}
}
function checkcontextmenus() {/* 
	var baiduSearchTitle = "百度搜索";
	var contextsSelection = ["selection"];
	addwebpagecontext(baiduSearchTitle, contextsSelection, contextarrayselection, "totlsearchbaidu"); */
	if (chrome.contextMenus) {
		if (contextmenuadded == false) {
			contextmenuadded = true;
			// page
			var pagetitle = chrome.i18n.getMessage("pagetitle");
			var contextspage = ["page"];
			addwebpagecontext(pagetitle, contextspage, contextarraypage, "sppage");
			// link
			var linktitle = chrome.i18n.getMessage("linktitle");
			var contextslink = ["link"];
			addwebpagecontext(linktitle, contextslink, contextarraylink, "snpage");
			// selection
			var pagesearchtitle = chrome.i18n.getMessage("pagesearchtitle");
			var contextsselection = ["selection"];
			addwebpagecontext(pagesearchtitle, contextsselection, contextarrayselection, "slpage");
		}
	}
}
function cleanrightclickmenu(menu) {
	if (menu.length > 0) {
		menu.forEach(function (item) {
			if (item != null) { chrome.contextMenus.remove(item); }
		});
	}
	menu.length = 0;
}
function removecontexmenus() {
	if (chrome.contextMenus) {
		cleanrightclickmenu(contextarraypage);
		cleanrightclickmenu(contextarraylink);
		cleanrightclickmenu(contextarrayselection);
		contextmenuadded = false;
	}
}
function onchangestorage(a, b, c, d) {
	if (a[b]) {
		if (a[b].newValue == true) { c(); } else { d(); }
	}
}
async function getCurrentTab() {
	let queryOptions = { active: true, currentWindow: true };
	let tabs = await chrome.tabs.query(queryOptions);
	return tabs[0];
}
chrome.storage.sync.get(["icon"], function (items) {
	if (items["icon"] == undefined) {
		if (exbrowser == "safari") {
			items["icon"] = "/images/icon38.png";
		} else {
			items["icon"] = "/images/icon38.png";
		}
	}
	chrome.action.setIcon({
		path: {
			"19": items["icon"],
			"38": items["icon"]
		}
	});
});
// update on refresh tab
chrome.tabs.onUpdated.addListener(function () {
	getCurrentTab().then((thattab) => {
		chrome.storage.sync.get(["icon"], function (items) {
			if (items["icon"] == undefined) {
				if (exbrowser == "safari") {
					items["icon"] = "/images/icon38.png";
				} else {
					items["icon"] = "/images/icon38.png";
				}
			}
			chrome.action.setIcon({ tabId: thattab.id, path: { "19": items["icon"], "38": items["icon"] } });
		});
	});
});
chrome.storage.onChanged.addListener(function (changes) {
	onchangestorage(changes, "contextmenus", checkcontextmenus, removecontexmenus);
	if (changes["icon"]) {
		if (changes["icon"].newValue) {
			chrome.tabs.query({}, function (tabs) {
				var i, l = tabs.length;
				for (i = 0; i < l; i++) {
					chrome.action.setIcon({
						tabId: tabs[i].id,
						path: {
							"19": changes["icon"].newValue,
							"38": changes["icon"].newValue
						}
					});
				}
			}
			);
		}
	}
	if (changes["navtop"]) {
		if (changes["navtop"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setnavtop" });
		}
	}
	if (changes["navbottom"]) {
		if (changes["navbottom"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setnavbottom" });
		}
	}
	if (changes["navhidden"]) {
		if (changes["navhidden"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setnavhidden" });
		}
	}
	if (changes["searchgoogle"]) {
		if (changes["searchgoogle"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setrefreshsearch" });
		}
	}
	if (changes["searchbing"]) {
		if (changes["searchbing"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setrefreshsearch" });
		}
	}
	if (changes["searchduckduckgo"]) {
		if (changes["searchduckduckgo"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setrefreshsearch" });
		}
	}
	if (changes["searchbaidu"]) {
		if (changes["searchbaidu"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setrefreshsearch" });
		}
	}
	if (changes["searchyandex"]) {
		if (changes["searchyandex"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setrefreshsearch" });
		}
	}
	if (changes["opentab"]) {
		if (changes["opentab"].newValue == true || changes["opentab"].newValue == false) {
			chrome.runtime.sendMessage({ msg: "setopentab" });
		}
	}
	if (changes["opencopy"]) {
		if (changes["opencopy"].newValue == true || changes["opencopy"].newValue == false) {
			chrome.runtime.sendMessage({ msg: "setopencopy" });
		}
	}
	if (changes["opennonebookmarks"]) {
		if (changes["opennonebookmarks"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setopennonebookmarks" });
		}
	}
	if (changes["openbrowserbookmarks"]) {
		if (changes["openbrowserbookmarks"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setopenbrowserbookmarks" });
		}
	}
	if (changes["openquickbookmarks"]) {
		if (changes["openquickbookmarks"].newValue == true) {
			chrome.runtime.sendMessage({ msg: "setopenquickbookmarks" });
		}
	}
	if (changes["websitename1"] || changes["websiteurl1"] || changes["websitename2"] || changes["websiteurl2"] || changes["websitename3"] || changes["websiteurl3"] || changes["websitename4"] || changes["websiteurl4"] || changes["websitename5"] || changes["websiteurl5"] || changes["websitename6"] || changes["websiteurl6"] || changes["websitename7"] || changes["websiteurl7"] || changes["websitename8"] || changes["websiteurl8"] || changes["websitename9"] || changes["websiteurl9"] || changes["websitename10"] || changes["websiteurl10"]) {
		chrome.runtime.sendMessage({ msg: "setbookmarkswebsites" });
	}
	if (changes["googlesidepanel"]) {
		if (changes["googlesidepanel"].newValue == true || changes["googlesidepanel"].newValue == false) {
			chrome.runtime.sendMessage({ msg: "setgooglesidepanel" });
		}
	}
	if (changes["zoom"]) {
		if (changes["zoom"].newValue == true || changes["zoom"].newValue == false) {
			chrome.runtime.sendMessage({ msg: "setzoom" });
		}
	}
	if (changes["step"]) {
		chrome.runtime.sendMessage({ msg: "setstep" });
	}
	if (changes["defaultzoom"]) {
		chrome.runtime.sendMessage({ msg: "setdefaultzoom" });
	}
});
chrome.runtime.setUninstallURL(linkuninstall);
function initwelcome() {
	chrome.storage.sync.get(["firstRun"], function (chromeset) {
		if ((chromeset["firstRun"] != "false") && (chromeset["firstRun"] != false)) {
			chrome.tabs.create({ url: linkwelcome });
			var crrinstall = new Date().getTime();
			chrome.storage.sync.set({ "firstRun": false, "version": "1.0", "firstDate": crrinstall });
		}
	});
}
function installation() {
	initwelcome();
}
chrome.runtime.onInstalled.addListener(function () {
	installation();
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.engine && request.query) {
		var url = request.engine + encodeURIComponent(request.query);
		chrome.tabs.update(sender.tab.id, { url: url });
	}
});
function savePresetsToStorage(presets) {
	chrome.storage.local.set({ 'presets': presets });
}
function loadPresetsFromStorage(callback) {
	chrome.storage.local.get('presets', function (data) {
		callback(data.presets || []);
	});
}
// 添加消息监听器处理showSearchLinks动作
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'showSearchLinks') {
		// 获取当前活动标签页的侧边导航栏
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			var tabId = tabs[0].id;
			// 发送消息到侧边导航栏页面
			chrome.tabs.sendMessage(tabId, {
				action: 'performSearch',
				query: request.query
			});
		});
	}
});
// 在 background.js 文件中，确保正确处理用于激活侧边栏的消息
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'setpage') {
		// 打开侧边栏并发送当前页面的 URL
		chrome.sidePanel.open({ windowId: sender.tab.windowId }, function () {
			setTimeout(function () {
				chrome.runtime.sendMessage({ msg: "setpage", value: message.query });
			}, 500);
		});
	} else if (message.action === 'setsearch') {
		chrome.sidePanel.open({ windowId: sender.tab.windowId }, function () {
			setTimeout(function () {
				// 发送搜索请求到 panel.js
				chrome.runtime.sendMessage({
					action: 'performSearch',
					query: request.query,
					engine: 'google' // 假设默认搜索引擎为 Google
				});
			}, 500);
		});
	}
});
function getSelectedText() {
	// 这里需要实现获取选中文本的逻辑，可能需要与内容脚本交互
	// 例如，可以发送消息给content script来获取选中文本
}
// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'search') {
		// 获取当前活动标签页
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			var tab = tabs[0];
			// 发送搜索请求到 panel.js
			chrome.tabs.sendMessage(tab.id, {
				action: 'performSearch',
				query: request.query,
				engine: 'google' // 假设默认搜索引擎为 Google
			}, function (response) {
				// 可选：处理来自 panel.js 的响应
			});
		});
	}
});
chrome.storage.onChanged.addListener(function (changes, areaName) {
	// 检查是否是 searchEngines 发生了变化
	if (changes.searchEngines && areaName === 'sync') {
		chrome.tabs.query({ url: ["*://*/*"] }, function (tabs) {
			for (let i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, { action: 'updateMenuItems', menuItems: changes.menuItems.newValue });
			}
		});
	}
});
//关闭标签
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "closeTab") {
		chrome.tabs.remove(sender.tab.id);
	}
});
//粘贴
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "paste") {
		navigator.clipboard.readText()
			.then(text => {
				sendResponse({ success: true, text: text });
			})
			.catch(err => {
				console.error('Failed to read clipboard contents: ', err);
				sendResponse({ success: false, error: err.message });
			});
		return true; // 这很重要，它告诉Chrome我们将异步发送响应
	}
});
// 添加这个函数来处理打开选项页的请求
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'openOptionsPage') {
		chrome.runtime.openOptionsPage();
	}
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'toggleSidePanel') {
		if (isSidePanelOpen) {
			// 如果侧边栏是打开的,尝试关闭它
			chrome.sidePanel.close({ windowId: sender.tab.windowId })
				.then(() => {
					isSidePanelOpen = false;
					sendResponse({ success: true, isOpen: false });
				})
				.catch((error) => {
					console.error('Failed to close side panel:', error);
					sendResponse({ success: false, error: error.message });
				});
		} else {
			// 如果侧边栏是关闭的,打开它
			chrome.sidePanel.open({ windowId: sender.tab.windowId })
				.then(() => {
					isSidePanelOpen = true;
					sendResponse({ success: true, isOpen: true });
				})
				.catch((error) => {
					console.error('Failed to open side panel:', error);
					sendResponse({ success: false, error: error.message });
				});
		}
		return true; // 保持消息通道开放
	}
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'openTabWithUrl') {
		// 在后台创建新标签页并加载 URL，不切换到新标签页
		chrome.tabs.create({
			url: request.url,
			active: false // 设置 active 为 false 以在后台打开标签页
		});
	}
});
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	var activeTab = tabs[0];
	var homepageUrl = activeTab.url; // 确保此处有值
	var homepageTitle = activeTab.title || "Untitled"; // 使用 || 运算符提供默认标题
	chrome.runtime.sendMessage({
		action: "updateHomepageInfo",
		homepageUrl: homepageUrl,
		homepageTitle: homepageTitle
	});
});
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'openHomepageAndSidebar') {
		var { homepageUrl, sidebarUrl } = message.urls;
		chrome.sidePanel.open({ windowId: sender.tab.windowId }, function () {
			setTimeout(function () {
				chrome.runtime.sendMessage({
					msg: "setpage",
					value: sidebarUrl
				});
				chrome.tabs.create({ url: homepageUrl, active: true }, function (tab) {
					// 标签页创建成功后的回调
					sendResponse({ success: true }); // 在操作完成后返回响应
				});
			}, 500);
		});
		return true; // 将返回操作移到异步操作内部
	}
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'openSidebar') {
      
		var sidebarUrl = message.sidebarUrl;
        
		// 打开侧边栏并直接加载 URL
		chrome.sidePanel.open({ windowId: sender.tab.windowId }, function () {
			setTimeout(function () {
				// 发送消息设置侧边栏页面的 URL
				chrome.runtime.sendMessage({
					msg: "setpage",
					value: sidebarUrl
				});
			}, 500);
		});
	}
});


//引入拖拽代码

// 预设的搜索引擎列表
const defaultEngines = {
	'google': 'https://www.google.com/search?q=',
	'yahoo': 'https://search.yahoo.com/search?q=',
	'bing': 'https://bing.com/search?q=',
	'baidu': 'https://www.baidu.com/s?wd=',
	'yandex': 'https://yandex.com/search/?text=',
	'duckduckgo': 'https://duckduckgo.com/?q=',
	'sogou': 'https://www.sogou.com/web?query=',
	'360': 'https://www.so.com/s?q=',
	'ecosia': 'https://www.ecosia.org/search?q=',
	'qwant': 'https://www.qwant.com/?q=',
	'findx': 'https://www.findx.com/search?q=',
	'amazon': 'https://www.amazon.com/s?k=',
	'you': 'https://you.com/search?q=',
	'bilibili': 'https://search.bilibili.com/all?keyword=',
	'youtube': 'https://www.youtube.com/results?search_query=',
	'wikipedia': 'https://en.wikipedia.org/w/index.php?title=Special:Search&search='
};

// 存储的搜索引擎映射
var id2enginemap = {};

// 初始化搜索引擎映射
function initEngineMap() {
	// 从存储中获取现有的搜索引擎列表
	chrome.storage.sync.get('id2enginemap', function (data) {
		// 如果存储中没有数据，则使用默认的预设列表
		id2enginemap = data.id2enginemap || {};

		// 合并预设列表和存储中的列表
		Object.assign(id2enginemap, defaultEngines);

		// 保存更新后的列表到存储中
		chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {
			console.log('搜索引擎映射已更新');
		});
	});
}

// 监听存储变化
chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (areaName === 'sync' && changes.id2enginemap) {
		id2enginemap = changes.id2enginemap.newValue;
		console.log('更新后的搜索引擎映射:', id2enginemap);
	}
});

// 初始化
initEngineMap();

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	const isUrl = isURL(unescape(decodeURIComponent(message.c)))
	console.log(message.c, isUrl)

	chrome.tabs.query({
		active: true,
		currentWindow: true,
		url: ["http://*/*", "https://*/*"]
	}, function (tabs) {
		if (tabs && tabs.length > 0) {
			var current = tabs[tabs.length - 1]
			var index = current.index

			chrome.storage.sync.get('tabmode', function (o) {
				var foreground = false
				if (o && o.tabmode) {
					foreground = (o.tabmode === 'foreground')
				} else {
					foreground = false
				}

				if (isUrl) {
					chrome.tabs.create({
						url: decodeURIComponent(message.c),
						index: index + 1,
						active: message.foreground || foreground
					})
				} else {
					chrome.storage.sync.get('engine', function (o) {
						// get the direction storage data
						chrome.storage.sync.get([`#direction-${message.direction}`], function (o1) {
							if (o1 && o1[`#direction-${message.direction}`]) {
								const s = id2enginemap[o1[`#direction-${message.direction}`]]
								chrome.tabs.create({
									url: s + message.c,
									index: index + 1,
									active: message.foreground || foreground
								})
							} else {
								// fallback to use the legacy storage data
								if (o && o.engine) {
									chrome.tabs.create({
										url: id2enginemap[o.engine] + message.c,
										index: index + 1,
										active: message.foreground || foreground
									})
								} else {
									chrome.tabs.create({
										url: id2enginemap['google'] + message.c,
										index: index + 1,
										active: message.foreground || foreground
									})
								}
							}
						})
					})
				}
			})
		}
	})
})
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'openUrlInBackground') {
		// 解码 URL
		var url = decodeURIComponent(message.url);
		// 在后台创建新标签页
		chrome.tabs.create({
			url: url,
			active: !message.foreground, // 如果 message.foreground 为 false，则在后台打开
		}, function (tab) {
			if (!message.foreground) {
				// 如果不需要在前台打开，则确保当前激活的标签页不变
				chrome.tabs.update(sender.tab.id, { active: true });
			}
		});
	}
});
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'searchWithDirection') {
		var searchText = decodeURIComponent(message.text);
		// 根据拖拽方向获取对应的搜索引擎
		chrome.storage.sync.get([`#direction-${message.direction}`], function (o) {
			if (o[`#direction-${message.direction}`]) {
				var engineName = o[`#direction-${message.direction}`];
				var engineUrl = id2enginemap[engineName]; // 假设 id2enginemap 是包含搜索引擎名称和 URL 的映射
				if (engineUrl) {
					// 构造搜索 URL
					var searchUrl = engineUrl + encodeURIComponent(searchText);
					// 在后台创建新标签页并打开搜索结果
					chrome.sidePanel.open({ windowId: sender.tab.windowId }, function () {
						setTimeout(function () {
							chrome.runtime.sendMessage({
								msg: "setpage",
								value: searchUrl
							});
						});
					});
				}
			}
		});
		return true;
	}

});

// 监听来自背景脚本的消息，以便处理 'openHomepageAndSidebar' 动作
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'openSidebarWithURLs') {
        // 打开侧边栏并加载消息中提供的 URLs
        chrome.sidePanel.open({
            url: message.sidebarUrl, // 使用消息中提供的侧边栏 URL
            windowId: sender.tab.windowId
        }, function () {
            // 可以在这里添加打开后要执行的代码，例如发送当前页面 URL 到 panel 中
            // 这里使用了 setTimeout 来确保侧边栏加载完成
            setTimeout(function () {
                chrome.runtime.sendMessage({
                    action: 'updateMainPage', // 假设这是 panel 中需要执行的动作
                    value: message.currentUrl // 发送当前页面的 URL
                });
            }, 500);
        });
    }
});

// 存储的 previousUrl
var previousUrl;

// 监听 saveSidebarUrl 消息并存储 URL
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'updateSidebarUrl') {
		previousUrl = message.sidebarUrl;
	}
});

// 监听 setpage 和 loadSidebarUrl 消息
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message.action === 'setpage') {
		var currentUrl = message.query;
		// 响应消息
		sendResponse({ ready: true });
	} else if (message.action === 'loadSidebarUrl') {
		// 加载存储的 previousUrl 到侧边栏
		var urlToLoad = previousUrl ;
		chrome.tabs.update(sender.tab.id, { url: urlToLoad });
	}
});
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'updateDirectionSearchStatus') {
		console.log('Received direction search status:', request.enabled);
		chrome.storage.sync.set({ 'directionSearchEnabled': request.enabled });
	}
});
//快捷键打开悬浮窗
chrome.commands.onCommand.addListener(function (command) {
	if (command === "toggle-feature") {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			if (tabs.length > 0 && tabs[0].id) {
				chrome.tabs.sendMessage(tabs[0].id, { action: "showPopup" });
			}
		});
	}
});

// 监听来自 options.js 的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'settingsUpdated') {
		// 将更新的设置广播给所有标签页
		chrome.tabs.query({}, function (tabs) {
			tabs.forEach(function (tab) {
				chrome.tabs.sendMessage(tab.id, {
					action: 'updateSearchSettings',
					settings: request.settings
				});
			});
		});
	}
});

// 当新的标签页加载完成时，发送当前设置
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status === 'complete') {
		chrome.storage.sync.get(['longPressEnabled', 'ctrlSelectEnabled'], function (settings) {
			chrome.tabs.sendMessage(tabId, {
				action: 'updateSearchSettings',
				settings: settings
			});
		});
	}
});

