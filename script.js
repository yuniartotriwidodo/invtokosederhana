let sheetUrl = localStorage.getItem('sheetUrl') || '';

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('d-none'));
    document.getElementById(screen).classList.remove('d-none');
    if (screen === 'harga') loadKodeDropdown('hKode');
    if (screen === 'inventory') loadKodeDropdown('iKode');
}

function logout() {
    if (confirm('Keluar dari aplikasi?')) {
        window.close();
    }
}

async function startScan() {
    try {
        console.log('Starting scan...');
        Quagga.init({
            inputStream: { name: "Live", type: "LiveStream", target: document.body, constraints: { facingMode: "environment" } },
            decoder: { readers: ["code_128_reader", "ean_reader"] }
        }, function(err) {
            if (err) {
                console.error('Quagga init error:', err);
                alert('Error initializing camera. Pastikan izin kamera diberikan.');
                return;
            }
            Quagga.start();
            console.log('Quagga started');
        });
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            console.log('Detected code:', code);
            document.getElementById('kode').value = code;
            loadDataFromScan(code);
            Quagga.stop();
        });
    } catch (error) {
        console.error('Scan error:', error);
        alert('Gagal memulai scan. Coba lagi.');
    }
}

async function loadDataFromScan(kode) {
    try {
        const data = await fetchSheet('MBARANG', 'search', { key: kode, col: 0 });
        if (data && data.length > 0) {
            const row = data[0];
            document.getElementById('nama').value = row[1] || '';
            document.getElementById('kelompok').value = row[2] || '';
            document.getElementById('jenis').value = row[3] || '';
            document.getElementById('warna').value = row[4] || '';
            document.getElementById('ukuran').value = row[5] || '';
            document.getElementById('catatan').value = row[6] || '';
            document.getElementById('medsos').value = row[7] || '';
            document.getElementById('photo').src = row[8] || '';
        }
        const hargaData = await fetchSheet('MHARGA', 'search', { key: kode, col: 0 });
        if (hargaData && hargaData.length > 0) {
            document.getElementById('hargajual').value = hargaData[hargaData.length - 1][6] || '';
        }
    } catch (error) {
        console.error('Load data error:', error);
        alert('Gagal memuat data.');
    }
}

function cancelTransaction() {
    document.getElementById('transactionForm').reset();
    document.getElementById('kode').focus();
}

async function processTransaction() {
    try {
        const kode = document.getElementById('kode').value;
        const stokData = await fetchSheet('MINV', 'search', { key: kode, col: 0 });
        let stok = 0;
        if (stokData && stokData.length > 0) {
            stok = (stokData[stokData.length - 1][4] || 0) - 1;
        }
        const row = [kode, new Date().toISOString(), '', 1, stok, 'BELI', ''];
        const result = await fetchSheet('MINV', 'write', { row });
        alert(result && result.status === 'success' ? 'Transaksi berhasil' : 'Transaksi gagal');
        cancelTransaction();
    } catch (error) {
        console.error('Transaction error:', error);
        alert('Gagal memproses transaksi.');
    }
}

async function fetchSheet(sheet, action, params = {}) {
    if (!sheetUrl) {
        alert('Link Google Sheets belum diatur. Pergi ke Pengaturan.');
        return null;
    }
    try {
        const response = await fetch(sheetUrl, {
            method: 'POST',
            body: JSON.stringify({ sheet, action, ...params }),
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Gagal mengakses Google Sheets.');
        return null;
    }
}

async function loadKodeDropdown(id) {
    const data = await fetchSheet('MBARANG', 'read');
    if (data) {
        const select = document.getElementById(id);
        select.innerHTML = '<option>Pilih KODE</option>';
        data.slice(1).forEach(row => { // Skip header
            const option = document.createElement('option');
            option.value = row[0];
            option.text = `${row[0]} - ${row[1]}`;
            select.appendChild(option);
        });
    }
}

async function searchSimilar(inputId, sheet, col) {
    const value = document.getElementById(inputId).value;
    if (value.length < 2) return;
    const data = await fetchSheet(sheet, 'read');
    if (data) {
        const matches = data.filter(row => row[col] && row[col].toLowerCase().includes(value.toLowerCase()));
        // For simplicity, just log; you can implement autocomplete
        console.log('Similar:', matches);
    }
}

function calculateHargaJual() {
    const dasar = parseFloat