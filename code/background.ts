const enum Status {
    Online,
    Offline, Error, Failed
}

async function updateStatus(url: string, tabId: number) {
    let statusChecker = new StatusChecker();
    let status = await statusChecker.checkStatus(url);
    changeButton(status, tabId);
    return Promise.resolve();
}

//Make ajax call, sets pageAction and pageAction click handler 
async function runTests(url: string, tabId: number) {
    await updateStatus(url, tabId);
    browser.pageAction.show(tabId);
    browser.pageAction.onClicked.addListener(async (tab) => {
        browser.pageAction.setIcon({
            "tabId": tabId,
            "path": IconProvider.getIcon(Status.Failed)
        });
        await updateStatus(url, tabId);
    });
    return Promise.resolve();
}


//Sets the pageAction icon with description basd on isupme status returned.
function changeButton(result: Status, tabId: number) {
    let status: string = "";
    switch (result) {
        case Status.Online:
            status = "Site is up. Click here to check again.";
            break;
        case Status.Offline:
            status = "Site is down. Click here to check again.";
            break;
        case Status.Error:
            status = "Doesn't look like a site. Click here to check again.";
            break;
        case Status.Failed:
        default:
            status = "Status fetch failed. Click here to check again.";
            break;
    }
    let obj: any = {
        "tabId": tabId,
        title: status
    };
    let ico: any = {
        "tabId": tabId,
        path: IconProvider.getIcon(result)
    }
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
            browser.alarms.create(details.tabId + "", { when: Date.now() + timeout })
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
})
browser.alarms.onAlarm.addListener(async function (alarm) {
    let tab = await browser.tabs.get(+alarm.name);
    await runTests(tab.url, tab.id);
    browser.alarms.clear(alarm.name);
});


class StatusChecker {

    //ExtractDomain fetched from http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
    //Extract the domain from url. Example : https://in.yahoo.com/index.html => "in.yahoo.com"
    private extractDomain(url: string): string {
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

        return domain;
    }

    private readResponse(pageBody: string): Status {
        if (pageBody.includes("It's just you")) {
            return Status.Online;
        }
        else if (pageBody.includes("It's not just you")) {
            return Status.Offline;
        }
        else {
            return Status.Error;
        }
    }
    public async checkStatus(url: string): Promise<Status> {
        let domain = this.extractDomain(url);
        let status: number = -2;
        let reqUrl = "http://downforeveryoneorjustme.com/" + domain;
        let corsHandler = (e: any) => {
            for (let header of [
                'access-control-allow-origin'
                , 'access-control-allow-methods'
                , 'access-control-allow-headers'
                , 'access-control-allow-credentials'
            ]) {
                e.responseHeaders.push({
                    name: header, value: "true"
                })
            }
        }
        await this.enableCors(reqUrl, corsHandler);
        let response: Response = null;
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
            return Promise.resolve(Status.Failed);
        }
    }

    private async enableCors(url: string, listener: any) {
        await browser.webRequest.onHeadersReceived.addListener(listener, { urls: [url] }, ["blocking", "responseHeaders"]);
    }

    private async disableCors(listener: any) {
        await browser.webRequest.onHeadersReceived.removeListener(listener)
    }
}


class IconProvider {

    static getIcon(status: Status) {
        switch (status) {
            case Status.Online:
                return "icons/fail48.ico";
            case Status.Offline:
                return "icons/fail48.ico";
            default:
                return "icons/default16.ico";
        }
    }
}