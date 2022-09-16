// After first installation, show documentation page

function install_notice() {
    if (localStorage.getItem('install_time'))
        return;

    var now = new Date().getTime();
    localStorage.setItem('install_time', now);
    chrome.tabs.create({url: "thanks.html"});
}
install_notice();

// update notifier

chrome.runtime.onInstalled.addListener(function(details){
 if(details.reason == "update"){
 chrome.tabs.create({url: "update.html"});
 }
});