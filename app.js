// =============================================================
// LAB 2 - app.js (STARTER) - berjalan di BROWSER
// DOM + event + async/await.
// Memakai function dari nilai.js (hitung nilai) dan api.js (data),
// yang sudah dimuat lebih dulu oleh index.html.
//
// Kerjakan TODO sesuai urutan LANGKAH di "Sesi 2" (Langkah 3 - 7).
// Simpan file -> refresh browser (Cmd+R / Ctrl+R) -> cek Console (F12).
// =============================================================
// ---------- Sudah jadi: pilih elemen ----------
const tbody = document.querySelector('#tabel-body');
const form = document.querySelector('#form-mahasiswa');
const inputCari = document.querySelector('#cari');
const pesan = document.querySelector('#pesan');

let semuaData = [];   // hasil rekap (sudah ada nilaiAkhir, grade, lulus)

// =============================================================
// LANGKAH 3a: ambil data dari API (api.js)
// =============================================================
async function muatData() {
  try {
    // 1. Ambil data mentah mahasiswa dari API (pakai await karena prosesnya asynchronous)
    const daftar = await ambilMahasiswa();

    // 2. Olah data mentah jadi data rekap nilai dan simpan ke variabel global semuaData
    semuaData = buatRekap(daftar);

    // 3. Panggil fungsi tampilkan() yang udah disediain di bawahnya buat ngerender tabel & statistik
    tampilkan();
  } catch (err) {
    // Kalau ada error (misal server mati / koneksi putus), munculin pesan errornya
    tampilkanPesan(`Gagal memuat data: ${err.message}`, 'error');
  }
}

// Sudah jadi: menampilkan tabel (hasil pencarian) + statistik (seluruh data)
function tampilkan() {
  const hasilCari = cariMahasiswa(semuaData, inputCari.value);
  renderTabel(hasilCari);
  renderStatistik(semuaData);
}

// =============================================================
// LANGKAH 3b: tampilkan data ke tabel
// =============================================================
function renderTabel(data) {
  tbody.replaceChildren();   // kosongkan isi tabel

  // Cek dulu kalau data kosong, bikin 1 baris pesan lalu stop fungsi
  if (data.length === 0) {
    const trKosong = document.createElement('tr');
    const tdKosong = document.createElement('td');
    tdKosong.colSpan = 8;
    tdKosong.textContent = 'Tidak ada data';
    trKosong.append(tdKosong);
    tbody.append(trKosong);
    return;
  }

  // Loop setiap mahasiswa di dalam array data
  for (const m of data) {
    // 1. Buat elemen <tr> dan kasih class sesuai status kelulusan
    const tr = document.createElement('tr');
    // Catatan: sesuaikan m.lulus / m.status dengan properti dari fungsi buatRekap() di Lab 1
    const statusClass = m.lulus ? 'lulus' : 'tidak-lulus';
    tr.classList.add(statusClass);

    // 2. Looping 7 kolom nilai mahasiswa untuk dibuatkan <td>
    const kolomNilai = [m.nim, m.nama, m.tugas, m.uts, m.uas, m.nilaiAkhir, m.grade];
    for (const nilai of kolomNilai) {
      const td = document.createElement('td');
      td.textContent = nilai;
      tr.append(td);
    }

    // BONUS (Langkah 7): Kolom ke-8 berisi tombol Hapus
    const tdAksi = document.createElement('td');
    const btnHapus = document.createElement('button');
    btnHapus.className = 'btn-hapus';
    btnHapus.dataset.nim = m.nim;
    btnHapus.textContent = 'Hapus';
    tdAksi.append(btnHapus);
    tr.append(tdAksi);

    // 3. Masukkan baris <tr> yang udah lengkap ke dalam <tbody>
    tbody.append(tr);
  }
}

// =============================================================
// LANGKAH 4: statistik
// =============================================================
function renderStatistik(data) {
  // 1. Jumlah total mahasiswa
  document.querySelector('#stat-jumlah').textContent = data.length;

  // 2. Jumlah lulus dibanding total (contoh: "6/8")
  const jumlahLulus = data.filter(m => m.lulus).length;
  document.querySelector('#stat-lulus').textContent = `${jumlahLulus}/${data.length}`;

  // 3. Rata-rata nilai kelas (dibulatkan 2 angka di belakang koma kalau perlu, atau langsung)
  const rataRata = hitungRataRata(data);
  document.querySelector('#stat-rata').textContent = rataRata.toFixed(2); // bisa pakai rataRata aja kalau di nilai.js udah dibulatkan

  // 4. Mahasiswa nilai tertinggi (jaga-jaga kalau data kosong / null)
  const tertinggi = cariTertinggi(data);
  document.querySelector('#stat-tertinggi').textContent = tertinggi 
    ? `${tertinggi.nama} (${tertinggi.nilaiAkhir})` 
    : '-';

  // 5. Distribusi grade (contoh: "A: 1 · B: 3 · C: 2 · D: 1 · E: 1")
  const distribusi = hitungDistribusiGrade(data);
  document.querySelector('#stat-distribusi').textContent = Object.entries(distribusi)
    .map(([grade, jumlah]) => `${grade}: ${jumlah}`)
    .join(' · ');
}

// =============================================================
// LANGKAH 5: pencarian
// =============================================================
inputCari.addEventListener('input', () => {
  tampilkan();
});

// =============================================================
// LANGKAH 6: tambah mahasiswa
// =============================================================
form.addEventListener('submit', async (event) => {
  event.preventDefault();   // cegah reload halaman

  const f = new FormData(form);
  const baru = {
    nim: f.get('nim').trim(),
    nama: f.get('nama').trim(),
    tugas: f.get('tugas') === '' ? NaN : Number(f.get('tugas')),
    uts: f.get('uts') === '' ? NaN : Number(f.get('uts')),
    uas: f.get('uas') === '' ? NaN : Number(f.get('uas')),
  };

  // 1. Validasi data sebelum dikirim ke API
  const errors = validasiMahasiswa(baru);
  if (errors.length > 0) {
    tampilkanPesan(errors.join(', '), 'error');
    return;
  }

  // 2-4. Proses simpan ke API dibungkus try/catch
  try {
    const hasil = await tambahMahasiswa(baru);
    
    const [r] = buatRekap([hasil]);
    tampilkanPesan(`${r.nama} tersimpan: nilai ${r.nilaiAkhir} (${r.grade})`, 'sukses');
    
    form.reset();
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menyimpan: ${err.message}`, 'error');
  }
});

// =============================================================
// LANGKAH 7 (BONUS): hapus dengan event delegation
// =============================================================
tbody.addEventListener('click', async (event) => {
  // 1. Cek apakah yang diklik adalah tombol dengan class .btn-hapus
  const tombol = event.target.closest('.btn-hapus');
  if (!tombol) return;

  // 2. Ambil NIM dari atribut data-nim tombol tersebut
  const nim = tombol.dataset.nim;

  // 3. Minta konfirmasi user dulu sebelum hapus permanen
  if (!confirm(`Yakin ingin menghapus mahasiswa dengan NIM ${nim}?`)) return;

  // 4. Hapus lewat API dan perbarui tampilan
  try {
    const teks = await hapusMahasiswa(nim);
    tampilkanPesan(teks, 'sukses');
    await muatData();
  } catch (err) {
    tampilkanPesan(`Gagal menghapus: ${err.message}`, 'error');
  }
});

// ---------- Mulai ----------
muatData();
