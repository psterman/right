// 定义全局变量存储搜索引擎映射
let topEngineListContainer = [];
let bottomEngineListContainer = [];
let multiMenu1 = [];
let multiMenu2 = [];
let aiSearchEngines = [];
let customSearchEngines = [];
let allRecords = [];
const recordsPerPage = 10;
let currentPage = 1;

// 在文件顶部添加这段代码
// 定义要保存状态的复选框ID列表
const checkboxIds = [
	'copyCheckbox', 'deleteCheckbox', 'jumpCheckbox', 'closeCheckbox',
	'refreshCheckbox', 'pasteCheckbox', 'downloadCheckbox', 'closesidepanelCheckbox'
];
// 在文件顶部添加这个函数
function loadRecords() {
	const recordsContainer = document.getElementById('records-container');
	recordsContainer.innerHTML = ''; // 清空现有内容

	chrome.storage.sync.get('savedRecords', function (data) {
		const records = data.savedRecords || [];
		records.forEach((record, index) => {
			const recordElement = document.createElement('div');
			recordElement.className = 'record-item';
			recordElement.innerHTML = `
                <p><strong>保存文字:</strong> ${record.text}</p>
                <p><strong>保存网址:</strong> <a href="${record.url || '#'}" target="_blank">${record.url || 'No URL'}</a></p>
                <p><strong>保存时间:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
                <button class="delete-record" data-index="${index}">删除</button>
                <hr>
            `;
			recordsContainer.appendChild(recordElement);
		});

		// 添加删除按钮的事件监听器
		recordsContainer.addEventListener('click', function (event) {
			if (event.target.classList.contains('delete-record')) {
				const index = event.target.getAttribute('data-index');
				records.splice(index, 1);
				chrome.storage.sync.set({ savedRecords: records }, function () {
					console.log('Record deleted');
					loadRecords(); // 重新加载并渲染记录列表
				});
			}
		});
	});
}


function displayRecords() {
	const container = document.getElementById('records-container');
	if (container) {
		container.innerHTML = '';
		const startIndex = (currentPage - 1) * recordsPerPage;
		const endIndex = startIndex + recordsPerPage;
		const pageRecords = allRecords.slice(startIndex, endIndex);

		pageRecords.forEach((record, index) => {
			const recordElement = document.createElement('div');
			recordElement.className = 'record';
			recordElement.innerHTML = `
                <p>${record.text}</p>
                <small>保存时间: ${new Date(record.timestamp).toLocaleString()}</small>
                <button class="delete-record" data-index="${startIndex + index}">删除</button>
            `;
			container.appendChild(recordElement);
		});
	}
}

function setupPagination() {
	const paginationContainer = document.getElementById('pagination');
	if (paginationContainer) {
		paginationContainer.innerHTML = '';
		const totalPages = Math.ceil(allRecords.length / recordsPerPage);

		if (totalPages > 1) {
			// 修改：添加上一页按钮
			const prevButton = document.createElement('button');
			prevButton.textContent = '上一页';
			prevButton.addEventListener('click', () => {
				if (currentPage > 1) {
					currentPage--;
					displayRecords();
					setupPagination();
				}
			});
			paginationContainer.appendChild(prevButton);

			// 修改：只显示当前页码
			const currentPageSpan = document.createElement('span');
			currentPageSpan.textContent = `${currentPage} / ${totalPages}`;
			paginationContainer.appendChild(currentPageSpan);

			// 修改：添加下一页按钮
			const nextButton = document.createElement('button');
			nextButton.textContent = '下一页';
			nextButton.addEventListener('click', () => {
				if (currentPage < totalPages) {
					currentPage++;
					displayRecords();
					setupPagination();
				}
			});
			paginationContainer.appendChild(nextButton);
		}
	}
}

function deleteRecord(index) {
	allRecords.splice(index, 1);
	chrome.storage.sync.set({ savedRecords: allRecords }, () => {
		displayRecords();
		setupPagination();
	});
}

function clearAllRecords() {
	allRecords = [];
	chrome.storage.sync.set({ savedRecords: [] }, () => {
		displayRecords();
		setupPagination();
	});
}


