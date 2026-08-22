// Принимает RSVP-ответы с сайта и дописывает их строкой в текущую таблицу.
// Разверните этот файл как Google Apps Script, привязанный к Google-таблице
// (подробности — в README-SETUP.md рядом с этим файлом).

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  var data = JSON.parse(e.postData.contents);

  // При первом запуске — заголовки, если лист пустой
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Дата отправки", "Имя и фамилия", "Присутствие", "Напитки", "Пожелания/ограничения"]);
  }

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.attending || "",
    (data.drinks || []).join(", "),
    data.notes || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
