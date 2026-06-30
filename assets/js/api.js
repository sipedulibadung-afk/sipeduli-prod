const API_CONFIG = {
  BASE_URL: 'https://script.google.com/macros/s/AKfycbwOUtCG_7CNT5vss1a32oF7ngspd4d6JHoMpdDg772gL-5biO6KV3I_vbdWgO81PJ_Rsw/exec',
  TIMEOUT: 30000
};

class SipeduliAPI {
  constructor() { this.baseUrl = API_CONFIG.BASE_URL; }

  async get(action, params = {}) {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('action', action);
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          url.searchParams.append(key, params[key]);
        }
      });
      const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Koneksi gagal: ' + error.message };
    }
  }

  async post(action, data = {}) {
    try {
      const payload = { action, ...data };
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Koneksi gagal: ' + error.message };
    }
  }

  async login(username, password, role) { return await this.get('login', { username, password, role }); }
  async getDisabilitas(filters = {}) { return await this.get('getDisabilitas', filters); }
  async getDisabilitasById(id) { return await this.get('getDisabilitasById', { id }); }
  async saveDisabilitas(data) { return await this.post('saveDisabilitas', data); }
  async updateDisabilitas(data) { return await this.post('updateDisabilitas', data); }
  async deleteDisabilitas(id) { return await this.post('deleteDisabilitas', { id }); }
  async saveAsesmen(data) { return await this.post('saveAsesmen', data); }
  async getAsesmen(filters = {}) { return await this.get('getAsesmen', filters); }
  async saveBantuan(data) { return await this.post('saveBantuan', data); }
  async getBantuan(filters = {}) { return await this.get('getBantuan', filters); }
  async getStats() { return await this.get('getStats'); }
  async getPrioritas() { return await this.get('getPrioritas'); }
  async getKecamatan() { return await this.get('getKecamatan'); }
  async getDesa() { return await this.get('getDesa'); }
  async ping() { return await this.get('ping'); }

  async uploadFile(file, uploadedBy = '') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result.split(',')[1];
          const result = await this.post('uploadFile', {
            fileName: file.name, fileData: base64, mimeType: file.type, uploaded_by: uploadedBy
          });
          resolve(result);
        } catch (error) { reject(error); }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }
}

const api = new SipeduliAPI();

function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notif.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  notif.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4000);
}

function showLoading(message = 'Memproses...') {
  let loader = document.getElementById('globalLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
    loader.innerHTML = `<div class="bg-white rounded-3 p-4 text-center shadow">
      <div class="spinner-border text-maroon mb-2" role="status"></div>
      <p class="mb-0 fw-semibold" id="loaderMsg">${message}</p>
    </div>`;
    document.body.appendChild(loader);
  } else {
    document.getElementById('loaderMsg').textContent = message;
    loader.style.display = 'flex';
  }
}

function hideLoading() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.style.display = 'none';
}