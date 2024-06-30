

/* global navigation */
if (window.top !== window && window.parent === window.top) {
	chrome.runtime.sendMessage({ name: "sidepanelopen" }, (b) => {
		if (b) {
			const origin = chrome.runtime.getURL("");
			addEventListener("hashchange", () => top.postMessage({ method: "navigate", href: location.href }, origin));
			addEventListener("message", (e) => {
				if (e.data?.method === "navigate-verified" && e.origin.includes(chrome.runtime.id)) {
					navigation.addEventListener("navigate", (e) => {
						const href = e.destination.url;
						top.postMessage({
							method: "complete",
							href
						}, origin);
					});
				} else if (e.data?.method === "changeZoomScale") {
					document.body.style.zoom = e.data.zoom;
				}
			});
			top.postMessage({ method: "navigate", href: location.href }, origin);
		}
	});

}