function exportRecords() {
	const csvContent = "data:text/csv;charset=utf-8,"
		+ allRecords.map(record => `"${record.text}","${new Date(record.timestamp).toLocaleString()}"`).join("\n");
	const encodedUri = encodeURI(csvContent);
	const link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	link.setAttribute("download", "saved_records.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', function () {
	const body = document.body;
	const cursorImages = document.querySelectorAll('.cursor-image');
	const resetButton = document.getElementById('reset-cursor');
	let customCursor = null;
	let isCustomCursorActive = false;
	let lastKnownMousePosition = { x: 0, y: 0 };
	let isUpdating = false;
	// 为重置按钮添加点击事件监听器
	resetButton.addEventListener('click', () => {
		// 发送重置光标的命令到 background.js
		chrome.runtime.sendMessage({ action: 'resetCursor' }, (response) => {
			if (response.success) {
				console.log('Cursor reset command sent successfully.');
			} else {
				console.error('Failed to reset cursor:', response.message);
			}
		});
	});
	// 为每个光标图像添加点击事件监听器
	document.querySelectorAll('.cursor-image').forEach(img => {
		img.addEventListener('click', function () {
			// 移除其他图像的选中状态
			document.querySelectorAll('.cursor-image').forEach(i => i.classList.remove('selected'));
			// 为当前点击的图像添加选中状态
			this.classList.add('selected');
			// 保存选中的光标
			const cursorUrl = this.src;
			chrome.storage.sync.set({ selectedCursor: cursorUrl }, function () {
				console.log('Cursor saved:', cursorUrl);
			});
			// 更新光标（如果需要立即在选项页面看到效果）
			updateCursor(cursorUrl);
		});
	});

	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	function createOrUpdateCustomCursor(cursorUrl) {
		if (!customCursor) {
			customCursor = document.createElement('div');
			customCursor.id = 'custom-cursor';
			body.appendChild(customCursor);
		}

		customCursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      width: 32px;
      height: 32px;
      background-image: url('${cursorUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      z-index: 9999;
      display: none;
      left: ${lastKnownMousePosition.x}px;
      top: ${lastKnownMousePosition.y}px;
    `;
	}

	function updateCursor(cursorUrl) {
		if (isUpdating) return;
		isUpdating = true;

		const img = new Image();
		img.onload = () => {
			createOrUpdateCustomCursor(cursorUrl);
			body.classList.add('custom-cursor');
			isCustomCursorActive = true;
			showCursor();
			isUpdating = false;
		};
		img.src = cursorUrl;

		if (!isCustomCursorActive) {
			document.addEventListener('mousemove', moveCursor);
			document.addEventListener('mouseenter', showCursor);
			document.addEventListener('mouseleave', hideCursor);
		}
	}

	const debouncedUpdateCursor = debounce(updateCursor, 200);

	function moveCursor(e) {
		lastKnownMousePosition = { x: e.clientX, y: e.clientY };
		if (customCursor && isCustomCursorActive) {
			customCursor.style.left = `${e.clientX}px`;
			customCursor.style.top = `${e.clientY}px`;
		}
	}

	function showCursor() {
		if (customCursor && isCustomCursorActive) {
			customCursor.style.display = 'block';
		}
	}

	function hideCursor() {
		if (customCursor) {
			customCursor.style.display = 'none';
		}
	}

	cursorImages.forEach(img => {
		img.addEventListener('click', () => {
			cursorImages.forEach(i => i.classList.remove('selected'));
			img.classList.add('selected');
			debouncedUpdateCursor(img.src);
		});
	});

	resetButton.addEventListener('click', () => {
		if (customCursor) {
			customCursor.remove();
			customCursor = null;
		}
		body.classList.remove('custom-cursor');
		isCustomCursorActive = false;
		document.removeEventListener('mousemove', moveCursor);
		document.removeEventListener('mouseenter', showCursor);
		document.removeEventListener('mouseleave', hideCursor);
		cursorImages.forEach(img => img.classList.remove('selected'));
	});

	document.addEventListener('mousemove', moveCursor);
	loadRecords();
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
			// 可以在这里添加其他逻辑，比如通知其他脚本更新状态
		});
	});
	const actionsWrapper = document.createElement('div');
	actionsWrapper.className = 'actions-wrapper';
	const clearRecordsButton = document.getElementById('clear-records');
	const confirmDialog = document.getElementById('confirm-dialog');
	const confirmClearButton = document.getElementById('confirm-clear');
	const cancelClearButton = document.getElementById('cancel-clear');
	const exportRecordsButton = document.getElementById('export-records');

	if (clearRecordsButton) {
		clearRecordsButton.addEventListener('click', function () {
			if (confirmDialog) {
				confirmDialog.style.display = 'flex';
			}
		});
	}

	if (confirmClearButton) {
		confirmClearButton.addEventListener('click', function () {
			clearAllRecords();
			if (confirmDialog) {
				confirmDialog.style.display = 'none';
			}
		});
	}

	if (cancelClearButton) {
		cancelClearButton.addEventListener('click', function () {
			if (confirmDialog) {
				confirmDialog.style.display = 'none';
			}
		});
	}

	if (exportRecordsButton) {
		exportRecordsButton.addEventListener('click', exportRecords);
	}

	const recordsContainer = document.getElementById('records-container');
	if (recordsContainer) {
		recordsContainer.addEventListener('click', function (e) {
			if (e.target.classList.contains('delete-record')) {
				const index = parseInt(e.target.getAttribute('data-index'));
				deleteRecord(index);
			}
		});
	}

	chrome.storage.sync.get('aiSearchEngines', function (data) {
		if (data.aiSearchEngines && Array.isArray(data.aiSearchEngines)) {
			const bottomEngineListContainer = document.getElementById('bottomEngineListContainer');
			if (bottomEngineListContainer) {
				data.aiSearchEngines.forEach(engine => {
					const item = createEngineItem(engine.name, engine.url);
					bottomEngineListContainer.appendChild(item);
				});
			}
		}
	});
});

// 如果 createEngineItem 函数不存在，请添加此函数
function createEngineItem(name, url) {
	const item = document.createElement('div');
	item.className = 'engine-item';
	item.innerHTML = `
        <span>${name}</span>
        <input type="text" value="${url}" readonly>
        <button class="edit-engine">编辑</button>
        <button class="delete-engine">删除</button>
    `;
	return item;
}


function updateAISearchEngines(newEngines) {
	chrome.storage.sync.set({ aiSearchEngines: newEngines }, function () {
		console.log('AI搜索引擎列表已在选项页面更新');
		// 可能需要刷新显示
	});
}
// 从存储中加载数据
function loadData() {
	chrome.storage.sync.get(['id2enginemap', 'multiMenu1', 'multiMenu2'], function (result) {
		id2enginemap = result.id2enginemap || {};
		multiMenu1 = result.multiMenu1 || [];
		multiMenu2 = result.multiMenu2 || [];

		// 清空现有的引擎列表
		topEngineListContainer = [];
		bottomEngineListContainer = [];

		// AI 搜索引擎
		const aiSearchEngines = [
			{ name: "ChatGPT", url: "https://chatgpt.com/?q=%s" },
			{ name: "Perplexity", url: "https://www.perplexity.ai/?q=%s" },
			{ name: "360AI搜索", url: "https://www.sou.com/?q=%s" },
			{ name: "百小度", url: "https://ying.baichuan-ai.com/chat" },
			{ name: "智谱清言", url: "https://chatglm.cn/main/alltoolsdetail" },
			{ name: "海螺", url: "https://hailuoai.com/" },
			{ name: "ThinkAny", url: "https://thinkany.so/search?q=%s" },
			{ name: "WebPilot", url: "https://www.webpilot.ai/search?q=%s" },
			{ name: "私塔", url: "https://metaso.cn/?q=%s" },
			{ name: "Devv", url: "https://devv.ai/" },
			{ name: "豆包", url: "https://www.doubao.com/" },
			{ name: "开搜AI", url: "https://kaisouai.com/?q=%s" },
			{ name: "文心一言", url: "https://yiyan.baidu.com/" },
			{ name: "Consensus", url: "https://consensus.app/results/?q=%s" },
			{ name: "YOU", url: "https://you.com/search?q=%s" },
			{ name: "phind", url: "https://www.phind.com/search?q=%s" },
			{ name: "SEMANTIC SCHOLAR", url: "https://www.semanticscholar.org/search?q=%s" },
			{ name: "Genspark", url: "https://www.genspark.ai/search?query=%s" },
			{ name: "Felo Search", url: "https://felo.ai/?q=%s" },
			{ name: "Miku", url: "https://hellomiku.com/search?q=%s" },
			{ name: "kFind", url: "https://kfind.kmind.com/search?q=%s" },
			{ name: "MenFree", url: "https://www.memfree.me/search?q=%s" },
			{ name: "Monica", url: "https://s.monica.im/search?q=%s" },
			{ name: "MERGEEK", url: "https://mergeek.com/search" },
			{ name: "Xanswer", url: "https://www.xanswer.com/" },
			{ name: "exa", url: "https://exa.ai/search?q=%s" }
		];

		// 传统搜索引擎
		const regularSearchEngines = [
			{ name: "Google", url: "https://www.google.com/search?q=%s" },
			{ name: "Bing", url: "https://www.bing.com/search?q=%s" },
			{ name: "百度", url: "https://www.baidu.com/s?wd=%s" },
			{ name: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s" },
			{ name: "Yandex", url: "https://yandex.com/search/?text=%s" },
			{ name: "搜狗", url: "https://www.sogou.com/web?query=%s" },
			{ name: "360搜索", url: "https://www.so.com/s?q=%s" },
			{ name: "Yahoo", url: "https://search.yahoo.com/search?p=%s" },
			{ name: "小红书", url: "https://www.xiaohongshu.com/search_result?keyword=%s" },
			{ name: "抖音", url: "https://www.douyin.com/search/%s" },
			{ name: "X", url: "https://x.com/search?q=%s" },
			{ name: "YouTube", url: "https://www.youtube.com/results?search_query=%s" },
			{ name: "V2EX", url: "https://www.sov2ex.com/?q=%s" },
			{ name: "Github", url: "https://github.com/search?q=%s" },
			{ name: "ProductHunt", url: "https://www.producthunt.com/search?q=%s" },
			{ name: "即刻", url: "https://web.okjike.com/search?keyword=%s" },
			{ name: "FaceBook", url: "https://www.facebook.com//search?q=%s" },
			{ name: "bilibili", url: "https://search.bilibili.com/?keyword=%s" },
			{ name: "知乎宣客", url: "https://zhida.zhihu.com/" },
			{ name: "知乎", url: "https://www.zhihu.com/search?q=%s" },
			{ name: "腾讯元宝", url: "https://yuanbao.tencent.com/chat/" },
			{ name: "微信公众号", url: "https://weixin.sogou.com/weixin?type=2&query=%s" },
			{ name: "微博", url: "https://s.weibo.com/weibo?q=%s" },
			{ name: "今日头条", url: "https://so.toutiao.com/search?dvpf=pc&keyword=%s" }
			// 添加更多传统搜索引擎...
		];

		// 将 AI 搜索引擎添加到顶部引擎列表
		topEngineListContainer = aiSearchEngines;

		// 将传统搜索引擎添加到底部引擎列表
		bottomEngineListContainer = regularSearchEngines;

		console.log('Loaded data:', {
			topEngineListContainer,
			bottomEngineListContainer,
			multiMenu1,
			multiMenu2
		});

		initializeTab3();
	});
}
//填充topenginelist
function loadEngineList() {
	console.log('Loading engine list');
	const topEngineList = document.querySelector('#topEngineList .engine-list');
	const bottomEngineList = document.querySelector('#bottomEngineList .engine-list');

	// 从存储中获取AI搜索引擎列表和状态
	chrome.storage.sync.get(['aiSearchEngines'], function (data) {
		if (topEngineList) {
			topEngineList.innerHTML = '';
			const engines = data.aiSearchEngines || topEngineListEngines;

			engines.forEach((engine, index) => {
				const engineItem = createEngineItem(engine, index, true, true);

				// 添加复选框状态变化监听器
				const checkbox = engineItem.querySelector('input[type="checkbox"]');
				checkbox.addEventListener('change', function () {
					// 更新存储中的enabled状态
					chrome.storage.sync.get(['aiSearchEngines'], function (data) {
						const currentEngines = data.aiSearchEngines;
						currentEngines[index].enabled = checkbox.checked;
						chrome.storage.sync.set({
							aiSearchEngines: currentEngines
						}, function () {
							console.log('AI Engine state saved:', index, checkbox.checked);
							// 更新multiMenu2显示
							loadMultiMenu('multiMenu2');
						});
					});
				});

				topEngineList.appendChild(engineItem);
			});
		}
	});

	// 从存储中获取常规搜索引擎列表和状态
	if (bottomEngineList) {
		bottomEngineList.innerHTML = '';
		chrome.storage.sync.get(['regularSearchEngines'], function (data) {
			const engines = data.regularSearchEngines || [];
			engines.forEach((engine, index) => {
				const engineItem = createEngineItem(engine, index, true, false);

				// 添加复选框状态变化监听器
				const checkbox = engineItem.querySelector('input[type="checkbox"]');
				checkbox.addEventListener('change', function () {
					// 更新存储中的enabled状态
					chrome.storage.sync.get(['regularSearchEngines'], function (data) {
						const currentEngines = data.regularSearchEngines;
						currentEngines[index].enabled = checkbox.checked;
						chrome.storage.sync.set({
							regularSearchEngines: currentEngines
						}, function () {
							console.log('Regular Engine state saved:', index, checkbox.checked);
							// 更新multiMenu2显示
							loadMultiMenu('multiMenu2');
						});
					});
				});

				bottomEngineList.appendChild(engineItem);
			});
		});
	}
}

// 创建引擎项
function createEngineItem(engine, index, isCustom, isAI) {
	const item = document.createElement('div');
	item.className = 'engine-item';

	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.id = `engine-${isAI ? 'ai' : 'regular'}-${index}`;
	checkbox.checked = engine.enabled !== false;

	// 添加复选框状态变化监听
	checkbox.addEventListener('change', function () {
		saveEngineState(
			isAI ? 'aiSearchEngines' : 'regularSearchEngines',
			index,
			this.checked
		);
	});


	const label = document.createElement('label');
	label.htmlFor = checkbox.id;
	label.textContent = engine.name;

	const urlInput = document.createElement('input');
	urlInput.type = 'text';
	urlInput.value = engine.url;
	urlInput.readOnly = true;

	item.appendChild(checkbox);
	item.appendChild(label);
	item.appendChild(urlInput);

	// 始终为自定义引擎添加编辑和删除按钮

	if (isCustom) {
		const editBtn = document.createElement('button');
		editBtn.textContent = '编辑';
		editBtn.onclick = (e) => {
			e.preventDefault();
			console.log(`Edit button clicked for ${isAI ? 'AI' : 'regular'} engine at index ${index}`);
			editEngine(index, isAI);
		};
		item.appendChild(editBtn);

		const deleteBtn = document.createElement('button');
		deleteBtn.textContent = '删除';
		deleteBtn.onclick = (e) => {
			e.preventDefault();
			console.log(`Delete button clicked for ${isAI ? 'AI' : 'regular'} engine at index ${index}`);
			deleteEngine(index, isAI);
		};
		item.appendChild(deleteBtn);
	}


	return item;
}
function addNewEngine(isAI) {
	const engineType = isAI ? 'AI' : '常规';
	const name = prompt(`输入新的${engineType}搜索引擎名称:`);
	if (!name) return;

	const url = prompt(`输入新的${engineType}搜索引擎URL:`);
	if (!url) return;

	const storageKey = isAI ? 'aiSearchEngines' : 'regularSearchEngines';
	chrome.storage.sync.get(storageKey, function (data) {
		let engines = data[storageKey] || [];
		engines.push({ name, url, enabled: true });
		chrome.storage.sync.set({ [storageKey]: engines }, function () {
			console.log(`新的${engineType}搜索引擎已添加`);
			loadEngineList(); // 重新加载主引擎列表
		});
	});
}
function editEngine(index, isAI) {
	const storageKey = isAI ? 'aiSearchEngines' : 'regularSearchEngines';
	chrome.storage.sync.get(storageKey, function (data) {
		let engines = data[storageKey] || [];
		const newName = prompt('输入新的搜索引擎名称:', engines[index].name);
		const newUrl = prompt('输入新的搜索引擎URL:', engines[index].url);

		if (newName && newUrl) {
			engines[index] = { ...engines[index], name: newName, url: newUrl };
			chrome.storage.sync.set({ [storageKey]: engines }, function () {
				console.log(`${isAI ? 'AI' : '常规'}搜索引擎已更新`, engines);
				loadEngineList(); // 重新加载列表
				saveEngineSettings(); // 保存所有更改
			});
		}
	});
}
function deleteEngine(index, isAI) {
	const storageKey = isAI ? 'aiSearchEngines' : 'regularSearchEngines';
	if (confirm('确定要删除这个搜索引擎吗？')) {
		chrome.storage.sync.get(storageKey, function (data) {
			let engines = data[storageKey] || [];
			engines.splice(index, 1);
			chrome.storage.sync.set({ [storageKey]: engines }, function () {
				console.log(`${isAI ? 'AI' : '常规'}搜索引擎已删除`);
				loadEngineList(); // 重新加载列表
			});
		});
	}
}

/* function editEngine(index) {
	chrome.storage.sync.get('aiSearchEngines', function (data) {
		let engines = data.aiSearchEngines || [];
		const newName = prompt('输入新的搜索引擎名称:', engines[index].name);
		const newUrl = prompt('输入新的搜索引擎URL:', engines[index].url);

		if (newName && newUrl) {
			engines[index] = { name: newName, url: newUrl };
			saveAISearchEngines(engines);
			loadAISearchEngines('multiMenu1'); // 重新加载列表
		}
	});
} */

/* function deleteEngine(index) {
	chrome.storage.sync.get('aiSearchEngines', function (data) {
		let engines = data.aiSearchEngines || [];
		if (confirm('确定要删除这个搜索引擎吗？')) {
			engines.splice(index, 1);
			saveAISearchEngines(engines);
			loadAISearchEngines('multiMenu1'); // 重新加载列表
		}
	});
} */
function saveEngineState(engineType, index, isEnabled) {
	chrome.storage.sync.get(engineType, function (data) {
		let engines = data[engineType] || [];
		if (engines[index]) {
			engines[index].enabled = isEnabled;
			chrome.storage.sync.set({
				[engineType]: engines
			}, function () {
				console.log(`${engineType} engine ${index} state updated to ${isEnabled}`);
			});
		}
	});
}
// 添加自定义引擎
function addCustomEngine() {
	const name = prompt('请输入引擎名称:');
	const url = prompt('请输入引擎URL (使用 %s 表示搜索词):');

	if (name && url) {
		chrome.storage.sync.get('customEngines', function (data) {
			const customEngines = data.customEngines || [];
			customEngines.push({ name, url, enabled: true });
			chrome.storage.sync.set({ customEngines }, loadEngineList);
		});
	}
}

// 删除自定义引擎
function deleteCustomEngine(index, isAI) {
	const storageKey = isAI ? 'aiSearchEngines' : 'customEngines';
	chrome.storage.sync.get(storageKey, function (data) {
		const engines = data[storageKey] || [];
		engines.splice(index, 1);
		chrome.storage.sync.set({ [storageKey]: engines }, loadEngineList);
	});
}

// 保存引擎设置
function saveEngineSettings() {
	chrome.storage.sync.set({
		aiSearchEngines: searchEngines.ai,
		regularSearchEngines: searchEngines.regular
	}, function () {
		console.log('搜索引擎设置已保存');
		// 可以添加保存成功的提示
		if (document.querySelector('.save-success-message')) {
			document.querySelector('.save-success-message').textContent = '设置已保存';
			setTimeout(() => {
				document.querySelector('.save-success-message').textContent = '';
			}, 2000);
		}
	});
}
// 初始化
// 定义 topEngineList 的搜索引擎
const topEngineListEngines = [
	{ name: "ChatGPT", url: "https://chat.openai.com/", enabled: true },
	{ name: "Perplexity", url: "https://www.perplexity.ai/?q=%s", enabled: true },
	{ name: "360AI搜索", url: "https://www.sou.com/?q=%s", enabled: true },
	{ name: "百小度", url: "https://ying.baichuan-ai.com/chat", enabled: true },
	{ name: "智谱清言", url: "https://chatglm.cn/main/alltoolsdetail", enabled: true },
	{ name: "海螺", url: "https://hailuoai.com/", enabled: true },
	{ name: "ThinkAny", url: "https://thinkany.so/search?q=%s", enabled: true },
	{ name: "WebPilot", url: "https://www.webpilot.ai/search?q=%s", enabled: true },
	{ name: "私塔", url: "https://metaso.cn/?q=%s", enabled: true },
	{ name: "Devv", url: "https://devv.ai/", enabled: true },
	{ name: "豆包", url: "https://www.doubao.com/", enabled: true },
	{ name: "开搜AI", url: "https://kaisouai.com/?q=%s", enabled: true },
	{ name: "文心一言", url: "https://yiyan.baidu.com/", enabled: true },
	{ name: "Consensus", url: "https://consensus.app/results/?q=%s", enabled: true },
	{ name: "YOU", url: "https://you.com/search?q=%s", enabled: true },
	{ name: "phind", url: "https://www.phind.com/search?q=%s", enabled: true },
	{ name: "SEMANTIC SCHOLAR", url: "https://www.semanticscholar.org/search?q=%s", enabled: true },
	{ name: "Genspark", url: "https://www.genspark.ai/search?query=%s", enabled: true },
	{ name: "Felo Search", url: "https://felo.ai/?q=%s", enabled: true },
	{ name: "Miku", url: "https://hellomiku.com/search?q=%s", enabled: true },
	{ name: "kFind", url: "https://kfind.kmind.com/search?q=%s", enabled: true },
	{ name: "MenFree", url: "https://www.memfree.me/search?q=%s", enabled: true },
	{ name: "Monica", url: "https://s.monica.im/search?q=%s", enabled: true },
	{ name: "MERGEEK", url: "https://mergeek.com/search", enabled: true },
	{ name: "Xanswer", url: "https://www.xanswer.com/", enabled: true },
	{ name: "exa", url: "https://exa.ai/search?q=%s", enabled: true }
];

// 定义 multiMenu1 的搜索引擎
const multiMenu1Engines = [
	// 主流搜索引擎
	{ name: "谷歌图片", url: "https://images.google.com/search?q=%s", enabled: true },
	{ name: "必应图片", url: "https://cn.bing.com/images/search?q=%s", enabled: true },
	{ name: "百度图片", url: "https://image.baidu.com/search/index?tn=baiduimage&word=%s", enabled: true },
	{ name: "搜狗图片", url: "https://pic.sogou.com/pics?query=%s", enabled: true },
	{ name: "360图片", url: "https://image.so.com/i?q=%s", enabled: true },

	// 社交平台
	{ name: "微博图片", url: "https://s.weibo.com/pic?q=%s", enabled: true },
	{ name: "知乎图片", url: "https://www.zhihu.com/search?type=content&q=%s", enabled: true },
	{ name: "小红书", url: "https://www.xiaohongshu.com/search_result?keyword=%s", enabled: true },
	{ name: "花瓣网", url: "https://huaban.com/search?q=%s", enabled: true },
	{ name: "堆糖", url: "https://www.duitang.com/search/?kw=%s", enabled: true },

	// 图片素材
	{ name: "千图网", url: "https://www.58pic.com/piccate/search.html?q=%s", enabled: true },
	{ name: "包图网", url: "https://ibaotu.com/tupian/search?q=%s", enabled: true },
	{ name: "摄图网", url: "https://699pic.com/tupian/%s.html", enabled: true },
	{ name: "昵图网", url: "https://soso.nipic.com/?q=%s", enabled: true },
	{ name: "全景网", url: "https://www.quanjing.com/search.aspx?q=%s", enabled: true }
];

document.addEventListener('DOMContentLoaded', function () {
	// 初始化搜索引擎配置
	chrome.storage.sync.get(['aiSearchEngines', 'regularSearchEngines'], function (data) {
		// 如果没有存储的AI搜索引擎，使用默认配置并添加enabled属性
		if (!data.aiSearchEngines) {
			const defaultAIEngines = searchEngines.ai.map(engine => ({
				...engine,
				enabled: true
			}));
			chrome.storage.sync.set({ aiSearchEngines: defaultAIEngines });
			searchEngines.ai = defaultAIEngines;
		} else {
			searchEngines.ai = data.aiSearchEngines;
		}

		// 如果没有存储的常规搜索引擎，使用默认配置并添加enabled属性
		if (!data.regularSearchEngines) {
			const defaultRegularEngines = searchEngines.regular.map(engine => ({
				...engine,
				enabled: true
			}));
			chrome.storage.sync.set({ regularSearchEngines: defaultRegularEngines });
			searchEngines.regular = defaultRegularEngines;
		} else {
			searchEngines.regular = data.regularSearchEngines;
		}

		// 加载引擎列表
		loadEngineList();
	});

	// 绑定按钮事件
	const addAIButton = document.getElementById('addAISearchEngine');
	if (addAIButton) {
		addAIButton.addEventListener('click', () => addNewEngine(true));
	}

	const addRegularButton = document.getElementById('addRegularSearchEngine');
	if (addRegularButton) {
		addRegularButton.addEventListener('click', () => addNewEngine(false));
	}

	const saveButton = document.getElementById('saveSettings');
	if (saveButton) {
		saveButton.addEventListener('click', saveEngineSettings);
	}

	// 多重菜单1 的新建搜索引擎按钮
	const addMenuItemButton = document.querySelector('#multiMenu1 .add-menu-item');
	if (addMenuItemButton) {
		addMenuItemButton.addEventListener('click', addNewAISearchEngine);
	}
});


// 新的函数重命名为 addNewAISearchEngine
// 新增此函数
function addNewAISearchEngine() {
	const name = prompt('输入新的AI搜索引擎名称:');
	if (!name) return;

	const url = prompt('输入新的AI搜索引擎URL:');
	if (!url) return;

	chrome.storage.sync.get('aiSearchEngines', function (data) {
		let engines = data.aiSearchEngines || [];
		engines.push({ name, url, enabled: true });
		chrome.storage.sync.set({ aiSearchEngines: engines }, function () {
			console.log('新的AI搜索引擎已添加');
			loadAISearchEngines('multiMenu1'); // 重新加载AI搜索引擎列表
		});
	});
}

// ... existing code ...
function loadAISearchEngines(containerId) {
const container = document.querySelector(`#${containerId} .ai-search-engine-list`);
if (!container) return;

const functionMenus = [
	{ name: "复制", type: "copy", icon: "📋" },
	{ name: "收藏", type: "save", icon: "⭐" },
	{ name: "刷新", type: "refresh", icon: "🔄" },
	{ name: "二维码", type: "qrcode", icon: "📱" },
	{ name: "侧边栏", type: "sidepanel", icon: "📑" }
];

chrome.storage.sync.get(functionMenus.map(menu => `${menu.type}Checkbox`), data => {
	container.innerHTML = functionMenus.map(menu => {
		const isEnabled = data[`${menu.type}Checkbox`] !== false;
		return `
                <div class="ai-engine-item">
                    <input type="checkbox" 
                           id="${menu.type}-function" 
                           class="engine-checkbox" 
                           ${isEnabled ? 'checked' : ''}>
                    <label for="${menu.type}-function">
                        <span class="menu-icon">${menu.icon}</span>
                        ${menu.name}
                    </label>
                </div>
            `;
	}).join('');

	// 添加事件监听
	container.querySelectorAll('.engine-checkbox').forEach((checkbox, index) => {
		checkbox.addEventListener('change', function () {
			const menu = functionMenus[index];
			chrome.storage.sync.set({
				[`${menu.type}Checkbox`]: this.checked
			});
		});
	});
});
}


// 保存功能菜单状态
function saveFunctionMenuState(type, enabled) {
    const checkboxMap = {
        copy: 'copyCheckbox',
        save: 'saveCheckbox',
        refresh: 'refreshCheckbox',
        qrcode: 'qrcodeCheckbox',
        sidepanel: 'sidepanelCheckbox'
    };

    chrome.storage.sync.set({ [checkboxMap[type]]: enabled });
}
function addNewImageSearchEngine() {
	const name = prompt('输入新的功能名称:');
	if (!name) return;

	const url = prompt('输入新的功能代码:');
	if (!url) return;

	chrome.storage.sync.get('multiMenu1Engines', function (data) {
		let engines = data.multiMenu1Engines || multiMenu1Engines;
		engines.push({ name, url, enabled: true });
		chrome.storage.sync.set({ multiMenu1Engines: engines }, function () {
			console.log('新的功能已添加');
			loadImageSearchEngines('multiMenu1');
		});
	});
}
// 添加保存引擎状态的函数
function saveMultiMenuEngineState(index, isEnabled) {
	chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
		let engines = data.multiMenu1Engines || multiMenu1Engines;
		if (engines[index]) {
			engines[index].enabled = isEnabled;
			chrome.storage.sync.set({ multiMenu1Engines: engines }, function () {
				console.log(`功能 ${engines[index].name} 状态已更新为: ${isEnabled}`);
			});
		}
	});
}
// 初始化 multiMenu1Engines（如果还没有初始化）
function initializeMultiMenu1Engines() {
	chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
		if (!data.multiMenu1Engines) {
			const initialEngines = multiMenu1Engines.map(engine => ({
				...engine,
				enabled: true  // 默认启用所有引擎
			}));
			chrome.storage.sync.set({ multiMenu1Engines: initialEngines });
		}
	});
}

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', function () {
	initializeMultiMenu1Engines();
	// ... 其他初始化代码 ...
});
// 修改编辑引擎函数
function editMultiMenuEngine(index) {
	chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
		let engines = data.multiMenu1Engines || multiMenu1Engines;
		const engine = engines[index];

		// 使用 prompt 获取新的值
		const newName = prompt('输入新的搜索引擎名称:', engine.name);
		if (!newName) return; // 用户取消

		const newUrl = prompt('输入新的搜索引擎URL:', engine.url);
		if (!newUrl) return; // 用户取消

		// 更新引擎数据
		engines[index] = {
			...engine,
			name: newName,
			url: newUrl
		};

		// 保存更新后的数据
		chrome.storage.sync.set({ multiMenu1Engines: engines }, function () {
			console.log('搜索引擎已更新');
			// 重新加载列表以显示更新
			loadAISearchEngines('multiMenu1');
		});
	});
}

