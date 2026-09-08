# PANTAU GEMPA & GUNUNG BERAPI 🌋🌍

Aplikasi web interaktif modern untuk memantau aktivitas **Gunung Berapi di Indonesia** serta kejadian **Gempa Bumi** secara *real-time* maupun historis. Mengintegrasikan data terbuka (*Open Data*) resmi dari **PVMBG MAGMA Indonesia**, **BMKG**, dan **USGS**.

Aplikasi ini dapat diakses langsung secara online melalui: **[https://pantaugempa.isparmo.com](https://pantaugempa.isparmo.com)**

---

## 📋 Fitur Utama

### 🌋 1. Pemantauan Gunung Berapi Aktif (PVMBG MAGMA Indonesia)
- **Monitoring 69 Gunung Api Aktif di Seluruh Indonesia**: Memuat data resmi status terkini, ketinggian elevasi (mdpl), rekomendasi keselamatan sektoral, dan tautan laporan detail berkala.
- **Visualisasi Level Status & Radius Bahaya di Peta**:
  - 🔴 **Level IV (AWAS)**: Lingkaran radius bahaya kritis dengan animasi denyut (*pulsing animation*).
  - 🟠 **Level III (SIAGA)**: Lingkaran radius bahaya oranye tebal dan peringatan sektoral.
  - 🟡 **Level II (WASPADA)**: Lingkaran radius bahaya kuning waspada.
  - 🟢 **Level I (NORMAL)**: Ikon gunung hijau menandakan aktivitas dasar fluktuasi normal.
- **Popup Informasi Komprehensif**: Banner status & arti level resmi, estimasi radius bahaya sektoral, rekomendasi keselamatan, tanggal laporan, tombol fokus peta, tombol pembuka glosarium level, dan tombol langsung ke laporan PVMBG.
- **Tabel Khusus Gunung Berapi Berstatus Waspada / Siaga / Awas**:
  - **Filter Status Mandiri (*Individual Status Filter*)**: Tombol pill filter terpisah untuk **Semua**, **Awas**, **Siaga**, dan **Waspada** lengkap dengan *badge* hitungan dinamis.
  - **Pencarian Cepat**: Filter instan berdasarkan nama gunung atau provinsi.
  - **Kartu Statistik Terhubung (*Clickable Stats Cards*)**: Klik langsung pada kartu statistik Level IV, III, atau II untuk menyaring tabel secara cepat.
  - **Fokus Peta (*Center & Open Popup*)**: Tombol pada tabel yang langsung menggulirkan layar, memusatkan peta, dan membuka popup gunung api terkait.
  - **Ekspor Data Gunung Api ke CSV**: Unduh seluruh daftar gunung berapi aktif terfilter dalam satu klik.
- **Sinkronisasi Otomatis Berkala (GitHub Actions)**: Alur kerja otomatis tiap 24 jam untuk mengambil status terbaru dari PVMBG MAGMA Indonesia tanpa intervensi manual.

---

### 🗺️ 2. Peta Interaktif GIS (Leaflet.js)
- **Mode Layar Penuh (*Fullscreen Map*)**: Nikmati pengalaman visualisasi GIS luas dengan satu klik tombol atau tekan tombol `ESC`.
- **Basemap Terbuka & Gratis (Tanpa API Key)**:
  - **Mode Terang (*Light Mode*)**: Menggunakan **OpenStreetMap (OSM) Standard**.
  - **Mode Gelap (*Dark Mode*)**: Menggunakan **Esri World Dark Gray Base** yang elegan dan kontras tinggi.
- **Lapisan Lempeng Tektonik & Sesar Aktif**:
  - Garis batas lempeng tektonik global (**PB2002**).
  - Peta patahan sesar aktif geologi Indonesia bersumber dari Pusat Studi Gempa Nasional (**PuSGeN**).
- **Marker Gempa Dinamis**:
  - 🔵 **Biru** - Magnitudo < 4.5
  - 🟠 **Oranye** - Magnitudo 4.5 - 5.9
  - 🔴 **Merah** - Magnitudo ≥ 6.0
- **Sinkronisasi Otomatis Antara Peta & Tabel**: Menggeser (*pan*) atau memperbesar (*zoom*) peta secara otomatis memfilter data gempa pada tabel dan statistik di bawahnya.

---

### 📊 3. Dashboard, Statistik & Analisis Gempa
- **Banner Gempa Terkini**: Menampilkan kejadian gempa terbaru lengkap dengan magnitudo, kedalaman, waktu relatif (*time ago*), intensitas MMI (*Modified Mercalli Intensity*) atau CDI (*Did You Feel It?*).
- **Statistik Area Layar Peta**:
  - Total gempa di area pandang.
  - Magnitudo tertinggi di layar.
  - Kedalaman maksimal di layar.
  - Waktu gempa terbaru di area.
- **Grafik Distribusi Magnitudo (Chart.js)**: Diagram *doughnut* interaktif yang membagi kategori magnitudo (< 4.0, 4.0–4.9, 5.0–5.9, ≥ 6.0).

---

### 🔍 4. Filter & Pencarian Canggih Gempa
- **Multi-Sumber Data**:
  - **USGS Global API**: Kejadian gempa di seluruh penjuru dunia.
  - **BMKG Open Data**: Data gempa terbaru dan gempa dirasakan di Indonesia.
- **Filter Wilayah Geografis**:
  - Indonesia & Sekitarnya
  - Seluruh Dunia (Global)
  - Jepang, Filipina, Turki, Amerika Serikat
  - Bounding Box Peta Interaktif
- **Rentang Waktu**: 1 Jam Terakhir, 24 Jam, 7 Hari, 30 Hari, 1 Tahun, atau Rentang Tanggal Kustom.
- **Slider Magnitudo Minimum**: Atur magnitudo ambang batas dari M 0.0 s/d M 7.0+.
- **Pencarian Cerdas Alias Wilayah**: Otomatis mengenali kata kunci provinsi dan pulau di Indonesia (*NTT, NTB, Bali, Jawa Timur, Jawa Tengah, Jawa Barat, Sumatra, Sulawesi, Maluku, Papua*).
- **Ekspor Gempa ke CSV**: Unduh seluruh daftar gempa yang sedang terlihat di area layar.

---

### ℹ️ 5. Glosarium Edukasi & Bantuan (About Modal)
- Penjelasan lengkap arti 4 tingkatan aktivitas gunung api PVMBG:
  - **Level I (Normal)**: Aktivitas dasar, aman beraktivitas.
  - **Level II (Waspada)**: Peningkatan aktivitas seismik di atas normal.
  - **Level III (Siaga)**: Peningkatan nyata, erupsi awal dapat terjadi.
  - **Level IV (Awas)**: Letusan utama berlangsung atau segera terjadi, zona evakuasi wajib dipatuhi.
- Glosarium istilah gempa: Magnitudo, Kedalaman, Skala MMI, dan Sesar/Patahan (*Fault*).

---

## 🏗️ Struktur Arsitektur Proyek (Modular)

Proyek ini dibangun menggunakan arsitektur **Modular Vanilla JavaScript & CSS** tanpa ketergantungan pada *build tools* (Webpack, Vite, atau Node.js), sehingga sangat ringan, cepat dimuat, dan langsung kompatibel dengan hosting statis seperti GitHub Pages:

```text
Pantau Gempa/
├── index.html                    # Layout semantik HTML & kerangka tampilan (~679 baris)
├── css/
│   └── style.css                 # Styling kustom (Leaflet popup, scrollbar, fullscreen, tombol detail)
├── js/
│   ├── config.js                 # Konfigurasi tile map, alias wilayah Indonesia, batas geo & endpoint API
│   ├── utils.js                  # Sanitasi XSS (escapeHTML), konversi MMI Romawi, format waktu relatif
│   ├── state.js                  # Centralized state management (gempa, gunung api, filter, tema gelap)
│   ├── data.js                   # Komunikasi API (USGS, BMKG, PVMBG MAGMA) & ekspor CSV
│   ├── logic.js                  # Logika filter wilayah, magnitudo, sorting, dan filter viewport peta
│   ├── map.js                    # Leaflet GIS engine, layer lempeng/sesar, marker gempa & marker gunung api
│   ├── ui.js                     # Renderer tabel, grafik Chart.js, filter status gunung api & toast
│   └── app.js                    # Bootstrap inisialisasi aplikasi dan background auto-refresh timer
├── data/
│   ├── gunung-api.json           # Data lokal 69 gunung api aktif PVMBG MAGMA Indonesia
│   └── volcanoes-master.json     # Master koordinat dan metadata geografi gunung api
├── scripts/
│   ├── sync_volcanoes.py         # Skrip Python sinkronisasi data langsung dari PVMBG MAGMA Indonesia
│   └── build_master.py           # Utilitas penyusunan data master koordinat gunung api
└── .github/
    └── workflows/
        └── sync-volcano.yml      # Otomasi sinkronisasi data PVMBG harian via GitHub Actions
```

---

## 🛠️ Teknologi yang Digunakan

- **Markup & Layout**: HTML5 Semantik
- **Styling**: Vanilla CSS kustom + Tailwind CSS (via CDN)
- **Logika & Pemrograman**: Vanilla JavaScript (ES6+, tanpa bundler)
- **Peta Interaktif (GIS)**: Leaflet.js v1.9.4
- **Tile Map**: OpenStreetMap (Mode Terang) & Esri World Dark Gray (Mode Gelap)
- **Grafik & Visualisasi**: Chart.js v4.4.1
- **Ikonografi**: FontAwesome 6.4.0
- **Tipografi**: Google Fonts (Inter)
- **Otomasi Data Backend**: Python 3 (BeautifulSoup4) & GitHub Actions

---

## 📦 Sumber Data Resmi (*Open Data*)

1. **PVMBG (Pusat Vulkanologi dan Mitigasi Bencana Geologi)**: [https://magma.esdm.go.id](https://magma.esdm.go.id)
2. **BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)**: [https://data.bmkg.go.id](https://data.bmkg.go.id)
3. **USGS (United States Geological Survey)**: [https://earthquake.usgs.gov](https://earthquake.usgs.gov)
4. **PuSGeN (Pusat Studi Gempa Nasional)**: Peta Sumber dan Bahaya Gempa Indonesia

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/masisparmo/pantaugempa.git
   cd pantaugempa
   ```

2. **Jalankan server HTTP lokal**:
   - Menggunakan Python 3:
     ```bash
     python -m http.server 8080
     ```
   - Atau menggunakan Node.js / `http-server`:
     ```bash
     npx http-server . -p 8080
     ```

3. **Buka peramban**:
   Akses `http://localhost:8080` pada browser Anda.

---

## 🤝 Kontribusi

Kontribusi, kritik, dan saran untuk pengembangan aplikasi ini sangat disambut baik:
1. Fork repositori ini
2. Buat branch fitur baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan Anda (`git commit -m "Menambahkan fitur X"`)
4. Push ke branch (`git push origin fitur/nama-fitur`)
5. Ajukan **Pull Request**

---

## 📝 Lisensi & Hak Cipta

&copy; 2026 Hak Cipta oleh **[ISPARMO](https://page.isparmo.com)**.  
Dilindungi di bawah lisensi terbuka untuk tujuan edukasi, kesiapsiagaan bencana, dan keselamatan publik.
