/**
 * SIPEDULI BADUNG - Export Module
 * Handles Excel, PDF, and Print exports
 */

const ExportManager = {
    
    /**
     * EXPORT TO EXCEL (.xlsx)
     * @param {string} tableName - CSS selector of the table (e.g., '#tabelLaporan')
     * @param {string} fileName - Name of the file (without extension)
     * @param {string} sheetName - Name of the sheet inside Excel
     */
    exportToExcel(tableName, fileName = 'Laporan', sheetName = 'Data') {
        try {
            const table = document.querySelector(tableName);
            if (!table) {
                showNotification('Tabel tidak ditemukan', 'danger');
                return;
            }

            showLoading('Mengekspor ke Excel...');

            // Clone table to avoid modifying original
            const clone = table.cloneNode(true);
            
            // Remove action buttons column if exists
            const actionCols = clone.querySelectorAll('th:last-child, td:last-child');
            // (Optional) Remove if you don't want action column in Excel

            // Convert table to workbook
            const wb = XLSX.utils.table_to_book(clone, { 
                sheet: sheetName,
                raw: true 
            });

            // Add metadata
            wb.Props = {
                Title: 'SIPEDULI BADUNG - ' + fileName,
                Author: 'Dinas Sosial Kabupaten Badung',
                CreatedDate: new Date()
            };

            // Generate file and trigger download
            XLSX.writeFile(wb, `${fileName}_${this._getDateStamp()}.xlsx`);
            
            hideLoading();
            showNotification('✅ File Excel berhasil diunduh', 'success');
            
        } catch (error) {
            hideLoading();
            showNotification('❌ Gagal ekspor: ' + error.message, 'danger');
            console.error(error);
        }
    },

    /**
     * EXPORT TO PDF (.pdf)
     * @param {string} tableName - CSS selector of the table
     * @param {Object} options - PDF configuration
     */
    exportToPDF(tableName, options = {}) {
        try {
            const table = document.querySelector(tableName);
            if (!table) {
                showNotification('Tabel tidak ditemukan', 'danger');
                return;
            }

            showLoading('Membuat PDF...');

            const {
                title = 'LAPORAN SIPEDULI BADUNG',
                subtitle = 'Dinas Sosial Kabupaten Badung',
                filename = 'Laporan',
                orientation = 'landscape', // 'portrait' or 'landscape'
                pageSize = 'a4'
            } = options;

            // Create new PDF document
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: pageSize
            });

            const pageWidth = doc.internal.pageSize.getWidth();

            // === HEADER ===
            // Logo placeholder (you can add real logo)
            doc.setFillColor(139, 26, 26); // Maroon
            doc.rect(0, 0, pageWidth, 30, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('SIPEDULI BADUNG', pageWidth / 2, 12, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Sistem Informasi Pendataan & Layanan Penyandang Disabilitas', 
                     pageWidth / 2, 19, { align: 'center' });
            doc.text('Dinas Sosial Kabupaten Badung', 
                     pageWidth / 2, 25, { align: 'center' });

            // === TITLE ===
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(title, pageWidth / 2, 42, { align: 'center' });

            // === INFO BOX ===
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            const infoY = 50;
            doc.text(`Tanggal Cetak : ${this._formatDate(new Date())}`, 14, infoY);
            doc.text(`Dicetak Oleh  : ${sessionStorage.getItem('userName') || 'Admin'}`, 14, infoY + 5);

            // === TABLE ===
            doc.autoTable({
                html: tableName,
                startY: infoY + 12,
                theme: 'grid',
                headStyles: {
                    fillColor: [139, 26, 26], // Maroon
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [30, 30, 30]
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 10, left: 14, right: 14 },
                didDrawPage: function(data) {
                    // Footer on every page
                    const pageCount = doc.internal.getNumberOfPages();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    
                    doc.setFontSize(8);
                    doc.setTextColor(128, 128, 128);
                    doc.text(
                        `Halaman ${data.pageNumber} dari ${pageCount}`,
                        pageWidth / 2, pageHeight - 10,
                        { align: 'center' }
                    );
                    doc.text(
                        `© 2026 Dinas Sosial Kabupaten Badung`,
                        pageWidth - 14, pageHeight - 10,
                        { align: 'right' }
                    );
                }
            });

            // Save PDF
            doc.save(`${filename}_${this._getDateStamp()}.pdf`);
            
            hideLoading();
            showNotification('✅ File PDF berhasil diunduh', 'success');
            
        } catch (error) {
            hideLoading();
            showNotification('❌ Gagal ekspor: ' + error.message, 'danger');
            console.error(error);
        }
    },

    /**
     * PRINT FUNCTIONALITY
     * Opens print dialog with clean layout
     */
    printReport(tableName, title = 'Laporan') {
        const table = document.querySelector(tableName);
        if (!table) {
            showNotification('Tabel tidak ditemukan', 'danger');
            return;
        }

        // Create a printable iframe
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - SIPEDULI BADUNG</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #8B1A1A;
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        color: #8B1A1A;
                        margin: 0;
                        font-size: 22px;
                    }
                    .header p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .info {
                        margin: 15px 0;
                        font-size: 12px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 11px;
                    }
                    th {
                        background-color: #8B1A1A;
                        color: white;
                        padding: 8px;
                        text-align: left;
                        border: 1px solid #6B0F0F;
                    }
                    td {
                        padding: 6px 8px;
                        border: 1px solid #ddd;
                    }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer {
                        margin-top: 30px;
                        text-align: right;
                        font-size: 11px;
                    }
                    .signature {
                        margin-top: 60px;
                        display: inline-block;
                        text-align: center;
                    }
                    .signature-line {
                        border-top: 1px solid #333;
                        width: 200px;
                        margin-top: 60px;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SIPEDULI BADUNG</h1>
                    <p>Sistem Informasi Pendataan & Layanan Penyandang Disabilitas</p>
                    <p><strong>Dinas Sosial Kabupaten Badung</strong></p>
                </div>
                
                <h2 style="text-align:center; color:#8B1A1A;">${title}</h2>
                
                <div class="info">
                    <strong>Tanggal Cetak:</strong> ${this._formatDate(new Date())}<br>
                    <strong>Dicetak Oleh:</strong> ${sessionStorage.getItem('userName') || 'Admin'}
                </div>
                
                ${table.outerHTML}
                
                <div class="footer">
                    <div class="signature">
                        Badung, ${this._formatDate(new Date())}<br>
                        <strong>Kepala Dinas Sosial</strong>
                        <div class="signature-line">
                            ___________________________<br>
                            NIP. 19XXXXXXXXXXXXX
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        // window.close(); // Uncomment to auto-close after print
                    }
                <\/script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    },

    /**
     * EXPORT DASHBOARD SUMMARY (for pimpinan.html)
     * Creates a comprehensive PDF with charts description
     */
    exportDashboardPDF() {
        showLoading('Membuat laporan dashboard...');
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(139, 26, 26);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN EKSEKUTIF', pageWidth / 2, 10, { align: 'center' });
            doc.setFontSize(10);
            doc.text('DASHBOARD PIMPINAN - SIPEDULI BADUNG', pageWidth / 2, 18, { align: 'center' });

            // Summary stats
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('RINGKASAN DATA', 14, 40);

            const stats = [
                ['Total Penyandang Disabilitas', '1.256'],
                ['Sudah Mendapat Bantuan', '847 (67.4%)'],
                ['Menunggu Bantuan', '312 (24.8%)'],
                ['Dalam Pendampingan', '97 (7.7%)'],
                ['Prioritas I (Sangat Mendesak)', '142']
            ];

            doc.autoTable({
                startY: 45,
                head: [['Indikator', 'Jumlah']],
                body: stats,
                theme: 'striped',
                headStyles: { fillColor: [139, 26, 26] },
                margin: { left: 14, right: 14 }
            });

            // Per-kecamatan breakdown
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text('DISTRIBUSI PER KECAMATAN', 14, finalY);

            const perKec = [
                ['Kuta', '320', '225', '70%'],
                ['Kuta Selatan', '285', '195', '68%'],
                ['Abiansemal', '210', '148', '70%'],
                ['Mengwi', '245', '172', '70%'],
                ['Petang', '196', '107', '55%']
            ];

            doc.autoTable({
                startY: finalY + 5,
                head: [['Kecamatan', 'Total', 'Dibantu', 'Cakupan']],
                body: perKec,
                theme: 'grid',
                headStyles: { fillColor: [139, 26, 26] },
                margin: { left: 14, right: 14 }
            });

            // Top priorities
            const finalY2 = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.text('TOP 5 PRIORITAS BELUM TERTANGANI', 14, finalY2);

            const priorities = [
                ['1', 'I Made Surya', 'Mengwi', 'Fisik', '95', 'Prioritas I'],
                ['2', 'Ni Ketut Ayu', 'Petang', 'Mental', '90', 'Prioritas I'],
                ['3', 'I Wayan Budi', 'Kuta', 'Sensorik', '88', 'Prioritas II'],
                ['4', 'I Nyoman Rai', 'Abiansemal', 'Intelektual', '85', 'Prioritas II'],
                ['5', 'Ni Made Dewi', 'Kuta Selatan', 'Ganda', '82', 'Prioritas II']
            ];

            doc.autoTable({
                startY: finalY2 + 5,
                head: [['No', 'Nama', 'Kecamatan', 'Jenis', 'Skor', 'Kategori']],
                body: priorities,
                theme: 'striped',
                headStyles: { fillColor: [139, 26, 26] },
                margin: { left: 14, right: 14 }
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128);
                doc.text(
                    `Dokumen ini digenerate otomatis oleh SIPEDULI BADUNG pada ${this._formatDate(new Date())} - Halaman ${i}/${pageCount}`,
                    pageWidth / 2, 290,
                    { align: 'center' }
                );
            }

            doc.save(`Laporan_Dashboard_${this._getDateStamp()}.pdf`);
            hideLoading();
            showNotification('✅ Laporan dashboard berhasil diunduh', 'success');
            
        } catch (error) {
            hideLoading();
            showNotification('❌ Gagal: ' + error.message, 'danger');
        }
    },

    // === HELPER METHODS ===
    _getDateStamp() {
        const d = new Date();
        return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    },

    _formatDate(date) {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};