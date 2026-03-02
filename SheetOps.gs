// ==========================================
// FAIL 4: SheetOps.gs
// Fungsi: Operasi Baca/Tulis Google Sheet untuk profil SA dan Leads
// ==========================================

/**
 * 1. MENDAPATKAN / MENGASASKAN SEMUA CONFIG (Profil 5 SA)
 */
function actionGetAllConfigs() {
  return setHeaders({ success: true, data: _getConfigs() });
}

/**
 * 2. MENDAPATKAN SATU PROFIL SA SPESIFIK (Untuk index.html / frontend utama)
 */
function actionGetSAProfile(saParam) {
  const configs = _getConfigs();
  const rawParam = String(saParam).trim().toUpperCase(); // cth: 'SA1' atau '1'
  
  // Ekstrak ID nombor dari parameter (Jika hantar 'SA3', ambil '3')
  let saId = parseInt(rawParam.replace(/[^0-9]/g, ''), 10);
  
  if (isNaN(saId) || saId < 1 || saId > 5) {
     return setHeaders({ success: false, message: 'ID Parameter SA Tidak Sah.' });
  }

  const saConfig = configs.find(c => c.id === saId);

  if (!saConfig) {
     return setHeaders({ success: false, message: 'Profil SA tidak wujud' });
  }
  return setHeaders({ success: true, data: saConfig });
}

/**
 * 3. SIMPAN KEMASKINI CONFIG DARI ADMIN DASHBOARD
 */
function actionSaveConfig(postData) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('saConfigs', JSON.stringify(postData.configs));
  return setHeaders({ success: true, message: 'Tetapan berjaya disimpan!' });
}

/**
 * 4. HANTAR BORANG LEAD KE GOOGLE SHEET (Dinamik mengikut SA)
 */
function actionSubmitLead(postData) {
  const configs = _getConfigs();
  const saId = parseInt(postData.saId, 10);
  
  const sa = configs.find(c => c.id === saId);
  if (!sa) return setHeaders({ success: false, error: 'SA slot tidak dijumpai.' });

  // Gunakan ID dinamic dari Config.gs (Contoh: SA1, SA2)
  const saKey = 'SA' + saId; 
  const saMap = getSAConfigMap(saKey);
  
  if (!saMap || !saMap.sheetGid) {
     return setHeaders({ success: false, error: 'Pautan GID Google Sheet belum ditetapkan di Config.gs' });
  }

  try {
    const targetGid = String(saMap.sheetGid).trim();
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const sheets = ss.getSheets();
    
    let targetSheet = null;
    for (let i = 0; i < sheets.length; i++) {
      if (String(sheets[i].getSheetId()) === targetGid) {
        targetSheet = sheets[i];
        break;
      }
    }

    if (!targetSheet) {
      return setHeaders({ success: false, error: `Tab (GID: ${targetGid}) tidak wujud di dalam fail Google Sheet utama.` });
    }

    // Format masa dan masukkan data
    const dateStr = Utilities.formatDate(new Date(), "Asia/Kuala_Lumpur", "dd/MM/yyyy HH:mm:ss");
    
    targetSheet.appendRow([
      dateStr,
      postData.name || '',
      postData.fullName || '',
      postData.phone || '',
      postData.model || '',
      postData.variant || '',
      postData.priceOTR || '',
      postData.deposit || '',
      postData.loan || '',
      postData.tenure || '',
      postData.interestRate || '',
      postData.monthly || ''
    ]);

    return setHeaders({ success: true, message: `Lead berjaya disimpan untuk ${saKey}!` });

  } catch (err) {
    return setHeaders({ success: false, error: 'Ralat Google Sheet API: ' + err.toString() });
  }
}

/**
 * 5. DAPATKAN SENARAI LEADS UNTUK KEGUNAAN ADMIN DASHBOARD
 */
