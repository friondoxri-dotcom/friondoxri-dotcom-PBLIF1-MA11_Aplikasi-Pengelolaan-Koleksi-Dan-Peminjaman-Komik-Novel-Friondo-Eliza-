// ===== Penyimpanan data di browser (localStorage) =====
// Catatan: untuk demo / tugas front-end. Data hanya ada di browser ini.

const DB = {
  get(kunci, awal) {
    try {
      const nilai = JSON.parse(localStorage.getItem(kunci));
      return nilai === null || nilai === undefined ? awal : nilai;
    } catch (e) {
      return awal;
    }
  },
  set(kunci, nilai) {
    try {
      localStorage.setItem(kunci, JSON.stringify(nilai));
      return true;
    } catch (e) {
      alert('Penyimpanan penuh. Hapus beberapa buku atau pakai gambar yang lebih kecil.');
      return false;
    }
  }
};

// ---------- Genre ----------
// Daftar genre dipakai di form admin dan filter Koleksi Buku.
// Ubah/tambah genre cukup di sini.
const DAFTAR_GENRE = [
  'Aksi', 'Petualangan', 'Komedi', 'Drama', 'Romantis', 'Fantasi',
  'Horor', 'Misteri', 'Fiksi Ilmiah', 'Slice of Life', 'Sejarah', 'Lainnya'
];

// ---------- Umum ----------
function el(tag, kelas, teks) {
  const e = document.createElement(tag);
  if (kelas) e.className = kelas;
  if (teks !== undefined) e.textContent = teks;
  return e;
}

function hariIni() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function tambahHari(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(y, m - 1, d + n);
  const p = x => String(x).padStart(2, '0');
  return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
}

function formatTanggal(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}

// ---------- Akun ----------
async function hashTeks(teks) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'plain:' + teks;
}

// Akun admin bawaan: username "admin", password "admin123"
async function seedAdmin() {
  const users = DB.get('users', []);
  if (!users.some(u => u.username === 'admin')) {
    users.push({
      nama: 'Administrator',
      username: 'admin',
      password: await hashTeks('admin123'),
      role: 'admin'
    });
    DB.set('users', users);
  }
}

function getSesi() {
  try { return JSON.parse(sessionStorage.getItem('sesi')); } catch (e) { return null; }
}

async function masuk(username, password, mode) {
  await seedAdmin();
  const users = DB.get('users', []);
  const nama = username.trim().toLowerCase();
  const u = users.find(x => x.username === nama);
  if (!u) return false;
  if (u.password !== await hashTeks(password)) return false;
  if (u.role !== mode) return false;
  sessionStorage.setItem('sesi', JSON.stringify({ username: u.username, nama: u.nama, role: u.role }));
  return true;
}

function keluar() {
  sessionStorage.removeItem('sesi');
  location.href = 'index.html';
}

function wajibAdmin() {
  const s = getSesi();
  if (!s || s.role !== 'admin') location.replace('login_admin.html');
}

// Pesan "silakan login" untuk halaman yang butuh login
function pesanLogin() {
  const box = el('div', 'alert alert-warning');
  box.appendChild(document.createTextNode('Silakan '));
  const a = el('a', 'alert-link', 'login');
  a.href = 'login.html';
  box.appendChild(a);
  box.appendChild(document.createTextNode(' terlebih dahulu untuk memakai fitur ini.'));
  return box;
}

// Navbar kanan: Login/Registrasi atau "Halo, nama" + Keluar
function renderAuthNav() {
  const box = document.getElementById('authNav');
  if (!box) return;
  box.textContent = '';
  const s = getSesi();

  if (s) {
    box.appendChild(el('span', 'text-body-secondary small', 'Halo, ' + s.nama));
    if (s.role === 'admin') {
      const kelola = el('a', 'btn btn-outline-primary');
      kelola.href = 'admin.html';
      kelola.appendChild(el('i', 'bi bi-gear me-1'));
      kelola.appendChild(document.createTextNode('Kelola Buku'));
      box.appendChild(kelola);
    }
    const btn = el('button', 'btn btn-outline-danger');
    btn.type = 'button';
    btn.appendChild(el('i', 'bi bi-box-arrow-right me-1'));
    btn.appendChild(document.createTextNode('Keluar'));
    btn.addEventListener('click', keluar);
    box.appendChild(btn);
  } else {
    const a1 = el('a', 'btn btn-outline-primary');
    a1.href = 'login.html';
    a1.appendChild(el('i', 'bi bi-box-arrow-in-right me-1'));
    a1.appendChild(document.createTextNode('Login'));
    const a2 = el('a', 'btn btn-primary');
    a2.href = 'registrasi.html';
    a2.appendChild(el('i', 'bi bi-person-plus me-1'));
    a2.appendChild(document.createTextNode('Registrasi'));
    box.append(a1, a2);
  }
}

// ---------- Gambar ----------
function kecilkanGambar(file, lebarMax) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const skala = Math.min(1, lebarMax / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * skala);
        c.height = Math.round(img.height * skala);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Buku ----------
