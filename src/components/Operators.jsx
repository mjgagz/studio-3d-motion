import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox, useGLTF } from '@react-three/drei';

const MODEL_URL = `${import.meta.env.BASE_URL}models/personaje-3d.glb`;

// Extract ONLY the clean head/face/mask/hairnet from personaje-3d.glb
// (cleanly trims off the mottled neck below y=1.445 in back and y=1.40 in front)
function extractCleanGlbHead(scene) {
  const headGroup = new THREE.Group();

  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const srcGeo = obj.geometry;
    const pos = srcGeo.attributes.position;
    const idx = srcGeo.index;
    if (!pos || !idx) return;

    const geo = srcGeo.clone();
    const keepIndices = [];

    const isHeadVertex = (vi) => {
      const y = pos.getY(vi);
      const z = pos.getZ(vi);
      // Keep surgical mask & chin in front (z > 0.01) down to y=1.398; trim mottled back of neck cleanly at y=1.448
      const cutoffY = z > 0.01 ? 1.398 : 1.448;
      return y >= cutoffY;
    };

    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i);
      const b = idx.getX(i + 1);
      const c = idx.getX(i + 2);
      if (isHeadVertex(a) && isHeadVertex(b) && isHeadVertex(c)) {
        keepIndices.push(a, b, c);
      }
    }

    geo.setIndex(keepIndices);
    // Center head pivot around skull base (y = 1.455 -> y = 0)
    geo.translate(0, -1.455, 0);
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    const mesh = new THREE.Mesh(geo, obj.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    headGroup.add(mesh);
  });

  return headGroup;
}

