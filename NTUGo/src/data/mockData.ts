export const NTU_CENTER = {
  lat: 25.0173405,
  lng: 121.5397518,
};

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export const LOCATIONS: {
  food: Location[];
  bus: Location[];
  bike: Location[];
  metro: Location[];
  campus: Location[];
} = {
  food: [],
  bus: [],
  bike: [],
  metro: [],
  campus: [
    { id: 'c1', name: '總圖書館', lat: 25.0175, lng: 121.5405, type: 'library' },
    { id: 'c2', name: '體育館 (新體)', lat: 25.021, lng: 121.535, type: 'gym' },
  ],
};


