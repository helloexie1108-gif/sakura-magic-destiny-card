import type { CSSProperties } from "react";
import type { CardRarity, GameState, PerformanceMode } from "../types";

interface EffectLayerProps {
  rarity: CardRarity;
  gameState: GameState;
  performanceMode: PerformanceMode;
}

export function EffectLayer({ rarity, gameState, performanceMode }: EffectLayerProps) {
  const burst = gameState === "REVEALING";
  const petalCount = performanceMode === "low" ? 28 : 42;
  return (
    <div className={`effect-layer effect-layer--${rarity} effect-layer--${performanceMode} ${burst ? "is-bursting" : ""}`} aria-hidden="true">
      <div className="effect-layer__sakura-branch effect-layer__sakura-branch--left" />
      <div className="effect-layer__sakura-branch effect-layer__sakura-branch--right" />
      <div className="effect-layer__circle effect-layer__circle--outer" />
      <div className="effect-layer__circle effect-layer__circle--inner" />
      <div className="effect-layer__runes">
        {Array.from({ length: 12 }, (_, index) => <span key={index} style={{ "--i": index } as CSSProperties} />)}
      </div>
      <div className="effect-layer__stars" />
      <div className="effect-layer__petals">
        {Array.from({ length: petalCount }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--i": index,
                "--x": `${(index * 23 + (index % 5) * 11) % 100}vw`,
                "--drift": `${index % 2 === 0 ? 1 : -1}`,
                "--size": `${8 + (index % 5) * 3}px`,
                "--delay": `${index * -0.73}s`,
                "--duration": `${9 + (index % 7)}s`
              } as CSSProperties
            }
          />
        ))}
      </div>
      {rarity === "hidden" && burst && <div className="effect-layer__hidden-sigil">VOID</div>}
    </div>
  );
}
