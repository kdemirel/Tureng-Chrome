'use strict';

function Word(id, usage, word, type, definition, definitionType) {
  this.id = id;
  this.usage = usage;
  this.word = word;
  this.type = type;
  this.definition = definition;
  this.definitionType = definitionType;
}

function notFound(str) {
  $('#content').html(`
    <div class="alert alert-warning" role="alert">
      <strong>Maalesef,</strong> bir sonuç bulamadık, kelimeyi basitleştirmeyi deneyin ya da <a href="https://www.google.com/search?q=${str}" target="_blank" ><i class="fa fa-google" aria-hidden="true"></i>oogle</a>
    </div>
  `);

  document.getElementById('loading').style.display = 'none';
}

function sanitize(str) {
  document.getElementById('content').innerHTML = '';

  document.getElementById('search-input').value = str;

  document.getElementById('loading').style.display = 'block';

  document.getElementsByClassName('inner-shadow')[0].style.backgroundColor = '#BD1E2C';
  $('.pie, .dot span').css('background-color', '#'+((1<<24)*Math.random()|0).toString(16) );

  return str;
}

function tureng(str) {
  str = sanitize(str);

  $.get({
    url: 'http://tureng.com/tr/turkce-ingilizce/' + str,
    complete: function(xhr) {
      if (xhr.status != 200) {
        notFound(str);
      }
    },
    success: (data) => {
      const checkSearchResults = $(data).find('.searchResultsTable');

      if ($(data).find('ul.suggestion-list li').length > 0 && checkSearchResults.length === 0) {
        $('#content').html(`
            <div class="list-group">
              <a href="https://www.google.com/search?q=${str}" target="_blank" class="list-group-item active">
                Bunlardan biri değilse,  <i class="fa fa-google" aria-hidden="true"></i>oogle'layın!
              </a>
            </div>
          `);

        $(data).find('ul.suggestion-list li').each((i, el) => {
          $('#content .list-group').append(`
            <a href="#" class="list-group-item list-group-item-action">${safeResponse.cleanDomString(el.textContent.trim())}</a>
          `);
        });

        $('.list-group-item-action').click(function () {
          tureng($(this).text());
        });
        document.getElementById('voice-tts').style.display = 'none';
      }

      if (checkSearchResults.length > 0) {
        $.each(checkSearchResults, function () {
          let translations = [];
          let eachRow = $(this).find('tr');

          $('#content').append(`
            <table class="table table-striped table-hover">
              <thead class="thead-default">
                <tr>
                  <th>#</th>
                  <th>${safeResponse.cleanDomString($(eachRow[0]).find('.c2').text())}</th>
                  <th>${safeResponse.cleanDomString($(eachRow[0]).find('.c3').text())}</th>
                  </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          `);

          let array = $.map(eachRow, function(value, index) {
            return [value];
          });

          array.shift();
          array.forEach((el)=>{
            if ($(el).find('td').eq(0).attr('colspan') == 2 && $(el).find('td b').length > 0) {
              // subject of the word
            }

            if ($(el).find('td.rc0') != null && $(el).className == null && $(el).attr('style') == null && $(el).find('td b').length == 0) {
              const $id = $(el).children('td')[0].textContent;
              const $usage = $(el).children('td').eq(1).text().trim();
              const $word = $(el).children('td').eq(2).find('a').text().trim();
              const $type = $(el).children('td').eq(2).find('i').text().trim() != '' ? $(el).children('td').eq(2).find('i').text().trim() : '';
              const $definition = $(el).children('td').eq(3).find('a').eq(0).text().trim();
              const $definitionType = $(el).children('td').eq(3).find('i').text().trim() ? $(el).children('td').eq(3).find('i').eq(0).text().trim() : '';
              const translation = new Word($id, $usage, $word, $type, $definition, $definitionType);
              translations.push(translation);
            }
          });
          translations.forEach((e)=>{
            $('#content table tbody:last').append(`
          <tr>
            <th scope="row" class="align-middle"">${safeResponse.cleanDomString(e.usage)}</th>
            <td><a data-href="${safeResponse.cleanDomString(e.word)}">${safeResponse.cleanDomString(e.word)}</a> ${safeResponse.cleanDomString(e.type) != '' ? '<small>(' + safeResponse.cleanDomString(e.type) + ')</small>' : '' }</td>
            <td><a data-href="${safeResponse.cleanDomString(e.definition)}">${safeResponse.cleanDomString(e.definition)}</a> ${safeResponse.cleanDomString(e.definitionType) != '' ? '<small>(' + safeResponse.cleanDomString(e.definitionType) + ')</small>' : '' }</td>
            </tr>
          `);
          })
        });
        $('table thead').click(function (e) {
          const getParentTable = $(e.target).parent().parent().parent()[0];
          $(getParentTable).find('tbody').first().fadeToggle('fast')
        });

        $('table tbody a').click(function (e) {
          tureng($(this).data('href'));
        });
        document.getElementById('voice-tts').style.display = 'block';
      }
    }
  }).done(()=>{
      document.getElementById('loading').style.display = 'none'; 
      });
}


document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('tureng').addEventListener('click', ()=>{
    tureng(document.getElementById('search-input').value);
  });

    $('[data-toggle="tooltip"]').tooltip();

});

document.getElementById('search-input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    tureng(document.getElementById('search-input').value);
  }
});

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

  document.getElementById('search-input').value = result;
  if (result.length > 0) {
    document.getElementById("tureng").click();
  }

};

// TTS
document.getElementById('flag-tr').addEventListener('click', ()=>{
  chrome.tts.speak(document.getElementById('search-input').value, {'lang': 'tr-TR', 'rate': 0.8});
});

document.getElementById('flag-us').addEventListener('click', ()=>{
  chrome.tts.speak(document.getElementById('search-input').value, {'lang': 'en-US', 'rate': 0.8});
});

document.getElementById('flag-uk').addEventListener('click', ()=>{
  chrome.tts.speak(document.getElementById('search-input').value, {'lang': 'en-GB', 'rate': 0.8});
});

document.getElementById('flag-au').addEventListener('click', ()=>{
  chrome.tts.speak(document.getElementById('search-input').value, {'lang': 'en-AU', 'rate': 0.8});
});

// tureng-logo
document.getElementById('tureng-logo').addEventListener('click', ()=>{
  chrome.tabs.create({url: 'http://tureng.com/tr/turkce-ingilizce/'+document.getElementById('search-input').value});
});