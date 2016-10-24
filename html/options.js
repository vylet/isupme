var storeValue = function (timeout) {
    var storeData = {
        "storage_set": {
            "timeout": timeout
        }
    };
    chrome.runtime.sendMessage(storeData);
};
var saveOptions = function () {
    var timeout = document.getElementById('timeout').value;
    storeValue(+timeout);
};
var storeGetData = {
    "storage_get": "timeout"
};
// chrome.storage.local.get('timeout',(data)=>{
//     $('#timeout').val(data['timeout']);
// })
chrome.runtime.sendMessage(storeGetData);
chrome.runtime.onMessage.addListener(function (message) {
    if (message["storage_fetched"]) {
        var timeout = message["storage_fetched"]["timeout"];
        document.getElementById('timeout').value = timeout;
    }
});
document.querySelector("form").addEventListener("submit", saveOptions);
