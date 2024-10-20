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
function createEngineItem(name, url) {
	// 创建和返回搜索引擎列表项的代码
}
// 从存储中加载数据
function loadData() {
	chrome.storage.sync.get(['id2enginemap', 'multiMenu1', 'multiMenu2'], function (result) {
		id2enginemap = result.id2enginemap || {};
		multiMenu1 = result.multiMenu1 || [];
		multiMenu2 = result.multiMenu2 || [];

		// 将 id2enginemap 转换为 topEngineListContainer 和 bottomEngineListContainer
		topEngineListContainer = [];
		bottomEngineListContainer = [];

		// 假设前10个引擎为顶部引擎,其余为底部引擎
		let count = 0;
		for (let [name, url] of Object.entries(id2enginemap)) {
			if (count < 10) {
				topEngineListContainer.push({ name, url });
			} else {
				bottomEngineListContainer.push({ name, url });
			}
			count++;
		}

		console.log('Loaded data:', {
			topEngineListContainer,
			bottomEngineListContainer,
			multiMenu1,
			multiMenu2
		});

		initializeTab3();
	});
}

// 新的函数重命名为 addNewAISearchEngine
function addNewAISearchEngine() {
	const name = prompt('输入新的搜索引擎名称:');
	const url = prompt('输入新的搜索引擎URL:');

	if (name && url) {
		aiSearchEngines.push({ name, url });
		saveAISearchEngines();
		loadAISearchEngines('multiMenu1'); // 重新加载列表
	}
}

function loadAISearchEngines(menuId) {
	console.log('开始加载AI搜索引擎');
	// 使用 setTimeout 来确保 DOM 完全加载
	setTimeout(() => {
		const menuList = document.querySelector('#multiMenu1 .ai-search-engine-list');
		if (!menuList) {
			console.error('AI搜索引擎列表元素未找到，选择器：#multiMenu1 .ai-search-engine-list');
			console.log('当前DOM结构：', document.body.innerHTML);
			return;
		}
		menuList.innerHTML = ''; // 清空现有内容

		chrome.storage.sync.get('aiSearchEngines', function (data) {
			console.log('从存储中获取的AI搜索引擎数据：', data.aiSearchEngines);
			let engines = data.aiSearchEngines || [];

			if (engines.length === 0) {
				console.log('未找到保存的AI搜索引擎，使用默认值');
				engines = [
					{ name: "默认AI搜索", url: "https://example.com/search?q=%s" }
				];
			}

			engines.forEach((engine, index) => {
				const itemElement = document.createElement('div');
				itemElement.classList.add('menu-item');
				itemElement.innerHTML = `
                    <span>${engine.name}</span>
                    <input type="text" value="${engine.url}" readonly>
                    <button class="edit-engine">编辑</button>
                    <button class="delete-engine">删除</button>
                `;

				// 添加编辑和删除功能
				const editButton = itemElement.querySelector('.edit-engine');
				const deleteButton = itemElement.querySelector('.delete-engine');

				editButton.addEventListener('click', () => editEngine(index));
				deleteButton.addEventListener('click', () => deleteEngine(index));

				menuList.appendChild(itemElement);
			});

			console.log(`加载了 ${engines.length} 个 AI 搜索引擎到 multiMenu1`);
		});
	}, 0);
}

// 确保在DOM加载完成后调用loadAISearchEngines
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM内容已加载');
	loadAISearchEngines('multiMenu1');
});

function editEngine(index) {
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
}

function deleteEngine(index) {
	chrome.storage.sync.get('aiSearchEngines', function (data) {
		let engines = data.aiSearchEngines || [];
		if (confirm('确定要删除这个搜索引擎吗？')) {
			engines.splice(index, 1);
			saveAISearchEngines(engines);
			loadAISearchEngines('multiMenu1'); // 重新加载列表
		}
	});
}

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
	document.getElementById('addAISearchEngine').addEventListener('click', addNewAISearchEngine);
});
chrome.storage.sync.get('aiSearchEngines', function (data) {
	console.log('从存储中获取的AI搜索引擎数据：', data.aiSearchEngines);
	if (data.aiSearchEngines && Array.isArray(data.aiSearchEngines)) {
		aiSearchEngines = data.aiSearchEngines;
		loadAISearchEngines();
	} else {
		console.log('未找到有效的AI搜索引擎数据，使用默认值');
		// 可以在这里设置一些默认的搜索引擎
		aiSearchEngines = [
			{ name: "默认AI搜索", url: "https://example.com/search?q=%s" }
		];
		loadAISearchEngines();
	}
});
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
let openMenu = null; // 用于跟踪当前打开的菜单
// 在文件顶部添加或更新以下函数
function showSelectMenu(menu) {
	// 先隐藏所有其他的 select-menu
	document.querySelectorAll('.select-menu').forEach(m => {
		m.style.display = 'none';
	});
	menu.style.display = 'block';
}

