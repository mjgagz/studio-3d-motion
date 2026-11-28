import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

// ---- Shared head / hair / hairnet math (head-space metres) ----
const HEAD_SCALE = [0.98, 1.02, 1.04];
const HEAD_R_TABLE = [
  [-0.118, 0.0],
  [-0.112, 0.036],
  [-0.09, 0.068],
  [-0.05, 0.092],
  [-0.005, 0.104],
  [0.038, 0.106],
  [0.082, 0.096],
  [0.112, 0.068],
  [0.124, 0.032],
];

function headRadiusAt(yy) {
  const y = yy / HEAD_SCALE[1];
  const t = HEAD_R_TABLE;
  if (y <= t[0][0]) return t[0][1];
  for (let i = 0; i < t.length - 1; i++) {
    const [y0, r0] = t[i];
    const [y1, r1] = t[i + 1];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return t[t.length - 1][1];
}

function bandBaseY(a) {
  return 0.092 - (1 - Math.cos(a)) * 0.052 + Math.abs(Math.sin(a)) * 0.012;
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Smooth lower hairline: even fringe above eyebrows, clean sideburns, full coverage behind/above ears & nape
function hairLowY(a) {
  const d = (Math.abs(a) * 180) / Math.PI;
  const front = 0.055; // clean fringe right above eyebrows
  const sideburn = -0.018; // neat sideburn right in front of ear, clear of mask
  const behindEar = -0.024; // covers 100% of skin above/behind ear root while ear protrudes cleanly
  const nape = -0.104; // full clean nape behind ears
  let y = front;
  y += (sideburn - front) * smooth(36, 56, d);
  y += (behindEar - sideburn) * smooth(74, 86, d);
  y += (nape - behindEar) * smooth(96, 118, d);
  return y;
}

// Clean lower hair skirt from hairline up into the elastic band (pairs with the concentric inner hairnet dome)
function createHairGeometry() {
  const cols = 120;
  const rows = 14;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iy = 0; iy <= rows; iy++) {
    const v = iy / rows;
    for (let ix = 0; ix <= cols; ix++) {
      const a = -Math.PI + (ix / cols) * Math.PI * 2;
      const low = hairLowY(a);
      const top = bandBaseY(a) + 0.025;
      const yy = low + (top - low) * v;
      const edgeTaper = smooth(0, 0.16, v);
      const r = headRadiusAt(yy) + 0.002 + 0.0055 * edgeTaper;

      positions.push(Math.sin(a) * r * HEAD_SCALE[0], yy, Math.cos(a) * r * HEAD_SCALE[2]);
      uvs.push(ix / cols, v);
    }
  }

  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const aa = iy * (cols + 1) + ix;
      const bb = aa + 1;
      const cc = aa + (cols + 1);
      const dd = cc + 1;
      indices.push(aa, bb, cc, bb, dd, cc);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Bright clean white radial pleat texture for the sanitary hairnet
function createHairnetPleatTexture() {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const pleats = 36;
  for (let i = 0; i < pleats; i++) {
    const x = (i / pleats) * size;
    const w = size / pleats;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#eef2f7');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#eef2f7');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Very subtle fine-strand relief texture for matte dark-brown hair
function createHairBumpTexture() {
  if (typeof document === 'undefined') return null;
  const w = 128;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 240; i++) {
    const x = ((i * 53) % w);
    const v = 114 + ((i * 17) % 30);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

// Anatomical curved 3-pleat pastel sky-blue surgical mask hugging nose, cheeks & chin
function createSurgicalMaskGeometry() {
  const segU = 24;
  const segV = 16;
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const y = -0.002 - v * 0.104;
    const chinTuck = Math.sin(v * Math.PI);
    const radiusZ = 0.098 + chinTuck * 0.02 + (v < 0.25 ? (0.25 - v) * 0.024 : 0);
    const radiusX = 0.096 + chinTuck * 0.006 - v * 0.012;

    const pleatWave =
      Math.exp(-Math.pow((v - 0.28) / 0.045, 2)) * 0.0038 +
      Math.exp(-Math.pow((v - 0.52) / 0.045, 2)) * 0.0042 +
      Math.exp(-Math.pow((v - 0.74) / 0.045, 2)) * 0.0036;

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      const theta = (u - 0.5) * Math.PI * 0.94;
      const nosePeak =
        Math.exp(-Math.pow((u - 0.5) / 0.16, 2)) * Math.exp(-Math.pow(v / 0.35, 2)) * 0.01;
      const rX = radiusX + pleatWave * 0.4;
      const rZ = radiusZ + pleatWave + nosePeak;
      positions.push(Math.sin(theta) * rX, y, Math.cos(theta) * rZ + 0.006);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * (segU + 1) + iu;
      const b = a + 1;
      const c = a + (segU + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Shared character geometries & calibrated studio PBR materials (built once for locked 60 FPS)
function useCharacterAssets() {
  return useMemo(() => {
    // Organic oval head (LatheGeometry)
    const headPts = [
      new THREE.Vector2(0.0, -0.118),
      new THREE.Vector2(0.036, -0.112),
      new THREE.Vector2(0.068, -0.09),
      new THREE.Vector2(0.092, -0.05),
      new THREE.Vector2(0.104, -0.005),
      new THREE.Vector2(0.106, 0.038),
      new THREE.Vector2(0.096, 0.082),
      new THREE.Vector2(0.068, 0.112),
      new THREE.Vector2(0.032, 0.124),
      new THREE.Vector2(0.0, 0.127),
    ];
    const headGeo = new THREE.LatheGeometry(headPts, 28);

    // Smooth neck
    const neckGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.055, -0.055),
        new THREE.Vector2(0.045, -0.012),
        new THREE.Vector2(0.042, 0.035),
        new THREE.Vector2(0.046, 0.06),
      ],
      20
    );

    // Clean bright white bouffant hairnet clamped cleanly to the elastic band
    const hairnetPts = [
      new THREE.Vector2(0.102, -0.01),
      new THREE.Vector2(0.114, 0.018),
      new THREE.Vector2(0.122, 0.056),
      new THREE.Vector2(0.122, 0.095),
      new THREE.Vector2(0.108, 0.128),
      new THREE.Vector2(0.076, 0.148),
      new THREE.Vector2(0.036, 0.156),
      new THREE.Vector2(0.0, 0.158),
    ];
    const hairnetGeo = new THREE.LatheGeometry(hairnetPts, 36);
    const hnPos = hairnetGeo.attributes.position;
    for (let i = 0; i < hnPos.count; i++) {
      const vx = hnPos.getX(i);
      const vy = hnPos.getY(i);
      const vz = hnPos.getZ(i);
      const ang = Math.atan2(vx, vz);
      const puff = 1 + Math.sin(ang * 18) * 0.01 * Math.min(1, Math.max(0, (vy + 0.01) / 0.11));
      const limit = bandBaseY(ang) + 0.002 - 0.014;
      let ny = vy;
      let k = puff;
      if (vy < limit) {
        ny = limit;
        const rr = Math.hypot(vx, vz) || 1;
        const need = headRadiusAt(limit + 0.014) + 0.013;
        k = Math.max(puff, need / rr);
      }
      hnPos.setXYZ(i, vx * k, ny, vz * k);
    }
    hairnetGeo.computeVertexNormals();

    // Ruffled crisp white elastic hairnet band seated FLUSH against the hair cap (zero air gap)
    const bandPts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const ruffle = Math.sin(a * 28) * 0.0022;
      const y = bandBaseY(a) + Math.sin(a * 28) * 0.0014;
      const r = headRadiusAt(y + 0.002) + 0.0082;
      bandPts.push(
        new THREE.Vector3(
          Math.sin(a) * (r * HEAD_SCALE[0] + ruffle),
          y,
          Math.cos(a) * (r * HEAD_SCALE[2] + ruffle)
        )
      );
    }
    const hairnetBandGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bandPts, true), 72, 0.0076, 8, true);

    // Continuous smooth dark-brown hair
    const hairGeo = createHairGeometry();

    // Arched eyebrows
    const browGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.021, -0.002, -0.003),
        new THREE.Vector3(-0.007, 0.0055, 0.003),
        new THREE.Vector3(0.01, 0.0045, 0.002),
        new THREE.Vector3(0.022, -0.001, -0.004),
      ]),
      12,
      0.005,
      8,
      false
    );

    // Sculpted ears
    const earShape = new THREE.Shape();
    earShape.moveTo(0, -0.024);
    earShape.bezierCurveTo(0.018, -0.024, 0.024, 0.0, 0.018, 0.022);
    earShape.bezierCurveTo(0.01, 0.032, -0.008, 0.026, -0.008, 0.008);
    earShape.bezierCurveTo(-0.008, -0.01, -0.008, -0.024, 0, -0.024);
    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.007,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
    });
    earGeo.center();

    // Curved surgical mask + white elastic ear loops
    const maskGeo = createSurgicalMaskGeometry();
    const makeEarLoop = (side) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.088, -0.018, 0.026),
          new THREE.Vector3(side * 0.104, -0.01, -0.005),
          new THREE.Vector3(side * 0.11, -0.006, -0.026),
          new THREE.Vector3(side * 0.106, -0.034, -0.024),
          new THREE.Vector3(side * 0.095, -0.062, 0.005),
          new THREE.Vector3(side * 0.08, -0.078, 0.032),
        ]),
        20,
        0.0022,
        6,
        false
      );
    const earLoopLeftGeo = makeEarLoop(-1);
    const earLoopRightGeo = makeEarLoop(1);

    // Closed matte navy fleece hoodie torso + smooth sloped shoulders + mock-neck collar
    const torsoGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.156, 0.004),
        new THREE.Vector2(0.162, 0.048),
        new THREE.Vector2(0.172, 0.075),
        new THREE.Vector2(0.168, 0.17),
        new THREE.Vector2(0.178, 0.295),
        new THREE.Vector2(0.172, 0.35),
        new THREE.Vector2(0.154, 0.388),
        new THREE.Vector2(0.124, 0.418),
        new THREE.Vector2(0.084, 0.442),
        new THREE.Vector2(0.068, 0.495),
        new THREE.Vector2(0.052, 0.498),
      ],
      28
    );

    const hemGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.157, 0.0),
        new THREE.Vector2(0.165, 0.006),
        new THREE.Vector2(0.165, 0.052),
        new THREE.Vector2(0.158, 0.054),
      ],
      26
    );

    const zipperGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.012, 0.107),
        new THREE.Vector3(0, 0.08, 0.114),
        new THREE.Vector3(0, 0.2, 0.114),
        new THREE.Vector3(0, 0.33, 0.123),
        new THREE.Vector3(0, 0.415, 0.105),
        new THREE.Vector3(0, 0.452, 0.058),
        new THREE.Vector3(0, 0.492, 0.046),
      ]),
      22,
      0.0038,
      6,
      false
    );

    const makeDrawstring = (side) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.028, 0.46, 0.064),
          new THREE.Vector3(side * 0.036, 0.41, 0.11),
          new THREE.Vector3(side * 0.038, 0.34, 0.126),
          new THREE.Vector3(side * 0.037, 0.27, 0.124),
        ]),
        16,
        0.0038,
        6,
        false
      );
    const drawstringLeftGeo = makeDrawstring(-1);
    const drawstringRightGeo = makeDrawstring(1);

    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.112, 0.018);
    hoodShape.bezierCurveTo(-0.124, -0.046, -0.068, -0.08, 0, -0.082);
    hoodShape.bezierCurveTo(0.068, -0.08, 0.124, -0.046, 0.112, 0.018);
    hoodShape.bezierCurveTo(0.096, 0.05, 0.052, 0.054, 0, 0.048);
    hoodShape.bezierCurveTo(-0.052, 0.054, -0.096, 0.05, -0.112, 0.018);
    const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, {
      depth: 0.017,
      bevelEnabled: true,
      bevelThickness: 0.011,
      bevelSize: 0.011,
      bevelSegments: 4,
    });
    hoodGeo.center();

    const makePocketGeo = (side) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(side * 0.105, 0);
      s.lineTo(side * 0.122, 0.042);
      s.lineTo(side * 0.085, 0.128);
      s.lineTo(0, 0.128);
      s.closePath();
      return new THREE.ExtrudeGeometry(s, {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
    };
    const pocketLeftGeo = makePocketGeo(-1);
    const pocketRightGeo = makePocketGeo(1);

    const upperSleeveGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.048, -0.12),
        new THREE.Vector2(0.054, 0.0),
        new THREE.Vector2(0.06, 0.11),
        new THREE.Vector2(0.054, 0.13),
      ],
      18
    );
    const forearmSleeveGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.036, -0.095),
        new THREE.Vector2(0.043, -0.015),
        new THREE.Vector2(0.047, 0.095),
        new THREE.Vector2(0.043, 0.11),
      ],
      18
    );
    const cuffGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.031, -0.022),
        new THREE.Vector2(0.035, 0.0),
        new THREE.Vector2(0.0385, 0.022),
      ],
      16
    );

    const palmShape = new THREE.Shape();
    palmShape.moveTo(-0.021, 0.0);
    palmShape.lineTo(0.021, 0.0);
    palmShape.bezierCurveTo(0.029, -0.012, 0.03, -0.034, 0.026, -0.048);
    palmShape.bezierCurveTo(0.016, -0.055, -0.016, -0.055, -0.026, -0.048);
    palmShape.bezierCurveTo(-0.031, -0.032, -0.029, -0.012, -0.021, 0.0);
    const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
      depth: 0.011,
      bevelEnabled: true,
      bevelThickness: 0.0055,
      bevelSize: 0.004,
      bevelSegments: 3,
    });
    palmGeo.translate(0, 0, -0.0055);

    const thighGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.062, -0.19),
        new THREE.Vector2(0.072, -0.04),
        new THREE.Vector2(0.078, 0.14),
        new THREE.Vector2(0.072, 0.19),
      ],
      18
    );
    const calfGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.048, -0.19),
        new THREE.Vector2(0.056, -0.02),
        new THREE.Vector2(0.064, 0.16),
        new THREE.Vector2(0.058, 0.19),
      ],
      18
    );

    const soleShape = new THREE.Shape();
    soleShape.moveTo(-0.045, -0.085);
    soleShape.bezierCurveTo(-0.052, -0.01, -0.054, 0.075, -0.035, 0.125);
    soleShape.bezierCurveTo(-0.015, 0.15, 0.015, 0.15, 0.035, 0.125);
    soleShape.bezierCurveTo(0.054, 0.075, 0.052, -0.01, 0.045, -0.085);
    soleShape.bezierCurveTo(0.035, -0.112, -0.035, -0.112, -0.045, -0.085);
    const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.003,
      bevelSegments: 2,
    });
    soleGeo.rotateX(Math.PI / 2);

    const hairnetTex = createHairnetPleatTexture();
    const hairBumpTex = createHairBumpTexture();

    const materials = {
      // Unified warm natural matte skin across face, ears, neck & 5-finger hands
      skin: new THREE.MeshPhysicalMaterial({
        color: '#E8BC9E',
        roughness: 0.66,
        metalness: 0,
        sheen: 0.14,
        sheenRoughness: 0.85,
      }),
      // Matte dark chestnut brown hair (#3A2618) with subtle fine-strand relief
      hair: new THREE.MeshStandardMaterial({
        color: '#3A2618',
        roughness: 0.9,
        metalness: 0,
        bumpMap: hairBumpTex,
        bumpScale: 0.0014,
        side: THREE.DoubleSide,
      }),
      eyebrow: new THREE.MeshStandardMaterial({
        color: '#3A2618',
        roughness: 0.88,
        metalness: 0,
      }),
      sclera: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.18,
        metalness: 0,
      }),
      iris: new THREE.MeshStandardMaterial({
        color: '#4A2E1B',
        roughness: 0.16,
        metalness: 0,
      }),
      pupil: new THREE.MeshStandardMaterial({
        color: '#111318',
        roughness: 0.1,
        metalness: 0,
      }),
      catchlight: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      // Crisp white semi-translucent sanitary hairnet (dark-brown hair softly visible underneath)
      hairnet: new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        map: hairnetTex,
        bumpMap: hairnetTex,
        bumpScale: 0.0014,
        emissive: '#F5F7FA',
        emissiveIntensity: 0.08,
        transparent: true,
        opacity: 0.72,
        roughness: 0.88,
        metalness: 0,
        sheen: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      hairnetBand: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#F8FAFC',
        emissiveIntensity: 0.14,
        roughness: 0.84,
        metalness: 0,
      }),
      // Clean pastel sky-blue surgical mask (#CBE6F5)
      mask: new THREE.MeshPhysicalMaterial({
        color: '#CBE6F5',
        emissive: '#D8EEF9',
        emissiveIntensity: 0.08,
        roughness: 0.85,
        metalness: 0,
        sheen: 0.12,
        side: THREE.DoubleSide,
      }),
      maskStrap: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.82,
        metalness: 0,
      }),
      hoodie: new THREE.MeshPhysicalMaterial({
        color: '#25354D',
        roughness: 0.92,
        metalness: 0,
        sheen: 0.32,
        sheenRoughness: 0.85,
      }),
      hoodieRib: new THREE.MeshPhysicalMaterial({
        color: '#1E2B40',
        roughness: 0.94,
        metalness: 0,
        sheen: 0.24,
        sheenRoughness: 0.9,
      }),
      zipper: new THREE.MeshStandardMaterial({
        color: '#A8B0BA',
        metalness: 0.6,
        roughness: 0.35,
      }),
      pants: new THREE.MeshPhysicalMaterial({
        color: '#46474A',
        roughness: 0.94,
        metalness: 0,
        sheen: 0.2,
        sheenRoughness: 0.9,
      }),
      pantsPocket: new THREE.MeshPhysicalMaterial({
        color: '#3F4043',
        roughness: 0.95,
        metalness: 0,
        sheen: 0.18,
      }),
      sneaker: new THREE.MeshStandardMaterial({
        color: '#F3F4F6',
        roughness: 0.72,
        metalness: 0,
      }),
      sneakerSole: new THREE.MeshStandardMaterial({
        color: '#E4E7ED',
        roughness: 0.8,
        metalness: 0,
      }),
    };

    return {
      headGeo,
      neckGeo,
      hairnetGeo,
      hairnetBandGeo,
      hairGeo,
      browGeo,
      earGeo,
      maskGeo,
      earLoopLeftGeo,
      earLoopRightGeo,
      torsoGeo,
      hemGeo,
      zipperGeo,
      drawstringLeftGeo,
      drawstringRightGeo,
      hoodGeo,
      pocketLeftGeo,
      pocketRightGeo,
      upperSleeveGeo,
      forearmSleeveGeo,
      cuffGeo,
      palmGeo,
      thighGeo,
      calfGeo,
      soleGeo,
      materials,
    };
  }, []);
}

