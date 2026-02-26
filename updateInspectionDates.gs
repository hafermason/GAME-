function updateInspectionDates() {
  const ROOT_FOLDER_ID = '1IezKB-tBsN1_sJJlHzTf7MEMiL8pqeeH';
  const TIMEZONE = 'GMT-7';
  const DATE_FORMAT = 'MM-dd-yyyy';
  const today = Utilities.formatDate(new Date(), TIMEZONE, DATE_FORMAT);

  const dateRegex = /\d{2}-\d{2}-\d{4}/g;
  const expirationRegex = /expiration/i;

  const folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const files = folder.getFilesByType(MimeType.MICROSOFT_WORD);

  while (files.hasNext()) {
    const file = files.next();

    // 1. Convert to a temp Google Doc so we can edit content
    const tempDoc = Drive.Files.copy({ mimeType: MimeType.GOOGLE_DOCS }, file.getId());
    const doc = DocumentApp.openById(tempDoc.id);
    const body = doc.getBody();

    // 2. Wipe Photos
    const images = body.getImages();
    for (var i = images.length - 1; i >= 0; i--) {
      images[i].removeFromParent();
    }

    // 3. Update Dates
    const paragraphs = body.getParagraphs();
    paragraphs.forEach(p => {
      const text = p.getText();
      if (!expirationRegex.test(text) && dateRegex.test(text)) {
        p.setText(text.replace(dateRegex, today));
      }
    });
    doc.saveAndClose();

    // 4. Update the ORIGINAL file content with the new clean version
    const exportUrl = 'https://www.googleapis.com/drive/v3/files/' + tempDoc.id + '/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
    });

    // This overwrites the old file's data without trashing the file itself
    Drive.Files.update({}, file.getId(), response.getBlob());

    // 5. Rename the original file, replacing the date in the filename with today's date
    const oldName = file.getName();
    const newName = oldName.replace(dateRegex, today);
    if (newName !== oldName) {
      Drive.Files.update({ name: newName }, file.getId());
    }

    // 6. Cleanup the temporary Google Doc
    DriveApp.getFileById(tempDoc.id).setTrashed(true);

    console.log("Updated in place: " + oldName + (newName !== oldName ? " → " + newName : ""));
  }
}