// 修改删除引擎函数
function deleteMultiMenuEngine(index) {
	if (confirm('确定要删除这个搜索引擎吗？')) {
		chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
			let engines = data.multiMenu1Engines || multiMenu1Engines;

			// 从数组中移除指定索引的引擎
			engines.splice(index, 1);

			// 保存更新后的数据
			chrome.storage.sync.set({ multiMenu1Engines: engines }, function () {
				console.log('搜索引擎已删除');
				// 重新加载列表以显示更新
				loadAISearchEngines('multiMenu1');
			});
		});
	}
}
// 修改添加新引擎函数
function addNewAISearchEngine() {
	const name = prompt('输入新的AI搜索引擎名称:');
	if (!name) return;

	const url = prompt('输入新的AI搜索引擎URL:');
	if (!url) return;

	chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
		let engines = data.multiMenu1Engines || multiMenu1Engines;
		engines.push({
			name,
			url,
			enabled: true
		});

		chrome.storage.sync.set({ multiMenu1Engines: engines }, function () {
			console.log('新的AI搜索引擎已添加');
			loadAISearchEngines('multiMenu1');
		});
	});
} document.addEventListener('DOMContentLoaded', function () {
	// 初始化所有搜索引擎配置
	chrome.storage.sync.get(['topEngineListEngines', 'multiMenu1Engines'], function (data) {
		// 初始化 topEngineList
		if (!data.topEngineListEngines) {
			chrome.storage.sync.set({
				topEngineListEngines: topEngineListEngines.map(engine => ({
					...engine,
					enabled: true
				}))
			}, function () {
				console.log('已初始化 topEngineListEngines');
				loadEngineList();
			});
		} else {
			loadEngineList();
		}

		// 初始化 multiMenu1
		if (!data.multiMenu1Engines) {
			const defaultEngines = multiMenu1Engines.map(engine => ({
				...engine,
				enabled: true
			}));
			chrome.storage.sync.set({
				multiMenu1Engines: defaultEngines
			}, function () {
				console.log('已初始化 multiMenu1Engines');
				loadAISearchEngines('multiMenu1');
			});
		} else {
			loadAISearchEngines('multiMenu1');
		}
	});

	// 绑定事件监听器
	const addAIButton = document.getElementById('addAISearchEngine');
	if (addAIButton) {
		addAIButton.addEventListener('click', () => addNewEngine(true));
	}

	const addRegularButton = document.getElementById('addRegularSearchEngine');
	if (addRegularButton) {
		addRegularButton.addEventListener('click', () => addNewEngine(false));
	}

	const saveButton = document.getElementById('saveSettings');
	if (saveButton) {
		saveButton.addEventListener('click', saveEngineSettings);
	}
	console.log('DOM内容已加载');
	loadImageSearchEngines('multiMenu1');
	// 多重菜单1 的新建搜索引擎按钮
	const addMenuItemButton = document.querySelector('#multiMenu1 .add-menu-item');
	if (addMenuItemButton) {
		addMenuItemButton.addEventListener('click', addNewAISearchEngine);
	}
});
// 添加相关的 CSS 样式
const style = document.createElement('style');
style.textContent = `
  .engine-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .engine-url {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .engine-name-input {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  .edit-engine,
  .delete-engine {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .edit-engine {
    background-color: #4CAF50;
    color: white;
  }
  
  .delete-engine {
    background-color: #f44336;
    color: white;
  }
`;
document.head.appendChild(style);

// 保存 AI 搜索引擎设置
function saveAIEngineSettings(engines) {
	chrome.storage.sync.set({ aiSearchEngines: engines }, function () {
		console.log('AI搜索引擎设置已保存');
	});
}
// 确保在DOM加载完成后调用loadAISearchEngines
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM内容已加载');
	loadAISearchEngines('multiMenu1');
});


function saveAISearchEngines() {
	chrome.storage.sync.set({ aiSearchEngines: aiSearchEngines }, function () {
		console.log('AI搜索引擎已保存');
	});
}
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM内容已加载');
	setTimeout(() => {
		console.log('延迟执行loadAISearchEngines');
		loadAISearchEngines('multiMenu1');
	}, 1000); // 延迟1秒
});
// 在 DOMContentLoaded 事件监听器中使用新的函数名
document.addEventListener('DOMContentLoaded', () => {
	// ... 其他代码 ...
	loadAISearchEngines('multiMenu1');
	document.getElementById('addAISearchEngine1').addEventListener('click', addNewAISearchEngine);
});
// ... 现有代码 ...

chrome.storage.sync.get('aiSearchEngines', function (data) {
	console.log('从存储中获取的AI搜索引擎数据：', data.aiSearchEngines);
	let engines = data.aiSearchEngines || [];

	if (engines.length === 0) {
		console.log('未找到保存的AI搜索引擎，使用默认值');
		engines = [
			{ name: "ChatGPT", url: "https://chat.openai.com/", enabled: true },
			{ name: "Perplexity", url: "https://www.perplexity.ai/?q=%s", enabled: true },
			{ name: "360AI搜索", url: "https://www.sou.com/?q=%s", enabled: true },
			{ name: "百小度", url: "https://ying.baichuan-ai.com/chat", enabled: true },
			{ name: "智谱清言", url: "https://chatglm.cn/main/alltoolsdetail", enabled: true },
			{ name: "海螺", url: "https://hailuoai.com/", enabled: true },
			{ name: "ThinkAny", url: "https://thinkany.so/search?q=%s", enabled: true },
			{ name: "WebPilot", url: "https://www.webpilot.ai/search?q=%s", enabled: true },
			{ name: "私塔", url: "https://metaso.cn/?q=%s", enabled: true },
			{ name: "Devv", url: "https://devv.ai/", enabled: true },
			{ name: "豆包", url: "https://www.doubao.com/", enabled: true },
			{ name: "开搜AI", url: "https://kaisouai.com/?q=%s", enabled: true },
			{ name: "文心一言", url: "https://yiyan.baidu.com/", enabled: true },
			{ name: "Consensus", url: "https://consensus.app/results/?q=%s", enabled: true },
			{ name: "YOU", url: "https://you.com/search?q=%s", enabled: true },
			{ name: "phind", url: "https://www.phind.com/search?q=%s", enabled: true },
			{ name: "SEMANTIC SCHOLAR", url: "https://www.semanticscholar.org/search?q=%s", enabled: true },
			{ name: "Genspark", url: "https://www.genspark.ai/search?query=%s", enabled: true },
			{ name: "Felo Search", url: "https://felo.ai/?q=%s", enabled: true },
			{ name: "Miku", url: "https://hellomiku.com/search?q=%s", enabled: true },
			{ name: "kFind", url: "https://kfind.kmind.com/search?q=%s", enabled: true },
			{ name: "MenFree", url: "https://www.memfree.me/search?q=%s", enabled: true },
			{ name: "Monica", url: "https://s.monica.im/search?q=%s", enabled: true },
			{ name: "MERGEEK", url: "https://mergeek.com/search", enabled: true },
			{ name: "Xanswer", url: "https://www.xanswer.com/", enabled: true },
			{ name: "exa", url: "https://exa.ai/search?q=%s", enabled: true }
		];

		// 保存默认搜索引擎到存储
		chrome.storage.sync.set({ aiSearchEngines: engines }, function () {
			console.log('已保存默认AI搜索引擎配置');
			loadAISearchEngines(); // 重新加载搜索引擎列表
		});
	}
});

