function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reqSheet = e.parameter.sheet;
    const sheets = reqSheet ? [ss.getSheetByName(reqSheet)] : ss.getSheets();
    const result = {};
    sheets.forEach(sheet => {
        if (!sheet) return;
        const data = sheet.getDataRange().getDisplayValues();
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
    const col1 = String(r[0] || '').trim();
    const col2 = String(r[1] || '').trim();
    if (!col1 || !col2) return false;
    // 第一或第二欄要有英文字母 (支援 "英文-中文" 或是 "中文-英文" 的格式)
    if (!/[a-zA-Z]/.test(col1) && !/[a-zA-Z]/.test(col2)) return false;
    return true;
}
