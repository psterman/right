// 定义全局变量存储搜索引擎映射
var globalId2enginemap = {};

// 初始化全局变量
// 初始化全局变量
chrome.storage.sync.get('id2enginemap', function (data) {
	// 如果存储中有数据，则使用存储中的数据，否则使用默认的预设列表
	globalId2enginemap = data.id2enginemap || {};

	// 合并预设列表和存储中的列表
	Object.assign(globalId2enginemap, defaultEngines);

	// 保存更新后的列表到存储中
	chrome.storage.sync.set({ id2enginemap: globalId2enginemap }, function () {
		console.log('搜索引擎映射已更新');
	});
	const tabs = document.querySelectorAll('.tab');
	let currentCategory = 'ai'; // 默认分类

	tabs.forEach(tab => {
		tab.addEventListener('click', function () {
			tabs.forEach(t => t.classList.remove('active'));
			this.classList.add('active');
			currentCategory = this.dataset.category;
			loadEngines(currentCategory);
		});
	});

	document.getElementById('addEngineBtn').addEventListener('click', function () {
		addEngine(currentCategory);
	});

	loadEngines(); // 初始化加载列表
});
// 获取搜索引擎复选框元素列表
var checkboxList = document.querySelectorAll(".search-engine-checkbox");

// 遍历搜索引擎复选框元素列表，并绑定搜索引擎数据
for (var i = 0; i < checkboxList.length; i++) {
	var checkbox = checkboxList[i];
	var engine = searchEngineData[i];

	checkbox.value = engine.name;
	checkbox.nextElementSibling.textContent = engine.name;
	// 添加name和urlbase属性到复选框元素
	checkbox.setAttribute('data-name', engine.name);
	checkbox.setAttribute('data-urlbase', engine.urlbase);
}
function $(id) { return document.getElementById(id); }
var youtubeembed = "https://www.youtube.com/embed/?listType=playlist&list=PLfXHh3TKRb4Z-C2w3SLAY_InRNET-DgI1&rel=0";
var darkmode = false;

var firstdefaultvalues = {};
function defaultgetsettings() {
	// Initialize search engines data

	// Option default value to read if there is no current value from chrome.storage AND init default value
	chrome.storage.sync.get(["icon", "contextmenus", "searchgoogle", "searchbing", "searchduckduckgo", "searchbaidu", "searchyandex", "navtop", "navbottom", "navhidden", "typepanelzone", "typepanelcustom", "typepanellasttime", "websitezoomname", "websitename1", "websiteurl1", "websitename2", "websiteurl2", "websitename3", "websiteurl3", "opennonebookmarks", "openbrowserbookmarks", "openquickbookmarks", "googlesidepanel", "defaultzoom", "step"], function (items) {
		// find no localstore
		if (items["icon"] == null) {
			if (exbrowser == "safari") {
				firstdefaultvalues["icon"] = "/images/icon38.png";
			} else {
				firstdefaultvalues["icon"] = "/images/icon38.png";
			}
		}
		if (items["contextmenus"] == null) { firstdefaultvalues["contextmenus"] = true; }
		if (items["searchgoogle"] == null && items["searchbing"] == null && items["searchduckduckgo"] == null && items["searchbaidu"] == null && items["searchyandex"] == null) { firstdefaultvalues["searchgoogle"] = true; firstdefaultvalues["searchbing"] = false; firstdefaultvalues["searchduckduckgo"] = false; firstdefaultvalues["searchbaidu"] = false; firstdefaultvalues["searchyandex"] = false; }
		if (items["navtop"] == null && items["navbottom"] == null && items["navhidden"] == null) { firstdefaultvalues["navtop"] = true; firstdefaultvalues["navbottom"] = false; firstdefaultvalues["navhidden"] = false; }
		if (items["websitezoomname"] == null) { firstdefaultvalues["websitezoomname"] = "https://www.google.com"; }
		if (items["typepanelzone"] == null && items["typepanelcustom"] == null && items["typepanellasttime"] == null) {
			firstdefaultvalues["typepanelzone"] = true;
			firstdefaultvalues["typepanelcustom"] = false;
			firstdefaultvalues["typepanellasttime"] = false;
		}
		if (items["websitename1"] == null) { firstdefaultvalues["websitename1"] = "Google"; }
		if (items["websiteurl1"] == null) { firstdefaultvalues["websiteurl1"] = "https://www.google.com"; }
		if (items["websitename2"] == null) { firstdefaultvalues["websitename2"] = "YouTube"; }
		if (items["websiteurl2"] == null) { firstdefaultvalues["websiteurl2"] = "https://www.youtube.com"; }
		if (items["websitename3"] == null) { firstdefaultvalues["websitename3"] = "Developer"; }
		if (items["websiteurl3"] == null) { firstdefaultvalues["websiteurl3"] = "https://www.stefanvd.net"; }
		if (items["opennonebookmarks"] == null && items["openbrowserbookmarks"] == null && items["openquickbookmarks"] == null) {
			firstdefaultvalues["opennonebookmarks"] = true;
			firstdefaultvalues["openbrowserbookmarks"] = false;
			firstdefaultvalues["openquickbookmarks"] = false;
		}
		if (items["googlesidepanel"] == null) { firstdefaultvalues["googlesidepanel"] = true; }
		if (items["defaultzoom"] == null) { firstdefaultvalues["defaultzoom"] = 100; }
		if (items["step"] == null) { firstdefaultvalues["step"] = 5; }

		// Save the init value
		chrome.storage.sync.set(firstdefaultvalues, function () {
			// console.log("Settings saved");
			read_options();
		});
	});
}

// 保存选中的搜索引擎到 Chrome 存储
function save_options() {
	chrome.storage.sync.set({ "icon": $("btnpreview").src, "optionskipremember": $("optionskipremember").checked, "contextmenus": $("contextmenus").checked, "searchgoogle": $("searchgoogle").checked, "searchbing": $("searchbing").checked, "searchduckduckgo": $("searchduckduckgo").checked, "searchbaidu": $("searchbaidu").checked, "searchyandex": $("searchyandex").checked, "navtop": $("navtop").checked, "navbottom": $("navbottom").checked, "navhidden": $("navhidden").checked, "typepanelzone": $("typepanelzone").checked, "typepanelcustom": $("typepanelcustom").checked, "typepanellasttime": $("typepanellasttime").checked, "websitezoomname": $("websitezoomname").value, "opentab": $("opentab").checked, "opencopy": $("opencopy").checked, "opennonebookmarks": $("opennonebookmarks").checked, "openbrowserbookmarks": $("openbrowserbookmarks").checked, "openquickbookmarks": $("openquickbookmarks").checked, "websitename1": $("websitename1").value, "websiteurl1": $("websiteurl1").value, "websitename2": $("websitename2").value, "websiteurl2": $("websiteurl2").value, "websitename3": $("websitename3").value, "websiteurl3": $("websiteurl3").value, "websitename4": $("websitename4").value, "websiteurl4": $("websiteurl4").value, "websitename5": $("websitename5").value, "websiteurl5": $("websiteurl5").value, "websitename6": $("websitename6").value, "websiteurl6": $("websiteurl6").value, "websitename7": $("websitename7").value, "websiteurl7": $("websiteurl7").value, "websitename8": $("websitename8").value, "websiteurl8": $("websiteurl8").value, "websitename9": $("websitename9").value, "websiteurl9": $("websiteurl9").value, "websitename10": $("websitename10").value, "websiteurl10": $("websiteurl10").value, "googlesidepanel": $("googlesidepanel").checked, "zoom": $("zoom").checked, "defaultzoom": $("defaultzoom").value, "step": $("step").value });
}

