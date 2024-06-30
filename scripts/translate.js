
//translate.js
var items = document.querySelectorAll("[data-i18n]");
var i;
var l = items.length;
for (i = 0; i < l; i++) {
	var translation = chrome.i18n.getMessage(items[i].getAttribute("data-i18n"));
	if (items[i].value === "i18n") {
		items[i].value = translation;
	} else {
		items[i].innerText = translation;
	}
}