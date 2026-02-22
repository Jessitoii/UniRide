const fs = require('fs');
const path = require('path');

const rawUnis = [
    "Abdullah Gül Üniversitesi", "Acıbadem Üniversitesi", "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi",
    "Adıyaman Üniversitesi", "Afyon Kocatepe Üniversitesi", "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
    "Ağrı İbrahim Çeçen Üniversitesi", "Ahi Evran Üniversitesi", "Akdeniz Üniversitesi", "Aksaray Üniversitesi",
    "Alanya Alaaddin Keykubat Üniversitesi", "Alanya Hamdullah Emin Paşa Üniversitesi", "Altınbaş Üniversitesi",
    "Amasya Üniversitesi", "Anadolu Üniversitesi", "Ankara Bilim Üniversitesi", "Ankara Hacı Bayram Veli Üniversitesi",
    "Ankara Medipol Üniversitesi", "Ankara Müzik ve Güzel Sanatlar Üniversitesi", "Ankara Sosyal Bilimler Üniversitesi",
    "Ankara Üniversitesi", "Ankara Yıldırım Beyazıt Üniversitesi", "Antalya Akev Üniversitesi", "Antalya Bilim Üniversitesi",
    "Ardahan Üniversitesi", "Artvin Çoruh Üniversitesi", "Ataşehir Adıgüzel Meslek Yüksekokulu", "Atılım Üniversitesi",
    "Atatürk Üniversitesi", "Avrasya Üniversitesi", "Aydın Adnan Menderes Üniversitesi", "Bahçeşehir Üniversitesi",
    "Balıkesir Üniversitesi", "Bandırma Onyedi Eylül Üniversitesi", "Bartın Üniversitesi", "Başkent Üniversitesi",
    "Batman Üniversitesi", "Bayburt Üniversitesi", "Beykent Üniversitesi", "Beykoz Üniversitesi",
    "Bezmialem Vakıf Üniversitesi", "Bilecik Şeyh Edebali Üniversitesi", "Bingöl Üniversitesi", "Biruni Üniversitesi",
    "Bitlis Eren Üniversitesi", "Boğaziçi Üniversitesi", "Bolu Abant İzzet Baysal Üniversitesi",
    "Burdur Mehmet Akif Ersoy Üniversitesi", "Bursa Teknik Üniversitesi", "Bursa Uludağ Üniversitesi",
    "Çağ Üniversitesi", "Çanakkale Onsekiz Mart Üniversitesi", "Çankaya Üniversitesi", "Çankırı Karatekin Üniversitesi",
    "Çukurova Üniversitesi", "Dicle Üniversitesi", "Doğuş Üniversitesi", "Dokuz Eylül Üniversitesi",
    "Düzce Üniversitesi", "Ege Üniversitesi", "Erciyes Üniversitesi", "Erzincan Binali Yıldırım Üniversitesi",
    "Erzurum Teknik Üniversitesi", "Eskişehir Osmangazi Üniversitesi", "Eskişehir Teknik Üniversitesi",
    "Fatih Sultan Mehmet Vakıf Üniversitesi", "Fenerbahçe Üniversitesi", "Fırat Üniversitesi",
    "Galatasaray Üniversitesi", "Gaziantep İslam Bilim ve Teknoloji Üniversitesi", "Gaziantep Üniversitesi",
    "Gazi Üniversitesi", "Gebze Teknik Üniversitesi", "Giresun Üniversitesi", "Gümüşhane Üniversitesi",
    "Hacettepe Üniversitesi", "Hakkari Üniversitesi", "Haliç Üniversitesi", "Hasan Kalyoncu Üniversitesi",
    "Hatay Mustafa Kemal Üniversitesi", "Hitit Üniversitesi", "Iğdır Üniversitesi", "Isparta Uygulamalı Bilimler Üniversitesi",
    "Işık Üniversitesi", "İbn Haldun Üniversitesi", "İhsan Doğramacı Bilkent Üniversitesi", "İnönü Üniversitesi",
    "İskenderun Teknik Üniversitesi", "İstanbul 29 Mayıs Üniversitesi", "İstanbul Arel Üniversitesi",
    "İstanbul Atlas Üniversitesi", "İstanbul Aydın Üniversitesi", "İstanbul Ayvansaray Üniversitesi",
    "İstanbul Beykent Üniversitesi", "İstanbul Bilgi Üniversitesi", "İstanbul Bilim Üniversitesi",
    "İstanbul Esenyurt Üniversitesi", "İstanbul Galata Üniversitesi", "İstanbul Gedik Üniversitesi",
    "İstanbul Gelişim Üniversitesi", "İstanbul Kent Üniversitesi", "İstanbul Kültür Üniversitesi",
    "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi", "İstanbul Okan Üniversitesi",
    "İstanbul Rumeli Üniversitesi", "İstanbul Sabahattin Zaim Üniversitesi", "İstanbul Sağlık ve Teknoloji Üniversitesi",
    "İstanbul Şişli Meslek Yüksekokulu", "İstanbul Teknik Üniversitesi", "İstanbul Ticaret Üniversitesi",
    "İstanbul Topkapı Üniversitesi", "İstanbul Üniversitesi", "İstanbul Üniversitesi-Cerrahpaşa",
    "İstanbul Yeni Yüzyıl Üniversitesi", "İstinye Üniversitesi", "İzmir Bakırçay Üniversitesi",
    "İzmir Demokrasi Üniversitesi", "İzmir Ekonomi Üniversitesi", "İzmir Katip Çelebi Üniversitesi",
    "İzmir Kavram Meslek Yüksekokulu", "İzmir Tınaztepe Üniversitesi", "İzmir Yüksek Teknoloji Enstitüsü",
    "Kadir Has Üniversitesi", "Kafkas Üniversitesi", "Kahramanmaraş İstiklal Üniversitesi",
    "Kahramanmaraş Sütçü İmam Üniversitesi", "Karabük Üniversitesi", "Karadeniz Teknik Üniversitesi",
    "Karamanoğlu Mehmetbey Üniversitesi", "Kastamonu Üniversitesi", "Kayseri Üniversitesi",
    "Kırıkkale Üniversitesi", "Kırklareli Üniversitesi", "Kırşehir Ahi Evran Üniversitesi",
    "Kilis 7 Aralık Üniversitesi", "Kocaeli Sağlık ve Teknoloji Üniversitesi", "Kocaeli Üniversitesi",
    "Koç Üniversitesi", "Konya Gıda ve Tarım Üniversitesi", "Konya Teknik Üniversitesi",
    "KTO Karatay Üniversitesi", "Kütahya Dumlupınar Üniversitesi", "Kütahya Sağlık Bilimleri Üniversitesi",
    "Lokman Hekim Üniversitesi", "Malatya Turgut Özal Üniversitesi", "Maltepe Üniversitesi",
    "Manisa Celal Bayar Üniversitesi", "Mardin Artuklu Üniversitesi", "Marmara Üniversitesi",
    "MEF Üniversitesi", "Mersin Üniversitesi", "Mimar Sinan Güzel Sanatlar Üniversitesi",
    "Mudanya Üniversitesi", "Muğla Sıtkı Koçman Üniversitesi", "Munzur Üniversitesi",
    "Muş Alparslan Üniversitesi", "Necmettin Erbakan Üniversitesi", "Nevşehir Hacı Bektaş Veli Üniversitesi",
    "Niğde Ömer Halisdemir Üniversitesi", "Nuh Naci Yazgan Üniversitesi", "Ondokuz Mayıs Üniversitesi",
    "Ordu Üniversitesi", "Orta Doğu Teknik Üniversitesi", "Osmaniye Korkut Ata Üniversitesi",
    "Ostim Teknik Üniversitesi", "Özyeğin Üniversitesi", "Pamukkale Üniversitesi", "Piri Reis Üniversitesi",
    "Recep Tayyip Erdoğan Üniversitesi", "Sabancı Üniversitesi", "Sağlık Bilimleri Üniversitesi",
    "Sakarya Uygulamalı Bilimler Üniversitesi", "Sakarya Üniversitesi", "Samsun Üniversitesi",
    "Sanko Üniversitesi", "Selçuk Üniversitesi", "Siirt Üniversitesi", "Sinop Üniversitesi",
    "Sivas Bilim ve Teknoloji Üniversitesi", "Sivas Cumhuriyet Üniversitesi", "Süleyman Demirel Üniversitesi",
    "Şırnak Üniversitesi", "Tarsus Üniversitesi", "TED Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi",
    "TOBB Ekonomi ve Teknoloji Üniversitesi", "Tokat Gaziosmanpaşa Üniversitesi", "Toros Üniversitesi",
    "Trabzon Üniversitesi", "Trakya Üniversitesi", "Türk-Alman Üniversitesi", "Türk Hava Kurumu Üniversitesi",
    "Türk-Japon Bilim ve Teknoloji Üniversitesi", "Ufuk Üniversitesi", "Uşak Üniversitesi",
    "Van Yüzüncü Yıl Üniversitesi", "Yalova Üniversitesi", "Yaşar Üniversitesi", "Yeditepe Üniversitesi",
    "Yıldız Teknik Üniversitesi", "Yozgat Bozok Üniversitesi", "Yüksek İhtisas Üniversitesi",
    "Zonguldak Bülent Ecevit Üniversitesi"
];

