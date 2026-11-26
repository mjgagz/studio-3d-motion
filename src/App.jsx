import { useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { CAMERA_PRESETS } from './data/roomLayout';
import StudioScene from './components/StudioScene';
import Hud from './components/Hud';

export default function App() {
  const [isFlying, setIsFlying] = useState(true);
  const [activePresetId, setActivePresetId] = useState('entrada');
  const [dronePhase, setDronePhase] = useState('Entrada · 03');
  const [aspectMode, setAspectMode] = useState('16:9');
  const [showLabels, setShowLabels] = useState(false);
  const [hudCollapsed, setHudCollapsed] = useState(false);

  const handleSelectPreset = useCallback((id) => {
    setIsFlying(false);
    setActivePresetId(id);
  }, []);

  const handleToggleFly = useCallback(() => {
    setIsFlying((prev) => !prev);
  }, []);

  const handleUserInteract = useCallback(() => {
    setIsFlying(false);
    setActivePresetId(null);
  }, []);

  // Keyboard ergonomics
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFly();
      } else if (e.key === 'Escape' || e.key === '0' || e.key.toLowerCase() === 'c') {
        handleSelectPreset('cenital');
      } else if (e.key.toLowerCase() === 'l') {
        setShowLabels((prev) => !prev);
      } else if (e.key.toLowerCase() === 'h') {
        setHudCollapsed((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        setAspectMode((prev) => (prev === '16:9' ? '9:16' : '16:9'));
      } else {
        const num = Number(e.key);
        const zonePresets = CAMERA_PRESETS.filter((p) => p.id !== 'cenital');
        if (num >= 1 && num <= zonePresets.length) {
          handleSelectPreset(zonePresets[num - 1].id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectPreset, handleToggleFly]);

  return (
    <main className="studio-shell">
      <div
        className={`stage-frame ${aspectMode === '9:16' ? 'is-vertical' : 'is-horizontal'}`}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2.32, 4.35], fov: 42, near: 0.08, far: 60 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
          }}
        >
          <StudioScene
            isFlying={isFlying}
            activePresetId={activePresetId}
            aspectMode={aspectMode}
            showLabels={showLabels}
            onUserInteract={handleUserInteract}
            onPhaseChange={setDronePhase}
          />
        </Canvas>

        <Hud
          isFlying={isFlying}
          activePresetId={activePresetId}
          dronePhase={dronePhase}
          aspectMode={aspectMode}
          showLabels={showLabels}
          collapsed={hudCollapsed}
          onToggleFly={handleToggleFly}
          onSelectPreset={handleSelectPreset}
          onToggleLabels={() => setShowLabels((prev) => !prev)}
          onChangeAspect={setAspectMode}
          onToggleCollapse={() => setHudCollapsed((prev) => !prev)}
        />
      </div>
    </main>
  );
}
