import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';

// Reference-matched Pixar-clean studio palette (no cap)
const HOODIE = { color: '#2f4261', roughness: 0.96, metalness: 0.0 };
const HOODIE_RIB = { color: '#25354f', roughness: 0.95, metalness: 0.0 };
const HOODIE_HOOD = { color: '#2a3c59', roughness: 0.97, metalness: 0.0 };
const WHITE_TEE = { color: '#f5f7fa', roughness: 0.88, metalness: 0.0 };
const ZIPPER = { color: '#c4ccd6', roughness: 0.35, metalness: 0.72 };
const CARGO_PANTS = { color: '#424348', roughness: 0.88, metalness: 0.02 };
const CARGO_POCKET = { color: '#3a3b40', roughness: 0.9, metalness: 0.02 };
const WHITE_SNEAKER = { color: '#f4f6f9', roughness: 0.62, metalness: 0.02 };
const SNEAKER_SOLE = { color: '#dde2e9', roughness: 0.78, metalness: 0.0 };

const SKIN_TONES = ['#ebb99d', '#e8b496', '#e3ad8f', '#ecbc9f', '#e5b092'];
const HAIR_TONES = ['#3b2519', '#382418', '#2d1e15', '#422a1c', '#332117'];

// Expressive Pixar-clean head (no cap; curly hair for Zebra woman, layered wavy hair for others)
function StylizedHead({ y, skinColor, hairColor, isCurlyWoman = false, tiltX = 0.14, turnY = 0 }) {
  const curls = useMemo(() => {
    if (!isCurlyWoman) return [];
    const list = [];
    const rings = [
      { y: 0.115, r: 0.065, count: 6, size: 0.048 },
      { y: 0.078, r: 0.115, count: 10, size: 0.05 },
      { y: 0.018, r: 0.132, count: 10, size: 0.05, arcStart: 0.48, arcEnd: Math.PI * 2 - 0.48 },
      { y: -0.048, r: 0.134, count: 9, size: 0.052, arcStart: 0.68, arcEnd: Math.PI * 2 - 0.68 },
      { y: -0.112, r: 0.13, count: 8, size: 0.048, arcStart: 0.88, arcEnd: Math.PI * 2 - 0.88 },
      { y: -0.165, r: 0.122, count: 6, size: 0.044, arcStart: 1.08, arcEnd: Math.PI * 2 - 1.08 },
    ];
    rings.forEach((ring, rIdx) => {
      const start = ring.arcStart ?? 0;
      const end = ring.arcEnd ?? Math.PI * 2;
      for (let i = 0; i < ring.count; i++) {
        const frac = ring.count === 1 ? 0.5 : i / (ring.arcStart ? ring.count - 1 : ring.count);
        const angle = start + frac * (end - start) + (rIdx % 2) * 0.14;
        const x = Math.sin(angle) * ring.r;
        const z = Math.cos(angle) * ring.r - 0.014;
        const jitterY = ((i * 7 + rIdx * 3) % 5 - 2) * 0.004;
        const jitterS = 0.88 + ((i * 5 + rIdx) % 4) * 0.08;
        list.push({ pos: [x, ring.y + jitterY, z], radius: ring.size * jitterS });
      }
    });
    // Framing side curls
    list.push({ pos: [-0.102, 0.06, 0.072], radius: 0.04 });
    list.push({ pos: [0.102, 0.06, 0.072], radius: 0.04 });
    list.push({ pos: [-0.112, -0.006, 0.058], radius: 0.042 });
    list.push({ pos: [0.112, -0.006, 0.058], radius: 0.042 });
    return list;
  }, [isCurlyWoman]);

  return (
    <group position={[0, y, 0.025]} rotation={[tiltX, turnY, 0]}>
      {/* Smooth neck */}
      <mesh position={[0, -0.125, -0.006]} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 0.1, 14]} />
        <meshStandardMaterial color={skinColor} roughness={0.68} />
      </mesh>

      {/* Pixar-proportion sculpted head */}
      <mesh scale={[0.92, 1.06, 0.96]} castShadow receiveShadow>
        <sphereGeometry args={[0.118, 20, 18]} />
        <meshStandardMaterial color={skinColor} roughness={0.66} />
      </mesh>
      {/* Soft rounded chin */}
      <mesh position={[0, -0.068, 0.032]} scale={[0.7, 0.62, 0.78]}>
        <sphereGeometry args={[0.072, 14, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.66} />
      </mesh>

      {/* Subtle warm rosy cheeks */}
      <mesh position={[-0.058, -0.022, 0.092]} scale={[1.2, 0.7, 0.35]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial color="#e69888" roughness={0.85} transparent opacity={0.45} />
      </mesh>
      <mesh position={[0.058, -0.022, 0.092]} scale={[1.2, 0.7, 0.35]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial color="#e69888" roughness={0.85} transparent opacity={0.45} />
      </mesh>

      {/* Soft sculpted nose */}
      <mesh position={[0, -0.012, 0.112]} rotation={[0.22, 0, 0]}>
        <capsuleGeometry args={[0.013, 0.02, 6, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.68} />
      </mesh>

      {/* Expressive Pixar-style eyes (sclera + brown iris + pupil + highlight) */}
      {[-1, 1].map((side) => (
        <group key={`eye-${side}`} position={[side * 0.042, 0.016, 0.098]} rotation={[0, side * 0.18, 0]}>
          {/* White sclera */}
          <mesh scale={[1.05, 1.15, 0.6]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.18} />
          </mesh>
          {/* Warm brown iris */}
          <mesh position={[0, 0, 0.01]} scale={[1.0, 1.08, 0.55]}>
            <sphereGeometry args={[0.014, 12, 10]} />
            <meshStandardMaterial color="#4a2c18" roughness={0.15} />
          </mesh>
          {/* Dark pupil */}
          <mesh position={[0, 0, 0.016]} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.0085, 10, 8]} />
            <meshStandardMaterial color="#111318" roughness={0.1} />
          </mesh>
          {/* Specular catchlight */}
          <mesh position={[0.005, 0.006, 0.019]}>
            <sphereGeometry args={[0.0032, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Eyebrow */}
          <RoundedBox
            args={[0.044, 0.011, 0.01]}
            radius={0.004}
            smoothness={2}
            position={[0, 0.036, 0.008]}
            rotation={[0, 0, side * -0.08]}
          >
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </RoundedBox>
        </group>
      ))}

      {/* Subtle warm smile */}
      <mesh position={[0, -0.056, 0.104]} rotation={[0.1, 0, Math.PI]}>
        <torusGeometry args={[0.022, 0.0035, 6, 12, Math.PI * 0.72]} />
        <meshStandardMaterial color="#b96d5c" roughness={0.7} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.108, -0.006, -0.006]} scale={[0.45, 1, 0.72]}>
        <sphereGeometry args={[0.026, 10, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.68} />
      </mesh>
      <mesh position={[0.108, -0.006, -0.006]} scale={[0.45, 1, 0.72]}>
        <sphereGeometry args={[0.026, 10, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.68} />
      </mesh>

      {/* Hair (NO cap) */}
      {isCurlyWoman ? (
        <group name="curly-hair">
          <mesh position={[0, 0.028, -0.02]} scale={[0.98, 1.06, 1.04]} castShadow>
            <sphereGeometry args={[0.122, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {curls.map((c, idx) => (
            <mesh key={idx} position={c.pos} castShadow>
              <sphereGeometry args={[c.radius, 10, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.92} />
            </mesh>
          ))}
        </group>
      ) : (
        <group name="styled-brown-hair">
          {/* Full natural crown */}
          <mesh position={[0, 0.032, -0.015]} scale={[0.98, 1.04, 1.04]} castShadow>
            <sphereGeometry args={[0.122, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          {/* Soft wavy front bangs / tufts (matching reference without cap) */}
          <mesh position={[-0.045, 0.095, 0.078]} rotation={[0.35, 0.25, -0.25]} scale={[1.3, 0.65, 0.9]} castShadow>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          <mesh position={[0.035, 0.1, 0.082]} rotation={[0.35, -0.2, 0.22]} scale={[1.35, 0.65, 0.9]} castShadow>
            <sphereGeometry args={[0.044, 10, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, 0.12, 0.02]} scale={[1.45, 0.65, 1.15]} castShadow>
            <sphereGeometry args={[0.068, 12, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          {/* Side/back tousled locks */}
          <mesh position={[-0.105, 0.02, -0.02]} scale={[0.55, 0.95, 0.85]} castShadow>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          <mesh position={[0.105, 0.02, -0.02]} scale={[0.55, 0.95, 0.85]} castShadow>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
          <mesh position={[0, -0.022, -0.072]} scale={[0.92, 0.88, 0.65]} castShadow>
            <sphereGeometry args={[0.095, 12, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.88} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Open zip-up navy plush fleece hoodie over a crisp white crew-neck t-shirt
function OpenZipHoodieTorso({ slim = false }) {
  const w = slim ? 0.88 : 1.0;

  return (
    <group>
      {/* Inner crisp white crew-neck t-shirt */}
      <mesh position={[0, 0.22, 0.015]} scale={[0.92 * w, 1.0, 0.6]} castShadow receiveShadow>
        <cylinderGeometry args={[0.165, 0.155, 0.42, 16]} />
        <meshStandardMaterial {...WHITE_TEE} />
      </mesh>
      {/* White t-shirt crew collar */}
      <mesh position={[0, 0.435, 0.015]} rotation={[0.12, 0, 0]}>
        <torusGeometry args={[0.064, 0.014, 8, 16]} />
        <meshStandardMaterial {...WHITE_TEE} />
      </mesh>

      {/* Open zip-up navy fleece hoodie back & sides */}
      <mesh position={[0, 0.22, -0.018]} scale={[1.02 * w, 1.0, 0.62]} castShadow receiveShadow>
        <cylinderGeometry args={[0.178, 0.168, 0.37, 18, 1, false, Math.PI * 0.22, Math.PI * 1.56]} />
        <meshStandardMaterial {...HOODIE} side={2} />
      </mesh>

      {/* Left & right open front hoodie panels framing the white tee */}
      {[-1, 1].map((side) => (
        <group key={`panel-${side}`}>
          {/* Front fleece panel */}
          <RoundedBox
            args={[0.115 * w, 0.38, 0.065]}
            radius={0.024}
            smoothness={2}
            position={[side * 0.112 * w, 0.22, 0.088]}
            rotation={[0, side * -0.18, 0]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...HOODIE} />
          </RoundedBox>

          {/* Metallic silver zipper trim along inner vertical opening */}
          <mesh position={[side * 0.056 * w, 0.215, 0.118]}>
            <boxGeometry args={[0.01, 0.37, 0.012]} />
            <meshStandardMaterial {...ZIPPER} />
          </mesh>

          {/* Split front pocket on each side */}
          <RoundedBox
            args={[0.09 * w, 0.13, 0.025]}
            radius={0.012}
            smoothness={2}
            position={[side * 0.115 * w, 0.11, 0.115]}
            rotation={[0, side * -0.22, 0]}
            castShadow
          >
            <meshStandardMaterial {...HOODIE_HOOD} />
          </RoundedBox>

          {/* Ribbed bottom hem segment */}
          <RoundedBox
            args={[0.12 * w, 0.052, 0.072]}
            radius={0.018}
            smoothness={2}
            position={[side * 0.11 * w, 0.025, 0.085]}
            rotation={[0, side * -0.18, 0]}
            castShadow
          >
            <meshStandardMaterial {...HOODIE_RIB} />
          </RoundedBox>

          {/* Navy drawstring hanging along each front edge */}
          <mesh position={[side * 0.062 * w, 0.35, 0.122]} rotation={[0.06, 0, side * -0.04]}>
            <cylinderGeometry args={[0.0045, 0.0045, 0.15, 6]} />
            <meshStandardMaterial {...HOODIE_RIB} />
          </mesh>
        </group>
      ))}

      {/* Back ribbed bottom hem */}
      <mesh position={[0, 0.025, -0.018]} scale={[1.02 * w, 1.0, 0.62]} castShadow>
        <cylinderGeometry args={[0.172, 0.166, 0.052, 16, 1, false, Math.PI * 0.25, Math.PI * 1.5]} />
        <meshStandardMaterial {...HOODIE_RIB} side={2} />
      </mesh>

      {/* Rounded upper shoulders */}
      <mesh position={[0, 0.375, -0.01]} scale={[1.06 * w, 0.72, 0.62]} castShadow>
        <sphereGeometry args={[0.175, 16, 12]} />
        <meshStandardMaterial {...HOODIE} />
      </mesh>

      {/* Draped plush navy hood resting behind neck/collar */}
      <mesh position={[0, 0.435, -0.085]} rotation={[0.35, 0, 0]} scale={[1.08, 0.72, 0.85]} castShadow>
        <sphereGeometry args={[0.112, 14, 12]} />
        <meshStandardMaterial {...HOODIE_HOOD} />
      </mesh>
      <mesh position={[0, 0.365, -0.11]} rotation={[0.22, 0, 0]} scale={[0.92, 0.54, 0.58]} castShadow>
        <sphereGeometry args={[0.092, 12, 10]} />
        <meshStandardMaterial {...HOODIE_HOOD} />
      </mesh>
    </group>
  );
}

// Articulated long fleece sleeve + ribbed cuff + natural sculpted hand
function HoodieArm({ side = -1, pose = 'standing', slim = false, skinColor }) {
  const xBase = side * (slim ? 0.172 : 0.198);
  const isSeated = pose === 'seated';

  return (
    <group position={[xBase, 0.39, 0.01]}>
      {/* Seamless fleece shoulder */}
      <mesh castShadow>
        <sphereGeometry args={[slim ? 0.062 : 0.068, 12, 12]} />
        <meshStandardMaterial {...HOODIE} />
      </mesh>

      {/* Upper arm */}
      <mesh
        position={[side * 0.015, -0.105, isSeated ? 0.065 : 0.055]}
        rotation={[isSeated ? -0.52 : -0.44, 0, side * -0.08]}
        castShadow
      >
        <capsuleGeometry args={[slim ? 0.05 : 0.056, 0.175, 6, 12]} />
        <meshStandardMaterial {...HOODIE} />
      </mesh>

      {/* Elbow */}
      <mesh position={[side * 0.024, isSeated ? -0.17 : -0.205, isSeated ? 0.13 : 0.11]} castShadow>
        <sphereGeometry args={[slim ? 0.048 : 0.054, 10, 10]} />
        <meshStandardMaterial {...HOODIE} />
      </mesh>

      {/* Forearm */}
      <mesh
        position={[
          side * (isSeated ? -0.015 : -0.01),
          isSeated ? -0.15 : -0.255,
          isSeated ? 0.255 : 0.23,
        ]}
        rotation={[isSeated ? -1.68 : -1.16, 0, side * 0.18]}
        castShadow
      >
        <capsuleGeometry args={[slim ? 0.043 : 0.047, 0.185, 6, 12]} />
        <meshStandardMaterial {...HOODIE} />
      </mesh>

      {/* Ribbed elastic cuff */}
      <mesh
        position={[
          side * (isSeated ? -0.045 : -0.042),
          isSeated ? -0.145 : -0.302,
          isSeated ? 0.36 : 0.335,
        ]}
        rotation={[isSeated ? -1.68 : -1.16, 0, side * 0.18]}
        castShadow
      >
        <cylinderGeometry args={[0.039, 0.042, 0.045, 12]} />
        <meshStandardMaterial {...HOODIE_RIB} />
      </mesh>

      {/* Sculpted hand */}
      <group
        position={[
          side * (isSeated ? -0.06 : -0.056),
          isSeated ? -0.14 : -0.32,
          isSeated ? 0.408 : 0.382,
        ]}
        rotation={[isSeated ? 0.08 : 0.32, side * -0.15, 0]}
      >
        <mesh scale={[1.0, 0.5, 1.25]} castShadow>
          <sphereGeometry args={[0.034, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.68} />
        </mesh>
        <mesh position={[0, -0.005, 0.04]} rotation={[0.25, 0, 0]} scale={[0.9, 0.42, 1.0]} castShadow>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.68} />
        </mesh>
        <mesh position={[-side * 0.03, -0.004, 0.014]} rotation={[0.2, side * 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.009, 0.024, 4, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.68} />
        </mesh>
      </group>
    </group>
  );
}

// Crisp white low-top sneakers (matching reference sheet)
function WhiteSneaker({ position }) {
  return (
    <group position={position}>
      {/* Light gray sole */}
      <mesh position={[0, 0.015, 0.022]} scale={[0.95, 0.38, 1.95]} castShadow>
        <sphereGeometry args={[0.058, 12, 8]} />
        <meshStandardMaterial {...SNEAKER_SOLE} />
      </mesh>
      {/* Crisp white upper */}
      <mesh position={[0, 0.042, 0.016]} scale={[0.9, 0.66, 1.84]} castShadow receiveShadow>
        <sphereGeometry args={[0.056, 12, 10]} />
        <meshStandardMaterial {...WHITE_SNEAKER} />
      </mesh>
    </group>
  );
}

// Standing operator in open zip-up navy hoodie, white tee, charcoal cargo pants & white sneakers
function StandingOperator({ position, rotationY = 0, skinColor, hairColor, heightScale = 1, turnY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[1, heightScale, 1]}>
      <WhiteSneaker position={[-0.1, 0, 0.02]} />
      <WhiteSneaker position={[0.1, 0, 0.02]} />

      {/* Charcoal cargo trousers with side flap pockets */}
      {[-1, 1].map((side) => (
        <group key={`leg-${side}`} position={[side * 0.1, 0, 0]}>
          {/* Calf */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <capsuleGeometry args={[0.058, 0.32, 6, 12]} />
            <meshStandardMaterial {...CARGO_PANTS} />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, 0.63, 0.005]} castShadow receiveShadow>
            <capsuleGeometry args={[0.072, 0.34, 6, 12]} />
            <meshStandardMaterial {...CARGO_PANTS} />
          </mesh>
          {/* Outer thigh cargo pocket with top flap */}
          <RoundedBox
            args={[0.026, 0.15, 0.115]}
            radius={0.008}
            smoothness={2}
            position={[side * 0.068, 0.56, 0.005]}
            castShadow
          >
            <meshStandardMaterial {...CARGO_POCKET} />
          </RoundedBox>
          <RoundedBox
            args={[0.03, 0.036, 0.12]}
            radius={0.006}
            smoothness={2}
            position={[side * 0.07, 0.625, 0.005]}
          >
            <meshStandardMaterial {...CARGO_PANTS} />
          </RoundedBox>
        </group>
      ))}

      {/* Hips */}
      <mesh position={[0, 0.87, 0]} scale={[1.05, 0.62, 0.68]} castShadow>
        <sphereGeometry args={[0.162, 14, 12]} />
        <meshStandardMaterial {...CARGO_PANTS} />
      </mesh>

      {/* Torso */}
      <group position={[0, 0.91, 0]} rotation={[0.1, 0, 0]}>
        <OpenZipHoodieTorso />
        <HoodieArm side={-1} pose="standing" skinColor={skinColor} />
        <HoodieArm side={1} pose="standing" skinColor={skinColor} />
        <StylizedHead y={0.61} skinColor={skinColor} hairColor={hairColor} tiltX={0.22} turnY={turnY} />
      </group>
    </group>
  );
}

// Seated curly-haired woman ("mujer con chinos") in matching open zip hoodie, white tee, cargo pants & white sneakers
function SeatedCurlyWoman({ position, rotationY = 0, skinColor, hairColor }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <WhiteSneaker position={[-0.095, 0, 0.33]} />
      <WhiteSneaker position={[0.095, 0, 0.33]} />

      {/* Lower legs */}
      {[-0.095, 0.095].map((x, idx) => (
        <mesh key={`calf-${idx}`} position={[x, 0.25, 0.29]} rotation={[0.08, 0, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.34, 6, 12]} />
          <meshStandardMaterial {...CARGO_PANTS} />
        </mesh>
      ))}

      {/* Seated thighs with side cargo pockets */}
      {[-1, 1].map((side) => (
        <group key={`thigh-${side}`}>
          <mesh position={[side * 0.095, 0.505, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.064, 0.29, 6, 12]} />
            <meshStandardMaterial {...CARGO_PANTS} />
          </mesh>
          <RoundedBox
            args={[0.022, 0.1, 0.13]}
            radius={0.008}
            smoothness={2}
            position={[side * 0.155, 0.505, 0.14]}
          >
            <meshStandardMaterial {...CARGO_POCKET} />
          </RoundedBox>
        </group>
      ))}

      {/* Seated hips */}
      <mesh position={[0, 0.525, -0.02]} scale={[1.02, 0.58, 0.72]} castShadow>
        <sphereGeometry args={[0.158, 14, 12]} />
        <meshStandardMaterial {...CARGO_PANTS} />
      </mesh>

      {/* Open zip-up navy hoodie + white tee + curly hair */}
      <group position={[0, 0.56, -0.02]} rotation={[0.07, 0, 0]}>
        <OpenZipHoodieTorso slim />
        <HoodieArm side={-1} pose="seated" slim skinColor={skinColor} />
        <HoodieArm side={1} pose="seated" slim skinColor={skinColor} />
        <StylizedHead
          y={0.605}
          skinColor={skinColor}
          hairColor={hairColor}
          isCurlyWoman
          tiltX={0.1}
        />
      </group>
    </group>
  );
}

export default function Operators() {
  return (
    <group name="room-operators">
      {/* 1. Woman with curly hair seated at Estación Zebra ZT411 */}
      <SeatedCurlyWoman
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
        skinColor={SKIN_TONES[0]}
        hairColor={HAIR_TONES[0]}
      />

      {/* 2-4. Three operators along the 4m Embolsado bench */}
      <StandingOperator
        position={[0.96, 0, -1.28]}
        rotationY={Math.PI / 2}
        skinColor={SKIN_TONES[1]}
        hairColor={HAIR_TONES[1]}
        heightScale={1.02}
        turnY={0.08}
      />
      <StandingOperator
        position={[0.96, 0, -0.42]}
        rotationY={Math.PI / 2}
        skinColor={SKIN_TONES[2]}
        hairColor={HAIR_TONES[2]}
        heightScale={0.99}
        turnY={-0.06}
      />
      <StandingOperator
        position={[0.96, 0, 0.44]}
        rotationY={Math.PI / 2}
        skinColor={SKIN_TONES[3]}
        hairColor={HAIR_TONES[3]}
        heightScale={1.01}
        turnY={0.05}
      />

      {/* 5. Operator at Seedless front table */}
      <StandingOperator
        position={[0.45, 0, 1.02]}
        rotationY={0}
        skinColor={SKIN_TONES[4]}
        hairColor={HAIR_TONES[4]}
        heightScale={0.98}
        turnY={-0.04}
      />
    </group>
  );
}
