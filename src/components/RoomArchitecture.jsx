import { ROOM } from '../data/roomLayout';

export default function RoomArchitecture() {
  const { width, depth, height, wallThickness } = ROOM;
  const halfW = width / 2;
  const halfD = depth / 2;

  return (
    <group name="room-architecture">
      {/* Main industrial epoxy floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width + 0.4, depth + 0.4]} />
        <meshStandardMaterial
          color="#d2d5da"
          roughness={0.52}
          metalness={0.04}
        />
      </mesh>

      {/* Subtle outer studio ground apron */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.006, 0]}
        receiveShadow
      >
        <planeGeometry args={[34, 34]} />
        <meshStandardMaterial
          color="#e5e8ed"
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>

      {/* Left architectural blue wall */}
      <mesh
        position={[-halfW - wallThickness / 2, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, height, depth + wallThickness * 2]} />
        <meshStandardMaterial
          color="#3b72a6"
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>

      {/* Right architectural blue wall */}
      <mesh
        position={[halfW + wallThickness / 2, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallThickness, height, depth + wallThickness * 2]} />
        <meshStandardMaterial
          color="#3b72a6"
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>

      {/* Back matte white wall */}
      <mesh
        position={[0, height / 2, -halfD - wallThickness / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial
          color="#f3f5f8"
          roughness={0.78}
          metalness={0.01}
        />
      </mesh>

      {/* Crisp baseboard trim along back and side walls */}
      <mesh position={[0, 0.05, -halfD + 0.01]} receiveShadow>
        <boxGeometry args={[width, 0.1, 0.02]} />
        <meshStandardMaterial color="#e8ebf0" roughness={0.6} metalness={0.02} />
      </mesh>
      <mesh position={[-halfW + 0.008, 0.045, 0]} receiveShadow>
        <boxGeometry args={[0.016, 0.09, depth]} />
        <meshStandardMaterial color="#2f5f8c" roughness={0.65} metalness={0.02} />
      </mesh>
      <mesh position={[halfW - 0.008, 0.045, 0]} receiveShadow>
        <boxGeometry args={[0.016, 0.09, depth]} />
        <meshStandardMaterial color="#2f5f8c" roughness={0.65} metalness={0.02} />
      </mesh>

      {/* Front entrance portal frame (matching reference 03.jpg, open top for cenital shots) */}
      <group position={[0, 0, halfD + wallThickness / 2]}>
        {/* Left white entrance jamb */}
        <mesh position={[-halfW - 0.24, height / 2, 0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.34, height + 0.12, 0.22]} />
          <meshStandardMaterial color="#eef0f4" roughness={0.76} metalness={0.02} />
        </mesh>
        {/* Right white entrance jamb */}
        <mesh position={[halfW + 0.24, height / 2, 0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.34, height + 0.12, 0.22]} />
          <meshStandardMaterial color="#eef0f4" roughness={0.76} metalness={0.02} />
        </mesh>
        {/* Dark anodized metal door tracks on left/right */}
        <mesh position={[-halfW - 0.03, height / 2, 0.07]}>
          <boxGeometry args={[0.05, height, 0.06]} />
          <meshStandardMaterial color="#3c434f" roughness={0.42} metalness={0.55} />
        </mesh>
        <mesh position={[halfW + 0.03, height / 2, 0.07]}>
          <boxGeometry args={[0.05, height, 0.06]} />
          <meshStandardMaterial color="#3c434f" roughness={0.42} metalness={0.55} />
        </mesh>
        {/* Overhead industrial roll-up door lintel */}
        <mesh position={[0, height + 0.02, 0.06]} castShadow>
          <boxGeometry args={[width + 0.84, 0.09, 0.16]} />
          <meshStandardMaterial color="#3c434f" roughness={0.42} metalness={0.55} />
        </mesh>
      </group>
    </group>
  );
}