function read_options() {
	// youtube
	$("materialModalYouTubeButtonOK").addEventListener("click", function (e) {
		closeMaterialYouTubeAlert(e);
		chrome.storage.sync.set({ "firstsawyoutube": true });
	});

	$("materialModalYouTubeButtonCANCEL").addEventListener("click", function (e) {
		closeMaterialYouTubeCancel(e);
	});

	// rate
	$("materialModalRate").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
	});
	$("materialModalRateContent").addEventListener("click", function (e) {
		e.stopPropagation();
	});
	$("materialModalRateButtonWriteOK").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
		window.open(writereview); $("sectionreviewbox").style.display = "none"; chrome.storage.sync.set({ "reviewedlastonversion": chrome.runtime.getManifest().version });
	});
	$("materialModalRateButtonWriteCANCEL").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
		chrome.storage.sync.set({ "firstsawrate": false });
	});
	$("materialModalButtonSupportOK").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
		window.open(linksupport);
		chrome.storage.sync.set({ "firstsawrate": false });
	});
	$("materialModalButtonSupportCANCEL").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
		chrome.storage.sync.set({ "firstsawrate": false });
	});
	$("materialModalRateButtonCANCEL").addEventListener("click", function (e) {
		closeMaterialRateAlert(e);
		chrome.storage.sync.set({ "firstsawrate": false });
	});

	if (document.querySelector("input[name=\"rating\"]")) {
		document.querySelectorAll("input[name=\"rating\"]").forEach((elem) => {
			elem.addEventListener("change", function (event) {
				var item = event.target.value;
				if (item == 5 || item == 4) {
					// good stars
					$("ratepage0").classList.add("hidden");
					$("ratepage1high").classList.remove("hidden");
				} else if (item == 3 || item == 2 || item == 1) {
					// low stars
					$("ratepage0").classList.add("hidden");
					$("ratepage1low").classList.remove("hidden");
				}
			});
		});
	}
	//---

	function showhidemodal(name, visible, status) {
		document.getElementById(name).className = visible;
		document.getElementById(name).setAttribute("aria-disabled", status);
		setmetathemepopup(status);
	}

	// rate
	function materialRateAlert() {
		showhidemodal("materialModalRate", "show", "false");
	}
	function closeMaterialRateAlert(e) {
		e.stopPropagation();
		showhidemodal("materialModalRate", "hide", "true");
	}
	//---

	// youtube
	function materialYouTubeAlert() {
		showhidemodal("materialModalYouTube", "show", "false");
	}
	function closeMaterialYouTubeCancel(e) {
		e.stopPropagation();
		showhidemodal("materialModalYouTube", "hide", "true");
	}
	function closeMaterialYouTubeAlert(e) {
		e.stopPropagation();
		window.open(linkyoutube, "_blank");
		showhidemodal("materialModalYouTube", "hide", "true");
	}

	chrome.storage.sync.get(["icon", "firstDate", "contextmenus", "optionskipremember", "firstsawrate", "searchgoogle", "searchbing", "searchduckduckgo", "searchbaidu", "searchyandex", "navtop", "navbottom", "navhidden", "typepanelzone", "typepanelcustom", "typepanellasttime", "websitezoomname", "opentab", "opencopy", "opennonebookmarks", "openbrowserbookmarks", "openquickbookmarks", "websitename1", "websiteurl1", "websitename2", "websiteurl2", "websitename3", "websiteurl3", "websitename4", "websiteurl4", "websitename5", "websiteurl5", "websitename6", "websiteurl6", "websitename7", "websiteurl7", "websitename8", "websiteurl8", "websitename9", "websiteurl9", "websitename10", "websiteurl10", "googlesidepanel", "zoom", "defaultzoom", "step"], function (items) {
		if (items["icon"]) { $("btnpreview").src = items["icon"]; }
		if (items["contextmenus"] == true) $("contextmenus").checked = true;
		if (items["optionskipremember"] == true) { $("optionskipremember").checked = true; }
		if (items["searchgoogle"] == true) { $("searchgoogle").checked = true; }
		if (items["searchbing"] == true) { $("searchbing").checked = true; }
		if (items["searchduckduckgo"] == true) { $("searchduckduckgo").checked = true; }
		if (items["searchbaidu"] == true) { $("searchbaidu").checked = true; }
		if (items["searchyandex"] == true) { $("searchyandex").checked = true; }
		if (items["navtop"] == true) { $("navtop").checked = true; }
		if (items["navbottom"] == true) { $("navbottom").checked = true; }
		if (items["navhidden"] == true) { $("navhidden").checked = true; }
		if (items["typepanelzone"] == true) { $("typepanelzone").checked = true; }
		if (items["typepanelcustom"] == true) { $("typepanelcustom").checked = true; }
		if (items["typepanellasttime"] == true) { $("typepanellasttime").checked = true; }
		if (items["websitezoomname"]) { $("websitezoomname").value = items["websitezoomname"]; } else $("websitezoomname").value = "https://www.google.com";
		if (items["opentab"] == true) { $("opentab").checked = true; }
		if (items["opencopy"] == true) { $("opencopy").checked = true; }
		if (items["opennonebookmarks"]) { $("opennonebookmarks").checked = true; }
		if (items["openbrowserbookmarks"]) { $("openbrowserbookmarks").checked = true; }
		if (items["openquickbookmarks"]) { $("openquickbookmarks").checked = true; }
		if (items["websitename1"]) { $("websitename1").value = items["websitename1"]; }
		if (items["websiteurl1"]) { $("websiteurl1").value = items["websiteurl1"]; }
		if (items["websitename2"]) { $("websitename2").value = items["websitename2"]; }
		if (items["websiteurl2"]) { $("websiteurl2").value = items["websiteurl2"]; }
		if (items["websitename3"]) { $("websitename3").value = items["websitename3"]; }
		if (items["websiteurl3"]) { $("websiteurl3").value = items["websiteurl3"]; }
		if (items["websitename4"]) { $("websitename4").value = items["websitename4"]; }
		if (items["websiteurl4"]) { $("websiteurl4").value = items["websiteurl4"]; }
		if (items["websitename5"]) { $("websitename5").value = items["websitename5"]; }
		if (items["websiteurl5"]) { $("websiteurl5").value = items["websiteurl5"]; }
		if (items["websitename6"]) { $("websitename6").value = items["websitename6"]; }
		if (items["websiteurl6"]) { $("websiteurl6").value = items["websiteurl6"]; }
		if (items["websitename7"]) { $("websitename7").value = items["websitename7"]; }
		if (items["websiteurl7"]) { $("websiteurl7").value = items["websiteurl7"]; }
		if (items["websitename8"]) { $("websitename8").value = items["websitename8"]; }
		if (items["websiteurl8"]) { $("websiteurl8").value = items["websiteurl8"]; }
		if (items["websitename9"]) { $("websitename9").value = items["websitename9"]; }
		if (items["websiteurl9"]) { $("websiteurl9").value = items["websiteurl9"]; }
		if (items["websitename10"]) { $("websitename10").value = items["websitename10"]; }
		if (items["websiteurl10"]) { $("websiteurl10").value = items["websiteurl10"]; }
		if (items["googlesidepanel"] == true) { $("googlesidepanel").checked = true; }
		if (items["zoom"] == true) { $("zoom").checked = true; }
		if (items["defaultzoom"]) { $("defaultzoom").value = items["defaultzoom"]; }
		if (items["step"]) { $("step").value = items["step"]; }

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
			$("sectionreviewbox").style.display = "none";
		} else {
			if ($("optionskipremember").checked != true) {
				$("sectionreviewbox").style.display = "block"; // show now always the banner
				if (items["firstsawrate"] != true) {
					window.setTimeout(function () {
						materialRateAlert();
					}, 2500);
					chrome.storage.sync.set({ "firstsawrate": true });
				}
			} else {
				$("sectionreviewbox").style.display = "none";
			}
		}

		var firstday = false;
		var startnum = items["firstsawnumber"];
		if ($("optionskipremember").checked != true) {
			var dateinstall = items["firstDate"];
			var datenextday = dateinstall + (1 * 24 * 60 * 60 * 1000);
			if (currentDate >= datenextday) { firstday = false; } else { firstday = true; }

			if (firstday) {
				// show nothing
			} else {
				// if the rate box is not visible, and never clicked, then show the YouTube channel box
				if (items["firstsawrate"] != true && items["firstsawyoutube"] != true) {
					if (typeof startnum == "undefined" || startnum == null) { startnum = 1; }
					if (startnum == 4) {
						window.setTimeout(function () {
							materialYouTubeAlert();
						}, 2500);
						startnum = 0;
					}
					startnum += 1;
					chrome.storage.sync.set({ "firstsawnumber": startnum });
				}
			}
		}

		// donation bar
		if (devdonate == true) {
			$("managed-prefs-banner").className = "hidden";
		}

		// load tab div
		var tabListItems = $("navbar").childNodes;
		var i, l = tabListItems.length;
		for (i = 0; i < l; i++) {
			if (tabListItems[i].nodeName == "LI") {
				var tabLink = getFirstChildWithTagName(tabListItems[i], "A");
				var id = getHash(tabLink.getAttribute("data-tab"));
				tabLinks[id] = tabLink;
				contentDivs[id] = document.getElementById(id);
			}
		}

		// Assign onclick events to the tab links, and
		// highlight the first tab
		var tabi = 0;
		var tabid;
		for (tabid in tabLinks) {
			tabLinks[tabid].onclick = showTab;
			tabLinks[tabid].onfocus = function () { this.blur(); };
			if (tabi == 0) tabLinks[tabid].className = "navbar-item-selected";
			tabi++;
		}

		// Hide all content divs except the first
		var contenti = 0;
		var contentid;
		for (contentid in contentDivs) {
			if (contenti != 0) contentDivs[contentid].className = "page hidden";
			contenti++;
		}

		// display version number
		var manifestData = chrome.runtime.getManifest();
		$("version_number").innerText = manifestData.version;

		test(); // do the test

	});// chrome storage end
} // end read

// tabel script
var tabLinks = new Array();
var contentDivs = new Array();

function showTab() {
	var selectedId = getHash(this.getAttribute("data-tab"));

	// Highlight the selected tab, and dim all others.
	// Also show the selected content div, and hide all others.
	for (var id in contentDivs) {
		if (id == selectedId) {
			tabLinks[id].className = "navbar-item-selected";
			contentDivs[id].className = "page";
		} else {
			tabLinks[id].className = "navbar-item";
			contentDivs[id].className = "page hidden";
		}
	}

	// Stop the browser following the link
	return false;
}

function getFirstChildWithTagName(element, tagName) {
	for (var i = 0; i < element.childNodes.length; i++) {
		if (element.childNodes[i].nodeName == tagName) return element.childNodes[i];
	}
}

function getHash(url) {
	var hashPos = url.lastIndexOf("#");
	return url.substring(hashPos + 1);
}

function test() {
	if ($("zoom").checked == true) {
		$("defaultzoom").disabled = false;
		$("step").disabled = false;
	} else {
		$("defaultzoom").disabled = true;
		$("step").disabled = true;
	}

	if ($("typepanelcustom").checked == true) {
		$("websitezoomname").disabled = false;
	} else {
		$("websitezoomname").disabled = true;
	}

	if ($("openbrowserbookmarks").checked == true) {
		chrome.runtime.sendMessage({ name: "stefanbookmarkadd" });
	}

	if ($("openquickbookmarks").checked == true) {
		$("websitename1").disabled = false;
		$("websiteurl1").disabled = false;

		$("websitename2").disabled = false;
		$("websiteurl2").disabled = false;

		$("websitename3").disabled = false;
		$("websiteurl3").disabled = false;

		$("websitename4").disabled = false;
		$("websiteurl4").disabled = false;

		$("websitename5").disabled = false;
		$("websiteurl5").disabled = false;

		$("websitename6").disabled = false;
		$("websiteurl6").disabled = false;

		$("websitename7").disabled = false;
		$("websiteurl7").disabled = false;

		$("websitename8").disabled = false;
		$("websiteurl8").disabled = false;

		$("websitename9").disabled = false;
		$("websiteurl9").disabled = false;

		$("websitename10").disabled = false;
		$("websiteurl10").disabled = false;
	} else {
		$("websitename1").disabled = true;
		$("websiteurl1").disabled = true;

		$("websitename2").disabled = true;
		$("websiteurl2").disabled = true;

		$("websitename3").disabled = true;
		$("websiteurl3").disabled = true;

		$("websitename4").disabled = true;
		$("websiteurl4").disabled = true;

		$("websitename5").disabled = true;
		$("websiteurl5").disabled = true;

		$("websitename6").disabled = true;
		$("websiteurl6").disabled = true;

		$("websitename7").disabled = true;
		$("websiteurl7").disabled = true;

		$("websitename8").disabled = true;
		$("websiteurl8").disabled = true;

		$("websitename9").disabled = true;
		$("websiteurl9").disabled = true;

		$("websitename10").disabled = true;
		$("websiteurl10").disabled = true;
	}
}

function ariacheck() {
	var inputs = document.querySelectorAll("input");
	var i;
	var l = inputs.length;
	for (i = 0; i < l; i++) {
		if (inputs[i].getAttribute("role") == "radio" || inputs[i].getAttribute("role") == "checkbox") {
			if (inputs[i].checked == true) {
				inputs[i].setAttribute("aria-checked", true);
			} else {
				inputs[i].setAttribute("aria-checked", false);
			}
		}
	}
}

// Current year
function yearnow() {
	var today = new Date(); var y0 = today.getFullYear(); $("yearnow").innerText = y0;
}

function setappearancemode(a, b, c) {
	$("dropmenu").className = a;
	document.body.className = b;
	$("headlamp").style.webkitFilter = c;
	$("headlamp").style.filter = c;
	$("loadinglamp").style.webkitFilter = c;
	$("loadinglamp").style.filter = c;
}

function godarkmode() {
	$("dropmenu").className = "hide";
	setappearancemode("hide", "dark", "invert(1) brightness(2)");
}

function golightmode() {
	$("dropmenu").className = "hide";
	setappearancemode("hide", "light", "invert(0)");
}

