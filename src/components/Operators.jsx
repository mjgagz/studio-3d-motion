import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = `${import.meta.env.BASE_URL}models/personaje-3d.glb`;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Rotate (y, z) around pivot (py, pz) by angle rad (negative swings downward limb forward toward +Z)
function rotYZ(y, z, py, pz, angle) {
  const dy = y - py;
  const dz = z - pz;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [py + dy * c - dz * s, pz + dy * s + dz * c];
}

// Exact X boundary between torso/thighs and hanging arms/hands along Y
function armSplitX(y) {
  if (y > 1.15) return 0.162;
  if (y > 0.9) return 0.176;
  if (y > 0.78) return 0.152;
  return 0.132; // captures inner thumb/fingers cleanly below y=0.78
}

// Remove any fused bridge triangles between hand and thigh that stretched >3x during arm posing
function cleanStretchedBridgeTriangles(geo, origPositions) {
  const pos = geo.attributes.position;
  const distSq = (arr, a, b) => {
    const dx = arr[a * 3] - arr[b * 3];
    const dy = arr[a * 3 + 1] - arr[b * 3 + 1];
    const dz = arr[a * 3 + 2] - arr[b * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  };
  const curDistSq = (a, b) => {
    const dx = pos.getX(a) - pos.getX(b);
    const dy = pos.getY(a) - pos.getY(b);
    const dz = pos.getZ(a) - pos.getZ(b);
    return dx * dx + dy * dy + dz * dz;
  };

  const maxStretchSq = 18.0; // ~4.2x linear stretch: keeps forearm sleeves 100% intact, removes only fused bridge ribbons
  const idxAttr = geo.index;
  if (idxAttr) {
    const newIndices = [];
    for (let i = 0; i < idxAttr.count; i += 3) {
      const a = idxAttr.getX(i);
      const b = idxAttr.getX(i + 1);
      const c = idxAttr.getX(i + 2);
      const oAB = Math.max(distSq(origPositions, a, b), 1e-6);
      const oBC = Math.max(distSq(origPositions, b, c), 1e-6);
      const oCA = Math.max(distSq(origPositions, c, a), 1e-6);
      if (
        curDistSq(a, b) / oAB < maxStretchSq &&
        curDistSq(b, c) / oBC < maxStretchSq &&
        curDistSq(c, a) / oCA < maxStretchSq
      ) {
        newIndices.push(a, b, c);
      }
    }
    geo.setIndex(newIndices);
  }
}

// Pose a copy of personaje-3d.glb into either:
// - 'standingWork': slight forward lean, arms & hands reaching onto the bags on the table
// - 'seatedTyping': seated on chair at 90° hips/knees, arms & hands reaching onto the Zebra keyboard
function createPosedCharacter(scene, pose) {
  const copy = scene.clone(true);
  const isSeated = pose === 'seatedTyping';

  const hipY = 0.82;
  const hipZ = -0.01;
  const kneeY = 0.44;
  const kneeZ = 0.0;
  const hipAngle = isSeated ? -1.46 : 0;
  const kneeAngle = isSeated ? 1.5 : 0;
  const torsoLean = isSeated ? 0.08 : 0.11; // leans upper body gently FORWARD (+Z) toward monitor/bags
  const [bentKneeY, bentKneeZ] = rotYZ(kneeY, kneeZ, hipY, hipZ, hipAngle);

  const shoulderY = 1.25;
  const shoulderZ = -0.01;
  const elbowY = 1.0;
  const shoulderAngle = isSeated ? -0.88 : -0.58;
  const elbowAngle = isSeated ? -0.78 : -0.54;
  const [bentElbowY, bentElbowZ] = rotYZ(elbowY, shoulderZ, shoulderY, shoulderZ, shoulderAngle);

  copy.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const geo = obj.geometry.clone();
    const pos = geo.attributes.position;
    const origPositions = new Float32Array(pos.array);
    let minY = Infinity;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const splitX = armSplitX(y);
      const armMask =
        smoothstep(splitX - 0.008, splitX + 0.01, Math.abs(x)) *
        smoothstep(0.58, 0.65, y) *
        (1 - smoothstep(1.25, 1.34, y));

      // 1. Arm deformation (reaches onto bags or keyboard)
      let armX = x;
      let armY = y;
      let armZ = z;
      if (armMask > 0.001) {
        const upperW = 1 - smoothstep(1.19, 1.29, y);
        const [ay, az] = rotYZ(y, z, shoulderY, shoulderZ, shoulderAngle * upperW);

        const foreW = 1 - smoothstep(0.94, 1.05, y);
        const [fy, fz] = rotYZ(ay, az, bentElbowY, bentElbowZ, elbowAngle * foreW);

        const converge = isSeated ? 0.045 : 0.028;
        armX = x - Math.sign(x) * converge * foreW;
        armY = fy;
        armZ = fz;
      }

      // 2. Body & leg deformation
      let bodyY = y;
      let bodyZ = z;
      if (isSeated) {
        const hipW = 1 - smoothstep(0.73, 0.89, y);
        if (hipW > 0.001) {
          const [hy, hz] = rotYZ(y, z, hipY, hipZ, hipAngle * hipW);
          const kneeW = 1 - smoothstep(0.37, 0.51, y);
          if (kneeW > 0.001) {
            const [ky, kz] = rotYZ(hy, hz, bentKneeY, bentKneeZ, kneeAngle * kneeW);
            bodyY = ky;
            bodyZ = kz;
          } else {
            bodyY = hy;
            bodyZ = hz;
          }
        }
      }

      // Subtle forward torso lean above hip
      const leanW = smoothstep(0.84, 1.04, y);
      if (leanW > 0.001) {
        const [ly, lz] = rotYZ(bodyY, bodyZ, hipY, hipZ, torsoLean * leanW);
        bodyY = ly;
        bodyZ = lz;
        if (armMask > 0.001) {
          const [aly, alz] = rotYZ(armY, armZ, hipY, hipZ, torsoLean * leanW);
          armY = aly;
          armZ = alz;
        }
      }

      x = x + (armX - x) * armMask;
      y = bodyY + (armY - bodyY) * armMask;
      z = bodyZ + (armZ - bodyZ) * armMask;

      pos.setXYZ(i, x, y, z);
      if (y < minY) minY = y;
    }

    // Ground soles cleanly at y = 0
    if (Number.isFinite(minY)) {
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) - minY);
      }
    }

    // Eliminate any microscopic fused hand-to-thigh bridge triangles that stretched
    cleanStretchedBridgeTriangles(geo, origPositions);

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    obj.geometry = geo;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });

  return copy;
}

