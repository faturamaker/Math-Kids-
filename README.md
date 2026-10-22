# Matematika Ceria

Aplikasi latihan matematika anak berbasis HTML, CSS, dan JavaScript dengan operasi pertambahan, pengurangan, perkalian, dan pembagian. Tidak memakai backend atau layanan eksternal. Pengaturan serta progres disimpan di browser menggunakan `localStorage`.

## Menjalankan di Windows

1. Pasang Node.js versi LTS dari [nodejs.org](https://nodejs.org/) untuk server lokal dan tes.
2. Buka PowerShell di folder proyek.
3. Jalankan `node server.js`, lalu buka `http://localhost:8080` di browser.
4. Di jendela PowerShell kedua, jalankan `node tests/game-logic.test.js`.

Membuka `index.html` dengan klik dua kali dapat menjalankan latihan, tetapi service worker dan pemasangan PWA memerlukan `localhost` atau HTTPS.

## Publikasi gratis dengan HTTPS

Anda dapat memakai GitHub Pages: buat repositori publik, unggah berkas proyek, lalu pilih **Settings → Pages → Deploy from a branch** dan pilih cabang serta folder publikasi. Paket GitHub Free mendukung Pages untuk repositori publik. GitHub Pages menyediakan HTTPS; jika tersedia, aktifkan **Enforce HTTPS** pada pengaturan Pages. Setelah publikasi, buka alamat situs dengan HTTPS untuk memasang service worker dan meng-cache aplikasi. [Panduan sumber publikasi](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [Panduan HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

## Tablet Android

1. Buka alamat HTTPS aplikasi di Chrome Android saat online. Tunggu hingga halaman tampil dan service worker selesai dipasang.
2. Pilih menu Chrome **⋮ → Instal aplikasi** atau **Tambahkan ke layar utama**. Teks menu dapat berbeda menurut versi Chrome.
3. Nyalakan mode pesawat, buka ikon aplikasi, dan cobalah beberapa soal. Pengaturan dan progres tersimpan pada browser/perangkat tersebut.

## Struktur proyek

- `index.html`, `styles.css`, `app.js`: tampilan dan interaksi.
- `game-logic.js`: pembangkitan soal untuk empat operasi, validasi, serta penyimpanan.
- `manifest.webmanifest`, `service-worker.js`, `icon.svg`, `icon-192.png`, `icon-512.png`: dukungan PWA dan cache offline.
- `tests/game-logic.test.js`: tes otomatis dengan Node.js.