// 同样的方式处理常规搜索引擎
chrome.storage.sync.get('regularSearchEngines', function (data) {
	console.log('从存储中获取的常规搜索引擎数据：', data.regularSearchEngines);
	let engines = data.regularSearchEngines || [];

	if (engines.length === 0) {
		console.log('未找到保存的常规搜索引擎，使用默认值');
		engines = [
			{ name: "Google", url: "https://www.google.com/search?q=%s", enabled: false },
			{ name: "Bing", url: "https://www.bing.com/search?q=%s", enabled: false },
			{ name: "百度", url: "https://www.baidu.com/s?wd=%s", enabled: false },
			{ name: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s", enabled: false },
			{ name: "搜狗", url: "https://www.sogou.com/web?query=%s", enabled: false },
			{ name: "360搜索", url: "https://www.so.com/s?q=%s", enabled: false },
			{ name: "Yahoo", url: "https://search.yahoo.com/search?p=%s", enabled: false },
			{ name: "闲鱼", url: "https://www.goofish.com/search?q=%s&spm=a21ybx.home", enabled: false },
			{ name: "抖音", url: "https://www.douyin.com/search/%s", enabled: false },
			{ name: "X", url: "https://twitter.com/search?q=%s", enabled: false },
			{ name: "YouTube", url: "https://www.youtube.com/results?search_query=%s", enabled: false },
			{ name: "V2EX", url: "https://www.v2ex.com/search?q=%s", enabled: false },
			{ name: "Github", url: "https://github.com/search?q=%s", enabled: false },
			{ name: "ProductHunt", url: "https://www.producthunt.com/search?q=%s", enabled: false },
			{ name: "即刻", url: "https://web.okjike.com/search?keyword=%s", enabled: false },
			{ name: "FaceBook", url: "https://www.facebook.com/search/top/?q=%s", enabled: false },
			{ name: "bilibili", url: "https://search.bilibili.com/all?keyword=%s", enabled: false },
			{ name: "知乎", url: "https://www.zhihu.com/search?q=%s", enabled: false },
			{ name: "微信公众号", url: "https://weixin.sogou.com/weixin?type=2&query=%s", enabled: false },
			{ name: "微博", url: "https://s.weibo.com/weibo/%s", enabled: false },
			{ name: "今日头条", url: "https://so.toutiao.com/search?keyword=%s", enabled: false }
		];

		// 保存默认搜索引擎到存储
		chrome.storage.sync.set({ regularSearchEngines: engines }, function () {
			console.log('已保存默认常规搜索引擎配置');
			loadRegularSearchEngines(); // 重新加载搜索引擎列表
		});
	}
});

// 功能引擎也采用相同模式
// 修改功能引擎的初始化逻辑
// 强制更新功能引擎列表
chrome.storage.sync.get('imageSearchEngines', function (data) {
	console.log('当前存储的功能引擎：', data.imageSearchEngines);

	// 定义新的功能操作列表
	const updatedEngines = [
		{
			name: "复制",
			url: "copy", // 使用特殊标识符表示这是一个功能操作
			action: "copySelectedText",
			enabled: true
		},
		{
			name: "收藏",
			url: "save",
			action: "saveToBookmarks",
			enabled: true
		},
		{
			name: "刷新",
			url: "refresh",
			action: "refreshPage",
			enabled: true
		},
		{
			name: "侧边栏",
			url: "sidepanel",
			action: "toggleSidePanel",
			enabled: true
		},
		{
			name: "二维码",
			url: "qrcode",
			action: "showQRCode",
			enabled: true
		}
	];

	// 强制更新存储
	chrome.storage.sync.set({
		imageSearchEngines: updatedEngines,
		forceUpdate: true
	}, function () {
		console.log('已更新功能列表，共', updatedEngines.length, '个功能');
		if (typeof loadImageSearchEngines === 'function') {
			loadImageSearchEngines();
		}
	});
});

// 添加功能处理逻辑
function handleFunctionAction(action, selectedText) {
	switch (action) {
		case 'copySelectedText':
			navigator.clipboard.writeText(selectedText).then(() => {
				showNotification('已复制到剪贴板');
			});
			break;
		case 'saveToBookmarks':
			// 从 chrome.storage.sync 中获取已保存的书签数据
			chrome.storage.sync.get('savedBookmarks', function (data) {
				// 如果没有现有书签则初始化为空数组
				const bookmarks = data.savedBookmarks || [];

				// 添加新的书签记录
				bookmarks.push({
					text: selectedText,     // 用户选中的文本
					url: window.location.href,  // 当前页面URL
					date: new Date().toISOString()  // 保存时间
				});

				// 将更新后的书签数组保存回 storage
				chrome.storage.sync.set({ savedBookmarks: bookmarks }, function () {
					// 显示保存成功的通知
					showNotification('已保存到书签');
				});
			});
			break;

		case 'refreshPage':
			if (confirm('确定要刷新页面吗？')) {
				location.reload();
			}
			break;

		case 'toggleSidePanel':
			chrome.runtime.sendMessage({
				action: 'toggleSidePanel'
			});
			break;

		case 'showQRCode':
			chrome.runtime.sendMessage({
				action: 'showQRCode',
				text: selectedText
			});
			break;
	}
}

// 修改加载功能的方式
function loadImageSearchEngines(containerId) {
	const container = document.querySelector(`#${containerId} .ai-search-engine-list`);
	if (!container) return;

	chrome.storage.sync.get('imageSearchEngines', function (data) {
		const engines = data.imageSearchEngines || [];
		container.innerHTML = '';

		engines.forEach((engine, index) => {
			const li = document.createElement('li');
			li.className = 'ai-engine-item';
			li.innerHTML = `
                <div class="engine-row">
                    <input type="checkbox" id="function-${index}" 
                           class="engine-checkbox" 
                           ${engine.enabled ? 'checked' : ''}>
                    <label for="function-${index}">${engine.name}</label>
                    <span class="function-description">${engine.url}</span>
                    <button class="edit-engine" data-index="${index}">编辑</button>
                    <button class="delete-engine" data-index="${index}">删除</button>
                </div>
            `;

			// 添加事件监听器
			li.querySelector('.engine-checkbox').addEventListener('change', function () {
				saveEngineState(index, this.checked);
			});

			li.querySelector('.edit-engine').addEventListener('click', () => {
				editEngine(index);
			});

			li.querySelector('.delete-engine').addEventListener('click', () => {
				deleteEngine(index);
			});

			container.appendChild(li);
		});
	});
}



// 添加版本控制
const CURRENT_VERSION = '1.1';  // 增加版本号

// 检查并更新版本
chrome.storage.sync.get(['version'], function (data) {
	if (data.version !== CURRENT_VERSION) {
		// 版本不匹配，强制更新配置
		chrome.storage.sync.set({ version: CURRENT_VERSION }, function () {
			console.log('版本已更新至', CURRENT_VERSION);
		});
	}
});

// 添加重置功能
function resetImageSearchEngines() {
	chrome.storage.sync.remove(['imageSearchEngines', 'version'], function () {
		console.log('已清除现有配置，准备重新初始化');
		// 重新加载页面以触发初始化
		location.reload();
	});
}

// 添加用户自定义功能引擎的函数
function addCustomImageEngine(name, url) {
	chrome.storage.sync.get('imageSearchEngines', function (data) {
		let engines = data.imageSearchEngines || [];
		engines.push({ name, url, custom: true }); // 标记为自定义引擎

		chrome.storage.sync.set({ imageSearchEngines: engines }, function () {
			console.log('已添加自定义功能引擎');
			loadImageSearchEngines();
		});
	});
}

// 删除功能引擎的函数
function removeImageEngine(index) {
	chrome.storage.sync.get('imageSearchEngines', function (data) {
		let engines = data.imageSearchEngines || [];
		engines.splice(index, 1);

		chrome.storage.sync.set({ imageSearchEngines: engines }, function () {
			console.log('已删除功能引擎');
			loadImageSearchEngines();
		});
	});
}

// 编辑功能引擎的函数
function editImageEngine(index, newName, newUrl) {
	chrome.storage.sync.get('imageSearchEngines', function (data) {
		let engines = data.imageSearchEngines || [];
		engines[index] = {
			name: newName,
			url: newUrl,
			custom: engines[index].custom // 保持自定义标记
		};

		chrome.storage.sync.set({ imageSearchEngines: engines }, function () {
			console.log('已编辑功能引擎');
			loadImageSearchEngines();
		});
	});
}
document.addEventListener('DOMContentLoaded', loadData);
var globalId2enginemap = {};
function updateGlobalId2enginemap(newData) {
	globalId2enginemap = newData;
	updateAllEngineLists();
}
function loadCustomSearchEngines(menuId) {
	console.log('开始加载自定义搜索引擎');
	setTimeout(() => {
		const menuList = document.querySelector('#multiMenu2 .custom-search-engine-list');
		if (!menuList) {
			console.error('自定义搜索引擎列表元素未找到，选择器：#multiMenu2 .custom-search-engine-list');
			console.log('当前DOM结构：', document.body.innerHTML);
			return;
		}
		menuList.innerHTML = ''; // 清空现有内容

		chrome.storage.sync.get('customSearchEngines', function (data) {
			console.log('从存储中获取的自定义搜索引擎数据：', data.customSearchEngines);
			let engines = data.customSearchEngines || [];

			if (engines.length === 0) {
				console.log('未找到保存的自定义搜索引擎，使用默认值');
				engines = [
					{ name: "默认自定义搜索", url: "https://example.com/custom-search?q=%s" }
				];
			}

			engines.forEach((engine, index) => {
				const itemElement = document.createElement('div');
				itemElement.classList.add('menu-item');
				itemElement.innerHTML = `
                    <span>${engine.name}</span>
                    <input type="text" value="${engine.url}" readonly>
                    <button class="edit-custom-engine">编辑</button>
                    <button class="delete-custom-engine">删除</button>
                `;

				// 添加编辑和删除功能
				const editButton = itemElement.querySelector('.edit-custom-engine');
				const deleteButton = itemElement.querySelector('.delete-custom-engine');

				editButton.addEventListener('click', () => editCustomEngine(index));
				deleteButton.addEventListener('click', () => deleteCustomEngine(index));

				menuList.appendChild(itemElement);
			});

			console.log(`加载了 ${engines.length} 个自定义搜索引擎到 multiMenu2`);
		});
	}, 0);
}

function editCustomEngine(index) {
	chrome.storage.sync.get('customSearchEngines', function (data) {
		let engines = data.customSearchEngines || [];
		const newName = prompt('输入新的搜索引擎名称:', engines[index].name);
		const newUrl = prompt('输入新的搜索引擎URL:', engines[index].url);

		if (newName && newUrl) {
			engines[index] = { name: newName, url: newUrl };
			saveCustomSearchEngines(engines);
			loadCustomSearchEngines('multiMenu2'); // 重新加载列表
		}
	});
}

function deleteCustomEngine(index) {
	chrome.storage.sync.get('customSearchEngines', function (data) {
		let engines = data.customSearchEngines || [];
		if (confirm('确定要删除这个自定义搜索引擎吗？')) {
			engines.splice(index, 1);
			saveCustomSearchEngines(engines);
			loadCustomSearchEngines('multiMenu2'); // 重新加载列表
		}
	});
}
// 添加这个新函数
function addCustomSearchEngine() {
	let name = document.getElementById('customSearchEngineName').value.trim();
	let url = document.getElementById('customSearchEngineUrl').value.trim();

	if (!name || !url) {
		// 如果输入框为空，才使用提示框
		name = name || prompt("请输入新的自定义搜索引擎名称：");
		url = url || prompt("请输入新的自定义搜索引擎URL（使用 %s 表示搜索词的位置）：");
	}

	if (name && url) {
		chrome.storage.sync.get('customSearchEngines', function (data) {
			let engines = data.customSearchEngines || [];
			engines.push({ name, url });

			chrome.storage.sync.set({ customSearchEngines: engines }, function () {
				console.log('新的自定义搜索引擎已添加');
				// 清空输入框
				document.getElementById('customSearchEngineName').value = '';
				document.getElementById('customSearchEngineUrl').value = '';
				// 重新渲染两个列表
				renderCustomSearchEngineList();
				updateCustomSearchEngineList();
			});
		});
	} else {
		alert('请输入有效的名称和URL');
	}
}
function updateCustomSearchEngineList() {
	const list = document.getElementById('customSearchEngineList');
	list.innerHTML = ''; // 清空现有内容

	chrome.storage.sync.get('customSearchEngines', function (data) {
		const engines = data.customSearchEngines || [];

		engines.forEach((engine, index) => {
			const li = document.createElement('li');
			li.innerHTML = `
                <span>${engine.name}</span>
                <input type="text" value="${engine.url}" readonly>
                <button class="edit-custom-engine" data-index="${index}">编辑</button>
                <button class="delete-custom-engine" data-index="${index}">删除</button>
            `;
			list.appendChild(li);
		});

		// 为新列表添加事件监听器
		addCustomEngineEventListeners(list);
	});
}

function saveCustomSearchEngines(engines) {
	chrome.storage.sync.set({ customSearchEngines: engines }, function () {
		console.log('自定义搜索引擎已保存');
	});
}
function renderCustomSearchEngineList() {
	const list = document.querySelector('#multiMenu2 .custom-search-engine-list');
	list.innerHTML = ''; // 清空现有内容

	chrome.storage.sync.get('customSearchEngines', function (data) {
		const engines = data.customSearchEngines || [];

		engines.forEach((engine, index) => {
			const li = document.createElement('li');
			li.innerHTML = `
                <span>${engine.name}</span>
                <input type="text" value="${engine.url}" readonly>
                <button class="edit-custom-engine" data-index="${index}">编辑</button>
                <button class="delete-custom-engine" data-index="${index}">删除</button>
            `;
			list.appendChild(li);
		});

		// 添加编辑和删除的事件监听器
		addCustomEngineEventListeners(list);
	});
}
function addCustomEngineEventListeners(list) {
	list.querySelectorAll('.delete-custom-engine').forEach(button => {
		button.addEventListener('click', function () {
			const index = parseInt(this.getAttribute('data-index'));
			deleteCustomSearchEngine(index);
		});
	});

	list.querySelectorAll('.edit-custom-engine').forEach(button => {
		button.addEventListener('click', function () {
			const index = parseInt(this.getAttribute('data-index'));
			editCustomSearchEngine(index);
		});
	});
}
function addCustomSearchEnginePrompt() {
	const name = prompt("请输入新的自定义搜索引擎名称：");
	const url = prompt("请输入新的自定义搜索引擎URL（使用 %s 表示搜索词的位置）：");

	if (name && url) {
		chrome.storage.sync.get('customSearchEngines', function (data) {
			let engines = data.customSearchEngines || [];
			engines.push({ name, url });

			chrome.storage.sync.set({ customSearchEngines: engines }, function () {
				console.log('新的自定义搜索引擎已添加');
				// 重新渲染两个列表
				renderCustomSearchEngineList();
				updateCustomSearchEngineList();
			});
		});
	} else {
		alert('请输入有效的名称和URL');
	}
}
// 确保在DOM加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM内容已加载');

	renderCustomSearchEngineList();

	const addCustomSearchEngineButton = document.getElementById('addCustomSearchEngineButton');
	if (addCustomSearchEngineButton) {
		addCustomSearchEngineButton.addEventListener('click', addCustomSearchEngine);
	}

	const addMenuItemButton = document.querySelector('#multiMenu2 .add-menu-item');
	if (addMenuItemButton) {
		addMenuItemButton.addEventListener('click', addCustomSearchEnginePrompt);
	}
});

