/**
 * Preset locations on/near JKUAT main Juja campus for lecturer session pins.
 * Coordinates are approximate; adjust radius on the setup screen as needed.
 */
export type JkuatBuilding = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export const JKUAT_BUILDINGS: JkuatBuilding[] = [
  { id: 'admin', name: 'Administration / Senate', latitude: -1.0954, longitude: 37.0146 },
  { id: 'library', name: 'Main Library', latitude: -1.0943, longitude: 37.0158 },
  { id: 'engineering', name: 'College of Engineering', latitude: -1.0968, longitude: 37.0135 },
  { id: 'ict', name: 'ICT Centre', latitude: -1.0938, longitude: 37.0139 },
  { id: 'students', name: 'Students Centre', latitude: -1.0971, longitude: 37.0162 },
  { id: 'agriculture', name: 'Agriculture / COHES', latitude: -1.0925, longitude: 37.0128 },
  { id: 'science', name: 'Science Complex', latitude: -1.0949, longitude: 37.0119 },
  { id: 'gate-a', name: 'Main Gate (Haile Selassie Rd)', latitude: -1.0912, longitude: 37.0175 },
];
