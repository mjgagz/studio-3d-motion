import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { DepthOfField, EffectComposer } from '@react-three/postprocessing';
import { easing } from 'maath';
import RoomArchitecture from './RoomArchitecture';
import Furniture from './Furniture';
import ZoneOverlay from './ZoneOverlay';
import DroneCamera from './DroneCamera';

function StudioPostProcessing({ focusTargetRef }) {
  const dofRef = useRef();
  const smoothTarget = useMemo(() => new THREE.Vector3(0, 0.72, -0.35), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (focusTargetRef.current) {
      easing.damp3(smoothTarget, focusTargetRef.current, 0.35, dt);
    }
    if (dofRef.current) {
      dofRef.current.target = smoothTarget;
    }
  });

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField
        ref={dofRef}
        target={[0, 0.72, -0.35]}
        worldFocusRange={7.5}
        focalLength={0.028}
        bokehScale={0.85}
        height={480}
      />
    </EffectComposer>
  );
}

export default function StudioScene({
  isFlying,
  activePresetId,
  aspectMode,
  showLabels,
  onUserInteract,
  onPhaseChange,
}) {
  const focusTargetRef = useRef(new THREE.Vector3(0, 0.72, -0.35));

  const handleTargetUpdate = useCallback((vec) => {
    focusTargetRef.current.copy(vec);
  }, []);

  return (
    <>
      {/* Clean neutral studio cyclorama */}
      <color attach="background" args={['#e8ebf0']} />
      <fog attach="fog" args={['#e8ebf0', 14, 30]} />

      {/* Clean architectural studio lighting (zero neon) */}
      <ambientLight intensity={0.55} color="#ffffff" />
      <directionalLight
        position={[4.2, 8.5, 5.2]}
        intensity={0.95}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-bias={-0.0004}
      />
      <directionalLight
        position={[-4.5, 5.5, -3.5]}
        intensity={0.38}
        color="#f1f5fb"
      />

      {/* Procedural neutral overhead studio softboxes */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.5}
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

      {/* Full 3D industrial room & equipment modeled from references 01-05 */}
      <RoomArchitecture />
      <Furniture />
      <ZoneOverlay visible={showLabels} />

      {/* Soft grounded studio contact shadows */}
      <ContactShadows
        position={[0, 0.004, 0]}
        opacity={0.34}
        scale={9}
        blur={2.1}
        far={2.8}
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
        onTargetUpdate={handleTargetUpdate}
      />

      {/* Subtle studio optical DepthOfField */}
      <StudioPostProcessing focusTargetRef={focusTargetRef} />
    </>
  );
}
