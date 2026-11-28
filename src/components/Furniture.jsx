import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

// Procedural crisp Kanban shelf-edge rail texture (4 color-coded slots per shelf)
function createKanbanRailTexture(slots) {
  if (typeof document === 'undefined') return null;
  const w = 1024;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Clean anodized dark-slate label rail background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, h);

  const slotW = w / slots.length;
  slots.forEach((slot, idx) => {
    const x0 = idx * slotW + 14;
    const cardW = slotW - 28;

    // White Kanban card holder
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x0, 10, cardW, h - 20);

    // Left color-coded SKU band
    ctx.fillStyle = slot.color;
    ctx.fillRect(x0, 10, 26, h - 20);

    // Location code (e.g. B1)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Inter, Segoe UI, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(slot.code, x0 + 36, h / 2 + 1);

    // Short label text
    ctx.fillStyle = '#475569';
    ctx.font = '600 18px Inter, Segoe UI, sans-serif';
    ctx.fillText(slot.label, x0 + 92, h / 2 + 1);

    // Green 5S OK status dot on right
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(x0 + cardW - 18, h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// Procedural crisp Japanese 5S Visual Management Board texture
function create5SBoardTexture() {
  if (typeof document === 'undefined') return null;
  const w = 512;
  const h = 576;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Clean matte white board
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Header bar (disciplined industrial navy)
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, 0, w, 92);

  // Safety-yellow 5S accent stripe
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 84, w, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Inter, Segoe UI, sans-serif';
  ctx.fillText('ESTÁNDAR 5S', 28, 44);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 18px Inter, Segoe UI, sans-serif';
  ctx.fillText('ZONA ESTANTE · KANBAN VISUAL', 28, 70);

  const pillars = [
    { num: '1S', jp: 'SEIRI', es: 'Clasificar · Solo necesario', color: '#2563eb' },
    { num: '2S', jp: 'SEITON', es: 'Ordenar · Carriles A1–D4', color: '#0d9488' },
    { num: '3S', jp: 'SEISO', es: 'Limpiar · Piso libre 100%', color: '#16a34a' },
    { num: '4S', jp: 'SEIKETSU', es: 'Estandarizar · Código color', color: '#d97706' },
    { num: '5S', jp: 'SHITSUKE', es: 'Disciplina · Auditoría OK', color: '#7c3aed' },
  ];

  pillars.forEach((p, idx) => {
    const y = 114 + idx * 76;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, y, w - 48, 62);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, y, w - 48, 62);

    // Pillar badge
    ctx.fillStyle = p.color;
    ctx.fillRect(24, y, 56, 62);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, Segoe UI, sans-serif';
    ctx.fillText(p.num, 38, y + 38);

    // Japanese + Spanish concise copy
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Inter, Segoe UI, sans-serif';
    ctx.fillText(p.jp, 96, y + 27);
    ctx.fillStyle = '#475569';
    ctx.font = '500 16px Inter, Segoe UI, sans-serif';
    ctx.fillText(p.es, 96, y + 50);

    // Green audit checkmark pill
    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(w - 92, y + 17, 54, 28);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 16px Inter, Segoe UI, sans-serif';
    ctx.fillText('OK', w - 77, y + 37);
  });

  // Footer Min/Max visual gauge
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(24, 502, w - 48, 50);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px Inter, Segoe UI, sans-serif';
  ctx.fillText('STOCK KANBAN', 40, 533);

  // Min / Target / Max visual bars
  ctx.fillStyle = '#eab308';
  ctx.fillRect(195, 518, 64, 18);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(263, 518, 138, 18);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(405, 518, 65, 18);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

// Reusable stainless steel material props
const STEEL = {
  color: '#c8ced6',
  roughness: 0.34,
  metalness: 0.62,
};

const STEEL_DARK = {
  color: '#8f98a6',
  roughness: 0.38,
  metalness: 0.68,
};

