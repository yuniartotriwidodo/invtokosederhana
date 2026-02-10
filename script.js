// Global Variables
let googleSheetUrl = '';
let html5QrCode = null;
let barangData = [];
let currentStok = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    initializeEventListeners();
    initializeHargaForm();
    initializeInventoryForm();
});

// Load Settings from LocalStorage
function loadSettings() {
    const savedUrl = localStorage.getItem('googleSheetUrl');
    if (savedUrl) {
        googleSheetUrl = savedUrl;
        document.getElementById('settingLink').value = savedUrl;
        loadBarangData();
    }
}

// Save Settings to LocalStorage
function saveSettings(url) {
    localStorage.setItem('googleSheetUrl', url);
    googleSheetUrl = url;
}

// Event Listeners
function initializeEventListeners() {
    // Menu Toggle
    document.getElementById('menuToggle').addEventListener('click', toggleMenu);
    
    // Navigation
    document.querySelectorAll('.side-menu nav a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.dataset.page);
            closeMenu();
        });
    });

    // Keluar Button
    document.getElementById('keluarBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            window.close();
        }
    });

    // Scan Button
    document.getElementById('btnScan').addEventListener('click', startScan);
    
    // Cancel Button
    document.getElementById('btnCancel').addEventListener('click', cancelScan);
    
    // Transaksi Button
    document.getElementById('btnTransaksi').addEventListener('click', processTransaction);

    // Form Submissions
    document.getElementById('formBarang').addEventListener('submit', submitBarang);
    document.getElementById('formHarga').addEventListener('submit', submitHarga);
    document.getElementById('formInventory').addEventListener('submit', submitInventory);
    document.getElementById('formPengaturan').addEventListener('submit', submitPengaturan);

    // Barang Form - Kode Input
    document.getElementById('barangKode').addEventListener('input', function() {
        searchSimilar('kode', this.value);
    });

    // Barang Form - Nama Input
    document.getElementById('barangNama').addEventListener('input', function() {
        searchSimilar('nama', this.value);
    });

    // Barang Form - Check existing data when both kode and nama filled
    document.getElementById('barangKode').addEventListener('blur', checkExistingBarang);
    document.getElementById('barangNama').addEventListener('blur', checkExistingBarang);

    // Camera Button
    document.getElementById('btnCamera').addEventListener('click', openCamera);

    // Photo Input
    document.getElementById('barangPhoto').addEventListener('change', previewPhoto);

    // Harga Form - Calculate when inputs change
    document.getElementById('hargaDasar').addEventListener('input', calculateHargaJual);
    document.getElementById('hargaDiskon').addEventListener('input', calculateHargaJual);
    document.getElementById('hargaPajak').addEventListener('input', calculateHargaJual);
    document.getElementById('hargaMargin').addEventListener('input', calculateHargaJual);

    // Inventory Form - Update stok when tambah changes
    document.getElementById('invTambah').addEventListener('input', updateInventoryStok);
    document.getElementById('invKode').addEventListener('change', loadCurrentStok);
}

// Menu Functions
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

function closeMenu() {
    document.getElementById('sideMenu').classList.remove('active');
}

// Page Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
}

// Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Barcode Scanner
function startScan() {
    const readerDiv = document.getElementById('reader');
    readerDiv.style.display = 'block';
    document.getElementById('btnScan').style.display = 'none';

    html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('Error starting scanner:', err);
        showNotification('Gagal membuka kamera', 'error');
        stopScanner();
    });
}

function onScanSuccess(decodedText) {
    stopScanner();
    loadBarangByKode(decodedText);
}

function onScanError(error) {
    // Silent error handling
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            document.getElementById('btnScan').style.display = 'inline-flex';
        }).catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function cancelScan() {
    clearScanForm();
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('btnScan').focus();
}

function clearScanForm() {
    document.getElementById('scanKode').value = '';
    document.getElementById('scanNama').value = '';
    document.getElementById('scanKelompok').value = '';
    document.getElementById('scanJenis').value = '';
    document.getElementById('scanWarna').value = '';
    document.getElementById('scanUkuran').value = '';
    document.getElementById('scanCatatan').value = '';
    document.getElementById('scanHargaJual').value = '';
    document.getElementById('scanPhoto').style.display = 'none';
}

