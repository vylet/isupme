var storeValue = function (timeout) {
    chrome.storage.local.set({
        "timeout": timeout
    });
};
var saveOptions = function () {
    var timeout = document.getElementById('timeout').value;
    storeValue(+timeout);
};
chrome.storage.local.get('timeout', function (data) {
    $('#timeout').val(data['timeout']);
});
document.querySelector("form").addEventListener("submit", saveOptions);
