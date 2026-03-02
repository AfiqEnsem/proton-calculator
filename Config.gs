// ==========================================
// FAIL 1: Config.gs
// Fungsi: Pusat simpanan konfigurasi ID Sheet dan Folder Drive (Object Mapping)
// ==========================================

// ID Utama Google Sheet
const MAIN_SPREADSHEET_ID = '12egceiARoW8lVL4dwoYEZIMGaHhIdxJ5kI4iIfR8_Vk';

// Default Folder ID (Utama)
const DEFAULT_FOLDER_ID = '1Va5RTkM5JzgYSPHa8cdO8dOEABMWqu03';

// Object Mapping dinamik untuk parameter SA1 - SA5
const SA_CONFIG = {
  'SA1': {
    sheetTabName: 'SA1',
    sheetGid: '0',
    folderId: '1BlRR78HcYxARQ4eHvEtVAOW3Uddby3sG'
  },
  'SA2': {
    sheetTabName: 'SA2',
    sheetGid: '1555842771',
    folderId: '1LRR4IX_3t-T2yBfU-40VWcGDI7nujifo'
  },
  'SA3': {
    sheetTabName: 'SA3',
    sheetGid: '1548874904',
    folderId: '1JFBle_vhs-omItAwkusatFWvOxRRUlbM'
  },
  'SA4': {
    sheetTabName: 'SA4',
    sheetGid: '403479158',
    folderId: '1ruu5nJzuXCcAR8NhYuk9d6zgMLHk5NL2'
  },
  'SA5': {
    sheetTabName: 'SA5',
    sheetGid: '576086314',
    folderId: '1mr2IoZnjrY_lw3oFajYj0L2Ua3SpUzpH'
  }
};

/**
 * Fungsi sekunder untuk mendapatkan tetapan SA secara dinamik berdasarkan parameter
 * Digunakan oleh SheetOps.gs dan DriveOps.gs nanti
 * @param {string} saParam - Contoh: 'SA1', 'sa2', 'SA3'
 * @return {object|null} - Akan memulangkan objek konfigurasi atau null
 */
function getSAConfigMap(saParam) {
  if (!saParam) return null;
  
  // Format ke huruf besar untuk elakkan masalah capslock dari frontend (cth: 'sa1' -> 'SA1')
  const saKey = String(saParam).toUpperCase().trim(); 
  
  if (SA_CONFIG[saKey]) {
    return SA_CONFIG[saKey];
  }
  
  return null; // Return null jika tidak wujud
}
