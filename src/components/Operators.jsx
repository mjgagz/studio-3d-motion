import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

// Create procedural radial pleat texture for the translucent sanitary hairnet
function createHairnetPleatTexture() {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f5f7fa';
  ctx.fillRect(0, 0, size, size);

  const pleats = 36;
  for (let i = 0; i < pleats; i++) {
    const x = (i / pleats) * size;
    const w = size / pleats;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#eaeef3');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(1, '#eaeef3');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Build anatomical curved surgical mask mesh hugging nose bridge, cheeks, and chin
function createSurgicalMaskGeometry() {
  const segU = 22;
  const segV = 14;
  const geom = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV; // 0 = top (nose bridge), 1 = bottom (under chin)
    // Vertical curve from nose bridge (-0.002) down under chin (-0.106)
    const y = -0.002 - v * 0.104;
    // Slight inward tuck at nose and under chin
    const chinTuck = Math.sin(v * Math.PI);
    const radiusZ = 0.098 + chinTuck * 0.02 + (v < 0.25 ? (0.25 - v) * 0.025 : 0);
    const radiusX = 0.096 + chinTuck * 0.006 - v * 0.012;

    // 3 horizontal pleats in subtle relief
    const pleatWave =
      Math.exp(-Math.pow((v - 0.28) / 0.045, 2)) * 0.0038 +
      Math.exp(-Math.pow((v - 0.52) / 0.045, 2)) * 0.0042 +
      Math.exp(-Math.pow((v - 0.74) / 0.045, 2)) * 0.0036;

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU; // 0 = left cheek, 1 = right cheek
      const theta = (u - 0.5) * Math.PI * 0.94; // wrap ~170 deg around front face
      // Subtle nose bridge peak at center top
      const nosePeak = Math.exp(-Math.pow((u - 0.5) / 0.16, 2)) * Math.exp(-Math.pow(v / 0.35, 2)) * 0.01;
      const rX = radiusX + pleatWave * 0.4;
      const rZ = radiusZ + pleatWave + nosePeak;

      const x = Math.sin(theta) * rX;
      const z = Math.cos(theta) * rZ + 0.006;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * (segU + 1) + iu;
      const b = a + 1;
      const c = a + (segU + 1);
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// Build all shared organic geometries & materials once for high FPS across all 5 operators
function useCharacterAssets() {
  return useMemo(() => {
    // 1. Organic oval head LatheGeometry (soft cheekbones + tapered chin)
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

    // Neck LatheGeometry
    const neckPts = [
      new THREE.Vector2(0.054, -0.055),
      new THREE.Vector2(0.044, -0.015),
      new THREE.Vector2(0.041, 0.032),
      new THREE.Vector2(0.044, 0.055),
    ];
    const neckGeo = new THREE.LatheGeometry(neckPts, 18);

    // 2. Closer-fitting bouffant sanitary hairnet LatheGeometry (~15% slimmer volume)
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
    // Very subtle radial puffiness displacement
    const hnPos = hairnetGeo.attributes.position;
    for (let i = 0; i < hnPos.count; i++) {
      const vx = hnPos.getX(i);
      const vy = hnPos.getY(i);
      const vz = hnPos.getZ(i);
      const angle = Math.atan2(vx, vz);
      const puff = 1 + Math.sin(angle * 18) * 0.01 * Math.min(1, Math.max(0, (vy + 0.01) / 0.11));
      hnPos.setXYZ(i, vx * puff, vy, vz * puff);
    }
    hairnetGeo.computeVertexNormals();

    // Ruffled elastic hairnet band (wavy closed TubeGeometry around upper forehead, above ears, nape)
    const bandPts = [];
    const bandSamples = 64;
    for (let i = 0; i < bandSamples; i++) {
      const a = (i / bandSamples) * Math.PI * 2;
      const ruffle = Math.sin(a * 28) * 0.0028;
      const rX = 0.106 + ruffle;
      const rZ = 0.108 + ruffle;
      // Sit neatly on upper forehead above eyebrows, clear ears, hug nape cleanly
      const y = 0.068 - (1 - Math.cos(a)) * 0.052 + Math.abs(Math.sin(a)) * 0.012 + Math.sin(a * 28) * 0.0018;
      bandPts.push(new THREE.Vector3(Math.sin(a) * rX, y, Math.cos(a) * rZ - 0.008));
    }
    const bandCurve = new THREE.CatmullRomCurve3(bandPts, true);
    const hairnetBandGeo = new THREE.TubeGeometry(bandCurve, 72, 0.008, 8, true);

    // 2b. Organic layered hair strands peeking below the hairnet elastic band (#2E1E15)
    // Tapered fringe / bangs locks emerging across upper forehead (above eyebrows)
    const makeHairStrandGeo = (pts, radius = 0.011) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, 12, radius, 8, false);
      // Taper tip smoothly toward the end of each lock
      const pos = geo.attributes.position;
      const radialSegs = 8;
      const tubularSegs = 12;
      for (let i = 0; i <= tubularSegs; i++) {
        const t = i / tubularSegs;
        const center = curve.getPointAt(t);
        // Taper at both root (slight) and tip (pointed organic lock)
        const scale = t < 0.2 ? 0.85 + t * 0.75 : Math.max(0.18, 1 - Math.pow((t - 0.2) / 0.8, 1.5) * 0.82);
        for (let j = 0; j <= radialSegs; j++) {
          const idx = i * (radialSegs + 1) + j;
          const vx = pos.getX(idx);
          const vy = pos.getY(idx);
          const vz = pos.getZ(idx);
          pos.setXYZ(
            idx,
            center.x + (vx - center.x) * scale,
            center.y + (vy - center.y) * scale * 0.65, // flatten slightly like natural hair ribbon
            center.z + (vz - center.z) * scale
          );
        }
      }
      geo.computeVertexNormals();
      return geo;
    };

    const fringeLocks = [
      makeHairStrandGeo([
        new THREE.Vector3(-0.072, 0.072, 0.076),
        new THREE.Vector3(-0.068, 0.058, 0.088),
        new THREE.Vector3(-0.056, 0.044, 0.095),
      ], 0.013),
      makeHairStrandGeo([
        new THREE.Vector3(-0.042, 0.075, 0.088),
        new THREE.Vector3(-0.036, 0.062, 0.098),
        new THREE.Vector3(-0.022, 0.049, 0.103),
      ], 0.014),
      makeHairStrandGeo([
        new THREE.Vector3(-0.008, 0.076, 0.092),
        new THREE.Vector3(-0.002, 0.063, 0.102),
        new THREE.Vector3(0.01, 0.05, 0.105),
      ], 0.014),
      makeHairStrandGeo([
        new THREE.Vector3(0.028, 0.075, 0.09),
        new THREE.Vector3(0.035, 0.061, 0.099),
        new THREE.Vector3(0.045, 0.048, 0.101),
      ], 0.014),
      makeHairStrandGeo([
        new THREE.Vector3(0.06, 0.072, 0.082),
        new THREE.Vector3(0.068, 0.057, 0.09),
        new THREE.Vector3(0.074, 0.044, 0.09),
      ], 0.013),
    ];

    // Elongated sculpted sideburns curving down in front of both ears
    const makeSideburnGeo = (side) =>
      makeHairStrandGeo([
        new THREE.Vector3(side * 0.096, 0.058, 0.034),
        new THREE.Vector3(side * 0.101, 0.026, 0.028),
        new THREE.Vector3(side * 0.098, -0.006, 0.02),
        new THREE.Vector3(side * 0.092, -0.03, 0.012),
      ], 0.014);
    const sideburnLeftGeo = makeSideburnGeo(-1);
    const sideburnRightGeo = makeSideburnGeo(1);

    // Fuller layered nape hair locks curving smoothly along the back of the head & upper neck
    const napeLocks = [-0.078, -0.052, -0.026, 0.0, 0.026, 0.052, 0.078].map((x, idx) => {
      const edgeFactor = Math.abs(x) / 0.08;
      const zBase = -0.096 + edgeFactor * 0.038;
      const drop = -0.078 + edgeFactor * 0.016 - (idx % 2) * 0.008;
      return makeHairStrandGeo([
        new THREE.Vector3(x * 1.05, 0.034, zBase),
        new THREE.Vector3(x * 1.02, -0.016, zBase - 0.01),
        new THREE.Vector3(x * 0.94, drop, zBase + 0.004),
      ], 0.017);
    });

    // Sculpted organic palm ExtrudeGeometry (narrow at wrist, wider at knuckles, soft bevel)
    const palmShape = new THREE.Shape();
    palmShape.moveTo(-0.021, 0.0);       // wrist left
    palmShape.lineTo(0.021, 0.0);        // wrist right
    palmShape.bezierCurveTo(0.029, -0.012, 0.03, -0.034, 0.026, -0.048); // outer palm edge
    palmShape.bezierCurveTo(0.016, -0.055, -0.016, -0.055, -0.026, -0.048); // knuckle ridge
    palmShape.bezierCurveTo(-0.031, -0.032, -0.029, -0.012, -0.021, 0.0); // thumb side
    const palmGeo = new THREE.ExtrudeGeometry(palmShape, {
      depth: 0.011,
      bevelEnabled: true,
      bevelThickness: 0.0055,
      bevelSize: 0.004,
      bevelSegments: 3,
    });
    palmGeo.translate(0, 0, -0.0055);

    // Eyebrow arched TubeGeometry (left and right mirrored)
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.021, -0.002, -0.003),
      new THREE.Vector3(-0.007, 0.0055, 0.003),
      new THREE.Vector3(0.01, 0.0045, 0.002),
      new THREE.Vector3(0.022, -0.001, -0.004),
    ]);
    const browGeo = new THREE.TubeGeometry(browCurve, 12, 0.0052, 8, false);

    // Ear ExtrudeGeometry with soft bevel
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

    // 3. Anatomical curved surgical mask + ear loops
    const maskGeo = createSurgicalMaskGeometry();

    const makeEarLoop = (side) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.088, -0.018, 0.026),
        new THREE.Vector3(side * 0.104, -0.01, -0.005),
        new THREE.Vector3(side * 0.11, -0.006, -0.026),
        new THREE.Vector3(side * 0.106, -0.034, -0.024),
        new THREE.Vector3(side * 0.095, -0.062, 0.005),
        new THREE.Vector3(side * 0.08, -0.078, 0.032),
      ]);
      return new THREE.TubeGeometry(curve, 20, 0.0022, 6, false);
    };
    const earLoopLeftGeo = makeEarLoop(-1);
    const earLoopRightGeo = makeEarLoop(1);

    // 4. Closed navy fleece hoodie torso (single-piece LatheGeometry: ribbed hem -> torso -> rounded shoulders -> mock-neck)
    const torsoPts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.156, 0.004),
      new THREE.Vector2(0.162, 0.048), // top of ribbed waist hem
      new THREE.Vector2(0.172, 0.075), // soft fleece blouse above hem
      new THREE.Vector2(0.168, 0.17),  // gentle waist taper
      new THREE.Vector2(0.184, 0.305), // chest fullness
      new THREE.Vector2(0.188, 0.38),  // rounded upper shoulder line
      new THREE.Vector2(0.152, 0.422), // shoulder slope
      new THREE.Vector2(0.082, 0.442), // base of mock-neck
      new THREE.Vector2(0.068, 0.492), // top of closed mock-neck collar
      new THREE.Vector2(0.052, 0.495),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPts, 28);

    // Ribbed waist hem band (LatheGeometry)
    const hemPts = [
      new THREE.Vector2(0.157, 0.002),
      new THREE.Vector2(0.165, 0.006),
      new THREE.Vector2(0.165, 0.05),
      new THREE.Vector2(0.158, 0.052),
    ];
    const hemGeo = new THREE.LatheGeometry(hemPts, 26);

    // Center front metallic zipper following torso front curvature
    const zipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.012, 0.107),
      new THREE.Vector3(0, 0.08, 0.114),
      new THREE.Vector3(0, 0.2, 0.114),
      new THREE.Vector3(0, 0.33, 0.123),
      new THREE.Vector3(0, 0.415, 0.105),
      new THREE.Vector3(0, 0.452, 0.058),
      new THREE.Vector3(0, 0.49, 0.046),
    ]);
    const zipperGeo = new THREE.TubeGeometry(zipCurve, 22, 0.0038, 6, false);

    // Parallel hanging navy hoodie drawstrings
    const makeDrawstring = (side) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.028, 0.458, 0.064),
        new THREE.Vector3(side * 0.036, 0.41, 0.11),
        new THREE.Vector3(side * 0.038, 0.34, 0.126),
        new THREE.Vector3(side * 0.037, 0.27, 0.124),
      ]);
      return new THREE.TubeGeometry(curve, 16, 0.0038, 6, false);
    };
    const drawstringLeftGeo = makeDrawstring(-1);
    const drawstringRightGeo = makeDrawstring(1);

    // Flat folded hood resting snug behind neck & shoulder blades (~30% thinner)
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

    // Front kangaroo pocket halves (ExtrudeGeometry with diagonal side entry)
    const makePocketGeo = (side) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(side * 0.105, 0);
      s.lineTo(side * 0.122, 0.042);
      s.lineTo(side * 0.085, 0.128);
      s.lineTo(0, 0.128);
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
      return g;
    };
    const pocketLeftGeo = makePocketGeo(-1);
    const pocketRightGeo = makePocketGeo(1);

    // Tapered sleeve segments (LatheGeometry)
    const upperSleevePts = [
      new THREE.Vector2(0.048, -0.12),
      new THREE.Vector2(0.054, 0.0),
      new THREE.Vector2(0.062, 0.11),
      new THREE.Vector2(0.056, 0.13),
    ];
    const upperSleeveGeo = new THREE.LatheGeometry(upperSleevePts, 18);

    const forearmSleevePts = [
      new THREE.Vector2(0.036, -0.115),
      new THREE.Vector2(0.044, -0.02),
      new THREE.Vector2(0.049, 0.1),
      new THREE.Vector2(0.044, 0.115),
    ];
    const forearmSleeveGeo = new THREE.LatheGeometry(forearmSleevePts, 18);

    // Ribbed wrist cuff
    const cuffPts = [
      new THREE.Vector2(0.032, -0.024),
      new THREE.Vector2(0.036, 0.0),
      new THREE.Vector2(0.037, 0.024),
    ];
    const cuffGeo = new THREE.LatheGeometry(cuffPts, 16);

    // 5. Tapered cargo pant leg segments (LatheGeometry)
    const thighPts = [
      new THREE.Vector2(0.062, -0.19),
      new THREE.Vector2(0.072, -0.04),
      new THREE.Vector2(0.078, 0.14),
      new THREE.Vector2(0.072, 0.19),
    ];
    const thighGeo = new THREE.LatheGeometry(thighPts, 18);

    const calfPts = [
      new THREE.Vector2(0.048, -0.19),
      new THREE.Vector2(0.056, -0.02),
      new THREE.Vector2(0.064, 0.16),
      new THREE.Vector2(0.058, 0.19),
    ];
    const calfGeo = new THREE.LatheGeometry(calfPts, 18);

    // Low-top white sneaker silhouette (ExtrudeGeometry + rounded toe)
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

    // Shared materials
    const hairnetTex = createHairnetPleatTexture();
    const materials = {
      skin: new THREE.MeshPhysicalMaterial({
        color: '#E5B89B',
        roughness: 0.68,
        metalness: 0,
        sheen: 0.15,
        sheenRoughness: 0.85,
      }),
      hairBase: new THREE.MeshStandardMaterial({
        color: '#2E1E15',
        roughness: 0.94,
        metalness: 0,
      }),
      eyebrow: new THREE.MeshStandardMaterial({
        color: '#3A2618',
        roughness: 0.88,
        metalness: 0,
      }),
      sclera: new THREE.MeshStandardMaterial({
        color: '#F7F7F7',
        roughness: 0.2,
        metalness: 0,
      }),
      iris: new THREE.MeshStandardMaterial({
        color: '#4A2E1B',
        roughness: 0.18,
        metalness: 0,
      }),
      pupil: new THREE.MeshStandardMaterial({
        color: '#111318',
        roughness: 0.1,
        metalness: 0,
      }),
      catchlight: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
      hairnet: new THREE.MeshPhysicalMaterial({
        color: '#F2F4F7',
        map: hairnetTex,
        bumpMap: hairnetTex,
        bumpScale: 0.0014,
        transparent: true,
        opacity: 0.78,
        roughness: 0.92,
        metalness: 0,
        sheen: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      hairnetBand: new THREE.MeshStandardMaterial({
        color: '#F5F7FA',
        roughness: 0.9,
        metalness: 0,
      }),
      mask: new THREE.MeshPhysicalMaterial({
        color: '#CBE2EE',
        roughness: 0.9,
        metalness: 0,
        sheen: 0.12,
        side: THREE.DoubleSide,
      }),
      maskStrap: new THREE.MeshStandardMaterial({
        color: '#F3F6FA',
        roughness: 0.85,
        metalness: 0,
      }),
      hoodie: new THREE.MeshPhysicalMaterial({
        color: '#2B3A52',
        roughness: 0.92,
        metalness: 0,
        sheen: 0.35,
        sheenRoughness: 0.85,
      }),
      hoodieRib: new THREE.MeshPhysicalMaterial({
        color: '#223045',
        roughness: 0.94,
        metalness: 0,
        sheen: 0.25,
        sheenRoughness: 0.9,
      }),
      zipper: new THREE.MeshStandardMaterial({
        color: '#A8B0BA',
        metalness: 0.6,
        roughness: 0.35,
      }),
      pants: new THREE.MeshPhysicalMaterial({
        color: '#4B4C4F',
        roughness: 0.94,
        metalness: 0,
        sheen: 0.2,
        sheenRoughness: 0.9,
      }),
      pantsPocket: new THREE.MeshPhysicalMaterial({
        color: '#434447',
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
        color: '#E5E8EE',
        roughness: 0.8,
        metalness: 0,
      }),
    };

    return {
      headGeo,
      neckGeo,
      hairnetGeo,
      hairnetBandGeo,
      fringeLocks,
      sideburnLeftGeo,
      sideburnRightGeo,
      napeLocks,
      palmGeo,
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
      thighGeo,
      calfGeo,
      soleGeo,
      materials,
    };
  }, []);
}

