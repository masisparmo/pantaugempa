# PANTAU GEMPA 🌍

Web aplikasi untuk memantau gempa berdasarkan BMKG dan USGS dengan real-time monitoring dan data historis gempa bumi.

## 📋 Fitur Utama

### 🗺️ Peta Interaktif
- **Peta Leaflet.js** yang responsif dengan zoom in/out
- **Marker dinamis** dengan warna berdasarkan magnitudo:
  - 🔵 **Biru** - Magnitudo < 4.5
  - 🟠 **Oranye** - Magnitudo 4.5 - 5.9
  - 🔴 **Merah** - Magnitudo ≥ 6.0
- **Sinkronisasi otomatis** antara peta dan tabel data
- **Tema gelap/terang** dengan basemap CARTO

### 📊 Dashboard & Analytics
- **Banner gempa terbaru global** dengan info real-time
- **Statistik area layar**:
  - Total data gempa terlihat di peta
  - Magnitudo tertinggi
  - Kedalaman maksimal
  - Waktu terbaru gempa di area
- **Grafik distribusi magnitudo** (Chart.js)

### 🔍 Filter & Pencarian Canggih
- **Sumber API**: 
  - USGS Global API (seluruh dunia)
  - BMKG Open Data (khusus Indonesia)
- **Filter Regional**:
  - Indonesia & Sekitarnya
  - Seluruh Dunia (Global)
  - Jepang, Filipina, Turki, Amerika Serikat
  - Area Peta Saat Ini (Custom Bounding Box)
- **Rentang Waktu**: 1 jam / 24 jam / 7 hari / 30 hari / 1 tahun / Custom
- **Magnitudo Slider** - filter berdasarkan magnitudo minimum
- **Pencarian Teks & Alias Wilayah** - dukungan keyword untuk wilayah-wilayah Indonesia (NTT, NTB, Bali, Jawa, Sumatra, Sulawesi, Maluku, Papua)

### 📋 Tabel Data
- **Sortir kolom**: Waktu, Magnitudo, Kedalaman
- **Info lengkap**: Waktu, Magnitudo, Kedalaman, Lokasi, Sumber
- **Fokus Peta** - tombol untuk memusatkan peta ke lokasi gempa
- **Export CSV** - download data gempa yang terlihat di area layar
- **Auto-update** - tabel tersinkronisasi otomatis dengan viewport peta

### 🎯 Smart Features
- **Tampilan Lempeng Tektonik & Sesar Aktif Indonesia** (GeoJSON overlay)
- **Auto Focus** pada region berdasarkan keyword pencarian
- **Pulse animation** untuk menandai gempa terbaru
- **Dark Mode** toggle
- **Refresh Real-time** button

## 🛠️ Teknologi

- **Frontend**: HTML5 + Tailwind CSS
- **Interaktif**: JavaScript (Fetch API, Vanilla JS)
- **Peta**: Leaflet.js v1.9.4
- **Visualisasi**: Chart.js
- **Icons**: FontAwesome
- **Styling**: Tailwind CSS CDN + custom CSS

## 📦 Data Source

- **USGS**: https://earthquake.usgs.gov/fdsnws/event/1/
- **BMKG**: https://data.bmkg.go.id/DataMKG/TEWS/

## 🚀 Cara Menjalankan
1. Aplikasi sudah di-deploy dan dapat diakses online: https://pantaugempa.isparmo.com
2. Atau jalankan lokal dari file `index.html` di browser (file statis cukup).
3. Jika ingin menggunakan server lokal, jalankan dari direktori proyek:
   - Python 3: `python -m http.server 8000`
   - Node (http-server): `npx http-server . -p 8000`
4. Akses http://localhost:8000 (jika menjalankan server lokal) atau buka https://pantaugempa.isparmo.com untuk versi yang dihosting.

## 🔄 Perubahan Terbaru
- Memperbarui `index.html` dengan penambahan fitur-fitur berikut:
  - Tombol toggle tema (Dark/Light) dan pembaruan basemap CARTO sesuai tema.
  - Peta interaktif Leaflet dengan marker dinamis, fit-to-bounds, dan sinkronisasi otomatis ke tabel.
  - Overlay lempeng tektonik global dan kumpulan sesar aktif Indonesia (GeoJSON) yang bisa diaktifkan.
  - Dukungan pemilihan sumber data (USGS / BMKG) dan opsi filter waktu, region, magnitudo, serta custom date range.
  - Tombol "Cari Gempa di Area Layar Ini" yang melakukan query berdasarkan bounding box peta.
  - Panel statistik (total, max magnitudo, kedalaman max, waktu terbaru) dan banner gempa terbaru.
  - Grafik distribusi magnitudo (doughnut) menggunakan Chart.js.
  - Ekspor data yang terlihat ke CSV.
  - Optimisasi performa: limit query USGS meningkat, parsing BMKG, deduplikasi data, dan sorting client-side.

Jika Anda ingin deskripsi fitur lebih rinci (contoh penggunaan, screenshot, atau guide untuk developer), beri tahu saya fitur mana yang perlu dijabarkan dan saya akan tambahkan.

## 🤝 Kontribusi

Saran dan laporan bug dapat dilakukan melalui GitHub Issues.

Panduan singkat:
1. Fork repo
2. Buat branch: `git checkout -b fitur-baru`
3. Commit perubahan
4. Buka Pull Request

## 📝 Lisensi

© 2026 Hak Cipta oleh [ISPARMO](https://page.isparmo.com)

Aplikasi ini menggunakan data publik dari:
- USGS Earthquake Hazards Program (https://earthquake.usgs.gov/)
- BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) (https://www.bmkg.go.id/)
