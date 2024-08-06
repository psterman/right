
var selectedsearch, searchgoogle, searchbing, searchduckduckgo, searchbaidu, searchyandex, typepanelzone, typepanelcustom, typepanellasttime, websitezoomname, websitelasttime, navtop, navbottom, navhidden, opentab, opencopy, opennonebookmarks, openbrowserbookmarks, openquickbookmarks, googlesidepanel, zoom, defaultzoom, step;
document.addEventListener("DOMContentLoaded", init);


var i18ntitelcopytext = chrome.i18n.getMessage("titlecopytextdone");
var i18ndescopytext = chrome.i18n.getMessage("descopytextdone");

var winsend;
// Detect URL to open back in new web browser tab
var currentSidePanelURL = "";
window.addEventListener("message", (e) => {
	// console.log("FIRST WEBSITE URL=", e.data.href);
	if (e.data?.method === "navigate") {
		if (e.source) {
			winsend = e.source;
			e.source.postMessage({
				method: "navigate-verified"
			}, "*");
		}
	} else if (e.data?.method === "complete") {
		// console.log("VISITED WEBSITE URL=", e.data.href);
		currentSidePanelURL = e.data.href;
		// save the URL for close the panel
		if (typepanellasttime == true) {
			chrome.storage.sync.set({ "websitelasttime": e.data.href });
		}
		if (zoom == true && defaultzoom != 100) {
			updateZoomLevel();
		}
	}
});

// Elements
var zoomInButton;
var zoomOutButton;
var zoomLevelDisplay;
var zoomLevel = 100;
// Function to update zoom level display

function updateZoomLevel() {
	zoomLevelDisplay.textContent = zoomLevel + "%";
	winsend.postMessage({
		method: "changeZoomScale", zoom: parseFloat(zoomLevel / 100)
	}, "*");
}

