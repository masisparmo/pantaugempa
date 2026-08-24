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
- **Tema gelap/terang** yang mendukung CARTO basemap

### 📊 Dashboard & Analytics
- **Banner gempa terbaru global** dengan info real-time
- **Statistik area layar**:
  - Total data gempa terlihat di peta
  - Magnitudo tertinggi
  - Kedalaman maksimal
  - Waktu terbaru gempa di area
- **Grafik distribusi magnitudo** (Pie/Doughnut Chart)

### 🔍 Filter & Pencarian Canggih
- **Sumber API**: 
  - USGS Global API (seluruh dunia)
  - BMKG API (khusus Indonesia)
- **Filter Regional**:
  - Indonesia & Sekitarnya
  - Seluruh Dunia (Global)
  - Jepang, Filipina, Turki, Amerika Serikat
  - Area Peta Saat Ini (custom bounding box)
- **Rentang Waktu**:
  - 1 Jam terakhir
  - 24 Jam terakhir
  - 7 Hari terakhir
  - 30 Hari terakhir
  - Custom tanggal
- **Magnitudo Slider** - Filter berdasarkan magnitudo minimum
- **Pencarian Teks** - Cari berdasarkan nama wilayah/lokasi

### 📋 Tabel Data
- **Sortir kolom**: Waktu, Magnitudo, Kedalaman
- **Info lengkap**: Waktu, Magnitudo, Kedalaman, Lokasi, Sumber
- **Fokus Peta** - Button untuk memusatkan peta pada lokasi gempa
- **Export CSV** - Download data gempa yang terlihat
- **Auto-update** - Tabel sinkron dengan viewport peta

### 🎯 Smart Features
- **Intelligent Search** - Database wilayah Indonesia dengan keywords untuk 10+ daerah:
  - Nusa Tenggara Timur, Nusa Tenggara Barat
  - Bali, Jawa Timur, Jawa Tengah, Jawa Barat
  - Sumatra, Sulawesi, Maluku, Papua
- **Auto Focus** - Otomatis fokus ke region saat pencarian
- **Dark Mode** - Toggle tema gelap/terang
- **Refresh Real-time** - Button untuk muat ulang data manual

## 🛠️ Teknologi

- **Frontend**: HTML5 + Tailwind CSS
- **Interaktif**: JavaScript vanilla (Fetch API)
- **Peta**: Leaflet.js v1.9.4
- **Visualisasi**: Chart.js
- **Icons**: FontAwesome 6.4.0
- **Styling**: Tailwind CSS CDN + Custom CSS
- **Responsive**: Mobile-first design

## 📦 Data Source

- **USGS**: [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)
- **BMKG**: [BMKG Open Data](https://data.bmkg.go.id/DataMKG/TEWS/)

## 🚀 Cara Menggunakan

1. Buka file `index.html` di browser
2. Aplikasi akan otomatis memuat data gempa terbaru dari USGS (7 hari terakhir, Indonesia)
3. Gunakan filter untuk:
   - Mengubah sumber API (USGS/BMKG)
   - Memilih region geografis
   - Mengatur rentang waktu
   - Filter berdasarkan magnitudo
   - Mencari lokasi spesifik
4. Klik pada gempa di peta atau tabel untuk detail lebih lanjut
5. Zoom in/out peta untuk melihat area spesifik
6. Export data ke CSV jika diperlukan

## 🎨 Interface Layout

```
┌─────────────────────────────────────────────────┐
│  Header (Logo, Theme Toggle, Refresh)          │
├─────────────────────────────────────────────────┤
│  Latest Earthquake Banner                       │
├───────────────────────────────��─────────────────┤
│  Stats Cards (Total, Max Mag, Max Depth, Time) │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────┬─────────────┐ │
│  │  Interactive Map             │  Filters    │ │
│  │  (Leaflet)                   │  & Search   │ │
│  └──────────────────────────────┴─────────────┘ │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────┬─────────────┐ │
│  │  Earthquake Data Table       │  Magnitude  │ │
│  │  (Sortable, Searchable)      │  Chart      │ │
│  └──────────────────────────────┴─────────────┘ │
├─────────────────────────────────────────────────┤
│  Footer & Attribution                           │
└─────────────────────────────────────────────────┘
```

## ⚙️ Fitur Teknis

- **Real-time Sync**: Tabel dan grafik ter-sinkronisasi dengan viewport peta
- **Bounding Box Query**: Otomatis cari gempa di area yang sedang dilihat
- **Custom Scrollbar**: Styling scroll bar tabel yang elegan
- **Pulse Animation**: Animasi marker untuk gempa terbaru
- **Responsive Design**: Optimal di desktop, tablet, dan mobile
- **Dark Mode Support**: Semua elemen mendukung tema gelap
- **Pulsating Indicator**: Indikator status API yang aktif

## 📱 Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 📝 Lisensi

© 2026 Hak Cipta oleh [ISPARMO](https://page.isparmo.com)

Aplikasi ini menggunakan data publik dari:
- [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/)
- [BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)](https://www.bmkg.go.id/)

## 🤝 Kontribusi

Saran dan laporan bug dapat dilakukan melalui GitHub Issues.

---

**Catatan**: Aplikasi ini dirancang untuk monitoring dan edukasi gempa bumi. Untuk informasi resmi dan peringatan gempa, selalu merujuk ke sumber resmi BMKG dan USGS.