function kartuBuku(b) {
  const kolom = el('div', 'col-6 col-md-4 col-xl-3');
  const kartu = el('div', 'card h-100 shadow-sm');

  if (b.sampul) {
    const img = el('img', 'card-img-top');
    img.style.cssText = 'width:100%;height:220px;object-fit:cover;';
    img.src = b.sampul;
    img.alt = 'Sampul ' + b.judul;
    kartu.appendChild(img);
  } else {
    const k = el('div', 'bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center');
    k.style.cssText = 'height:220px;font-size:3rem;';
    k.appendChild(el('i', 'bi bi-image'));
    kartu.appendChild(k);
  }

  const isi = el('div', 'card-body');
  const lencana = el('div', 'd-flex flex-wrap gap-1 mb-1');
  lencana.appendChild(el('span', 'badge ' + (b.jenis === 'Komik' ? 'text-bg-info' : 'text-bg-warning'), b.jenis));
  if (b.genre) lencana.appendChild(el('span', 'badge text-bg-light border', b.genre));
  isi.appendChild(lencana);
  isi.appendChild(el('h2', 'h6 mb-1', b.judul));
  isi.appendChild(el('p', 'small text-body-secondary mb-1', b.penulis));
  isi.appendChild(el('p', 'small mb-0', 'Stok: ' + b.stok));
  kartu.appendChild(isi);

  const kaki = el('div', 'card-footer bg-transparent border-0 pt-0');
  const pinjam = el('a', 'btn btn-sm w-100 ' + (b.stok > 0 ? 'btn-primary' : 'btn-secondary disabled'), b.stok > 0 ? 'Pinjam' : 'Stok habis');
  if (b.stok > 0) pinjam.href = 'Peminjaman.html?id=' + encodeURIComponent(b.id);
  kaki.appendChild(pinjam);
  kartu.appendChild(kaki);

  kolom.appendChild(kartu);
  return kolom;
}

// ---------- Peminjaman ----------
// Pengguna biasa melihat pinjamannya sendiri, admin melihat semua
function pinjamanTampil() {
  const s = getSesi();
  if (!s) return [];
  const semua = DB.get('pinjam', []);
  return s.role === 'admin' ? semua : semua.filter(p => p.username === s.username);
}

function terlambat(p) {
  return p.status === 'Dipinjam' && p.tglBatas < hariIni();
}

function pinjamBuku(bukuId, tglPinjam, tglBatas) {
  const s = getSesi();
  if (!s) return { ok: false, pesan: 'Silakan login terlebih dahulu.' };
  if (tglBatas < tglPinjam) return { ok: false, pesan: 'Tanggal kembali tidak boleh sebelum tanggal pinjam.' };

  const buku = DB.get('buku', []);
  const b = buku.find(x => String(x.id) === String(bukuId));
  if (!b) return { ok: false, pesan: 'Buku tidak ditemukan.' };
  if (b.stok < 1) return { ok: false, pesan: 'Stok buku habis.' };

  const pinjam = DB.get('pinjam', []);
  if (pinjam.some(p => p.username === s.username && p.bukuId === b.id && p.status === 'Dipinjam')) {
    return { ok: false, pesan: 'Anda masih meminjam buku ini. Kembalikan dahulu.' };
  }

  pinjam.unshift({
    id: Date.now(),
    bukuId: b.id,
    judul: b.judul,
    username: s.username,
    nama: s.nama,
    tglPinjam: tglPinjam,
    tglBatas: tglBatas,
    tglKembali: '',
    status: 'Dipinjam'
  });
  b.stok -= 1;

  if (!DB.set('pinjam', pinjam)) return { ok: false, pesan: 'Gagal menyimpan peminjaman.' };
  if (!DB.set('buku', buku)) return { ok: false, pesan: 'Gagal memperbarui stok.' };
  return { ok: true, pesan: 'Peminjaman berhasil.' };
}

function kembalikanBuku(idPinjam) {
  const pinjam = DB.get('pinjam', []);
  const p = pinjam.find(x => x.id === idPinjam);
  if (!p || p.status !== 'Dipinjam') return false;

  p.status = 'Dikembalikan';
  p.tglKembali = hariIni();
  DB.set('pinjam', pinjam);

  const buku = DB.get('buku', []);
  const b = buku.find(x => x.id === p.bukuId);
  if (b) {
    b.stok += 1;
    DB.set('buku', buku);
  }
  return true;
}

function badgeStatus(p) {
  if (p.status === 'Dikembalikan') return el('span', 'badge text-bg-success', 'Dikembalikan');
  if (terlambat(p)) return el('span', 'badge text-bg-danger', 'Terlambat');
  return el('span', 'badge text-bg-warning', 'Dipinjam');
}

function barisKosong(jumlahKolom, teks) {
  const tr = el('tr');
  const td = el('td', 'text-center text-body-secondary py-4', teks);
  td.colSpan = jumlahKolom;
  tr.appendChild(td);
  return tr;
}