var isMenuClick = false;
function init() {
	// complete page
	const dragDropZone = document.getElementById("drag-drop-zone");
	const web = document.getElementById("web");
	web.addEventListener("dragenter", (e) => {
		e.preventDefault();
		dragDropZone.className = "show";
		dragDropZone.classList.add("blurlayer");
		// console.log("dragenter");
	});

	dragDropZone.addEventListener("dragover", (e) => {
		e.preventDefault();
		// console.log("dragover");
	});

	dragDropZone.addEventListener("dragleave", (e) => {
		e.preventDefault();
		removeblurlayerfull();
		// console.log("dragleave");
	});

	dragDropZone.addEventListener("drop", handleDrop);

	// navigation bar
	const dragDropNavbar = document.getElementById("drag-drop-navbar");
	const navbar = document.getElementById("navbar"); const searchEngineSelectContainer = document.createElement("div"); // 创建一个新的容器
	const searchEngineSelect = document.createElement("select");
	searchEngines.forEach(engine => {
		const option = document.createElement("option");
		option.textContent = engine.name;
		option.value = engine.value;
		searchEngineSelect.appendChild(option);
	});
	searchEngineSelectContainer.appendChild(searchEngineSelect); // 将下拉列表添加到新容器中

	// 将新的下拉列表容器添加到 navbar 中，紧邻 btnhome 按钮
	const btnHome = document.getElementById("btnhome");
	navbar.insertBefore(searchEngineSelectContainer, btnHome.nextSibling);

	// 添加 change 事件监听器
	searchEngineSelect.addEventListener("change", function () {
		selectedsearch = this.value;
		// 可以在这里调用 performSearch 函数进行搜索
		// performSearch(selectedsearch, document.getElementById("searchbar").value);
	});
	navbar.addEventListener("dragenter", (e) => {
		e.preventDefault();
		dragDropNavbar.className = "show";
		// console.log("dragenter");
	});

	dragDropNavbar.addEventListener("dragover", (e) => {
		e.preventDefault();
		// console.log("dragover");
	});

	dragDropNavbar.addEventListener("dragleave", (e) => {
		e.preventDefault();
		dragDropNavbar.className = "hidden";
		// console.log("dragleave");
	});

	dragDropNavbar.addEventListener("drop", handleDrop);

	// Add event listeners to detect mouse enter and leave events
	document.addEventListener("mouseover", handleMouseEnter);
	document.addEventListener("mouseout", handleMouseLeave);

	document.querySelector(".close").addEventListener("click", () => {
		document.getElementById("stefanvdpromo").className = "hidden";
	});

	zoomInButton = document.getElementById("zoom-in-button");
	zoomOutButton = document.getElementById("zoom-out-button");
	zoomLevelDisplay = document.getElementById("zoom-level");
	zoomInButton.addEventListener("click", () => {
		zoomLevel = parseInt(zoomLevel) + parseInt(step);
		updateZoomLevel();
	});

	zoomOutButton.addEventListener("click", () => {
		zoomLevel = parseInt(zoomLevel) - parseInt(step);
		updateZoomLevel();
	});

	chrome.storage.sync.get(["firstDate", "optionskipremember", "navtop", "navbottom", "navhidden", "typepanelzone", "typepanelcustom", "typepanellasttime", "websitezoomname", "websitelasttime", "searchgoogle", "searchbing", "searchduckduckgo", "searchbaidu", "searchyandex", "opentab", "opencopy", "opennonebookmarks", "openbrowserbookmarks", "openquickbookmarks", "websitename1", "websiteurl1", "websitename2", "websiteurl2", "websitename3", "websiteurl3", "websitename4", "websiteurl4", "websitename5", "websiteurl5", "websitename6", "websiteurl6", "websitename7", "websiteurl7", "websitename8", "websiteurl8", "websitename9", "websiteurl9", "websitename10", "websiteurl10", "googlesidepanel", "zoom", "defaultzoom", "step"], function (items) {
		searchgoogle = items["searchgoogle"]; if (searchgoogle == null) { searchgoogle = true; }
		googlesidepanel = items["googlesidepanel"]; if (googlesidepanel == null) { googlesidepanel = true; }
		searchbing = items["searchbing"]; if (searchbing == null) { searchbing = false; }
		searchduckduckgo = items["searchduckduckgo"]; if (searchduckduckgo == null) { searchduckduckgo = false; }
		searchbaidu = items["searchbaidu"]; if (searchbaidu == null) { searchbaidu = false; }
		searchyandex = items["searchyandex"]; if (searchyandex == null) { searchyandex = false; }
		zoom = items["zoom"]; if (zoom == null) { zoom = false; }
		defaultzoom = items["defaultzoom"]; if (defaultzoom == null) { defaultzoom = 100; }
		step = items["step"]; if (step == null) { step = 5; }

		//---
		if (zoom == true) {
			document.getElementById("zoombar").className = "zoom-panel";
		}
		zoomLevel = parseInt(defaultzoom);
		zoomLevelDisplay.textContent = defaultzoom + "%";
		//---

		if (searchgoogle) {
			selectedsearch = "searchgoogle";
		} else if (searchbing) {
			selectedsearch = "searchbing";
		} else if (searchduckduckgo) {
			selectedsearch = "searchduckduckgo";
		} else if (searchbaidu) {
			selectedsearch = "searchbaidu";
		} else if (searchyandex) {
			selectedsearch = "searchyandex";
		} else {
			selectedsearch = "searchgoogle"; // default
		}
		opentab = items["opentab"]; if (opentab == null) { opentab = false; }
		if (opentab == true) {
			document.getElementById("btntab").className = "icon";
		} else {
			document.getElementById("btntab").className = "hidden";
		}
		opencopy = items["opencopy"]; if (opencopy == null) { opencopy = false; }
		if (opencopy == true) {
			document.getElementById("btnpaste").className = "icon";
		} else {
			document.getElementById("btnpaste").className = "hidden";
		}

		opennonebookmarks = items["opennonebookmarks"]; if (opennonebookmarks == null) { opennonebookmarks = false; }
		openbrowserbookmarks = items["openbrowserbookmarks"]; if (openbrowserbookmarks == null) { openbrowserbookmarks = false; }
		openquickbookmarks = items["openquickbookmarks"]; if (openquickbookmarks == null) { openquickbookmarks = false; }
		if (openbrowserbookmarks == true) {
			document.getElementById("btnbookmarks").className = "icon";
		} else if (openquickbookmarks == true) {
			document.getElementById("btnbookmarks").className = "icon";
		} else {
			document.getElementById("btnbookmarks").className = "hidden";
		}

		// Add menu items
		if (openbrowserbookmarks == true) {
			createbrowserbookmark();
		} else if (openquickbookmarks == true) {
			createmenuitems(items);
		} else if (opennonebookmarks == true) {
			// do nothing
		}

		// show remember page
		var firstmonth = false;
		var currentDate = new Date().getTime();
		if (items["firstDate"]) {
			var datestart = items["firstDate"];
			var dateend = datestart + (30 * 24 * 60 * 60 * 1000);
			if (currentDate >= dateend) { firstmonth = false; } else { firstmonth = true; }
		} else {
			chrome.storage.sync.set({ "firstDate": currentDate });
			firstmonth = true;
		}

		if (firstmonth) {
			// show nothing
			document.getElementById("stefanvdpromo").className = "hidden";
		} else {
			if (items["optionskipremember"] != true) {
				document.getElementById("stefanvdpromo").className = ""; // show now always the banner
			} else {
				document.getElementById("stefanvdpromo").className = "hidden";
			}
		}

		typepanelzone = items.typepanelzone; if (typepanelzone == null) typepanelzone = true;
		typepanelcustom = items.typepanelcustom; if (typepanelcustom == null) typepanelcustom = false;
		typepanellasttime = items.typepanellasttime; if (typepanellasttime == null) typepanellasttime = false;
		websitezoomname = items.websitezoomname; if (websitezoomname == null) websitezoomname = "https://www.google.com";
		websitelasttime = items.websitelasttime; if (websitelasttime == null) websitelasttime = "https://www.google.com";

		if (typepanelcustom == true) {
			open(websitezoomname, true);
		} else if (typepanellasttime == true) {
			open(websitelasttime, true);
		}

		navtop = items.navtop; if (navtop == null) navtop = true;
		navbottom = items.navbottom; if (navbottom == null) navbottom = false;
		navhidden = items.navhidden; if (navhidden == null) navhidden = false;
		if (navtop == true) {
			var elementt = document.getElementById("psidebar");
			elementt.classList.add("top");
		} else if (navbottom == true) {
			var elementb = document.getElementById("psidebar");
			elementb.classList.add("bottom");
		} else if (navhidden == true) {
			var elementc = document.getElementById("psidebar");
			elementc.classList.add("clean");
		}

		// navigation bar
		document.getElementById("btnhome").addEventListener("click", actionHome, false);
		document.getElementById("btngo").addEventListener("click", actionGo, false);
		
		document.getElementById("searchbar").addEventListener("keypress", handleKeyPress, false);
		document.getElementById("btnpaste").addEventListener("click", actionPaste, false);
		// panel.js 中的 btntab 点击事件处理函数
		document.getElementById("btntab").addEventListener("click", actionOpenTab, false);
		document.getElementById("btnbookmarks").addEventListener("click", function () {
			if (document.getElementById("menubookmarks").className == "") {
				document.getElementById("menubookmarks").className = "hidden";
			} else {
				isMenuClick = true;
				document.getElementById("menubookmarks").className = "";
			}
		});

		document.getElementById("btnsave").addEventListener("click", function () {
			// 使用 chrome.tabs API 获取当前活动标签页的 URL 和标题
			chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
				var activeTab = tabs[0];
				var homepageUrl = activeTab.url; // 获取当前标签页的 URL
				var homepageTitle = activeTab.title || "Untitled"; // 获取当前标签页的标题，如果没有标题则使用默认标题 "Untitled"

				// 调用保存逻辑函数，传入获取到的 URL 和标题
				saveCurrentPageAndSidebar(homepageUrl, homepageTitle);
			});
		});
	});
}

