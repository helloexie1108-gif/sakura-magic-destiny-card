import type { DestinyCard } from "../types";

export function weightedPick(cards: DestinyCard[]): DestinyCard {
  const weights = cards.map((card) => {
    if (card.rarity === "hidden") return 1;
    if (card.rarity === "epic") return 7;
    if (card.rarity === "rare") return 18;
    return 36;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;

  for (let index = 0; index < cards.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return cards[index];
  }

  return cards[cards.length - 1];
}

export function drawRitual(cards: DestinyCard[], selectedCard: DestinyCard): DestinyCard[] {
  const first = weightedPick(cards.filter((card) => card.id !== selectedCard.id));
  const second = weightedPick(cards.filter((card) => card.id !== selectedCard.id && card.id !== first.id));
  return [first, second, selectedCard];
}

export function wrapIndex(index: number, length: number): number {
  return (index + length) % length;
}

export function getCardElementKey(card: DestinyCard): string {
  const text = `${card.name}${card.type}`;
  if (card.rarity === "hidden" || text.includes("无") || text.includes("隐藏")) return "void";
  if (/[花樱桃莲蜜糖]/.test(text)) return "flower";
  if (text.includes("蝶")) return "butterfly";
  if (/[火焰]/.test(text)) return "fire";
  if (/[风羽云雾音弦]/.test(text)) return "wind";
  if (/[水海泉露璃雨]/.test(text)) return "water";
  if (/[雷极曜]/.test(text)) return "thunder";
  if (/[光辉晶灯祝]/.test(text)) return "light";
  if (/[暗夜影]/.test(text)) return "dark";
  if (text.includes("月")) return "moon";
  if (/[日阳冠]/.test(text)) return "sun";
  if (/[时砂]/.test(text)) return "time";
  if (/[梦幻霞绮]/.test(text)) return "dream";
  if (/[镜铭]/.test(text)) return "mirror";
  if (/[迷钥链愿]/.test(text)) return "maze";
  if (/[盾森珀]/.test(text)) return "guard";
  if (/[跳棉铃]/.test(text)) return "jump";
  if (/[雪霜]/.test(text)) return "snow";
  return "star";
}

export function createDestinySequence(cards: DestinyCard[]): DestinyCard[] {
  const pool = fisherYates(cards);
  const sequence: DestinyCard[] = [];

  while (pool.length) {
    const recent = sequence.slice(-2).map(getCardElementKey);
    const preferredIndex = pool.findIndex((card) => !recent.includes(getCardElementKey(card)));
    const nextIndex = preferredIndex >= 0 ? preferredIndex : 0;
    const [nextCard] = pool.splice(nextIndex, 1);
    sequence.push(nextCard);
  }

  return sequence;
}

function fisherYates(cards: DestinyCard[]) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