// 开始: 搜索引擎数据
const searchEngines = {
	ai: [
		{ name: "ChatGPT", url: "https://chat.openai.com/" },
		{ name: "Bard", url: "https://bard.google.com/" },
		// 添加更多AI搜索引擎...
	],
	image: [
		{
			name: "复制",
			action: "copy",
			url: "复制选中文本",
			handler: (text) => {
				navigator.clipboard.writeText(text).then(() => {
					showNotification('已复制到剪贴板');
				});
			}
		},
		{
			name: "收藏",
			action: "save",
			url: "选中文本保存到书签页面",
			handler: (text) => {
				chrome.storage.sync.get('savedBookmarks', (data) => {
					const bookmarks = data.savedBookmarks || [];
					bookmarks.push({
						text: text,
						url: window.location.href,
						date: new Date().toISOString()
					});
					chrome.storage.sync.set({ savedBookmarks: bookmarks }, () => {
						showNotification('已保存到书签');
					});
				});
			}
		},
		{
			name: "刷新",
			action: "refresh",
			url: "刷新网页，按esc可以取消",
			handler: () => {
				window.location.reload();
			}
		},
		{
			name: "侧边栏",
			action: "sidepanel",
			url: "打开侧边栏",
			handler: () => {
				chrome.runtime.sendMessage({ action: 'toggleSidePanel' });
			}
		},
		{
			name: "二维码",
			action: "qrcode",
			url: "打开侧边栏，扫描二维码复制文字",
			handler: (text) => {
				chrome.runtime.sendMessage({
					action: 'generateQRCode',
					text: text
				});
			}
		}
	],
	regular: [
		{ name: "Google", url: "https://www.google.com/search?q=%s" },
		{ name: "Bing", url: "https://www.bing.com/search?q=%s" },
		{ name: "百度", url: "https://www.baidu.com/s?wd=%s" },
		{ name: "DuckDuckGo", url: "https://duckduckgo.com/?q=%s" },
		{ name: "Yandex", url: "https://yandex.com/search/?text=%s" },
		{ name: "搜狗", url: "https://www.sogou.com/web?query=%s" },
		{ name: "360搜索", url: "https://www.so.com/s?q=%s" },
		{ name: "Yahoo", url: "https://search.yahoo.com/search?p=%s" },
		{ name: "闲鱼", url: "https://www.goofish.com/search?q=%s&spm=a21ybx.home" },
		{ name: "抖音", url: "https://www.douyin.com/search/%s" },
		{ name: "X", url: "https://twitter.com/search?q=%s" },
		{ name: "YouTube", url: "https://www.youtube.com/results?search_query=%s" },
		{ name: "V2EX", url: "https://www.v2ex.com/search?q=%s" },
		{ name: "Github", url: "https://github.com/search?q=%s" },
		{ name: "ProductHunt", url: "https://www.producthunt.com/search?q=%s" },
		{ name: "即刻", url: "https://web.okjike.com/search?keyword=%s" },
		{ name: "FaceBook", url: "https://www.facebook.com/search/top/?q=%s" },
		{ name: "bilibili", url: "https://search.bilibili.com/all?keyword=%s" },
		{ name: "知乎", url: "https://www.zhihu.com/search?q=%s" },
		{ name: "微信公众号", url: "https://weixin.sogou.com/weixin?type=2&query=%s" },
		{ name: "微博", url: "https://s.weibo.com/weibo/%s" },
		{ name: "今日头条", url: "https://so.toutiao.com/search?keyword=%s" }
		// 添加更多综合搜索引擎...
	],
	custom: [
		{ name: "谷歌图片", url: "https://images.google.com/search?q=%s" },
		{ name: "必应图片", url: "https://cn.bing.com/images/search?q=%s" },
		{ name: "百度图片", url: "https://image.baidu.com/search/index?tn=baiduimage&word=%s" },
		{ name: "搜狗图片", url: "https://pic.sogou.com/pics?query=%s" },
		{ name: "360图片", url: "https://image.so.com/i?q=%s" },
		{ name: "微博图片", url: "https://s.weibo.com/pic?q=%s" },
		{ name: "知乎图片", url: "https://www.zhihu.com/search?type=content&q=%s" },
		{ name: "小红书", url: "https://www.xiaohongshu.com/search_result?keyword=%s" },
		{ name: "花瓣网", url: "https://huaban.com/search?q=%s" },
		{ name: "堆糖", url: "https://www.duitang.com/search/?kw=%s" },
	]
};
// 处理功能动作
function handleAction(action, selectedText) {
	const functionItem = searchEngines.image.find(item => item.action === action);
	if (functionItem && functionItem.handler) {
		functionItem.handler(selectedText);
	}
}

// 更新菜单项
function updateContextMenu() {
	chrome.contextMenus.removeAll(() => {
		searchEngines.image.forEach(item => {
			chrome.contextMenus.create({
				id: item.action,
				title: item.name,
				contexts: ['selection']  // 只在选中文本时显示
			});
		});
	});
}

// 监听菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.selectionText) {
		handleAction(info.menuItemId, info.selectionText);
	}
});
function loadOptions() {
	chrome.storage.sync.get(['selectedEngines', 'id2enginemap'], function (result) {
		let id2enginemap = result.id2enginemap || {};


		// 更新 id2enginemap
		Object.entries(searchEngines).forEach(([category, engines]) => {
			engines.forEach(engine => {
				id2enginemap[engine.name.toLowerCase()] = engine.url;
			});
		});


		// 保存更新后的 id2enginemap
		chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {
		});
	});
}

function saveOptions() {
	let id2enginemap = {};

	// 从 searchEngines 更新 id2enginemap
	Object.entries(searchEngines).forEach(([category, engines]) => {
		engines.forEach(engine => {
			id2enginemap[engine.name.toLowerCase()] = engine.url;
		});
	});



	chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {

	});
}
// 确保在页面加载时执行 loadOptions
document.addEventListener('DOMContentLoaded', function () {
	loadOptions();
	// 稍微延迟执行 saveOptions，确保 loadOptions 已完成
	setTimeout(saveOptions, 1000);
});
// 为保存按钮添加事件监听器
document.addEventListener('DOMContentLoaded', function () {
	const saveButton = document.getElementById('save');
	if (saveButton) {
		saveButton.addEventListener('click', saveOptions);
	}
});
function selectEngine(engineName, selectMenu) {
	const button = selectMenu.previousElementSibling;
	button.textContent = engineName;
	// 保存选择到存储
	const direction = selectMenu.closest('.custom-select').id;
	chrome.storage.sync.get('directionEngines', (data) => {
		const directionEngines = data.directionEngines || {};
		directionEngines[direction] = engineName;
		chrome.storage.sync.set({ directionEngines: directionEngines });
	});
	hideSelectMenu(selectMenu);
}

// 在页面加载时初始化所有方向的搜索引擎列表
document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.sync.get('id2enginemap', function (data) {
		const globalId2enginemap = data.id2enginemap || {};
		updateAllEngineLists(globalId2enginemap);
	});

	// 为每个方向的按钮添加点击事件监听器
	document.querySelectorAll('.select-button').forEach(button => {
		button.addEventListener('click', function (e) {
			e.stopPropagation();
			const menu = this.nextElementSibling;
			const isMenuVisible = menu.classList.contains('show');

			// 先关闭所有打开的菜单
			document.querySelectorAll('.select-menu.show').forEach(otherMenu => {
				otherMenu.classList.remove('show');
			});

			// 如果当前菜单是隐藏的，就显示它
			if (!isMenuVisible) {
				menu.classList.add('show');
			}
		});
	});
	document.querySelectorAll('.select-menu .engine-list li').forEach(option => {
		option.addEventListener('click', function (e) {
			e.stopPropagation();
			const selectedEngineName = this.textContent;
			const customSelect = this.closest('.custom-select');
			const button = customSelect.querySelector('.select-button');
			const menu = this.closest('.select-menu');

			// 更新按钮文本
			button.textContent = selectedEngineName;

			// [修改] 直接使用相同的关闭菜单逻辑
			document.querySelectorAll('.select-menu.show').forEach(menu => {
				menu.classList.remove('show');
			});

			// 保存选择到存储
			const direction = customSelect.id;
			chrome.storage.sync.get('directionEngines', (data) => {
				const directionEngines = data.directionEngines || {};
				// 获取类别（如果有）
				const category = this.closest('.category');
				const isDisabled = category && category.querySelector('h4').textContent === '禁用';

				directionEngines[direction] = isDisabled ? 'disabled' : selectedEngineName;
				chrome.storage.sync.set({ directionEngines: directionEngines });
			});

			// 处理禁用状态
			if (this.getAttribute('data-value') === 'disabled') {
				button.classList.add('disabled');
			} else {
				button.classList.remove('disabled');
			}
		});
	});

	// [修改] 点击外部区域关闭菜单
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.custom-select')) {
			document.querySelectorAll('.select-menu.show').forEach(menu => {
				menu.classList.remove('show');
			});
		}
	});

	// 恢复保存的方向搜索引擎选择
	chrome.storage.sync.get(['directionSearchEnabled', 'directionEngines'], (data) => {
		const directionEngines = data.directionEngines || {};

		Object.keys(directionEngines).forEach(direction => {
			const button = document.querySelector(`#${direction} .select-button`);
			if (button) {
				const engineValue = directionEngines[direction];
				if (engineValue === 'disabled') {
					button.textContent = '禁用';
					button.classList.add('disabled');
				} else {
					button.textContent = engineValue;
					button.classList.remove('disabled');
				}
			}
		});
	});
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
		// 修改默认值逻辑
		if (items["directionSearchEnabled"] == null) {
			firstdefaultvalues["directionSearchEnabled"] = true; // 改为默认启用
		}
		// Save the init value
		chrome.storage.sync.set(firstdefaultvalues, function () {
			// console.log("Settings saved");
			read_options();
		});
	});
}

