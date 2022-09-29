chrome.extension.onRequest.addListener(
	function(request, sender, callBack) {
		if (request.action == 'get_selected_text'){
			callBack({selected_text: window.getSelection().toString()});
        }else{
			callBack(null);
        }
	}
);
