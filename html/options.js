var storeValue = function (timeout) {
    chrome.storage.local.set({ timeout });
};
var saveOptions = function () {
    var timeout = document.getElementById('timeout').value;
    storeValue(+timeout);
};
var storeGetData = {
    "storage_get": "timeout"
};
chrome.storage.local.get('timeout',(data)=>{
    document.getElementById('timeout').value = data['timeout'];
})

document.querySelector("form").addEventListener("submit", saveOptions);