function seticonstyle(a, b, c) {
	$("icondarkauto").style.opacity = a;
	$("icondarkoff").style.opacity = b;
	$("icondarkon").style.opacity = c;
}

function checkdarkmode() {
	chrome.storage.sync.get(["darkmode"], function (items) {
		darkmode = items["darkmode"]; if (darkmode == null) darkmode = 2; // default Operating System

		// dark mode
		if (darkmode == 1) {
			godarkmode();
			seticonstyle(0, 0, 1);
		} else if (darkmode == 0) {
			golightmode();
			seticonstyle(0, 1, 0);
		} else if (darkmode == 2) {
			if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
				godarkmode();
			} else {
				golightmode();
			}
			seticonstyle(1, 0, 0);
		}
	});
}

function eventsubmitFunc(selector, callback) {
	document.getElementById(selector).addEventListener("submit", function (e) {
		e.preventDefault();
		callback();
	});
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg) {
	if (message.action === 'updateSearchEngines') {
		selectedEngines = message.searchEngines.filter(engine => engine.selected);
		chrome.storage.sync.set({ searchEngines: selectedEngines }, function () {
			console.log('Selected engines saved.');
		});

		// 传递选项的显示状态给 contents.js
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				action: 'updateDisplayOptions',
				displayOptions: {
					copy: selectedEngines.length > 0, // 显示复制选项
					jump: selectedEngines.length > 0, // 显示跳转选项
					close: true // 显示关闭选项

				}
			});
		});
	}
	// If the received message has the expected format...
	if (msg.text === "receiveallpermissions") {
		// empty ul first
		if ($("permullist")) {
			var ul = document.getElementById("permullist");
			if (ul) {
				while (ul.firstChild) {
					ul.removeChild(ul.firstChild);
				}
			}
		}
		var perm = msg.value;
		perm.forEach(function (x) {
			if ($("permissionlist")) {
				if ($("permullist") == null) {
					var newpermtitle = document.createElement("h4");
					newpermtitle.textContent = chrome.i18n.getMessage("permissionrequired");
					$("permissionlist").appendChild(newpermtitle);

					var newpermul = document.createElement("ul");
					newpermul.setAttribute("id", "permullist");
					$("permissionlist").appendChild(newpermul);
				}

				var newperm = document.createElement("li");
				$("permullist").appendChild(newperm);

				var newpermspan = document.createElement("span");
				newpermspan.textContent = x + ": ";
				newperm.appendChild(newpermspan);

				var textperm = "";
				var newpermspandes = document.createElement("span");
				if (x == "activeTab") { textperm = chrome.i18n.getMessage("permissionactivetab"); } else if (x == "contextMenus") { textperm = chrome.i18n.getMessage("permissioncontextmenu"); } else if (x == "storage") { textperm = chrome.i18n.getMessage("permissionstorage"); } else if (x == "tabs") { textperm = chrome.i18n.getMessage("permissiontabs"); } else if (x == "scripting") { textperm = chrome.i18n.getMessage("permissionscripting"); } else if (x == "bookmarks") { textperm = chrome.i18n.getMessage("permissionbookmarks"); } else if (x == "sidePanel") { textperm = chrome.i18n.getMessage("permissionsidepanel"); } else if (x == "declarativeNetRequestWithHostAccess") { textperm = chrome.i18n.getMessage("permissionhostaccess"); }
				newpermspandes.textContent = textperm;
				newpermspandes.className = "item";
				newperm.appendChild(newpermspandes);
			}
		});
	}
});

function setmetatheme(a) {
	const metas = document.getElementsByTagName("meta");
	var darktheme;
	var lighttheme;

	if (a == true) {
		// top status bar color => if side bar is open
		darktheme = "#1c1c1c";
		lighttheme = "#f5f5f5";
	} else {
		darktheme = "#232323";
		lighttheme = "#ffffff";
	}

	let i, l = metas.length;
	for (i = 0; i < l; i++) {
		if (metas[i].getAttribute("name") == "theme-color") {
			if (metas[i].getAttribute("media")) {
				if (metas[i].getAttribute("media") == "(prefers-color-scheme: light)") {
					metas[i].setAttribute("content", lighttheme);
				} else if (metas[i].getAttribute("media") == "(prefers-color-scheme: dark)") {
					metas[i].setAttribute("content", darktheme);
				}
			}
		}
	}
}

function setmetathemepopup(a) {
	const metas = document.getElementsByTagName("meta");
	var darktheme;
	var lighttheme;

	if (a == true) {
		// top status bar color => if popup is open
		darktheme = "#111111";
		lighttheme = "#7f7f7f";
	} else {
		darktheme = "#232323";
		lighttheme = "#ffffff";
	}

	let i, l = metas.length;
	for (i = 0; i < l; i++) {
		if (metas[i].getAttribute("name") == "theme-color") {
			if (metas[i].getAttribute("media")) {
				if (metas[i].getAttribute("media") == "(prefers-color-scheme: light)") {
					metas[i].setAttribute("content", lighttheme);
				} else if (metas[i].getAttribute("media") == "(prefers-color-scheme: dark)") {
					metas[i].setAttribute("content", darktheme);
				}
			}
		}
	}
}

/* Option page body action */
// Read current value settings
window.addEventListener("load", function () {
	// remove loading screen
	$("loading").style.display = "none";
});

document.addEventListener("DOMContentLoaded", domcontentloaded);