// Reusable poly bag with teal zip strip (lightweight standard material for locked 60fps)
function PolyBag({ position, rotation = [0, 0, 0], scale = 1, puffy = false }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {puffy ? (
        <RoundedBox args={[0.24, 0.11, 0.22]} radius={0.04} smoothness={2} castShadow>
          <meshStandardMaterial
            color="#f5f8fc"
            roughness={0.22}
            metalness={0.06}
            transparent
            opacity={0.78}
          />
        </RoundedBox>
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.012, 0.26]} />
            <meshStandardMaterial
              color="#eef3f8"
              roughness={0.24}
              metalness={0.04}
              transparent
              opacity={0.74}
            />
          </mesh>
          {/* Teal zip seal strip */}
          <mesh position={[0, 0.007, -0.105]}>
            <boxGeometry args={[0.215, 0.004, 0.022]} />
            <meshStandardMaterial color="#14b8a6" roughness={0.4} metalness={0.05} />
          </mesh>
        </>
      )}
    </group>
  );
}

// Reusable industrial label roll (matching 04 & 05)
function LabelRoll({ position, radius = 0.058, height = 0.09, color = '#f1f3f6', stripeColor }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 20]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.04} />
      </mesh>
      {stripeColor && (
        <mesh>
          <cylinderGeometry args={[radius + 0.001, radius + 0.001, height * 0.48, 20]} />
          <meshStandardMaterial color={stripeColor} roughness={0.45} metalness={0.04} />
        </mesh>
      )}
      {/* Cardboard core */}
      <mesh position={[0, height / 2 + 0.001, 0]}>
        <cylinderGeometry args={[radius * 0.36, radius * 0.36, 0.004, 16]} />
        <meshStandardMaterial color="#8c6d4f" roughness={0.8} metalness={0.0} />
      </mesh>
    </group>
  );
}

// Cardboard shipping box (matching Estante in 01, 02, 03)
function CardboardBox({ position, size = [0.36, 0.28, 0.42], open = false }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#c39a6e" roughness={0.82} metalness={0.0} />
      </mesh>
      {/* Packing tape seam */}
      {!open ? (
        <mesh position={[0, size[1] / 2 + 0.002, 0]}>
          <boxGeometry args={[size[0] * 0.16, 0.003, size[2] - 0.02]} />
          <meshStandardMaterial color="#a67c52" roughness={0.65} />
        </mesh>
      ) : (
        <mesh position={[0, size[1] / 2 + 0.004, 0]}>
          <boxGeometry args={[size[0] - 0.05, 0.02, size[2] - 0.05]} />
          <meshStandardMaterial color="#eef3f8" roughness={0.25} transparent opacity={0.82} />
        </mesh>
      )}
    </group>
  );
}

// 1. ESTANTE: 2 galvanized industrial shelving units along the left wall
function ShelvingUnit({ position }) {
  const bayWidth = 0.56;
  const bayLength = 1.12;
  const height = 1.72;
  const shelfHeights = [0.16, 0.64, 1.14, 1.62];

  const postPositions = [
    [-bayWidth / 2 + 0.02, height / 2, -bayLength / 2 + 0.02],
    [bayWidth / 2 - 0.02, height / 2, -bayLength / 2 + 0.02],
    [-bayWidth / 2 + 0.02, height / 2, bayLength / 2 - 0.02],
    [bayWidth / 2 - 0.02, height / 2, bayLength / 2 - 0.02],
  ];

  return (
    <group position={position}>
      {postPositions.map((pos, idx) => (
        <mesh key={idx} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.032, height, 0.032]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>
      ))}
      {shelfHeights.map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[bayWidth, 0.028, bayLength]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      ))}
    </group>
  );
}