// Clean bright white hairnet, unified warm skin, smooth dark-brown hair & pastel sky-blue surgical mask
function CleanStudioHead({ assets, y, tiltX = 0.14, turnY = 0, fullerHair = false }) {
  const { materials: m } = assets;

  return (
    <group position={[0, y, 0.015]} rotation={[tiltX, turnY, 0]}>
      {/* Smooth warm-skin neck (exact same skin tone as head, ears & hands) */}
      <mesh geometry={assets.neckGeo} material={m.skin} position={[0, -0.125, -0.005]} castShadow />

      {/* Organic oval head */}
      <mesh
        geometry={assets.headGeo}
        material={m.skin}
        scale={HEAD_SCALE}
        castShadow
        receiveShadow
      />

      {/* Visible ears */}
      <mesh
        geometry={assets.earGeo}
        material={m.skin}
        position={[-0.104, -0.008, -0.006]}
        rotation={[0, -0.3, -0.08]}
        castShadow
      />
      <mesh
        geometry={assets.earGeo}
        material={m.skin}
        position={[0.104, -0.008, -0.006]}
        rotation={[0, Math.PI + 0.3, 0.08]}
        castShadow
      />

      {/* Expressive stylized 3D eyes + arched dark-brown eyebrows */}
      {[-1, 1].map((side) => (
        <group
          key={`eye-${side}`}
          position={[side * 0.039, 0.015, 0.095]}
          rotation={[0, side * 0.16, 0]}
        >
          <mesh material={m.sclera} scale={[1.05, 1.15, 0.58]}>
            <sphereGeometry args={[0.021, 14, 12]} />
          </mesh>
          <mesh material={m.iris} position={[0, 0, 0.0095]} scale={[1.0, 1.08, 0.52]}>
            <sphereGeometry args={[0.0135, 14, 12]} />
          </mesh>
          <mesh material={m.pupil} position={[0, 0, 0.0148]} scale={[1, 1, 0.48]}>
            <sphereGeometry args={[0.008, 10, 10]} />
          </mesh>
          <mesh material={m.catchlight} position={[0.0048, 0.0058, 0.0182]}>
            <sphereGeometry args={[0.0032, 8, 8]} />
          </mesh>
          <mesh
            geometry={assets.browGeo}
            material={m.eyebrow}
            position={[0, 0.035, 0.008]}
            scale={[side, 1, 1]}
          />
        </group>
      ))}

      {/* Continuous lower dark-brown hair (fringe, sideburns, behind ears & full nape) */}
      <mesh
        geometry={assets.hairGeo}
        material={m.hair}
        scale={fullerHair ? [1.01, 1.0, 1.01] : [1, 1, 1]}
        castShadow
      />

      {/* Exact concentric inner dark-brown hair dome filling 100% of the white hairnet (zero air bubble, zero poke-through) */}
      <mesh
        geometry={assets.hairnetGeo}
        material={m.hair}
        position={[0, 0.015, -0.006]}
        scale={fullerHair ? [0.955, 0.96, 0.975] : [0.938, 0.95, 0.958]}
      />

      {/* Crisp bright white semi-translucent bouffant sanitary hairnet */}
      <mesh
        geometry={assets.hairnetGeo}
        material={m.hairnet}
        position={[0, 0.018, -0.006]}
        scale={fullerHair ? [1.01, 1.02, 1.03] : [0.99, 1.01, 1.01]}
        castShadow
      />

      {/* Crisp bright white ruffled elastic hairnet band */}
      <mesh geometry={assets.hairnetBandGeo} material={m.hairnetBand} position={[0, 0.002, 0]} castShadow />

      {/* Clean pastel sky-blue pleated surgical mask + white ear loops */}
      <mesh geometry={assets.maskGeo} material={m.mask} castShadow receiveShadow />
      <mesh geometry={assets.earLoopLeftGeo} material={m.maskStrap} />
      <mesh geometry={assets.earLoopRightGeo} material={m.maskStrap} />
    </group>
  );
}