function domcontentloaded() {
	checkdarkmode();
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
		checkdarkmode();
	});

	// Add the YouTube player
	$("dont-turn-off-the-lights").src = youtubeembed;
	defaultgetsettings();
	yearnow();

	// Remove remember
	var sharetext = chrome.i18n.getMessage("sharetextd");
	var stefanvdurl = linkproduct;
	var stefanvdaacodeurl = encodeURIComponent(stefanvdurl);

	if ($("shareboxyoutube")) {
		$("shareboxyoutube").addEventListener("click", function () { window.open(linkyoutube, "_blank"); });
	}
	if ($("shareboxfacebook")) {
		$("shareboxfacebook").addEventListener("click", function () { window.open("https://www.facebook.com/sharer.php?u=" + stefanvdurl + "&t=" + sharetext + "", "Share to Facebook", "width=600,height=460,menubar=no,location=no,status=no"); });
	}
	if ($("shareboxtwitter")) {
		$("shareboxtwitter").addEventListener("click", function () { window.open("https://twitter.com/share?url=" + stefanvdaacodeurl + "&text=" + sharetext + "", "Share to Twitter", "width=600,height=460,menubar=no,location=no,status=no"); });
	}

	var isMenuClick = false;
	var menu = document.getElementById("dotmenu");
	document.addEventListener("click", () => {
		if (!isMenuClick) {
			// Hide the menu here
			$("dropmenu").className = "hide";
		}
		// Reset isMenuClick
		isMenuClick = false;
	});
	menu.addEventListener("click", () => {
		isMenuClick = true;
	});

	$("dotmenu").addEventListener("click", function () {
		if ($("dropmenu").className == "show") {
			$("dropmenu").className = "hide";
		} else {
			$("dropmenu").className = "show";
		}
	});

	$("darkpanel").addEventListener("click", function () {
		$("menuToggle").click();
	});

	$("titleex").addEventListener("click", function () {
		window.open(linkdeveloperwebsite);
	});

	$("btnsupport").addEventListener("click", function () {
		window.open(linksupport); $("dropmenu").className = "hide";
	});

	$("btnactivedarkmodeauto").addEventListener("click", function () {
		if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
			godarkmode();
		} else {
			golightmode();
		}
		seticonstyle(1, 0, 0);
		chrome.storage.sync.set({ "darkmode": 2 });
	});

	$("btnactivedarkmodeoff").addEventListener("click", function () {
		golightmode();
		seticonstyle(0, 1, 0);
		chrome.storage.sync.set({ "darkmode": 0 });
	});

	$("btnactivedarkmodeon").addEventListener("click", function () {
		godarkmode();
		seticonstyle(0, 0, 1);
		chrome.storage.sync.set({ "darkmode": 1 });
	});

	// promotion
	$("promotext").innerText = chrome.i18n.getMessage("donatetext");
	$("spnpromoaction").innerText = chrome.i18n.getMessage("donatecalltoaction");
	$("btnpromoaction").addEventListener("click", function () { window.open(linkdonate); });

	// Detect click / change to save the page and test it.
	var inputs = document.querySelectorAll("input");
	var i;
	var l = inputs.length;
	for (i = 0; i < l; i++) { inputs[i].addEventListener("change", test); inputs[i].addEventListener("change", ariacheck); inputs[i].addEventListener("change", save_options); }

	var select = document.querySelectorAll("select");
	var j;
	var m = select.length;
	for (j = 0; j < m; j++) { select[j].addEventListener("change", test); select[j].addEventListener("change", ariacheck); select[j].addEventListener("change", save_options); }

	// bookmark
	var bookmarkname = document.getElementsByClassName("bookmarkname");
	var f, x = bookmarkname.length;
	for (r = 0, x; f < x; f++) {
		bookmarkname[f].addEventListener("change", save_options);
	}
	var bookmarkurl = document.getElementsByClassName("bookmarkurl");
	var g, w = bookmarkurl.length;
	for (r = 0, w; g < w; g++) {
		bookmarkurl[g].addEventListener("change", save_options);
	}

	// show all the active permissions in a list
	chrome.runtime.sendMessage({ name: "getallpermissions" });

	// Close yellow bar
	$("managed-prefs-text-close").addEventListener("click", function () { $("managed-prefs-banner").style.display = "none"; });
	$("p0").addEventListener("click", function () {
		var custombrowser = "";
		if (exbrowser == "safari") { custombrowser = "/images/icon38.png"; } else { custombrowser = "/images/icon38.png"; }
		setpreviewicon(custombrowser);
	});
	$("p1").addEventListener("click", function () {
		var custombrowser = "";
		custombrowser = "/images/icon38white.png";
		setpreviewicon(custombrowser);
	});

	function setpreviewicon(a) {
		document.images["btnpreview"].setAttribute("data-icon", a); document.images["btnpreview"].src = a; save_options();
	}

	// save browser icon styles
	var buttoncolor = document.getElementsByClassName("buttoncolor");
	var r, v = buttoncolor.length;
	for (r = 0, v; r < v; r++) {
		buttoncolor[r].addEventListener("click", save_options);
	}

	var guidekb = true;
	function memguide() {
		if (guidekb == true) {
			// already visible
		} else {
			$("managed-prefs-banner").style.display = "";
		}
	}

	function mobilecheck() {
		if (window.innerWidth < 480) { $("menuToggle").click(); }
	}

	$("reveal-menu").addEventListener("click", function () {
		if (this.checked == true) {
			setmetatheme(true);
		} else {
			setmetatheme(false);
		}
	});

	$("removepermissionbookmark").addEventListener("click", function () {
		chrome.permissions.remove({
			permissions: ["bookmarks"]
		}, function (removed) {
			if (removed) {
				// The permissions have been removed.
				var txtpermission = chrome.i18n.getMessage("wpermissionremoved");
				window.alert(txtpermission);

				// set to default off
				$("opennonebookmarks").checked = true;
				$("openbrowserbookmarks").checked = false;
				$("openquickbookmarks").checked = false;
				save_options();
			} else {
				// The permissions have not been removed (e.g., you tried to remove
				// required permissions).
				var txtpermissionnot = chrome.i18n.getMessage("wpermissionnotremoved");
				window.alert(txtpermissionnot);
			}
		});
	});

	// Save KB download
	$("tabbasic").addEventListener("click", function () { Scrolltotop(); ONworkaroundbugpreview(); OFFworkaroundbugfromsafari(); $("welcomeguide").src = ""; memguide(); guidekb = true; mobilecheck(); });
	$("tabdesign").addEventListener("click", function () { Scrolltotop(); ONworkaroundbugpreview(); $("welcomeguide").src = ""; memguide(); guidekb = true; mobilecheck(); });
	$("tabadvan").addEventListener("click", function () { Scrolltotop(); ONworkaroundbugpreview(); $("welcomeguide").src = ""; memguide(); guidekb = true; mobilecheck(); });
	$("tabguide").addEventListener("click", function () { Scrolltotop(); ONworkaroundbugpreview(); $("welcomeguide").src = linkguide; $("managed-prefs-banner").style.display = "none"; guidekb = false; mobilecheck(); });
	$("tabhelp").addEventListener("click", function () { Scrolltotop(); ONworkaroundbugpreview(); $("welcomeguide").src = ""; memguide(); guidekb = true; mobilecheck(); });

	$("buttonreportissue").addEventListener("click", function () { window.open(linksupport); });
	$("buttonchangelog").addEventListener("click", function () { window.open(linkchangelog); });
	$("buttontranslateme").addEventListener("click", function () { window.open(linktranslate); });

	// scroll to top
	function Scrolltotop() { $("mainview").scrollTop = 0; }

	// remove all videos
	function ONworkaroundbugpreview() { $("dont-turn-off-the-lights").src = ""; }

	// add a video
	function OFFworkaroundbugfromsafari() {
		$("dont-turn-off-the-lights").src = youtubeembed;
	}

	// Add website
	eventsubmitFunc("formwebsite1", save_options);
	eventsubmitFunc("formwebsite2", save_options);
	eventsubmitFunc("formwebsite3", save_options);
	eventsubmitFunc("formwebsite4", save_options);
	eventsubmitFunc("formwebsite5", save_options);
	eventsubmitFunc("formwebsite6", save_options);
	eventsubmitFunc("formwebsite7", save_options);
	eventsubmitFunc("formwebsite8", save_options);
	eventsubmitFunc("formwebsite9", save_options);
	eventsubmitFunc("formwebsite10", save_options);

	// Reset settings
	$("resetbrowserextension").addEventListener("click", function () { chrome.storage.sync.clear(); chrome.runtime.sendMessage({ name: "bckreload" }); location.reload(); });

	// Review box
	$("war").addEventListener("click", function () { window.open(writereview, "_blank"); $("sectionreviewbox").style.display = "none"; chrome.storage.sync.set({ "reviewedlastonversion": chrome.runtime.getManifest().version }); });
	$("nt").addEventListener("click", function () { $("sectionreviewbox").style.display = "none"; chrome.storage.sync.set({ "reviewedlastonversion": chrome.runtime.getManifest().version }); });

	// search
	function emptysearch(input) {
		pageinsearch = false;
		input.blur();

		var sections = document.getElementsByTagName("section");
		var x;
		var l = sections.length;
		for (x = 0; x < l; x++) {
			var section = sections[x];
			section.classList.remove("searchfoundnothing");
		}

		// set view back to the current selected tab
		// and hide back all videos
		var y = document.getElementsByClassName("navbar-item-selected");
		y[0].click();
	}

	function textsearch(input) {
		if (pageinsearch == false) {
			pageinsearch = true;
			// load all the videos
			OFFworkaroundbugfromsafari();
		}

		// receive the total tab pages
		var tabListItems = $("navbar").childNodes;
		var tabListi;
		var tabListl = tabListItems.length;
		for (tabListi = 0; tabListi < tabListl; tabListi++) {
			if (tabListItems[tabListi].nodeName == "LI") {
				var tabLink = getFirstChildWithTagName(tabListItems[tabListi], "A");
				var id = getHash(tabLink.getAttribute("data-tab"));
				contentDivs[id] = document.getElementById(id);
			}
		}

		// show all tab pages
		var showaltabid;
		for (showaltabid in contentDivs) {
			if (showaltabid != "tab3") {
				if ((contentDivs[showaltabid])) {
					contentDivs[showaltabid].className = "page";
				}
			}
		}
		//---
		var searchword = input.value;

		var allsections = document.getElementsByTagName("section");
		var sectionsx;
		var sectionsl = allsections.length;
		for (sectionsx = 0; sectionsx < sectionsl; sectionsx++) {
			var partsection = allsections[sectionsx];
			var content = partsection.innerHTML;

			if (content.search(new RegExp(searchword, "i")) < 1) {
				partsection.classList.add("searchfoundnothing");
			} else {
				partsection.classList.remove("searchfoundnothing");
			}
		}

		// hide the h2 if there is no sections visible
		var pages = document.getElementsByClassName("page");
		var z;
		var tabpagelength = pages.length;
		for (z = 0; z < tabpagelength; z++) {
			var tabsections = pages[z].getElementsByTagName("section");
			var countnothingcheck = 0;
			var w;
			var q = tabsections.length;
			for (w = 0; w < q; w++) {
				var currenttabsection = tabsections[w];
				if (currenttabsection.classList.contains("searchfoundnothing")) {
					countnothingcheck += 1;
				}
			}
			if (countnothingcheck == tabsections.length) {
				// total sections with nothing inside is the same as all the section -> hide the page
				pages[z].classList.add("searchfoundnothing");
			} else {
				pages[z].classList.remove("searchfoundnothing");
			}
		}
	}
	var pageinsearch = false;
	function OnSearch(input) {
		if (input.value == "") {
			emptysearch(input);
		} else {
			textsearch(input);
		}
	}

	if (document.getElementById("appsearch")) {
		document.getElementById("appsearch").addEventListener("search", function () { OnSearch(this); }, false);
		document.getElementById("appsearch").addEventListener("input", function () { OnSearch(this); }, false);
		document.getElementById("btnsearchicon").addEventListener("input", function () { OnSearch(this); }, false);
		document.getElementById("appsearch").placeholder = chrome.i18n.getMessage("searchplaceholder");
	}

}
// 保存网址和名称的数组
var websiteList = [];

// 从存储中读取网址和名称
function loadWebsiteList() {
	var websiteListContainer = document.getElementById('websiteListContainer');
	websiteListContainer.innerHTML = ''; // 清空现有列表

	chrome.storage.sync.get('websiteList', function (result) {
		if (result.websiteList) {
			websiteList = result.websiteList;
			displayWebsiteList();
		} else {
			websiteList = [];
		}
	});
	// 加载后更新页面上的复选框状态
	websiteList.forEach(function (website, index) {
		var checkbox = document.getElementById('checkbox-' + index);
		if (checkbox) {
			checkbox.checked = website.checked;
		}
	});
}
// 保存网址和名称到存储
function saveWebsiteList() {
	chrome.storage.sync.set({ "websiteList": websiteList }, function () {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message);
		} else {
			// 确保在此处执行任何依赖于更新数组的操作
		}
		loadWebsiteList();
	});
}
// 添加网址和名称
function addWebsite() {
	var websiteName = document.getElementById("websiteNameInput").value;
	var websiteUrl = document.getElementById("websiteUrlInput").value;
	var isChecked = document.getElementById('checkbox-' + websiteName).checked; // 假设每个网站旁边有一个复选框
	if (websiteName && websiteUrl) {
		// 保存复选框状态
		var newWebsite = { name: websiteName, url: websiteUrl, checked: isChecked };
		websiteList.push(newWebsite);
		saveWebsiteList();
		displayWebsiteList(); // 显示网站列表
		clearInputs(); // 清空输入框
	}
}

// 删除网址和名称
function deleteWebsite(index) {
	websiteList.splice(index, 1);
	saveWebsiteList();
	displayWebsiteList(); // 刷新页面显示
}
function clearInputs() {
	document.getElementById("websiteNameInput").value = "";
	document.getElementById("websiteUrlInput").value = "";
}
function displayWebsiteList() {
	// 首先从chrome.storage.local获取保存的过滤器状态
	chrome.storage.local.get('selectedFilters', function (items) {
		if (items.selectedFilters && items.selectedFilters.length > 0) {
			// 恢复复选框的选中状态
			items.selectedFilters.forEach(function (filterValue) {
				var checkbox = document.querySelector('.filter-checkbox[value="' + filterValue + '"]');
				if (checkbox) {
					checkbox.checked = true;
				}
			});
		}
	});

	var websiteListContainer = document.getElementById('websiteListContainer');
	websiteListContainer.innerHTML = '';

	websiteList.forEach(function (website, index) {
		var listItem = document.createElement('li');
		var nameSpan = document.createElement('span');
		var editButton = document.createElement('button');
		var deleteButton = document.createElement('button');
		var checkbox = document.createElement('input');
		var exportButton = document.createElement('button');
		checkbox.type = 'checkbox';
		checkbox.id = 'checkbox-' + index; // 设置唯一ID以便后续引用
		checkbox.checked = website.checked; // 根据存储的状态设置复选框
		nameSpan.textContent = website.name;
		editButton.textContent = '编辑';
		deleteButton.textContent = '删除';
		exportButton.textContent = '导出JSON';

		checkbox.type = 'checkbox';
		checkbox.value = website.name;
		checkbox.addEventListener('change', function () {
			updateWebsiteCheckedStatus(website.name, this.checked);
		});

		listItem.appendChild(checkbox);
		listItem.appendChild(nameSpan);
		listItem.appendChild(editButton);
		listItem.appendChild(deleteButton);
		listItem.appendChild(exportButton);
		// 添加到列表容器
		websiteListContainer.appendChild(listItem);

		// 为删除按钮添加点击事件
		deleteButton.addEventListener('click', function () {
			deleteWebsite(index);
			displayWebsiteList();
		});
		//导出按钮添加点击事件
		exportButton.addEventListener('click', function () {
			exportWebsiteAsJSON(index); // 导出当前网站的JSON
		});
		// 为编辑按钮添加点击事件
		editButton.addEventListener('click', function () {
			editWebsite(index);
		});
	});

	// 获取website列表容器
	var websiteListContainer = document.getElementById('websiteListContainer');

	// 获取所有website项
	var websiteItems = websiteListContainer.getElementsByTagName('li');

	// 记录拖动的元素和放置的位置
	var draggedItem = null;
	var dropIndex = null;

	// 遍历website项，为每个项添加拖动事件处理程序
	for (var i = 0; i < websiteItems.length; i++) {
		websiteItems[i].draggable = true; // 启用拖动

		// 监听拖动开始事件
		websiteItems[i].addEventListener('dragstart', function (event) {
			draggedItem = this; // 记录拖动的元素
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', this.innerHTML);
		});

		// 监听拖动结束事件
		websiteItems[i].addEventListener('dragend', function (event) {
			// 重置拖动的元素和放置的位置
			draggedItem = null;
			dropIndex = null;
		});

		// 监听放置事件
		websiteItems[i].addEventListener('dragover', function (event) {
			event.preventDefault();
			this.classList.add('drag-over'); // 添加拖放时的样式
		});

		// 监听离开放置区域事件
		websiteItems[i].addEventListener('dragleave', function (event) {
			this.classList.remove('drag-over'); // 移除拖放时的样式
		});

		// 监听放置事件
		websiteItems[i].addEventListener('drop', function (event) {
			event.preventDefault();
			this.classList.remove('drag-over'); // 移除拖放时的样式

			// 获取放置的位置
			dropIndex = Array.from(websiteItems).indexOf(this);

			// 重新排序website项
			if (draggedItem && dropIndex !== null) {
				websiteListContainer.removeChild(draggedItem);
				websiteListContainer.insertBefore(draggedItem, websiteItems[dropIndex]);
			}
		});
	}

	// 更新内容的显示状态
	updateContents();
}// 更新筛选器
function updateFilters() {
	var selectedFilters = [];
	document.querySelectorAll('.filter-checkbox:checked').forEach(function (checkbox) {
		selectedFilters.push(checkbox.value);
	});

	chrome.storage.local.set({ selectedFilters: selectedFilters });
	var popup = document.querySelector('.search-popup');
	var searchLinksContainer = popup.querySelector('.search-links-container');
	var searchLinks = searchLinksContainer.querySelectorAll('.search-link');

	searchLinks.forEach(function (searchLink) {
		var websiteName = searchLink.getAttribute('data-website');
		if (selectedFilters.length === 0 || selectedFilters.includes(websiteName)) {
			searchLink.style.display = 'block';
		} else {
			searchLink.style.display = 'none';
		}
	});
}
// 更新搜索引擎