function createmenuitems(items) {
	const menu = document.getElementById("list");
	for (let i = 1; i <= 10; i++) {
		const name = items["websitename" + `${i}`];
		const url = items["websiteurl" + `${i}`];
		if (name && url) {
			const listItem = document.createElement("li");
			const anchor = document.createElement("a");
			anchor.textContent = name;
			anchor.href = url;
			// Open URL in a new tab when clicked
			anchor.addEventListener("click", function (event) {
				// Prevent the default action of following the link
				event.preventDefault();
				open(url, true);
				// close panel
				document.getElementById("menubookmarks").className = "hidden";
				isMenuClick = false;
			});
			listItem.appendChild(anchor);
			menu.appendChild(listItem);
		}
	}
}

function createbrowserbookmark() {
	// Fetch bookmarks and render them
	chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
		renderBookmarks(bookmarkTreeNodes[0].children, document.getElementById("list"));
	});
}
//actionCopyTab 函数
function actionPaste() {
	// 使用异步函数读取剪贴板内容
	navigator.clipboard.readText()
		.then(text => {
			// 创建一个新的 'paste' 事件
			const pasteEvent = new ClipboardEvent('paste', {
				bubbles: true,
				cancelable: true,
				data: text
			});

			// 分发 'paste' 事件到当前激活的元素
			document.activeElement.dispatchEvent(pasteEvent);

			// 如果默认的粘贴行为被阻止，我们可以尝试使用 document.execCommand
			if (!pasteEvent.defaultPrevented) {
				document.execCommand('insertText', false, text);
			}
		})
		.catch(err => {
			console.error('Failed to read clipboard contents: ', err);
		});
}
function renderBookmarks(bookmarks, parentElement) {
	bookmarks.forEach(function (bookmark) {
		if (bookmark.children) {
			// Create a sublist for folders
			var sublist = document.createElement("ul");
			sublist.className = "hideitem";
			renderBookmarks(bookmark.children, sublist);
			var listItemsub = document.createElement("li");
			var folderLink = document.createElement("a");
			folderLink.href = "#";
			var folderIcon = document.createElement("img");
			folderIcon.src = "/images/folder@2x.png";
			folderIcon.alt = "Folder Icon";
			folderIcon.height = 16;
			folderIcon.width = 16;
			folderLink.appendChild(folderIcon); // Append folder icon inside the link

			// Create span for bookmark title
			var titleSpan = document.createElement("div");
			titleSpan.textContent = bookmark.title;

			folderLink.appendChild(titleSpan);
			listItemsub.appendChild(folderLink);
			listItemsub.appendChild(sublist);
			parentElement.appendChild(listItemsub);

			// Add event listeners for mouseenter and mouseleave
			listItemsub.addEventListener("mouseenter", function () {
				sublist.className = "showitem";
			});

			listItemsub.addEventListener("mouseleave", function () {
				sublist.className = "hideitem";
			});

			// Add class for CSS styling
			listItemsub.classList.add("bookmark-item");
		} else {
			// Create list item for bookmarks
			var listItem = document.createElement("li");
			var link = document.createElement("a");
			link.href = bookmark.url;
			link.addEventListener("click", function (event) {
				// Prevent the default action of following the link
				event.preventDefault();
				open(bookmark.url, true);
				// close panel
				document.getElementById("menubookmarks").className = "hidden";
				isMenuClick = false;
			});
			var favicon = document.createElement("img");
			favicon.src = "https://s2.googleusercontent.com/s2/favicons?domain=" + getDomain(bookmark.url);
			favicon.alt = "Favicon";
			favicon.height = 16;
			favicon.width = 16;
			link.appendChild(favicon); // Append favicon inside the link

			// Create span for bookmark title
			var titleSpanRoot = document.createElement("div");
			titleSpanRoot.textContent = bookmark.title;

			link.appendChild(titleSpanRoot);
			listItem.appendChild(link);
			parentElement.appendChild(listItem);

			// Add class for CSS styling
			listItem.classList.add("bookmark-item");
		}
	});
}