// 保存选中的搜索引擎到 Chrome 存储
function save_options() {
	chrome.storage.sync.set({ "icon": $("btnpreview").src, "optionskipremember": $("optionskipremember").checked, "contextmenus": $("contextmenus").checked, "searchgoogle": $("searchgoogle").checked, "searchbing": $("searchbing").checked, "searchduckduckgo": $("searchduckduckgo").checked, "searchbaidu": $("searchbaidu").checked, "searchyandex": $("searchyandex").checked, "navtop": $("navtop").checked, "navbottom": $("navbottom").checked, "navhidden": $("navhidden").checked, "typepanelzone": $("typepanelzone").checked, "typepanelcustom": $("typepanelcustom").checked, "typepanellasttime": $("typepanellasttime").checked, "websitezoomname": $("websitezoomname").value, "opentab": $("opentab").checked, "opencopy": $("opencopy").checked, "opennonebookmarks": $("opennonebookmarks").checked, "openbrowserbookmarks": $("openbrowserbookmarks").checked, "openquickbookmarks": $("openquickbookmarks").checked, "websitename1": $("websitename1").value, "websiteurl1": $("websiteurl1").value, "websitename2": $("websitename2").value, "websiteurl2": $("websiteurl2").value, "websitename3": $("websitename3").value, "websiteurl3": $("websiteurl3").value, "websitename4": $("websitename4").value, "websiteurl4": $("websiteurl4").value, "websitename5": $("websitename5").value, "websiteurl5": $("websiteurl5").value, "websitename6": $("websitename6").value, "websiteurl6": $("websiteurl6").value, "websitename7": $("websitename7").value, "websiteurl7": $("websiteurl7").value, "websitename8": $("websitename8").value, "websiteurl8": $("websiteurl8").value, "websitename9": $("websitename9").value, "websiteurl9": $("websiteurl9").value, "websitename10": $("websitename10").value, "websiteurl10": $("websiteurl10").value, "googlesidepanel": $("googlesidepanel").checked, "zoom": $("zoom").checked, "defaultzoom": $("defaultzoom").value, "directionSearchEnabled": $("directionSearchToggle").checked, "step": $("step").value });
}
// 确保在DOM加载完成后正确初始化复选框状态
document.addEventListener('DOMContentLoaded', function () {
	// ... existing code ...

	const directionSearchToggle = $("directionSearchToggle");
	if (directionSearchToggle) {
		// 读取存储的值并设置复选框状态
		chrome.storage.sync.get("directionSearchEnabled", function (items) {
			directionSearchToggle.checked = items.directionSearchEnabled !== false;
		});

		// 添加change事件监听器
		directionSearchToggle.addEventListener('change', save_options);
	}
});
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
	var stefanvdurl = linkproduct;
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
const TabManager = {
	hasLoaded: false,
	currentCategory: null,
	loadedEngines: {},

	init() {
		if (this.hasLoaded) return;
		this.bindEvents();
		this.loadInitialTab();
		this.hasLoaded = true;
	},

	bindEvents() {
		const tabs = document.querySelectorAll('.tab');
		tabs.forEach(tab => {
			tab.addEventListener('click', () => this.switchTab(tab));
		});
	},

	loadInitialTab() {
		const defaultTab = document.querySelector('.tab');
		if (defaultTab) {
			this.switchTab(defaultTab);
		}
	},

	switchTab(tab) {
		if (!tab || !tab.dataset.category) {
			console.error('无效的标签元素');
			return;
		}

		document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
		tab.classList.add('active');

		const category = tab.dataset.category;
		this.currentCategory = category;
		this.loadTabContent(category);
	},

	loadTabContent(category) {
		const tabContent = document.getElementById('tabContent');
		if (!tabContent) {
			console.error('找不到tabContent元素');
			return;
		}

		// 修改这里：先检查存储中是否有状态数据
		chrome.storage.sync.get([`${category}SearchEngines`, `${category}EngineStates`], (result) => {
			let engines = result[`${category}SearchEngines`];
			const states = result[`${category}EngineStates`] || {};

			if (!engines) {
				engines = this.getDefaultEngines(category);
				// 保存默认引擎到存储
				chrome.storage.sync.set({
					[`${category}SearchEngines`]: engines,
					[`${category}EngineStates`]: this.getDefaultStates(engines)
				});
			}

			// 合并状态
			engines = engines.map(engine => ({
				...engine,
				enabled: states[engine.name] !== undefined ? states[engine.name] : (engine.enabled || true)
			}));

			this.renderEngines(engines, category);
		});
	},

	// 新增：获取默认状态
	getDefaultStates(engines) {
		const states = {};
		engines.forEach(engine => {
			states[engine.name] = engine.enabled !== false;
		});
		return states;
	},

	getDefaultEngines(category) {
		const defaults = {
			ai: [
				{ name: 'ChatGPT', url: 'https://chat.openai.com', enabled: true },
				{ name: '文心一言', url: 'https://yiyan.baidu.com', enabled: true }
			],
			regular: [
				{ name: 'Google', url: 'https://www.google.com/search?q=', enabled: true },
				{ name: 'Bing', url: 'https://www.bing.com/search?q=', enabled: true }
			],
			image: [
				{ name: 'Google图片', url: 'https://images.google.com/search?q=', enabled: true },
				{ name: 'Bing图片', url: 'https://www.bing.com/images/search?q=', enabled: true }
			],
			custom: []
		};
		return defaults[category] || [];
	},

	renderEngines(engines, category) {
		const tabContent = document.getElementById('tabContent');
		const ul = document.createElement('ul');
		ul.className = 'engine-list';

		engines.forEach((engine, index) => {
			const li = document.createElement('li');
			li.className = 'engine-item';
			li.draggable = true;

			li.innerHTML = `
                <div class="engine-row">
                    <input type="checkbox" 
                           id="${category}-engine-${index}" 
                           class="engine-checkbox" 
                           ${engine.enabled ? 'checked' : ''}>
                    <label class="engine-name" for="${category}-engine-${index}">${engine.name}</label>
                    <input type="text" 
                           class="engine-url" 
                           value="${engine.url}" 
                           ${category === 'custom' ? '' : 'readonly'}>
                    <div class="engine-controls">
                        <button class="edit-btn">编辑</button>
                        <button class="delete-btn">删除</button>
                    </div>
                </div>
            `;

			this.addEngineListeners(li, engine, index, category);
			this.addDragListeners(li, index);
			ul.appendChild(li);
		});

		tabContent.innerHTML = '';
		tabContent.appendChild(ul);
	},

	addEngineListeners(li, engine, index, category) {
		// 复选框事件监听
		const checkbox = li.querySelector('.engine-checkbox');
		checkbox.addEventListener('change', () => {
			this.updateEngineState(category, engine.name, checkbox.checked);
		});

		// 编辑按钮事件监听
		const editBtn = li.querySelector('.edit-btn');
		editBtn.addEventListener('click', () => {
			this.editEngine(category, index, engine);
		});

		// 删除按钮事件监听
		const deleteBtn = li.querySelector('.delete-btn');
		deleteBtn.addEventListener('click', () => {
			this.deleteEngine(category, index);
		});
	},

	// 修改：更新引擎状态的方法
	updateEngineState(category, engineName, enabled) {
		chrome.storage.sync.get([`${category}EngineStates`, 'directionEngineSettings'], (result) => {
			const states = result[`${category}EngineStates`] || {};
			states[engineName] = enabled;

			// 获取方向设置
			const directionSettings = result.directionEngineSettings || {};

			// 如果禁用搜索引擎，检查并清除相应的方向设置
			if (!enabled) {
				Object.keys(directionSettings).forEach(direction => {
					if (directionSettings[direction] === `${category}:${engineName}`) {
						directionSettings[direction] = 'disabled';
					}
				});
			}

			// 保存两个设置
			chrome.storage.sync.set({
				[`${category}EngineStates`]: states,
				directionEngineSettings: directionSettings
			}, () => {
				console.log(`搜索引擎 ${engineName} 状态已更新为: ${enabled}`);
				// 更新方向下拉菜单
				this.updateDirectionMenus();
			});
		});
	},
 // 新增：更新方向下拉菜单
    updateDirectionMenus() {
        const directions = [
            'direction-left-up',
            'direction-up',
            'direction-right-up',
            'direction-left',
            'direction-right',
            'direction-left-down',
            'direction-down',
            'direction-right-down'
        ];

        chrome.storage.sync.get(['directionEngineSettings'], (result) => {
            const settings = result.directionEngineSettings || {};
            
            directions.forEach(direction => {
                const select = document.querySelector(`#${direction} .select-button`);
                if (select) {
                    const currentSetting = settings[direction];
                    if (currentSetting && currentSetting !== 'disabled') {
                        const [category, engineName] = currentSetting.split(':');
                        select.textContent = engineName || '选择搜索引擎';
                    } else {
                        select.textContent = '选择搜索引擎';
                    }
                }
            });
        });
    },

    // 新增：初始化方向下拉菜单
    initDirectionMenus() {
        document.addEventListener('click', (e) => {
            // 关闭所有其他打开的菜单
            const allMenus = document.querySelectorAll('.select-menu');
            allMenus.forEach(menu => {
                // 如果点击的不是当前菜单或其子元素，则关闭菜单
                if (!menu.contains(e.target) && !e.target.closest('.select-button')) {
                    menu.style.display = 'none';
                }
            });
        });

        // 为每个方向选择器添加事件监听
        const directions = document.querySelectorAll('.custom-select');
        directions.forEach(select => {
            const button = select.querySelector('.select-button');
            const menu = select.querySelector('.select-menu');
            
            // 点击按钮时切换菜单显示
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                
                // 关闭其他打开的菜单
                const otherMenus = document.querySelectorAll('.select-menu');
                otherMenus.forEach(otherMenu => {
                    if (otherMenu !== menu) {
                        otherMenu.style.display = 'none';
                    }
                });

                // 切换当前菜单
                if (menu.style.display === 'none' || !menu.style.display) {
                    this.populateEngineMenu(menu);
                    menu.style.display = 'block';
                } else {
                    menu.style.display = 'none';
                }
            });
        });

        // 初始加载方向设置
        this.updateDirectionMenus();
    },
	populateEngineMenu(menu) {
		const categories = ['ai', 'regular', 'image', 'custom'];

		chrome.storage.sync.get([
			...categories.map(cat => `${cat}SearchEngines`),
			...categories.map(cat => `${cat}EngineStates`),
			'directionEngineSettings'
		], (result) => {
			const directionId = menu.closest('.custom-select').id;
			const currentSetting = (result.directionEngineSettings || {})[directionId];

			// 清空现有内容
			menu.querySelectorAll('.engine-list').forEach(list => {
				list.innerHTML = '';
			});

			categories.forEach(category => {
				const engines = result[`${category}SearchEngines`] || [];
				const states = result[`${category}EngineStates`] || {};

				const categoryList = menu.querySelector(`.${category} .engine-list`);
				if (categoryList) {
					engines.forEach(engine => {
						if (states[engine.name]) {
							const li = document.createElement('li');
							const engineValue = `${category}:${engine.name}`;
							li.dataset.value = engineValue;
							li.textContent = engine.name;

							// 标记当前选中的选项
							if (currentSetting === engineValue) {
								li.classList.add('selected');
							}

							li.addEventListener('click', (e) => {
								e.stopPropagation();
								// 移除所有选中状态
								menu.querySelectorAll('.engine-list li').forEach(item => {
									item.classList.remove('selected');
								});
								// 添加新的选中状态
								li.classList.add('selected');
								this.updateDirectionSetting(directionId, engineValue);
							});

							categoryList.appendChild(li);
						}
					});
				}
			});

			// 添加禁用选项
			const disabledList = menu.querySelector('.disabled .engine-list');
			if (disabledList) {
				const li = document.createElement('li');
				li.dataset.value = 'disabled';
				li.textContent = '禁用此方向';

				if (currentSetting === 'disabled' || !currentSetting) {
					li.classList.add('selected');
				}

				li.addEventListener('click', (e) => {
					e.stopPropagation();
					menu.querySelectorAll('.engine-list li').forEach(item => {
						item.classList.remove('selected');
					});
					li.classList.add('selected');
					this.updateDirectionSetting(directionId, 'disabled');
				});

				disabledList.appendChild(li);
			}
		});
	},

	updateDirectionSetting(directionId, value) {
		chrome.storage.sync.get(['directionEngineSettings'], (result) => {
			const settings = result.directionEngineSettings || {};
			settings[directionId] = value;

			chrome.storage.sync.set({ directionEngineSettings: settings }, () => {
				// 更新按钮文本
				const button = document.querySelector(`#${directionId} .select-button`);
				if (button) {
					if (value === 'disabled') {
						button.textContent = '选择搜索引擎';
					} else {
						const engineName = value.split(':')[1];
						button.textContent = engineName;
					}
				}

				// 立即关闭当前菜单
				const currentMenu = document.querySelector(`#${directionId} .select-menu`);
				if (currentMenu) {
					currentMenu.style.display = 'none';
				}

				// 更新所有菜单中的选中状态
				this.updateAllMenusSelection(value);
			});
		});
	},
	
    // 新增：更新所有菜单的选中状态
    updateAllMenusSelection(selectedValue) {
        const allMenus = document.querySelectorAll('.select-menu');
        allMenus.forEach(menu => {
            const items = menu.querySelectorAll('.engine-list li');
            items.forEach(item => {
                if (item.dataset.value === selectedValue) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        });
    },
    init() {
        if (this.hasLoaded) return;
        this.bindEvents();
        this.loadInitialTab();
        this.initDirectionMenus(); // 添加这行
        this.hasLoaded = true;
    },
	editEngine(category, index, engine) {
		const newName = prompt('请输入新的搜索引擎名称:', engine.name);
		const newUrl = prompt('请输入新的搜索引擎URL:', engine.url);

		if (newName && newUrl) {
			chrome.storage.sync.get([`${category}SearchEngines`, `${category}EngineStates`], (result) => {
				const engines = result[`${category}SearchEngines`] || [];
				const states = result[`${category}EngineStates`] || {};

				// 更新引擎数据
				engines[index] = {
					...engines[index],
					name: newName,
					url: newUrl
				};

				// 更新状态数据
				if (engine.name !== newName) {
					states[newName] = states[engine.name];
					delete states[engine.name];
				}

				// 保存更新
				chrome.storage.sync.set({
					[`${category}SearchEngines`]: engines,
					[`${category}EngineStates`]: states
				}, () => {
					this.renderEngines(engines, category);
				});
			});
		}
	},

	deleteEngine(category, index) {
		if (confirm('确定要删除这个搜索引擎吗？')) {
			chrome.storage.sync.get([`${category}SearchEngines`, `${category}EngineStates`], (result) => {
				const engines = result[`${category}SearchEngines`] || [];
				const states = result[`${category}EngineStates`] || {};

				// 删除状态数据
				delete states[engines[index].name];

				// 删除引擎数据
				engines.splice(index, 1);

				// 保存更新
				chrome.storage.sync.set({
					[`${category}SearchEngines`]: engines,
					[`${category}EngineStates`]: states
				}, () => {
					this.renderEngines(engines, category);
				});
			});
		}
	},
	addDragListeners(li, index) {
		li.addEventListener('dragstart', (e) => {
			e.dataTransfer.setData('text/plain', index.toString());
			li.classList.add('dragging');
		});

		li.addEventListener('dragend', () => {
			li.classList.remove('dragging');
		});

		li.addEventListener('dragover', (e) => {
			e.preventDefault();
		});

		li.addEventListener('drop', (e) => {
			e.preventDefault();
			const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
			const toIndex = index;
			this.reorderEngines(fromIndex, toIndex);
		});
	},

	reorderEngines(fromIndex, toIndex) {
		if (this.currentCategory) {
			chrome.storage.sync.get([`${this.currentCategory}SearchEngines`], (result) => {
				const engines = result[`${this.currentCategory}SearchEngines`] || [];
				const [movedEngine] = engines.splice(fromIndex, 1);
				engines.splice(toIndex, 0, movedEngine);

				// 保存新顺序
				chrome.storage.sync.set({ [`${this.currentCategory}SearchEngines`]: engines }, () => {
					this.renderEngines(engines, this.currentCategory);
				});
			});
		}
	}
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
	TabManager.init();
});
document.addEventListener('DOMContentLoaded', () => {
  // 初始化标签管理器
  TabManager.init();

  // 加载其他设置
  loadSavedPages();
  restoreCheckboxStates();
  addCheckboxListeners();

  // 加载搜索引擎映射
  chrome.storage.sync.get('id2enginemap', data => {
    const globalId2enginemap = data.id2enginemap || {};
    updateAllEngineLists(globalId2enginemap);
  });

  // 应用样式
  applyStyles();
});
function updateAllEngineLists(globalId2enginemap) {
	const directions = ['left-up', 'up', 'right-up', 'left', 'right', 'left-down', 'down', 'right-down'];

	directions.forEach(direction => {
		const selectMenu = document.querySelector(`#direction-${direction} .select-menu`);
		if (selectMenu) {
			updateEngineList(selectMenu, globalId2enginemap);
		}
	});
}
function updateEngineList(selectMenu, globalId2enginemap) {
	// 检查是否已经加载过
	if (selectMenu.dataset.loaded === 'true') {
		return;
	}

	const categories = ['ai', 'regular', 'image', 'custom'];

	categories.forEach(category => {
		const list = selectMenu.querySelector(`.category.${category} .engine-list`);
		if (!list) return;

		// 清空现有内容
		list.innerHTML = '';

		// 从 TabManager 缓存获取数据
		chrome.storage.sync.get([`${category}SearchEngines`], data => {
			const engines = data[`${category}SearchEngines`] || [];
			const enabledEngines = engines.filter(e => e.enabled !== false);

			// 只渲染启用的搜索引擎
			enabledEngines.forEach(engine => {
				const li = document.createElement('li');
				li.textContent = engine.name;
				li.setAttribute('data-url', engine.url);
				li.addEventListener('click', () => selectEngine(engine.name, selectMenu));
				list.appendChild(li);
			});
		});
	});

	// 标记该菜单已加载
	selectMenu.dataset.loaded = 'true';
}
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
// 保存复选框状态的函数
function saveCheckboxState(checkboxId) {
	const checkbox = document.getElementById(checkboxId);
	chrome.storage.sync.set({ [checkboxId]: checkbox.checked }, function () {
		console.log(`${checkboxId} 状态已保存: ${checkbox.checked}`);
	});
}