// Load Barang by Kode from Scan
async function loadBarangByKode(kode) {
    if (!googleSheetUrl) {
        showNotification('Harap atur link Google Sheet terlebih dahulu', 'warning');
        return;
    }

    try {
        const response = await fetch(`${googleSheetUrl}?action=getBarang&kode=${encodeURIComponent(kode)}`);
        const data = await response.json();

        if (data.success && data.barang) {
            const barang = data.barang;
            document.getElementById('scanKode').value = barang.KODE || '';
            document.getElementById('scanNama').value = barang.NAMA || '';
            document.getElementById('scanKelompok').value = barang.KELOMPOK || '';
            document.getElementById('scanJenis').value = barang.JENIS || '';
            document.getElementById('scanWarna').value = barang.WARNA || '';
            document.getElementById('scanUkuran').value = barang.UKURAN || '';
            document.getElementById('scanCatatan').value = barang.CATATAN || '';
            
            if (barang.PHOTO) {
                document.getElementById('scanPhoto').src = barang.PHOTO;
                document.getElementById('scanPhoto').style.display = 'block';
            }

            // Get Harga Jual
            const hargaResponse = await fetch(`${googleSheetUrl}?action=getHarga&kode=${encodeURIComponent(kode)}`);
            const hargaData = await hargaResponse.json();
            
            if (hargaData.success && hargaData.harga) {
                document.getElementById('scanHargaJual').value = formatCurrency(hargaData.harga.HARGAJUAL || 0);
            }

            document.getElementById('resultSection').style.display = 'block';
        } else {
            showNotification('Barang tidak ditemukan', 'warning');
        }
    } catch (error) {
        console.error('Error loading barang:', error);
        showNotification('Gagal memuat data barang', 'error');
    }
}

// Process Transaction
async function processTransaction() {
    const kode = document.getElementById('scanKode').value;
    
    if (!kode) {
        showNotification('Kode barang tidak tersedia', 'warning');
        return;
    }

    if (!googleSheetUrl) {
        showNotification('Harap atur link Google Sheet terlebih dahulu', 'warning');
        return;
    }

    try {
        // Get current stock
        const stokResponse = await fetch(`${googleSheetUrl}?action=getLastStok&kode=${encodeURIComponent(kode)}`);
        const stokData = await stokResponse.json();
        
        let currentStok = 0;
        if (stokData.success && stokData.stok !== undefined) {
            currentStok = parseFloat(stokData.stok) || 0;
        }

        if (currentStok < 1) {
            showNotification('Stok tidak mencukupi', 'warning');
            return;
        }

        const newStok = currentStok - 1;
        const tanggal = getCurrentDateTime();

        const invData = {
            KODE: kode,
            TANGGAL: tanggal,
            TAMBAH: '',
            KURANG: 1,
            STOK: newStok,
            NAMATRANSAKSI: 'BELI',
            CATATAN: ''
        };

        // Save to Google Sheet
        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveInventory',
                data: invData
            })
        });

        showNotification('Transaksi berhasil disimpan', 'success');
        clearScanForm();
        document.getElementById('resultSection').style.display = 'none';
        document.getElementById('btnScan').focus();

    } catch (error) {
        console.error('Error processing transaction:', error);
        showNotification('Gagal menyimpan transaksi', 'error');
    }
}

// Data Barang Functions
async function loadBarangData() {
    if (!googleSheetUrl) return;

    try {
        const response = await fetch(`${googleSheetUrl}?action=getAllBarang`);
        const data = await response.json();
        
        if (data.success && data.barang) {
            barangData = data.barang;
            populateBarangDropdowns();
        }
    } catch (error) {
        console.error('Error loading barang data:', error);
    }
}

function populateBarangDropdowns() {
    const hargaKode = document.getElementById('hargaKode');
    const invKode = document.getElementById('invKode');
    
    // Clear existing options except first
    hargaKode.innerHTML = '<option value="">-- Pilih Kode --</option>';
    invKode.innerHTML = '<option value="">-- Pilih Kode --</option>';
    
    barangData.forEach(item => {
        const option1 = document.createElement('option');
        option1.value = item.KODE;
        option1.textContent = `${item.KODE} - ${item.NAMA}`;
        hargaKode.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = item.KODE;
        option2.textContent = `${item.KODE} - ${item.NAMA}`;
        invKode.appendChild(option2);
    });
}