// Shared organic body geometries & materials (built once for locked 60 FPS across all 5 operators)
function useBodyAssets() {
  return useMemo(() => {
    // Clean sculpted neck (LatheGeometry)
    const neckPts = [
      new THREE.Vector2(0.056, -0.055),
      new THREE.Vector2(0.047, -0.01),
      new THREE.Vector2(0.044, 0.04),
      new THREE.Vector2(0.05, 0.08),
    ];
    const neckGeo = new THREE.LatheGeometry(neckPts, 20);

    // Closed matte navy fleece hoodie torso + smooth sloped shoulders + mock-neck collar
    const torsoPts = [
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
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPts, 28);

    // Waist hem (same matte navy, overlaps pants cleanly)
    const hemPts = [
      new THREE.Vector2(0.157, 0.0),
      new THREE.Vector2(0.165, 0.006),
      new THREE.Vector2(0.165, 0.052),
      new THREE.Vector2(0.158, 0.054),
    ];
    const hemGeo = new THREE.LatheGeometry(hemPts, 26);

    // Silver-gray front zipper following torso curvature
    const zipCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.012, 0.107),
      new THREE.Vector3(0, 0.08, 0.114),
      new THREE.Vector3(0, 0.2, 0.114),
      new THREE.Vector3(0, 0.33, 0.123),
      new THREE.Vector3(0, 0.415, 0.105),
      new THREE.Vector3(0, 0.452, 0.058),
      new THREE.Vector3(0, 0.492, 0.046),
    ]);
    const zipperGeo = new THREE.TubeGeometry(zipCurve, 22, 0.0038, 6, false);

    // Parallel navy hoodie drawstrings
    const makeDrawstring = (side) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.028, 0.46, 0.064),
        new THREE.Vector3(side * 0.036, 0.41, 0.11),
        new THREE.Vector3(side * 0.038, 0.34, 0.126),
        new THREE.Vector3(side * 0.037, 0.27, 0.124),
      ]);
      return new THREE.TubeGeometry(curve, 16, 0.0038, 6, false);
    };
    const drawstringLeftGeo = makeDrawstring(-1);
    const drawstringRightGeo = makeDrawstring(1);

    // Flat folded back hood resting snug against shoulder blades
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

    // Split front kangaroo pocket
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

    // Tapered sleeves & wrist cuff (LatheGeometry)
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

    // Sculpted organic palm (ExtrudeGeometry with soft bevel)
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

    // Tapered cargo pant thighs & calves
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

    // Low-top white sneaker sole
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

    const materials = {
      skin: new THREE.MeshPhysicalMaterial({
        color: '#E2B498',
        roughness: 0.68,
        metalness: 0,
        sheen: 0.15,
        sheenRoughness: 0.85,
      }),
      napeHair: new THREE.MeshStandardMaterial({
        color: '#3A2618',
        roughness: 0.92,
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
      neckGeo,
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

// Clean GLB head mounted on a smooth warm-skin neck with zero mottled texture artifacts
function HybridHead({ glbHead, assets, y, tiltX = 0.14, turnY = 0 }) {
  const headClone = useMemo(() => glbHead.clone(true), [glbHead]);
  const { materials: m } = assets;

  return (
    <group position={[0, y, 0.012]} rotation={[tiltX, turnY, 0]}>
      {/* Smooth warm-skin neck connecting cleanly into mock-neck collar */}
      <mesh geometry={assets.neckGeo} material={m.skin} position={[0, -0.02, -0.012]} castShadow />
      {/* Smooth dark-brown inner skull base tucked invisibly inside the rear hairnet rim */}
      <mesh material={m.napeHair} position={[0, 0.048, -0.024]} scale={[0.92, 0.88, 0.92]}>
        <sphereGeometry args={[0.092, 16, 14]} />
      </mesh>
      {/* Pristine GLB face, eyes, surgical mask & translucent white hairnet */}
      <primitive object={headClone} position={[0, 0.02, 0.005]} />
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

// Seamless articulated hoodie arm + ribbed cuff + 5-finger organic hand (zero holes, zero ribbons)
function ArticulatedArm({ assets, side = -1, pose = 'standing', slim = false }) {
  const { materials: m } = assets;
  const xBase = side * (slim ? 0.142 : 0.158);
  const isSeated = pose === 'seated';

  return (
    <group position={[xBase, 0.372, 0.006]}>
      {/* Flush shoulder transition */}
      <mesh material={m.hoodie} scale={[0.84, 0.92, 0.88]} castShadow>
        <sphereGeometry args={[slim ? 0.044 : 0.048, 12, 12]} />
      </mesh>

      {/* Upper arm sleeve */}
      <group rotation={[isSeated ? -0.46 : -0.34, 0, side * -0.05]}>
        <mesh
          geometry={assets.upperSleeveGeo}
          material={m.hoodie}
          position={[0, -0.115, 0]}
          castShadow
        />

        {/* Seamless elbow joint */}
        <group position={[0, -0.22, 0]}>
          <mesh material={m.hoodie} castShadow>
            <sphereGeometry args={[slim ? 0.043 : 0.046, 12, 12]} />
          </mesh>

          {/* Forearm sleeve */}
          <group rotation={[isSeated ? -1.44 : -0.92, 0, side * (isSeated ? 0.22 : 0.16)]}>
            <mesh
              geometry={assets.forearmSleeveGeo}
              material={m.hoodie}
              position={[0, -0.105, 0]}
              castShadow
            />

            {/* Ribbed wrist cuff (clean join, zero Z-fighting with forearm sleeve) */}
            <mesh
              geometry={assets.cuffGeo}
              material={m.hoodieRib}
              position={[0, -0.218, 0]}
              castShadow
            />

            {/* Articulated 5-finger organic hand */}
            <group position={[0, -0.236, 0.002]} rotation={[isSeated ? 0.22 : 0.34, side * -0.14, 0]}>
              <mesh material={m.skin} position={[0, 0.008, 0]} scale={[0.92, 0.65, 0.65]}>
                <sphereGeometry args={[0.019, 10, 8]} />
              </mesh>
              <mesh geometry={assets.palmGeo} material={m.skin} castShadow />

              {/* Separate angled thumb */}
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

              {/* 4 differentiated curved fingers: index, middle, ring, pinky */}
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

// Low-top white sneaker
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

// Slim side cargo pocket
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

// Standing operator touching bags on Embolsado / Seedless tables
function StandingHybridOperator({ glbHead, assets, position, rotationY = 0, heightScale = 1, turnY = 0 }) {
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
        <HybridHead glbHead={glbHead} assets={assets} y={0.515} tiltX={0.18} turnY={turnY} />
      </group>
    </group>
  );
}

// Seated operator typing cleanly on the Zebra ZT411 keyboard
function SeatedHybridOperator({ glbHead, assets, position, rotationY = 0 }) {
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
        <HybridHead glbHead={glbHead} assets={assets} y={0.515} tiltX={0.1} />
      </group>
    </group>
  );
}

export default function Operators() {
  const { scene } = useGLTF(MODEL_URL);
  const glbHead = useMemo(() => extractCleanGlbHead(scene), [scene]);
  const assets = useBodyAssets();

  return (
    <group name="room-operators">
      {/* 1. Seated operator typing cleanly on Zebra ZT411 keyboard */}
      <SeatedHybridOperator
        glbHead={glbHead}
        assets={assets}
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
      />

      {/* 2-4. Three standing operators handling bags along the 4.0 m Embolsado bench */}
      <StandingHybridOperator
        glbHead={glbHead}
        assets={assets}
        position={[0.96, 0, -1.28]}
        rotationY={Math.PI / 2}
        heightScale={1.01}
        turnY={0.08}
      />
      <StandingHybridOperator
        glbHead={glbHead}
        assets={assets}
        position={[0.96, 0, -0.42]}
        rotationY={Math.PI / 2}
        heightScale={0.99}
        turnY={-0.06}
      />
      <StandingHybridOperator
        glbHead={glbHead}
        assets={assets}
        position={[0.96, 0, 0.44]}
        rotationY={Math.PI / 2}
        heightScale={1.0}
        turnY={0.05}
      />

      {/* 5. Standing operator handling bags at Seedless front table */}
      <StandingHybridOperator
        glbHead={glbHead}
        assets={assets}
        position={[0.45, 0, 1.02]}
        rotationY={0}
        heightScale={0.99}
        turnY={-0.04}
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
