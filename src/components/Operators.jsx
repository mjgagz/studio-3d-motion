import { useMemo } from 'react';

// Plush matte navy fleece hoodie palette
const FLEECE = { color: '#1d3658', roughness: 0.96, metalness: 0.0 };
const FLEECE_RIB = { color: '#152842', roughness: 0.95, metalness: 0.0 };
const FLEECE_HOOD = { color: '#19304f', roughness: 0.97, metalness: 0.0 };
const PANTS = { color: '#242933', roughness: 0.86, metalness: 0.02 };
const SHOE_UPPER = { color: '#1a1e24', roughness: 0.72, metalness: 0.04 };
const SHOE_SOLE = { color: '#d8dde5', roughness: 0.85, metalness: 0.0 };
const GLOVE = { color: '#f1f5f9', roughness: 0.48, metalness: 0.02 };

const SKIN_TONES = ['#dca989', '#d49e7c', '#c9916f', '#dfb091', '#cf9876'];
const HAIR_TONES = ['#342116', '#231b17', '#2f221b', '#1b1817', '#3a291f'];

// Sculpted human head with subtle ears, nose, and eyes
function HumanHead({ y, skinColor, hairColor, isCurlyWoman = false, tiltX = 0.16, turnY = 0 }) {
  // Deterministic curly hair clusters ("chinos") cascading around crown, sides, and back
  const curls = useMemo(() => {
    if (!isCurlyWoman) return [];
    const list = [];
    // Crown & top volume curls
    const rings = [
      { y: 0.095, r: 0.055, count: 6, size: 0.042 },
      { y: 0.065, r: 0.098, count: 10, size: 0.044 },
      { y: 0.015, r: 0.115, count: 10, size: 0.045, arcStart: 0.45, arcEnd: Math.PI * 2 - 0.45 },
      { y: -0.042, r: 0.118, count: 9, size: 0.046, arcStart: 0.65, arcEnd: Math.PI * 2 - 0.65 },
      { y: -0.098, r: 0.116, count: 8, size: 0.044, arcStart: 0.85, arcEnd: Math.PI * 2 - 0.85 },
      { y: -0.145, r: 0.11, count: 6, size: 0.04, arcStart: 1.05, arcEnd: Math.PI * 2 - 1.05 },
    ];
    rings.forEach((ring, rIdx) => {
      const start = ring.arcStart ?? 0;
      const end = ring.arcEnd ?? Math.PI * 2;
      for (let i = 0; i < ring.count; i++) {
        const frac = ring.count === 1 ? 0.5 : i / (ring.arcStart ? ring.count - 1 : ring.count);
        const angle = start + frac * (end - start) + (rIdx % 2) * 0.14;
        // Local +Z is face forward, so angle=0 is +Z; rotate so gap is on +Z face
        const x = Math.sin(angle) * ring.r;
        const z = Math.cos(angle) * ring.r - 0.012;
        const jitterY = ((i * 7 + rIdx * 3) % 5 - 2) * 0.004;
        const jitterS = 0.88 + ((i * 5 + rIdx) % 4) * 0.08;
        list.push({ pos: [x, ring.y + jitterY, z], radius: ring.size * jitterS });
      }
    });
    // Soft front framing side curls
    list.push({ pos: [-0.088, 0.052, 0.064], radius: 0.036 });
    list.push({ pos: [0.088, 0.052, 0.064], radius: 0.036 });
    list.push({ pos: [-0.098, -0.005, 0.052], radius: 0.038 });
    list.push({ pos: [0.098, -0.005, 0.052], radius: 0.038 });
    return list;
  }, [isCurlyWoman]);

  return (
    <group position={[0, y, 0.025]} rotation={[tiltX, turnY, 0]}>
      {/* Natural neck */}
      <mesh position={[0, -0.105, -0.005]} castShadow>
        <cylinderGeometry args={[0.04, 0.048, 0.09, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>

      {/* Oval sculpted cranium & jaw */}
      <mesh scale={[0.9, 1.08, 0.96]} castShadow receiveShadow>
        <sphereGeometry args={[0.1, 18, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Subtle chin/jaw contour */}
      <mesh position={[0, -0.052, 0.026]} scale={[0.72, 0.65, 0.78]}>
        <sphereGeometry args={[0.068, 12, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Subtle nose */}
      <mesh position={[0, -0.01, 0.096]} rotation={[0.25, 0, 0]}>
        <capsuleGeometry args={[0.011, 0.022, 4, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>

      {/* Subtle minimalist eyes */}
      <mesh position={[-0.032, 0.012, 0.086]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#1f242c" roughness={0.35} />
      </mesh>
      <mesh position={[0.032, 0.012, 0.086]}>
        <sphereGeometry args={[0.009, 8, 8]} />
        <meshStandardMaterial color="#1f242c" roughness={0.35} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.09, -0.005, -0.005]} scale={[0.45, 1, 0.7]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>
      <mesh position={[0.09, -0.005, -0.005]} scale={[0.45, 1, 0.7]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} />
      </mesh>

      {/* Hair */}
      {isCurlyWoman ? (
        <group name="curly-hair">
          {/* Base crown under curls */}
          <mesh position={[0, 0.025, -0.018]} scale={[0.96, 1.05, 1.02]} castShadow>
            <sphereGeometry args={[0.104, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial color={hairColor} roughness={0.92} />
          </mesh>
          {/* Individual curly hair ringlets ("chinos") */}
          {curls.map((c, idx) => (
            <mesh key={idx} position={c.pos} castShadow>
              <sphereGeometry args={[c.radius, 10, 10]} />
              <meshStandardMaterial color={hairColor} roughness={0.93} />
            </mesh>
          ))}
        </group>
      ) : (
        <group name="short-hair">
          {/* Natural layered short hair */}
          <mesh position={[0, 0.026, -0.012]} scale={[0.95, 1.06, 1.0]} castShadow>
            <sphereGeometry args={[0.103, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
          {/* Back hairline taper */}
          <mesh position={[0, -0.02, -0.055]} scale={[0.88, 0.85, 0.65]} castShadow>
            <sphereGeometry args={[0.088, 12, 10]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Sculpted plush fleece hoodie torso with draped hood, kangaroo pocket, and ribbed hem
function FleeceHoodieTorso({ slim = false }) {
  const wScale = slim ? 0.88 : 1.0;

  return (
    <group>
      {/* Upper chest / shoulders (soft rounded fleece silhouette) */}
      <mesh position={[0, 0.34, 0]} scale={[1.05 * wScale, 0.85, 0.64]} castShadow receiveShadow>
        <sphereGeometry args={[0.185, 16, 14]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Main plush hoodie body */}
      <mesh position={[0, 0.21, 0]} scale={[1.0 * wScale, 1.0, 0.62]} castShadow receiveShadow>
        <cylinderGeometry args={[0.182, 0.172, 0.34, 16]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Ribbed elastic bottom hem */}
      <mesh position={[0, 0.035, 0]} scale={[1.0 * wScale, 1.0, 0.62]} castShadow>
        <cylinderGeometry args={[0.174, 0.168, 0.055, 16]} />
        <meshStandardMaterial {...FLEECE_RIB} />
      </mesh>

      {/* Front kangaroo pocket pouch */}
      <mesh position={[0, 0.11, 0.098]} scale={[0.92 * wScale, 0.65, 0.28]} castShadow>
        <sphereGeometry args={[0.135, 12, 10]} />
        <meshStandardMaterial {...FLEECE_HOOD} />
      </mesh>

      {/* Soft hoodie neckline collar */}
      <mesh position={[0, 0.455, 0.01]} rotation={[0.12, 0, 0]} castShadow>
        <torusGeometry args={[0.072, 0.024, 10, 18]} />
        <meshStandardMaterial {...FLEECE_HOOD} />
      </mesh>

      {/* Draped fleece hood resting on upper back */}
      <mesh position={[0, 0.415, -0.095]} rotation={[0.38, 0, 0]} scale={[1.05, 0.72, 0.85]} castShadow>
        <sphereGeometry args={[0.115, 14, 12]} />
        <meshStandardMaterial {...FLEECE_HOOD} />
      </mesh>
      <mesh position={[0, 0.34, -0.118]} rotation={[0.25, 0, 0]} scale={[0.92, 0.55, 0.6]} castShadow>
        <sphereGeometry args={[0.095, 12, 10]} />
        <meshStandardMaterial {...FLEECE_HOOD} />
      </mesh>

      {/* Subtle hoodie drawstrings */}
      <mesh position={[-0.032, 0.36, 0.112]} rotation={[0.08, 0, 0.05]}>
        <cylinderGeometry args={[0.004, 0.004, 0.13, 6]} />
        <meshStandardMaterial color="#cfd7e3" roughness={0.9} />
      </mesh>
      <mesh position={[0.032, 0.36, 0.112]} rotation={[0.08, 0, -0.05]}>
        <cylinderGeometry args={[0.004, 0.004, 0.13, 6]} />
        <meshStandardMaterial color="#cfd7e3" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Articulated long fleece sleeve + ribbed cuff + white gloved hand
function FleeceArm({ side = -1, pose = 'standing', slim = false }) {
  const xBase = side * (slim ? 0.175 : 0.2);
  const isSeated = pose === 'seated';

  return (
    <group position={[xBase, 0.39, 0.01]}>
      {/* Seamless rounded fleece shoulder */}
      <mesh castShadow>
        <sphereGeometry args={[slim ? 0.064 : 0.07, 12, 12]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Upper arm in plush fleece sleeve */}
      <mesh
        position={[side * 0.015, -0.11, isSeated ? 0.065 : 0.055]}
        rotation={[isSeated ? -0.52 : -0.44, 0, side * -0.08]}
        castShadow
      >
        <capsuleGeometry args={[slim ? 0.052 : 0.058, 0.18, 6, 12]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Elbow fold */}
      <mesh position={[side * 0.025, isSeated ? -0.175 : -0.21, isSeated ? 0.13 : 0.11]} castShadow>
        <sphereGeometry args={[slim ? 0.05 : 0.055, 10, 10]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Forearm in long fleece sleeve */}
      <mesh
        position={[
          side * (isSeated ? -0.015 : -0.01),
          isSeated ? -0.155 : -0.26,
          isSeated ? 0.255 : 0.23,
        ]}
        rotation={[isSeated ? -1.68 : -1.16, 0, side * 0.18]}
        castShadow
      >
        <capsuleGeometry args={[slim ? 0.044 : 0.048, 0.19, 6, 12]} />
        <meshStandardMaterial {...FLEECE} />
      </mesh>

      {/* Ribbed fleece cuff at wrist */}
      <mesh
        position={[
          side * (isSeated ? -0.045 : -0.042),
          isSeated ? -0.148 : -0.305,
          isSeated ? 0.36 : 0.335,
        ]}
        rotation={[isSeated ? -1.68 : -1.16, 0, side * 0.18]}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.043, 0.045, 12]} />
        <meshStandardMaterial {...FLEECE_RIB} />
      </mesh>

      {/* Sculpted white gloved hand (palm + fingers + thumb) */}
      <group
        position={[
          side * (isSeated ? -0.06 : -0.056),
          isSeated ? -0.142 : -0.322,
          isSeated ? 0.41 : 0.382,
        ]}
        rotation={[isSeated ? 0.08 : 0.32, side * -0.15, 0]}
      >
        {/* Palm */}
        <mesh scale={[1.0, 0.52, 1.25]} castShadow>
          <sphereGeometry args={[0.036, 10, 10]} />
          <meshStandardMaterial {...GLOVE} />
        </mesh>
        {/* Tapered fingers */}
        <mesh position={[0, -0.006, 0.042]} rotation={[0.25, 0, 0]} scale={[0.92, 0.42, 1.0]} castShadow>
          <sphereGeometry args={[0.032, 10, 8]} />
          <meshStandardMaterial {...GLOVE} />
        </mesh>
        {/* Thumb */}
        <mesh position={[-side * 0.032, -0.004, 0.015]} rotation={[0.2, side * 0.5, 0]} castShadow>
          <capsuleGeometry args={[0.01, 0.025, 4, 8]} />
          <meshStandardMaterial {...GLOVE} />
        </mesh>
      </group>
    </group>
  );
}

// Sculpted sneaker / work shoe with sole trim
function WorkShoe({ position }) {
  return (
    <group position={position}>
      {/* Sole */}
      <mesh position={[0, 0.014, 0.02]} scale={[0.95, 0.36, 1.95]} castShadow>
        <sphereGeometry args={[0.058, 12, 8]} />
        <meshStandardMaterial {...SHOE_SOLE} />
      </mesh>
      {/* Upper */}
      <mesh position={[0, 0.04, 0.015]} scale={[0.9, 0.65, 1.82]} castShadow>
        <sphereGeometry args={[0.056, 12, 10]} />
        <meshStandardMaterial {...SHOE_UPPER} />
      </mesh>
    </group>
  );
}

// Standing operator in plush fleece hoodie (facing +Z locally)
function StandingOperator({ position, rotationY = 0, skinColor, hairColor, heightScale = 1, turnY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[1, heightScale, 1]}>
      <WorkShoe position={[-0.1, 0, 0.02]} />
      <WorkShoe position={[0.1, 0, 0.02]} />

      {/* Natural tapered legs (calves + knees + thighs) */}
      {[-0.1, 0.1].map((x, idx) => (
        <group key={idx} position={[x, 0, 0]}>
          {/* Calf */}
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <capsuleGeometry args={[0.056, 0.32, 6, 12]} />
            <meshStandardMaterial {...PANTS} />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, 0.64, 0.005]} castShadow receiveShadow>
            <capsuleGeometry args={[0.072, 0.34, 6, 12]} />
            <meshStandardMaterial {...PANTS} />
          </mesh>
        </group>
      ))}

      {/* Hips */}
      <mesh position={[0, 0.87, 0]} scale={[1.05, 0.62, 0.68]} castShadow>
        <sphereGeometry args={[0.165, 14, 12]} />
        <meshStandardMaterial {...PANTS} />
      </mesh>

      {/* Torso leaning gently over the packing table */}
      <group position={[0, 0.91, 0]} rotation={[0.11, 0, 0]}>
        <FleeceHoodieTorso />
        <FleeceArm side={-1} pose="standing" />
        <FleeceArm side={1} pose="standing" />
        <HumanHead y={0.59} skinColor={skinColor} hairColor={hairColor} tiltX={0.26} turnY={turnY} />
      </group>
    </group>
  );
}

// Seated woman with curly hair ("mujer con chinos") in plush fleece hoodie at Zebra ZT411
function SeatedCurlyWoman({ position, rotationY = 0, skinColor, hairColor }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <WorkShoe position={[-0.095, 0, 0.33]} />
      <WorkShoe position={[0.095, 0, 0.33]} />

      {/* Lower legs */}
      {[-0.095, 0.095].map((x, idx) => (
        <mesh key={`calf-${idx}`} position={[x, 0.25, 0.29]} rotation={[0.08, 0, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.34, 6, 12]} />
          <meshStandardMaterial {...PANTS} />
        </mesh>
      ))}

      {/* Thighs seated naturally on chair cushion */}
      {[-0.095, 0.095].map((x, idx) => (
        <mesh key={`thigh-${idx}`} position={[x, 0.505, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.064, 0.29, 6, 12]} />
          <meshStandardMaterial {...PANTS} />
        </mesh>
      ))}

      {/* Seated hips */}
      <mesh position={[0, 0.525, -0.02]} scale={[1.02, 0.58, 0.72]} castShadow>
        <sphereGeometry args={[0.16, 14, 12]} />
        <meshStandardMaterial {...PANTS} />
      </mesh>

      {/* Slimmer sculpted fleece hoodie torso */}
      <group position={[0, 0.56, -0.02]} rotation={[0.07, 0, 0]}>
        <FleeceHoodieTorso slim />
        <FleeceArm side={-1} pose="seated" slim />
        <FleeceArm side={1} pose="seated" slim />
        <HumanHead
          y={0.585}
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
      {/* 1. Woman with curly hair ("mujer con chinos") seated at Estación Zebra ZT411 */}
      <SeatedCurlyWoman
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
        skinColor={SKIN_TONES[0]}
        hairColor={HAIR_TONES[0]}
      />

      {/* 2-4. Three operators in plush fleece hoodies along the 4m Embolsado bench */}
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

      {/* 5. Operator in plush fleece hoodie at Seedless front table */}
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
