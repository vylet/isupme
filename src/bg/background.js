//Make ajax call, sets pageAction and pageAction click handler 
var runTests = function (url, tabId) {
    ajax(url, tabId);
    chrome.pageAction.show(tabId);
    chrome.pageAction.onClicked.addListener(function (tab) {
        chrome.pageAction.setIcon({
            "tabId": tabId,
            "path": icons.def
        });
        ajax(url, tabId);
    });
};
//A get call to isup.me to fetch the status of current webpage and set the corresponding pageAction.
var ajax = function (url, tabId) {
    url = extractDomain(url);
    var status = -2;
    var reqUrl = "http://isup.me/" + url;
    var request = new XMLHttpRequest();
    request.open('GET', reqUrl, true);
    request.onload = function () {
        var data = this.response;
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
    };
    request.onerror = function () {
        status = -2;
        changeButton(status, tabId);
    };
    request.send();
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
//Sets the pageAction icon with description basd on isupme status returned.
var changeButton = function (result, tabId) {
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
};
//ExtractDomain fetched from http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
//Extract the domain from url. Example : https://in.yahoo.com/index.html => "in.yahoo.com"
var extractDomain = function (url) {
    var domain = "";
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }
    //find & remove port number
    domain = domain.split(':')[0];
    return domain;
};
chrome.webNavigation.onErrorOccurred.addListener(function (error) {
    if (error.frameId == 0) {
        runTests(error.url, error.tabId);
    }
});
chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    chrome.storage.local.get(function (items) {
        var timeout = items['timeout'];
        if (timeout) {
            chrome.alarms.create(details.tabId + "", { when: Date.now() + timeout });
        }
    });
    ;
});
chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId == 0) {
        chrome.alarms.clear(details.tabId + "");
        if (details.url.indexOf('http') == 0)
            chrome.pageAction.hide(details.tabId);
    }
});
chrome.alarms.onAlarm.addListener(function (alarm) {
    chrome.tabs.get(+alarm.name, function (tab) {
        runTests(tab.url, tab.id);
    });
    chrome.alarms.clear(alarm.name);
});
