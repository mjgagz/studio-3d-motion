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
  // Low sanitary coverage: forehead +0.072, right over ears +0.018, low over back/nape -0.078
  return 0.072 - (1 - Math.cos(a)) * 0.075 + Math.abs(Math.sin(a)) * 0.021;
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Trim lower hairline peeking neatly (~1.5 cm) below the low-covering sanitary hairnet
function hairLowY(a) {
  const d = (Math.abs(a) * 180) / Math.PI;
  const front = 0.058; // slim fringe edge right above eyebrows
  const sideburn = -0.012; // short neat sideburn right in front of ear
  const behindEar = -0.02; // hugs tightly behind ear root
  const nape = -0.096; // slim neat nape rim just below the low hairnet band
  let y = front;
  y += (sideburn - front) * smooth(38, 58, d);
  y += (behindEar - sideburn) * smooth(74, 86, d);
  y += (nape - behindEar) * smooth(96, 120, d);
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

// Build a single continuous variable-radius organic sleeve along a 3D CatmullRomCurve3
// (eliminates shoulder horns, elbow ball-joints, and sleeve-to-cuff seams completely)
function createOrganicSleeveGeometry(curve, radiusFn, tubularSegs = 28, radialSegs = 18) {
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const center = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = radiusFn(t);

    for (let j = 0; j <= radialSegs; j++) {
      const v = (j / radialSegs) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      const px = center.x + r * (cos * N.x + sin * B.x);
      const py = center.y + r * (cos * N.y + sin * B.y);
      const pz = center.z + r * (cos * N.z + sin * B.z);
      positions.push(px, py, pz);
      uvs.push(t, j / radialSegs);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Build a SINGLE continuous, anatomically tapered human finger along an arched 3D curve
// (elliptical cross-section, subtle knuckle swells, smooth rounded fingertip — zero sausage-link beads)
function createOrganicFingerGeometry(curve, rBase, rTip, tubularSegs = 22, radialSegs = 14) {
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const center = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Smooth human finger taper + subtle natural PIP/DIP joint contours + rounded hemispherical tip
    let r = rBase + (rTip - rBase) * Math.pow(t, 0.85);
    // Subtle anatomical joint fullness at ~0.38 and ~0.72
    r *= 1 + Math.exp(-Math.pow((t - 0.38) / 0.08, 2)) * 0.045;
    r *= 1 + Math.exp(-Math.pow((t - 0.72) / 0.07, 2)) * 0.03;
    // Smooth rounded dome at fingertip (t > 0.88)
    if (t > 0.88) {
      const capT = (t - 0.88) / 0.12;
      r *= Math.sqrt(Math.max(0.0001, 1 - capT * capT));
    }

    // Elliptical human finger cross-section (slightly wider side-to-side, slightly flatter palmar/dorsal)
    const rN = r * 0.88;
    const rB = r * 1.06;

    for (let j = 0; j <= radialSegs; j++) {
      const v = (j / radialSegs) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      const px = center.x + cos * rN * N.x + sin * rB * B.x;
      const py = center.y + cos * rN * N.y + sin * rB * B.y;
      const pz = center.z + cos * rN * N.z + sin * rB * B.z;
      positions.push(px, py, pz);
      uvs.push(t, j / radialSegs);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
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

    // Clean bright white bouffant hairnet reaching low over the nape and clamped cleanly to the elastic band
    const hairnetPts = [
      new THREE.Vector2(0.088, -0.098),
      new THREE.Vector2(0.104, -0.052),
      new THREE.Vector2(0.114, -0.008),
      new THREE.Vector2(0.12, 0.036),
      new THREE.Vector2(0.122, 0.078),
      new THREE.Vector2(0.112, 0.118),
      new THREE.Vector2(0.082, 0.145),
      new THREE.Vector2(0.038, 0.156),
      new THREE.Vector2(0.0, 0.158),
    ];
    const hairnetGeo = new THREE.LatheGeometry(hairnetPts, 36);
    const hnPos = hairnetGeo.attributes.position;
    for (let i = 0; i < hnPos.count; i++) {
      const vx = hnPos.getX(i);
      const vy = hnPos.getY(i);
      const vz = hnPos.getZ(i);
      const ang = Math.atan2(vx, vz);
      const puff = 1 + Math.sin(ang * 18) * 0.01 * Math.min(1, Math.max(0, (vy + 0.08) / 0.16));
      const limit = bandBaseY(ang) + 0.002 - 0.018;
      let ny = vy;
      let k = puff;
      if (vy < limit) {
        ny = limit;
        const rr = Math.hypot(vx, vz) || 1;
        const need = headRadiusAt(limit + 0.018) + 0.011;
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

    // Closed matte navy fleece hoodie torso + natural softly sloped shoulders + mock-neck collar
    const torsoGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.156, 0.004),
        new THREE.Vector2(0.162, 0.048),
        new THREE.Vector2(0.17, 0.08),
        new THREE.Vector2(0.166, 0.175),
        new THREE.Vector2(0.172, 0.29),
        new THREE.Vector2(0.164, 0.345),
        new THREE.Vector2(0.144, 0.386),
        new THREE.Vector2(0.116, 0.418),
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
        new THREE.Vector3(0, 0.012, 0.104),
        new THREE.Vector3(0, 0.08, 0.11),
        new THREE.Vector3(0, 0.2, 0.108),
        new THREE.Vector3(0, 0.32, 0.111),
        new THREE.Vector3(0, 0.4, 0.092),
        new THREE.Vector3(0, 0.448, 0.056),
        new THREE.Vector3(0, 0.492, 0.045),
      ]),
      22,
      0.0036,
      6,
      false
    );

    const makeDrawstring = (side) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.026, 0.456, 0.058),
          new THREE.Vector3(side * 0.034, 0.405, 0.096),
          new THREE.Vector3(side * 0.036, 0.335, 0.112),
          new THREE.Vector3(side * 0.035, 0.27, 0.112),
        ]),
        16,
        0.0035,
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

    // Continuous organic sleeves + ribbed cuffs (deeply seated into torso shoulders, hands calibrated above desks/tables)
    const makeArmSet = (side, isSeated) => {
      const s = side;
      const pts = isSeated
        ? [
            new THREE.Vector3(s * 0.086, 0.362, -0.005), // rooted deeply inside torso shoulder (zero armpit gap)
            new THREE.Vector3(s * 0.142, 0.346, 0.014),  // sleek natural deltoid (no shoulder-pad bulge)
            new THREE.Vector3(s * 0.168, 0.258, 0.088),  // upper arm angling forward
            new THREE.Vector3(s * 0.164, 0.238, 0.182),  // relaxed bent elbow above chair/desk height
            new THREE.Vector3(s * 0.138, 0.285, 0.292),  // forearm reaching cleanly above desktop
            new THREE.Vector3(s * 0.112, 0.312, 0.388),  // wrist at world Y ~0.83m (fingers hover right over 0.78m keys)
          ]
        : [
            new THREE.Vector3(s * 0.092, 0.364, -0.005), // rooted deeply inside torso shoulder (zero armpit gap)
            new THREE.Vector3(s * 0.15, 0.345, 0.016),   // sleek natural deltoid (no shoulder-pad bulge)
            new THREE.Vector3(s * 0.174, 0.236, 0.074),  // upper arm close to body
            new THREE.Vector3(s * 0.168, 0.168, 0.152),  // natural bent elbow (~35°)
            new THREE.Vector3(s * 0.144, 0.138, 0.254),  // forearm angled gently toward zip bags
            new THREE.Vector3(s * 0.118, 0.118, 0.348),  // wrist at world Y ~0.955m (hands rest cleanly over 0.86m bags)
          ];

      const fullCurve = new THREE.CatmullRomCurve3(pts);
      const sleevePts = Array.from({ length: 18 }, (_, i) => fullCurve.getPointAt((i / 17) * 0.88));
      const cuffPts = Array.from({ length: 6 }, (_, i) => fullCurve.getPointAt(0.87 + (i / 5) * 0.13));

      const sleeveCurve = new THREE.CatmullRomCurve3(sleevePts);
      const cuffCurve = new THREE.CatmullRomCurve3(cuffPts);

      const sleeveRadius = (t) => {
        // Sleek natural hoodie sleeve taper (no bulbous shoulder cap)
        if (t < 0.2) return 0.044 + (t / 0.2) * 0.006;
        if (t < 0.55) return 0.05 - ((t - 0.2) / 0.35) * 0.007;
        return 0.043 - ((t - 0.55) / 0.45) * 0.008;
      };
      const cuffRadius = (t) => 0.035 - t * 0.005;

      const sleeveGeo = createOrganicSleeveGeometry(sleeveCurve, sleeveRadius, 24, 18);
      const cuffGeo = createOrganicSleeveGeometry(cuffCurve, cuffRadius, 8, 16);

      const wristPos = fullCurve.getPointAt(1.0);
      const wristTan = fullCurve.getTangentAt(1.0).normalize();
      const handQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), wristTan);

      return { sleeveGeo, cuffGeo, wristPos, handQuat };
    };

    const armsStanding = {
      left: makeArmSet(-1, false),
      right: makeArmSet(1, false),
    };
    const armsSeated = {
      left: makeArmSet(-1, true),
      right: makeArmSet(1, true),
    };

    // Sculpted organic human palm (narrow tapered wrist -> fuller metacarpals -> smooth knuckle arch)
    const palmShape = new THREE.Shape();
    palmShape.moveTo(-0.02, 0.006);
    palmShape.lineTo(0.02, 0.006);
    palmShape.bezierCurveTo(0.028, -0.01, 0.031, -0.036, 0.026, -0.052);
    palmShape.bezierCurveTo(0.014, -0.059, -0.014, -0.059, -0.026, -0.052);
    palmShape.bezierCurveTo(-0.031, -0.034, -0.028, -0.01, -0.02, 0.006);
    const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.0065,
      bevelSize: 0.0045,
      bevelSegments: 4,
    });
    palmGeo.translate(0, 0, -0.006);

    // Continuous sculpted organic fingers curving DOWNWARD toward palm/keys/bags (local -Z maps to world -Y)
    const makeContinuousFinger = (length, rBase, rTip, arch) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.005, 0.0),
        new THREE.Vector3(0, -length * 0.36, -length * 0.06 * arch),
        new THREE.Vector3(0, -length * 0.72, -length * 0.22 * arch),
        new THREE.Vector3(0, -length * 0.94, -length * 0.4 * arch),
        new THREE.Vector3(0, -length, -length * 0.47 * arch),
      ]);
      const geo = createOrganicFingerGeometry(curve, rBase, rTip, 20, 14);
      const nailPos = curve.getPointAt(0.86);
      const nailTan = curve.getTangentAt(0.86).normalize();
      const nailQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), nailTan);
      return { geo, nailPos, nailQuat, nailW: rTip * 1.4, nailL: length * 0.19, nailOff: rTip * 0.78 };
    };

    const fingersStanding = {
      index: makeContinuousFinger(0.056, 0.0066, 0.0046, 0.65),
      middle: makeContinuousFinger(0.062, 0.0069, 0.0048, 0.72),
      ring: makeContinuousFinger(0.057, 0.0065, 0.0045, 0.78),
      pinky: makeContinuousFinger(0.045, 0.0055, 0.0039, 0.84),
      thumb: makeContinuousFinger(0.043, 0.0082, 0.0058, 0.52),
    };
    const fingersSeated = {
      index: makeContinuousFinger(0.056, 0.0066, 0.0046, 0.92),
      middle: makeContinuousFinger(0.062, 0.0069, 0.0048, 1.02),
      ring: makeContinuousFinger(0.057, 0.0065, 0.0045, 1.08),
      pinky: makeContinuousFinger(0.045, 0.0055, 0.0039, 1.12),
      thumb: makeContinuousFinger(0.043, 0.0082, 0.0058, 0.62),
    };

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
      // Unified warm natural matte skin across face, ears, neck & human hands
      skin: new THREE.MeshPhysicalMaterial({
        color: '#E8BC9E',
        roughness: 0.66,
        metalness: 0,
        sheen: 0.14,
        sheenRoughness: 0.85,
      }),
      // Subtle natural fingernail tone
      nail: new THREE.MeshStandardMaterial({
        color: '#F3D2C1',
        roughness: 0.36,
        metalness: 0,
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
      armsStanding,
      armsSeated,
      palmGeo,
      fingersStanding,
      fingersSeated,
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
        position={[0, -0.022, 0]}
        scale={[1.02, 1.32, 0.69]}
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

// Continuous organic hoodie arm + ribbed cuff + continuous sculpted human 5-finger hand with subtle fingernails
function ArticulatedArm({ assets, side = -1, pose = 'standing', slim = false }) {
  const { materials: m } = assets;
  const isSeated = pose === 'seated';
  const armSet = isSeated ? assets.armsSeated : assets.armsStanding;
  const arm = side === -1 ? armSet.left : armSet.right;
  const fSet = isSeated ? assets.fingersSeated : assets.fingersStanding;

  const fingerSpecs = [
    { key: 'index', data: fSet.index, x: -0.02, y: -0.052, splay: -0.09 },
    { key: 'middle', data: fSet.middle, x: -0.0065, y: -0.055, splay: -0.015 },
    { key: 'ring', data: fSet.ring, x: 0.007, y: -0.053, splay: 0.055 },
    { key: 'pinky', data: fSet.pinky, x: 0.0195, y: -0.049, splay: 0.13 },
  ];

  return (
    <group scale={[slim ? 0.94 : 1, 1, 1]}>
      {/* Single continuous organic fleece sleeve */}
      <mesh geometry={arm.sleeveGeo} material={m.hoodie} castShadow receiveShadow />
      {/* Seamless ribbed elastic wrist cuff */}
      <mesh geometry={arm.cuffGeo} material={m.hoodieRib} castShadow />

      {/* Anatomical human 5-finger hand aligned smoothly to wrist direction (local +Z = dorsal top, local -Z = palm down) */}
      <group position={arm.wristPos} quaternion={arm.handQuat}>
        <group rotation={[isSeated ? -0.18 : -0.14, side * (isSeated ? -0.18 : -0.26), 0]}>
          {/* Smooth tapered wrist entering the ribbed cuff */}
          <mesh material={m.skin} position={[0, 0.008, 0]} scale={[1.0, 1.0, 0.72]} castShadow>
            <cylinderGeometry args={[0.021, 0.024, 0.028, 14]} />
          </mesh>

          {/* Organic beveled palm */}
          <mesh geometry={assets.palmGeo} material={m.skin} castShadow receiveShadow />

          {/* Soft thenar muscle pad on true PALM underside (local -Z, never on top of hand) */}
          <mesh
            material={m.skin}
            position={[-side * 0.017, -0.022, -0.007]}
            scale={[0.85, 1.25, 0.65]}
            castShadow
          >
            <sphereGeometry args={[0.015, 12, 10]} />
          </mesh>

          {/* Continuous sculpted opposable thumb curving gently downward/inward + dorsal nail on +Z */}
          <group
            position={[-side * 0.023, -0.024, -0.004]}
            rotation={[isSeated ? -0.14 : -0.1, side * -0.35, -side * 0.56]}
          >
            <mesh geometry={fSet.thumb.geo} material={m.skin} castShadow />
            <group position={fSet.thumb.nailPos} quaternion={fSet.thumb.nailQuat}>
              <mesh
                material={m.nail}
                position={[0, 0, fSet.thumb.nailOff]}
                scale={[1, 1.22, 0.32]}
              >
                <sphereGeometry args={[fSet.thumb.nailW * 0.5, 8, 8]} />
              </mesh>
            </group>
          </group>

          {/* Four continuous sculpted human fingers curving DOWNWARD + dorsal fingernails on top (+Z) */}
          {fingerSpecs.map((f) => (
            <group
              key={f.key}
              position={[side * f.x, f.y, -0.001]}
              rotation={[-0.08, 0, side * f.splay]}
            >
              <mesh geometry={f.data.geo} material={m.skin} castShadow />
              <group position={f.data.nailPos} quaternion={f.data.nailQuat}>
                <mesh
                  material={m.nail}
                  position={[0, 0, f.data.nailOff]}
                  scale={[1, 1.32, 0.3]}
                >
                  <sphereGeometry args={[f.data.nailW * 0.48, 8, 8]} />
                </mesh>
              </group>
            </group>
          ))}
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

      <mesh material={m.pants} position={[0, 0.875, 0]} scale={[1.12, 0.82, 0.76]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
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