// Function to extract domain from URL
function getDomain(url) {
	var domain;
	// Find & remove protocol (http, https, ftp) and get domain
	if (url.indexOf("://") > -1) {
		domain = url.split("/")[2];
	} else {
		domain = url.split("/")[0];
	}
	// Find & remove port number
	domain = domain.split(":")[0];
	return domain;
}

var showingcopybadge = false;
function showcopytextbadge() {
	var div = document.createElement("div");
	div.setAttribute("id", "stefanvdremoteadd");
	div.className = "stefanvdremote";
	document.body.appendChild(div);

	var h3 = document.createElement("h3");
	h3.innerText = i18ntitelcopytext;
	div.appendChild(h3);

	var p = document.createElement("p");
	p.innerText = i18ndescopytext;
	div.appendChild(p);
	showingcopybadge = true;

	window.setTimeout(function () {
		var element = document.getElementById("stefanvdremoteadd");
		element.parentNode.removeChild(element);
		showingcopybadge = false;
	}, 4000);
}
function actionOpenTab() {
	var iframe = document.getElementById('preview');
	var iframeURL = iframe.src; // 获取 preview iframe 当前的 src 属性值

	// 发送当前 iframe 的 URL 到后台脚本
	chrome.runtime.sendMessage({
		action: 'openTabWithUrl',
		url: iframeURL
	});
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'loadUrlInPreview') {
		var previewFrame = document.getElementById('preview');
		previewFrame.src = request.url; // 加载 URL 到侧边栏的 preview iframe
	}
});
function handleDrop(e) {
	e.preventDefault();
	// console.log("drop");
	const currenturl = e.dataTransfer.getData("text/uri-list");
	if (currenturl) {
		try {
			const o = new URL(currenturl);
			if (o.hostname) {
				return open(currenturl, true);
			}
		} catch (e) {
			console.log(e);
		}
	}

	const selectedText = e.dataTransfer.getData("text/plain").trim();
	if (selectedText) {
		performSearch(selectedsearch, selectedText);
	}
}

