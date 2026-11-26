import { Html } from '@react-three/drei';

const ZONE_LABELS = [
  { text: 'Estante', position: [-1.52, 2.02, -1.35] },
  { text: 'Embolsado', position: [1.42, 1.35, -1.35] },
  { text: 'Estación Zebra ZT411', position: [-1.15, 1.38, 0.65] },
  { text: 'Seedless', position: [1.16, 1.32, 1.12] },
];

const DIMENSIONS = [
  { text: '4.0 m', position: [0, 0.08, -2.28] },
  { text: '2.5 m', position: [-2.35, 0.08, -0.65] },
  { text: '1.5 m', position: [-2.35, 0.08, 1.32] },
  { text: '0.8 m', position: [-1.56, 0.08, 2.3] },
  { text: '1.5 m', position: [-0.2, 0.08, 2.3] },
  { text: '0.8 m', position: [1.32, 0.08, 2.3] },
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
