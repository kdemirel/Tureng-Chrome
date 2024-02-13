//Create a function to open the new tab
function newTab(info,tab)
{
  const { menuItemId } = info

  if (menuItemId === 'tureng-text-search'){
    browser.tabs.create({
      url: "https://tureng.com/tr/turkce-ingilizce/" + info.selectionText.trim()
    })}};

//Create context menu options.

browser.contextMenus.create({
  title: "Tureng: '%s' ",
  id: "tureng-text-search",
  contexts: ["selection"]
});


//This tells the context menu what function to run when the option is selected

browser.contextMenus.onClicked.addListener(newTab);