function OperatorInstance({ scene, position, rotationY = 0, scale = 1, pose = 'standingWork' }) {
  const cloned = useMemo(() => createPosedCharacter(scene, pose), [scene, pose]);
  const isSeated = pose === 'seatedTyping';
  // Vertical offset from grounding shift on seated pose (~0.355 m)
  const yOff = isSeated ? -0.355 : 0;
  const lean = isSeated ? 0.08 : 0.11;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={cloned} />

      {/* 1. Clean neck, nape hair rim & matte-navy mock-neck hoodie collar (completely covers mottled GLB neck texture) */}
      <group position={[0, 1.365 + yOff, isSeated ? 0.022 : 0.036]} rotation={[lean, 0, 0]}>
        {/* Clean warm matte skin neck wrapping full back/sides of neck up to the hairnet */}
        <mesh position={[0, 0.036, -0.014]} castShadow>
          <cylinderGeometry args={[0.072, 0.076, 0.12, 20]} />
          <meshStandardMaterial color="#dfb396" roughness={0.72} metalness={0} />
        </mesh>
        {/* Clean dark-brown nape hair band tucked directly under the rear hairnet rim */}
        <mesh position={[0, 0.082, -0.028]} rotation={[0.15, 0, 0]} scale={[1.05, 0.72, 0.92]} castShadow>
          <cylinderGeometry args={[0.088, 0.078, 0.058, 20, 1, false, Math.PI * 0.45, Math.PI * 1.1]} />
          <meshStandardMaterial color="#3a2618" roughness={0.92} metalness={0} />
        </mesh>
        {/* High matte navy fleece mock-neck collar covering lower neck cleanly */}
        <mesh position={[0, -0.024, -0.012]} castShadow>
          <cylinderGeometry args={[0.088, 0.102, 0.088, 22]} />
          <meshStandardMaterial color="#25344b" roughness={0.93} metalness={0} />
        </mesh>
        {/* Soft draped navy hood rim tucked behind the collar */}
        <mesh position={[0, -0.038, -0.062]} rotation={[0.35, 0, 0]} scale={[1.18, 0.68, 0.76]} castShadow>
          <sphereGeometry args={[0.094, 16, 12]} />
          <meshStandardMaterial color="#212f44" roughness={0.94} metalness={0} />
        </mesh>
      </group>

      {/* 2. Solid inner navy hoodie torso & side-waist gussets (closes all arm-seam cutouts cleanly) */}
      <group position={[0, 1.04 + yOff, isSeated ? 0.012 : 0.018]} rotation={[lean, 0, 0]}>
        <mesh scale={[0.96, 1.0, 0.54]} castShadow receiveShadow>
          <cylinderGeometry args={[0.138, 0.136, 0.42, 18]} />
          <meshStandardMaterial color="#25344b" roughness={0.93} metalness={0} />
        </mesh>
        {/* Left & right side-waist fleece gussets under the arms */}
        {[-1, 1].map((side) => (
          <mesh key={`gusset-${side}`} position={[side * 0.118, -0.04, -0.01]} scale={[0.52, 1.0, 0.68]}>
            <cylinderGeometry args={[0.075, 0.078, 0.34, 14]} />
            <meshStandardMaterial color="#25344b" roughness={0.93} metalness={0} />
          </mesh>
        ))}
      </group>

      {/* 3. Solid charcoal hip & upper-thigh body completion (eliminates white specks on hip/thigh seams) */}
      <group position={[0, isSeated ? 0.48 : 0.81, isSeated ? 0.005 : 0.0]}>
        <mesh scale={[1.02, 0.74, 0.62]} castShadow receiveShadow>
          <sphereGeometry args={[0.138, 16, 12]} />
          <meshStandardMaterial color="#3b3c40" roughness={0.94} metalness={0} />
        </mesh>
        {/* Upper thigh liners matching standing vs seated pose */}
        {[-1, 1].map((side) => (
          <mesh
            key={`thigh-fill-${side}`}
            position={
              isSeated
                ? [side * 0.086, 0.0, 0.14]
                : [side * 0.086, -0.14, 0.0]
            }
            rotation={isSeated ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.068, 0.062, 0.28, 14]} />
            <meshStandardMaterial color="#3b3c40" roughness={0.94} metalness={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function Operators() {
  const { scene } = useGLTF(MODEL_URL);

  return (
    <group name="room-operators">
      {/* 1. Seated operator typing on keyboard at Estación Zebra ZT411 */}
      <OperatorInstance
        scene={scene}
        position={[-0.96, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.06}
        scale={0.98}
        pose="seatedTyping"
      />

      {/* 2-4. Three standing operators handling bags along the 4.0 m Embolsado bench */}
      <OperatorInstance
        scene={scene}
        position={[1.02, 0, -1.28]}
        rotationY={Math.PI / 2}
        scale={1.01}
        pose="standingWork"
      />
      <OperatorInstance
        scene={scene}
        position={[1.02, 0, -0.42]}
        rotationY={Math.PI / 2}
        scale={0.99}
        pose="standingWork"
      />
      <OperatorInstance
        scene={scene}
        position={[1.02, 0, 0.44]}
        rotationY={Math.PI / 2}
        scale={1.0}
        pose="standingWork"
      />

      {/* 5. Standing operator handling bags at Seedless front table */}
      <OperatorInstance
        scene={scene}
        position={[0.45, 0, 1.08]}
        rotationY={0}
        scale={0.99}
        pose="standingWork"
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
