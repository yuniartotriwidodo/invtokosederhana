const state = { baseUrl: "", barangList: [], lastStokByKode: {}, mediaStream: null, scanLoopId: null };
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
function showToast(msg, ok = true) { const t = qs("#toast"); t.textContent = msg; t.style.background = ok ? "#124077" : "#dc2626"; t.classList.remove("hidden"); setTimeout(() => t.classList.add("hidden"), 2500); }
function nowStr() { const d = new Date(); const pad = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function setActiveView(name) { qsa(".view").forEach(v => v.classList.remove("active")); qs(`#view-${name}`).classList.add("active"); qs("#menuPanel").classList.remove("open"); }
function readSettingTxt() { return fetch("setting.txt").then(r => r.ok ? r.text() : "").catch(()=>""); }
function applySettings(url) { state.baseUrl = url || ""; if (state.baseUrl) localStorage.setItem("baseUrl", state.baseUrl); }
function saveSettingsFile(url) { const blob = new Blob([url||""], {type:"text/plain"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "setting.txt"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
async function initSettings() { let u = await readSettingTxt(); if (!u) u = localStorage.getItem("baseUrl") || ""; applySettings(u); }
async function apiGet(params) { const q = new URLSearchParams(params).toString(); const u = `${state.baseUrl}?${q}`; const r = await fetch(u, { method: "GET" }); if (!r.ok) throw new Error("Gagal koneksi"); return r.json(); }
async function apiPost(action, data) { const r = await fetch(state.baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) }); if (!r.ok) throw new Error("Gagal koneksi"); return r.json(); }
async function loadBarangList() { if (!state.baseUrl) return; const res = await apiGet({ action: "listBarang" }); state.barangList = res.items || []; fillKodeDropdowns(); }
function fillKodeDropdowns() { const opts = state.barangList.map(it => `<option value="${it.KODE}">${it.KODE} - ${it.NAMA}</option>`).join(""); qs("#hg-kode").innerHTML = `<option value="">Pilih Kode</option>` + opts; qs("#iv-kode").innerHTML = `<option value="">Pilih Kode</option>` + opts; }
function buildSuggest(containerId, items, onPick) { const c = qs(containerId); c.innerHTML = ""; if (!items.length) return; const box = document.createElement("div"); box.className = "suggest-list"; items.slice(0,8).forEach(it => { const el = document.createElement("div"); el.className = "suggest-item"; el.textContent = `${it.KODE} - ${it.NAMA}`; el.addEventListener("click", () => { onPick(it); box.remove(); }); box.appendChild(el); }); c.appendChild(box); }
function fileToDataURL(file) { return new Promise((resolve,reject)=>{ const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = reject; fr.readAsDataURL(file); }); }
async function handleBarangSuggest() { const k = qs("#bg-kode").value.trim(); const n = qs("#bg-nama").value.trim(); if (!state.baseUrl) return; if (k) { const r = await apiGet({ action: "searchSimilar", type: "KODE", q: k }); buildSuggest("#bg-kode-suggest", r.items || [], (it) => fillBarangForm(it)); } else qs("#bg-kode-suggest").innerHTML=""; if (n) { const r2 = await apiGet({ action: "searchSimilar", type: "NAMA", q: n }); buildSuggest("#bg-nama-suggest", r2.items || [], (it) => fillBarangForm(it)); } else qs("#bg-nama-suggest").innerHTML=""; if (k && n) { const r3 = await apiGet({ action: "getBarang", kode: k, nama: n }); if (r3.item) fillBarangForm(r3.item); } }
function fillBarangForm(it) { qs("#bg-kode").value = it.KODE||""; qs("#bg-nama").value = it.NAMA||""; qs("#bg-kelompok").value = it.KELOMPOK||""; qs("#bg-jenis").value = it.JENIS||""; qs("#bg-warna").value = it.WARNA||""; qs("#bg-ukuran").value = it.UKURAN||""; qs("#bg-catatan").value = it.CATATAN||""; qs("#bg-medsos").value = it.MEDSOS||""; }
async function simpanBarang() { const kode = qs("#bg-kode").value.trim(); const nama = qs("#bg-nama").value.trim(); if (!kode || !nama) { showToast("KODE dan NAMA harus diisi", false); qs("#bg-kode").focus(); return; } let photo = ""; const f = qs("#bg-photo").files[0]; if (f) photo = await fileToDataURL(f); const payload = { TANGGAL: nowStr(), KODE: kode, NAMA: nama, KELOMPOK: qs("#bg-kelompok").value.trim(), JENIS: qs("#bg-jenis").value.trim(), WARNA: qs("#bg-warna").value.trim(), UKURAN: qs("#bg-ukuran").value.trim(), CATATAN: qs("#bg-catatan").value.trim(), MEDSOS: qs("#bg-medsos").value.trim(), PHOTO: photo }; try { const res = await apiPost("saveBarang", payload); if (res.ok) { showToast("Data Barang tersimpan"); qs("#barangForm").reset(); qs("#bg-kode").focus(); await loadBarangList(); } else showToast(res.message||"Gagal simpan", false); } catch(e){ showToast("Gagal simpan", false); } }
function updateHargaJual() { const dasar = parseFloat(qs("#hg-hargadasar").value||"0"); const diskon = parseFloat(qs("#hg-diskon").value||"0"); const pajak = parseFloat(qs("#hg-pajak").value||"0"); const margin = parseFloat(qs("#hg-margin").value||"0"); const hj = dasar + (margin*dasar/100) - (diskon*dasar/100) - (pajak*dasar/100); qs("#hg-hargajual").value = hj.toFixed(2); }
async function simpanHarga() { const kode = qs("#hg-kode").value; if (!kode) { showToast("Pilih KODE", false); qs("#hg-kode").focus(); return; } const payload = { TANGGAL: nowStr(), KODE: kode, HARGADASAR: parseFloat(qs("#hg-hargadasar").value||"0"), DISKON: parseFloat(qs("#hg-diskon").value||"0"), PAJAK: parseFloat(qs("#hg-pajak").value||"0"), MARGIN: parseFloat(qs("#hg-margin").value||"0"), HARGAJUAL: parseFloat(qs("#hg-hargajual").value||"0"), CATATAN: qs("#hg-catatan").value.trim() }; try { const res = await apiPost("saveHarga", payload); if (res.ok) { showToast("Data Harga tersimpan"); qs("#hargaForm").reset(); qs("#hg-tanggal").value = nowStr(); qs("#hg-kode").focus(); } else showToast(res.message||"Gagal simpan", false); } catch(e){ showToast("Gagal simpan", false); } }
async function onIvKodeChange() { const kode = qs("#iv-kode").value; if (!kode) return; try { const r = await apiGet({ action: "getInvLast", kode }); const last = r.item && typeof r.item.STOK !== "undefined" ? parseFloat(r.item.STOK) : 0; state.lastStokByKode[kode] = last; const tambah = parseFloat(qs("#iv-tambah").value||"0"); qs("#iv-stok").value = (last + tambah).toString(); } catch(e){} }
function onIvTambahChange() { const kode = qs("#iv-kode").value; const last = state.lastStokByKode[kode] || 0; const tambah = parseFloat(qs("#iv-tambah").value||"0"); qs("#iv-stok").value = (last + tambah).toString(); }
async function simpanInventory() { const kode = qs("#iv-kode").value; if (!kode) { showToast("Pilih KODE", false); qs("#iv-kode").focus(); return; } const tambah = parseFloat(qs("#iv-tambah").value||"0"); const stok = parseFloat(qs("#iv-stok").value||"0"); const payload = { TANGGAL: nowStr(), KODE: kode, TAMBAH: tambah, KURANG: 0, STOK: stok, NAMATRANSAKSI: qs("#iv-namatrx").value || "TAMBAHSTOK", CATATAN: qs("#iv-catatan").value.trim() }; try { const res = await apiPost("saveInv", payload); if (res.ok) { showToast("Inventory tersimpan"); qs("#inventoryForm").reset(); qs("#iv-kurang").value = ""; qs("#iv-tanggal").value = nowStr(); qs("#iv-kode").focus(); } else showToast(res.message||"Gagal simpan", false); } catch(e){ showToast("Gagal simpan", false); } }
function resetBeranda() { qs("#berandaForm").reset(); qs("#br-hargajual").value = ""; qs("#scannerContainer").classList.add("hidden"); qs("#scanButton").focus(); }
async function transaksiBeranda() { const kode = qs("#br-kode").value.trim(); if (!kode) { showToast("KODE kosong", false); return; } try { const r = await apiGet({ action: "getInvLast", kode }); const last = r.item && typeof r.item.STOK !== "undefined" ? parseFloat(r.item.STOK) : 0; const payload = { TANGGAL: nowStr(), KODE: kode, TAMBAH: "", KURANG: 1, STOK: last - 1, NAMATRANSAKSI: "BELI", CATATAN: "" }; const res = await apiPost("saveInv", payload); if (res.ok) { showToast("Transaksi tersimpan"); resetBeranda(); } else showToast(res.message||"Gagal simpan transaksi", false); } catch(e){ showToast("Gagal simpan transaksi", false); } }
async function fillBerandaByKode(kode) { qs("#br-kode").value = kode; try { const r = await apiGet({ action: "getBarangByKode", kode }); if (r.item) { qs("#br-nama").value = r.item.NAMA||""; qs("#br-kelompok").value = r.item.KELOMPOK||""; qs("#br-jenis").value = r.item.JENIS||""; qs("#br-warna").value = r.item.WARNA||""; qs("#br-ukuran").value = r.item.UKURAN||""; qs("#br-catatan").value = r.item.CATATAN||""; } const r2 = await apiGet({ action: "getHargaByKode", kode }); if (r2.item) qs("#br-hargajual").value = r2.item.HARGAJUAL; } catch(e){} }
function canUseCamera(){ return location.protocol==="https:" || ["localhost","127.0.0.1"].includes(location.hostname); }
async function decodeImageWithBarcodeDetector(imgEl){
  try {
    const formats = ["code_128","ean_13","ean_8","code_39","upc_a","upc_e"];
    const det = new window.BarcodeDetector({formats});
    const res = await det.detect(imgEl);
    if (res && res.length) return res[0].rawValue || res[0].value || "";
  } catch(e){}
  return "";
}
async function decodeImageWithQuagga(dataURL){
  return new Promise((resolve)=> {
    Quagga.decodeSingle({
      src: dataURL,
      numOfWorkers: 0,
      inputStream: { size: 800 },
      decoder: { readers: ["code_128_reader","ean_reader","ean_8_reader","code_39_reader","upc_reader","upc_e_reader"] }
    }, (result) => {
      if (result && result.codeResult) resolve(result.codeResult.code);
      else resolve("");
    });
  });
}
function triggerImageScan(){
  const input = qs("#br-photo");
  const handler = async () => {
    input.removeEventListener("change", handler);
    const f = input.files[0];
    if (!f) return;
    const dataURL = await fileToDataURL(f);
    let code = "";
    if (window.BarcodeDetector) {
      const img = new Image();
      img.src = dataURL;
      await new Promise(r => img.onload = r);
      code = await decodeImageWithBarcodeDetector(img);
    }
    if (!code) code = await decodeImageWithQuagga(dataURL);
    if (code) {
      fillBerandaByKode(code);
      showToast("Scan dari gambar berhasil");
    } else {
      showToast("Tidak bisa membaca barcode dari gambar", false);
    }
  };
  input.addEventListener("change", handler);
  input.click();
}
function startScan() {
  const container = qs("#scannerContainer");
  const video = qs("#scannerVideo");
  if (!canUseCamera()) {
    showToast("Kamera memerlukan HTTPS. Gunakan Foto untuk scan.", false);
    triggerImageScan();
    return;
  }
  container.classList.remove("hidden");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    if (window.BarcodeDetector) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(async (stream) => {
        state.mediaStream = stream;
        video.srcObject = stream;
        await video.play();
        const det = new window.BarcodeDetector({ formats: ["code_128","ean_13","ean_8","code_39","upc_a","upc_e"] });
        const loop = async () => {
          try {
            const res = await det.detect(video);
            if (res && res.length) {
              const code = res[0].rawValue || res[0].value || "";
              stopScan();
              container.classList.add("hidden");
              if (code) { fillBerandaByKode(code); showToast("Scan berhasil"); return; }
            }
          } catch(e){}
          state.scanLoopId = requestAnimationFrame(loop);
        };
        state.scanLoopId = requestAnimationFrame(loop);
      }).catch(() => {
        showToast("Akses kamera ditolak/gagal", false);
        container.classList.add("hidden");
      });
    } else {
      Quagga.init({
        inputStream: { type: "LiveStream", target: video, constraints: { facingMode: "environment" } },
        decoder: { readers: ["code_128_reader","ean_reader","ean_8_reader","code_39_reader","upc_reader","upc_e_reader"] }
      }, (err) => {
        if (err) { showToast("Scanner gagal", false); container.classList.add("hidden"); return; }
        Quagga.start();
      });
      Quagga.onDetected(d => {
        const code = d.codeResult && d.codeResult.code;
        if (code) {
          try { Quagga.stop(); } catch(e){}
          container.classList.add("hidden");
          fillBerandaByKode(code);
          showToast("Scan berhasil");
        }
      });
    }
  } else {
    showToast("Kamera tidak tersedia", false);
    container.classList.add("hidden");
  }
}
function stopScan() {
  if (state.scanLoopId) { cancelAnimationFrame(state.scanLoopId); state.scanLoopId = null; }
  if (state.mediaStream) { try { state.mediaStream.getTracks().forEach(t=>t.stop()); } catch(e){} state.mediaStream = null; }
  try { Quagga.stop(); } catch(e){}
  qs("#scannerContainer").classList.add("hidden");
}
function bindEvents() { qs("#menuButton").addEventListener("click", () => qs("#menuPanel").classList.toggle("open")); qsa(".menu-item").forEach(b => { b.addEventListener("click", () => { const v = b.dataset.view; if (v) setActiveView(v); }); }); qs("#keluarApp").addEventListener("click", () => { window.close(); }); qs("#simpanPengaturan").addEventListener("click", async () => { const url = qs("#set-link").value.trim(); if (!url) { showToast("Isi link Web App", false); return; } applySettings(url); saveSettingsFile(url); showToast("Pengaturan diperbarui"); await loadBarangList(); }); qs("#bg-kode").addEventListener("input", handleBarangSuggest); qs("#bg-nama").addEventListener("input", handleBarangSuggest); qs("#simpanBarang").addEventListener("click", simpanBarang); qs("#hg-tanggal").value = nowStr(); ["hg-hargadasar","hg-diskon","hg-pajak","hg-margin"].forEach(id => qs("#"+id).addEventListener("input", updateHargaJual)); qs("#simpanHarga").addEventListener("click", simpanHarga); qs("#iv-tanggal").value = nowStr(); qs("#iv-kurang").value = ""; qs("#iv-kode").addEventListener("change", onIvKodeChange); qs("#iv-tambah").addEventListener("input", onIvTambahChange); qs("#simpanInventory").addEventListener("click", simpanInventory); qs("#scanButton").addEventListener("click", startScan); qs("#stopScan").addEventListener("click", stopScan); qs("#cancelBeranda").addEventListener("click", () => { resetBeranda(); }); qs("#transaksiBeranda").addEventListener("click", transaksiBeranda); }
async function init() { await initSettings(); bindEvents(); await loadBarangList(); }
document.addEventListener("DOMContentLoaded", init);