// Modular 5S industrial storage bin with front Kanban label holder
function StorageBin5S({ position, accentColor = '#2563eb' }) {
  return (
    <group position={position}>
      {/* Clean matte light-slate tote body */}
      <RoundedBox args={[0.42, 0.22, 0.44]} radius={0.015} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e7ef" roughness={0.55} metalness={0.06} />
      </RoundedBox>
      {/* Top dark-navy standardized rim */}
      <RoundedBox args={[0.435, 0.026, 0.455]} radius={0.008} smoothness={2} position={[0, 0.105, 0]} castShadow>
        <meshStandardMaterial color="#25354d" roughness={0.5} metalness={0.08} />
      </RoundedBox>
      {/* Front aisle-facing Kanban card holder */}
      <mesh position={[0.213, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, 0.085]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0.215, 0.01, -0.072]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.042, 0.085]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Cardboard box with front 5S Kanban identification label facing the aisle (+X)
function LabeledCarton5S({ position, size = [0.42, 0.26, 0.44], open = false, accentColor = '#2563eb' }) {
  return (
    <group position={position}>
      <CardboardBox position={[0, 0, 0]} size={size} open={open} />
      {/* Front Kanban ID label on aisle-facing face (+X) */}
      <mesh position={[size[0] / 2 + 0.002, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.17, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.65} />
      </mesh>
      <mesh position={[size[0] / 2 + 0.003, 0.01, -0.064]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.036, 0.08]} />
        <meshStandardMaterial color={accentColor} roughness={0.55} />
      </mesh>
    </group>
  );
}

function EstanteZone() {
  // Procedural 5S textures created once
  const textures = useMemo(() => ({
    board: create5SBoardTexture(),
    railA: createKanbanRailTexture([
      { code: 'A1', label: 'CAJAS', color: '#2563eb' },
      { code: 'A2', label: 'CAJAS', color: '#2563eb' },
      { code: 'A3', label: 'BOLSAS', color: '#0d9488' },
      { code: 'A4', label: 'BOLSAS', color: '#0d9488' },
    ]),
    railB: createKanbanRailTexture([
      { code: 'B1', label: 'AZUL', color: '#4b86b4' },
      { code: 'B2', label: 'TEAL', color: '#5ea89b' },
      { code: 'B3', label: 'MORADO', color: '#7c6bb3' },
      { code: 'B4', label: 'NARANJA', color: '#e59a4a' },
    ]),
    railC: createKanbanRailTexture([
      { code: 'C1', label: 'KIT-1', color: '#4b86b4' },
      { code: 'C2', label: 'KIT-2', color: '#5ea89b' },
      { code: 'C3', label: 'KIT-3', color: '#7c6bb3' },
      { code: 'C4', label: 'KIT-4', color: '#e59a4a' },
    ]),
    railD: createKanbanRailTexture([
      { code: 'D1', label: 'RESERVA', color: '#475569' },
      { code: 'D2', label: 'RESERVA', color: '#475569' },
      { code: 'D3', label: 'RESERVA', color: '#475569' },
      { code: 'D4', label: 'RESERVA', color: '#475569' },
    ]),
  }), []);

  // 4 strictly segregated color-coded lanes ordered left-to-right from aisle view (+Z -> -Z) matching B1–B4 rail
  const lanes = [
    { zCenter: 0.84, color: '#4b86b4' },
    { zCenter: 0.28, color: '#5ea89b' },
    { zCenter: -0.28, color: '#7c6bb3' },
    { zCenter: -0.84, color: '#e59a4a' },
  ];

  // Uniform slot Z positions ordered left-to-right from aisle view (+Z -> -Z) matching A1–A4 / C1–C4 / D1–D4
  const slotZs = [0.84, 0.28, -0.28, -0.84];

  return (
    <group name="zone-estante" position={[-1.68, 0, -0.66]}>
      {/* 5S Floor Delimitation Tape (Seiton / Seiketsu) — crisp safety-yellow perimeter */}
      <group position={[0.04, 0.004, 0]}>
        {/* Aisle-side front tape */}
        <mesh position={[0.34, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.036, 2.42]} />
          <meshStandardMaterial color="#e5a910" roughness={0.62} metalness={0.02} />
        </mesh>
        {/* Rear-side tape */}
        <mesh position={[-0.34, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.036, 2.42]} />
          <meshStandardMaterial color="#e5a910" roughness={0.62} metalness={0.02} />
        </mesh>
        {/* North end tape */}
        <mesh position={[0, 0, -1.192]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.716, 0.036]} />
          <meshStandardMaterial color="#e5a910" roughness={0.62} metalness={0.02} />
        </mesh>
        {/* South end tape */}
        <mesh position={[0, 0, 1.192]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.716, 0.036]} />
          <meshStandardMaterial color="#e5a910" roughness={0.62} metalness={0.02} />
        </mesh>
      </group>

      {/* Rear shelving bay */}
      <ShelvingUnit position={[0, 0, -0.58]} />
      {/* Front shelving bay */}
      <ShelvingUnit position={[0, 0, 0.58]} />

      {/* Crisp Kanban identification rail strips along aisle-facing front edge (+X) of every shelf */}
      {[
        { y: 1.62, tex: textures.railA },
        { y: 1.14, tex: textures.railB },
        { y: 0.64, tex: textures.railC },
        { y: 0.16, tex: textures.railD },
      ].map((rail, idx) => (
        <mesh key={`rail-${idx}`} position={[0.283, rail.y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.22, 0.044]} />
          <meshStandardMaterial map={rail.tex} roughness={0.45} metalness={0.05} />
        </mesh>
      ))}

      {/* Level A (y=1.62): Uniformly aligned cartons & open bag totes with Kanban IDs (A1–A4) */}
      <LabeledCarton5S position={[0, 1.77, slotZs[0]]} size={[0.42, 0.26, 0.44]} accentColor="#2563eb" />
      <LabeledCarton5S position={[0, 1.77, slotZs[1]]} size={[0.42, 0.26, 0.44]} accentColor="#2563eb" />
      <LabeledCarton5S position={[0, 1.76, slotZs[2]]} size={[0.42, 0.24, 0.44]} open accentColor="#0d9488" />
      <LabeledCarton5S position={[0, 1.76, slotZs[3]]} size={[0.42, 0.24, 0.44]} open accentColor="#0d9488" />

      {/* Level B (y=1.14): 4 Color-coded label-roll lanes with physical metal dividers (B1–B4) */}
      {lanes.map((lane, lIdx) => (
        <group key={`lane-${lIdx}`}>
          {/* 2x2 aligned grid of same-color label rolls */}
          {[-0.12, 0.11].map((rx, xi) =>
            [-0.11, 0.11].map((rz, zi) => (
              <LabelRoll
                key={`r-${xi}-${zi}`}
                position={[rx, 1.21, lane.zCenter + rz]}
                radius={0.054}
                height={0.11}
                stripeColor={lane.color}
              />
            ))
          )}
          {/* Subtle Min/Max green indicator stripe on shelf surface */}
          <mesh position={[0.23, 1.156, lane.zCenter]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.024, 0.44]} />
            <meshStandardMaterial color={lane.color} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Physical lane dividers separating B1 | B2 | B3 | B4 */}
      {[-0.56, 0.0, 0.56].map((zDiv, idx) => (
        <mesh key={`div-${idx}`} position={[0, 1.21, zDiv]} castShadow>
          <boxGeometry args={[0.52, 0.11, 0.01]} />
          <meshStandardMaterial color="#64748b" roughness={0.42} metalness={0.55} />
        </mesh>
      ))}

      {/* Level C (y=0.64): 4 standardized modular 5S storage bins with front Kanban cards (C1–C4) */}
      <StorageBin5S position={[0, 0.765, slotZs[0]]} accentColor="#4b86b4" />
      <StorageBin5S position={[0, 0.765, slotZs[1]]} accentColor="#5ea89b" />
      <StorageBin5S position={[0, 0.765, slotZs[2]]} accentColor="#7c6bb3" />
      <StorageBin5S position={[0, 0.765, slotZs[3]]} accentColor="#e59a4a" />

      {/* Level D (y=0.16): 4 aligned reserve cartons with Kanban labels (D1–D4), spotless floor below (Seiso) */}
      {slotZs.map((z, idx) => (
        <LabeledCarton5S
          key={`d-${idx}`}
          position={[0, 0.305, z]}
          size={[0.44, 0.26, 0.45]}
          accentColor="#475569"
        />
      ))}

      {/* 5S Visual Management Board angled on south-front post so it is legible from both Camera 1 and Camera 3 */}
      <group position={[0.14, 1.16, 1.18]} rotation={[0, 0.58, 0]}>
        {/* Brushed aluminum frame */}
        <RoundedBox args={[0.48, 0.54, 0.022]} radius={0.008} smoothness={2} castShadow>
          <meshStandardMaterial color="#334155" roughness={0.42} metalness={0.55} />
        </RoundedBox>
        {/* High-res 5S visual standard chart */}
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[0.44, 0.5]} />
          <meshStandardMaterial map={textures.board} roughness={0.42} metalness={0.04} />
        </mesh>
      </group>
    </group>
  );
}

