class FileUploader {
  constructor(inputElement, options = {}) {
    this.input = typeof inputElement === 'string' ? document.getElementById(inputElement) : inputElement;
    this.options = { maxSize: 5 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'], preview: options.preview || null, ...options };
    this.fileUrl = null;
    if (this.input) this.input.addEventListener('change', (e) => this.handleFile(e));
  }

  async handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > this.options.maxSize) { showNotification('Ukuran file maksimal 5MB', 'danger'); this.input.value = ''; return; }
    if (!this.options.allowedTypes.includes(file.type)) { showNotification('Format file tidak didukung', 'danger'); this.input.value = ''; return; }
    if (this.options.preview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById(this.options.preview);
        img.src = e.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
    try {
      showLoading('Mengupload file...');
      const result = await api.uploadFile(file, sessionStorage.getItem('userName') || '');
      hideLoading();
      if (result.success) {
        this.fileUrl = result.data.fileUrl;
        showNotification('File berhasil diupload', 'success');
        return result.data;
      } else {
        showNotification(result.message, 'danger');
      }
    } catch (error) {
      hideLoading();
      showNotification('Upload gagal: ' + error.message, 'danger');
    }
  }

  getUrl() { return this.fileUrl; }
}