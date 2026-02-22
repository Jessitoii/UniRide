const fs = require('fs');
const path = require('path');
const http = require('http');

const CITIES = {
    "Adana": { lat: 37.0000, lng: 35.3213 },
    "Adıyaman": { lat: 37.7648, lng: 38.2786 },
    "Afyonkarahisar": { lat: 38.7507, lng: 30.5567 },
    "Aksaray": { lat: 38.3687, lng: 34.0370 },
    "Amasya": { lat: 40.6499, lng: 35.8353 },
    "Ankara": { lat: 39.9334, lng: 32.8597 },
    "Antalya": { lat: 36.8969, lng: 30.7133 },
    "Artvin": { lat: 41.1828, lng: 41.8196 },
    "Aydın": { lat: 37.8380, lng: 27.8456 },
    "Balıkesir": { lat: 39.6484, lng: 27.8826 },
    "Bilecik": { lat: 40.1451, lng: 29.9798 },
    "Bingöl": { lat: 38.8847, lng: 40.4939 },
    "Bitlis": { lat: 38.4006, lng: 42.1095 },
    "Bolu": { lat: 40.7392, lng: 31.6116 },
    "Burdur": { lat: 37.7204, lng: 30.2908 },
    "Bursa": { lat: 40.1828, lng: 29.0667 },
    "Çanakkale": { lat: 40.1553, lng: 26.4142 },
    "Çankırı": { lat: 40.6013, lng: 33.6134 },
    "Çorum": { lat: 40.5506, lng: 34.9556 },
    "Denizli": { lat: 37.7765, lng: 29.0864 },
    "Diyarbakır": { lat: 37.9144, lng: 40.2306 },
    "Edirne": { lat: 41.6771, lng: 26.5557 },
    "Elazığ": { lat: 38.6810, lng: 39.2264 },
    "Erzincan": { lat: 39.7500, lng: 39.5000 },
    "Erzurum": { lat: 39.9043, lng: 41.2679 },
    "Eskişehir": { lat: 39.7667, lng: 30.5256 },
    "Gaziantep": { lat: 37.0662, lng: 37.3833 },
    "Giresun": { lat: 40.9086, lng: 38.3882 },
    "Gümüşhane": { lat: 40.4597, lng: 39.4817 },
    "Hakkari": { lat: 37.5833, lng: 43.7333 },
    "Hatay": { lat: 36.4018, lng: 36.3498 },
    "Isparta": { lat: 37.7648, lng: 30.5566 },
    "Mersin": { lat: 36.8000, lng: 34.6333 },
    "İstanbul": { lat: 41.0082, lng: 28.9784 },
    "Izmir": { lat: 38.4237, lng: 27.1428 },
    "Kars": { lat: 40.6013, lng: 43.0975 },
    "Kastamonu": { lat: 41.3887, lng: 33.7827 },
    "Kayseri": { lat: 38.7312, lng: 35.4787 },
    "Kocaeli": { lat: 40.7654, lng: 29.9408 },
    "Konya": { lat: 37.8667, lng: 32.4833 },
    "Kütahya": { lat: 39.4167, lng: 29.9833 },
    "Malatya": { lat: 38.3552, lng: 38.3095 },
    "Manisa": { lat: 38.6191, lng: 27.4289 },
    "Kahramanmaraş": { lat: 37.5858, lng: 36.9371 },
    "Mardin": { lat: 37.3212, lng: 40.7245 },
    "Muğla": { lat: 37.2153, lng: 28.3636 },
    "Muş": { lat: 38.7346, lng: 41.4910 },
    "Nevşehir": { lat: 38.6250, lng: 34.7122 },
    "Niğde": { lat: 37.9667, lng: 34.6833 },
    "Ordu": { lat: 40.9839, lng: 37.8764 },
    "Rize": { lat: 41.0201, lng: 40.5234 },
    "Sakarya": { lat: 40.7569, lng: 30.3783 },
    "Samsun": { lat: 41.2867, lng: 36.3300 },
    "Sivas": { lat: 39.7477, lng: 37.0179 },
    "Tekirdağ": { lat: 40.9833, lng: 27.5167 },
    "Tokat": { lat: 40.3167, lng: 36.5500 },
    "Trabzon": { lat: 41.0015, lng: 39.7178 },
    "Tunceli": { lat: 39.1079, lng: 39.5401 },
    "Şanlıurfa": { lat: 37.1591, lng: 38.7969 },
    "Uşak": { lat: 38.6823, lng: 29.4082 },
    "Van": { lat: 38.4891, lng: 43.3811 },
    "Yozgat": { lat: 39.8181, lng: 34.8147 },
    "Zonguldak": { lat: 41.4564, lng: 31.7987 },
    "Bayburt": { lat: 40.2552, lng: 40.2249 },
    "Karaman": { lat: 37.1811, lng: 33.2222 },
    "Kırıkkale": { lat: 39.8468, lng: 33.5153 },
    "Batman": { lat: 37.8812, lng: 41.1351 },
    "Şırnak": { lat: 37.5228, lng: 42.4594 },
    "Bartın": { lat: 41.6344, lng: 32.3375 },
    "Ardahan": { lat: 41.1105, lng: 42.7022 },
    "Iğdır": { lat: 39.9167, lng: 44.0333 },
    "Yalova": { lat: 40.6500, lng: 29.2667 },
    "Karabük": { lat: 41.2061, lng: 32.6228 },
    "Kilis": { lat: 36.7184, lng: 37.1147 },
    "Osmaniye": { lat: 37.0742, lng: 36.2475 },
    "Düzce": { lat: 40.8438, lng: 31.1565 },
    "itu": { lat: 41.1044, lng: 29.0238 },
    "metu": { lat: 39.8914, lng: 32.7846 },
    "uludag": { lat: 40.2241, lng: 28.8732 },
    "bogazici": { lat: 41.0838, lng: 29.0506 },
    "hacettepe": { lat: 39.8687, lng: 32.7344 },
    "ege": { lat: 38.4590, lng: 27.2285 },
    "yeditepe": { lat: 40.9701, lng: 29.1539 },
    "koc": { lat: 41.2049, lng: 29.0733 },
    "sabanci": { lat: 40.8926, lng: 29.3783 },
    "bilkent": { lat: 39.8688, lng: 32.7485 }
};

