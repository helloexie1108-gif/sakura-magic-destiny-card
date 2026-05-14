import { motion } from "framer-motion";
import type { DestinyCard, GameState } from "../types";
import { CardView } from "./CardView";

interface ResultPanelProps {
  gameState: GameState;
  ritualCards: DestinyCard[];
  revealedCount: number;
  onReset: () => void;
}

const stageLabels = ["星之气息", "星之预感", "星之回应"];

export function ResultPanel({ gameState, ritualCards, revealedCount, onReset }: ResultPanelProps) {
  const isVisible = ritualCards.length >= 3 && (gameState === "REVEALING" || gameState === "RESULT");
  if (!isVisible) return null;

  const finalCard = ritualCards[2];
  const finalRarity = getDisplayRarity(finalCard);
  const showCopy = gameState === "RESULT";
  const spell = finalCard.buffText || getBuffSpell(finalCard);
  const rarityNote = rarityNotes[finalRarity];
  const rarityLabel = rarityLabels[finalRarity];
  const finalScale = finalCardScale[finalRarity];

  return (
    <section className={`result result--${finalRarity} result--revealed-${revealedCount}`}>
      <div className="result__aura" aria-hidden="true" />
      {finalRarity === "hidden" && revealedCount >= 3 && (
        <>
          <motion.div className="result__hidden-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.95, 0] }} transition={{ duration: 1.35 }} />
          <motion.h1 className="result__hidden-title" initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: [0, 1, 0], scale: [0.84, 1.05, 1.16] }} transition={{ duration: 1.8 }}>
            无牌降临
          </motion.h1>
        </>
      )}
      <motion.div className="result-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <motion.p className="result-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {showCopy ? "星之回应已显现" : stageLabels[Math.max(0, Math.min(2, revealedCount - 1))] || "星光正在回应"}
        </motion.p>

        <div className="result-cards" aria-label="三阶段星牌结果">
          {ritualCards.map((card, index) => {
            const isRevealed = revealedCount > index || gameState === "RESULT";
            const isFinal = index === 2;
            const scale = isFinal ? finalScale : 1;
            return (
              <motion.div
                className={`result-card result-card--${index + 1} ${isRevealed ? "is-revealed" : ""} ${isFinal ? "is-final" : ""}`}
                key={`${card.id}-${index}`}
                initial={{ opacity: 0, y: 84, rotateY: -72, scale: 0.88 }}
                animate={isRevealed ? { opacity: 1, y: 0, rotateY: 0, scale } : { opacity: 0, y: 84, rotateY: -72, scale: 0.88 }}
                transition={{ duration: 0.92, ease: [0.2, 0.78, 0.22, 1] }}
              >
                <CardView card={card} variant="side" label={stageLabels[index]} />
              </motion.div>
            );
          })}
        </div>

        {showCopy && (
          <>
            <motion.div className="result-panel" initial={{ opacity: 0, y: 26, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.76, delay: 0.12 }}>
              <span className="result-corner result-corner--tl" aria-hidden="true" />
              <span className="result-corner result-corner--tr" aria-hidden="true" />
              <span className="result-corner result-corner--bl" aria-hidden="true" />
              <span className="result-corner result-corner--br" aria-hidden="true" />
              <h2>你抽到了【{finalCard.name}】</h2>
              <span className="result-level-badge">{rarityLabel}</span>
              <p className="result-rarity-note">{rarityNote}</p>
              <div className="result-body">
                <p><strong>今日星语</strong><span>{shortenText(finalCard.fortuneText)}</span></p>
                <p><strong>加强星运建议</strong><span>{shortenText(finalCard.adviceText)}</span></p>
                <p><strong>拆卡BUFF</strong><em>{spell}</em></p>
              </div>
            </motion.div>
            <button className="restart-button" type="button" onClick={onReset}>重新开始抽牌</button>
          </>
        )}
      </motion.div>
    </section>
  );
}

const rarityNotes = {
  normal: "轻盈星辉落下，适合稳稳拆这一包。",
  rare: "粉金星轨亮起，直播间惊喜正在靠近。",
  epic: "高能星阵展开，这一包的高光已点亮。",
  hidden: "唯一隐藏封印回应，无牌仪式已经降临。"
};

const rarityLabels = {
  normal: "普通星辉",
  rare: "稀有星辉",
  epic: "高能觉醒",
  hidden: "封印回应"
};

const finalCardScale = {
  normal: 1,
  rare: 1.03,
  epic: 1.06,
  hidden: 1.1
};

function getDisplayRarity(card: DestinyCard): DestinyCard["rarity"] {
  return card.name === "无牌" || card.type === "隐藏" ? "hidden" : card.rarity;
}

function shortenText(text: string) {
  const first = text.split(/[。！？]/)[0] || text;
  return first.length > 24 ? `${first.slice(0, 24)}。` : `${first}。`;
}

function getBuffSpell(card: DestinyCard) {
  const text = `${card.name}${card.type}`;
  if (card.rarity === "hidden" || text.includes("无")) return "无牌降临";
  if (/[花樱桃莲蝶]/.test(text)) return "花开回应";
  if (/[火焰]/.test(text)) return "星火觉醒";
  if (text.includes("月")) return "月光降临";
  if (/[光辉曜晶]/.test(text)) return "光芒回应";
  if (/[梦幻]/.test(text)) return "梦境共鸣";
  if (/[雷极]/.test(text)) return "雷光觉醒";
  if (/[雪霜]/.test(text)) return "雪光回应";
  if (/[风羽云]/.test(text)) return "风语回应";
  return card.barragePrompt.replace(/[！!。]/g, "").slice(0, 4) || "星光回应";
}