// 还需要添加 editWebsite 函数的实现
function editWebsite(index) {
	var newName = prompt('Enter new name for ' + websiteList[index].name + ':', websiteList[index].name);
	var newUrl = prompt('Enter new URL for ' + websiteList[index].url + ':', websiteList[index].url);

	if (newName && newUrl) { // 确保两个值都不为 null 且不为空字符串
		websiteList[index].name = newName;
		websiteList[index].url = newUrl;
		// 确保调用saveWebsiteList函数保存更改
		saveWebsiteList(); // 保存更改到浏览器存储
		displayWebsiteList(); // 刷新页面显示
	}
}

// 页面加载时调用
document.addEventListener('DOMContentLoaded', function () {
	loadSavedPages();
	loadEngines();
	//四类标签展示
	const settingsContainer = document.getElementById('searchEngineSettings');
	const tabs = document.querySelectorAll('.tab');
	const tabContent = document.getElementById('tabContent');

	// 应用样式
	applyStyles();

	// 切换标签
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			tabs.forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			loadTabContent(tab.dataset.category);
		});
	});

	// 加载标签内容
	function loadTabContent(category) {
		chrome.storage.sync.get('engineMap', function (data) {
			const engineMap = data.engineMap || {};
			const engines = engineMap[category] || {};

			let content = `
            <h2>${getCategoryName(category)}引擎</h2>
            <ul class="engine-list">
                ${Object.entries(engines).map(([name, url]) => `
                    <li>
                        ${name}: ${url}
                        <button class="delete-btn" data-name="${name}" data-category="${category}">删除</button>
                    </li>
                `).join('')}
            </ul>
            <div class="add-engine-form">
                <input type="text" id="${category}EngineName" placeholder="搜索引擎名称">
                <input type="text" id="${category}EngineUrl" placeholder="搜索引擎 URL">
                <button id="add${capitalize(category)}Engine">添加${getCategoryName(category)}引擎</button>
            </div>
        `;

			document.getElementById('tabContent').innerHTML = content;

			// 添加新引擎的事件监听器
			document.getElementById(`add${capitalize(category)}Engine`).addEventListener('click', () => addEngine(category));

			// 删除引擎的事件监听器
			document.querySelectorAll('.delete-btn').forEach(btn => {
				btn.addEventListener('click', function () {
					deleteEngine(this.dataset.category, this.dataset.name);
				});
			});
		});
	}

	

	function deleteEngine(category, name) {
		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			let engineMap = data.engineMap || {};
			let globalId2enginemap = data.id2enginemap || {};
			const fullEngineName = `${category}_${name}`;

			if (engineMap[category] && engineMap[category][name]) {
				delete engineMap[category][name];
				delete globalId2enginemap[fullEngineName];

				chrome.storage.sync.set({
					'engineMap': engineMap,
					'id2enginemap': globalId2enginemap
				}, function () {
					if (chrome.runtime.lastError) {
						console.error('删除搜索引擎时发生错误:', chrome.runtime.lastError);
						alert('删除搜索引擎时发生错误，请重试。');
					} else {
						alert('搜索引擎删除成功！');
						loadEngines(category); // 重新加载当前分类的内容
					}
				});
			}
		});
	}
	// 添加搜索引擎
	function addEngine(category) {
		const engineName = document.getElementById(`${category}EngineName`).value.trim();
		const engineUrl = document.getElementById(`${category}EngineUrl`).value.trim();

		if (!engineName || !engineUrl) {
			alert('搜索引擎名称和URL不能为空！');
			return;
		}

		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			let engineMap = data.engineMap || {};
			let globalId2enginemap = data.id2enginemap || {};

			if (!engineMap[category]) {
				engineMap[category] = {};
			}

			const fullEngineName = `${category}_${engineName}`;

			if (engineMap[category][engineName] || globalId2enginemap[fullEngineName]) {
				alert('该搜索引擎名称已存在，请使用其他名称。');
				return;
			}

			engineMap[category][engineName] = engineUrl;
			globalId2enginemap[fullEngineName] = engineUrl;

			chrome.storage.sync.set({
				'id2enginemap': globalId2enginemap,
				'engineMap': engineMap
			}, function () {
				if (chrome.runtime.lastError) {
					console.error('添加搜索引擎时发生错误:', chrome.runtime.lastError);
					alert('添加搜索引擎时发生错误，请重试。');
				} else {
					alert(`${getCategoryName(category)}引擎添加成功！`);
					loadEngines(category); // 重新加载列表以显示新添加的项
				}
			});

			// 清空输入框
			document.getElementById(`${category}EngineName`).value = '';
			document.getElementById(`${category}EngineUrl`).value = '';
		});
	}

	// 监听存储变化
	chrome.storage.onChanged.addListener(function (changes, namespace) {
		if (namespace === 'sync' && changes.engineMap) {
			loadTabContent(document.querySelector('.tab.active').dataset.category);
		}
	});

	// 辅助函数
	function getCategoryName(category) {
		const names = {
			ai: 'AI 搜索',
			image: '图片搜索',
			regular: '综合搜索',
			custom: '自定义搜索'
		};
		return names[category] || category;
	}

	function capitalize(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	// 应用样式
	function applyStyles() {
		const styles = `
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #121212;
            color: #ffffff;
        }
        #searchEngineSettings {
            max-width: 800px;
            margin: 0 auto;
            background-color: #1e1e1e;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .tabs {
            display: flex;
            background-color: #2c2c2c;
            border-bottom: 1px solid #3a3a3a;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 14px;
            color: #b0b0b0;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        .tab:hover {
            background-color: #3a3a3a;
        }
        .tab.active {
            border-bottom: 3px solid #4285f4;
            color: #4285f4;
        }
        .tab-content {
            padding: 20px;
        }
        .engine-list {
            list-style-type: none;
            padding: 0;
        }
        .engine-list li {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #2c2c2c;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .engine-list li span {
            display: flex;
            align-items: center;
            height: 100%;
        }
        .add-engine-form {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #3a3a3a;
        }
        input[type="text"] {
            width: calc(50% - 10px);
            padding: 8px;
            margin-right: 10px;
            margin-bottom: 10px;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            background-color: #2c2c2c;
            color: #ffffff;
        }
        button {
            padding: 8px 16px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }
        button:hover {
            background-color: #3367d6;
        }
    `;

		// 创建 style 元素并添加到 head
		const styleElement = document.createElement('style');
		styleElement.textContent = styles;
		document.head.appendChild(styleElement);
	}
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        loadTabContent(this.dataset.category);
    });
});

	// 初始化：加载默认标签内容
	loadTabContent('ai');
	const customSearchEngineNameInput = document.getElementById('customSearchEngineName');
	const customSearchEngineUrlInput = document.getElementById('customSearchEngineUrl');
	const addCustomSearchEngineButton = document.getElementById('addCustomSearchEngineButton');
	const customSearchEngineList = document.getElementById('customSearchEngineList');


	let customSearchEngines = [];

 function renderCustomSearchEngines() {
        customSearchEngineList.innerHTML = '';
        customSearchEngines.forEach((engine, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${engine.name} - ${engine.url}</span>
                <button class="edit-button" data-index="${index}">编辑</button>
                <button class="delete-button" data-index="${index}">删除</button>
            `;
            customSearchEngineList.appendChild(li);
        });

        // 绑定编辑和删除按钮的事件处理程序
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                editCustomSearchEngine(index);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function () {
                const index = this.getAttribute('data-index');
                deleteCustomSearchEngine(index);
            });
        });
    }

    function addCustomSearchEngine() {
        const name = customSearchEngineNameInput.value.trim();
        const url = customSearchEngineUrlInput.value.trim();
        if (name && url) {
            customSearchEngines.push({ name, url });
            customSearchEngineNameInput.value = '';
            customSearchEngineUrlInput.value = '';
            saveCustomSearchEngines();
            renderCustomSearchEngines();
        }
    }

    function editCustomSearchEngine(index) {
        const newName = prompt('编辑搜索名称', customSearchEngines[index].name);
        const newUrl = prompt('编辑搜索网址', customSearchEngines[index].url);
        if (newName && newUrl) {
            customSearchEngines[index] = { name: newName, url: newUrl };
            saveCustomSearchEngines();
            renderCustomSearchEngines();
        }
    }

    function deleteCustomSearchEngine(index) {
        customSearchEngines.splice(index, 1);
        saveCustomSearchEngines();
        renderCustomSearchEngines();
    }

    function saveCustomSearchEngines() {
        chrome.storage.sync.set({ customSearchEngines: customSearchEngines }, function () {
            console.log('Custom search engines saved.');
        });
    }

    function loadCustomSearchEngines() {
        chrome.storage.sync.get('customSearchEngines', function (data) {
            if (data.customSearchEngines) {
                customSearchEngines = data.customSearchEngines;
                renderCustomSearchEngines();
            }
        });
    }

    addCustomSearchEngineButton.addEventListener('click', addCustomSearchEngine);
    window.editCustomSearchEngine = editCustomSearchEngine;
    window.deleteCustomSearchEngine = deleteCustomSearchEngine;

    loadCustomSearchEngines();

	const longPressCheckbox = document.getElementById('longPressCheckbox');
	const ctrlSelectCheckbox = document.getElementById('ctrlSelectCheckbox');

	// 加载保存的设置
	chrome.storage.sync.get(['longPressEnabled', 'ctrlSelectEnabled'], function (result) {
		longPressCheckbox.checked = result.longPressEnabled ?? true;
		ctrlSelectCheckbox.checked = result.ctrlSelectEnabled ?? true;
	});

	// 保存设置变更
	longPressCheckbox.addEventListener('change', function () {
		saveSettings();
	});

	ctrlSelectCheckbox.addEventListener('change', function () {
		saveSettings();
	});

	function saveSettings() {
		const settings = {
			longPressEnabled: longPressCheckbox.checked,
			ctrlSelectEnabled: ctrlSelectCheckbox.checked
		};
		chrome.storage.sync.set(settings, function () {
			// 通知 background.js 设置已更新
			chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: settings });
		});
	}
	document.getElementById('shortcutLink').addEventListener('click', function () {
		// 尝试打开 Chrome 扩展快捷键设置页面
		chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
	}); 
	document.getElementById('panellink').addEventListener('click', function () {
		// 尝试打开 Chrome 扩展快捷键设置页面
		chrome.tabs.create({ url: "chrome://settings/appearance" });
	});

	// 绑定添加搜索引擎按钮的点击事件
	var addEngineButton = document.getElementById('addEngineButton');
	addEngineButton.addEventListener('click', addEngine);
	const directionSearchToggle = document.getElementById('directionSearchToggle');

	// 加载时设置开关状态
	chrome.storage.sync.get('directionSearchEnabled', function (items) {
		directionSearchToggle.checked = items.directionSearchEnabled || false;
	});

	// 监听开关状态变化
	directionSearchToggle.addEventListener('change', function () {
		let isChecked = this.checked; // 保留对当前状态的引用
		chrome.storage.sync.set({ 'directionSearchEnabled': isChecked });
		// 发送消息给所有标签页，通知它们更新方向搜索的状态
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			for (let tab of tabs) {
				chrome.tabs.sendMessage(tab.id, {
					action: 'updateDirectionSearchStatus',
					enabled: isChecked
				});
			}
		});
	});
	chrome.storage.sync.get('savedPages', function (items) {
		if (items.savedPages) {
			var savedPages = items.savedPages;
			var savedPagesList = document.getElementById('savedPagesList');

			// 清空现有的列表
			savedPagesList.innerHTML = '';

			// 创建列表项并添加到列表中
			var listItem = document.createElement('li');
			listItem.textContent = `Homepage: ${savedPages.homepageName} - ${savedPages.homepageUrl}`;
			savedPagesList.appendChild(listItem);

			listItem = document.createElement('li');
			listItem.textContent = `Sidebar: ${savedPages.sidebarName} - ${savedPages.sidebarUrl}`;
			savedPagesList.appendChild(listItem);

			// 绑定编辑和删除事件
			// 这里需要添加更多的逻辑来实现编辑和删除功能
		}
	});
	var btnLightTheme = document.getElementById('btnLightTheme');
	var btnDarkTheme = document.getElementById('btnDarkTheme');

	btnLightTheme.addEventListener('click', function () {
		// 实现浅色主题的切换逻辑
		golightmode(); // 切换主题的函数（如果有）
		chrome.storage.sync.set({ "darkmode": 0 }); // 保存主题设置
	});

	btnDarkTheme.addEventListener('click', function () {
		// 实现暗色主题的切换逻辑
		godarkmode(); // 切换主题的函数（如果有）
		chrome.storage.sync.set({ "darkmode": 1 }); // 保存主题设置
	});
	var searchEngineList = document.getElementById('searchEngineList');
	// 获取按钮元素
	var exportButton = document.getElementById('export-json-button');
	var importButton = document.getElementById('import-json-button');
	importButton.addEventListener('click', importWebsiteListFromJSON);
	// 为按钮添加点击事件监听器
	exportButton.addEventListener('click', function () {
		exportWebsiteListAsJSON(); // 调用导出函数
	});
	restoreCheckboxStatus().then(selectedEngines => {
		searchEngineData.forEach(function (engine) {
			var label = document.createElement('label');
			var checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.className = 'search-engine-checkbox';
			checkbox.value = engine.name;
			checkbox.setAttribute('data-urlbase', engine.urlbase);

			// 设置复选框的选中状态
			checkbox.checked = selectedEngines.some(selected => selected.name === engine.name);

			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(' ' + engine.name));
			searchEngineList.appendChild(label);
		});

		// 添加事件监听器以保存更改
		searchEngineList.addEventListener('change', saveCheckboxStatus);
	});
	// 保存复选框状态
	function saveCheckboxStatus() {
		var checkboxes = document.getElementsByClassName("search-engine-checkbox");

		for (var i = 0; i < checkboxes.length; i++) {
			var checkbox = checkboxes[i];
			if (checkbox.checked) {
				selectedEngines.push({
					name: checkbox.value,
					urlBase: checkbox.getAttribute('data-urlbase')
				});
			}
		}

		chrome.storage.sync.set({ selectedEngines: selectedEngines }, function () {
			console.log('Selected engines saved:', selectedEngines);
		});
	}
	// 恢复复选框状态
	function restoreCheckboxStatus() {
		return new Promise((resolve) => {
			chrome.storage.sync.get("selectedEngines", function (result) {
				console.log('Retrieved selectedEngines:', result.selectedEngines);
				var selectedEngines = result.selectedEngines || [];

				var checkboxes = document.getElementsByClassName("search-engine-checkbox");
				console.log('Found checkboxes:', checkboxes.length);

				for (var i = 0; i < checkboxes.length; i++) {
					var checkbox = checkboxes[i];
					var isChecked = selectedEngines.some(engine => engine.name === checkbox.value);
					console.log(`Checkbox ${checkbox.value}: ${isChecked ? 'checked' : 'unchecked'}`);
					checkbox.checked = isChecked;
				}

				resolve(selectedEngines);
			});
		});
	}
	// 保存复选框状态
	document.getElementById("searchEngineList").addEventListener("change", saveCheckboxStatus);

	// 页面加载时恢复复选框状态
	restoreCheckboxStatus();
	chrome.storage.sync.get('selectedEngines', function (items) {
		if (items.selectedEngines) {
			// 确保selectedEngines被正确加载后，再进行其他操作
			updateCheckboxes(items.selectedEngines);
		}
	});
	// 读取复选框状态并设置到页面上的复选框
	chrome.storage.sync.get(['copyCheckbox', 'deleteCheckbox', 'jumpCheckbox', 'closeCheckbox', 'refreshCheckbox', 'pasteCheckbox', 'downloadCheckbox', 'closesidepanelCheckbox'], function (items) {
		if (items.copyCheckbox !== undefined) {
			document.getElementById('copyCheckbox').checked = items.copyCheckbox;
		}
		if (items.deleteCheckbox !== undefined) {
			document.getElementById('deleteCheckbox').checked = items.deleteCheckbox;
		}
		if (items.jumpCheckbox !== undefined) {
			document.getElementById('jumpCheckbox').checked = items.jumpCheckbox;
		}
		if (items.closeCheckbox !== undefined) {
			document.getElementById('closeCheckbox').checked = items.closeCheckbox;
		}
		if (items.refreshCheckbox !== undefined) {
			document.getElementById('refreshCheckbox').checked = items.refreshCheckbox;
		}
		if (items.pasteCheckbox !== undefined) {
			document.getElementById('pasteCheckbox').checked = items.pasteCheckbox;
		}
		if (items.downloadCheckbox !== undefined) {
			document.getElementById('downloadCheckbox').checked = items.downloadCheckbox;
		}
		if (items.closesidepanelCheckbox !== undefined) {
			document.getElementById('closesidepanelCheckbox').checked = items.closesidepanelCheckbox;
		}
	});
	// 为每个复选框添加 "change" 事件监听器，以保存更改的状态
	document.querySelectorAll('.engine-checkbox').forEach(checkbox => {
		checkbox.addEventListener('change', function () {
			// 获取搜索引擎名称和URL
			const name = checkbox.getAttribute('data-name');
			const urlBase = checkbox.getAttribute('data-urlbase');
			// 更新搜索引擎的状态
			searchEngineList.forEach(engine => {
				if (engine.name === name && engine.urlBase === urlBase) {
					engine.checked = checkbox.checked;
				}
			});
			// 保存更新后的搜索引擎列表到Chrome存储
			chrome.storage.sync.set({ selectedEngines: searchEngineList });
		});
	});
	// 为复选框添加change事件监听器，以保存状态
	document.getElementById('copyCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'copyCheckbox': this.checked });
	});
	document.getElementById('deleteCheckbox').addEventListener('change', function () { chrome.storage.sync.set({ 'deleteCheckbox': this.checked }); });
	document.getElementById('jumpCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'jumpCheckbox': this.checked });
	});

	document.getElementById('closeCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'closeCheckbox': this.checked });
	});
	document.getElementById('refreshCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'refreshCheckbox': this.checked });
	});
	document.getElementById('pasteCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'pasteCheckbox': this.checked });
	});
	document.getElementById('downloadCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'downloadCheckbox': this.checked });
	});
	document.getElementById('closesidepanelCheckbox').addEventListener('change', function () {
		chrome.storage.sync.set({ 'closesidepanelCheckbox': this.checked });
	});
	// 在contents.js中，适当位置初始化selectedSearchEngines
	// 加载用户勾选的搜索引擎
	chrome.storage.sync.get('selectedSearchEngines', function (result) {
		selectedSearchEngines = result.selectedSearchEngines || [];
		// 确保selectedSearchEngines被正确加载后，再进行其他操作
	});

	// 从存储中读取复选框状态
	chrome.storage.sync.get('websiteList', function (result) {
		if (result.websiteList) {
			websiteList = result.websiteList;
			websiteList.forEach(function (website) {
				var checkbox = document.getElementById('checkbox-' + website.name);
				if (checkbox) {
					checkbox.checked = website.checked;
				}
			});
		}
	});
	// 从本地存储中获取保存的搜索引擎
	chrome.storage.local.get(['searchEngines'], function (result) {
		var searchEngines = result.searchEngines || [];

		// 根据保存的搜索引擎更新选项页面的勾选状态
		searchEngines.forEach(function (engine) {
			var checkbox = document.querySelector('input[type="checkbox"][value="' + engine.name + '"]');
			if (checkbox) {
				checkbox.checked = engine.selected;
			}
		});

		// 通知contents.js更新搜索引擎
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			var activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, { action: 'updateSearchEngines', searchEngines: searchEngines });
		});
	});
	loadWebsiteList(); // 使用修正后的 loadWebsiteList 函数加载已保存的网站列表
	let addWebsiteButton = document.getElementById('addWebsiteButton');
	let websiteNameInput = document.getElementById('websiteNameInput');
	let websiteUrlInput = document.getElementById('websiteUrlInput');
	let websiteListContainer = document.getElementById('websiteListContainer');
	document.querySelectorAll('.filter-checkbox').forEach((checkbox, index) => {
		checkbox.addEventListener('change', function () {
			let isChecked = this.checked;
			websiteList[index].checked = isChecked; // 更新勾选状态
			saveWebsiteList(); // 保存更新后的列表到Chrome存储
		});
	});

	// 保存websiteList到Chrome存储的函数
	function saveWebsiteList() {
		chrome.storage.sync.set({ "websiteList": websiteList }, function () {
			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError.message);
			} else {
				console.log("Website list updated successfully.");
			}
		});
	}


	// 添加新网站并保存addWe
	addWebsiteButton.addEventListener('click', function () {
		let websiteName = websiteNameInput.value.trim();
		let websiteUrl = websiteUrlInput.value.trim();

		if (websiteName && websiteUrl) {
			// 从存储中读取最新数据
			chrome.storage.sync.get('websiteList', function (result) {
				let websites = result.websiteList || [];
				websites.push({ name: websiteName, url: websiteUrl });
				chrome.storage.sync.set({ websiteList: websites }, function () {
					if (chrome.runtime.lastError) {
						console.error(chrome.runtime.lastError.message);
					} else {
						loadWebsiteList(); // 使用最新数据重新加载网站列表
						websiteNameInput.value = '';
						websiteUrlInput.value = '';
					}
				});
			});
		} else {
			alert('Please enter both a name and a URL.');
		}
	});
	function addWebsiteToList(name, url, index) {
		var listItem = document.createElement('li');
		var nameSpan = document.createElement('span');
		var urlSpan = document.createElement('span');
		var editButton = document.createElement('button');
		var deleteButton = document.createElement('button');

		nameSpan.textContent = name;
		urlSpan.textContent = url;
		editButton.textContent = '编辑';
		deleteButton.textContent = '删除';

		// 将元素添加到列表项
		listItem.appendChild(nameSpan);
		listItem.appendChild(urlSpan);
		listItem.appendChild(editButton);
		listItem.appendChild(deleteButton);

		// 为删除按钮添加点击事件
		deleteButton.addEventListener('click', function () {
			deleteWebsite(index);
			displayWebsiteList(); // 更新列表
		});

		// 为编辑按钮添加点击事件
		editButton.addEventListener('click', function () {
			editWebsite(index); // 执行编辑操作
		});

		websiteListContainer.appendChild(listItem); // 添加到列表容器
	}
	// 还需要添加 editWebsite 函数的实现

})
function updateWebsiteCheckedStatus(name, isChecked) {
	// 查找网站列表中对应的网站并更新勾选状态
	for (var i = 0; i < websiteList.length; i++) {
		if (websiteList[i].name === name) {
			websiteList[i].checked = isChecked;
			break;
		}
	}

	// 保存更新后的列表到Chrome存储
	chrome.storage.sync.set({ "websiteList": websiteList }, function () {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message);
		} else {
			console.log("Website list updated successfully.");
		}
	});
}

// 获取复选框的状态
var copyCheckbox = document.getElementById('copyCheckbox');
var deleteCheckbox = document.getElementById('deleteCheckbox');
var jumpCheckbox = document.getElementById('jumpCheckbox');
var closeCheckbox = document.getElementById('closeCheckbox');
var refreshCheckbox = document.getElementById('refreshCheckbox');
var pasteCheckbox = document.getElementById('pasteCheckbox');
var downloadCheckbox = document.getElementById('downloadCheckbox');
var closesidepanelCheckbox = document.getElementById('closesidepanelCheckbox');
// 更新搜索引擎选项
chrome.runtime.sendMessage({
	action: 'updateSearchEngines',
	/* copyOption: copyCheckbox.checked,
	deleteOption: deleteCheckbox.checked,
	jumpOption: jumpCheckbox.checked,
	closeOption: closeCheckbox.checked,
	refreshOption: refreshCheckbox.checked,
	downloadOption: downloadCheckbox.checked,
	pasteOption: pasteCheckbox.checked,
	closesidepanelOption: closesidepanelCheckbox.checked */
});
// 定义搜索引擎数据数组
var searchEngineData = [
	{ name: "Google", urlbase: "https://www.google.com/search?q=", checked: true },
	{ name: "Bing", urlbase: "https://www.bing.com/search?q=", checked: false },
	{ name: "DuckDuckGo", urlbase: "https://duckduckgo.com/?q=", checked: false },
	{ name: "Baidu", urlbase: "https://www.baidu.com/s?wd=", checked: false },
	{ name: "Yandex", urlbase: "https://yandex.com/search/?text=", checked: false },
	{ name: "Deepl", urlbase: "https://www.deepl.com/zh/translator#en/zh-hans/", checked: false },
	{ name: "Doubao", urlbase: "https://www.doubao.com/chat/", checked: false },
	{ name: "Download", urlbase: "https://9xbuddy.in/process?url=", checked: false },
	{ name: "Tongyi", urlbase: "https://tongyi.aliyun.com/qianwen/", checked: false },
	{ name: "Doubao", urlbase: "https://www.doubao.com/chat/", checked: false },
	{ name: "Kimi", urlbase: "https://kimi.moonshot.cn/", checked: false },
	{ name: "Yuanbao", urlbase: "https://yuanbao.tencent.com/bot/chat", checked: false },
	{ name: "Mita", urlbase: "https://metaso.cn/", checked: false },
	{ name: "Yiyan", urlbase: "https://yiyan.baidu.com/", checked: false },
	{ name: "Poe", urlbase: "https://poe.com/ChatGPT", checked: false },
	{ name: "Perplexity", urlbase: "https://www.perplexity.ai/", checked: false },
	{ name: "Chatgpt", urlbase: "https://chatgpt.com/", checked: false },
	{ name: "Gemini", urlbase: "https://gemini.google.com/", checked: false },
	{ name: "bookmarks", urlbase: "https://v.flomoapp.com/", checked: false },
];


// 获取搜索引擎复选框元素列表
var checkboxList = document.querySelectorAll(".search-engine-checkbox");

// 遍历搜索引擎复选框元素列表，并绑定搜索引擎数据
for (var i = 0; i < checkboxList.length; i++) {
	var checkbox = checkboxList[i];
	var engine = searchEngineData[i];

	checkbox.value = engine.name;
	checkbox.checked = selectedEngines.some(selected => selected.name === engine.name && selected.checked);
	checkbox.nextElementSibling.textContent = engine.name;
	checkbox.setAttribute('data-urlbase', engine.urlbase);
}
// 假设 selectedEngines 已经在全局作用域中声明：


// 保存选中的搜索引擎到Chrome存储，并更新全局变量selectedEngines
function saveCheckboxStatus() {
	var checkboxes = document.getElementsByClassName("search-engine-checkbox");

	for (var i = 0; i < checkboxes.length; i++) {
		var checkbox = checkboxes[i];
		if (checkbox.checked) {
			var engine = searchEngineData.find(e => e.name === checkbox.value);
			if (engine) {
				selectedEngines.push({
					name: engine.name,
					urlBase: engine.urlbase
				});
			}
		}
	}

	chrome.storage.sync.set({ selectedEngines: selectedEngines }, function () {
		console.log('Selected engines saved:', selectedEngines);
	});

	// 发送消息更新 content script 中的 selectedEngines
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {
			action: 'updateSelectedEngines',
			selectedEngines: selectedEngines
		});
	});
}
// 在options.js文件中添加以下函数
// 在options.js中实现以下函数
function exportWebsiteListAsJSON() {
	var websiteListJSON = JSON.stringify(websiteList, null, 2); // 转换为JSON字符串，并格式化
	var blob = new Blob([websiteListJSON], { type: 'application/json' }); // 创建Blob对象
	var url = URL.createObjectURL(blob); // 创建下载链接

	// 创建一个隐藏的下载链接元素
	var downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = 'websiteList.json'; // 设置下载文件名
	document.body.appendChild(downloadLink); // 将下载链接添加到DOM中
	downloadLink.click(); // 模拟点击下载
	document.body.removeChild(downloadLink); // 下载后移除下载链接
	URL.revokeObjectURL(url); // 释放URL对象
}
function importWebsiteListFromJSON() {
	// 创建一个文件输入元素
	var input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';

	input.addEventListener('change', function (e) {
		var file = e.target.files[0];
		if (file) {
			var reader = new FileReader();

			reader.onload = function (e) {
				// 将读取到的内容解析为JSON
				var websites = JSON.parse(e.target.result);

				// 更新websiteList并保存到Chrome存储
				if (Array.isArray(websites)) {
					chrome.storage.sync.set({ "websiteList": websites }, function () {
						if (chrome.runtime.lastError) {
							console.error(chrome.runtime.lastError.message);
						} else {
							console.log("Website list imported successfully.");
							// 刷新页面或更新UI以显示新导入的网站
							loadWebsiteList(); // 假设这是用于加载和显示网站列表的函数
						}
					});
				}
			};

			reader.readAsText(file);
		}
	});

	input.click(); // 触发文件选择对话框
} function exportWebsiteAsJSON(index) {
	var website = websiteList[index];
	var websiteJSON = JSON.stringify(website, null, 2); // 将网站对象转换为 JSON 字符串

	// 创建一个 Blob 对象，包含 JSON 字符串数据
	var blob = new Blob([websiteJSON], { type: 'application/json' });

	// 创建一个下载链接的 URL
	var url = URL.createObjectURL(blob);

	// 创建一个隐藏的下载链接元素
	var downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = 'website_' + index + '.json'; // 设置下载文件名

	// 将下载链接添加到文档中，但不显示
	document.body.appendChild(downloadLink);

	// 模拟点击下载链接
	downloadLink.click();

	// 下载完成后，移除下载链接并释放 URL 对象
	document.body.removeChild(downloadLink);
	URL.revokeObjectURL(url);
}
// 粘贴按钮元素
var pasteButton = document.getElementById("btnpaste");

// 初始化粘贴按钮
pasteButton.addEventListener("click", async function () {
	try {
		// 获取剪贴板内容
		const clipboardText = await navigator.clipboard.readText();

		// 显示剪贴板内容预览
		document.getElementById("clipboardPreview").textContent = clipboardText;
		document.getElementById("clipboardPreview").style.display = "block";
	} catch (err) {
		console.error("Failed to read clipboard contents: ", err);
	}
});

// 清除剪贴板预览内容
document.getElementById("clipboardPreviewClose").addEventListener("click", function () {
	document.getElementById("clipboardPreview").style.display = "none";
	document.getElementById("clipboardPreview").textContent = "";
});
// 获取新按钮的DOM引用
var btnLightTheme = document.getElementById('btnLightTheme');
var btnDarkTheme = document.getElementById('btnDarkTheme');

// 为浅色主题按钮添加点击事件
btnLightTheme.addEventListener('click', function () {
	golightmode(); // 切换到浅色主题的函数
	chrome.storage.sync.set({ "darkmode": 0 }); // 保存设置
});

// 为暗色主题按钮添加点击事件
btnDarkTheme.addEventListener('click', function () {
	godarkmode(); // 切换到暗色主题的函数
	chrome.storage.sync.set({ "darkmode": 1 }); // 保存设置
});
function loadSavedPages() {
	chrome.storage.sync.get('savedPages', function (items) {
		var savedPagesList = document.getElementById('savedPagesList');
		if (items.savedPages) {
			var savedPages = items.savedPages;
			var listHtml = '';
			// 首先清空现有的列表
			savedPagesList.innerHTML = '';


			// 然后将生成的HTML添加到列表中
			savedPagesList.innerHTML = listHtml;
			// 新增代码：为 "openAllSavedPages" 按钮添加事件监听器
			var openAllButton = document.getElementById('openAllSavedPages');
			openAllButton.addEventListener('click', function () {
				// 发送消息请求 background.js 打开主页和侧边栏的页面
				chrome.runtime.sendMessage({
					action: 'openHomepageAndSidebar',
					urls: {
						homepageUrl: savedPages.homepageUrl,  // 主页网址
						sidebarUrl: savedPages.sidebarUrl    // 侧边栏网址
					}
				});
			});


		}
	});
}// 增加方向搜索引擎对应的数组// 更新所有下拉列表的函数
function updateAllEngineLists() {
	const lists = document.querySelectorAll('select');
	lists.forEach(list => {
		list.innerHTML = ""; // 清空现有选项
		Object.keys(globalId2enginemap).forEach(engineName => {
			const option = document.createElement('option');
			option.textContent = engineName;
			option.value = engineName;
			list.appendChild(option);
		});
	});
}// 添加新的搜索引擎
function addEngine() {
	var engineName = document.getElementById('addEngineName').value.trim();
	var engineUrl = document.getElementById('addEngineUrl').value.trim();

	if (!engineName || !engineUrl) {
		alert('搜索引擎名称和URL不能为空！');
		return;
	}

	if (globalId2enginemap[engineName]) {
		alert('该搜索引擎名称已存在，请使用其他名称。');
		return;
	}

	// 更新全局变量和存储
	globalId2enginemap[engineName] = engineUrl;
	chrome.storage.sync.set({ 'id2enginemap': globalId2enginemap }, function () {
		if (chrome.runtime.lastError) {
			console.error('添加搜索引擎时发生错误:', chrome.runtime.lastError);
			alert('添加搜索引擎时发生错误，请重试。');
		} else {
			alert('搜索引擎添加成功！');
			loadEngines(); // 重新加载列表以显示新添加的项
		}
	});
	document.getElementById('addEngineName').value = '';
	document.getElementById('addEngineUrl').value = '';
}

// 用这个新函数替换
function loadEngines(category) {
	var list = document.getElementById('engineList');
	list.innerHTML = ''; // 清空现有列表

	chrome.storage.sync.get(['id2enginemap', 'engineMap'], function (data) {
		const globalId2enginemap = data.id2enginemap || {};
		const engineMap = data.engineMap || {};

		// 如果存在新的分类结构，使用它
		if (engineMap[category]) {
			Object.keys(engineMap[category]).forEach(function (engineName) {
				addEngineToList(engineName, engineMap[category][engineName], category, list);
			});
		} else {
			// 否则，使用旧的全局结构，但根据名称前缀进行过滤
			Object.keys(globalId2enginemap).forEach(function (engineName) {
				if (engineName.startsWith(category + '_')) {
					addEngineToList(engineName, globalId2enginemap[engineName], category, list);
				}
			});
		}
	});
}

// 添加这个新函数
function addEngineToList(engineName, engineUrl, category, list) {
	var item = document.createElement('li');
	item.textContent = engineName + ': ' + engineUrl;
	var removeButton = document.createElement('button');
	removeButton.textContent = '删除';
	removeButton.onclick = function () {
		chrome.storage.sync.get(['id2enginemap', 'engineMap'], function (data) {
			let globalId2enginemap = data.id2enginemap || {};
			let engineMap = data.engineMap || {};

			if (engineMap[category]) {
				delete engineMap[category][engineName];
			} else {
				delete globalId2enginemap[engineName];
			}

			chrome.storage.sync.set({
				'id2enginemap': globalId2enginemap,
				'engineMap': engineMap
			}, function () {
				if (chrome.runtime.lastError) {
					alert('删除搜索引擎时发生错误，请重试。');
				} else {
					alert('搜索引擎删除成功！');
					loadEngines(category); // 重新加载列表
				}
			});
		});
	};
	item.appendChild(removeButton);
	list.appendChild(item);
}

// 加载当前搜索引擎列表
function loadCurrentSearchEngines() {
	chrome.storage.sync.get('id2enginemap', function (data) {
		const currentEnginesDiv = document.getElementById('currentSearchEngines');
		currentEnginesDiv.innerHTML = '';
		const engines = data.id2enginemap || {};

		Object.entries(engines).forEach(([name, url]) => {
			const engineDiv = document.createElement('div');
			engineDiv.innerHTML = `
                <span>${name}: ${url}</span>
                <button class="editSearchEngine" data-name="${name}">编辑</button>
                <button class="deleteSearchEngine" data-name="${name}">删除</button>
            `;
			currentEnginesDiv.appendChild(engineDiv);
		});
	});
}

// 编辑搜索引擎
function editSearchEngine(name) {
	chrome.storage.sync.get('id2enginemap', function (data) {
		const engines = data.id2enginemap || {};
		const url = engines[name];
		if (url) {
			document.getElementById('newCustomEngineName').value = name;
			document.getElementById('newCustomEngineUrl').value = url;
		}
	});
}

// 删除搜索引擎
function deleteSearchEngine(name) {
	chrome.storage.sync.get('id2enginemap', function (data) {
		const engines = data.id2enginemap || {};
		delete engines[name];
		chrome.storage.sync.set({ id2enginemap: engines }, loadCurrentSearchEngines);
	});
}

// 添加或更新搜索引擎
function addOrUpdateSearchEngine() {
	const name = document.getElementById('newCustomEngineName').value.trim();
	const url = document.getElementById('newCustomEngineUrl').value.trim();
	if (name && url) {
		chrome.storage.sync.get('id2enginemap', function (data) {
			const engines = data.id2enginemap || {};
			engines[name] = url;
			chrome.storage.sync.set({ id2enginemap: engines }, function () {
				loadCurrentSearchEngines();
				document.getElementById('newCustomEngineName').value = '';
				document.getElementById('newCustomEngineUrl').value = '';
			});
		});
	}
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
	loadCurrentSearchEngines();
	document.getElementById('addCustomSearchEngine').addEventListener('click', addOrUpdateSearchEngine);
	document.getElementById('currentSearchEngines').addEventListener('click', function (e) {
		if (e.target.classList.contains('editSearchEngine')) {
			editSearchEngine(e.target.dataset.name);
		} else if (e.target.classList.contains('deleteSearchEngine')) {
			deleteSearchEngine(e.target.dataset.name);
		}
	});
});
let gridConfig = new Array(24).fill(null);
let editingIndex = -1;

function loadGridConfig() {
  chrome.storage.sync.get('gridConfig', function(result) {
    gridConfig = result.gridConfig || new Array(24).fill(null);
    updateGridUI();
  });
}

function saveGridConfig() {
  chrome.storage.sync.set({gridConfig: gridConfig}, function() {
    console.log('Grid configuration saved');
    alert('配置已保存');
    syncToContentScript();
  });
}

function updateGridUI() {
	gridConfig.forEach((item, index) => {
		const cell = document.querySelector(`.grid-cell[data-index="${index + 1}"]`);
		if (cell) {
			cell.textContent = item ? item.name : `${index + 1}`;
			cell.addEventListener('click', () => showModal(index));
		}
	});
}

function showModal(index) {
  editingIndex = index;
  const modal = document.getElementById('grid-modal');
  const titleEl = document.getElementById('modal-title');
  const nameEl = document.getElementById('grid-name');
  const typeEl = document.getElementById('grid-type');
  const actionEl = document.getElementById('grid-action');

  const item = gridConfig[index];
  if (item) {
    titleEl.textContent = '编辑格子';
    nameEl.value = item.name;
    typeEl.value = item.type;
    actionEl.value = item.action;
  } else {
    titleEl.textContent = '新增格子';
    nameEl.value = '';
    typeEl.value = 'function';
    actionEl.value = '';
  }

  modal.style.display = 'block';
}

function hideModal() {
  document.getElementById('grid-modal').style.display = 'none';
}

function saveGridItem() {
  const name = document.getElementById('grid-name').value;
  const type = document.getElementById('grid-type').value;
  const action = document.getElementById('grid-action').value;

  if (name && action) {
    try {
      // 尝试解析JSON
      const jsonAction = JSON.parse(action);
      gridConfig[editingIndex] = jsonAction;
    } catch (e) {
      // 如果不是有效的JSON，则按普通命令处理
      gridConfig[editingIndex] = { name, type, action };
    }
    updateGridUI();
    hideModal();
    saveGridConfig();
  } else {
    alert('请填写所有字段');
  }
}

function importConfig() {
  const fileInput = document.getElementById('import-file');
  fileInput.onchange = function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedConfig = JSON.parse(e.target.result);
          gridConfig = new Array(24).fill(null).map((_, i) => importedConfig[i] || null);
          updateGridUI();
          saveGridConfig();
          alert('配置导入成功');
        } catch (error) {
          alert('导入失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };
  fileInput.click();
}

function exportConfig() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gridConfig));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "grid_config.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function syncToContentScript() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "updateGridConfig", config: gridConfig});
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadGridConfig();
  document.getElementById('save-config').addEventListener('click', saveGridConfig);
  document.getElementById('import-config').addEventListener('click', importConfig);
  document.getElementById('export-config').addEventListener('click', exportConfig);
  document.getElementById('modal-save').addEventListener('click', saveGridItem);
  document.getElementById('modal-cancel').addEventListener('click', hideModal);
  
});