const CITIES = {
    "Adana": { lat: 37.0000, lng: 35.3213 },
    "Adıyaman": { lat: 37.7648, lng: 38.2786 },
    "Afyon": { lat: 38.7507, lng: 30.5567 },
    "Ağrı": { lat: 39.7191, lng: 43.0503 },
    "Aksaray": { lat: 38.3687, lng: 34.0370 },
    "Amasya": { lat: 40.6499, lng: 35.8353 },
    "Ankara": { lat: 39.9334, lng: 32.8597 },
    "Antalya": { lat: 36.8969, lng: 30.7133 },
    "Ardahan": { lat: 41.1105, lng: 42.7022 },
    "Artvin": { lat: 41.1828, lng: 41.8196 },
    "Aydın": { lat: 37.8380, lng: 27.8456 },
    "Balıkesir": { lat: 39.6484, lng: 27.8826 },
    "Bartın": { lat: 41.6344, lng: 32.3375 },
    "Batman": { lat: 37.8812, lng: 41.1351 },
    "Bayburt": { lat: 40.2552, lng: 40.2249 },
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
    "Düzce": { lat: 40.8438, lng: 31.1565 },
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
    "Iğdır": { lat: 39.9167, lng: 44.0333 },
    "Isparta": { lat: 37.7648, lng: 30.5566 },
    "İstanbul": { lat: 41.0082, lng: 28.9784 },
    "İzmir": { lat: 38.4237, lng: 27.1428 },
    "Kahramanmaraş": { lat: 37.5858, lng: 36.9371 },
    "Karabük": { lat: 41.2061, lng: 32.6228 },
    "Karaman": { lat: 37.1811, lng: 33.2222 },
    "Kars": { lat: 40.6013, lng: 43.0975 },
    "Kastamonu": { lat: 41.3887, lng: 33.7827 },
    "Kayseri": { lat: 38.7312, lng: 35.4787 },
    "Kırıkkale": { lat: 39.8468, lng: 33.5153 },
    "Kırklareli": { lat: 41.7333, lng: 27.2167 },
    "Kırşehir": { lat: 39.1425, lng: 34.1639 },
    "Kilis": { lat: 36.7184, lng: 37.1147 },
    "Kocaeli": { lat: 40.7654, lng: 29.9408 },
    "Konya": { lat: 37.8667, lng: 32.4833 },
    "Kütahya": { lat: 39.4167, lng: 29.9833 },
    "Malatya": { lat: 38.3552, lng: 38.3095 },
    "Manisa": { lat: 38.6191, lng: 27.4289 },
    "Mardin": { lat: 37.3212, lng: 40.7245 },
    "Mersin": { lat: 36.8000, lng: 34.6333 },
    "Muğla": { lat: 37.2153, lng: 28.3636 },
    "Muş": { lat: 38.7346, lng: 41.4910 },
    "Nevşehir": { lat: 38.6250, lng: 34.7122 },
    "Niğde": { lat: 37.9667, lng: 34.6833 },
    "Ordu": { lat: 40.9839, lng: 37.8764 },
    "Osmaniye": { lat: 37.0742, lng: 36.2475 },
    "Rize": { lat: 41.0201, lng: 40.5234 },
    "Sakarya": { lat: 40.7569, lng: 30.3783 },
    "Samsun": { lat: 41.2867, lng: 36.3300 },
    "Siirt": { lat: 37.9333, lng: 41.9500 },
    "Sinop": { lat: 42.0231, lng: 35.1531 },
    "Sivas": { lat: 39.7477, lng: 37.0179 },
    "Şanlıurfa": { lat: 37.1591, lng: 38.7969 },
    "Şırnak": { lat: 37.5228, lng: 42.4594 },
    "Tekirdağ": { lat: 40.9833, lng: 27.5167 },
    "Tokat": { lat: 40.3167, lng: 36.5500 },
    "Trabzon": { lat: 41.0015, lng: 39.7178 },
    "Tunceli": { lat: 39.1079, lng: 39.5401 },
    "Uşak": { lat: 38.6823, lng: 29.4082 },
    "Van": { lat: 38.4891, lng: 43.3811 },
    "Yalova": { lat: 40.6500, lng: 29.2667 },
    "Yozgat": { lat: 39.8181, lng: 34.8147 },
    "Zonguldak": { lat: 41.4564, lng: 31.7987 },

    // Overrides
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
    { tr: "İlahiyat Fakültesi", en: "Faculty of Theology" },
    { tr: "Veteriner Fakültesi", en: "Faculty of Veterinary Medicine" },
];

