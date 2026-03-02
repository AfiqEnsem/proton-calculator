// ==========================================
// FAIL 2: Main.gs
// Fungsi: Router utama untuk request GET, POST dan CORS Wrapper
// ==========================================

// Pembungkus response JSON untuk Frontend (Wajib untuk komunikasi API Apps Script)
function setHeaders(response) {
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 1. PENGENDALI GET REQUEST (Ambil Data)
// ==========================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    // A. Dapatkan profile 1 SA spesifik untuk halaman index/utama (apabila ada parameter `sa`)
    if (e.parameter.sa && !action) {
      return actionGetSAProfile(e.parameter.sa);
    }

    // B. Dapatkan senarai leads (Untuk Dashboard Admin)
    if (action === 'getLeads') {
      return actionGetLeads(e.parameter);
    }

    // C. Dapatkan data konfigurasi penuh kelima-lima SA (Untuk Dashboard Admin)
    if (action === 'getConfig' || !action) {
      return actionGetAllConfigs();
    }
    
    return setHeaders({ success: false, message: 'Action GET tidak dikenali.' });
  } catch (error) {
    return setHeaders({ success: false, error: error.message });
  }
}

// ==========================================
// 2. PENGENDALI POST REQUEST (Hantar / Kemaskini Data)
// ==========================================
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // A. Upload Gambar ke Google Drive
    if (action === 'uploadImage') {
      return actionUploadImage(postData);
    }

    // B. Simpan Konfigurasi (Admin Dashboard edit dan save)
    if (action === 'saveConfig') {
      return actionSaveConfig(postData);
    }

    // C. Hantar/Tambah Lead Baru dari form pengguna
    if (action === 'submitLead') {
      return actionSubmitLead(postData);
    }

    // D. Pengesahan Login (Admin)
    if (action === 'verifyLogin') {
      return actionVerifyLogin(postData);
    }

    // E. Kemaskini Username dan Password (Admin)
    if (action === 'updateCredentials') {
      return actionUpdateCredentials(postData);
    }

    return setHeaders({ success: false, message: 'Action POST tidak dikenali.' });

  } catch (error) {
    return setHeaders({ success: false, error: error.toString() });
  }
}

// ==========================================
// 3. PENGENDALI PREFLIGHT OPTIONS (CORS)
// ==========================================
function doOptions(e) {
  return setHeaders({});
}