// 为所有复选框添加change事件监听器
function addCheckboxListeners() {
	checkboxIds.forEach(id => {
		const checkbox = document.getElementById(id);
		if (checkbox) {
			checkbox.addEventListener('change', function () {
				saveCheckboxState(id);
			});
		} else {
			console.warn(`未找到ID为 ${id} 的复选框`);
		}
	});
}

// 从存储中恢复复选框状态
function restoreCheckboxStates() {
	chrome.storage.sync.get(checkboxIds, function (items) {
		checkboxIds.forEach(id => {
			if (items[id] !== undefined) {
				const checkbox = document.getElementById(id);
				if (checkbox) {
					checkbox.checked = items[id];
					console.log(`${id} 状态已恢复: ${items[id]}`);
				}
			}
		});
	});
}

// 更新搜索引擎选项
chrome.runtime.sendMessage({
	action: 'updateSearchEngines',
	copyOption: copyCheckbox.checked,
	deleteOption: deleteCheckbox.checked,
	jumpOption: jumpCheckbox.checked,
	closeOption: closeCheckbox.checked,
	refreshOption: refreshCheckbox.checked,
	downloadOption: downloadCheckbox.checked,
	pasteOption: pasteCheckbox.checked,
	closesidepanelOption: closesidepanelCheckbox.checked
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
}
// 更新所有方向的搜索引擎列表
function updateAllEngineLists(globalId2enginemap) {
	const directions = ['left-up', 'up', 'right-up', 'left', 'right', 'left-down', 'down', 'right-down'];

	// 使用 Set 记录已处理的菜单
	const processedMenus = new Set();

	directions.forEach(direction => {
		const selectMenu = document.querySelector(`#direction-${direction} .select-menu`);
		if (selectMenu && !processedMenus.has(selectMenu)) {
			updateEngineList(selectMenu, globalId2enginemap);
			processedMenus.add(selectMenu);
		}
	});
}
// 添加一个函数来监听搜索引擎启用状态的变化
// 监听搜索引擎变化
function listenToEngineChanges() {
	const categories = ['ai', 'regular', 'image', 'custom'];

	categories.forEach(category => {
		chrome.storage.onChanged.addListener((changes, area) => {
			if (area === 'sync' && changes[`${category}SearchEngines`]) {
				// 重置所有菜单的加载状态
				document.querySelectorAll('.select-menu').forEach(menu => {
					menu.dataset.loaded = 'false';
				});
				// 重新加载所有菜单
				updateAllEngineLists({});
			}
		});
	});
}
// 新增或修改整个函数
function updateTabContentUI(category, engineMap, globalId2enginemap) {
	let engines = {};

	// 合并预设和自定义搜索引擎
	if (engineMap[category]) {
		engines = { ...engines, ...engineMap[category] };
	}
	Object.keys(globalId2enginemap).forEach(key => {
		if (key.startsWith(category + '_')) {
			engines[key.replace(category + '_', '')] = globalId2enginemap[key];
		}
	});

	let content = `
        <h2>${getCategoryName(category)}引擎</h2>
        <ul id="${category}EngineList" class="engine-list">
            ${Object.entries(engines).map(([name, url]) => `
                <li>
                    <span>${name}: ${url}</span>
                    <button class="delete-engine" data-category="${category}" data-name="${name}">删除</button>
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

	// 重新添加事件监听器
	document.getElementById(`add${capitalize(category)}Engine`).addEventListener('click', () => addEngine(category));
	document.getElementById(`${category}EngineList`).addEventListener('click', function (e) {
		if (e.target.classList.contains('delete-engine')) {
			deleteEngine(e.target.dataset.category, e.target.dataset.name);
		}
	});
}
// 添加新的搜索引擎
function addEngine(category) {
	const nameInput = document.getElementById(`${category}EngineName`);
	const urlInput = document.getElementById(`${category}EngineUrl`);
	const name = nameInput.value.trim();
	const url = urlInput.value.trim();

	if (name && url) {
		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			let engineMap = data.engineMap || {};
			let globalId2enginemap = data.id2enginemap || {};

			if (!engineMap[category]) {
				engineMap[category] = {};
			}
			engineMap[category][name] = url;
			globalId2enginemap[`${category}_${name}`] = url;

			chrome.storage.sync.set({
				'engineMap': engineMap,
				'id2enginemap': globalId2enginemap
			}, function () {
				if (chrome.runtime.lastError) {
					console.error('添加搜索引擎时发生错误:', chrome.runtime.lastError);
					alert('添加搜索引擎时发生错误，请重试。');
				} else {
					alert('搜索引擎添加成功！');
					nameInput.value = '';
					urlInput.value = '';
					// 新增: 更新界面

					updateCurrentTabContent(category, globalId2enginemap);
					updateAllEngineLists(globalId2enginemap);
				}
			});
		});
	} else {
		alert('请输入有效的搜索引擎名称和URL。');
	}
}
// 新增: updateCurrentTabContent 函数
function updateCurrentTabContent(category, globalId2enginemap) {
	const tabContent = document.getElementById('tabContent');
	if (tabContent) {
		let content = `
            <h2>${getCategoryName(category)}引擎</h2>
            <ul id="${category}EngineList" class="engine-list">
                ${Object.entries(globalId2enginemap)
				.filter(([key]) => key.startsWith(category + '_'))
				.map(([key, url]) => {
					const name = key.replace(category + '_', '');
					return `
                            <li>
                                <span>${name}: ${url}</span>
                                <button class="delete-engine" data-category="${category}" data-name="${name}">删除</button>
                            </li>
                        `;
				}).join('')}
            </ul>
            <div class="add-engine-form">
                <input type="text" id="${category}EngineName" placeholder="搜索引擎名称">
                <input type="text" id="${category}EngineUrl" placeholder="搜索引擎 URL">
                <button id="add${capitalize(category)}Engine">添加${getCategoryName(category)}引擎</button>
            </div>
        `;
		tabContent.innerHTML = content;

		// 使用事件委托处理删除按钮的点击事件
		tabContent.addEventListener('click', function (event) {
			if (event.target.classList.contains('delete-engine')) {
				const category = event.target.getAttribute('data-category');
				const name = event.target.getAttribute('data-name');
				deleteEngine(category, name);
			}
		});

		// 为添加按钮添加事件监听器（确保只添加一次）
		const addButton = document.getElementById(`add${capitalize(category)}Engine`);
		if (addButton) {
			// 移除可能存在的旧事件监听器
			addButton.removeEventListener('click', addEngine);
			// 添加新的事件监听器
			addButton.addEventListener('click', () => addEngine(category));
		}
	}
}
// 辅助函数
function getCategoryName(category) {
	const names = {
		ai: 'AI 搜索',
		image: '功能搜索',
		regular: '综合搜索',
		custom: '自定义搜索'
	};
	return names[category] || category;
}

function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
// 保持现有的存储变化监听器
chrome.storage.onChanged.addListener(function (changes, namespace) {
	if (namespace === 'sync' && (changes.engineMap || changes.id2enginemap)) {
		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			updateAllEngineLists(globalId2enginemap);

			loadTabContent(document.querySelector('.tab.active').dataset.category);
		});
	}
});
chrome.storage.onChanged.addListener(function (changes, namespace) {
	if (namespace === 'sync') {
		const relevantChanges = [
			'multiMenu1Engines',
			'aiSearchEngines',
			'regularSearchEngines'
		];

		if (relevantChanges.some(key => changes[key])) {
			loadMultiMenu('multiMenu2');
		}
	}
});
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
// 添加这个事件监听器
directionSearchToggle.addEventListener('change', function () {
	saveDirectionSearchSetting();
	updateDirectionSearchUI();
});

// 初始化
document.addEventListener('DOMContentLoaded', function () {
	const directionSearchToggle = document.getElementById('directionSearchToggle');
	if (directionSearchToggle) {
		directionSearchToggle.addEventListener('change', function () {
			saveDirectionSearchSetting();
			updateDirectionSearchUI();
		});

		// 直接设置为未选中状态
		directionSearchToggle.checked = false;

		// 初始化存储中的设置为 false
		chrome.storage.sync.set({ directionSearchEnabled: false }, function () {
			console.log('方向搜索初始化为关闭状态');
			updateDirectionSearchUI(); // 更新UI显示
		});

		// 后续的设置变更才使用 get
		chrome.storage.sync.get('directionSearchEnabled', (data) => {
			if (data.hasOwnProperty('directionSearchEnabled')) {
				directionSearchToggle.checked = data.directionSearchEnabled;
				updateDirectionSearchUI();
			}
		});
	}

	// 添加这个新函数
	function saveDirectionSearchSetting() {
		const directionSearchToggle = document.getElementById('directionSearchToggle');
		chrome.storage.sync.set({ directionSearchEnabled: directionSearchToggle.checked }, () => {
			console.log('方向搜索功能状态已更新:', directionSearchToggle.checked);
		});
	}


	// 修改：更新UI函数
	function updateDirectionSearchUI() {
		const directionSearchToggle = document.getElementById('directionSearchToggle');
		// 新增: 加载保存的设置
		chrome.storage.sync.get(['searchEnabled'], function (result) {
			directionSearchToggle.checked = result.searchEnabled !== false;
		});

		// 新增: 保存设置
		directionSearchToggle.addEventListener('change', function () {
			chrome.storage.sync.set({ searchEnabled: this.checked });
		});
		const emojiDirections = document.querySelector('.emoji-directions');
		if (emojiDirections) {
			emojiDirections.style.display = directionSearchToggle.checked ? 'grid' : 'none';
			console.log('方向搜索UI已更新,显示状态:', emojiDirections.style.display);
		}
	}

	// 修改：监听复选框状态变化
	directionSearchToggle.addEventListener('change', function () {
		saveDirectionSearchSetting();
		updateDirectionSearchUI();
		console.log('方向搜索开关状态已更改:', this.checked);
	});

	// 修改：页面加载时初始化设置
	loadSettings();
	loadCurrentSearchEngines();
	initCustomSelects();
	updateAllEngineLists(); // 初始化所有 select-menu
	const firstTab = document.querySelector('.tab');
	if (firstTab) {
		loadTabContent(firstTab.dataset.category);
	}
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
	chrome.storage.sync.get('gridConfig', function (result) {
		gridConfig = result.gridConfig || new Array(24).fill(null);
		updateGridUI();
	});
}

function saveGridConfig() {
	chrome.storage.sync.set({ gridConfig: gridConfig }, function () {
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
	fileInput.onchange = function (event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (e) {
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
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { action: "updateGridConfig", config: gridConfig });
	});
}

document.addEventListener('DOMContentLoaded', function () {
	loadGridConfig();
	document.getElementById('save-config').addEventListener('click', saveGridConfig);
	document.getElementById('import-config').addEventListener('click', importConfig);
	document.getElementById('export-config').addEventListener('click', exportConfig);
	document.getElementById('modal-save').addEventListener('click', saveGridItem);
	document.getElementById('modal-cancel').addEventListener('click', hideModal);

});


//引入setting.js
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
	chrome.tabs.sendMessage(tabs[0].id, {
		action: 'updateDirectionSearchSettings',
		directionSearchEnabled: directionSearchEnabled,
		directionEngines: directionEngines
	});
});
const uppercaseWords = (str) => str.replace(/^(.)|\s+(.)/g, (c) => c.toUpperCase());
/// 监听存储变化
chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (areaName === 'sync' && changes.id2enginemap) {
		var newEngineMap = changes.id2enginemap.newValue;
		updateDirectionSelectors(newEngineMap);
	}
});
// 更新方向选择的下拉列表
function updateDirectionSelectors(newEngineMap) {
	const directionSelectors = document.querySelectorAll('.emoji-directions select');
	directionSelectors.forEach(selector => {
		// 保存当前选择的搜索引擎名称
		const currentSelection = selector.value;

		// 清空现有选项
		selector.innerHTML = "";

		// 添加空白选项
		const blankOption = document.createElement('option');
		blankOption.value = ''; // 设置值为空字符串
		blankOption.textContent = '--'; // 显示为 "--" 或其他占位符
		selector.appendChild(blankOption);

		// 添加新的搜索引擎选项
		Object.keys(newEngineMap).forEach(engineName => {
			const option = document.createElement('option');
			option.textContent = engineName;
			option.value = engineName;
			selector.appendChild(option);
		});

		// 恢复之前的选中状态
		selector.value = currentSelection || ''; // 如果当前选择为空，则默认选中空白选项
	});
}

