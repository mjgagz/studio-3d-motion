import { RoundedBox } from '@react-three/drei';

const UNIFORM_SHIRT = { color: '#1e3a5f', roughness: 0.78, metalness: 0.02 };
const UNIFORM_PANTS = { color: '#242933', roughness: 0.82, metalness: 0.02 };
const SHOES = { color: '#181b20', roughness: 0.65, metalness: 0.05 };
const SKIN = { color: '#d9a786', roughness: 0.72, metalness: 0.0 };
const GLOVE = { color: '#eef2f6', roughness: 0.52, metalness: 0.02 };
const HAIR_TONES = ['#261e1a', '#35271f', '#1c1917', '#3b2c22', '#2b221c'];

function OperatorHead({ y, hairColor = '#261e1a', tiltX = 0.18 }) {
  return (
    <group position={[0, y, 0.03]} rotation={[tiltX, 0, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.052, 0.08, 10]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      {/* Head */}
      <mesh castShadow>
        <sphereGeometry args={[0.105, 14, 14]} />
        <meshStandardMaterial {...SKIN} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 0.024, -0.015]} castShadow>
        <sphereGeometry args={[0.108, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color={hairColor} roughness={0.88} metalness={0.0} />
      </mesh>
    </group>
  );
}

// Standing operator facing +Z in local space (rotate group Y to aim at bench)
function StandingOperator({ position, rotationY = 0, hairColor }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Shoes */}
      <RoundedBox args={[0.1, 0.07, 0.22]} radius={0.025} smoothness={2} position={[-0.1, 0.035, 0.03]} castShadow>
        <meshStandardMaterial {...SHOES} />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.07, 0.22]} radius={0.025} smoothness={2} position={[0.1, 0.035, 0.03]} castShadow>
        <meshStandardMaterial {...SHOES} />
      </RoundedBox>

      {/* Legs */}
      <mesh position={[-0.1, 0.47, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.068, 0.68, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>
      <mesh position={[0.1, 0.47, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.068, 0.68, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>

      {/* Pelvis / waist */}
      <RoundedBox args={[0.31, 0.14, 0.2]} radius={0.05} smoothness={2} position={[0, 0.89, 0]} castShadow>
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </RoundedBox>

      {/* Upper body leaning slightly forward over packing bench */}
      <group position={[0, 0.94, 0]} rotation={[0.12, 0, 0]}>
        {/* Navy shirt torso */}
        <RoundedBox args={[0.38, 0.48, 0.22]} radius={0.07} smoothness={2} position={[0, 0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...UNIFORM_SHIRT} />
        </RoundedBox>

        {/* Left arm reaching forward */}
        <group position={[-0.22, 0.4, 0.02]}>
          {/* Short sleeve upper arm */}
          <mesh position={[0, -0.09, 0.05]} rotation={[-0.45, 0, 0.08]} castShadow>
            <capsuleGeometry args={[0.056, 0.14, 6, 10]} />
            <meshStandardMaterial {...UNIFORM_SHIRT} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.03, -0.22, 0.2]} rotation={[-1.08, 0, -0.18]} castShadow>
            <capsuleGeometry args={[0.042, 0.2, 6, 10]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          {/* White sanitary glove */}
          <RoundedBox args={[0.075, 0.04, 0.1]} radius={0.016} smoothness={2} position={[0.07, -0.29, 0.33]} castShadow>
            <meshStandardMaterial {...GLOVE} />
          </RoundedBox>
        </group>

        {/* Right arm reaching forward */}
        <group position={[0.22, 0.4, 0.02]}>
          <mesh position={[0, -0.09, 0.05]} rotation={[-0.45, 0, -0.08]} castShadow>
            <capsuleGeometry args={[0.056, 0.14, 6, 10]} />
            <meshStandardMaterial {...UNIFORM_SHIRT} />
          </mesh>
          <mesh position={[-0.03, -0.22, 0.2]} rotation={[-1.08, 0, 0.18]} castShadow>
            <capsuleGeometry args={[0.042, 0.2, 6, 10]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          <RoundedBox args={[0.075, 0.04, 0.1]} radius={0.016} smoothness={2} position={[-0.07, -0.29, 0.33]} castShadow>
            <meshStandardMaterial {...GLOVE} />
          </RoundedBox>
        </group>

        {/* Head */}
        <OperatorHead y={0.62} hairColor={hairColor} tiltX={0.28} />
      </group>
    </group>
  );
}

// Seated operator at Zebra ZT411 workstation (facing +Z in local space)
function SeatedOperator({ position, rotationY = 0, hairColor }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Shoes flat on floor */}
      <RoundedBox args={[0.095, 0.065, 0.21]} radius={0.024} smoothness={2} position={[-0.1, 0.032, 0.34]} castShadow>
        <meshStandardMaterial {...SHOES} />
      </RoundedBox>
      <RoundedBox args={[0.095, 0.065, 0.21]} radius={0.024} smoothness={2} position={[0.1, 0.032, 0.34]} castShadow>
        <meshStandardMaterial {...SHOES} />
      </RoundedBox>

      {/* Lower legs */}
      <mesh position={[-0.1, 0.27, 0.29]} rotation={[0.08, 0, 0]} castShadow>
        <capsuleGeometry args={[0.058, 0.34, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>
      <mesh position={[0.1, 0.27, 0.29]} rotation={[0.08, 0, 0]} castShadow>
        <capsuleGeometry args={[0.058, 0.34, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>

      {/* Thighs seated on chair cushion */}
      <mesh position={[-0.1, 0.51, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>
      <mesh position={[0.1, 0.51, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.068, 0.28, 6, 10]} />
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </mesh>

      {/* Seated pelvis */}
      <RoundedBox args={[0.31, 0.13, 0.22]} radius={0.05} smoothness={2} position={[0, 0.54, -0.02]} castShadow>
        <meshStandardMaterial {...UNIFORM_PANTS} />
      </RoundedBox>

      {/* Torso */}
      <group position={[0, 0.58, -0.02]} rotation={[0.08, 0, 0]}>
        <RoundedBox args={[0.37, 0.46, 0.21]} radius={0.07} smoothness={2} position={[0, 0.24, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...UNIFORM_SHIRT} />
        </RoundedBox>

        {/* Left arm typing on keyboard */}
        <group position={[-0.21, 0.38, 0.02]}>
          <mesh position={[0, -0.1, 0.06]} rotation={[-0.45, 0, 0.06]} castShadow>
            <capsuleGeometry args={[0.054, 0.14, 6, 10]} />
            <meshStandardMaterial {...UNIFORM_SHIRT} />
          </mesh>
          <mesh position={[0.04, -0.18, 0.24]} rotation={[-1.42, 0, -0.16]} castShadow>
            <capsuleGeometry args={[0.04, 0.22, 6, 10]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          <RoundedBox args={[0.072, 0.036, 0.095]} radius={0.015} smoothness={2} position={[0.08, -0.2, 0.38]} castShadow>
            <meshStandardMaterial {...GLOVE} />
          </RoundedBox>
        </group>

        {/* Right arm typing on keyboard */}
        <group position={[0.21, 0.38, 0.02]}>
          <mesh position={[0, -0.1, 0.06]} rotation={[-0.45, 0, -0.06]} castShadow>
            <capsuleGeometry args={[0.054, 0.14, 6, 10]} />
            <meshStandardMaterial {...UNIFORM_SHIRT} />
          </mesh>
          <mesh position={[-0.04, -0.18, 0.24]} rotation={[-1.42, 0, 0.16]} castShadow>
            <capsuleGeometry args={[0.04, 0.22, 6, 10]} />
            <meshStandardMaterial {...SKIN} />
          </mesh>
          <RoundedBox args={[0.072, 0.036, 0.095]} radius={0.015} smoothness={2} position={[-0.08, -0.2, 0.38]} castShadow>
            <meshStandardMaterial {...GLOVE} />
          </RoundedBox>
        </group>

        {/* Head looking toward monitor */}
        <OperatorHead y={0.6} hairColor={hairColor} tiltX={0.12} />
      </group>
    </group>
  );
}

export default function Operators() {
  return (
    <group name="room-operators">
      {/* 1. Seated operator at Estación Zebra ZT411 (matches 01, 02, 03) */}
      <SeatedOperator
        position={[-0.92, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
        hairColor={HAIR_TONES[0]}
      />

      {/* 2-4. Three standing operators along the Embolsado right bench (matches 01, 02, 03) */}
      <StandingOperator
        position={[0.96, 0, -1.28]}
        rotationY={Math.PI / 2}
        hairColor={HAIR_TONES[1]}
      />
      <StandingOperator
        position={[0.96, 0, -0.42]}
        rotationY={Math.PI / 2}
        hairColor={HAIR_TONES[2]}
      />
      <StandingOperator
        position={[0.96, 0, 0.44]}
        rotationY={Math.PI / 2}
        hairColor={HAIR_TONES[3]}
      />

      {/* 5. Standing operator at Seedless front table (matches 01, 02, 03) */}
      <StandingOperator
        position={[0.45, 0, 1.02]}
        rotationY={0}
        hairColor={HAIR_TONES[4]}
      />
    </group>
  );
}
