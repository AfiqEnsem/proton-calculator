// ==========================================
// FAIL 3: Auth.gs
// Fungsi: Mengurus log masuk, tukar kata laluan, dan bantu kecemasan
// ==========================================

/**
 * Mengurus permintaan VERIFY LOGIN dari Frontend
 * (Dipanggil oleh fail Main.gs)
 */
function actionVerifyLogin(postData) {
  const properties = PropertiesService.getScriptProperties();
  const currentAdminUser = properties.getProperty('adminUser') || 'admin';
  const currentAdminPass = properties.getProperty('adminPass') || 'admin123';

  if (postData.username === currentAdminUser && postData.password === currentAdminPass) {
    return setHeaders({ success: true, message: 'Log masuk berjaya' });
  } else {
    return setHeaders({ success: false, message: 'Maklumat log masuk tidak sah' });
  }
}

/**
 * Mengurus permintaan UPDATE CREDENTIALS (Tukar Password)
 * (Dipanggil oleh fail Main.gs)
 */
function actionUpdateCredentials(postData) {
  const properties = PropertiesService.getScriptProperties();
  const currentAdminUser = properties.getProperty('adminUser') || 'admin';
  const currentAdminPass = properties.getProperty('adminPass') || 'admin123';

  // Cek kata laluan lama terdahulu demi keselamatan
  if (postData.oldPassword !== currentAdminPass) {
    return setHeaders({ success: false, message: 'Kata laluan lama tidak tepat' });
  }

  // Set username baru, jika kosong kekalkan username asal
  const newUsername = postData.newUsername || currentAdminUser;
  
  properties.setProperty('adminUser', newUsername);
  properties.setProperty('adminPass', postData.newPassword);

  return setHeaders({ success: true, message: 'Kata laluan berjaya ditukar!' });
}

// ==========================================
// FUNGSI BANTUAN KECEMASAN (LUPA PASSWORD)
// ==========================================
// Arahan: Jika anda tidak boleh log masuk, pilih "resetPassword" 
// di palang menu bahagian atas editor skrip dan tekan "Run".
function resetPassword() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('adminUser', 'admin');
  properties.setProperty('adminPass', 'admin123');
  Logger.log("✅ Berjaya! Username telah direset ke: admin | Password: admin123");
}
