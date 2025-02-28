interface Faculty {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface University {
  name: string;
  faculties: Faculty[];
}

const universities: University[] = [
  {
    name: "Uludağ University",
    faculties: [
      {
        name: "Tıp Fakültesi",
        location: { latitude: 40.2210, longitude: 28.8699 },
      },
      {
        name: "İktisadi ve İdari Bilimler Fakültesi",
        location: { latitude: 40.2263, longitude: 28.8738 },
      },
      {
        name: "Mühendislik Fakültesi - Bilgisayar Mühendisliği",
        location: { latitude: 40.2255, longitude: 28.8754 },
      },
      {
        name: "Mühendislik Fakültesi - Elektrik-Elektronik Mühendisliği",
        location: { latitude: 40.2255, longitude: 28.8754 },
      },
      {
        name: "Mühendislik Fakültesi - Tekstil Mühendisliği",
        location: { latitude: 40.2255, longitude: 28.8754 },
      },
      {
        name: "Mühendislik Fakültesi - Endüstri Mühendisliği",
        location: { latitude: 40.2278, longitude: 28.8767 },
      },
      {
        name: "Mühendislik Fakültesi - İnşaat Mühendisliği",
        location: { latitude: 40.2223, longitude: 28.8773 },
      },
      {
        name: "Mühendislik Fakültesi - Makine Mühendisliği",
        location: { latitude: 40.2275, longitude: 28.8756 },
      },
      {
        name: "Mühendislik Fakültesi - Otomotiv Mühendisliği",
        location: { latitude: 40.2268, longitude: 28.8759 },
      },
      {
        name: "Mühendislik Fakültesi - Çevre Mühendisliği",
        location: { latitude: 40.2265, longitude: 28.8777 },
      },
      {
        name: "Veteriner Fakültesi",
        location: { latitude: 40.2295, longitude: 28.8747 },
      },
      {
        name: "Ziraat Fakültesi",
        location: { latitude: 40.2256, longitude: 28.8616 },
      },
      {
        name: "Eğitim Fakültesi",
        location: { latitude: 40.2243, longitude: 28.8766 },
      },
      {
        name: "İlahiyat Fakültesi",
        location: { latitude: 40.2246, longitude: 28.8662 },
      },
      {
        name: "Fen-Edebiyat Fakültesi",
        location: { latitude: 40.2246, longitude: 28.8662 },
      },
      {
        name: "Hukuk Fakültesi",
        location: { latitude: 40.4225, longitude: 29.1468 },
      },
      {
        name: "Güzel Sanatlar Fakültesi",
        location: { latitude: 40.3735, longitude: 28.8783 },
      },
      {
        name: "Diş Hekimliği Fakültesi",
        location: { latitude: 40.2193, longitude: 28.8764 },
      },
      {
        name: "Mimarlık Fakültesi",
        location: { latitude: 40.2272, longitude: 28.8769 },
      },
      {
        name: "Sağlık Bilimleri Fakültesi",
        location: { latitude: 40.2215, longitude: 28.8665 },
      },
      {
        name: "Spor Bilimleri Fakültesi",
        location: { latitude: 40.2217, longitude: 28.8609 },
      },
      {
        name: "İnegöl İşletme Fakültesi",
        location: { latitude: 40.0765, longitude: 29.4914 },
      },
      {
        name: "Sağlık Hizmetleri Meslek Yüksekokulu",
        location: { latitude: 40.2250, longitude: 28.8762 },
      },
    ],
  },
  {
    name: "Boğaziçi University",
    faculties: [
      {
        name: "Faculty of Arts and Sciences",
        location: { latitude: 41.0845, longitude: 29.0514 },
      },
      {
        name: "Faculty of Engineering",
        location: { latitude: 41.0845, longitude: 29.0514 },
      },
    ],
  },
  {
    name: "Middle East Technical University",
    faculties: [
      {
        name: "Faculty of Architecture",
        location: { latitude: 39.8938, longitude: 32.7787 },
      },
      {
        name: "Faculty of Engineering",
        location: { latitude: 39.8938, longitude: 32.7787 },
      },
    ],
  },
  // Add more universities and faculties here
];

console.log('Universities:', universities);

export default universities;
