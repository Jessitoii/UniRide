export interface LocalizedName {
  tr: string;
  en: string;
}

export interface Faculty {
  name: LocalizedName;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface University {
  name: LocalizedName;
  faculties: Faculty[];
}

// Dynamic loading strategy for large datasets (>500KB)
// We rely on Metro bundler's JSON resolution to keep the file structure clean.
const universitiesData = require('./UniversitiesData.json');

const universities: University[] = universitiesData;

export default universities;
