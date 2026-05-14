import { motion } from "framer-motion";
import type { DestinyCard } from "../types";
import { CardFace } from "./CardFace";

interface CardViewProps {
  card: DestinyCard;
  variant?: "main" | "side" | "slot" | "result";
  isBack?: boolean;
  label?: string;
}

export function CardView({ card, variant = "main", isBack = false, label }: CardViewProps) {
  const rarityClass = isBack ? "card-view--sealed" : `card-view--${card.rarity}`;

  return (
    <motion.article
      className={`card-view card-view--${variant} ${rarityClass} ${isBack ? "card-view--back" : "card-view--front"}`}
      layout
      initial={{ opacity: 0, y: 18, rotateY: -12 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className="card-view__shine" />
      {label && <p className="card-view__label">{label}</p>}
      {isBack ? (
        <>
          <div className="card-view__back-art" aria-hidden="true">
            <span />
            <b />
            <i />
          </div>
        </>
      ) : (
        <CardFace card={card} />
      )}
    </motion.article>
  );
}
