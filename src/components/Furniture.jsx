import { RoundedBox } from '@react-three/drei';

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

function EstanteZone() {
  const rollColors = ['#e6eaf0', '#7c6bb3', '#4b86b4', '#e59a4a', '#5ea89b'];

  return (
    <group name="zone-estante" position={[-1.68, 0, -0.66]}>
      {/* Rear shelving bay */}
      <ShelvingUnit position={[0, 0, -0.58]} />
      {/* Front shelving bay */}
      <ShelvingUnit position={[0, 0, 0.58]} />

      {/* Top shelf: cardboard shipping boxes + open bag boxes (matches 01, 02, 03) */}
      <CardboardBox position={[0, 1.78, -0.85]} size={[0.42, 0.28, 0.44]} />
      <CardboardBox position={[0, 1.78, -0.34]} size={[0.42, 0.28, 0.44]} />
      <CardboardBox position={[0, 1.76, 0.3]} size={[0.42, 0.24, 0.42]} open />
      <CardboardBox position={[0, 1.76, 0.82]} size={[0.42, 0.24, 0.42]} open />

      {/* Shelf 3 (y=1.14): Organized rows of label rolls (inspired by 05.jpg) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const z = -1.02 + i * 0.22;
        const stripe = rollColors[i % rollColors.length];
        return (
          <group key={`s3-${i}`}>
            <LabelRoll position={[-0.12, 1.21, z]} radius={0.056} height={0.11} stripeColor={stripe} />
            <LabelRoll position={[0.1, 1.21, z]} radius={0.056} height={0.11} stripeColor={stripe} />
          </group>
        );
      })}

      {/* Shelf 2 (y=0.64): More label rolls & boxed stock */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={`s2-${i}`}>
          <LabelRoll position={[-0.11, 0.71, -0.95 + i * 0.22]} radius={0.058} height={0.11} color="#f3f4f6" stripeColor="#4b86b4" />
          <LabelRoll position={[0.11, 0.71, -0.95 + i * 0.22]} radius={0.058} height={0.11} color="#f3f4f6" stripeColor="#7c6bb3" />
        </group>
      ))}
      <CardboardBox position={[0, 0.79, 0.42]} size={[0.4, 0.26, 0.46]} />
      <CardboardBox position={[0, 0.79, 0.92]} size={[0.4, 0.26, 0.4]} />

      {/* Bottom shelf (y=0.16): Heavy supply cartons */}
      <CardboardBox position={[0, 0.31, -0.78]} size={[0.44, 0.27, 0.5]} />
      <CardboardBox position={[0, 0.31, -0.22]} size={[0.44, 0.27, 0.48]} />
      <CardboardBox position={[0, 0.31, 0.62]} size={[0.44, 0.27, 0.52]} />
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

      {/* Ergonomic office chair positioned naturally at desk */}
      <ErgonomicChair position={[0.64, 0, -0.12]} rotation={[0, -Math.PI / 2 + 0.12, 0]} />
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

// 3. EMBOLSADO: Long 3-station stainless packing bench along right wall
function EmbolsadoZone() {
  const stationZs = [-0.76, 0.0, 0.76];

  return (
    <group name="zone-embolsado" position={[1.58, 0, -0.58]}>
      <StainlessTable width={0.74} depth={2.36} height={0.86} />

      {/* 3 packing stations with zip bags, label rolls & printed sheets */}
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

// 4. SEEDLESS: Front-right stainless packing table with filled & flat bags
function SeedlessZone() {
  return (
    <group name="zone-seedless" position={[1.16, 0, 1.48]}>
      <StainlessTable width={1.42} depth={0.64} height={0.84} />

      {/* Packed puffy bags + flat zip bags + label sheet stack (matching 01, 02, 03) */}
      <group position={[0, 0.865, 0]}>
        <PolyBag position={[-0.44, 0.05, -0.04]} rotation={[0, 0.3, 0]} puffy />
        <PolyBag position={[-0.22, 0.045, 0.12]} rotation={[0, -0.2, 0]} scale={0.88} puffy />
        <PolyBag position={[0.02, 0.005, -0.06]} rotation={[0, 0.05, 0]} />
        <PolyBag position={[0.34, 0.05, 0.04]} rotation={[0, -0.35, 0]} puffy />

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
        <mesh position={[0.54, 0.018, -0.06]} castShadow receiveShadow>
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
