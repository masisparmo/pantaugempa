/**
 * PANTAU GEMPA & GUNUNG BERAPI - AI Advisory & Situational Analysis Module
 * Engine:
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
        App.UI.showToast("Kunci API berhasil disimpan!");
        this.closeApiKeyModal();
        return true;
    },

    removeApiKey() {
        this.apiKey = '';
        localStorage.removeItem('gemini_api_key');
        this.updateApiKeyIndicator();
        App.UI.showToast("Kunci API telah dihapus");
        this.closeApiKeyModal();
    },

    updateApiKeyIndicator() {
        const indicatorDot = document.getElementById('ai-key-status-dot');
        const indicatorText = document.getElementById('ai-key-status-text');
        const inputField = document.getElementById('gemini-api-key-input');
        const removeBtn = document.getElementById('ai-key-remove-btn');

        if (this.apiKey) {
            if (indicatorDot) indicatorDot.className = "w-2 h-2 rounded-full bg-emerald-500 animate-pulse";
            if (indicatorText) indicatorText.innerText = "Kunci API Terhubung";
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

        // 1. Saring gunung api aktif yang berada di dalam pandangan layar
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

        // Format nama gunung beserta daerah/provinsinya
        const formatVolcanoList = (volcList, max = 5) => {
            const items = volcList.slice(0, max).map(v => `${v.nama} (${v.provinsi || 'Indonesia'})`);
            if (volcList.length > max) {
                return items.join(', ') + ` dan ${volcList.length - max} gunung lainnya`;
            }
            return items.join(', ');
        };

        const formatClusterList = (clusters) => {
            return clusters.map(c => `wilayah ${c.main.place || 'Sekitarnya'} (${c.count} gempa susulan, maks M ${c.maxMag.toFixed(1)})`).join('; ');
        };

        const formatMultiHazardList = (items) => {
            return items.map(m => `G. ${m.volcano.nama} (${m.volcano.provinsi || 'Indonesia'})`).join(', ');
        };

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
            
            const awasNamesWithProv = formatVolcanoList(awasVolcanoes);
            threatDesc = `BAHAYA KRITIS: Terdeteksi ${awasVolcanoes.length > 0 ? `Gunung Berapi Level IV (AWAS) di daerah: ${awasNamesWithProv}. ` : ''}${activeAftershockClusters.length > 0 ? `Tercatat klaster gempa susulan masif di: ${formatClusterList(activeAftershockClusters)}.` : ''}`;

            advisoryPoints = [
                `⛔ DILARANG KERAS berkunjung atau mendekati zona bahaya resmi di daerah terdampak: ${awasNamesWithProv || 'area bencana'}.`,
                "Warga dan pengunjung di dalam radius bahaya wajib segera mengungsi mengikuti instruksi BPBD dan tim SAR.",
                "Hindari bangunan yang retak atau lereng bukit terjal yang rawan longsor susulan akibat gempa."
            ];
        } else if (siagaVolcanoes.length > 0 || activeAftershockClusters.length > 0 || multiHazardItems.length > 0) {
            threatLevel = 'SIAGA';
            threatTitle = "PERINGATAN: ZONA RISIKO TINGGI (SIAGA)";
            cardBgClass = "border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100";
            badgeClass = "bg-orange-500 text-white";
            iconClass = "fa-solid fa-radiation text-orange-500";

            const siagaNamesWithProv = formatVolcanoList(siagaVolcanoes);
            threatDesc = `Terdeteksi ${siagaVolcanoes.length} gunung api berstatus Level III (SIAGA) di daerah: ${siagaNamesWithProv}. ${activeAftershockClusters.length > 0 ? `Tercatat ${activeAftershockClusters.length} klaster gempa susulan aktif di ${formatClusterList(activeAftershockClusters)}. ` : ''}${multiHazardItems.length > 0 ? `Terjadi interaksi seismik dangkal dekat tubuh ${formatMultiHazardList(multiHazardItems)}.` : ''}`;

            advisoryPoints = [
                `⚠️ HINDARI KUNJUNGAN WISATA / PENDAKIAN di daerah berstatus Siaga: ${siagaNamesWithProv}.`,
                "Patuhi radius bahaya sektoral resmi yang ditetapkan pos pengamatan PVMBG di masing-masing wilayah.",
                activeAftershockClusters.length > 0 
                    ? `Waspadai risiko runtuhan material dinding/plafon dan longsor lereng di ${formatClusterList(activeAftershockClusters)}.`
                    : "Masyarakat di sepanjang aliran sungai yang berhulu di puncak gunung diimbau waspada terhadap bahaya banjir lahar dingin saat hujan lebat."
            ];
        } else if (waspadaVolcanoes.length > 0 || visibleQuakes.some(eq => eq.mag >= 5.0)) {
            threatLevel = 'WASPADA';
            threatTitle = "WASPADA: PENINGKATAN AKTIVITAS TERBATAS";
            cardBgClass = "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100";
            badgeClass = "bg-amber-500 text-white";
            iconClass = "fa-solid fa-triangle-exclamation text-amber-500";

            const waspadaNamesWithProv = formatVolcanoList(waspadaVolcanoes, 4);
            threatDesc = `Terpantau ${waspadaVolcanoes.length} gunung api Level II (WASPADA) di wilayah: ${waspadaNamesWithProv}.`;

            advisoryPoints = [
                `Wisatawan dan pendaki dilarang mendekati kawah aktif di kawasan: ${waspadaNamesWithProv}.`,
                "Ikuti arahan pengelola kawasan taman nasional dan pos pengamatan PVMBG setempat di masing-masing daerah.",
                "Tetap tenang dan pantau pembaruan berkala dari instansi berwenang."
            ];
        }

        // Simpan fakta terstruktur untuk konsumsi AI Deep Dive
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
    // 4. DEEP-DIVE ANALYSIS VIA AI (GEMINI 2.5 FLASH)
    // ==========================================
    async generateDeepAnalysis() {
        if (!this.apiKey) {
            this.openApiKeyModal();
            App.UI.showToast("Silakan masukkan Kunci API Anda terlebih dahulu", "error");
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

        // Susun prompt grounding berbasis fakta wilayah
        const volcanoDetails = res.elevatedVolcanoes.map(v => 
            `- ${v.nama} (Provinsi ${v.provinsi || 'Indonesia'}): Status ${v.status} (Level ${v.level}), Radius Bahaya Resmi: ±${v.radius_bahaya_km || '-'} km. Rekomendasi PVMBG: ${v.rekomendasi || 'Patuhi arahan pos pengamatan.'}`
        ).join('\n') || '- Tidak ada gunung api berstatus Waspada/Siaga/Awas di area pandang saat ini.';

        const quakeClusterDetails = res.activeAftershockClusters.map(c => 
            `- Gempa Utama M ${c.main.mag.toFixed(1)} di wilayah ${c.main.place} (Kedalaman: ${c.main.depth} km), terdeteksi total ${c.count} gempa beruntun/susulan dalam radius 60 km.`
        ).join('\n') || '- Tidak terdeteksi rangkaian gempa susulan masif di area pandang saat ini.';

        const promptText = `
Anda adalah Pakar Vulkanologi, Kegempaan, dan Mitigasi Bencana Geologi Indonesia (PVMBG & BMKG Advisory Specialist).
Berikan analisis situasi mendalam serta PANDUAN KESELAMATAN PERJALANAN (TRAVEL ADVISORY) resmi berdasarkan FAKTA GEOLOGIS TERVERIFIKASI berikut:

[FAKTA DATA LAPANGAN]:
1. Status Ancaman Sistem: ${res.threatLevel} (${res.threatTitle})
2. Evaluasi Wilayah: ${res.threatDesc}
3. Gunung Api Terpantau Aktif di Area:
${volcanoDetails}
4. Klaster Kegempaan & Gempa Susulan Terdeteksi:
${quakeClusterDetails}
5. Total Gempa Terpantau di Area Layar: ${res.visibleQuakesCount} kejadian.

[INSTRUKSI PENULISAN WAJIB]:
- Tuliskan analisis yang LENGKAP, MENDALAM, KOMPREHENSIF, dan BERBOBOT. Jangan membuat ringkasan yang terlalu pendek atau terputus.
- WAJIB menyebutkan nama daerah, provinsi, dan kawasan geografis spesifik untuk setiap gunung berapi dan kejadian gempa yang dibahas.
- Uraikan setiap bab di bawah ini secara terperinci dengan beberapa paragraf penjelasan mendalam dan poin-poin anjuran konkret:

## 🌋 1. Kajian Ancaman Vulkanik & Kegempaan Wilayah
(Jelaskan secara mendalam dinamika kegempaan dan aktivitas vulkanik di provinsi/daerah terdampak berdasarkan data di atas)

## ⛔ 2. Zona Bahaya & Anjuran Perjalanan Wisata
(Sebutkan secara tegas nama daerah/kabupaten/gunung yang DILARANG atau TIDAK DIREKOMENDASIKAN untuk dikunjungi wisatawan maupun pendaki beserta radius batas amannya)

## 🏠 3. Instruksi Kesiapsiagaan Bagi Masyarakat Sekitar
(Berikan panduan praktis untuk warga di daerah terdampak terkait antisipasi gempa susulan, bahaya lahar hujan di bantaran sungai, dan penggunaan masker abu vulkanik)

## 🚗 4. Rekomendasi Jalur Transportasi & Logistik
(Analisis potensi gangguan penerbangan akibat sebaran abu vulkanik serta kehati-hatian jalur darat terhadap potensi longsor atau jalan retak)
`;

        try {
            // Panggilan langsung ke endpoint Google Gemini 2.5 Flash
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
            
            // Konfigurasi dengan thinkingBudget 0 agar token tidak tersedot dan output maksimal
            const payload = {
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 8192,
                    thinkingConfig: {
                        thinkingBudget: 0
                    }
                }
            };

            let response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Fallback jika thinkingConfig tidak didukung pada versi tertentu
            if (!response.ok) {
                const errData = await response.json();
                if (errData.error && errData.error.message && errData.error.message.includes('thinkingConfig')) {
                    delete payload.generationConfig.thinkingConfig;
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    throw new Error(errData.error ? errData.error.message : 'Gagal menghubungi layanan AI');
                }
            }

            const data = await response.json();

            if (!response.ok) {
                const errMsg = data.error ? data.error.message : 'Gagal menghubungi layanan AI';
                throw new Error(errMsg);
            }

            const candidate = data.candidates && data.candidates[0];
            let textResponse = '';
            if (candidate && candidate.content && candidate.content.parts) {
                const contentParts = candidate.content.parts.filter(p => !p.thought && p.text);
                if (contentParts.length > 0) {
                    textResponse = contentParts.map(p => p.text).join('\n');
                } else {
                    textResponse = candidate.content.parts.map(p => p.text || '').join('\n');
                }
            }

            if (!textResponse.trim()) {
                textResponse = 'Tidak ada hasil teks dari analisis AI.';
            }

            this.renderDeepReport(textResponse);
        } catch (error) {
            this.renderDeepError(error.message);
        } finally {
            this.isGeneratingDeep = false;
        }
    },

    formatInlineMarkdown(str) {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">$1</code>');
    },

    parseMarkdownToHtml(markdownText) {
        if (!markdownText) return '';

        const lines = markdownText.split('\n');
        let html = '';
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (!line) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                continue;
            }

            // Garis pembatas horizontal (---)
            if (/^---$|^___$|^\*\*\*$/.test(line)) {
                if (inList) { html += '</ul>'; inList = false; }
                html += '<hr class="my-4 border-slate-200 dark:border-slate-800"/>';
                continue;
            }

            // Headings
            if (line.startsWith('### ')) {
                if (inList) { html += '</ul>'; inList = false; }
                const title = this.formatInlineMarkdown(line.replace(/^###\s+/, ''));
                html += `<h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-3.5 mb-1.5 flex items-center gap-1.5">${title}</h4>`;
                continue;
            }
            if (line.startsWith('## ')) {
                if (inList) { html += '</ul>'; inList = false; }
                const title = this.formatInlineMarkdown(line.replace(/^##\s+/, ''));
                html += `<h3 class="text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-400 mt-5 mb-2.5 pb-1 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2">${title}</h3>`;
                continue;
            }
            if (line.startsWith('# ')) {
                if (inList) { html += '</ul>'; inList = false; }
                const title = this.formatInlineMarkdown(line.replace(/^#\s+/, ''));
                html += `<h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-5 mb-2">${title}</h2>`;
                continue;
            }

            // List (bullet atau numbered)
            const bulletMatch = line.match(/^[\-\*]\s+(.*)$/);
            const numberMatch = line.match(/^\d+\.\s+(.*)$/);

            if (bulletMatch || numberMatch) {
                if (!inList) {
                    html += '<ul class="space-y-1.5 my-2.5">';
                    inList = true;
                }
                const content = this.formatInlineMarkdown(bulletMatch ? bulletMatch[1] : numberMatch[1]);
                const bulletIcon = numberMatch 
                    ? `<span class="font-bold text-indigo-600 dark:text-indigo-400 text-xs">${line.match(/^\d+\./)[0]}</span>` 
                    : `<span class="text-indigo-600 dark:text-indigo-400 font-bold">•</span>`;
                html += `<li class="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${bulletIcon}<span>${content}</span></li>`;
                continue;
            }

            if (inList) {
                html += '</ul>';
                inList = false;
            }

            // Paragraf biasa
            html += `<p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">${this.formatInlineMarkdown(line)}</p>`;
        }

        if (inList) {
            html += '</ul>';
        }

        return html;
    },

    renderDeepReport(markdownText) {
        const contentEl = document.getElementById('gemini-deep-content');
        const loadingEl = document.getElementById('gemini-deep-loading');
        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) {
            contentEl.classList.remove('hidden');
            const formattedHtml = this.parseMarkdownToHtml(markdownText);

            contentEl.innerHTML = `
                <div class="p-4 sm:p-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div class="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs mb-4">
                        <span class="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                            <i class="fa-solid fa-wand-magic-sparkles text-indigo-600 dark:text-indigo-400"></i> Analisa by AI
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
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Gagal Menghubungi Layanan AI</h4>
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
