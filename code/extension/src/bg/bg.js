async function updateStatus(url, tabId) {
    let statusChecker = new StatusChecker();
    let status = await statusChecker.checkStatus(url);
    changeButton(status, tabId);
    return Promise.resolve();
}
//Make ajax call, sets pageAction and pageAction click handler 
async function runTests(url, tabId) {
    await updateStatus(url, tabId);
    browser.pageAction.show(tabId);
    browser.pageAction.onClicked.addListener(async (tab) => {
        browser.pageAction.setIcon({
            "tabId": tabId,
            "path": IconProvider.getIcon(3 /* Failed */)
        });
        await updateStatus(url, tabId);
    });
    return Promise.resolve();
}
//Sets the pageAction icon with description basd on isupme status returned.
function changeButton(result, tabId) {
    let status = "";
    switch (result) {
        case 0 /* Online */:
            status = "Site is up. Click here to check again.";
            break;
        case 1 /* Offline */:
            status = "Site is down. Click here to check again.";
            break;
        case 2 /* Error */:
            status = "Doesn't look like a site. Click here to check again.";
            break;
        case 3 /* Failed */:
        default:
            status = "Status fetch failed. Click here to check again.";
            break;
    }
    let obj = {
        "tabId": tabId,
        title: status
    };
    let ico = {
        "tabId": tabId,
        path: IconProvider.getIcon(result)
    };
    browser.pageAction.setTitle(obj);
    browser.pageAction.setIcon(ico);
}
browser.webNavigation.onErrorOccurred.addListener(async function (error) {
    if (error.frameId == 0) {
        let reqUrl = error.url;
        let tabId = error.tabId;
        let tab = await browser.tabs.get(tabId);
        if (tab.url === reqUrl) {
            await runTests(error.url, error.tabId);
        }
    }
    return Promise.resolve();
});
browser.webNavigation.onBeforeNavigate.addListener(async function (details) {
    if (details.frameId == 0) {
        let data = await browser.storage.local.get(null);
        let timeout = data['timeout'];
        if (timeout) {
            browser.alarms.create(details.tabId + "", { when: Date.now() + timeout });
        }
    }
});
browser.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId == 0) {
        if ((details.url.indexOf('http') === 0) || (details.url.indexOf('moz-extension') === 0)) {
            browser.alarms.clear(details.tabId + "");
            browser.pageAction.hide(details.tabId);
        }
    }
});
browser.alarms.onAlarm.addListener(async function (alarm) {
    let tab = await browser.tabs.get(+alarm.name);
    await runTests(tab.url, tab.id);
    browser.alarms.clear(alarm.name);
});
class StatusChecker {
    //ExtractDomain fetched from http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
    //Extract the domain from url. Example : https://in.yahoo.com/index.html => "in.yahoo.com"
    extractDomain(url) {
        let domain = "";
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
    }
    readResponse(pageBody) {
        if (pageBody.includes("It's just you")) {
            return 0 /* Online */;
        }
        else if (pageBody.includes("It's not just you")) {
            return 1 /* Offline */;
        }
        else {
            return 2 /* Error */;
        }
    }
    async checkStatus(url) {
        let domain = this.extractDomain(url);
        let status = -2;
        let reqUrl = "http://downforeveryoneorjustme.com/" + domain;
        let corsHandler = (e) => {
            for (let header of [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers',
                'access-control-allow-credentials'
            ]) {
                e.responseHeaders.push({
                    name: header, value: "true"
                });
            }
        };
        await this.enableCors(reqUrl, corsHandler);
        let response = null;
        try {
            response = await fetch(reqUrl, { method: "GET", mode: "cors" });
            await this.disableCors(corsHandler);
        }
        catch (e) {
            await this.disableCors(corsHandler);
        }
        if (response && response.ok) {
            let body = await response.text();
            return Promise.resolve(this.readResponse(body));
        }
        else {
            return Promise.resolve(3 /* Failed */);
        }
    }
    async enableCors(url, listener) {
        await browser.webRequest.onHeadersReceived.addListener(listener, { urls: [url] }, ["blocking", "responseHeaders"]);
    }
    async disableCors(listener) {
        await browser.webRequest.onHeadersReceived.removeListener(listener);
    }
}
class IconProvider {
    static getIcon(status) {
        switch (status) {
            case 0 /* Online */:
                return "icons/fail48.ico";
            case 1 /* Offline */:
                return "icons/fail48.ico";
            default:
                return "icons/default16.ico";
        }
    }
}