// 2. ESTACIÓN ZEBRA ZT411: Stainless desk, Zebra industrial printer, monitor, ergonomic chair
function ZebraZT411Printer({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main industrial dark-charcoal metal chassis (from 04.jpg) */}
      <RoundedBox args={[0.26, 0.28, 0.36]} radius={0.015} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#31363f" roughness={0.44} metalness={0.35} />
      </RoundedBox>
      {/* Front satin-gray face bezel */}
      <RoundedBox args={[0.24, 0.24, 0.025]} radius={0.008} smoothness={2} position={[0, 0.14, 0.175]}>
        <meshStandardMaterial color="#4b5362" roughness={0.42} metalness={0.25} />
      </RoundedBox>
      {/* Printer LCD status screen */}
      <mesh position={[-0.06, 0.17, 0.19]}>
        <planeGeometry args={[0.072, 0.095]} />
        <meshStandardMaterial color="#1e293b" emissive="#3b82f6" emissiveIntensity={0.22} roughness={0.2} />
      </mesh>
      {/* Front label output slot */}
      <mesh position={[0.055, 0.13, 0.19]}>
        <boxGeometry args={[0.09, 0.018, 0.01]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      {/* Exiting white label strip */}
      <mesh position={[0.055, 0.125, 0.205]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.075, 0.003, 0.04]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Side media inspection window */}
      <mesh position={[0.132, 0.15, 0.02]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, 0.14]} />
        <meshStandardMaterial color="#1f242d" roughness={0.18} metalness={0.2} />
      </mesh>
    </group>
  );
}

