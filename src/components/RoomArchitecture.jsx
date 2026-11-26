import { RoundedBox } from '@react-three/drei';
import { ROOM } from '../data/roomLayout';

export default function RoomArchitecture() {
  const { width, depth } = ROOM;

  return (
    <group name="room-architecture">
      {/* Open 4.0m x 4.0m architectural floor plinth (no walls) */}
      <RoundedBox
        args={[width + 0.16, 0.08, depth + 0.16]}
        radius={0.015}
        smoothness={2}
        position={[0, -0.04, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#c5cbd4"
          roughness={0.58}
          metalness={0.04}
        />
      </RoundedBox>

      {/* Main industrial epoxy floor surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color="#d5d9df"
          roughness={0.5}
          metalness={0.04}
        />
      </mesh>

      {/* Subtle architectural blue perimeter edge strips marking the 4x4m boundary */}
      <mesh position={[-width / 2 - 0.02, 0.004, 0]} receiveShadow>
        <boxGeometry args={[0.04, 0.008, depth + 0.08]} />
        <meshStandardMaterial color="#3b72a6" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0.004, 0]} receiveShadow>
        <boxGeometry args={[0.04, 0.008, depth + 0.08]} />
        <meshStandardMaterial color="#3b72a6" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Studio cyclorama ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.081, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#e8ebf0"
          roughness={0.88}
          metalness={0.0}
        />
      </mesh>
    </group>
  );
}