function hideSelectMenu(menu) {
	menu.style.display = 'none';
}
// 在文件顶部添加或更新以下代码
// 开始: 搜索引擎数据
const searchEngines = {
	ai: [
		{ name: "ChatGPT", url: "https://chat.openai.com/" },
		{ name: "Bard", url: "https://bard.google.com/" },
		// 添加更多AI搜索引擎...
	],
	image: [
		{ name: "Google Images", url: "https://images.google.com/search?q=%s" },
		{ name: "Bing Images", url: "https://www.bing.com/images/search?q=%s" },
		// 添加更多图片搜索引擎...
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
		// 这里可以是空的，或者包含一些默认的自定义搜索引擎
	]
};
function loadOptions() {
	chrome.storage.sync.get(['selectedEngines', 'id2enginemap'], function (result) {
		let id2enginemap = result.id2enginemap || {};

		// 特别检查闲鱼搜索引擎
		console.log('加载前闲鱼 URL:', id2enginemap['闲鱼']);

		// 更新 id2enginemap
		Object.entries(searchEngines).forEach(([category, engines]) => {
			engines.forEach(engine => {
				id2enginemap[engine.name.toLowerCase()] = engine.url;
			});
		});

		console.log('更新后闲鱼 URL:', id2enginemap['闲鱼']);

		// 保存更新后的 id2enginemap
		chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {
			console.log('id2enginemap 已保存，闲鱼 URL:', id2enginemap['闲鱼']);
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

	console.log('保存前闲鱼 URL:', id2enginemap['闲鱼']);

	chrome.storage.sync.set({ id2enginemap: id2enginemap }, function () {
		console.log('保存后闲鱼 URL:', id2enginemap['闲鱼']);
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

function showSelectMenu(menu) {
	menu.style.display = 'block';
}

function hideSelectMenu(menu) {
	menu.style.display = 'none';
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
			e.stopPropagation(); // 阻止事件冒泡
			const menu = this.nextElementSibling;
			menu.classList.toggle('show');
		});
	});

	// 点击外部区域关闭菜单
	document.addEventListener('click', function (e) {
		if (!e.target.closest('.custom-select')) {
			document.querySelectorAll('.select-menu.show').forEach(menu => {
				menu.classList.remove('show');
			});
		}
	});

	// 阻止在 select-menu 内的点击事件冒泡
	document.querySelectorAll('.select-menu').forEach(menu => {
		menu.addEventListener('click', (event) => {
			event.stopPropagation();
		});
	});

	document.querySelectorAll('.select-menu .engine-list li').forEach(option => {
		option.addEventListener('click', function (e) {
			e.stopPropagation(); // 阻止事件冒泡
			const selectedEngineName = this.textContent;
			const selectedEngineCategory = this.closest('.category').querySelector('h4').textContent;
			const customSelect = this.closest('.custom-select');
			const button = customSelect.querySelector('.select-button');
			const menu = customSelect.querySelector('.select-menu');

			// 更新按钮文本
			button.textContent = selectedEngineName;

			// 关闭菜单
			menu.classList.remove('show');

			// 保存选择到存储
			const direction = customSelect.id;
			chrome.storage.sync.get('directionEngines', (data) => {
				const directionEngines = data.directionEngines || {};
				directionEngines[direction] = selectedEngineCategory === '禁用' ? 'disabled' : selectedEngineName;
				chrome.storage.sync.set({ directionEngines: directionEngines }, () => {
					console.log(`Selected ${selectedEngineName} for ${direction}`);
				});
			});

			// 如果选择了禁用，添加视觉反馈
			if (selectedEngineCategory === '禁用') {
				button.classList.add('disabled');
			} else {
				button.classList.remove('disabled');
			}
		});
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

// 页面加载时调用
document.addEventListener('DOMContentLoaded', function () {
	loadSavedPages();
	restoreCheckboxStates();
	addCheckboxListeners();
	chrome.storage.sync.get('id2enginemap', function (data) {
		const globalId2enginemap = data.id2enginemap || {};
		updateAllEngineLists(globalId2enginemap);
	});
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
		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			const engineMap = data.engineMap || {};
			const globalId2enginemap = data.id2enginemap || {};
			let presetEngines = searchEngines[category] || [];
			let customEngines = {};

			// 获取用户自定义搜索引擎
			Object.keys(globalId2enginemap).forEach(key => {
				if (key.startsWith(category + '_')) {
					customEngines[key.replace(category + '_', '')] = globalId2enginemap[key];
				}
			});

			let content = `
            <h2>${getCategoryName(category)}引擎</h2>
            <h3>预设搜索引擎</h3>
            <ul id="${category}PresetEngineList" class="engine-list">
                ${presetEngines.map(engine => `
                    <li>
                        <span>${engine.name}: ${engine.url}</span>
                    </li>
                `).join('')}
            </ul>
            <h3>自定义搜索引擎</h3>
            <ul id="${category}CustomEngineList" class="engine-list">
                ${Object.entries(customEngines).map(([name, url]) => `
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

			document.getElementById(`add${capitalize(category)}Engine`).addEventListener('click', () => addEngine(category));
			document.getElementById('tabContent').addEventListener('click', function (e) {
				if (e.target.classList.contains('delete-engine')) {
					const category = e.target.dataset.category;
					const name = e.target.dataset.name;
					deleteEngine(category, name);
				}
			});
		});
	}
	function loadSelectedEngines(category) {
		chrome.storage.sync.get(`selectedEngines_${category}`, function (result) {
			const selectedEngines = result[`selectedEngines_${category}`] || [];
			const select = document.getElementById(`${category}EngineSelect`);

			for (let option of select.options) {
				option.selected = selectedEngines.includes(option.value);
			}

			// 添加change事件监听器来保存选择
			select.addEventListener('change', function () {
				const selectedOptions = Array.from(this.selectedOptions).map(option => option.value);
				chrome.storage.sync.set({ [`selectedEngines_${category}`]: selectedOptions });
			});
		});
	}
	function deleteEngine(category, name) {
		chrome.storage.sync.get(['engineMap', 'id2enginemap'], function (data) {
			let engineMap = data.engineMap || {};
			let globalId2enginemap = data.id2enginemap || {};
			const fullEngineName = `${category}_${name}`;

			let deleted = false;

			if (engineMap[category] && engineMap[category][name]) {
				delete engineMap[category][name];
				deleted = true;
			}
			if (globalId2enginemap[fullEngineName]) {
				delete globalId2enginemap[fullEngineName];
				deleted = true;
			}

			if (deleted) {
				chrome.storage.sync.set({
					'engineMap': engineMap,
					'id2enginemap': globalId2enginemap
				}, function () {
					if (chrome.runtime.lastError) {
						console.error('删除搜索引擎时发生错误:', chrome.runtime.lastError);
						alert('删除搜索引擎时发生错误，请重试。');
					} else {
						alert('搜索引擎删除成功！');
						// 更新界面
						updateCurrentTabContent(category, globalId2enginemap);
					}
				});
			} else {
				console.log('未找到要删除的搜索引擎');
			}
		});
	}


	// 添加搜索引擎




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
    
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    /* 添加以下属性 */
    display:inline-block;
    align-items: center;
    justify-content: center;
    text-align: center; /* 为了保险起见，也设置文本对齐 */
}
    `;

		// 创建 style 元素并添加到 head
		const styleElement = document.createElement('style');
		styleElement.textContent = styles;
		document.head.appendChild(styleElement);
	}
	document.querySelectorAll('.tab').forEach(tab => {
		tab.addEventListener('click', function () {
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

	function editCustomSearchEngine(index) {
		chrome.storage.sync.get('customSearchEngines', function (data) {
			let engines = data.customSearchEngines || [];
			const engine = engines[index];

			const newName = prompt("请输入新的搜索引擎名称:", engine.name);
			const newUrl = prompt("请输入新的搜索引擎URL:", engine.url);

			if (newName && newUrl) {
				engines[index] = { name: newName, url: newUrl };

				chrome.storage.sync.set({ customSearchEngines: engines }, function () {
					console.log('自定义搜索引擎已编辑');
					renderCustomSearchEngineList();
					updateCustomSearchEngineList();
				});
			}
		});
	}

	function deleteCustomSearchEngine(index) {
		chrome.storage.sync.get('customSearchEngines', function (data) {
			let engines = data.customSearchEngines || [];
			if (confirm(`确定要删除 "${engines[index].name}" 吗？`)) {
				engines.splice(index, 1);

				chrome.storage.sync.set({ customSearchEngines: engines }, function () {
					console.log('自定义搜索引擎已删除');
					renderCustomSearchEngineList();
					updateCustomSearchEngineList();
				});
			}
		});
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
	chrome.storage.sync.get(['longPressEnabled', 'ctrlSelectEnabled', 'directionSearchEnabled'], function (result) {
		longPressCheckbox.checked = result.longPressEnabled ?? true;
		ctrlSelectCheckbox.checked = result.ctrlSelectEnabled ?? true;
		directionSearchToggle.checked = result.directionSearchEnabled ?? true;  // 添加这一行
	});
	// 保存设置变更
	longPressCheckbox.addEventListener('change', function () {
		saveSettings();
	});

	ctrlSelectCheckbox.addEventListener('change', function () {
		saveSettings();
	});
	directionSearchToggle.addEventListener('change', function () {
		saveSettings();
	});
	function saveSettings() {
		const settings = {
			longPressEnabled: longPressCheckbox.checked,
			ctrlSelectEnabled: ctrlSelectCheckbox.checked,
			directionSearchEnabled: directionSearchToggle.checked  // 添加这一行
		};
		chrome.storage.sync.set(settings, function () {
			if (chrome.runtime.lastError) {
				console.error('保存设置时出错:', chrome.runtime.lastError);
			} else {
				console.log('所有设置已保存:', settings);
				// 通知 background.js 设置已更新
				chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: settings });
			}
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
	// 获取复选框元素

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

	titlecolor.addEventListener('click', function () {
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
// 增加方向搜索引擎对应的数组// 更新所有下拉列表的函数
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
	const categories = ['ai', 'regular', 'image', 'custom'];

	categories.forEach(category => {
		const list = selectMenu.querySelector(`.category.${category} .engine-list`);
		if (list) {
			list.innerHTML = ''; // 清空现有列表

			// 添加预设搜索引擎
			if (searchEngines[category]) {
				searchEngines[category].forEach(engine => {
					const li = document.createElement('li');
					li.textContent = engine.name;
					li.addEventListener('click', () => selectEngine(engine.name, selectMenu));
					list.appendChild(li);
				});
			}

			// 添加用户自定义搜索引擎
			Object.keys(globalId2enginemap).forEach(engineName => {
				if (engineName.startsWith(category + '_')) {
					const li = document.createElement('li');
					li.textContent = engineName.split('_')[1];
					li.addEventListener('click', () => selectEngine(engineName, selectMenu));
					list.appendChild(li);
				}
			});
		}
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
		image: '图片搜索',
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

		// 加载保存的设置
		chrome.storage.sync.get('directionSearchEnabled', (data) => {
			directionSearchToggle.checked = !!data.directionSearchEnabled;
			updateDirectionSearchUI(); // 确保UI反映当前状态
		});
	}
	// 修改：加载设置函数
	function loadSettings() {
		chrome.storage.sync.get('directionSearchEnabled', function (data) {
			if (data.hasOwnProperty('directionSearchEnabled')) {
				directionSearchToggle.checked = data.directionSearchEnabled;
			} else {
				// 如果没有保存的设置，默认设置为打开
				directionSearchToggle.checked = true;
				// 保存默认设置
				saveDirectionSearchSetting();
			}
			console.log('方向搜索设置已加载:', directionSearchToggle.checked);
			updateDirectionSearchUI(); // 确保UI更新反映当前状态
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
	const tabButtons = document.querySelectorAll('#tab3 .tab-button');
	const tabPanes = document.querySelectorAll('#tab3 .tab-pane');

	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const tabId = button.getAttribute('data-tab');
			switchTab(tabId);
		});
	});

	loadEngineList('topEngineList', topEngineListContainer);
	loadEngineList('bottomEngineList', bottomEngineListContainer);
	loadMultiMenu('multiMenu1', multiMenu1);
	loadMultiMenu('multiMenu2', multiMenu2);

	document.querySelectorAll('#tab3 .add-engine').forEach(button => {
		button.addEventListener('click', (e) => {
			const listId = e.target.closest('.tab-pane').id;
			addNewEngine(listId);
		});
	});

	document.querySelectorAll('#tab3 .add-menu-item').forEach(button => {
		button.addEventListener('click', (e) => {
			const listId = e.target.closest('.tab-pane').id;
			addNewMenuItem(listId);
		});
	});

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
function loadEngineList(containerId, engineList) {
	const container = document.querySelector(`#${containerId} .engine-list`);
	container.innerHTML = '';
	engineList.forEach((engine, index) => {
		const item = createEngineItem(engine, index, containerId);
		container.appendChild(item);
	});
}

function loadMultiMenu(containerId, menuList) {
	const container = document.querySelector(`#${containerId} .menu-list`);
	container.innerHTML = '';
	menuList.forEach((menu, index) => {
		const item = createMenuItem(menu, index, containerId);
		container.appendChild(item);
	});
}

function createEngineItem(engine, index, containerId) {
	const item = document.createElement('div');
	item.className = 'engine-item';
	item.innerHTML = `
        <input type="text" class="engine-name" value="${engine.name}" placeholder="引擎名称">
        <input type="text" class="engine-url" value="${engine.url}" placeholder="引擎URL">
        <button class="delete-engine">删除</button>
    `;
	item.querySelector('.delete-engine').addEventListener('click', () => deleteEngine(containerId, index));
	item.querySelectorAll('input').forEach(input => {
		input.addEventListener('change', () => updateEngine(containerId, index, item));
	});
	return item;
}

function createMenuItem(menu, index, containerId) {
	const item = document.createElement('div');
	item.className = 'menu-item';
	item.innerHTML = `
        <input type="text" class="menu-name" value="${menu}" placeholder="菜单项">
        <button class="delete-menu-item">删除</button>
    `;
	item.querySelector('.delete-menu-item').addEventListener('click', () => deleteMenuItem(containerId, index));
	item.querySelector('input').addEventListener('change', () => updateMenuItem(containerId, index, item));
	return item;
}

function addNewEngine(listId) {
	const list = listId === 'topEngineList' ? topEngineListContainer : bottomEngineListContainer;
	list.push({ name: '', url: '' });
	loadEngineList(listId, list);
	saveEngineList(listId, list);
}

function addNewMenuItem(listId) {
	const list = listId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	list.push('');
	loadMultiMenu(listId, list);
	saveMultiMenu(listId, list);
}

function deleteEngine(containerId, index) {
	const list = containerId === 'topEngineList' ? topEngineListContainer : bottomEngineListContainer;
	list.splice(index, 1);
	loadEngineList(containerId, list);
	saveEngineList(containerId, list);
}

function deleteMenuItem(containerId, index) {
	const list = containerId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	list.splice(index, 1);
	loadMultiMenu(containerId, list);
	saveMultiMenu(containerId, list);
}

function updateEngine(containerId, index, item) {
	const list = containerId === 'topEngineList' ? topEngineListContainer : bottomEngineListContainer;
	list[index] = {
		name: item.querySelector('.engine-name').value,
		url: item.querySelector('.engine-url').value
	};
	saveEngineList(containerId, list);
}

function updateMenuItem(containerId, index, item) {
	const list = containerId === 'multiMenu1' ? multiMenu1 : multiMenu2;
	list[index] = item.querySelector('.menu-name').value;
	saveMultiMenu(containerId, list);
}

function saveEngineList(containerId, list) {
	chrome.storage.sync.set({ [containerId]: list }, () => {
		console.log(`${containerId} saved`);
	});
}

function saveMultiMenu(containerId, list) {
	chrome.storage.sync.set({ [containerId]: list }, () => {
		console.log(`${containerId} saved`);
	});
}
