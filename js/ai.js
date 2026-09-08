/**
 * PANTAU GEMPA & GUNUNG BERAPI - AI Advisory & Situational Analysis Module
 * Hybrid Engine:
 * 1. Instant Client-side Geospatial Expert System (Rule-based, 0 API key, 0 cost)
 * 2. In-depth Narrative Analysis via Google Gemini 2.5 Flash (User API Key)
 */

window.App = window.App || {};

App.AI = {
    apiKey: '',
    currentAnalysisResult: null,
    isGeneratingDeep: false,

    init() {
        this.loadApiKey();
        this.updateApiKeyIndicator();
    },

    // ==========================================
    // 1. API KEY STORAGE & MANAGEMENT
    // ==========================================
    loadApiKey() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
    },

    saveApiKey(key) {
        const trimmed = (key || '').trim();
        if (!trimmed) {
            App.UI.showToast("Kunci API tidak boleh kosong", "error");
            return false;
        }
        this.apiKey = trimmed;
        localStorage.setItem('gemini_api_key', trimmed);
        this.updateApiKeyIndicator();
        App.UI.showToast("Kunci API Gemini berhasil disimpan!");
        this.closeApiKeyModal();
        return true;
    },

    removeApiKey() {
        this.apiKey = '';
        localStorage.removeItem('gemini_api_key');
        this.updateApiKeyIndicator();
        App.UI.showToast("Kunci API Gemini telah dihapus");
        this.closeApiKeyModal();
    },

    updateApiKeyIndicator() {
        const indicatorDot = document.getElementById('ai-key-status-dot');
        const indicatorText = document.getElementById('ai-key-status-text');
        const inputField = document.getElementById('gemini-api-key-input');
        const removeBtn = document.getElementById('ai-key-remove-btn');

        if (this.apiKey) {
            if (indicatorDot) indicatorDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
            if (indicatorText) indicatorText.innerText = "Gemini Terhubung";
            if (removeBtn) removeBtn.classList.remove('hidden');
            if (inputField) inputField.value = "••••••••••••••••••••" + this.apiKey.slice(-4);
        } else {
            if (indicatorDot) indicatorDot.className = "w-2 h-2 rounded-full bg-slate-400";
            if (indicatorText) indicatorText.innerText = "Kunci API";
            if (removeBtn) removeBtn.classList.add('hidden');
            if (inputField) inputField.value = "";
        }
    },

    openApiKeyModal() {
        const modal = document.getElementById('gemini-key-modal');
        if (!modal) return;
        const inputField = document.getElementById('gemini-api-key-input');
        if (inputField) {
            inputField.value = this.apiKey ? this.apiKey : "";
        }
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            const box = modal.querySelector('div');
            if (box) box.classList.remove('scale-95');
        }, 20);
    },

    closeApiKeyModal() {
        const modal = document.getElementById('gemini-key-modal');
        if (!modal) return;
        modal.classList.add('opacity-0');
        const box = modal.querySelector('div');
        if (box) box.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 250);
    },

    // ==========================================
    // 2. GEOSPATIAL UTILITIES & DISTANCE FORMULA
    // ==========================================
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius bumi dalam km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // ==========================================
    // 3. INSTANT RULE-BASED EXPERT SYSTEM
    // ==========================================
    analyzeCurrentView() {
        if (!App.Map.instance) return;

        const bounds = App.Map.instance.getBounds();
        const south = bounds.getSouth();
        const north = bounds.getNorth();
        const west = bounds.getWest();
        const east = bounds.getEast();

        // 1. Saring gunung api aktif yang berada di dalam pandangan layar (atau seluruh elevated jika zoom out)
        const visibleVolcanoes = (App.State.volcanoes || []).filter(v => {
            if (v.lat === null || v.lon === null || isNaN(v.lat) || isNaN(v.lon)) return false;
            return v.lat >= south && v.lat <= north && v.lon >= west && v.lon <= east;
        });

        const elevatedVolcanoes = visibleVolcanoes.filter(v => v.level >= 2);
        const awasVolcanoes = visibleVolcanoes.filter(v => v.level === 4);
        const siagaVolcanoes = visibleVolcanoes.filter(v => v.level === 3);
        const waspadaVolcanoes = visibleVolcanoes.filter(v => v.level === 2);

        // 2. Saring gempa bumi di area pandangan
        const visibleQuakes = (App.State.currentVisibleData || []);
        
        // 3. Deteksi Klaster Gempa Susulan (Aftershock Swarms)
        // Cari gempa utama (M >= 5.0) atau gempa terbesar, lalu hitung gempa dalam radius 50 km
        let activeAftershockClusters = [];
        const recentQuakes = [...visibleQuakes].sort((a, b) => b.time - a.time);

        recentQuakes.forEach(mainEq => {
            if (mainEq.mag >= 4.8) {
                const aftershocks = recentQuakes.filter(other => {
                    if (other.id === mainEq.id) return false;
                    const dist = this.haversineDistance(mainEq.lat, mainEq.lon, other.lat, other.lon);
                    const timeDiffHours = Math.abs(mainEq.time - other.time) / (1000 * 60 * 60);
                    return dist <= 60 && timeDiffHours <= 72; // dalam 60 km dan rentang 72 jam
                });

                if (aftershocks.length >= 2) {
                    // Hindari duplikasi klaster di titik yang sama
                    const alreadyFound = activeAftershockClusters.some(c => 
                        this.haversineDistance(c.main.lat, c.main.lon, mainEq.lat, mainEq.lon) < 40
                    );
                    if (!alreadyFound) {
                        activeAftershockClusters.push({
                            main: mainEq,
                            count: aftershocks.length + 1,
                            maxMag: Math.max(mainEq.mag, ...aftershocks.map(a => a.mag)),
                            aftershocks: aftershocks
                        });
                    }
                }
            }
        });

        // 4. Deteksi Bahaya Ganda (Multi-Hazard: Gempa dekat Gunung Api Aktif)
        let multiHazardItems = [];
        elevatedVolcanoes.forEach(v => {
            const nearbyQuakes = visibleQuakes.filter(eq => {
                const dist = this.haversineDistance(v.lat, v.lon, eq.lat, eq.lon);
                return dist <= 35 && eq.depth <= 30; // Gempa dangkal dalam 35 km dari gunung
            });
            if (nearbyQuakes.length > 0) {
                multiHazardItems.push({
                    volcano: v,
                    nearbyQuakes: nearbyQuakes
                });
            }
        });

        // 5. Hitung Tingkat Ancaman (Threat Scoring)
        let threatLevel = 'NORMAL'; // NORMAL | WASPADA | SIAGA | AWAS
        let threatTitle = "Kondisi Seismik & Vulkanik Terpantau Normal";
        let threatDesc = "Tidak terdeteksi aktivitas erupsi kritis atau rentetan gempa susulan yang membahayakan di area pandang layar saat ini.";
        let cardBgClass = "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100";
        let badgeClass = "bg-emerald-600 text-white";
        let iconClass = "fa-solid fa-circle-check text-emerald-500";
        let advisoryPoints = [
            "Aktivitas perjalanan, wisata, dan kegiatan luar ruangan dapat berjalan seperti biasa.",
            "Tetap perhatikan jalur evakuasi umum dan informasi resmi BMKG & PVMBG."
        ];

        if (awasVolcanoes.length > 0 || (activeAftershockClusters.some(c => c.maxMag >= 6.2))) {
            threatLevel = 'AWAS';
            threatTitle = "BAHAYA TINGGI: ZONA MERAH / ANCAMAN KRITIS";
            cardBgClass = "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100";
            badgeClass = "bg-rose-600 text-white animate-pulse";
            iconClass = "fa-solid fa-triangle-exclamation text-rose-600 animate-bounce";
            
            advisoryPoints = [
                "⛔ DILARANG KERAS berkunjung atau mendekati area radius bahaya sektoral resmi.",
                "Warga di dalam radius bahaya diimbau segera mengungsi mengikuti instruksi BPBD dan tim SAR.",
                "Hindari bangunan yang retak atau lereng bukit terjal yang rawan longsor susulan."
            ];
            threatDesc = `Terdeteksi ${awasVolcanoes.length > 0 ? `Gunung Berapi Level IV (AWAS): ${awasVolcanoes.map(v => v.nama).join(', ')}. ` : ''}${activeAftershockClusters.length > 0 ? `Terdapat ${activeAftershockClusters.length} klaster gempa bumi signifikan aktif dengan frekuensi tinggi.` : ''}`;
        } else if (siagaVolcanoes.length > 0 || activeAftershockClusters.length > 0 || multiHazardItems.length > 0) {
            threatLevel = 'SIAGA';
            threatTitle = "PERINGATAN: ZONA RISIKO TINGGI (SIAGA)";
            cardBgClass = "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100";
            badgeClass = "bg-orange-500 text-white";
            iconClass = "fa-solid fa-radiation text-orange-500";

            advisoryPoints = [
                "⚠️ HINDARI KUNJUNGAN WISATA / PENDAKIAN ke gunung berapi berstatus Siaga.",
                "Patuhi radius bahaya sektoral yang ditetapkan pos pengamatan resmi PVMBG.",
                "Jika berada di daerah gempa susulan, waspadai risiko runtuhnya plafon atau genteng rumah."
            ];
            threatDesc = `Terdeteksi ${siagaVolcanoes.length} gunung api berstatus Level III (SIAGA) ${siagaVolcanoes.map(v => v.nama).join(', ')}. ${activeAftershockClusters.length > 0 ? `Tercatat ${activeAftershockClusters.length} klaster gempa susulan aktif. ` : ''}${multiHazardItems.length > 0 ? `Terjadi interaksi seismik dangkal di dekat gunung aktif.` : ''}`;
        } else if (waspadaVolcanoes.length > 0 || visibleQuakes.some(eq => eq.mag >= 5.0)) {
            threatLevel = 'WASPADA';
            threatTitle = "WASPADA: PENINGKATAN AKTIVITAS TERBATAS";
            cardBgClass = "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100";
            badgeClass = "bg-amber-500 text-white";
            iconClass = "fa-solid fa-triangle-exclamation text-amber-500";

            advisoryPoints = [
                "Wisatawan agar tidak mendekati bibir kawah aktif dalam radius minimal resmi.",
                "Ikuti arahan pengelola kawasan taman nasional dan pos pengamatan PVMBG setempat.",
                "Tetap tenang dan pantau pembaruan berkala dari instansi berwenang."
            ];
            threatDesc = `Terpantau ${waspadaVolcanoes.length} gunung api Level II (WASPADA) di area ini (${waspadaVolcanoes.slice(0, 4).map(v => v.nama).join(', ')}${waspadaVolcanoes.length > 4 ? '...' : ''}).`;
        }

        // Simpan fakta terstruktur untuk konsumsi Gemini Deep Dive
        this.currentAnalysisResult = {
            threatLevel,
            threatTitle,
            threatDesc,
            advisoryPoints,
            elevatedVolcanoes,
            activeAftershockClusters,
            multiHazardItems,
            visibleQuakesCount: visibleQuakes.length,
            timestamp: new Date().toISOString()
        };

        // Perbarui DOM Panel Advisory
        this.renderAdvisoryPanel(cardBgClass, badgeClass, iconClass);
    },

    renderAdvisoryPanel(cardBgClass, badgeClass, iconClass) {
        const panel = document.getElementById('ai-advisory-panel');
        if (!panel || !this.currentAnalysisResult) return;

        const res = this.currentAnalysisResult;
        
        // Atur styling kontainer
        panel.className = `rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-300 ${cardBgClass}`;

        // Badge Level
        const badgeEl = document.getElementById('ai-threat-badge');
        if (badgeEl) {
            badgeEl.className = `px-2.5 py-1 rounded-lg text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs ${badgeClass}`;
            badgeEl.innerHTML = `<i class="${iconClass}"></i> STATUS: ${res.threatLevel}`;
        }

        // Judul & Deskripsi
        const titleEl = document.getElementById('ai-threat-title');
        if (titleEl) titleEl.innerText = res.threatTitle;

        const descEl = document.getElementById('ai-threat-desc');
        if (descEl) descEl.innerText = res.threatDesc;

        // Poin Rekomendasi
        const pointsEl = document.getElementById('ai-threat-points');
        if (pointsEl) {
            pointsEl.innerHTML = res.advisoryPoints.map(p => `
                <li class="flex items-start gap-2">
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">•</span>
                    <span>${App.Utils.escapeHTML(p)}</span>
                </li>
            `).join('');
        }

        // Ringkasan Klaster & Gunung
        const metaEl = document.getElementById('ai-threat-meta');
        if (metaEl) {
            let metaHtml = '';
            if (res.elevatedVolcanoes.length > 0) {
                metaHtml += `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-semibold text-[11px]"><i class="fa-solid fa-volcano text-amber-500"></i> ${res.elevatedVolcanoes.length} Gunung Siaga/Waspada</span>`;
            }
            if (res.activeAftershockClusters.length > 0) {
                metaHtml += `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-semibold text-[11px]"><i class="fa-solid fa-wave-square text-rose-500"></i> ${res.activeAftershockClusters.length} Klaster Gempa Susulan</span>`;
            }
            if (res.multiHazardItems.length > 0) {
                metaHtml += `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-semibold text-[11px]"><i class="fa-solid fa-radiation text-rose-600"></i> ${res.multiHazardItems.length} Titik Bahaya Ganda</span>`;
            }
            metaEl.innerHTML = metaHtml;
        }
    },

    // ==========================================
    // 4. DEEP-DIVE ANALYSIS VIA GEMINI 2.5 FLASH
    // ==========================================
    async generateDeepAnalysis() {
        if (!this.apiKey) {
            this.openApiKeyModal();
            App.UI.showToast("Silakan masukkan Google Gemini API Key Anda terlebih dahulu", "error");
            return;
        }

        if (this.isGeneratingDeep) return;

        const res = this.currentAnalysisResult;
        if (!res) {
            App.UI.showToast("Data area belum siap, silakan geser peta sejenak.", "error");
            return;
        }

        this.isGeneratingDeep = true;
        this.openDeepModal();

        const contentEl = document.getElementById('gemini-deep-content');
        const loadingEl = document.getElementById('gemini-deep-loading');
        if (contentEl) contentEl.classList.add('hidden');
        if (loadingEl) loadingEl.classList.remove('hidden');

        // Susun prompt grounding bebas halusinasi
        const volcanoDetails = res.elevatedVolcanoes.map(v => 
            `- ${v.nama} (${v.provinsi}): Status ${v.status} (Level ${v.level}), Radius Bahaya Resmi: ±${v.radius_bahaya_km || '-'} km. Rekomendasi: ${v.rekomendasi || 'Patuhi arahan pos pengamatan.'}`
        ).join('\n') || '- Tidak ada gunung api berstatus Waspada/Siaga/Awas di area pandang saat ini.';

        const quakeClusterDetails = res.activeAftershockClusters.map(c => 
            `- Gempa Utama M ${c.main.mag.toFixed(1)} di ${c.main.place} (Kedalaman: ${c.main.depth} km), terdeteksi total ${c.count} gempa beruntun/susulan dalam radius 60 km.`
        ).join('\n') || '- Tidak terdeteksi rangkaian gempa susulan masif di area pandang saat ini.';

        const promptText = `
Anda adalah Pakar Vulkanologi, Kegempaan, dan Mitigasi Bencana Geologi Indonesia (PVMBG & BMKG Advisory Specialist).
Berikan analisis situasi mendalam serta PANDUAN KESELAMATAN PERJALANAN (TRAVEL ADVISORY) resmi berdasarkan FAKTA GEOLOGIS TERVERIFIKASI berikut:

[FAKTA DATA LAPANGAN]:
1. Status Ancaman Sistem: ${res.threatLevel} (${res.threatTitle})
2. Ringkasan: ${res.threatDesc}
3. Gunung Api Terpantau Aktif di Area:
${volcanoDetails}
4. Klaster Kegempaan & Gempa Susulan Terdeteksi:
${quakeClusterDetails}
5. Total Gempa di Area Layar: ${res.visibleQuakesCount} kejadian.

[INSTRUKSI WAJIB]:
- Analisis harus objektif, berbasis data di atas, dan TIDAK MENGARANG fakta/angka di luar data yang diberikan.
- Gunakan Bahasa Indonesia yang lugas, empatik, tenang, dan otoritatif.
- Format laporan harus terstruktur dengan judul-judul berikut:
  1. 🌋 **Kajian Ancaman Vulkanik & Kegempaan Wilayah** (Jelaskan kondisi gempa & gunung api)
  2. ⛔ **Zona Bahaya & Anjuran Perjalanan Wisata** (Sebutkan wilayah/gunung yang DILARANG atau TIDAK DIREKOMENDASIKAN dikunjungi wisatawan)
  3. 🏠 **Instruksi Kesiapsiagaan Bagi Masyarakat Sekitar** (Langkah evakuasi, gempa susulan, bahaya lahar/awan panas)
  4. 🚗 **Rekomendasi Jalur Transportasi & Logistik** (Apakah penerbangan/jalur darat terancam abu vulkanik atau retakan jalan)
`;

        try {
            // Panggilan langsung ke endpoint Google Gemini 2.5 Flash
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: promptText }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1500
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errMsg = data.error ? data.error.message : 'Gagal menghubungi Gemini API';
                throw new Error(errMsg);
            }

            const candidate = data.candidates && data.candidates[0];
            const textResponse = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] ? candidate.content.parts[0].text : 'Tidak ada hasil teks dari AI.';

            this.renderDeepReport(textResponse);
        } catch (error) {
            this.renderDeepError(error.message);
        } finally {
            this.isGeneratingDeep = false;
        }
    },

    renderDeepReport(markdownText) {
        const contentEl = document.getElementById('gemini-deep-content');
        const loadingEl = document.getElementById('gemini-deep-loading');
        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) {
            contentEl.classList.remove('hidden');
            // Format markdown dasar menjadi HTML bersih
            let formattedHtml = markdownText
                .replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1">$1</h4>')
                .replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-indigo-700 dark:text-indigo-400 mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">$1</h3>')
                .replace(/^# (.*$)/gim, '<h2 class="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h2>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
                .replace(/\n\n/gim, '<br/><br/>')
                .replace(/\n/gim, '<br/>');

            contentEl.innerHTML = `
                <div class="p-4 sm:p-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                    <div class="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs mb-3">
                        <span class="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-wand-magic-sparkles text-indigo-600 dark:text-indigo-400"></i> Dihasilkan oleh Gemini 2.5 Flash
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">${new Date().toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                    ${formattedHtml}
                </div>
            `;
        }
    },

    renderDeepError(errorMessage) {
        const contentEl = document.getElementById('gemini-deep-content');
        const loadingEl = document.getElementById('gemini-deep-loading');
        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) {
            contentEl.classList.remove('hidden');
            contentEl.innerHTML = `
                <div class="p-8 text-center">
                    <div class="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 text-xl">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Gagal Menghubungi Gemini API</h4>
                    <p class="text-xs text-rose-600 dark:text-rose-400 mb-4 max-w-md mx-auto">${App.Utils.escapeHTML(errorMessage)}</p>
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="App.AI.openApiKeyModal()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer">
                            Periksa Kunci API
                        </button>
                        <button onclick="App.AI.generateDeepAnalysis()" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            `;
        }
    },

    openDeepModal() {
        const modal = document.getElementById('gemini-deep-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            const box = modal.querySelector('div');
            if (box) box.classList.remove('scale-95');
        }, 20);
    },

    closeDeepModal() {
        const modal = document.getElementById('gemini-deep-modal');
        if (!modal) return;
        modal.classList.add('opacity-0');
        const box = modal.querySelector('div');
        if (box) box.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 250);
    }
};
