"""
Script Sinkronisasi Data Gunung Api PVMBG MAGMA Indonesia
Otomatis mengambil data tingkat aktivitas terkini dan menghasilkan data/gunung-api.json
"""

import urllib.request
import re
import json
import os
from datetime import datetime
from bs4 import BeautifulSoup

def clean_text(text):
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text).strip()

def extract_radius_km(rekomendasi_text):
    """Mendeteksi radius bahaya utama (dalam km) dari teks rekomendasi jika ada"""
    if not rekomendasi_text:
        return None
    matches = re.findall(r'radius\s+(?:sektoral\s+)?(\d+(?:[\.,]\d+)?)\s*km', rekomendasi_text, re.I)
    if matches:
        try:
            return float(matches[0].replace(',', '.'))
        except ValueError:
            pass
    # Alternatif: "sejauh x km"
    matches2 = re.findall(r'sejauh\s+(\d+(?:[\.,]\d+)?)\s*km', rekomendasi_text, re.I)
    if matches2:
        try:
            return float(matches2[0].replace(',', '.'))
        except ValueError:
            pass
    return None

def sync():
    print(f"[{datetime.now().isoformat()}] Memulai sinkronisasi data gunung api dari PVMBG MAGMA...")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_path = os.path.join(base_dir, 'data', 'volcanoes-master.json')
    out_path = os.path.join(base_dir, 'data', 'gunung-api.json')

    master_data = {}
    if os.path.exists(master_path):
        try:
            with open(master_path, 'r', encoding='utf-8') as f:
                master_data = json.load(f)
        except Exception as e:
            print(f"Peringatan: Gagal memuat master data: {e}")

    url = 'https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PantauGempaBot/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error mengambil halaman tingkat aktivitas: {e}")
        return False

    soup = BeautifulSoup(html, 'html.parser')
    table = soup.find('table')
    if not table:
        print("Error: Tabel tidak ditemukan pada halaman MAGMA.")
        return False

    current_level_num = 1
    current_status = "Normal"
    current_level_text = "Level I (Normal)"

    parsed_volcanoes = []
    stats = {
        "awas": 0,
        "siaga": 0,
        "waspada": 0,
        "normal": 0,
        "total": 0
    }

    rows = table.find_all('tr')
    for tr in rows:
        row_text = tr.get_text(separator=' ', strip=True)
        
        # Deteksi perubahan Level
        if 'Level IV (Awas)' in row_text:
            current_level_num = 4
            current_status = "Awas"
            current_level_text = "Level IV (Awas)"
        elif 'Level III (Siaga)' in row_text:
            current_level_num = 3
            current_status = "Siaga"
            current_level_text = "Level III (Siaga)"
        elif 'Level II (Waspada)' in row_text:
            current_level_num = 2
            current_status = "Waspada"
            current_level_text = "Level II (Waspada)"
        elif 'Level I (Normal)' in row_text:
            current_level_num = 1
            current_status = "Normal"
            current_level_text = "Level I (Normal)"

        for a in tr.find_all('a'):
            href = a.get('href', '')
            if 'laporan' in href:
                td_text = a.parent.get_text(separator=' ', strip=True).replace('Lihat laporan', '').strip()
                parts = [p.strip() for p in td_text.split(' - ', 1)]
                nama = parts[0]
                provinsi = parts[1] if len(parts) > 1 else ""

                volcano_entry = {
                    "id": re.sub(r'[^a-z0-9]+', '-', nama.lower()).strip('-'),
                    "nama": nama,
                    "provinsi": provinsi,
                    "level": current_level_num,
                    "status": current_status,
                    "level_text": current_level_text,
                    "report_url": href,
                    "lat": None,
                    "lon": None,
                    "elevasi": None,
                    "periode": None,
                    "rekomendasi": None,
                    "radius_bahaya_km": None
                }

                # Cek koordinat dari master data
                key = nama.lower()
                if key in master_data:
                    m = master_data[key]
                    volcano_entry["lat"] = m.get("lat")
                    volcano_entry["lon"] = m.get("lon")
                    volcano_entry["elevasi"] = m.get("elevasi")
                    if not volcano_entry["provinsi"] and m.get("provinsi"):
                        volcano_entry["provinsi"] = m["provinsi"]

                # Ambil detail laporan khusus yang statusnya Waspada/Siaga/Awas atau jika koordinat belum ada
                if current_level_num >= 2 or volcano_entry["lat"] is None:
                    try:
                        req_rep = urllib.request.Request(href, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PantauGempaBot/1.0'})
                        with urllib.request.urlopen(req_rep, timeout=15) as r_resp:
                            r_html = r_resp.read().decode('utf-8', errors='ignore')
                        
                        r_soup = BeautifulSoup(r_html, 'html.parser')

                        # Ekstrak koordinat jika belum ada
                        if volcano_entry["lat"] is None:
                            lat_m = re.search(r'Latitude\s+([-\d\.]+)', r_html, re.I)
                            lon_m = re.search(r'Longitude\s+([-\d\.]+)', r_html, re.I)
                            mdpl_m = re.search(r'ketinggian\s+(\d+)\s*mdpl', r_html, re.I)
                            if lat_m: volcano_entry["lat"] = float(lat_m.group(1))
                            if lon_m: volcano_entry["lon"] = float(lon_m.group(1))
                            if mdpl_m: volcano_entry["elevasi"] = int(mdpl_m.group(1))

                        # Ekstrak Periode Pengamatan yang bersih
                        per_m = re.search(r'([A-Za-z]+,\s+\d+\s+[A-Za-z]+\s+\d{4},\s+periode\s+[\d:\-]+\s+WI[BTA]+)', r_html, re.I)
                        if per_m:
                            volcano_entry["periode"] = clean_text(per_m.group(1))
                        else:
                            for elem in r_soup.find_all(['h5', 'div', 'p']):
                                txt = elem.get_text(strip=True)
                                if 'periode' in txt.lower() and ('wib' in txt.lower() or 'wita' in txt.lower() or 'wit' in txt.lower()) and len(txt) < 100:
                                    volcano_entry["periode"] = clean_text(txt)
                                    break

                        # Ekstrak Rekomendasi
                        rekomendasi_p = []
                        rec_heading = None
                        for h in r_soup.find_all(['h5', 'h6']):
                            if 'rekomendasi' in h.get_text(strip=True).lower():
                                rec_heading = h
                                break
                        
                        if rec_heading:
                            for sib in rec_heading.find_next_siblings(['p', 'div', 'ol', 'ul']):
                                text_sib = clean_text(sib.get_text())
                                if text_sib:
                                    rekomendasi_p.append(text_sib)
                                if len(rekomendasi_p) >= 3:
                                    break
                            
                            if rekomendasi_p:
                                full_rec = " ".join(rekomendasi_p)
                                volcano_entry["rekomendasi"] = full_rec[:500] + ("..." if len(full_rec) > 500 else "")
                                volcano_entry["radius_bahaya_km"] = extract_radius_km(full_rec)

                    except Exception as e:
                        print(f"Peringatan: Gagal mengambil detail untuk {nama}: {e}")

                # Tentukan default radius jika tidak terdeteksi dari teks rekomendasi
                if not volcano_entry["radius_bahaya_km"]:
                    if current_level_num == 4:
                        volcano_entry["radius_bahaya_km"] = 7.0
                    elif current_level_num == 3:
                        volcano_entry["radius_bahaya_km"] = 4.5
                    elif current_level_num == 2:
                        volcano_entry["radius_bahaya_km"] = 3.0
                    else:
                        volcano_entry["radius_bahaya_km"] = None

                parsed_volcanoes.append(volcano_entry)

                # Update statistik
                if current_level_num == 4: stats["awas"] += 1
                elif current_level_num == 3: stats["siaga"] += 1
                elif current_level_num == 2: stats["waspada"] += 1
                else: stats["normal"] += 1
                stats["total"] += 1

    # Urutkan berdasarkan level tertinggi terlebih dahulu (Level IV -> III -> II -> I)
    parsed_volcanoes.sort(key=lambda x: (x["level"], x["nama"]), reverse=True)

    output = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB"),
        "last_updated_iso": datetime.now().isoformat(),
        "source": "Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) - Badan Geologi Kementerian ESDM",
        "official_source_url": "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas",
        "statistics": stats,
        "volcanoes": parsed_volcanoes
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Sinkronisasi berhasil! Tersimpan di {out_path}")
    print(f"Statistik: {stats['total']} Gunung Api | Awas: {stats['awas']} | Siaga: {stats['siaga']} | Waspada: {stats['waspada']} | Normal: {stats['normal']}")
    return True

if __name__ == '__main__':
    sync()