// 1-3. Head + Expressive Eyes + Sanitary Hairnet + Surgical Mask
function CharacterHead({ assets, y, tiltX = 0.14, turnY = 0, fullerHairBase = false }) {
  const { materials: m } = assets;

  return (
    <group position={[0, y, 0.015]} rotation={[tiltX, turnY, 0]}>
      {/* Stylized neck */}
      <mesh geometry={assets.neckGeo} material={m.skin} position={[0, -0.125, -0.005]} castShadow />

      {/* Organic oval head */}
      <mesh
        geometry={assets.headGeo}
        material={m.skin}
        scale={[0.98, 1.02, 1.04]}
        castShadow
        receiveShadow
      />

      {/* Ears on left and right sides */}
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

      {/* Expressive stylized 3D eyes + arched eyebrows */}
      {[-1, 1].map((side) => (
        <group
          key={`eye-${side}`}
          position={[side * 0.039, 0.015, 0.095]}
          rotation={[0, side * 0.16, 0]}
        >
          {/* White sclera */}
          <mesh material={m.sclera} scale={[1.05, 1.15, 0.58]}>
            <sphereGeometry args={[0.021, 14, 12]} />
          </mesh>
          {/* Medium-dark brown iris */}
          <mesh material={m.iris} position={[0, 0, 0.0095]} scale={[1.0, 1.08, 0.52]}>
            <sphereGeometry args={[0.0135, 14, 12]} />
          </mesh>
          {/* Black pupil */}
          <mesh material={m.pupil} position={[0, 0, 0.0148]} scale={[1, 1, 0.48]}>
            <sphereGeometry args={[0.008, 10, 10]} />
          </mesh>
          {/* Fixed white catchlight in upper iris */}
          <mesh material={m.catchlight} position={[0.0048, 0.0058, 0.0182]}>
            <sphereGeometry args={[0.0032, 8, 8]} />
          </mesh>
          {/* Softly arched dark brown eyebrow */}
          <mesh
            geometry={assets.browGeo}
            material={m.eyebrow}
            position={[0, 0.035, 0.008]}
            scale={[side, 1, 1]}
          />
        </group>
      ))}

      {/* Dark hair base softly visible underneath the semi-translucent hairnet */}
      <mesh
        material={m.hairBase}
        position={[0, 0.056, -0.012]}
        scale={fullerHairBase ? [1.0, 1.0, 1.02] : [0.96, 0.98, 0.98]}
      >
        <sphereGeometry args={[0.098, 16, 14]} />
      </mesh>

      {/* Visible layered hair peeking below the hairnet elastic band (#2E1E15 matte) */}
      <group name="visible-hair-layers">
        {/* Soft front fringe / bangs peeking over upper forehead (above eyebrows) */}
        {assets.fringeLocks.map((geo, idx) => (
          <mesh key={`fringe-${idx}`} geometry={geo} material={m.hairBase} castShadow />
        ))}
        {/* Marked elongated sideburns in front of both ears */}
        <mesh geometry={assets.sideburnLeftGeo} material={m.hairBase} castShadow />
        <mesh geometry={assets.sideburnRightGeo} material={m.hairBase} castShadow />
        {/* Fuller layered nape hair across the back of the head & upper neck */}
        <group scale={fullerHairBase ? [1.06, 1.15, 1.08] : [1.0, 1.0, 1.0]}>
          {assets.napeLocks.map((geo, idx) => (
            <mesh key={`nape-${idx}`} geometry={geo} material={m.hairBase} castShadow />
          ))}
        </group>
      </group>

      {/* Closer-fitting bouffant semi-translucent white sanitary hairnet */}
      <mesh
        geometry={assets.hairnetGeo}
        material={m.hairnet}
        position={[0, 0.014, -0.008]}
        scale={fullerHairBase ? [1.0, 1.0, 1.02] : [0.98, 0.98, 1.0]}
        castShadow
      />

      {/* Ruffled white elastic hairnet band */}
      <mesh
        geometry={assets.hairnetBandGeo}
        material={m.hairnetBand}
        position={[0, 0.002, 0]}
        castShadow
      />

      {/* Anatomical curved pastel sky-blue surgical mask + ear loops */}
      <mesh geometry={assets.maskGeo} material={m.mask} castShadow receiveShadow />
      <mesh geometry={assets.earLoopLeftGeo} material={m.maskStrap} />
      <mesh geometry={assets.earLoopRightGeo} material={m.maskStrap} />
    </group>
  );
}

