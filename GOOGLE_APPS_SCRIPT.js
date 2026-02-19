function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reqSheet = e.parameter.sheet;
    const sheets = reqSheet ? [ss.getSheetByName(reqSheet)] : ss.getSheets();
    const result = {};
    sheets.forEach(sheet => {
        if (!sheet) return;
        const data = sheet.getDataRange().getValues();
        const first = String(data[0]?.[0] || '').toLowerCase().trim();
        const skip = ['word', 'english', '英文', 'en'].includes(first);
        result[sheet.getName()] = (skip ? data.slice(1) : data)
            .filter(r => isValidRow(r))
            .map(r => ({
                en: String(r[0]).trim(),
                zh: String(r[1]).trim(),
                phonetic: String(r[2] || '').trim(),
                example: String(r[3] || '').trim()
            }));
    });
    return ContentService
        .createTextOutput(JSON.stringify({ ok: true, sheets: result }))
        .setMimeType(ContentService.MimeType.JSON);
}

function isValidRow(r) {
    const en = String(r[0] || '').trim();
    const zh = String(r[1] || '').trim();
    if (!en || !zh) return false;
    // 第一欄須含英文字母，第二欄須含中日韓或英文
    if (!/[a-zA-Z]/.test(en)) return false;
    if (!zh) return false;
    return true;
}
