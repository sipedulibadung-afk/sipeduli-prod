/**
 * ============================================================
 * SIPEDULI BADUNG - Backend API
 * Sistem Informasi Pendataan & Layanan Penyandang Disabilitas
 * Kabupaten Badung - Dinas Sosial
 * ============================================================
 */

// ===== KONFIGURASI =====
const CONFIG = {
  SPREADSHEET_ID: 'https://docs.google.com/spreadsheets/d/1fgQcLfZ7Id30dZyjB96T3TpSSdP-6fsnpGGetDfzshc/edit', // ← WAJIB DIGANTI
  FOLDER_ID: 'https://drive.google.com/drive/folders/1J0ZBQwOAC9crsjZKXwxtPTr27fzqcC8r?usp=drive_link',          // ← WAJIB DIGANTI
  SHEETS: {
    USERS: 'Users',
    DISABILITAS: 'Disabilitas',
    ASESMEN: 'Asesmen',
    BANTUAN: 'Bantuan',
    KECAMATAN: 'Kecamatan',
    DESA: 'Desa',
    FILES: 'Files'
  }
};

// ===== FUNGSI UTAMA =====

/**
 * Handler GET request
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    
    switch(action) {
      case 'ping':
        result = { success: true, message: 'SIPEDULI BADUNG API is running', timestamp: new Date().toISOString() };
        break;
      case 'login':
        result = handleLogin(e.parameter);
        break;
      case 'getDisabilitas':
        result = getDisabilitas(e.parameter);
        break;
      case 'getDisabilitasById':
        result = getDisabilitasById(e.parameter.id);
        break;
      case 'getStats':
        result = getStats();
        break;
      case 'getAsesmen':
        result = getAsesmen(e.parameter);
        break;
      case 'getBantuan':
        result = getBantuan(e.parameter);
        break;
      case 'getKecamatan':
        result = getMasterData(CONFIG.SHEETS.KECAMATAN);
        break;
      case 'getDesa':
        result = getMasterData(CONFIG.SHEETS.DESA);
        break;
      case 'getPrioritas':
        result = getPrioritas();
        break;
      default:
        result = { success: false, message: 'Action tidak ditemukan' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler POST request
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;
    
    switch(action) {
      case 'saveDisabilitas':
        result = saveDisabilitas(data);
        break;
      case 'updateDisabilitas':
        result = updateDisabilitas(data);
        break;
      case 'deleteDisabilitas':
        result = deleteDisabilitas(data.id);
        break;
      case 'saveAsesmen':
        result = saveAsesmen(data);
        break;
      case 'saveBantuan':
        result = saveBantuan(data);
        break;
      case 'uploadFile':
        result = uploadFile(data);
        break;
      default:
        result = { success: false, message: 'Action tidak ditemukan' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== AUTHENTIKASI =====

function handleLogin(params) {
  const { username, password, role } = params;
  
  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }
  
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const user = {};
    headers.forEach((h, idx) => user[h] = row[idx]);
    
    if (user.username === username && 
        user.password === password && 
        user.status === 'aktif') {
      
      // Cek role jika dipilih
      if (role && user.role !== role) {
        return { success: false, message: 'Role tidak sesuai dengan akun' };
      }
      
      return {
        success: true,
        message: 'Login berhasil',
        data: {
          id: user.id,
          username: user.username,
          nama_lengkap: user.nama_lengkap,
          role: user.role
        }
      };
    }
  }
  
  return { success: false, message: 'Username/password salah atau akun tidak aktif' };
}

// ===== DATA DISABILITAS =====

function getDisabilitas(params) {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  
  const headers = data[0];
  let result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    result.push(row);
  }
  
  // Filter
  if (params && params.kecamatan) {
    result = result.filter(r => r.kecamatan === params.kecamatan);
  }
  if (params && params.jenis_disabilitas) {
    result = result.filter(r => r.jenis_disabilitas === params.jenis_disabilitas);
  }
  if (params && params.search) {
    const s = params.search.toLowerCase();
    result = result.filter(r => 
      (r.nama_lengkap || '').toLowerCase().includes(s) || 
      (r.nik || '').includes(s)
    );
  }
  
  return { success: true, data: result, total: result.length };
}

function getDisabilitasById(id) {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const row = {};
      headers.forEach((h, idx) => row[h] = data[i][idx]);
      return { success: true, data: row };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

function saveDisabilitas(data) {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = headers.map(h => {
    if (h === 'id') return generateId();
    if (h === 'created_at' || h === 'updated_at') return new Date().toISOString();
    return data[h] || '';
  });
  
  sheet.appendRow(newRow);
  
  return { 
    success: true, 
    message: 'Data berhasil disimpan',
    id: newRow[0]
  };
}

function updateDisabilitas(data) {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(data.id)) {
      const newRow = headers.map(h => {
        if (h === 'updated_at') return new Date().toISOString();
        if (h === 'id') return data.id;
        return data[h] !== undefined ? data[h] : allData[i][headers.indexOf(h)];
      });
      sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
      return { success: true, message: 'Data berhasil diupdate' };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

function deleteDisabilitas(id) {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Data berhasil dihapus' };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}

// ===== ASESMEN =====

function saveAsesmen(data) {
  // Hitung skor otomatis
  const skor = (parseInt(data.mobilitas) || 0) +
               (parseInt(data.komunikasi) || 0) +
               (parseInt(data.adl) || 0) +
               (parseInt(data.ekonomi) || 0) +
               (parseInt(data.riwayat_bantuan) || 0);
  
  let kategori = '';
  let rekomendasi = [];
  
  if (skor >= 85) {
    kategori = 'PRIORITAS I';
    rekomendasi = ['Bantuan Sosial', 'Alat Bantu', 'Rehabilitasi Sosial', 'Pelatihan Kemandirian', 'Pendampingan Intensif'];
  } else if (skor >= 65) {
    kategori = 'PRIORITAS II';
    rekomendasi = ['Bantuan Alat Bantu', 'Rehabilitasi Sosial', 'Pelatihan Kemandirian'];
  } else {
    kategori = 'PRIORITAS III';
    rekomendasi = ['Pemantauan Berkala', 'Bantuan Sosial Rutin'];
  }
  
  data.skor_total = skor;
  data.kategori = kategori;
  data.rekomendasi = rekomendasi.join(', ');
  data.tanggal_asesmen = new Date().toISOString();
  
  const sheet = getSheet(CONFIG.SHEETS.ASESMEN);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = headers.map(h => {
    if (h === 'id') return generateId();
    return data[h] || '';
  });
  
  sheet.appendRow(newRow);
  
  // Update skor di tabel Disabilitas
  if (data.disabilitas_id) {
    updateDisabilitas({
      id: data.disabilitas_id,
      skor_prioritas: skor,
      kategori_prioritas: kategori
    });
  }
  
  return { 
    success: true, 
    message: 'Asesmen berhasil disimpan',
    data: { skor, kategori, rekomendasi }
  };
}

function getAsesmen(params) {
  const sheet = getSheet(CONFIG.SHEETS.ASESMEN);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  
  const headers = data[0];
  let result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    result.push(row);
  }
  
  return { success: true, data: result };
}

// ===== BANTUAN =====

function saveBantuan(data) {
  data.created_at = new Date().toISOString();
  
  const sheet = getSheet(CONFIG.SHEETS.BANTUAN);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const newRow = headers.map(h => {
    if (h === 'id') return generateId();
    return data[h] || '';
  });
  
  sheet.appendRow(newRow);
  return { success: true, message: 'Data bantuan berhasil disimpan' };
}

function getBantuan(params) {
  const sheet = getSheet(CONFIG.SHEETS.BANTUAN);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    result.push(row);
  }
  
  return { success: true, data: result };
}

// ===== STATISTIK =====

function getStats() {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let total = 0, fisik = 0, mental = 0, intelektual = 0, sensorik = 0, ganda = 0;
  let sudahBantuan = 0, menunggu = 0, pendampingan = 0;
  let perKecamatan = {};
  
  for (let i = 1; i < data.length; i++) {
    total++;
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    
    // Hitung per jenis
    switch(row.jenis_disabilitas) {
      case 'Fisik': fisik++; break;
      case 'Mental': mental++; break;
      case 'Intelektual': intelektual++; break;
      case 'Sensorik': sensorik++; break;
      case 'Ganda': ganda++; break;
    }
    
    // Hitung per status
    switch(row.status_bantuan) {
      case 'Sudah Dibantu': sudahBantuan++; break;
      case 'Menunggu': menunggu++; break;
      case 'Pendampingan': pendampingan++; break;
    }
    
    // Hitung per kecamatan
    const kec = row.kecamatan || 'Lainnya';
    perKecamatan[kec] = (perKecamatan[kec] || 0) + 1;
  }
  
  return {
    success: true,
    data: {
      total, fisik, mental, intelektual, sensorik, ganda,
      sudahBantuan, menunggu, pendampingan,
      perKecamatan
    }
  };
}

function getPrioritas() {
  const sheet = getSheet(CONFIG.SHEETS.DISABILITAS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let result = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.skor_prioritas && parseInt(row.skor_prioritas) > 0) {
      result.push(row);
    }
  }
  
  // Sort berdasarkan skor descending
  result.sort((a, b) => parseInt(b.skor_prioritas) - parseInt(a.skor_prioritas));
  
  return { success: true, data: result.slice(0, 10) }; // Top 10
}

// ===== MASTER DATA =====

function getMasterData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, data: [] };
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    result.push(row);
  }
  
  return { success: true, data: result };
}

// ===== UPLOAD FILE =====

function uploadFile(data) {
  try {
    const { fileName, fileData, mimeType } = data;
    
    // Decode base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );
    
    // Simpan ke Google Drive
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    const fileUrl = `https://drive.google.com/uc?id=${fileId}`;
    
    // Catat ke sheet Files
    const sheetFiles = getSheet(CONFIG.SHEETS.FILES);
    sheetFiles.appendRow([
      generateId(),
      fileName,
      fileId,
      mimeType,
      fileUrl,
      data.uploaded_by || '',
      new Date().toISOString()
    ]);
    
    return {
      success: true,
      message: 'File berhasil diupload',
      data: { fileId, fileUrl, fileName }
    };
    
  } catch(error) {
    return { success: false, message: 'Upload gagal: ' + error.toString() };
  }
}

// ===== HELPER FUNCTIONS =====

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function generateId() {
  return 'ID' + new Date().getTime() + Math.floor(Math.random() * 1000);
}

// ===== FUNGSI SETUP AWAL =====

/**
 * Jalankan fungsi ini sekali untuk setup awal
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Buat sheet Users
  let sheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
  sheet.getRange(1, 1, 1, 7).setValues([[
    'id', 'username', 'password', 'nama_lengkap', 'role', 'status', 'created_at'
  ]]);
  sheet.appendRow([1, 'admin', 'admin123', 'Administrator', 'admin', 'aktif', new Date().toISOString()]);
  sheet.appendRow([2, 'pimpinan', 'pin123', 'Kepala Dinas', 'pimpinan', 'aktif', new Date().toISOString()]);
  sheet.appendRow([3, 'operator_dinsos', 'op123', 'Operator Dinsos', 'operator_dinsos', 'aktif', new Date().toISOString()]);
  
  // Buat sheet Disabilitas
  sheet = ss.getSheetByName('Disabilitas') || ss.insertSheet('Disabilitas');
  sheet.getRange(1, 1, 1, 22).setValues([[
    'id', 'nik', 'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'desa', 
    'kecamatan', 'jenis_disabilitas', 'tingkat_keparahan', 'status_dtks', 'pekerjaan', 
    'pendidikan', 'no_hp_keluarga', 'foto_url', 'kk_url', 'ktp_url', 'skor_prioritas', 
    'kategori_prioritas', 'status_bantuan', 'created_by', 'created_at'
  ]]);
  
  // Buat sheet Asesmen
  sheet = ss.getSheetByName('Asesmen') || ss.insertSheet('Asesmen');
  sheet.getRange(1, 1, 1, 14).setValues([[
    'id', 'disabilitas_id', 'nik', 'nama', 'mobilitas', 'komunikasi', 'adl', 'ekonomi', 
    'riwayat_bantuan', 'alat_bantu', 'skor_total', 'kategori', 'rekomendasi', 'tanggal_asesmen'
  ]]);
  
  // Buat sheet Bantuan
  sheet = ss.getSheetByName('Bantuan') || ss.insertSheet('Bantuan');
  sheet.getRange(1, 1, 1, 10).setValues([[
    'id', 'disabilitas_id', 'nama_penerima', 'jenis_bantuan', 'tanggal_penyaluran', 
    'kecamatan', 'petugas', 'status', 'catatan', 'created_at'
  ]]);
  
  // Buat sheet Kecamatan
  sheet = ss.getSheetByName('Kecamatan') || ss.insertSheet('Kecamatan');
  sheet.getRange(1, 1, 1, 5).setValues([['id', 'nama_kecamatan', 'lat', 'lng', 'jumlah_penduduk']]);
  sheet.appendRow([1, 'Kuta', -8.7589, 115.1687, 75000]);
  sheet.appendRow([2, 'Kuta Selatan', -8.8200, 115.1900, 68000]);
  sheet.appendRow([3, 'Abiansemal', -8.6800, 115.2100, 52000]);
  sheet.appendRow([4, 'Mengwi', -8.6200, 115.1800, 61000]);
  sheet.appendRow([5, 'Petang', -8.4800, 115.1500, 45000]);
  
  // Buat sheet Files
  sheet = ss.getSheetByName('Files') || ss.insertSheet('Files');
  sheet.getRange(1, 1, 1, 7).setValues([['id', 'file_name', 'file_id', 'mime_type', 'url', 'uploaded_by', 'uploaded_at']]);
  
  return 'Setup database berhasil!';
}

/**
 * Test koneksi API
 */
function testApi() {
  const result = getStats();
  Logger.log(JSON.stringify(result));
  return result;
}