chrome.runtime.onMessage.addListener(function (message) {
    if (message["storage_set"]) {
        chrome.storage.local.set(message["storage_set"]);
    }
    else if (message["storage_get"]) {
        chrome.storage.local.get(message["storage_get"], function (data) {
            var storeData = {
                "storage_fetched": {
                    "timeout": data[message["storage_get"]]
                }
            };
            chrome.runtime.sendMessage(storeData);
        });
    }
});