function actionGetLeads(parameter) {
  const configs = _getConfigs();
  const saId = parseInt(parameter.saId || '1', 10);
  const limit = parseInt(parameter.limit || '10', 10);
  
  const sa = configs.find(c => c.id === saId);
  if (!sa) return setHeaders({ success: false, error: 'SA slot tidak dijumpai.' });

  // Rujuk Config.gs untuk GID
  const saKey = 'SA' + saId; 
  const saMap = getSAConfigMap(saKey);

  if (!saMap || !saMap.sheetGid) {
     return setHeaders({ success: true, data: [], message: 'Tiada jadual sheet ditetapkan' });
  }

  try {
    const targetGid = String(saMap.sheetGid).trim();
    const ss = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
    const sheets = ss.getSheets();
    let targetSheet = null;
    
    for (let i = 0; i < sheets.length; i++) {
      if (String(sheets[i].getSheetId()) === targetGid) {
        targetSheet = sheets[i];
        break;
      }
    }

    if (!targetSheet) {
       return setHeaders({ success: false, error: 'Format jadual GID tidak sah atau hilang.' });
    }

    // Ambil Data
    const allData = targetSheet.getDataRange().getValues();
    if (allData.length <= 1) {
       return setHeaders({ 
         success: true, 
         data: { 
           headers: allData[0] && allData[0].length > 0 ? allData[0] : ['Tarikh', 'Nama Penuh', 'No Telefon', 'Pilihan Model', 'Mesej Tambahan', 'URL WhatsApp', 'ID Slot SA'], 
           rows: [], 
           total: 0 
         } 
       });
    }

    const headers = allData[0];
    const rows = allData.slice(1);
    
    // Susun dari terbaru (bawah sheet) ke atas
    rows.reverse();
    const returnRows = rows.slice(0, limit);

    return setHeaders({ success: true, data: { headers: headers, rows: returnRows, total: rows.length }});
  } catch (err) {
    return setHeaders({ success: false, error: 'Gagal membaca Leads: ' + err.toString() });
  }
}


// ==========================================
// FUNGSI BANTUAN (PRIVATE HELPER)
// ==========================================
/**
 * Berfungsi untuk ambil Data JSON profil dari memori, atau jana data default jika kosong
 */
