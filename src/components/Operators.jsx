import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = `${import.meta.env.BASE_URL}models/personaje-3d.glb`;

function OperatorInstance({ scene, position, rotationY = 0, scale = 1 }) {
  const cloned = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={scale}
    />
  );
}

export default function Operators() {
  const { scene } = useGLTF(MODEL_URL);

  return (
    <group name="room-operators">
      {/* 1. Operator at Estación Zebra ZT411 (facing desk & monitor) */}
      <OperatorInstance
        scene={scene}
        position={[-0.96, 0, 1.18]}
        rotationY={-Math.PI / 2 + 0.08}
        scale={0.98}
      />

      {/* 2-4. Three operators along the 4.0 m Embolsado bench */}
      <OperatorInstance
        scene={scene}
        position={[0.98, 0, -1.28]}
        rotationY={Math.PI / 2}
        scale={1.01}
      />
      <OperatorInstance
        scene={scene}
        position={[0.98, 0, -0.42]}
        rotationY={Math.PI / 2}
        scale={0.99}
      />
      <OperatorInstance
        scene={scene}
        position={[0.98, 0, 0.44]}
        rotationY={Math.PI / 2}
        scale={1.0}
      />

      {/* 5. Operator at Seedless front table */}
      <OperatorInstance
        scene={scene}
        position={[0.45, 0, 1.04]}
        rotationY={0}
        scale={0.99}
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