function ErgonomicChair({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* 5-star caster base */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * Math.PI * 2) / 5;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.32, 0.028, 0.032]} />
            <meshStandardMaterial color="#4b5563" roughness={0.45} metalness={0.5} />
          </mesh>
        );
      })}
      {/* Center gas cylinder */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.03, 0.38, 12]} />
        <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Seat cushion (subtle olive/sage studio accent from 04.jpg) */}
      <RoundedBox args={[0.44, 0.065, 0.42]} radius={0.024} smoothness={3} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8d9b58" roughness={0.78} metalness={0.02} />
      </RoundedBox>
      {/* Mesh backrest frame */}
      <RoundedBox args={[0.42, 0.48, 0.04]} radius={0.02} smoothness={3} position={[0, 0.72, -0.2]} rotation={[-0.08, 0, 0]} castShadow>
        <meshStandardMaterial color="#d4d8df" roughness={0.6} metalness={0.08} />
      </RoundedBox>
      {/* Inner mesh inset */}
      <mesh position={[0, 0.72, -0.178]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.34, 0.4, 0.012]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
    </group>
  );
}

function ZebraStationZone() {
  return (
    <group name="zone-zebra" position={[-1.56, 0, 1.32]}>
      {/* Stainless steel desk top (0.78m x 1.24m) */}
      <RoundedBox args={[0.78, 0.045, 1.24]} radius={0.008} smoothness={2} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...STEEL} />
      </RoundedBox>

      {/* Under-desk stainless drawer cabinet (left/front end, matching 03.jpg & 04.jpg) */}
      <mesh position={[0, 0.37, 0.38]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.72, 0.44]} />
        <meshStandardMaterial color="#b9c0ca" roughness={0.38} metalness={0.58} />
      </mesh>
      {/* Drawer seam lines */}
      {[0.2, 0.42, 0.62].map((y, idx) => (
        <mesh key={idx} position={[0.362, y, 0.38]}>
          <boxGeometry args={[0.01, 0.012, 0.32]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* Desk legs on rear end */}
      <mesh position={[-0.34, 0.37, -0.57]} castShadow>
        <boxGeometry args={[0.04, 0.74, 0.04]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>
      <mesh position={[0.34, 0.37, -0.57]} castShadow>
        <boxGeometry args={[0.04, 0.74, 0.04]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>

      {/* Zebra ZT411 industrial thermal printer (front-left on desk, facing right/aisle) */}
      <ZebraZT411Printer position={[-0.1, 0.77, 0.38]} rotation={[0, Math.PI / 2, 0]} />

      {/* Desktop Monitor */}
      <group position={[-0.16, 0.77, -0.14]} rotation={[0, Math.PI / 2, 0]}>
        {/* Base */}
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.18, 0.018, 0.14]} />
          <meshStandardMaterial color="#1f242c" roughness={0.45} metalness={0.3} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 0.12, -0.04]} castShadow>
          <boxGeometry args={[0.045, 0.22, 0.03]} />
          <meshStandardMaterial color="#1f242c" roughness={0.45} metalness={0.3} />
        </mesh>
        {/* Display panel */}
        <RoundedBox args={[0.52, 0.31, 0.024]} radius={0.008} smoothness={2} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#181c22" roughness={0.4} metalness={0.25} />
        </RoundedBox>
        {/* Crisp UI screen */}
        <mesh position={[0, 0.28, 0.013]}>
          <planeGeometry args={[0.49, 0.28]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#cbd5e1" emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
      </group>

      {/* Keyboard & Mouse */}
      <mesh position={[0.12, 0.78, -0.14]} castShadow>
        <boxGeometry args={[0.14, 0.015, 0.42]} />
        <meshStandardMaterial color="#272b33" roughness={0.55} />
      </mesh>
      <RoundedBox args={[0.09, 0.026, 0.058]} radius={0.012} smoothness={2} position={[0.12, 0.785, -0.44]} castShadow>
        <meshStandardMaterial color="#272b33" roughness={0.45} />
      </RoundedBox>

      {/* Stacked label rolls next to Zebra printer */}
      <LabelRoll position={[0.14, 0.82, 0.18]} radius={0.055} height={0.09} stripeColor="#4b86b4" />
      <LabelRoll position={[0.14, 0.91, 0.18]} radius={0.055} height={0.08} stripeColor="#5ea89b" />
      <LabelRoll position={[-0.12, 0.82, -0.48]} radius={0.052} height={0.08} />

      {/* Ergonomic office chair positioned directly at the Zebra workstation for the seated operator */}
      <ErgonomicChair position={[0.64, 0, -0.12]} rotation={[0, -Math.PI / 2 + 0.08, 0]} />
    </group>
  );
}

