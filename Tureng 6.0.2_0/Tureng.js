// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Create one test item for each context type.
var contexts = ["selection"];
for (var i = 0; i < contexts.length; i++) {
  var context = contexts[i];
  var title = "Tureng: '%s'";
  var id = chrome.contextMenus.create({"title": title, "contexts":[context],
      "onclick": turengOnClick
  });

}


function turengOnClick(info, tab) {
    var url = 'http://tureng.com/search/' + info.selectionText;
    chrome.tabs.create({ 'url': url }, function (tab) { });
    
}
