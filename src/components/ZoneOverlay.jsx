import { Html } from '@react-three/drei';

const ZONE_LABELS = [
  { text: 'Estante', position: [-1.52, 2.02, -1.35] },
  { text: 'Embolsado', position: [1.58, 1.35, -1.25] },
  { text: 'Estación Zebra ZT411', position: [-1.15, 1.38, 0.65] },
  { text: 'Seedless', position: [0.45, 1.32, 1.15] },
];

const DIMENSIONS = [
  // Top width
  { text: '4.0 m', position: [0, 0.08, -2.28] },
  // Left side depth (2.5 m + 1.5 m = 4.0 m)
  { text: '2.5 m', position: [-2.35, 0.08, -0.65] },
  { text: '1.5 m', position: [-2.35, 0.08, 1.32] },
  // Right side bench length (4.0 m)
  { text: '4.0 m', position: [2.35, 0.08, 0] },
  // Bottom width left to right: 0.8 m + 0.9 m + 1.5 m + 0.8 m = 4.0 m
  { text: '0.8 m', position: [-1.6, 0.08, 2.32] },
  { text: '0.9 m', position: [-0.75, 0.08, 2.32] },
  { text: '1.5 m', position: [0.45, 0.08, 2.32] },
  { text: '0.8 m', position: [1.6, 0.08, 2.32] },
];

export default function ZoneOverlay({ visible }) {
  if (!visible) return null;

  return (
    <group name="zone-overlay">
      {ZONE_LABELS.map((item) => (
        <Html
          key={item.text}
          position={item.position}
          center
          distanceFactor={8}
          zIndexRange={[5, 0]}
        >
          <div className="zone-pin">{item.text}</div>
        </Html>
      ))}

      {DIMENSIONS.map((dim, idx) => (
        <Html
          key={`${dim.text}-${idx}`}
          position={dim.position}
          center
          distanceFactor={9}
          zIndexRange={[4, 0]}
        >
          <div className="dim-pin">{dim.text}</div>
        </Html>
      ))}
    </group>
  );
}
