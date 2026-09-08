/**
 * @file map.js
 * @description Leaflet GIS Map: earthquake markers, fault lines, volcano layers, popups, and fullscreen mode
 */

window.App = window.App || {};

App.Map = {
    instance: null,
    tileLayer: null,
    markers: [],
    isProgrammaticMove: false,
    isTectonicVisible: false,
    tectonicLayer: null,
    indoFaultsLayer: null,
    volcanoLayerGroup: null,
    volcanoRadiusGroup: null,
    volcanoMarkersMap: {},
    isFullScreen: false,

    /**
     * Inisialisasi peta Leaflet dan event listeners
     */
    init() {
        if (!this.instance) {
            this.instance = L.map('map').setView(App.Config.MAP_CENTER, App.Config.MAP_ZOOM);
            this.updateTile();
            this.volcanoLayerGroup = L.layerGroup().addTo(this.instance);
            this.volcanoRadiusGroup = L.layerGroup().addTo(this.instance);
            
            // Handle native Fullscreen exit (contoh: pengguna menekan tombol ESC)
            const onFsChange = () => {
                const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
                const mapContainer = document.querySelector('.map-container');
                const icon = document.getElementById('fullscreen-icon');
                const text = document.getElementById('fullscreen-text');
                const modal = document.getElementById('about-modal');
                
                if (!isFs) {
                    if (this.isFullScreen) {
                        this.isFullScreen = false;
                        if (mapContainer) mapContainer.classList.remove('is-fullscreen');
                        if (icon) icon.className = "fa-solid fa-expand";
                        if (text) text.innerText = "Layar Penuh";
                        setTimeout(() => { if (this.instance) this.instance.invalidateSize(); }, 200);
                    }
                    if (modal && modal.parentElement !== document.body) {
                        document.body.appendChild(modal);
                    }
                }
            };
            document.addEventListener('fullscreenchange', onFsChange);
            document.addEventListener('webkitfullscreenchange', onFsChange);

            this.instance.on('moveend', () => {
                if (this.isProgrammaticMove) {
                    this.isProgrammaticMove = false;
                    this.syncTableWithBounds(); 
                    return; 
                }
                const apiProvider = document.getElementById('api-provider');
                if (apiProvider && apiProvider.value === 'USGS') {
                    const searchAreaBtn = document.getElementById('search-area-btn');
                    if (searchAreaBtn) {
                        searchAreaBtn.classList.remove('hidden');
                        searchAreaBtn.classList.add('flex');
                    }
                }
                this.syncTableWithBounds();
            });
        }
    },

    /**
     * Memperbarui tile layer Leaflet sesuai tema Gelap/Terang
     */
    updateTile() {
        if (!this.instance) return;
        if (this.tileLayer) this.instance.removeLayer(this.tileLayer);
        
        const tileUrl = App.State.isDarkMode 
            ? (App.Config?.TILES?.DARK || 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}')
            : (App.Config?.TILES?.LIGHT || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            
        const attr = App.State.isDarkMode
            ? (App.Config?.TILES?.DARK_ATTRIBUTION || 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ')
            : (App.Config?.TILES?.ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');

        this.tileLayer = L.tileLayer(tileUrl, { attribution: attr, maxZoom: 18 }).addTo(this.instance);
    },

    /**
     * Toggle layer batas lempeng tektonik (PB2002) dan patahan sesar aktif PuSGeN
     */
    async toggleTectonicPlates() {
        const btnText = document.getElementById('tectonic-btn-text');
        const disc = document.getElementById('disclaimer-faults');
        
        if (this.isTectonicVisible) {
            if (this.tectonicLayer && this.instance) this.instance.removeLayer(this.tectonicLayer);
            if (this.indoFaultsLayer && this.instance) this.instance.removeLayer(this.indoFaultsLayer);
            this.isTectonicVisible = false;
            if (btnText) btnText.innerText = "Lempeng & Sesar";
            if (disc) disc.classList.add('hidden');
            return;
        }

        if (btnText) btnText.innerText = "Memuat...";
        try {
            if (!this.tectonicLayer) {
                const response = await fetch(App.Config.TECTONIC_PLATES_URL);
                const data = await response.json();
                this.tectonicLayer = L.geoJSON(data, {
                    style: () => ({ color: App.State.isDarkMode ? "#ef4444" : "#f43f5e", weight: 2, opacity: 0.6, dashArray: "4, 6" }),
                    onEachFeature: (feature, layer) => {
                        const name = App.Utils.escapeHTML(feature.properties.Name || 'Patahan (Unnamed)');
                        layer.bindPopup(`<div class="p-1 text-xs"><div class="font-bold text-rose-600 mb-1">Batas Lempeng (PB2002)</div><div>${name}</div></div>`);
                    }
                });
            }
            
            if (!this.indoFaultsLayer) {
                this.indoFaultsLayer = L.geoJSON(App.Config.INDO_FAULTS_GEOJSON, {
                    style: () => ({ color: "#eab308", weight: 3.5, opacity: 0.9, dashArray: "6, 4" }),
                    onEachFeature: (feature, layer) => {
                        const name = App.Utils.escapeHTML(feature.properties.Name);
                        const risk = App.Utils.escapeHTML(feature.properties.Risk);
                        const src = App.Utils.escapeHTML(feature.properties.Source);
                        layer.bindPopup(`<div class="p-1 text-xs"><div class="font-bold text-amber-500 mb-1">Struktur Geologi Lokal</div><div><b>${name}</b></div><div class="text-slate-500 mt-1">Tipe: ${risk}<br/>Source: ${src}</div><hr class="my-1"/><i class="text-[9px] text-slate-400">*Visualisasi pendekatan, bukan rujukan resmi.</i></div>`);
                    }
                });
            }
            
            if (this.instance) {
                this.tectonicLayer.setStyle({ color: App.State.isDarkMode ? "#ef4444" : "#f43f5e" });
                this.tectonicLayer.addTo(this.instance);
                this.indoFaultsLayer.addTo(this.instance);
                this.isTectonicVisible = true;
                if (btnText) btnText.innerText = "Sembunyikan Lempeng";
                if (disc) disc.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Gagal memuat batas lempeng:", error);
            if (btnText) btnText.innerText = "Gagal Memuat";
            setTimeout(() => { if (btnText) btnText.innerText = "Lempeng & Sesar"; }, 2000);
        }
    },

    /**
     * Render marker lingkaran gempa bumi pada peta
     */
    renderMarkers(hasManualRegionFocus = false) {
        if (!this.instance) return;
        this.markers.forEach(m => this.instance.removeLayer(m));
        this.markers = [];
        
        if (App.State.filteredEarthquakes.length === 0) return;

        const boundsArr = [];
        App.State.filteredEarthquakes.forEach((eq) => {
            if (isNaN(eq.lat) || isNaN(eq.lon)) return;
            
            let color = eq.mag >= 6.0 ? '#ef4444' : (eq.mag >= 4.5 ? '#f59e0b' : '#38bdf8');
            const marker = L.circleMarker([eq.lat, eq.lon], { 
                radius: Math.max(5, eq.mag * 2.8), 
                fillColor: color, 
                color: '#ffffff', 
                weight: 1.5, 
                opacity: 0.9, 
                fillOpacity: 0.75 
            });
            
            const safePlace = App.Utils.escapeHTML(eq.place);
            let popupContent = `<div class="p-1 text-xs"><div class="font-bold text-slate-800 text-sm mb-1">${safePlace}</div><div><b>M ${eq.mag.toFixed(1)}</b> | ${eq.depth} km | ${eq.timeFormatted}</div>`;
            
            if (eq.mmi) {
                popupContent += `<div class="mt-1.5 text-rose-600 font-bold border-t border-slate-100 pt-1"><b>MMI:</b> ${App.Utils.escapeHTML(eq.mmi)}</div>`;
            } else if (eq.cdi) {
                popupContent += `<div class="mt-1.5 text-amber-600 font-semibold border-t border-slate-100 pt-1"><b>CDI:</b> ${App.Utils.escapeHTML(eq.cdi)}</div>`;
            } else {
                popupContent += `<div class="mt-1.5 text-slate-500 border-t border-slate-100 pt-1">Intensitas: - (Tidak ada laporan)</div>`;
            }
            popupContent += `</div>`;

            marker.bindPopup(popupContent);
            marker.addTo(this.instance);
            this.markers.push(marker);
            boundsArr.push([eq.lat, eq.lon]);
        });

        if (boundsArr.length > 0 && !hasManualRegionFocus) {
            this.isProgrammaticMove = true;
            this.instance.fitBounds(boundsArr, { padding: [30, 30], maxZoom: 8 });
        }
    },

    /**
     * Sinkronisasi tabel gempa dan chart statistik dengan batas viewport peta aktif
     */
    syncTableWithBounds() {
        if (!this.instance) return;
        const bounds = this.instance.getBounds();
        
        App.State.currentVisibleData = App.State.filteredEarthquakes.filter(eq => {
            if (isNaN(eq.lat) || isNaN(eq.lon)) return false;
            const latLng = L.latLng(eq.lat, eq.lon);
            return bounds.contains(latLng);
        });
        
        App.UI.renderTable(App.State.currentVisibleData);
        App.UI.updateStats(App.State.currentVisibleData);
        App.UI.updateChart(App.State.currentVisibleData);
        if (window.App.AI && typeof window.App.AI.analyzeCurrentView === 'function') {
            window.App.AI.analyzeCurrentView();
        }
    },

    /**
     * Memusatkan peta pada kejadian gempa paling mutakhir
     */
    focusLatestEvent() {
        const eq = [...App.State.rawFetchedEarthquakes].sort((a, b) => b.time - a.time)[0];
        if (eq) this.focusOnLatLon(eq.lat, eq.lon);
    },

    /**
     * Memusatkan peta pada koordinat latitude dan longitude tertentu
     */
    focusOnLatLon(lat, lon) {
        if (!this.instance || isNaN(lat) || isNaN(lon)) return;
        this.isProgrammaticMove = true;
        this.instance.setView([lat, lon], 8, { animate: true });
    },

    /**
     * Memusatkan peta dan membuka popup gunung api berdasarkan ID
     */
    focusVolcano(volcanoId) {
        const v = (App.State.volcanoes || []).find(item => item.id === volcanoId);
        if (!v || !this.instance) return;
        
        // Aktifkan layer gunung api jika belum aktif
        if (!App.State.isVolcanoVisible) {
            this.toggleVolcanoes(true);
        }
        
        // Gulir halus ke peta
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        this.isProgrammaticMove = true;
        this.instance.setView([v.lat, v.lon], 10, { animate: true });
        
        // Buka popup info gunung api terkait secara otomatis
        setTimeout(() => {
            if (this.volcanoMarkersMap && this.volcanoMarkersMap[v.id]) {
                this.volcanoMarkersMap[v.id].openPopup();
            }
        }, 450);
    },

    /**
     * Mengaktifkan atau menonaktifkan mode layar penuh pada peta
     */
    toggleFullScreen() {
        const mapContainer = document.querySelector('.map-container');
        const icon = document.getElementById('fullscreen-icon');
        const text = document.getElementById('fullscreen-text');
        
        if (!this.isFullScreen) {
            if (mapContainer.requestFullscreen) {
                mapContainer.requestFullscreen().catch(() => {});
            } else if (mapContainer.webkitRequestFullscreen) {
                mapContainer.webkitRequestFullscreen();
            }
            mapContainer.classList.add('is-fullscreen');
            this.isFullScreen = true;
            if (icon) icon.className = "fa-solid fa-compress text-amber-500";
            if (text) text.innerText = "Keluar";
            App.UI.showToast("Mode layar penuh aktif (Tekan ESC untuk keluar)");
        } else {
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
                document.webkitExitFullscreen();
            }
            mapContainer.classList.remove('is-fullscreen');
            this.isFullScreen = false;
            if (icon) icon.className = "fa-solid fa-expand";
            if (text) text.innerText = "Layar Penuh";
        }
        
        setTimeout(() => {
            if (this.instance) this.instance.invalidateSize();
        }, 250);
    },

    /**
     * Mengaktifkan/menonaktifkan layer gunung api di peta
     */
    toggleVolcanoes(forceState = null) {
        if (forceState !== null) {
            App.State.isVolcanoVisible = forceState;
        } else {
            App.State.isVolcanoVisible = !App.State.isVolcanoVisible;
        }
        
        const btn = document.getElementById('volcano-btn');
        const panel = document.getElementById('volcano-map-panel');
        const icon = document.getElementById('volcano-btn-icon');
        
        if (App.State.isVolcanoVisible) {
            if (btn) {
                btn.className = "bg-amber-500 text-white border-amber-600 px-3 py-2 rounded-xl shadow-sm border font-semibold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer";
            }
            if (icon) icon.className = "fa-solid fa-volcano text-white";
            if (panel) panel.classList.remove('hidden');
            if (this.volcanoLayerGroup && this.instance && !this.instance.hasLayer(this.volcanoLayerGroup)) {
                this.volcanoLayerGroup.addTo(this.instance);
            }
            if (this.volcanoRadiusGroup && this.instance && !this.instance.hasLayer(this.volcanoRadiusGroup)) {
                this.volcanoRadiusGroup.addTo(this.instance);
            }
            this.renderVolcanoMarkers();
        } else {
            if (btn) {
                btn.className = "bg-white/90 dark:bg-slate-800/90 backdrop-blur hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 font-semibold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer";
            }
            if (icon) icon.className = "fa-solid fa-volcano text-amber-500";
            if (panel) panel.classList.add('hidden');
            if (this.volcanoLayerGroup && this.instance) this.instance.removeLayer(this.volcanoLayerGroup);
            if (this.volcanoRadiusGroup && this.instance) this.instance.removeLayer(this.volcanoRadiusGroup);
        }
    },

    /**
     * Mengatur filter tampilan gunung api di peta ('elevated' atau 'all')
     */
    setVolcanoFilter(filterType) {
        App.State.volcanoFilter = filterType;
        const btnElevated = document.getElementById('volc-filter-elevated');
        const btnAll = document.getElementById('volc-filter-all');
        
        if (filterType === 'elevated') {
            if (btnElevated) btnElevated.className = "px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs font-semibold transition";
            if (btnAll) btnAll.className = "px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition";
        } else {
            if (btnAll) btnAll.className = "px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs font-semibold transition";
            if (btnElevated) btnElevated.className = "px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition";
        }
        this.renderVolcanoMarkers();
    },

    /**
     * Render marker gunung api dan lingkaran radius bahaya
     */
    renderVolcanoMarkers() {
        if (!this.instance) return;
        if (!this.volcanoLayerGroup) {
            this.volcanoLayerGroup = L.layerGroup().addTo(this.instance);
        }
        if (!this.volcanoRadiusGroup) {
            this.volcanoRadiusGroup = L.layerGroup().addTo(this.instance);
        }
        
        this.volcanoLayerGroup.clearLayers();
        this.volcanoRadiusGroup.clearLayers();
        this.volcanoMarkersMap = {};

        const list = App.State.volcanoes.filter(v => {
            if (v.lat === null || v.lon === null || isNaN(v.lat) || isNaN(v.lon)) return false;
            if (App.State.volcanoFilter === 'elevated') return v.level >= 2;
            return true;
        });

        list.forEach(v => {
            let iconHtml = '';
            let iconSize = [24, 24];
            let iconAnchor = [12, 12];
            let circleColor = '#f59e0b';

            if (v.level === 4) {
                circleColor = '#ef4444';
                iconSize = [32, 32];
                iconAnchor = [16, 16];
                iconHtml = `
                    <div class="relative flex items-center justify-center w-8 h-8">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <div class="relative w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
                            <i class="fa-solid fa-volcano"></i>
                        </div>
                    </div>
                `;
            } else if (v.level === 3) {
                circleColor = '#ea580c';
                iconSize = [28, 28];
                iconAnchor = [14, 14];
                iconHtml = `
                    <div class="relative flex items-center justify-center w-7 h-7">
                        <div class="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px]">
                            <i class="fa-solid fa-volcano"></i>
                        </div>
                    </div>
                `;
            } else if (v.level === 2) {
                circleColor = '#d97706';
                iconSize = [24, 24];
                iconAnchor = [12, 12];
                iconHtml = `
                    <div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px]">
                        <i class="fa-solid fa-volcano"></i>
                    </div>
                `;
            } else {
                circleColor = '#10b981';
                iconSize = [20, 20];
                iconAnchor = [10, 10];
                iconHtml = `
                    <div class="w-4 h-4 rounded-full bg-emerald-600/90 border border-white shadow-xs flex items-center justify-center text-white text-[8px]">
                        <i class="fa-solid fa-mountain"></i>
                    </div>
                `;
            }

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'volcano-div-icon',
                iconSize: iconSize,
                iconAnchor: iconAnchor
            });

            const marker = L.marker([v.lat, v.lon], { icon: customIcon });

            // Radius bahaya untuk Level 2, 3, 4
            if (v.radius_bahaya_km && v.level >= 2) {
                const circle = L.circle([v.lat, v.lon], {
                    radius: v.radius_bahaya_km * 1000,
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: v.level === 4 ? 0.22 : (v.level === 3 ? 0.16 : 0.08),
                    weight: 1.5,
                    dashArray: "4, 4"
                });
                this.volcanoRadiusGroup.addLayer(circle);
            }

            // Status & Level styling
            let statusCardClass = '';
            let statusBadgeClass = '';
            let statusLabel = '';
            let statusMeaning = '';
            let statusIcon = 'fa-solid fa-volcano';
            
            if (v.level === 4) {
                statusCardClass = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-sm';
                statusBadgeClass = 'bg-rose-600 text-white shadow-xs';
                statusLabel = 'AWAS (LEVEL IV)';
                statusMeaning = 'Erupsi utama sedang berlangsung atau segera terjadi.';
                statusIcon = 'fa-solid fa-radiation animate-bounce';
            } else if (v.level === 3) {
                statusCardClass = 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-950 dark:text-orange-100 shadow-sm';
                statusBadgeClass = 'bg-orange-500 text-white shadow-xs';
                statusLabel = 'SIAGA (LEVEL III)';
                statusMeaning = 'Peningkatan aktivitas nyata atau erupsi awal.';
                statusIcon = 'fa-solid fa-volcano';
            } else if (v.level === 2) {
                statusCardClass = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-sm';
                statusBadgeClass = 'bg-amber-500 text-white shadow-xs';
                statusLabel = 'WASPADA (LEVEL II)';
                statusMeaning = 'Aktivitas vulkanik meningkat di atas level normal.';
                statusIcon = 'fa-solid fa-triangle-exclamation';
            } else {
                statusCardClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 shadow-sm';
                statusBadgeClass = 'bg-emerald-600 text-white shadow-xs';
                statusLabel = 'NORMAL (LEVEL I)';
                statusMeaning = 'Aktivitas dasar tanpa ancaman erupsi langsung.';
                statusIcon = 'fa-solid fa-mountain';
            }

            const safeName = App.Utils.escapeHTML(v.nama);
            const safeProv = App.Utils.escapeHTML(v.provinsi);
            const safePeriode = v.periode ? App.Utils.escapeHTML(v.periode) : 'Pembaruan resmi PVMBG';
            const safeRec = v.rekomendasi ? App.Utils.escapeHTML(v.rekomendasi) : 'Masyarakat dan wisatawan agar selalu mengikuti arahan pos pengamatan PVMBG dan BPBD setempat.';
            const radiusBadge = v.radius_bahaya_km ? `<div class="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800"><i class="fa-solid fa-radiation text-rose-600 dark:text-rose-400"></i> Radius Bahaya Direkomendasikan: ±${v.radius_bahaya_km} km</div>` : '';

            const popupHtml = `
                <div class="p-1 text-xs w-[280px] sm:w-[310px]">
                    <!-- Header: Nama & Lokasi -->
                    <div class="pr-6 mb-2">
                        <h4 class="font-black text-slate-900 dark:text-white text-base flex items-center gap-1.5 leading-snug">
                            <i class="fa-solid fa-volcano text-amber-500"></i> ${safeName}
                        </h4>
                        <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <i class="fa-solid fa-location-dot"></i> ${safeProv} 
                            ${v.elevasi ? `<span>•</span> <b>${v.elevasi} mdpl</b>` : ''}
                        </div>
                    </div>

                    <!-- PROMINENT STATUS & LEVEL STATUS BANNER -->
                    <div class="my-2 p-2.5 rounded-xl border ${statusCardClass}">
                        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">
                            <span>STATUS AKTIVITAS (PVMBG)</span>
                            <span class="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">RESMI</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center gap-1.5 ${statusBadgeClass}">
                                <i class="${statusIcon}"></i> ${statusLabel}
                            </span>
                        </div>
                        <div class="text-[11px] font-medium mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 leading-snug">
                            <span class="font-bold">Arti Status:</span> ${statusMeaning}
                        </div>
                    </div>

                    ${radiusBadge}

                    <!-- Rekomendasi PVMBG -->
                    <div class="mt-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto custom-scrollbar">
                        <strong class="text-slate-900 dark:text-slate-100 block mb-0.5 font-bold flex items-center gap-1">
                            <i class="fa-solid fa-bullhorn text-indigo-600 dark:text-indigo-400"></i> Rekomendasi Keselamatan:
                        </strong>
                        ${safeRec}
                    </div>

                    <!-- Periode Laporan -->
                    <div class="mt-2 text-[9px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
                        <i class="fa-solid fa-clock text-[8px]"></i> ${safePeriode}
                    </div>

                    <!-- Tombol Aksi -->
                    <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                        <a href="${v.report_url}" target="_blank" rel="noopener" class="btn-detail bg-indigo-600 hover:bg-indigo-700 !text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm">
                            <span class="!text-white font-bold">Laporan Detail</span> <i class="fa-solid fa-arrow-up-right-from-square text-[9px] !text-white"></i>
                        </a>
                        <div class="flex items-center gap-1">
                            <button onclick="App.UI.toggleAboutModal(true, 'volcano-activity-section')" class="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer" title="Buka penjelasan arti status dan level">
                                <i class="fa-solid fa-circle-question text-amber-600 dark:text-amber-400"></i> Arti Level
                            </button>
                            <button onclick="App.Map.focusOnLatLon(${v.lat}, ${v.lon})" class="p-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold transition cursor-pointer" title="Pusatkan peta ke gunung api ini">
                                <i class="fa-solid fa-crosshairs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            marker.bindPopup(popupHtml);
            this.volcanoLayerGroup.addLayer(marker);
            this.volcanoMarkersMap[v.id] = marker;
        });
    }
};
