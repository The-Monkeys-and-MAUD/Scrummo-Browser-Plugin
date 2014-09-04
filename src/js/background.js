//Send the message!
function updatePageAction(tabId) {
	chrome.tabs.sendMessage(tabId, {is_content_script: true});
};

// Event listener for tab updates (e.g. URL)
// Also gets triggered on initial load
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
	if (change.status == "complete") {
		updatePageAction(tabId);
	}	
});


