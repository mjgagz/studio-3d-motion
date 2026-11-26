import {
  ChevronDown,
  ChevronUp,
  Compass,
  Monitor,
  Pause,
  Play,
  Ruler,
  Smartphone,
} from 'lucide-react';
import { CAMERA_PRESETS } from '../data/roomLayout';

export default function Hud({
  isFlying,
  activePresetId,
  dronePhase,
  aspectMode,
  showLabels,
  collapsed,
  onToggleFly,
  onSelectPreset,
  onToggleLabels,
  onChangeAspect,
  onToggleCollapse,
}) {
  const activePreset = CAMERA_PRESETS.find((p) => p.id === activePresetId);
  const badgeCode = isFlying ? 'DRON' : activePreset?.code || 'LIBRE';
  const badgeTitle = isFlying ? dronePhase : activePreset?.label || 'Cámara libre';

  const zonePresets = CAMERA_PRESETS.filter((p) => p.id !== 'cenital');
  const cenitalPreset = CAMERA_PRESETS.find((p) => p.id === 'cenital');

  return (
    <>
      {/* Minimal top-left shot telemetry badge (hidden when HUD collapsed) */}
      {!collapsed && (
        <div className="shot-badge" aria-live="polite">
          <span className={`shot-dot ${isFlying ? 'is-live' : ''}`} aria-hidden="true" />
          <span className="shot-index">{badgeCode}</span>
          <span className="shot-divider" aria-hidden="true" />
          <span className="shot-title">{badgeTitle}</span>
        </div>
      )}

      {/* Floating translucent collapsible bottom HUD */}
      <div className={`hud-anchor ${collapsed ? 'is-collapsed' : ''}`}>
        {collapsed ? (
          <button
            type="button"
            className="hud-expand-pill"
            onClick={onToggleCollapse}
            aria-label="Mostrar controles"
            title="Mostrar controles (H)"
          >
            <ChevronUp size={15} strokeWidth={2} />
            <span className="tabular">{badgeCode}</span>
          </button>
        ) : (
          <nav className="hud-bar" aria-label="Controles de vuelo dron">
            {/* Play / Pause Continuous Drone Tour */}
            <button
              type="button"
              className={`hud-btn hud-btn-primary ${isFlying ? 'is-playing' : ''}`}
              onClick={onToggleFly}
              aria-pressed={isFlying}
              title={isFlying ? 'Pausar recorrido dron (Espacio)' : 'Iniciar recorrido dron (Espacio)'}
            >
              {isFlying ? (
                <Pause size={14} strokeWidth={2.2} />
              ) : (
                <Play size={14} strokeWidth={2.2} />
              )}
              <span>{isFlying ? 'Pausa' : 'Dron'}</span>
            </button>

            <span className="hud-sep" aria-hidden="true" />

            {/* Zone camera presets 1..5 */}
            <div className="hud-group" role="group" aria-label="Zonas">
              {zonePresets.map((preset, idx) => {
                const isActive = !isFlying && activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`hud-btn hud-num ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSelectPreset(preset.id)}
                    aria-pressed={isActive}
                    title={`${idx + 1}. ${preset.label}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <span className="hud-sep" aria-hidden="true" />

            {/* Cenital / Top-down overview (matches 01 & 02) */}
            {cenitalPreset && (
              <button
                type="button"
                className={`hud-btn ${!isFlying && activePresetId === 'cenital' ? 'is-active' : ''}`}
                onClick={() => onSelectPreset('cenital')}
                aria-pressed={!isFlying && activePresetId === 'cenital'}
                title="Vista Cenital 01/02 (Esc)"
              >
                <Compass size={14} strokeWidth={2} />
                <span>Cenital</span>
              </button>
            )}

            {/* Toggle architectural labels & dimensions (01.jpg) */}
            <button
              type="button"
              className={`hud-btn ${showLabels ? 'is-active' : ''}`}
              onClick={onToggleLabels}
              aria-pressed={showLabels}
              title="Mostrar/ocultar cotas y zonas (L)"
            >
              <Ruler size={14} strokeWidth={2} />
              <span>Cotas</span>
            </button>

            <span className="hud-sep" aria-hidden="true" />

            {/* Format selector: 16:9 Horizontal / 9:16 Vertical */}
            <div className="hud-segmented" role="group" aria-label="Formato">
              <button
                type="button"
                className={`hud-seg-btn ${aspectMode === '16:9' ? 'is-active' : ''}`}
                onClick={() => onChangeAspect('16:9')}
                aria-pressed={aspectMode === '16:9'}
                title="Formato 16:9 Horizontal (F)"
              >
                <Monitor size={13} strokeWidth={2} />
                <span className="tabular">16:9</span>
              </button>
              <button
                type="button"
                className={`hud-seg-btn ${aspectMode === '9:16' ? 'is-active' : ''}`}
                onClick={() => onChangeAspect('9:16')}
                aria-pressed={aspectMode === '9:16'}
                title="Formato 9:16 Vertical (F)"
              >
                <Smartphone size={13} strokeWidth={2} />
                <span className="tabular">9:16</span>
              </button>
            </div>

            {/* Collapse HUD button */}
            <button
              type="button"
              className="hud-btn hud-icon-only"
              onClick={onToggleCollapse}
              aria-label="Colapsar controles"
              title="Colapsar controles (H)"
            >
              <ChevronDown size={15} strokeWidth={2} />
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