function transliterate(text) {
    return text.toLowerCase()
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ş/g, "s")
        .replace(/ü/g, "u")
        .replace(/i/g, "i");
}

function matchCityCoord(uniName) {
    if (/Teknik|İstanbul Teknik/i.test(uniName)) return CITIES.itu;
    if (/Orta Doğu Teknik/i.test(uniName)) return CITIES.metu;
    if (/Uludağ/i.test(uniName)) return CITIES.uludag;
    if (/Boğaziçi/i.test(uniName)) return CITIES.bogazici;
    if (/Hacettepe/i.test(uniName)) return CITIES.hacettepe;
    if (/Ege/i.test(uniName)) return CITIES.ege;
    if (/Yeditepe/i.test(uniName)) return CITIES.yeditepe;
    if (/Koç/i.test(uniName)) return CITIES.koc;
    if (/Sabancı/i.test(uniName)) return CITIES.sabanci;
    if (/Bilkent/i.test(uniName)) return CITIES.bilkent;

    for (const city in CITIES) {
        if (transliterate(uniName).includes(transliterate(city))) {
            return CITIES[city];
        }
    }
    if (transliterate(uniName).includes('istanbul')) return CITIES.İstanbul;
    if (transliterate(uniName).includes('ankara')) return CITIES.Ankara;
    if (transliterate(uniName).includes('izmir')) return CITIES.İzmir;
    return CITIES.Ankara;
}

function generateFaculties(baseCenter) {
    const faculties = [];
    let seed = baseCenter.lat * baseCenter.lng;
    const numFaculties = 8 + Math.floor(Math.abs(Math.sin(seed) * 7));

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
                latitude: parseFloat((baseCenter.lat + Math.cos(angle) * rad).toFixed(6)),
                longitude: parseFloat((baseCenter.lng + Math.sin(angle) * rad).toFixed(6))
            }
        });
    }
    return faculties;
}

const outputList = rawUnis.map(u => {
    let enName = u.replace(/ Üniversitesi/gi, ' University')
        .replace(/Teknik/gi, 'Technical')
        .replace(/İ/g, "I").replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c");

    const center = matchCityCoord(u);
    return {
        name: {
            tr: u,
            en: enName
        },
        faculties: generateFaculties(center)
    };
});

const outputPath = path.resolve(__dirname, '..', 'src', 'constants', 'UniversitiesData.json');
const jsonStr = JSON.stringify(outputList, null, 2);
fs.writeFileSync(outputPath, jsonStr, 'utf-8');
console.log(`Successfully generated ${outputList.length} universities.`);
console.log(`Dataset size: ${(Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(2)} KB`);
