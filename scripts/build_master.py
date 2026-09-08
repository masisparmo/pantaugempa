import urllib.request
import re
from bs4 import BeautifulSoup
import json
import time

print("Mulai mengumpulkan master data koordinat gunung api dari PVMBG MAGMA...")

url = 'https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, timeout=20) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')
table = soup.find('table')
entries = []

for a in table.find_all('a'):
    href = a.get('href', '')
    if 'laporan' in href:
        full_text = a.parent.get_text(separator=' ', strip=True).replace('Lihat laporan', '').strip()
        parts = [p.strip() for p in full_text.split(' - ', 1)]
        nama = parts[0]
        provinsi = parts[1] if len(parts) > 1 else ''
        entries.append({
            'nama': nama,
            'provinsi': provinsi,
            'report_url': href
        })

print(f"Ditemukan {len(entries)} gunung api termonitor.")

master_data = {}

for idx, item in enumerate(entries):
    nama = item['nama']
    print(f"[{idx+1}/{len(entries)}] Mengambil koordinat {nama}...")
    try:
        req_rep = urllib.request.Request(item['report_url'], headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req_rep, timeout=15) as r_resp:
            r_html = r_resp.read().decode('utf-8', errors='ignore')
        
        lat_m = re.search(r'Latitude\s+([-\d\.]+)', r_html, re.I)
        lon_m = re.search(r'Longitude\s+([-\d\.]+)', r_html, re.I)
        mdpl_m = re.search(r'ketinggian\s+(\d+)\s*mdpl', r_html, re.I)
        
        lat = float(lat_m.group(1)) if lat_m else None
        lon = float(lon_m.group(1)) if lon_m else None
        mdpl = int(mdpl_m.group(1)) if mdpl_m else None
        
        master_data[nama.lower()] = {
            'nama': nama,
            'provinsi': item['provinsi'],
            'lat': lat,
            'lon': lon,
            'elevasi': mdpl,
            'tipe': 'Stratovulkan'
        }
        time.sleep(0.1)
    except Exception as e:
        print(f"Gagal mengambil {nama}: {e}")

# Simpan ke data/volcanoes-master.json
out_path = 'data/volcanoes-master.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(master_data, f, ensure_ascii=False, indent=2)

print(f"Selesai! Master data tersimpan di {out_path} ({len(master_data)} gunung api).")
