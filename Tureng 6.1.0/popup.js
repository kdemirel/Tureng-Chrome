// Popup açılışında seçili kelimeyi search_box'a yapıştırır, formu submit eder. 
window.onload = async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    let result;
    try {
      [{result}] = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: () => getSelection().toString(),
      });
    } catch (e) {
      return; // ignoring an unsupported page like chrome://extensions
    }
  
    document.getElementById('search_box').value = result;
    if (result.length > 0) {
      document.getElementById("submit").click();
    }

  };

  // iframe göster
document.getElementById("my_form").onsubmit = async () => {
  document.getElementById('iframe_div').hidden = false;
};

