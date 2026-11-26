import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import RoomArchitecture from './RoomArchitecture';
import Furniture from './Furniture';
import ZoneOverlay from './ZoneOverlay';
import DroneCamera from './DroneCamera';

export default function StudioScene({
  isFlying,
  activePresetId,
  aspectMode,
  showLabels,
  onUserInteract,
  onPhaseChange,
}) {
  return (
    <>
      {/* Clean neutral studio cyclorama */}
      <color attach="background" args={['#e8ebf0']} />
      <fog attach="fog" args={['#e8ebf0', 16, 34]} />

      {/* Clean architectural studio lighting (zero neon) */}
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[4.5, 8.5, 5.2]}
        intensity={0.95}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-4.2}
        shadow-camera-right={4.2}
        shadow-camera-top={4.2}
        shadow-camera-bottom={-4.2}
        shadow-bias={-0.0004}
      />
      <directionalLight
        position={[-4.5, 5.5, -3.5]}
        intensity={0.4}
        color="#f1f5fb"
      />

      {/* Procedural neutral overhead studio softboxes (baked once) */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.45}
          position={[0, 8, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={0.85}
          position={[-8, 3, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 5, 1]}
          color="#f4f7fb"
        />
        <Lightformer
          form="rect"
          intensity={0.75}
          position={[8, 3, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[8, 5, 1]}
          color="#f8f9fc"
        />
      </Environment>

      {/* Open 3D industrial floor & equipment (walls removed) */}
      <RoomArchitecture />
      <Furniture />
      <ZoneOverlay visible={showLabels} />

      {/* Baked once (frames={1}) for zero per-frame GPU overhead */}
      <ContactShadows
        position={[0, 0.003, 0]}
        frames={1}
        opacity={0.32}
        scale={9}
        blur={2.0}
        far={2.6}
        resolution={512}
        color="#1e293b"
      />

      {/* Smooth drone spline flight + manual waypoint CameraControls */}
      <DroneCamera
        isFlying={isFlying}
        activePresetId={activePresetId}
        aspectMode={aspectMode}
        onUserInteract={onUserInteract}
        onPhaseChange={onPhaseChange}
      />
    </>
  );
}