const FACULTIES_BASE = [
    { tr: "Mühendislik Fakültesi", en: "Faculty of Engineering" },
    { tr: "Tıp Fakültesi", en: "Faculty of Medicine" },
    { tr: "İktisadi ve İdari Bilimler Fakültesi", en: "Faculty of Economics and Administrative Sciences" },
    { tr: "Fen-Edebiyat Fakültesi", en: "Faculty of Arts and Sciences" },
    { tr: "Eğitim Fakültesi", en: "Faculty of Education" },
    { tr: "Hukuk Fakültesi", en: "Faculty of Law" },
    { tr: "Mimarlık Fakültesi", en: "Faculty of Architecture" },
    { tr: "İletişim Fakültesi", en: "Faculty of Communication" },
    { tr: "Güzel Sanatlar Fakültesi", en: "Faculty of Fine Arts" },
    { tr: "Sağlık Bilimleri Fakültesi", en: "Faculty of Health Sciences" },
    { tr: "Ziraat Fakültesi", en: "Faculty of Agriculture" },
    { tr: "Diş Hekimliği Fakültesi", en: "Faculty of Dentistry" },
    { tr: "Eczacılık Fakültesi", en: "Faculty of Pharmacy" },
    { tr: "İlahiyat Fakültesi", en: "Faculty of Theology" }
];

function matchCityCoord(uniName) {
    if (/Istanbul Technical|İstanbul Teknik/i.test(uniName)) return CITIES.itu;
    if (/Middle East|Orta Doğu Teknik/i.test(uniName)) return CITIES.metu;
    if (/Uludag|Uludağ/i.test(uniName)) return CITIES.uludag;
    if (/Bogazici|Boğaziçi/i.test(uniName)) return CITIES.bogazici;
    if (/Hacettepe/i.test(uniName)) return CITIES.hacettepe;
    if (/Ege/i.test(uniName)) return CITIES.ege;
    if (/Yeditepe/i.test(uniName)) return CITIES.yeditepe;
    if (/Koc|Koç/i.test(uniName)) return CITIES.koc;
    if (/Sabanci|Sabancı/i.test(uniName)) return CITIES.sabanci;
    if (/Bilkent/i.test(uniName)) return CITIES.bilkent;

    for (const city in CITIES) {
        if (uniName.replace(/i/g, 'ı').toLowerCase().includes(city.toLowerCase())) {
            return CITIES[city];
        }
    }
    if (uniName.toLowerCase().includes('istanbul')) return CITIES.İstanbul;
    if (uniName.toLowerCase().includes('ankara')) return CITIES.Ankara;
    if (uniName.toLowerCase().includes('izmir')) return CITIES.Izmir;
    return CITIES.Ankara;
}

function generateFaculties(baseCenter) {
    const faculties = [];
    let seed = baseCenter.lat * baseCenter.lng;
    const numFaculties = 8 + Math.floor(Math.abs(Math.sin(seed) * 6));

    for (let i = 0; i < numFaculties; i++) {
        const fBase = FACULTIES_BASE[i % FACULTIES_BASE.length];
        const angle = i * (Math.PI * 2 / numFaculties);
        const rad = 0.001 + Math.abs(Math.sin(seed + i)) * 0.004;

        faculties.push({
            name: {
                tr: fBase.tr,
                en: fBase.en
            },
            location: {
                latitude: baseCenter.lat + Math.cos(angle) * rad,
                longitude: baseCenter.lng + Math.sin(angle) * rad
            }
        });
    }
    return faculties;
}

http.get('http://universities.hipolabs.com/search?country=Turkey', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let turkeyUnis = [];
        try {
            turkeyUnis = JSON.parse(data);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }

        const outputList = [];
        // distinct set to avoid duplicates
        const seen = new Set();

        turkeyUnis.forEach(u => {
            if (seen.has(u.name)) return;
            seen.add(u.name);

            let enName = u.name;
            let trName = u.name;

            if (!trName.toLowerCase().includes('university')) {
                enName = trName.replace(/ Universitesi| Üniversitesi| Üniversitesi/gi, ' University').replace(/Teknik/gi, 'Technical');
            } else {
                trName = enName.replace(/ University/gi, ' Üniversitesi').replace(/Technical/gi, 'Teknik');
            }

            const center = matchCityCoord(u.name);

            outputList.push({
                name: {
                    tr: trName,
                    en: enName
                },
                faculties: generateFaculties(center)
            });
        });

        const outputPath = path.resolve(__dirname, '..', 'src', 'constants', 'Universities.json');
        const jsonStr = JSON.stringify(outputList, null, 2);
        fs.writeFileSync(outputPath, jsonStr, 'utf-8');
        console.log(`Successfully generated ${outputList.length} universities.`);
        console.log(`Dataset size: ${(Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(2)} KB`);
    });
}).on('error', (err) => {
    console.error(err);
});
