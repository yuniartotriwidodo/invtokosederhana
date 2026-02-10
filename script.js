// Global Variables
let googleSheetUrl = '';
let html5QrCode = null;
let barangData = [];
let currentStok = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    console.log('User agent:', navigator.userAgent);
    loadSettings();
    initializeEventListeners();
    initializeHargaForm();
    initializeInventoryForm();
    
    // Test button elements
    const btnScan = document.getElementById('btnScan');
    const menuToggle = document.getElementById('menuToggle');
    console.log('Scan button found:', !!btnScan);
    console.log('Menu toggle found:', !!menuToggle);
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
    // Menu Toggle - tambahkan touch event untuk mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        //Gunakan touchstart untuk mobile, click untuk desktop
        menuToggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        }, { passive: false });
        
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }
    
    // Navigation
    document.querySelectorAll('.side-menu nav a[data-page]').forEach(link => {
        link.addEventListener('touchstart', function(e) {
            e.preventDefault();
            showPage(this.dataset.page);
            closeMenu();
        }, { passive: false });
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.dataset.page);
            closeMenu();
        });
    });

    // Keluar Button
    const keluarBtn = document.getElementById('keluarBtn');
    if (keluarBtn) {
        keluarBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                window.close();
            }
        }, { passive: false });
        
        keluarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                window.close();
            }
        });
    }

    // Scan Button - tambahkan touch event untuk mobile
    const btnScan = document.getElementById('btnScan');
    if (btnScan) {
        btnScan.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Touch event on scan button');
            startScan();
        }, { passive: false });
        
        btnScan.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Click event on scan button');
            startScan();
        });
    }
    
    // Cancel Button
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('touchend', function(e) {
            e.preventDefault();
            cancelScan();
        }, { passive: false });
        
        btnCancel.addEventListener('click', function(e) {
            e.preventDefault();
            cancelScan();
        });
    }
    
    // Transaksi Button
    const btnTransaksi = document.getElementById('btnTransaksi');
    if (btnTransaksi) {
        btnTransaksi.addEventListener('touchend', function(e) {
            e.preventDefault();
            processTransaction();
        }, { passive: false });
        
        btnTransaksi.addEventListener('click', function(e) {
            e.preventDefault();
            processTransaction();
        });
    }

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
    const btnCamera = document.getElementById('btnCamera');
    if (btnCamera) {
        btnCamera.addEventListener('touchend', function(e) {
            e.preventDefault();
            openCamera();
        }, { passive: false });
        
        btnCamera.addEventListener('click', openCamera);
    }

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
    
    // Close menu when clicking/touching outside
    document.addEventListener('touchstart', function(e) {
        const sideMenu = document.getElementById('sideMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (sideMenu && menuToggle && 
            !sideMenu.contains(e.target) && 
            !menuToggle.contains(e.target) &&
            sideMenu.classList.contains('active')) {
            closeMenu();
        }
    });
    
    document.addEventListener('click', function(e) {
        const sideMenu = document.getElementById('sideMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (sideMenu && menuToggle && 
            !sideMenu.contains(e.target) && 
            !menuToggle.contains(e.target) &&
            sideMenu.classList.contains('active')) {
            closeMenu();
        }
    });
}

// Menu Functions
function toggleMenu() {
    console.log('Toggle menu called');
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        sideMenu.classList.toggle('active');
        console.log('Menu active:', sideMenu.classList.contains('active'));
    }
}

function closeMenu() {
    console.log('Close menu called');
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        sideMenu.classList.remove('active');
    }
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
    console.log('Starting scan...');
    const readerDiv = document.getElementById('reader');
    const btnScan = document.getElementById('btnScan');
    
    if (!readerDiv || !btnScan) {
        console.error('Reader div or button not found');
        return;
    }
    
    readerDiv.style.display = 'block';
    btnScan.style.display = 'none';

    if (!window.Html5Qrcode) {
        console.error('Html5Qrcode library not loaded');
        showNotification('Library QR Code tidak ditemukan', 'error');
        stopScanner();
        return;
    }

    html5QrCode = new Html5Qrcode("reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    // Try to start with back camera first
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
    ).catch(err => {
        console.error('Error starting scanner with back camera:', err);
        // Try with front camera
        html5QrCode.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            onScanError
        ).catch(err2 => {
            console.error('Error starting scanner with front camera:', err2);
            showNotification('Gagal membuka kamera. Pastikan izin kamera sudah diberikan.', 'error');
            stopScanner();
        });
    });
}

function onScanSuccess(decodedText) {
    console.log('Scan success:', decodedText);
    stopScanner();
    loadBarangByKode(decodedText);
}

function onScanError(error) {
    // Silent error handling - normal behavior during scanning
    // console.log('Scan error:', error);
}

function stopScanner() {
    console.log('Stopping scanner...');
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            console.log('Scanner stopped');
            const readerDiv = document.getElementById('reader');
            const btnScan = document.getElementById('btnScan');
            if (readerDiv) readerDiv.style.display = 'none';
            if (btnScan) btnScan.style.display = 'flex';
            html5QrCode = null;
        }).catch(err => {
            console.error('Error stopping scanner:', err);
            const readerDiv = document.getElementById('reader');
            const btnScan = document.getElementById('btnScan');
            if (readerDiv) readerDiv.style.display = 'none';
            if (btnScan) btnScan.style.display = 'flex';
            html5QrCode = null;
        });
    } else {
        const readerDiv = document.getElementById('reader');
        const btnScan = document.getElementById('btnScan');
        if (readerDiv) readerDiv.style.display = 'none';
        if (btnScan) btnScan.style.display = 'flex';
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
