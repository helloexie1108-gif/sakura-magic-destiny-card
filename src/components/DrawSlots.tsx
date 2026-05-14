import { motion } from "framer-motion";
import type { DestinyCard, GameState } from "../types";
import { CardView } from "./CardView";

interface DrawSlotsProps {
  cards: DestinyCard[];
  drawnCount: number;
  revealedCount: number;
  gameState: GameState;
}

export function DrawSlots({ cards, drawnCount, revealedCount, gameState }: DrawSlotsProps) {
  const labels = ["星之气息", "星之预感", "星之回应"];
  const resultMode = gameState === "RESULT";
  const completedSummon = drawnCount >= 3 && gameState === "DRAWING";

  return (
    <section className={`draw-slots ${resultMode ? "draw-slots--result" : ""} ${completedSummon ? "draw-slots--complete" : ""}`}>
      {labels.map((label, index) => {
        const card = cards[index];
        const hasCard = Boolean(card) && drawnCount > index;
        const revealed = Boolean(card) && hasCard;

        return (
          <motion.div
            className={`draw-slot ${hasCard ? "is-filled" : ""} ${revealed ? "is-revealed" : ""} ${index === 2 ? "is-final" : ""}`}
            key={label}
            initial={false}
            animate={{ y: hasCard ? 0 : 8, opacity: hasCard || cards.length === 0 ? 1 : 0.72 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
          >
            <div className="draw-slot__frame">
              <span className="draw-slot__label">{label}</span>
              {hasCard && card ? (
                <>
                  <motion.div
                    className="draw-slot__card-wrap"
                    key={card.id}
                    initial={{ opacity: 0, y: -120, x: index === 0 ? -90 : index === 2 ? 90 : 0, rotate: index === 0 ? -12 : index === 2 ? 12 : 0, scale: 1.18 }}
                    animate={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 170, damping: 17 }}
                  >
                    <span className="draw-slot__trail" aria-hidden="true" />
                    <CardView card={card} variant={resultMode && index === 2 ? "result" : "slot"} isBack={false} />
                  </motion.div>
                  {revealed && gameState !== "RESULT" && <span className="draw-slot__collected">已收集</span>}
                </>
              ) : (
                <div className="draw-slot__empty">
                  <span />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}