// Closed navy fleece hoodie torso
function ClosedHoodieTorso({ assets, slim = false }) {
  const { materials: m } = assets;
  return (
    <group scale={[slim ? 0.92 : 1.0, 1, 1]}>
      <mesh
        geometry={assets.torsoGeo}
        material={m.hoodie}
        scale={[1.0, 1.0, 0.66]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={assets.hemGeo}
        material={m.hoodie}
        position={[0, -0.008, 0]}
        scale={[1.01, 1.05, 0.67]}
        castShadow
      />
      <mesh geometry={assets.zipperGeo} material={m.zipper} />
      <RoundedBox
        args={[0.01, 0.022, 0.008]}
        radius={0.003}
        smoothness={2}
        position={[0, 0.48, 0.052]}
        rotation={[0.2, 0, 0]}
        material={m.zipper}
      />
      <mesh geometry={assets.drawstringLeftGeo} material={m.hoodieRib} />
      <mesh geometry={assets.drawstringRightGeo} material={m.hoodieRib} />
      <mesh
        geometry={assets.hoodGeo}
        material={m.hoodie}
        position={[0, 0.422, -0.084]}
        rotation={[0.45, 0, 0]}
        castShadow
      />
      <mesh
        geometry={assets.pocketLeftGeo}
        material={m.hoodie}
        position={[-0.01, 0.058, 0.104]}
        rotation={[0, -0.14, 0]}
        castShadow
      />
      <mesh
        geometry={assets.pocketRightGeo}
        material={m.hoodie}
        position={[0.01, 0.058, 0.104]}
        rotation={[0, 0.14, 0]}
        castShadow
      />
    </group>
  );
}

// Seamless articulated hoodie arm + ribbed cuff + 5-finger organic hand
function ArticulatedArm({ assets, side = -1, pose = 'standing', slim = false }) {
  const { materials: m } = assets;
  const xBase = side * (slim ? 0.142 : 0.158);
  const isSeated = pose === 'seated';

  return (
    <group position={[xBase, 0.372, 0.006]}>
      <mesh material={m.hoodie} scale={[0.84, 0.92, 0.88]} castShadow>
        <sphereGeometry args={[slim ? 0.044 : 0.048, 12, 12]} />
      </mesh>

      <group rotation={[isSeated ? -0.46 : -0.34, 0, side * -0.05]}>
        <mesh geometry={assets.upperSleeveGeo} material={m.hoodie} position={[0, -0.115, 0]} castShadow />

        <group position={[0, -0.22, 0]}>
          <mesh material={m.hoodie} castShadow>
            <sphereGeometry args={[slim ? 0.043 : 0.046, 12, 12]} />
          </mesh>

          <group rotation={[isSeated ? -1.44 : -0.92, 0, side * (isSeated ? 0.22 : 0.16)]}>
            <mesh geometry={assets.forearmSleeveGeo} material={m.hoodie} position={[0, -0.105, 0]} castShadow />
            <mesh geometry={assets.cuffGeo} material={m.hoodieRib} position={[0, -0.218, 0]} castShadow />

            <group position={[0, -0.236, 0.002]} rotation={[isSeated ? 0.22 : 0.34, side * -0.14, 0]}>
              <mesh material={m.skin} position={[0, 0.008, 0]} scale={[0.92, 0.65, 0.65]}>
                <sphereGeometry args={[0.019, 10, 8]} />
              </mesh>
              <mesh geometry={assets.palmGeo} material={m.skin} castShadow />

              <group position={[-side * 0.024, -0.016, 0.006]} rotation={[0.28, side * -0.32, -side * 0.56]}>
                <mesh material={m.skin} position={[0, -0.012, 0]} castShadow>
                  <capsuleGeometry args={[0.0072, 0.014, 5, 8]} />
                </mesh>
                <group position={[0, -0.023, 0]} rotation={[0.38, 0, side * 0.22]}>
                  <mesh material={m.skin} position={[0, -0.009, 0]} castShadow>
                    <capsuleGeometry args={[0.0062, 0.011, 5, 8]} />
                  </mesh>
                </group>
              </group>

              {[
                { name: 'index', offset: -0.019, len1: 0.017, len2: 0.013, r: 0.006, curl1: 0.28, curl2: 0.42 },
                { name: 'middle', offset: -0.006, len1: 0.019, len2: 0.014, r: 0.0062, curl1: 0.32, curl2: 0.46 },
                { name: 'ring', offset: 0.007, len1: 0.017, len2: 0.013, r: 0.0058, curl1: 0.36, curl2: 0.5 },
                { name: 'pinky', offset: 0.019, len1: 0.013, len2: 0.01, r: 0.005, curl1: 0.4, curl2: 0.52 },
              ].map((f) => (
                <group
                  key={f.name}
                  position={[side * f.offset, -0.048, 0.001]}
                  rotation={[f.curl1, 0, side * f.offset * 1.4]}
                >
                  <mesh material={m.skin} position={[0, -f.len1 * 0.5, 0]} castShadow>
                    <capsuleGeometry args={[f.r, f.len1, 5, 8]} />
                  </mesh>
                  <group position={[0, -f.len1 - 0.002, 0]} rotation={[f.curl2, 0, 0]}>
                    <mesh material={m.skin} position={[0, -f.len2 * 0.5, 0]} castShadow>
                      <capsuleGeometry args={[f.r * 0.86, f.len2, 5, 8]} />
                    </mesh>
                  </group>
                </group>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function WhiteSneaker({ assets, position }) {
  const { materials: m } = assets;
  return (
    <group position={position}>
      <mesh geometry={assets.soleGeo} material={m.sneakerSole} position={[0, 0.02, 0.02]} castShadow />
      <mesh material={m.sneaker} position={[0, 0.044, 0.018]} scale={[0.88, 0.62, 1.82]} castShadow receiveShadow>
        <sphereGeometry args={[0.056, 14, 12]} />
      </mesh>
      <mesh material={m.sneaker} position={[0, 0.068, -0.028]} castShadow>
        <cylinderGeometry args={[0.044, 0.048, 0.032, 14]} />
      </mesh>
      {[0.025, 0.044, 0.062].map((z, i) => (
        <RoundedBox
          key={i}
          args={[0.044 - i * 0.004, 0.005, 0.008]}
          radius={0.002}
          smoothness={2}
          position={[0, 0.072 - i * 0.006, z]}
          rotation={[0.32, 0, 0]}
          material={m.sneakerSole}
        />
      ))}
    </group>
  );
}

function SlimCargoPocket({ assets, side = 1, position, rotation = [0, 0, 0] }) {
  const { materials: m } = assets;
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.009, 0.138, 0.102]} radius={0.003} smoothness={2} material={m.pantsPocket} castShadow />
      <RoundedBox args={[0.003, 0.12, 0.006]} radius={0.001} smoothness={1} position={[side * 0.005, -0.006, 0]} material={m.pants} />
      <RoundedBox args={[0.011, 0.028, 0.106]} radius={0.003} smoothness={2} position={[side * 0.001, 0.056, 0]} material={m.pants} />
    </group>
  );
}

function StandingOperator({ assets, position, rotationY = 0, heightScale = 1, turnY = 0 }) {
  const { materials: m } = assets;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[1, heightScale, 1]}>
      <WhiteSneaker assets={assets} position={[-0.098, 0, 0.015]} />
      <WhiteSneaker assets={assets} position={[0.098, 0, 0.015]} />

      {[-1, 1].map((side) => (
        <group key={`leg-${side}`} position={[side * 0.098, 0, 0]}>
          <mesh geometry={assets.calfGeo} material={m.pants} position={[0, 0.27, 0]} castShadow receiveShadow />
          <mesh material={m.pants} position={[0, 0.46, 0.004]} castShadow>
            <sphereGeometry args={[0.06, 12, 10]} />
          </mesh>
          <mesh geometry={assets.thighGeo} material={m.pants} position={[0, 0.65, 0.004]} castShadow receiveShadow />
          <SlimCargoPocket assets={assets} side={side} position={[side * 0.068, 0.58, 0.004]} />
        </group>
      ))}

      <mesh material={m.pants} position={[0, 0.855, 0]} scale={[1.04, 0.65, 0.68]} castShadow>
        <sphereGeometry args={[0.158, 16, 12]} />
      </mesh>

      <group position={[0, 0.895, 0]} rotation={[0.16, 0, 0]}>
        <ClosedHoodieTorso assets={assets} />
        <ArticulatedArm assets={assets} side={-1} pose="standing" />
        <ArticulatedArm assets={assets} side={1} pose="standing" />
        <CleanStudioHead assets={assets} y={0.62} tiltX={0.22} turnY={turnY} />
      </group>
    </group>
  );
}

function SeatedOperator({ assets, position, rotationY = 0 }) {
  const { materials: m } = assets;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <WhiteSneaker assets={assets} position={[-0.094, 0, 0.32]} />
      <WhiteSneaker assets={assets} position={[0.094, 0, 0.32]} />

      {[-1, 1].map((side) => (
        <group key={`sleg-${side}`} position={[side * 0.094, 0, 0]}>
          <mesh geometry={assets.calfGeo} material={m.pants} position={[0, 0.27, 0.295]} rotation={[0.08, 0, 0]} castShadow />
          <mesh material={m.pants} position={[0, 0.485, 0.282]} castShadow>
            <sphereGeometry args={[0.064, 12, 10]} />
          </mesh>
          <mesh geometry={assets.thighGeo} material={m.pants} position={[0, 0.505, 0.115]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          <SlimCargoPocket assets={assets} side={side} position={[side * 0.066, 0.505, 0.14]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}

      <mesh material={m.pants} position={[0, 0.525, -0.025]} scale={[1.0, 0.62, 0.72]} castShadow>
        <sphereGeometry args={[0.155, 16, 12]} />
      </mesh>

      <group position={[0, 0.56, -0.025]} rotation={[0.11, 0, 0]}>
        <ClosedHoodieTorso assets={assets} slim />
        <ArticulatedArm assets={assets} side={-1} pose="seated" slim />
        <ArticulatedArm assets={assets} side={1} pose="seated" slim />
        <CleanStudioHead assets={assets} y={0.615} tiltX={0.14} fullerHair />
      </group>
    </group>
  );
}

export default function Operators() {
  const assets = useCharacterAssets();

  return (
    <group name="room-operators">
      {/* 1. Seated operator typing cleanly on Zebra ZT411 keyboard */}
      <SeatedOperator
        assets={assets}
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
      />

      {/* 2-4. Three standing operators handling bags along the 4.0 m Embolsado bench */}
      <StandingOperator
        assets={assets}
        position={[0.96, 0, -1.28]}
        rotationY={Math.PI / 2}
        heightScale={1.01}
        turnY={0.08}
      />
      <StandingOperator
        assets={assets}
        position={[0.96, 0, -0.42]}
        rotationY={Math.PI / 2}
        heightScale={0.99}
        turnY={-0.06}
      />
      <StandingOperator
        assets={assets}
        position={[0.96, 0, 0.44]}
        rotationY={Math.PI / 2}
        heightScale={1.0}
        turnY={0.05}
      />

      {/* 5. Standing operator handling bags at Seedless front table */}
      <StandingOperator
        assets={assets}
        position={[0.45, 0, 1.02]}
        rotationY={0}
        heightScale={0.99}
        turnY={-0.04}
      />
    </group>
  );
}