// 初始化时调用更新函数
chrome.storage.sync.get('id2enginemap', function (data) {
	updateDirectionSelectors(data.id2enginemap || {});
});

// 监听存储变化
chrome.storage.onChanged.addListener(function (changes, areaName) {
	if (areaName === 'sync' && changes.id2enginemap) {
		var newEngineMap = changes.id2enginemap.newValue;
		updateDirectionSelectors(newEngineMap);
	}
});

// search engine settings
(function () {
	const searchEngines = document.getElementById('search-engines')



	for (let name of searchEngineNames) {
		const engine = document.createElement('option')
		engine.innerText = uppercaseWords(name)
		searchEngines.appendChild(engine)
	}

	const component = 'engine'
	chrome.storage.sync.get(component, function (o) {
		if (o && o[component]) {
			const index = searchEngineNames.indexOf(o[component])
			if (index > -1) {
				searchEngines.selectedIndex = index
			}
		} else {
			// 如果没有找到匹配项，设置第一个选项（空字符串）为选中状态
			searchEngines.selectedIndex = 0;
		}
	})

	searchEngines.addEventListener('change', () => {
		chrome.storage.sync.set({
			[component]: searchEngineNames[searchEngines.selectedIndex]
		})
	})

	document.querySelector('.' + component + 'caption').innerText =
		chrome.i18n.getMessage(component + 'Title')

	//const directions = ['up', 'left', 'right', 'down']
	const directions = ['left-up', 'up', 'right-up', 'left', 'right', 'left-down', 'down', 'right-down']
	const prefix = 'direction-'

	directions.forEach(direction => {
		const d = document.querySelector(`#${prefix}${direction}`)

		for (let name of searchEngineNames) {
			const engine = document.createElement('option')
			engine.innerText = uppercaseWords(name)
			d.appendChild(engine)
		}

		d.addEventListener('change', () => {
			chrome.storage.sync.set({
				[`#${prefix}${direction}`]: searchEngineNames[d.selectedIndex]
			})
		})

		chrome.storage.sync.get([`#${prefix}${direction}`], function (o) {
			if (o && o[`#${prefix}${direction}`]) {
				const index = searchEngineNames.indexOf(o[`#${prefix}${direction}`])
				if (index > -1) {
					d.selectedIndex = index
				}
			}
		})
	})

})();

// tabmode
(function () {
	const component = 'tabmode'

	var components = document.querySelectorAll('input[name="' + component + '"]')
	console.log(components)

	chrome.storage.sync.get(component, function (o) {
		if (o && o[component]) {
			for (var i = 0; i < components.length; i++) {
				if (components[i].value === o[component]) {
					components[i].checked = true
					break
				}
			}
		} else {
			var t = {}
			t[component] = components[0].value
			chrome.storage.sync.set(t)
			components[0].checked = true
		}
	})

	function clickHandler(e) {
		var t = {}
		t[this.name] = this.value
		chrome.storage.sync.set(t)
	}

	components.forEach((e) => {
		e.addEventListener('click', clickHandler, !0)
	})

	document.querySelector('.' + component + 'caption').innerText =
		chrome.i18n.getMessage(component + 'Title')
})();


(function () {
	let button = document.querySelector('.toggle');
	button.addEventListener('click', function () {
		let controls = document.querySelector('div[id="controls"]');

		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			if (tabs && tabs.length > 0) {
				var current = tabs[tabs.length - 1]
				let url = current.url;

				if (controls.style.display == 'none') {
					controls.style.display = 'block';
					button.innerText = 'Disable on this page'
				} else {
					controls.style.display = 'none';
					button.innerText = 'Enable on this page'
				}

				var o = {};
				o[url] = controls.style.display === 'none';
				chrome.storage.sync.set(o);

				chrome.scripting.executeScript(current.tabId, {
					code: "window['" + url + "']=" + o[url],
					allFrames: true,
				})
			}
		});

	});

	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		if (tabs && tabs.length > 0) {
			var current = tabs[tabs.length - 1]
			let url = current.url;

			chrome.storage.sync.get(url, function (o) {
				let controls = document.querySelector('div[id="controls"]');
				if (o && o[url]) {
					controls.style.display = 'none';
					button.innerText = 'Enable on this page'
				} else {
					controls.style.display = 'block';
					button.innerText = 'Disable on this page'
				}
			})
		}
	})



	let RenderUI = o => {
		for (let dw of o["domain-whitelist"]) {
			UpdateUI(dw)
		}
	}

	let UpdateUI = dw => {
		let domain = document.createElement("label");
		domain.innerText = dw;
		let removeButton = document.createElement("button");
		removeButton.innerText = "x";
		removeButton.addEventListener("click", () => {
			chrome.storage.sync.get("domain-whitelist", o => {
				if (o && o["domain-whitelist"]) {
					let dwl = o["domain-whitelist"]
					let i = dwl.indexOf(dw);
					dwl.splice(i, 1)
					o["domain-whitelist"] = dwl;
					chrome.storage.sync.set(o)

					// remove DOM
					let container = document.querySelector(".domain-whitelist")
					for (let child of container.children) {
						if (child.key == dw) {
							container.removeChild(child);
							break;
						}
					}
				} else {
					o["domain-whitelist"] = [url.hostname]
					chrome.storage.sync.set(o)
				}
			})
		})
		removeButton.classList.add("remove");
		let row = document.createElement("div");
		row.appendChild(removeButton);
		row.appendChild(domain);
		row.key = dw;
		row.classList.add("row")
		let container = document.querySelector(".domain-whitelist")
		container.appendChild(row);
	}


	chrome.storage.sync.get("domain-whitelist", o => {
		if (o && o["domain-whitelist"]) {
			RenderUI(o)
		}
	})

	document.querySelector("#add").addEventListener("click", () => {
		let domain = document.querySelector("input[name=add]").value
		try {
			let url = new URL(domain)
			chrome.storage.sync.get("domain-whitelist", o => {
				if (o && o["domain-whitelist"]) {
					let dwl = o["domain-whitelist"]
					dwl.push(url.hostname)
					o["domain-whitelist"] = dwl;
					chrome.storage.sync.set(o)
				} else {
					o["domain-whitelist"] = [url.hostname]
					chrome.storage.sync.set(o)
				}

				UpdateUI(url.hostname)
			})
		} catch (e) {
			document.querySelector(".error-tips").classList.add("visible");
			let st = setTimeout(() => {
				document.querySelector(".error-tips").classList.remove("visible");
				clearTimeout(st);
			}, 2800)
		}
	})

})();


function saveEngineSettings(engineName, engineUrl) {
	const normalizedUrl = normalizeUrl(engineUrl);
	chrome.storage.sync.get('engineData', function (result) {
		let engineData = result.engineData || {};
		engineData[normalizedUrl] = { name: engineName, url: engineUrl };
		chrome.storage.sync.set({ engineData }, function () {
			console.log('Engine data saved');
		});
	});
}

function normalizeUrl(url) {
	// 移除协议，将所有字符转为小写，移除尾部斜杠
	return url.replace(/^https?:\/\//, '').toLowerCase().replace(/\/$/, '');
}
//悬浮窗

document.addEventListener('DOMContentLoaded', function () {
	initializeTab3();
});

function initializeTab3() {
	console.log('Initializing Tab3');

	// 设置标签切换
	const tabButtons = document.querySelectorAll('#tab3 .tab-button');
	const tabPanes = document.querySelectorAll('#tab3 .tab-pane');

	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const tabId = button.getAttribute('data-tab');
			switchTab(tabId);
		});
	});

	// 初始化加载两个多重菜单
	loadMultiMenu('multiMenu1');
	loadMultiMenu('multiMenu2');

	// 确保第一个标签页是活跃的
	switchTab('topEngineList');
}

function switchTab(tabId) {
	console.log('Switching to tab:', tabId);
	document.querySelectorAll('#tab3 .tab-button').forEach(btn => {
		btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
	});
	document.querySelectorAll('#tab3 .tab-pane').forEach(pane => {
		pane.classList.toggle('active', pane.id === tabId);
	});
}


function loadMultiMenu(containerId) {
	const container = document.querySelector(`#${containerId} .ai-search-engine-list`);
	if (!container) return;

	container.innerHTML = '';

	if (containerId === 'multiMenu1') {
		// 加载多重菜单1的内容
		chrome.storage.sync.get(['multiMenu1Engines'], function (data) {
			const engines = data.multiMenu1Engines || [];
			renderEngineList(container, engines, 'multiMenu1');
		});
	} else if (containerId === 'multiMenu2') {
		// 加载所有选中的搜索引擎
		chrome.storage.sync.get([
			'multiMenu1Engines',
			'aiSearchEngines',
			'regularSearchEngines'
		], function (data) {
			// 获取所有选中的引擎
			const selectedEngines = getSelectedEngines(data);
			renderEngineList(container, selectedEngines, 'multiMenu2');
		});
	}
}
// 获取所有选中的引擎
function getSelectedEngines(data) {
	const multiMenu1Selected = (data.multiMenu1Engines || [])
		.filter(engine => engine.enabled !== false);

	const aiEnginesSelected = (data.aiSearchEngines || [])
		.filter(engine => engine.enabled !== false);

	const regularEnginesSelected = (data.regularSearchEngines || [])
		.filter(engine => engine.enabled !== false);

	return [
		...multiMenu1Selected,
		...aiEnginesSelected,
		...regularEnginesSelected
	];
}
// 渲染引擎列表
function renderEngineList(container, engines, menuId) {
	engines.forEach((engine, index) => {
		const li = document.createElement('li');
		li.className = 'ai-engine-item';

		const engineHtml = `
            <div class="engine-row">
                <input type="checkbox" 
                       id="${menuId}-engine-${index}" 
                       class="engine-checkbox" 
                       ${engine.enabled !== false ? 'checked' : ''}>
                <label for="${menuId}-engine-${index}">${engine.name}</label>
                <input type="text" class="engine-url" value="${engine.url}" readonly>
                ${menuId === 'multiMenu1' ? `
                    <button class="edit-engine">编辑</button>
                    <button class="delete-engine">删除</button>
                ` : ''}
            </div>
        `;

		li.innerHTML = engineHtml;

		// 添加复选框事件监听器
		const checkbox = li.querySelector('.engine-checkbox');
		checkbox.addEventListener('change', function () {
			saveEngineState(menuId, index, this.checked, engine);
		});

		// 如果是multiMenu1，添加编辑和删除功能
		if (menuId === 'multiMenu1') {
			addMultiMenu1Controls(li, index, engine);
		}

		container.appendChild(li);
	});
}
function saveEngineState(menuId, index, checked, engine) {
	const category = getCategoryFromEngine(engine); // 获取引擎所属类别
	const storageKey = `${category}SearchEngines`;

	chrome.storage.sync.get(storageKey, function (data) {
		let engines = data[storageKey] || [];
		if (engines[index]) {
			engines[index].enabled = checked;

			// 保存更改并触发更新
			chrome.storage.sync.set({ [storageKey]: engines }, function () {
				// 更新所有方向选择菜单
				document.querySelectorAll('.select-menu').forEach(menu => {
					updateEngineList(menu, {});
				});
			});
		}
	});
}

function createMenuItem(menu, index, containerId) {
	const item = document.createElement('div');
	item.className = 'menu-item';
	item.innerHTML = `
        <input type="text" class="menu-name" value="${menu}" placeholder="菜单项" readonly>
        <button class="edit-menu-item">编辑</button>
        <button class="delete-menu-item">删除</button>
    `;

	// 获取按钮和输入框元素
	const editButton = item.querySelector('.edit-menu-item');
	const deleteButton = item.querySelector('.delete-menu-item');
	const input = item.querySelector('.menu-name');

	// 编辑按钮点击事件
	editButton.addEventListener('click', () => {
		if (editButton.textContent === '编辑') {
			// 进入编辑模式
			input.removeAttribute('readonly');
			input.focus();
			editButton.textContent = '保存';
		} else {
			// 保存更改
			input.setAttribute('readonly', 'readonly');
			editButton.textContent = '编辑';
			updateMenuItem(containerId, index, item);
		}
	});

	// 删除按钮点击事件
	deleteButton.addEventListener('click', () => deleteMenuItem(containerId, index));

	return item;
}



function addNewMenuItem(listId) {
	const list = listId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	list.push('');
	loadMultiMenu(listId, list);
	saveMultiMenu(listId, list);
}


function deleteMenuItem(containerId, index) {
	const list = containerId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	list.splice(index, 1);
	loadMultiMenu(containerId, list);
	saveMultiMenu(containerId, list);
}



function updateMenuItem(containerId, index, item) {
	const list = containerId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	const newValue = item.querySelector('.menu-name').value.trim();

	if (newValue) {
		list[index] = newValue;
		saveMultiMenu(containerId, list);
	} else {
		// 如果输入为空，恢复原值
		item.querySelector('.menu-name').value = list[index];
		alert('菜单项名称不能为空');
	}
}

function saveMultiMenu(containerId, list) {
	chrome.storage.sync.set({ [containerId]: list }, () => {
		console.log(`${containerId} saved`);
	});
}
// 在 DOMContentLoaded 事件中初始化
document.addEventListener('DOMContentLoaded', () => {
	// 初始化搜索引擎列表
	chrome.storage.sync.get('id2enginemap', data => {
		const globalId2enginemap = data.id2enginemap || {};
		updateAllEngineLists(globalId2enginemap);
	});

	// 监听搜索引擎变化
	listenToEngineChanges();
});
document.addEventListener('DOMContentLoaded', () => {
	chrome.storage.sync.get(['functionMenus'], function (data) {
		if (!data.functionMenus) {
			chrome.storage.sync.set({ functionMenus: defaultFunctionMenus }, () => {
				console.log('功能菜单配置已初始化');
			});
		}
	});
});

