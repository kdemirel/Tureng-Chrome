function onSelectedText(response){
    document.getElementById('main').src = 
        "http://chrome.tureng.com/Search?searchTerm=" + encodeURIComponent(response.selected_text);
};


chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, {action: "get_selected_text"}, onSelectedText);
});

// geri ileri butonları

function geri() {
    history.go(-1);
}

function clickHandlerg(e) {
  setTimeout(geri, 50);
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#geriye').addEventListener('click', clickHandlerg);
  geri();
});

function ileri() {
    history.go(1);
}

function clickHandleri(e) {
  setTimeout(ileri, 50);
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#ileriye').addEventListener('click', clickHandleri);
  ileri();
});