function searchSimilar(type, value) {
    if (!value || value.length < 2) {
        hideSuggestions(type);
        return;
    }

    const suggestions = barangData.filter(item => {
        const searchValue = type === 'kode' ? item.KODE : item.NAMA;
        return searchValue && searchValue.toLowerCase().includes(value.toLowerCase());
    });

    showSuggestions(type, suggestions);
}

function showSuggestions(type, suggestions) {
    const suggestionsDiv = document.getElementById(type === 'kode' ? 'kodeSuggestions' : 'namaSuggestions');
    
    if (suggestions.length === 0) {
        hideSuggestions(type);
        return;
    }

    suggestionsDiv.innerHTML = '';
    suggestions.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = type === 'kode' ? item.KODE : item.NAMA;
        div.addEventListener('click', () => {
            if (type === 'kode') {
                document.getElementById('barangKode').value = item.KODE;
            } else {
                document.getElementById('barangNama').value = item.NAMA;
            }
            hideSuggestions(type);
            checkExistingBarang();
        });
        suggestionsDiv.appendChild(div);
    });
    
    suggestionsDiv.classList.add('active');
}

function hideSuggestions(type) {
    const suggestionsDiv = document.getElementById(type === 'kode' ? 'kodeSuggestions' : 'namaSuggestions');
    suggestionsDiv.classList.remove('active');
}

function checkExistingBarang() {
    const kode = document.getElementById('barangKode').value;
    const nama = document.getElementById('barangNama').value;
    
    if (!kode || !nama) return;
    
    const existing = barangData.find(item => 
        item.KODE === kode && item.NAMA === nama
    );
    
    if (existing) {
        document.getElementById('barangKelompok').value = existing.KELOMPOK || '';
        document.getElementById('barangJenis').value = existing.JENIS || '';
        document.getElementById('barangWarna').value = existing.WARNA || '';
        document.getElementById('barangUkuran').value = existing.UKURAN || '';
        document.getElementById('barangCatatan').value = existing.CATATAN || '';
        document.getElementById('barangMedsos').value = existing.MEDSOS || '';
        
        if (existing.PHOTO) {
            document.getElementById('previewBarangPhoto').src = existing.PHOTO;
            document.getElementById('previewBarangPhoto').style.display = 'block';
        }
    }
}

function openCamera() {
    const input = document.getElementById('barangPhoto');
    input.setAttribute('capture', 'camera');
    input.click();
}

function previewPhoto(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('previewBarangPhoto').src = event.target.result;
            document.getElementById('previewBarangPhoto').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function submitBarang(e) {
    e.preventDefault();
    
    if (!googleSheetUrl) {
        showNotification('Harap atur link Google Sheet terlebih dahulu', 'warning');
        return;
    }

    const photo = document.getElementById('barangPhoto').files[0];
    let photoBase64 = '';
    
    if (photo) {
        photoBase64 = await fileToBase64(photo);
    }

    const barangData = {
        KODE: document.getElementById('barangKode').value,
        NAMA: document.getElementById('barangNama').value,
        KELOMPOK: document.getElementById('barangKelompok').value,
        JENIS: document.getElementById('barangJenis').value,
        WARNA: document.getElementById('barangWarna').value,
        UKURAN: document.getElementById('barangUkuran').value,
        CATATAN: document.getElementById('barangCatatan').value,
        MEDSOS: document.getElementById('barangMedsos').value,
        PHOTO: photoBase64,
        TANGGAL: getCurrentDateTime()
    };

    try {
        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveBarang',
                data: barangData
            })
        });

        showNotification('Data barang berhasil disimpan', 'success');
        clearBarangForm();
        loadBarangData();
        document.getElementById('barangKode').focus();

    } catch (error) {
        console.error('Error saving barang:', error);
        showNotification('Gagal menyimpan data barang', 'error');
    }
}

function clearBarangForm() {
    document.getElementById('formBarang').reset();
    document.getElementById('previewBarangPhoto').style.display = 'none';
}

// Data Harga Functions
function initializeHargaForm() {
    const tanggalInput = document.getElementById('hargaTanggal');
    tanggalInput.value = getCurrentDateTime();
}

