let sheetUrl = localStorage.getItem('sheetUrl') || '';

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('d-none'));
    document.getElementById(screen).classList.remove('d-none');
}

function logout() {
    window.close();
}

function startScan() {
    Quagga.init({
        inputStream: { name: "Live", type: "LiveStream", target: document.body },
        decoder: { readers: ["code_128_reader", "ean_reader"] }
    }, function(err) {
        if (err) { console.log(err); return; }
        Quagga.start();
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            document.getElementById('kode').value = code;
            loadDataFromScan(code);
            Quagga.stop();
        });
    });
}

async function loadDataFromScan(kode) {
    const data = await fetchSheet('MBARANG', 'search', { key: kode, col: 0 });
    if (data.length > 0) {
        const row = data[0];
        document.getElementById('nama').value = row[1];
        document.getElementById('kelompok').value = row[2];
        document.getElementById('jenis').value = row[3];
        document.getElementById('warna').value = row[4];
        document.getElementById('ukuran').value = row[5];
        document.getElementById('catatan').value = row[6];
        document.getElementById('medsos').value = row[7];
        document.getElementById('photo').src = row[8];
    }
    const hargaData = await fetchSheet('MHARGA', 'search', { key: kode, col: 0 });
    if (hargaData.length > 0) {
        document.getElementById('hargajual').value = hargaData[hargaData.length - 1][6]; // HARGAJUAL terakhir
    }
}

function cancelTransaction() {
    document.getElementById('transactionForm').reset();
    document.getElementById('kode').focus();
}

async function processTransaction() {
    const kode = document.getElementById('kode').value;
    const stokData = await fetchSheet('MINV', 'search', { key: kode, col: 0 });
    let stok = 0;
    if (stokData.length > 0) {
        stok = stokData[stokData.length - 1][4] - 1; // STOK terakhir - 1
    }
    const row = [kode, new Date().toISOString(), '', 1, stok, 'BELI', ''];
    const result = await fetchSheet('MINV', 'write', { row });
    alert(result.status === 'success' ? 'Berhasil' : 'Gagal');
    cancelTransaction();
}

async function fetchSheet(sheet, action, params = {}) {
    const response = await fetch(sheetUrl, {
        method: 'POST',
        body: JSON.stringify({ sheet, action, ...params }),
        headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
}

// Form Handlers
document.getElementById('barangForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const kode = document.getElementById('bKode').value;
    const nama = document.getElementById('bNama').value;
    // ... ambil semua field
    const photoFile = document.getElementById('bPhoto').files[0];
    let photoBase64 = '';
    if (photoFile) {
        photoBase64 = await toBase64(photoFile);
    }
    const row = [kode, nama, /*...*/, new Date().toISOString(), photoBase64];
    const result = await