// Reusable stainless steel worktable (for Embolsado & Seedless)
function StainlessTable({ width, depth, height = 0.86 }) {
  const hw = width / 2 - 0.04;
  const hd = depth / 2 - 0.04;
  const legPos = [
    [-hw, height / 2, -hd],
    [hw, height / 2, -hd],
    [-hw, height / 2, hd],
    [hw, height / 2, hd],
  ];

  return (
    <group>
      {/* Brushed stainless top */}
      <RoundedBox args={[width, 0.042, depth]} radius={0.008} smoothness={2} position={[0, height, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...STEEL} />
      </RoundedBox>
      {/* Legs */}
      {legPos.map((p, idx) => (
        <mesh key={idx} position={p} castShadow receiveShadow>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial {...STEEL_DARK} />
        </mesh>
      ))}
      {/* Lower perimeter frame bars */}
      <mesh position={[0, 0.2, -hd]}>
        <boxGeometry args={[width - 0.08, 0.024, 0.024]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>
      <mesh position={[0, 0.2, hd]}>
        <boxGeometry args={[width - 0.08, 0.024, 0.024]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>
      <mesh position={[-hw, 0.2, 0]}>
        <boxGeometry args={[0.024, 0.024, depth - 0.08]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>
      <mesh position={[hw, 0.2, 0]}>
        <boxGeometry args={[0.024, 0.024, depth - 0.08]} />
        <meshStandardMaterial {...STEEL_DARK} />
      </mesh>
    </group>
  );
}

// 3. EMBOLSADO: Full 4.0 m x 0.8 m stainless packing bench along right edge
function EmbolsadoZone() {
  const stationZs = [-1.32, -0.44, 0.44, 1.32];

  return (
    <group name="zone-embolsado" position={[1.6, 0, 0]}>
      <StainlessTable width={0.78} depth={4.0} height={0.86} />

      {/* 4 packing stations evenly distributed along the 4.0 m bench */}
      {stationZs.map((z, idx) => (
        <group key={idx} position={[0, 0.885, z]}>
          <PolyBag position={[-0.12, 0, -0.08]} rotation={[0, 0.08, 0]} />
          <PolyBag position={[-0.1, 0.015, 0.18]} rotation={[0, -0.15, 0]} />
          <LabelRoll position={[0.16, 0.042, -0.22]} radius={0.052} height={0.08} stripeColor="#4b86b4" />
          <LabelRoll position={[0.18, 0.042, 0.14]} radius={0.048} height={0.075} stripeColor="#14b8a6" />
          {/* Printed label cards */}
          <mesh position={[0.12, 0.005, -0.02]} receiveShadow>
            <boxGeometry args={[0.14, 0.01, 0.18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 4. SEEDLESS: 1.5 m wide stainless packing table along front edge (X: -0.3 to +1.2)
function SeedlessZone() {
  return (
    <group name="zone-seedless" position={[0.45, 0, 1.56]}>
      <StainlessTable width={1.46} depth={0.64} height={0.84} />

      {/* Packed puffy bags + flat zip bags + label sheet stack */}
      <group position={[0, 0.865, 0]}>
        <PolyBag position={[-0.46, 0.05, -0.04]} rotation={[0, 0.3, 0]} puffy />
        <PolyBag position={[-0.22, 0.045, 0.12]} rotation={[0, -0.2, 0]} scale={0.88} puffy />
        <PolyBag position={[0.02, 0.005, -0.06]} rotation={[0, 0.05, 0]} />
        <PolyBag position={[0.36, 0.05, 0.04]} rotation={[0, -0.35, 0]} puffy />

        {/* Green-striped label sheet stack */}
        <mesh position={[0.06, 0.008, 0.15]} receiveShadow>
          <boxGeometry args={[0.16, 0.016, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.55} />
        </mesh>
        <mesh position={[0.06, 0.017, 0.15]}>
          <boxGeometry args={[0.12, 0.002, 0.14]} />
          <meshStandardMaterial color="#10b981" roughness={0.5} />
        </mesh>

        {/* White tray/stack on far right */}
        <mesh position={[0.56, 0.018, -0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.18, 0.036, 0.24]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}

export default function Furniture() {
  return (
    <group name="room-furniture">
      <EstanteZone />
      <ZebraStationZone />
      <EmbolsadoZone />
      <SeedlessZone />
    </group>
  );
}
