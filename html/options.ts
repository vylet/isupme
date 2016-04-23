var storeValue = (timeout:number) => {
    chrome.storage.local.set({
        "timeout" : timeout 
    });
}

var saveOptions = () =>{
    var timeout = (<HTMLInputElement>document.getElementById('timeout')).value;
    storeValue(+timeout);
} 


chrome.storage.local.get('timeout',(data)=>{
    $('#timeout').val(data['timeout']);
})
document.querySelector("form").addEventListener("submit", saveOptions);

