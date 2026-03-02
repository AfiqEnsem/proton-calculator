// ==========================================
// FAIL 5: DriveOps.gs
// Fungsi: Mengurus muat naik gambar ke dalam Folder Drive SA secara dinamik
// ==========================================

/**
 * 1. MENGURUS MUAT NAIK GAMBAR
 * Dipanggil oleh Main.gs apabila menerima request action === 'uploadImage'
 */
function actionUploadImage(postData) {
  try {
    const fileData = postData.fileData; // base64 string
    const fileName = postData.fileName;
    const mimeType = postData.mimeType;
    
    // Secara default, guna Folder Utama jika tiada maklumat SA
    let targetFolderId = DEFAULT_FOLDER_ID; // Pembolehubah ini datang dari Config.gs

    // Jika Frontend menghantar saId (Contoh: 1, 2, 3), kita cari Folder ID yang tepat
    if (postData.saId) {
      const saKey = 'SA' + postData.saId;
      const saMap = getSAConfigMap(saKey); // Panggil fungsi di Config.gs
      
      if (saMap && saMap.folderId) {
        targetFolderId = saMap.folderId; // Guna folder spesifik SA (SA1-SA5)
      }
    }
    
    // Akses Folder Drive
    const folder = DriveApp.getFolderById(targetFolderId);
    
    // Proses tukar (decode) base64 string kepada fail sebenar
    const decodedData = Utilities.base64Decode(fileData.split(',')[1]);
    const blob = Utilities.newBlob(decodedData, mimeType, fileName);
    
    // Cipta fail di dalam Drive
    const file = folder.createFile(blob);
    
    // Tetapkan kebenaran supaya fail boleh dilihat oleh sesiapa tanpa log in (untuk embed dalam <img>)
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    // URL terus guna format lh3 — paling stabil untuk <img> embed tanpa Google login
    const fileUrl = 'https://lh3.googleusercontent.com/d/' + file.getId();
    
    return setHeaders({ success: true, fileUrl: fileUrl, fileId: file.getId() });

  } catch (error) {
    return setHeaders({ success: false, error: 'Gagal muat naik gambar: ' + error.toString() });
  }
}