function actionHome() {
	if (typepanelcustom == true) {
		open(websitezoomname, true);
	} else {
		document.getElementById("preview").src = "";
		document.getElementById("preview").className = "hidden";
		document.getElementById("drag-drop-info").className = "show";
		document.getElementById("drag-drop-zone").className = "show";
	}
}

function actionGo() {
	var searchInput = document.getElementById("searchbar").value.trim();
	// Check if the input is a valid URL
	// capture groups:
	// 1: protocol (https://)
	// 2: domain (mail.google.com)
	// 3: path (/chat/u/0/)
	// 4: query string (?view=list)
	// 5: fragment (#chat/home)
	var urlRegex = /^(https?:\/\/)?((?:[\da-z.-]+)+\.(?:[a-z.]{2,})+)?((?:\/[-a-z\d%_.~+]*)*)(\?[;&a-z\d%_.~+=-]*)?(#.*)?$/i;
	if (urlRegex.test(searchInput)) {
		// If it's a URL, navigate to the page
		if (searchInput.startsWith("http://www.") || searchInput.startsWith("https://www.")) {
			open(searchInput, true);
		} else if (searchInput.startsWith("http://") || searchInput.startsWith("https://")) {
			open(searchInput, true);
		} else {
			open("https://" + searchInput, true);
		}
	} else {
		// If it is not a URL, perform a search
		performSearch(selectedsearch, searchInput);
	}
}

function handleKeyPress(event) {
	if (event.key === "Enter") {
		actionGo();
	}
}

const open = async (currenturl) => {
	const iframe = document.getElementById("preview");
	if (iframe) {
		iframe.className = "";
	}

	await chrome.declarativeNetRequest.updateSessionRules({
		removeRuleIds: [1],
		addRules: [{
			id: 1,
			priority: 1,
			action: {
				type: "modifyHeaders",
				responseHeaders: [
					{ header: "x-frame-options", operation: "remove" },
					{ header: "content-security-policy", operation: "remove" },
				],
			},
			condition: {
				urlFilter: "*",
				resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "websocket"],
			},
		},
		],
	});

	const dragDropNavbar = document.getElementById("drag-drop-navbar");
	const dragDropZone = document.getElementById("drag-drop-zone");
	const dragDropInfo = document.getElementById("drag-drop-info");

	if (iframe) {
		iframe.src = currenturl;
		if (iframe.src != "" || iframe.src != null) {
			dragDropNavbar.className = "hidden";
			dragDropZone.className = "hidden";
			dragDropInfo.className = "hidden";
		}
	}
};

