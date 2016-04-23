chrome.webNavigation.onErrorOccurred.addListener(function (error) {
    if (error.frameId == 0) {
        runTests(error.url, error.tabId);
    }
});

chrome.storage.local.get((items) => {
    let timeout = items['timeout'];
    console.log(timeout);
    if(timeout){
        monitorForTimeout(timeout);
    }
});

//This method checks for the status of a page
var monitorForTimeout = (timeout:number) => {
    chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
        chrome.alarms.create(details.tabId + "", { when: Date.now() + timeout });
    });

    chrome.webNavigation.onCommitted.addListener(function (details) {
        chrome.alarms.clear(details.tabId + "");
    })
    chrome.alarms.onAlarm.addListener(function (alarm) {
        chrome.tabs.get(+alarm.name, function (tab) {
            runTests(tab.url, tab.id);
        });
        chrome.alarms.clear(alarm.name);
    });
};

//Make ajax call, sets pageAction and pageAction click handler 
var runTests = (url: string, tabId: number) => {
    ajax(url, tabId);
    chrome.pageAction.show(tabId);
    chrome.pageAction.onClicked.addListener((tab) => {
        chrome.pageAction.setIcon({
            "tabId": tabId,
            "path": icons.def
        });
        ajax(url, tabId);

    });
}

//A get call to isup.me to fetch the status of current webpage and set the corresponding pageAction.
var ajax = function (url: string, tabId: number) {
    url = extractDomain(url);
    var status: number = -2;
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
    })
    return status;
}

var icons: any = {
    "-1": {
        48: "icons/fail48.ico"
    },
    "1": {
        48: "icons/tick48.ico"
    },
    "def": {
        16: "icons/default16.ico"
    }
}

//Sets the pageAction icon with description basd on isupme status returned.
var changeButton = (result: number, tabId: number) => {
    var status: string = "";
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
    var obj: any = {
        "tabId": tabId,
        title: status
    };
    var ico: any = {
        "tabId": tabId,
        path: status
    }
    ico.path = icons[result + ""];
    if (!ico.path) {
        ico.path = icons["def"];
    }
    chrome.pageAction.setTitle(obj);
    chrome.pageAction.setIcon(ico);
}


//ExtractDomain fetched from http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
//Extract the domain from url. Example : https://in.yahoo.com/index.html => "in.yahoo.com"
var extractDomain = (url: string): string => {

    let domain: string = "";
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain ;

}

