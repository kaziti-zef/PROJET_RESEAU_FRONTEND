"use client";
// ============================================================
//  KamerStay — components/StepIndicator.tsx
//  Indicateur d'étapes pour les formulaires multi-pages (C7).
//  Styles inline (palette KamerStay) pour ne dépendre d'aucun
//  module CSS et rester cohérent partout.
// ============================================================

interface StepIndicatorProps {
  steps: string[];
  current: number; // index 0-based de l'étape active
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const couleur = done || active ? "#1A3C2E" : "rgba(26,60,46,0.25)";
        const bg = active ? "#1A3C2E" : done ? "#C9943A" : "transparent";
        const txt = active || done ? "#F7F3EC" : "rgba(26,60,46,0.5)";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  background: bg, color: txt,
                  border: `1.5px solid ${couleur}`,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#1A3C2E" : "rgba(26,60,46,0.55)",
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ width: 22, height: 1.5, background: "rgba(26,60,46,0.2)", flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
