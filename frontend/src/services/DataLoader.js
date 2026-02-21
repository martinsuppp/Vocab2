// Google Apps Script Web App URL
// Google Apps Script Web App URL
const GAS_URL_KEY = 'vocab_master_gas_url';
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwdLNPIQVOqEcs3Qatv54Si5e7CaitwCHvBo8t-FB62hxN70dtlDSiItyRQ1Or-Vklc/exec";
let GAS_API_URL = localStorage.getItem(GAS_URL_KEY) || DEFAULT_GAS_URL;

// Cache to store the full dataset from GAS
let cachedData = null;

const DataLoader = {
    // 1. Get/Set URL
    getGasUrl() {
        return GAS_API_URL;
    },

    setGasUrl(url) {
        GAS_API_URL = url.trim();
        localStorage.setItem(GAS_URL_KEY, GAS_API_URL);
        // Clear cache so next fetch uses new URL
        cachedData = null;
    },

    resetGasUrl() {
        localStorage.removeItem(GAS_URL_KEY);
        GAS_API_URL = "";
        cachedData = null;
    },

    // 2. Fetch Data (Internal)
    async _fetchData() {
        if (cachedData) return cachedData;

        // If no URL is set, we can't fetch. Return empty or throw based on need.
        // The UI should prevent calling this if URL is missing.
        if (!GAS_API_URL) {
            console.warn("GAS URL not set.");
            return {};
            // Alternatively, we could fallback to local manifest here if we wanted mix-mode
        }

        try {
            const response = await fetch(GAS_API_URL);
            if (!response.ok) {
                // Return error object so UI can handle it
                throw new Error(`Fetch failed: ${response.statusText}`);
            }
            const data = await response.json();

            // Support user's custom format
            if (data.ok && data.sheets) {
                const adaptedData = {};
                for (const [sheetName, rows] of Object.entries(data.sheets)) {
                    if (!rows || rows.length === 0) continue;

                    const validRows = rows.filter(r => {
                        const en = String(r.en || '').trim();
                        const zh = String(r.zh || '').trim();
                        return (/[a-zA-Z]/.test(en) || /[a-zA-Z]/.test(zh)) && en.length > 0 && zh.length > 0;
                    });

                    if (validRows.length === 0) continue;

                    adaptedData[sheetName] = validRows.map(r => {
                        const zhStr = String(r.zh || '').trim();
                        const phoneticStr = String(r.phonetic || '').trim();
                        const combinedTranslation = phoneticStr ? `${zhStr} ${phoneticStr}` : zhStr;

                        return {
                            word: r.en,
                            translation: combinedTranslation,
                            zh: zhStr, // Keep pure version for individual layout
                            phonetic: r.phonetic, // Kept for backward compatibility or future use
                            example: r.example
                        };
                    });
                }
                cachedData = adaptedData;
                return adaptedData;
            }

            cachedData = data;
            return data;

        } catch (error) {
            console.error('Error fetching data:', error);
            throw error; // Re-throw so UI knows it failed
        }
    },

    // 3. Public Methods
    async listFiles() {
        // If request fails, this will throw, which is good for UI error handling
        const data = await this._fetchData();
        return Object.keys(data);
    },

    async loadWords(sheetName) {
        const data = await this._fetchData();
        return data[sheetName] || [];
    },

    // Check if data is loaded
    isDataLoaded() {
        return !!cachedData;
    }
};

export default DataLoader;