function calculateHargaJual() {
    const hargaDasar = parseFloat(document.getElementById('hargaDasar').value) || 0;
    const diskonPersen = parseFloat(document.getElementById('hargaDiskon').value) || 0;
    const pajakPersen = parseFloat(document.getElementById('hargaPajak').value) || 0;
    const marginPersen = parseFloat(document.getElementById('hargaMargin').value) || 0;
    
    const diskon = hargaDasar * (diskonPersen / 100);
    const pajak = hargaDasar * (pajakPersen / 100);
    const margin = hargaDasar * (marginPersen / 100);
    
    const hargaJual = hargaDasar + margin - diskon + pajak;
    
    document.getElementById('hargaJual').value = hargaJual.toFixed(2);
}

async function submitHarga(e) {
    e.preventDefault();
    
    if (!googleSheetUrl) {
        showNotification('Harap atur link Google Sheet terlebih dahulu', 'warning');
        return;
    }

    const hargaData = {
        KODE: document.getElementById('hargaKode').value,
        TANGGAL: getCurrentDateTime(),
        HARGADASAR: document.getElementById('hargaDasar').value,
        DISKON: document.getElementById('hargaDiskon').value,
        PAJAK: document.getElementById('hargaPajak').value,
        MARGIN: document.getElementById('hargaMargin').value,
        HARGAJUAL: document.getElementById('hargaJual').value,
        CATATAN: document.getElementById('hargaCatatan').value
    };

    try {
        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveHarga',
                data: hargaData
            })
        });

        showNotification('Data harga berhasil disimpan', 'success');
        clearHargaForm();
        document.getElementById('hargaKode').focus();

    } catch (error) {
        console.error('Error saving harga:', error);
        showNotification('Gagal menyimpan data harga', 'error');
    }
}

function clearHargaForm() {
    document.getElementById('formHarga').reset();
    document.getElementById('hargaTanggal').value = getCurrentDateTime();
}

// Data Inventory Functions
function initializeInventoryForm() {
    const tanggalInput = document.getElementById('invTanggal');
    tanggalInput.value = getCurrentDateTime();
}

async function loadCurrentStok() {
    const kode = document.getElementById('invKode').value;
    
    if (!kode || !googleSheetUrl) {
        document.getElementById('invStok').value = '';
        return;
    }

    try {
        const response = await fetch(`${googleSheetUrl}?action=getLastStok&kode=${encodeURIComponent(kode)}`);
        const data = await response.json();
        
        if (data.success && data.stok !== undefined) {
            currentStok = parseFloat(data.stok) || 0;
            updateInventoryStok();
        } else {
            currentStok = 0;
            document.getElementById('invStok').value = '';
        }
    } catch (error) {
        console.error('Error loading stok:', error);
        currentStok = 0;
    }
}

function updateInventoryStok() {
    const tambah = parseFloat(document.getElementById('invTambah').value) || 0;
    const newStok = currentStok + tambah;
    document.getElementById('invStok').value = newStok;
}

async function submitInventory(e) {
    e.preventDefault();
    
    if (!googleSheetUrl) {
        showNotification('Harap atur link Google Sheet terlebih dahulu', 'warning');
        return;
    }

    const invData = {
        KODE: document.getElementById('invKode').value,
        TANGGAL: getCurrentDateTime(),
        TAMBAH: document.getElementById('invTambah').value,
        KURANG: 0,
        STOK: document.getElementById('invStok').value,
        NAMATRANSAKSI: 'TAMBAHSTOK',
        CATATAN: document.getElementById('invCatatan').value
    };

    try {
        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveInventory',
                data: invData
            })
        });

        showNotification('Data inventory berhasil disimpan', 'success');
        clearInventoryForm();
        document.getElementById('invKode').focus();

    } catch (error) {
        console.error('Error saving inventory:', error);
        showNotification('Gagal menyimpan data inventory', 'error');
    }
}

function clearInventoryForm() {
    document.getElementById('formInventory').reset();
    document.getElementById('invTanggal').value = getCurrentDateTime();
    currentStok = 0;
}

// Pengaturan Functions
function submitPengaturan(e) {
    e.preventDefault();
    
    const url = document.getElementById('settingLink').value;
    saveSettings(url);
    showNotification('Pengaturan berhasil disimpan', 'success');
    loadBarangData();
}

// Utility Functions
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.form-group')) {
        hideSuggestions('kode');
        hideSuggestions('nama');
    }
});