// Function to handle mouse entering the document
function handleMouseEnter() {
	// console.log("Mouse entered the frame.");
}

// Function to handle mouse leaving the document
function handleMouseLeave() {
	// console.log("Mouse left the frame.");
	removeblurlayernav();
	removeblurlayerfull();
}

function removeblurlayerfull() {
	const dragDropZone = document.getElementById("drag-drop-zone");
	if (dragDropZone.classList.contains("blurlayer")) {
		dragDropZone.classList.remove("blurlayer");
	}
}

function removeblurlayernav() {
	const dragDropZone = document.getElementById("drag-drop-navbar");
	if (dragDropZone.classList.contains("show")) {
		dragDropZone.className = "hidden";
	}
}

function performSearch(searchEngine, query) {
	switch (searchEngine) {
		case "searchgoogle":
			if (googlesidepanel == true) {
				// Google side-by-side search
				// https://www.chromium.org/developers/design-documents/side-by-side-search-for-default-search-engines/
				open("https://www.google.com/search?q=" + encodeURIComponent(query) + "&sidesearch=1", true);
			} else {
				open("https://www.google.com/search?q=" + encodeURIComponent(query), true);
			}
			break;
		case "searchbing":
			open("https://www.bing.com/search?q=" + encodeURIComponent(query), true);
			break;
		case "searchduckduckgo":
			open("https://duckduckgo.com/?q=" + encodeURIComponent(query), true);
			break;
		case "searchbaidu":
			open("https://www.baidu.com/s?wd=" + encodeURIComponent(query), true);
			break;
		case "searchyandex":
			open("https://yandex.com/search/?text=" + encodeURIComponent(query), true);
			break;
		default:
			open("https://www.google.com/search?q=" + encodeURIComponent(query), true);
			break;
	}
}
const searchEngines = [
	{ name: "Google", value: "searchgoogle" },
	{ name: "Bing", value: "searchbing" },
	{ name: "DuckDuckGo", value: "searchduckduckgo" },
	{ name: "Baidu", value: "searchbaidu" },
	{ name: "Yandex", value: "searchyandex" }
];
function clearBookmarksItems() {
	var list = document.getElementById("list");
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
}