function _getConfigs() {
  const properties = PropertiesService.getScriptProperties();
  let configs = JSON.parse(properties.getProperty('saConfigs') || '[]');

  if (configs.length === 0) {
    const gids = ['668600556', '928138232', '367090375', '159429100', '42005877'];
    
    configs = Array(5).fill(null).map((_, i) => {
      // Slot 1 mengandungi data Proton, Slot 2-5 adalah template kosong
      if (i === 0) {
        return {
          id: i + 1, sheetId: MAIN_SPREADSHEET_ID, sheetGid: gids[i],
          status: 'Aktif', brand: 'Proton', name: 'Afiq', phone: '60123456789', logoImage: '',
          infoSA: 'Penasihat Jualan Sah Proton', promo: 'Promosi Eksklusif Ekstra Penjimatan!',
          heroTitle: 'Miliki Proton Idaman Anda Hari Ini.',
          heroSubtitle: 'Urusan mudah, telus, dan pantas. Kira anggaran bulanan anda sekarang dan biar saya uruskan selebihnya.',
          heroImage: '',
          aboutText: 'Saya merupakan Penasihat Jualan berpengalaman dalam membantu pelanggan menguruskan pembelian kereta idaman dengan mudah dan tanpa pening kepala. Hubungi saya sekarang untuk sebarang pertanyaan berkaitan promosi terbaru. Saya akan bantu uruskan pesanan anda dengan Pantas & Profesional.',
          hashtags: '#OnlineBooking #SalesAdvisor', profileImage: '',
          footerDescription: 'Pakar perunding jualan automotif anda. Membantu rakyat Malaysia merealisasikan impian memiliki kenderaan dengan mudah dan pantas.',
          models: [
            { id: 'saga', name: 'Saga', category: 'Sedan', image: 'https://v1.proton.com/themes/proton/assets/img/cars/sg22/mc2/sg22.png', variants: [{ name: '1.3L Standard MT', price: '34800' }, { name: '1.3L Standard AT', price: '38800' }, { name: '1.3L Premium AT', price: '41800' }, { name: '1.3L Premium S AT', price: '44800' }] },
            { id: 'persona', name: 'Persona', category: 'Sedan', image: 'https://v1.proton.com/themes/proton/assets/img/cars/ps21/mc2/ps21.png', variants: [{ name: '1.6L Standard CVT', price: '47800' }, { name: '1.6L Executive CVT', price: '53300' }, { name: '1.6L Premium CVT', price: '58300' }] },
            { id: 'x50', name: 'X50', category: 'SUV', image: 'https://v1.proton.com/themes/proton/assets/img/cars/x50-2024/exterior/color-ocean-blue.webp', variants: [{ name: '1.5T Standard', price: '86300' }, { name: '1.5T Executive', price: '93300' }, { name: '1.5T Premium', price: '101800' }, { name: '1.5TGDi Flagship', price: '113300' }] },
            { id: 'x70', name: 'X70', category: 'SUV', image: 'https://v1.proton.com/themes/proton/assets/img/cars/x70/2024/exterior/exterior-marine-blue.png', variants: [{ name: '1.5 TGDi Standard', price: '98800' }, { name: '1.5 TGDi Executive', price: '110800' }, { name: '1.5 TGDi Premium', price: '123800' }, { name: '1.5 TGDi Premium X', price: '128800' }] },
            { id: 's70', name: 'S70', category: 'Sedan', image: 'https://v1.proton.com/themes/proton/assets/img/cars/s70/s70-teal.png', variants: [{ name: '1.5T Executive', price: '73800' }, { name: '1.5T Premium', price: '79800' }, { name: '1.5T Flagship', price: '89800' }, { name: '1.5T Flagship X', price: '94800' }] }
          ],
          aboutPoints: [
            { title: 'TestDrive Bersemuka', subtitle: 'Pilih masa lapang' }, { title: 'Tred-In Harga Tinggi', subtitle: 'Penilaian percuma' },
            { title: 'Servis Pintu Ke Pintu', subtitle: 'Penghantaran kereta terus' }, { title: 'Kelulusan Pantas', subtitle: 'Panel bank yang kukuh' }
          ],
          testimonials: [], contactLinks: [{ label: 'WhatsApp', value: '' }]
        };
      } else {
        return {
          id: i + 1, sheetId: MAIN_SPREADSHEET_ID, sheetGid: gids[i],
          status: 'Disekat', brand: 'Proton', name: 'SA'+(i+1), phone: '', logoImage: '',
          infoSA: 'Penasihat Jualan Sah', promo: 'Promosi Eksklusif Ekstra Penjimatan!',
          heroTitle: 'Miliki Kereta Idaman Anda Hari Hari Ini.',
          heroSubtitle: 'Urusan mudah, telus, dan pantas. Kira anggaran bulanan anda sekarang dan biar saya uruskan selebihnya.',
          heroImage: '',
          aboutText: 'Saya merupakan Penasihat Jualan berpengalaman dalam membantu pelanggan menguruskan pembelian kereta idaman dengan mudah dan tanpa pening kepala. Hubungi saya sekarang untuk sebarang pertanyaan berkaitan promosi terbaru. Saya akan bantu uruskan pesanan anda dengan Pantas & Profesional.',
          hashtags: '#OnlineBooking #SalesAdvisor', profileImage: '',
          footerDescription: 'Pakar perunding jualan automotif anda. Membantu rakyat Malaysia merealisasikan impian memiliki kenderaan dengan mudah dan pantas.',
          models: [],
          aboutPoints: [
            { title: 'TestDrive Bersemuka', subtitle: 'Pilih masa lapang' }, { title: 'Tred-In Harga Tinggi', subtitle: 'Penilaian percuma' },
            { title: 'Servis Pintu Ke Pintu', subtitle: 'Penghantaran kereta terus' }, { title: 'Kelulusan Pantas', subtitle: 'Panel bank yang kukuh' }
          ],
          testimonials: [], contactLinks: [{ label: 'WhatsApp', value: '' }]
        };
      }
    });
    properties.setProperty('saConfigs', JSON.stringify(configs));
  }
  return configs;
}

// FUNGSI UNTUK RESET DATA ASAL (SILA RUN SECARA MANUAL JIKA PERLU)
function resetSADatabase() {
  PropertiesService.getScriptProperties().deleteProperty('saConfigs');
  Logger.log("✅ Database SA telah di-reset! Sila buka Admin Dashboard anda semula untuk jana kod baharu.");
}
