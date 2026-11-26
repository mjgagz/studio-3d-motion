import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { easing } from 'maath';
import {
  CAMERA_PRESETS,
  DRONE_POSITION_POINTS,
  DRONE_TARGET_POINTS,
} from '../data/roomLayout';

const LOOP_DURATION_SECONDS = 24;

function getPhaseLabel(t) {
  if (t < 0.1) return 'Entrada · 03';
  if (t < 0.24) return 'Estación Zebra ZT411';
  if (t < 0.42) return 'Estante de Insumos';
  if (t < 0.62) return 'Mesa de Embolsado';
  if (t < 0.74) return 'Mesa Seedless';
  if (t < 0.92) return 'Vista Cenital · 01 / 02';
  return 'Retorno a Entrada';
}

export default function DroneCamera({
  isFlying,
  activePresetId,
  aspectMode,
  onUserInteract,
  onPhaseChange,
  onTargetUpdate,
}) {
  const controlsRef = useRef();
  const isProgrammaticRef = useRef(false);
  const progressRef = useRef(0);
  const lastPhaseRef = useRef('');

  const { size } = useThree();

  const posCurve = useMemo(
    () => new THREE.CatmullRomCurve3(DRONE_POSITION_POINTS, true, 'catmullrom', 0.5),
    []
  );
  const targetCurve = useMemo(
    () => new THREE.CatmullRomCurve3(DRONE_TARGET_POINTS, true, 'catmullrom', 0.5),
    []
  );

  // Scratch vectors to avoid per-frame allocations
  const rawPos = useMemo(() => new THREE.Vector3(), []);
  const rawTarget = useMemo(() => new THREE.Vector3(), []);
  const currentPos = useMemo(() => new THREE.Vector3(0, 2.32, 4.35), []);
  const currentTarget = useMemo(() => new THREE.Vector3(0, 0.72, -0.35), []);
  const dirVec = useMemo(() => new THREE.Vector3(), []);
  const adjustedPos = useMemo(() => new THREE.Vector3(), []);

  // Scale distance slightly when in 9:16 vertical mode so horizontal room width stays framed
  const aspectScale = useMemo(() => {
    const ratio = size.width / Math.max(size.height, 1);
    if (aspectMode === '9:16' || ratio < 0.85) return 1.48;
    return 1.0;
  }, [aspectMode, size.width, size.height]);

  // Smooth transition to manual camera presets
  useEffect(() => {
    if (isFlying || !activePresetId || !controlsRef.current) return;

    const preset = CAMERA_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    const tgt = new THREE.Vector3(...preset.target);
    const pos = new THREE.Vector3(...preset.position);

    // Expand distance along ray in 9:16 vertical framing
    if (aspectScale !== 1.0) {
      dirVec.subVectors(pos, tgt).multiplyScalar(aspectScale);
      pos.copy(tgt).add(dirVec);
    }

    isProgrammaticRef.current = true;
    controlsRef.current.setLookAt(pos.x, pos.y, pos.z, tgt.x, tgt.y, tgt.z, true);
    currentPos.copy(pos);
    currentTarget.copy(tgt);
    if (onTargetUpdate) onTargetUpdate(tgt);

    const timer = window.setTimeout(() => {
      isProgrammaticRef.current = false;
    }, 900);

    return () => window.clearTimeout(timer);
  }, [activePresetId, isFlying, aspectScale, currentPos, currentTarget, dirVec, onTargetUpdate]);

  // Continuous cinematic drone spline flight
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls || !isFlying) return;

    const dt = Math.min(delta, 0.08);
    progressRef.current = (progressRef.current + dt / LOOP_DURATION_SECONDS) % 1;
    const t = progressRef.current;

    posCurve.getPointAt(t, rawPos);
    targetCurve.getPointAt(t, rawTarget);

    // Subtle organic drone hover micro-motion
    const elapsed = state.clock.elapsedTime;
    rawPos.y += Math.sin(elapsed * 1.1) * 0.025;
    rawPos.x += Math.cos(elapsed * 0.8) * 0.018;

    // Adapt framing distance for 9:16 vertical mode
    dirVec.subVectors(rawPos, rawTarget).multiplyScalar(aspectScale);
    adjustedPos.copy(rawTarget).add(dirVec);

    // Smooth cinematic damping into the spline
    easing.damp3(currentPos, adjustedPos, 0.32, dt);
    easing.damp3(currentTarget, rawTarget, 0.32, dt);

    isProgrammaticRef.current = true;
    controls.setLookAt(
      currentPos.x,
      currentPos.y,
      currentPos.z,
      currentTarget.x,
      currentTarget.y,
      currentTarget.z,
      false
    );
    isProgrammaticRef.current = false;

    if (onTargetUpdate) onTargetUpdate(currentTarget);

    const phase = getPhaseLabel(t);
    if (phase !== lastPhaseRef.current) {
      lastPhaseRef.current = phase;
      if (onPhaseChange) onPhaseChange(phase);
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.78}
      draggingSmoothTime={0.25}
      minDistance={1.1}
      maxDistance={14}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI * 0.48}
      onStart={() => {
        if (!isProgrammaticRef.current && onUserInteract) {
          onUserInteract();
        }
      }}
    />
  );
}
