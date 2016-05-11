var storeValue = (timeout:number) => {
    var storeData = {
        "storage_set": {
            "timeout": timeout
        }

    };
    chrome.runtime.sendMessage(storeData);
}

var saveOptions = () =>{
    var timeout = (<HTMLInputElement>document.getElementById('timeout')).value;
    storeValue(+timeout);
} 

var storeGetData = {
        "storage_get": "timeout"

    };
// chrome.storage.local.get('timeout',(data)=>{
//     $('#timeout').val(data['timeout']);
// })

chrome.runtime.sendMessage(storeGetData);
chrome.runtime.onMessage.addListener((message)=>{
    console.log(message);
    if(message["storage_fetched"]){
        var timeout = message["storage_fetched"]["timeout"];
        $('#timeout').val(timeout);
    }
})

document.querySelector("form").addEventListener("submit", saveOptions);

