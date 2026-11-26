import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_URL = `${import.meta.env.BASE_URL}models/personaje-3d.glb`;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Smoothly rotate a point (y, z) around pivot (py, pz) by angle rad (negative = forward toward +Z)
function rotYZ(y, z, py, pz, angle) {
  const dy = y - py;
  const dz = z - pz;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [py + dy * c - dz * s, pz + dy * s + dz * c];
}

// Create a cleanly seated copy of the unrigged GLB character using continuous Y-only deformation
// (guarantees zero stretched triangles where sleeves/hands touch the hoodie/thighs)
function createSeatedCharacter(scene) {
  const copy = scene.clone(true);

  const hipY = 0.82;
  const hipZ = -0.01;
  const kneeY = 0.44;
  const kneeZ = 0.0;
  const hipAngle = -1.46; // bends thighs forward toward +Z
  const kneeAngle = 1.5; // bends calves straight down so sneakers rest flat on floor
  const torsoLean = -0.1; // subtle ~6° natural forward lean toward monitor

  // Transformed knee pivot after hip bend
  const [bentKneeY, bentKneeZ] = rotYZ(kneeY, kneeZ, hipY, hipZ, hipAngle);

  copy.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const geo = obj.geometry.clone();
    const pos = geo.attributes.position;
    let minY = Infinity;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Continuous pure-Y weights: legs bend forward at hip, calves bend down at knee
      const hipW = 1 - smoothstep(0.73, 0.89, y);
      if (hipW > 0.001) {
        const [hy, hz] = rotYZ(y, z, hipY, hipZ, hipAngle * hipW);
        const kneeW = 1 - smoothstep(0.37, 0.51, y);
        if (kneeW > 0.001) {
          const [ky, kz] = rotYZ(hy, hz, bentKneeY, bentKneeZ, kneeAngle * kneeW);
          y = ky;
          z = kz;
        } else {
          y = hy;
          z = hz;
        }
      } else {
        // Gentle forward lean for upper body above hip
        const torsoW = smoothstep(0.84, 1.02, y);
        if (torsoW > 0.001) {
          const [ty, tz] = rotYZ(y, z, hipY, hipZ, torsoLean * torsoW);
          y = ty;
          z = tz;
        }
      }

      pos.setXYZ(i, x, y, z);
      if (y < minY) minY = y;
    }

    // Ground the seated sneakers cleanly at y = 0
    if (Number.isFinite(minY)) {
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) - minY);
      }
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    obj.geometry = geo;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });

  return copy;
}

function OperatorInstance({ scene, position, rotationY = 0, scale = 1, seated = false }) {
  const cloned = useMemo(() => {
    if (seated) {
      return createSeatedCharacter(scene);
    }
    const copy = scene.clone(true);
    copy.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return copy;
  }, [scene, seated]);

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
      {/* 1. Seated operator at Estación Zebra ZT411 (adapted onto ergonomic chair, facing monitor & keyboard) */}
      <OperatorInstance
        scene={scene}
        position={[-0.94, 0, 1.2]}
        rotationY={-Math.PI / 2 + 0.08}
        scale={0.98}
        seated
      />

      {/* 2-4. Three standing operators along the 4.0 m Embolsado bench */}
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

      {/* 5. Standing operator at Seedless front table */}
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