// 4. Closed navy fleece hoodie torso with zipper, drawstrings, flat hood & split kangaroo pocket
function ClosedHoodieTorso({ assets, slim = false }) {
  const { materials: m } = assets;
  const xScale = slim ? 0.9 : 1.0;

  return (
    <group scale={[xScale, 1, 1]}>
      {/* Single-piece sculpted torso + mock-neck collar */}
      <mesh
        geometry={assets.torsoGeo}
        material={m.hoodie}
        scale={[1.0, 1.0, 0.66]}
        castShadow
        receiveShadow
      />

      {/* Waist hem in exact same matte navy (#2B3A52) overlapping pants seamlessly */}
      <mesh
        geometry={assets.hemGeo}
        material={m.hoodie}
        position={[0, -0.008, 0]}
        scale={[1.01, 1.05, 0.67]}
        castShadow
      />

      {/* Vertical silver-gray front zipper + small pull tab at mock-neck */}
      <mesh geometry={assets.zipperGeo} material={m.zipper} />
      <RoundedBox
        args={[0.01, 0.022, 0.008]}
        radius={0.003}
        smoothness={2}
        position={[0, 0.478, 0.052]}
        rotation={[0.2, 0, 0]}
        material={m.zipper}
      />

      {/* Parallel navy drawstrings */}
      <mesh geometry={assets.drawstringLeftGeo} material={m.hoodieRib} />
      <mesh geometry={assets.drawstringRightGeo} material={m.hoodieRib} />

      {/* Flattened hood resting snug against shoulder blades */}
      <mesh
        geometry={assets.hoodGeo}
        material={m.hoodie}
        position={[0, 0.422, -0.084]}
        rotation={[0.45, 0, 0]}
        castShadow
      />

      {/* Split front kangaroo pocket hugging lower abdomen */}
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

// Articulated tapered hoodie sleeve + ribbed cuff + organic stylized hand (flush shoulders, bent elbows)
function OrganicArm({ assets, side = -1, pose = 'standing', slim = false }) {
  const { materials: m } = assets;
  const xBase = side * (slim ? 0.14 : 0.156);
  const isSeated = pose === 'seated';

  return (
    <group position={[xBase, 0.372, 0.006]}>
      {/* Flush shoulder transition integrated cleanly with torso and sleeve */}
      <mesh material={m.hoodie} scale={[0.82, 0.9, 0.86]} castShadow>
        <sphereGeometry args={[slim ? 0.042 : 0.046, 12, 12]} />
      </mesh>

      {/* Upper arm sleeve kept closer to torso */}
      <group rotation={[isSeated ? -0.46 : -0.34, 0, side * -0.05]}>
        <mesh
          geometry={assets.upperSleeveGeo}
          material={m.hoodie}
          position={[0, -0.115, 0]}
          castShadow
        />

        {/* Seamless elbow joint with ~30° natural bend */}
        <group position={[0, -0.22, 0]}>
          <mesh material={m.hoodie} castShadow>
            <sphereGeometry args={[slim ? 0.042 : 0.046, 12, 12]} />
          </mesh>

          {/* Forearm sleeve angled naturally over work area */}
          <group rotation={[isSeated ? -1.44 : -0.92, 0, side * (isSeated ? 0.22 : 0.16)]}>
            <mesh
              geometry={assets.forearmSleeveGeo}
              material={m.hoodie}
              position={[0, -0.105, 0]}
              castShadow
            />

            {/* Ribbed wrist cuff */}
            <mesh
              geometry={assets.cuffGeo}
              material={m.hoodieRib}
              position={[0, -0.222, 0]}
              castShadow
            />

            {/* Articulated 5-finger organic stylized hand (palm + thumb + 4 curved fingers) */}
            <group position={[0, -0.24, 0.004]} rotation={[isSeated ? 0.22 : 0.34, side * -0.14, 0]}>
              {/* Wrist-to-palm transition */}
              <mesh material={m.skin} position={[0, 0.002, 0]} scale={[1.0, 0.7, 0.72]}>
                <sphereGeometry args={[0.022, 10, 8]} />
              </mesh>

              {/* Sculpted organic palm */}
              <mesh geometry={assets.palmGeo} material={m.skin} castShadow />

              {/* Separated articulated thumb (inward side = -side) */}
              <group position={[-side * 0.024, -0.016, 0.006]} rotation={[0.28, side * -0.32, -side * 0.56]}>
                {/* Proximal thumb */}
                <mesh material={m.skin} position={[0, -0.012, 0]} castShadow>
                  <capsuleGeometry args={[0.0072, 0.014, 5, 8]} />
                </mesh>
                {/* Distal thumb slightly curled inward */}
                <group position={[0, -0.023, 0]} rotation={[0.38, 0, side * 0.22]}>
                  <mesh material={m.skin} position={[0, -0.009, 0]} castShadow>
                    <capsuleGeometry args={[0.0062, 0.011, 5, 8]} />
                  </mesh>
                </group>
              </group>

              {/* Four differentiated fingers: index, middle, ring, pinky (mirrored by side) */}
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
                  {/* Proximal phalanx */}
                  <mesh material={m.skin} position={[0, -f.len1 * 0.5, 0]} castShadow>
                    <capsuleGeometry args={[f.r, f.len1, 5, 8]} />
                  </mesh>
                  {/* Distal phalanx gently curled inward */}
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

// 5. Low-top clean white sneaker with rounded toe, flat white sole & subtle laces
function LowTopWhiteSneaker({ assets, position }) {
  const { materials: m } = assets;

  return (
    <group position={position}>
      {/* Flat white sole */}
      <mesh geometry={assets.soleGeo} material={m.sneakerSole} position={[0, 0.02, 0.02]} castShadow />
      {/* Sculpted low-top white upper with rounded toe */}
      <mesh material={m.sneaker} position={[0, 0.044, 0.018]} scale={[0.88, 0.62, 1.82]} castShadow receiveShadow>
        <sphereGeometry args={[0.056, 14, 12]} />
      </mesh>
      {/* Ankle collar cuff */}
      <mesh material={m.sneaker} position={[0, 0.068, -0.028]} castShadow>
        <cylinderGeometry args={[0.044, 0.048, 0.032, 14]} />
      </mesh>
      {/* Subtle crisscross lace bars on instep */}
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

// Ultra-slim side cargo pocket (half depth) with subtle vertical pleat & flat top flap
function SlimCargoPocket({ assets, side = 1, position, rotation = [0, 0, 0] }) {
  const { materials: m } = assets;

  return (
    <group position={position} rotation={rotation}>
      {/* Very thin pocket body hugging the thigh */}
      <RoundedBox
        args={[0.009, 0.138, 0.102]}
        radius={0.003}
        smoothness={2}
        material={m.pantsPocket}
        castShadow
      />
      {/* Subtle vertical pleat crease */}
      <RoundedBox
        args={[0.003, 0.12, 0.006]}
        radius={0.001}
        smoothness={1}
        position={[side * 0.005, -0.006, 0]}
        material={m.pants}
      />
      {/* Thin flat top flap */}
      <RoundedBox
        args={[0.011, 0.028, 0.106]}
        radius={0.003}
        smoothness={2}
        position={[side * 0.001, 0.056, 0]}
        material={m.pants}
      />
    </group>
  );
}

// Standing operator (~1.68 m tall, ~1:5.8 head-to-body ratio)
function StandingOperator({ assets, position, rotationY = 0, heightScale = 1, turnY = 0 }) {
  const { materials: m } = assets;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[1, heightScale, 1]}>
      <LowTopWhiteSneaker assets={assets} position={[-0.098, 0, 0.015]} />
      <LowTopWhiteSneaker assets={assets} position={[0.098, 0, 0.015]} />

      {/* Seamless hip + thigh + knee + calf legs */}
      {[-1, 1].map((side) => (
        <group key={`leg-${side}`} position={[side * 0.098, 0, 0]}>
          {/* Calf */}
          <mesh geometry={assets.calfGeo} material={m.pants} position={[0, 0.27, 0]} castShadow receiveShadow />
          {/* Knee joint sphere (no gap) */}
          <mesh material={m.pants} position={[0, 0.46, 0.004]} castShadow>
            <sphereGeometry args={[0.06, 12, 10]} />
          </mesh>
          {/* Thigh */}
          <mesh geometry={assets.thighGeo} material={m.pants} position={[0, 0.65, 0.004]} castShadow receiveShadow />
          {/* Slim side cargo pocket */}
          <SlimCargoPocket assets={assets} side={side} position={[side * 0.068, 0.58, 0.004]} />
        </group>
      ))}

      {/* Seamless hip/pelvis join */}
      <mesh material={m.pants} position={[0, 0.855, 0]} scale={[1.04, 0.65, 0.68]} castShadow>
        <sphereGeometry args={[0.158, 16, 12]} />
      </mesh>

      {/* Upper body leaning naturally forward (~9°) and head looking down (~13°) at bags */}
      <group position={[0, 0.895, 0]} rotation={[0.16, 0, 0]}>
        <ClosedHoodieTorso assets={assets} />
        <OrganicArm assets={assets} side={-1} pose="standing" />
        <OrganicArm assets={assets} side={1} pose="standing" />
        <CharacterHead assets={assets} y={0.62} tiltX={0.23} turnY={turnY} />
      </group>
    </group>
  );
}

// Seated operator at Estación Zebra ZT411 (seamless hip/knee bends, hands resting cleanly on keyboard)
function SeatedOperator({ assets, position, rotationY = 0 }) {
  const { materials: m } = assets;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <LowTopWhiteSneaker assets={assets} position={[-0.094, 0, 0.32]} />
      <LowTopWhiteSneaker assets={assets} position={[0.094, 0, 0.32]} />

      {/* Seamless seated lower legs, knees, and thighs */}
      {[-1, 1].map((side) => (
        <group key={`sleg-${side}`} position={[side * 0.094, 0, 0]}>
          {/* Calf */}
          <mesh
            geometry={assets.calfGeo}
            material={m.pants}
            position={[0, 0.27, 0.295]}
            rotation={[0.08, 0, 0]}
            castShadow
          />
          {/* Knee joint sphere (prevents any break at 90° bend) */}
          <mesh material={m.pants} position={[0, 0.485, 0.282]} castShadow>
            <sphereGeometry args={[0.064, 12, 10]} />
          </mesh>
          {/* Seated thigh */}
          <mesh
            geometry={assets.thighGeo}
            material={m.pants}
            position={[0, 0.505, 0.115]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          />
          {/* Slim side cargo pocket along seated thigh */}
          <SlimCargoPocket
            assets={assets}
            side={side}
            position={[side * 0.066, 0.505, 0.14]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      ))}

      {/* Seamless seated pelvis */}
      <mesh material={m.pants} position={[0, 0.525, -0.025]} scale={[1.0, 0.62, 0.72]} castShadow>
        <sphereGeometry args={[0.155, 16, 12]} />
      </mesh>

      {/* Seated torso leaning slightly forward (~7°) toward monitor/keyboard */}
      <group position={[0, 0.56, -0.025]} rotation={[0.11, 0, 0]}>
        <ClosedHoodieTorso assets={assets} slim />
        <OrganicArm assets={assets} side={-1} pose="seated" slim />
        <OrganicArm assets={assets} side={1} pose="seated" slim />
        <CharacterHead assets={assets} y={0.615} tiltX={0.14} fullerHairBase />
      </group>
    </group>
  );
}

export default function Operators() {
  const assets = useCharacterAssets();

  return (
    <group name="room-operators">
      {/* 1. Seated operator at Estación Zebra ZT411 */}
      <SeatedOperator
        assets={assets}
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
      />

      {/* 2-4. Three standing operators along the 4.0 m Embolsado bench */}
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

      {/* 5. Standing operator at Seedless front table */}
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
