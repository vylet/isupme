///<reference path="../../typings/chrome/chrome.d.ts" />
///<reference path="../../typings/jquery/jquery.d.ts" />
chrome.webNavigation.onErrorOccurred.addListener(function (error) {
    if (error.frameId == 0) {
        ajax(error.url, error.tabId);
        chrome.pageAction.show(error.tabId);
        chrome.pageAction.onClicked.addListener(function (tab) {
            chrome.pageAction.setIcon({
                "tabId": tab.id,
                "path": icons.def
            });
            ajax(error.url, tab.id);
        });
    }
});
var ajax = function (url, tabId) {
    var status = -2;
    $.get("http://isup.me/" + url).done(function (data) {
        if (data.indexOf("It's just you") > -1) {
            status = 1;
            changeButton(status, tabId);
        }
        else if (data.indexOf("It's not just you") > -1) {
            status = -1;
            changeButton(status, tabId);
        }
        else {
            status = 0;
            changeButton(status, tabId);
        }
    }).fail(function () {
        status = -2;
        changeButton(status, tabId);
    });
    return status;
};
var icons = {
    "-1": {
        48: "icons/fail48.ico"
    },
    "1": {
        48: "icons/tick48.ico"
    },
    "def": {
        16: "icons/default16.ico"
    }
};
function changeButton(result, tabId) {
    var status = "";
    switch (result) {
        case 1:
            status = "Site is up. Click here to check again.";
            break;
        case -1:
            status = "Site is down. Click here to check again.";
            break;
        case 0:
            status = "Doesn't look like a site. Click here to check again.";
            break;
        default:
            status = "Status fetch failed. Click here to check again.";
            break;
    }
    var obj = {
        "tabId": tabId,
        title: status
    };
    var ico = {
        "tabId": tabId,
        path: status
    };
    ico.path = icons[result + ""];
    if (!ico.path) {
        ico.path = icons["def"];
    }
    chrome.pageAction.setTitle(obj);
    chrome.pageAction.setIcon(ico);
}
