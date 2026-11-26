import * as THREE from 'three';

export const ROOM = {
  width: 4.0,
  depth: 4.0,
  height: 2.85,
  wallThickness: 0.14,
};

// Camera presets matching the reference images + key furniture zones
export const CAMERA_PRESETS = [
  {
    id: 'entrada',
    code: '01',
    label: 'Entrada',
    position: [0, 2.35, 4.35],
    target: [0, 0.72, -0.35],
  },
  {
    id: 'zebra',
    code: '02',
    label: 'Zebra ZT411',
    position: [-0.28, 1.48, 2.35],
    target: [-1.52, 0.86, 1.32],
  },
  {
    id: 'estante',
    code: '03',
    label: 'Estante',
    position: [0.42, 1.56, 0.58],
    target: [-1.66, 1.06, -0.72],
  },
  {
    id: 'embolsado',
    code: '04',
    label: 'Embolsado',
    position: [-0.35, 1.62, -0.78],
    target: [1.56, 0.92, -0.58],
  },
  {
    id: 'seedless',
    code: '05',
    label: 'Seedless',
    position: [-0.45, 1.52, 0.55],
    target: [0.45, 0.86, 1.56],
  },
  {
    id: 'cenital',
    code: 'TOP',
    label: 'Cenital',
    position: [0, 7.65, 0.25],
    target: [0, 0, 0.18],
  },
];

// Continuous closed drone flight path covering 03 (entry) -> furniture sweep -> 01/02 (top-down) -> 03
export const DRONE_POSITION_POINTS = [
  new THREE.Vector3(0.0, 2.32, 4.35),   // 03: Entrance perspective
  new THREE.Vector3(-0.22, 1.48, 2.45), // Glide in toward Zebra ZT411
  new THREE.Vector3(0.18, 1.48, 0.72),  // Track past Zebra to Estante
  new THREE.Vector3(0.28, 1.62, -0.88), // Sweep along Estante & label rolls
  new THREE.Vector3(0.05, 1.64, -1.22), // Cross back wall toward Embolsado
  new THREE.Vector3(-0.08, 1.56, 0.42), // Glide along 3 Embolsado stations
  new THREE.Vector3(-0.22, 1.52, 1.18), // Sweep over Seedless table
  new THREE.Vector3(0.0, 4.45, 0.85),   // Smooth indoor vertical climb (clear of portal beam)
  new THREE.Vector3(0.0, 7.55, 0.18),   // 01 & 02: Overhead cenital shot
  new THREE.Vector3(0.0, 4.65, 3.65),   // Smooth descent outside portal back to entrance
];

export const DRONE_TARGET_POINTS = [
  new THREE.Vector3(0.0, 0.72, -0.35),  // Room overview from entry
  new THREE.Vector3(-1.52, 0.85, 1.32), // Focus Zebra ZT411 station
  new THREE.Vector3(-1.66, 1.06, 0.05), // Focus lower Estante
  new THREE.Vector3(-1.66, 1.12, -1.05),// Focus upper Estante & boxes
  new THREE.Vector3(1.56, 0.92, -1.1),  // Focus Embolsado rear
  new THREE.Vector3(1.56, 0.9, -0.1),   // Focus Embolsado front
  new THREE.Vector3(0.45, 0.85, 1.56),  // Focus Seedless table
  new THREE.Vector3(0.0, 0.25, 0.1),    // Center transition
  new THREE.Vector3(0.0, 0.0, 0.12),    // Dead-center top-down plan
  new THREE.Vector3(0.0, 0.65, -0.2),   // Re-frame entrance perspective
];