chrome.runtime.onMessage.addListener(function (request) {
	if (request.msg == "setpage") {
		// console.log("received = " + request.value);
		open(request.value, true);
	} else if (request.msg == "setsearch") {
		// console.log("received = " + request.value);
		chrome.storage.sync.get(["searchgoogle", "searchbing", "searchduckduckgo", "searchbaidu", "searchyandex"], function (items) {
			searchgoogle = items["searchgoogle"]; if (searchgoogle == null) { searchgoogle = true; }
			searchbing = items["searchbing"]; if (searchbing == null) { searchbing = false; }
			searchduckduckgo = items["searchduckduckgo"]; if (searchduckduckgo == null) { searchduckduckgo = false; }
			searchbaidu = items["searchbaidu"]; if (searchbaidu == null) { searchbaidu = false; }
			searchyandex = items["searchyandex"]; if (searchyandex == null) { searchyandex = false; }
			if (searchgoogle) {
				selectedsearch = "searchgoogle";
			} else if (searchbing) {
				selectedsearch = "searchbing";
			} else if (searchduckduckgo) {
				selectedsearch = "searchduckduckgo";
			} else if (searchbaidu) {
				selectedsearch = "searchbaidu";
			} else if (searchyandex) {
				selectedsearch = "searchyandex";
			}
			performSearch(selectedsearch, request.value);
		});
	} else if (request.msg == "setnavtop") {
		var getpa = document.getElementById("psidebar");
		getpa.className = "container top";
	} else if (request.msg == "setnavbottom") {
		var getpb = document.getElementById("psidebar");
		getpb.className = "container bottom";
	} else if (request.msg == "setnavhidden") {
		var getpc = document.getElementById("psidebar");
		getpc.className = "container clean";
	} else if (request.msg == "setrefreshsearch") {
		chrome.storage.sync.get(["searchgoogle", "searchbing", "searchduckduckgo", "searchbaidu", "searchyandex"], function (items) {
			searchgoogle = items["searchgoogle"]; if (searchgoogle == null) { searchgoogle = true; }
			searchbing = items["searchbing"]; if (searchbing == null) { searchbing = false; }
			searchduckduckgo = items["searchduckduckgo"]; if (searchduckduckgo == null) { searchduckduckgo = false; }
			searchbaidu = items["searchbaidu"]; if (searchbaidu == null) { searchbaidu = false; }
			searchyandex = items["searchyandex"]; if (searchyandex == null) { searchyandex = false; }
			if (searchgoogle) {
				selectedsearch = "searchgoogle";
			} else if (searchbing) {
				selectedsearch = "searchbing";
			} else if (searchduckduckgo) {
				selectedsearch = "searchduckduckgo";
			} else if (searchbaidu) {
				selectedsearch = "searchbaidu";
			} else if (searchyandex) {
				selectedsearch = "searchyandex";
			}
		});
	} else if (request.msg == "setopentab") {
		chrome.storage.sync.get(["opentab"], function (items) {
			opentab = items["opentab"]; if (opentab == null) { opentab = false; }
			if (opentab == true) {
				document.getElementById("btntab").className = "icon";
			} else {
				document.getElementById("btntab").className = "hidden";
			}
		});
	} else if (request.msg == "setopencopy") {
		chrome.storage.sync.get(["opencopy"], function (items) {
			opencopy = items["opencopy"]; if (opencopy == null) { opencopy = false; }
			if (opencopy == true) {
				document.getElementById("btnpaste").className = "icon";
			} else {
				document.getElementById("btnpaste").className = "hidden";
			}
		});
	} else if (request.msg == "setbookmarkswebsites") {
		chrome.storage.sync.get(["websitename1", "websiteurl1", "websitename2", "websiteurl2", "websitename3", "websiteurl3", "websitename4", "websiteurl4", "websitename5", "websiteurl5", "websitename6", "websiteurl6", "websitename7", "websiteurl7", "websitename8", "websiteurl8", "websitename9", "websiteurl9", "websitename10", "websiteurl10"], function (items) {
			document.getElementById("menubookmarks").className = "hidden";
			clearBookmarksItems();
			createmenuitems(items);
		});
	} else if (request.msg == "setopennonebookmarks") {
		chrome.storage.sync.get(["openquickbookmarks", "openbrowserbookmarks", "opennonebookmarks"], function (items) {
			openquickbookmarks = items["openquickbookmarks"]; if (openquickbookmarks == null) { openquickbookmarks = false; }
			openbrowserbookmarks = items["openbrowserbookmarks"]; if (openbrowserbookmarks == null) { openbrowserbookmarks = false; }
			opennonebookmarks = items["opennonebookmarks"]; if (opennonebookmarks == null) { opennonebookmarks = false; }
			document.getElementById("menubookmarks").className = "hidden";
			document.getElementById("btnbookmarks").className = "hidden";
			clearBookmarksItems();
		});
	} else if (request.msg == "setopenquickbookmarks") {
		chrome.storage.sync.get(["openquickbookmarks", "openbrowserbookmarks", "opennonebookmarks", "websitename1", "websiteurl1", "websitename2", "websiteurl2", "websitename3", "websiteurl3", "websitename4", "websiteurl4", "websitename5", "websiteurl5", "websitename6", "websiteurl6", "websitename7", "websiteurl7", "websitename8", "websiteurl8", "websitename9", "websiteurl9", "websitename10", "websiteurl10"], function (items) {
			openquickbookmarks = items["openquickbookmarks"]; if (openquickbookmarks == null) { openquickbookmarks = false; }
			openbrowserbookmarks = items["openbrowserbookmarks"]; if (openbrowserbookmarks == null) { openbrowserbookmarks = false; }
			opennonebookmarks = items["opennonebookmarks"]; if (opennonebookmarks == null) { opennonebookmarks = false; }
			clearBookmarksItems(items);
			createmenuitems(items);
			document.getElementById("btnbookmarks").className = "icon";
		});
	} else if (request.msg == "setopenbrowserbookmarks") {
		chrome.storage.sync.get(["openquickbookmarks", "openbrowserbookmarks", "opennonebookmarks"], function (items) {
			openquickbookmarks = items["openquickbookmarks"]; if (openquickbookmarks == null) { openquickbookmarks = false; }
			openbrowserbookmarks = items["openbrowserbookmarks"]; if (openbrowserbookmarks == null) { openbrowserbookmarks = false; }
			opennonebookmarks = items["opennonebookmarks"]; if (opennonebookmarks == null) { opennonebookmarks = false; }
			document.getElementById("btnbookmarks").className = "icon";
			clearBookmarksItems();
			createbrowserbookmark();
		});
	} else if (request.msg == "setgooglesidepanel") {
		chrome.storage.sync.get(["googlesidepanel"], function (items) {
			googlesidepanel = items["googlesidepanel"]; if (googlesidepanel == null) { googlesidepanel = true; }
		});
	} else if (request.msg == "setzoom") {
		chrome.storage.sync.get(["zoom", "defaultzoom"], function (items) {
			zoom = items["zoom"]; if (zoom == null) { zoom = false; }
			defaultzoom = items["defaultzoom"]; if (defaultzoom == null) { defaultzoom = 100; }
			if (zoom == true) {
				document.getElementById("zoombar").className = "zoom-panel";
				zoomLevelDisplay.textContent = defaultzoom + "%";
				zoomLevel = parseInt(defaultzoom);
			} else {
				document.getElementById("zoombar").className = "hidden";
				zoomLevelDisplay.textContent = 100 + "%";
				zoomLevel = 100;
			}
			updateZoomLevel();
		});
	} else if (request.msg == "setstep") {
		chrome.storage.sync.get(["step"], function (items) {
			step = items["step"]; if (step == null) { step = 5; }
		});
	} else if (request.msg == "setdefaultzoom") {
		chrome.storage.sync.get(["defaultzoom"], function (items) {
			defaultzoom = items["defaultzoom"]; if (defaultzoom == null) { defaultzoom = 100; }
			zoomLevelDisplay.textContent = defaultzoom + "%";
			zoomLevel = parseInt(defaultzoom);
			updateZoomLevel();
		});
	}
	document.addEventListener('mouseup', function (e) {
		var selection = window.getSelection();
		if (!selection.isCollapsed) {
			// 用户选择了文本，发送 'setpage' 动作到后台脚本
			chrome.runtime.sendMessage({
				action: 'search',
				query: selection.toString(), // 发送选中的文本
				engine: 'baidu' // 示例默认使用百度
			});
		}
	});
})
// 假设 iframe 的 ID 是 'preview'
var iframe = document.getElementById('preview');
var iframeHeight = iframe.offsetHeight;
document.getElementById('btnbookmarks').addEventListener('click', function () {
	var bookmarksMenu = document.getElementById('menubookmarks');
	bookmarksMenu.classList.toggle('hidden');

	if (this.classList.contains('bottom')) {
		// 如果按钮在底部，调整二级菜单的位置
		bookmarksMenu.style.top = '-' + iframeHeight + 'px';
	} else {
		// 否则，重置二级菜单的位置
		bookmarksMenu.style.top = '0';
	}
});

// 修改后的保存逻辑函数
function saveCurrentPageAndSidebar(homepageUrl, homepageTitle) {
	var sidebarUrl = document.getElementById("preview").src;
	var sidebarName = "Sidebar";

	var savedData = {
		homepageName: homepageTitle,
		homepageUrl: homepageUrl,
		sidebarName: sidebarName,
		sidebarUrl: sidebarUrl
	};

	chrome.storage.sync.set({ 'savedPages': savedData }, function () {
		console.log("Saved homepage and sidebar successfully.");
	});
}