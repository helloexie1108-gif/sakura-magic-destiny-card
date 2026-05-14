import type { CSSProperties, ReactNode } from "react";
import type { DestinyCard } from "../types";

type ElementIcon =
  | "flower"
  | "wind"
  | "fire"
  | "water"
  | "thunder"
  | "light"
  | "dark"
  | "moon"
  | "sun"
  | "time"
  | "dream"
  | "mirror"
  | "maze"
  | "shield"
  | "jump"
  | "rain"
  | "snow"
  | "star"
  | "void";

interface ElementStyle {
  label: string;
  icon: ElementIcon;
  motif: string;
  colors: [string, string, string];
  variant?: string;
}

const elementStyleMap: Record<ElementIcon, ElementStyle> = {
  flower: { label: "FLOWER", icon: "flower", motif: "petals", colors: ["#fff2fb", "#ffc0e2", "#f4b04f"] },
  wind: { label: "WIND", icon: "wind", motif: "stream", colors: ["#f5fbff", "#bde7ff", "#f4c86f"] },
  fire: { label: "FIRE", icon: "fire", motif: "sparks", colors: ["#fff0c8", "#ff9b85", "#ff5f8d"] },
  water: { label: "WATER", icon: "water", motif: "ripples", colors: ["#eff9ff", "#9fdcff", "#d7b1ff"] },
  thunder: { label: "THUNDER", icon: "thunder", motif: "burst", colors: ["#fff7c8", "#f5cf54", "#ff87c7"] },
  light: { label: "LIGHT", icon: "light", motif: "halo", colors: ["#fffdf0", "#ffe68d", "#ffd0f1"] },
  dark: { label: "DARK", icon: "dark", motif: "orbit", colors: ["#f2e8ff", "#9c73d6", "#332057"] },
  moon: { label: "MOON", icon: "moon", motif: "orbit", colors: ["#fff7df", "#d7c8ff", "#7c66bd"] },
  sun: { label: "SUN", icon: "sun", motif: "rays", colors: ["#fff6d1", "#ffc873", "#ff9bcf"] },
  time: { label: "TIME", icon: "time", motif: "clock", colors: ["#fff3dc", "#d8b37a", "#c8a6ff"] },
  dream: { label: "DREAM", icon: "dream", motif: "mist", colors: ["#fff2ff", "#d7b6ff", "#ffc0df"] },
  mirror: { label: "MIRROR", icon: "mirror", motif: "reflection", colors: ["#f8fcff", "#bfe5ff", "#f5c7ff"] },
  maze: { label: "MAZE", icon: "maze", motif: "labyrinth", colors: ["#fff4fb", "#c4a2ff", "#f4b86f"] },
  shield: { label: "GUARD", icon: "shield", motif: "guard", colors: ["#fff8dc", "#aee7d6", "#f1bf72"] },
  jump: { label: "JUMP", icon: "jump", motif: "bounce", colors: ["#fff7ef", "#ffb7dc", "#f6d56d"] },
  rain: { label: "RAIN", icon: "rain", motif: "drops", colors: ["#f2fbff", "#9ed8ff", "#ffd4ed"] },
  snow: { label: "SNOW", icon: "snow", motif: "crystal", colors: ["#ffffff", "#c9edff", "#d6c3ff"] },
  star: { label: "STAR", icon: "star", motif: "starlight", colors: ["#fff8d6", "#ffd4ea", "#d59a4a"] },
  void: { label: "NOTHING", icon: "void", motif: "seal", colors: ["#ffffff", "#fff0b8", "#d5b45f"] }
};

export function CardFace({ card }: { card: DestinyCard }) {
  const element = getElementStyle(card);
  const variant = element.variant || getCardVariant(card);
  const style = {
    "--face-a": element.colors[0],
    "--face-b": element.colors[1],
    "--face-c": element.colors[2],
    "--motif-turn": `${(card.name.charCodeAt(0) % 12) * 30}deg`
  } as CSSProperties;

  return (
    <div
      className={`card-face card-face--${element.icon} card-face--${element.motif} card-face--${variant} card-face--${card.rarity}`}
      style={style}
    >
      <div className="card-face__texture" aria-hidden="true" />
      <p className="card-face__name" title={card.name}>
        {card.name}
      </p>
      <div className="card-face__motif" aria-hidden="true">
        <ElementGlyph icon={element.icon} name={card.name} />
      </div>
      <p className="card-face__label">{element.label}</p>
    </div>
  );
}

function getElementStyle(card: DestinyCard): ElementStyle {
  const text = `${card.name}${card.type}`;

  if (card.rarity === "hidden" || text.includes("无") || text.includes("隐藏")) return elementStyleMap.void;
  if (text.includes("蝶")) return { ...elementStyleMap.flower, label: "BUTTERFLY", variant: "butterfly" };
  if (text.includes("莲")) return { ...elementStyleMap.flower, label: "LOTUS", variant: "lotus", colors: ["#fff8fb", "#f7b8df", "#8ed6c5"] };
  if (text.includes("樱")) return { ...elementStyleMap.flower, label: "SAKURA", variant: "sakura" };
  if (text.includes("桃")) return { ...elementStyleMap.flower, label: "PEACH", variant: "peach", colors: ["#fff4f8", "#ffb2d2", "#f0a65c"] };
  if (/[花樱桃莲蝶蜜糖]/.test(text)) return elementStyleMap.flower;
  if (/[火焰]/.test(text)) return elementStyleMap.fire;
  if (/[风羽云雾音弦]/.test(text)) return elementStyleMap.wind;
  if (/[水海泉露璃]/.test(text)) return elementStyleMap.water;
  if (text.includes("雨")) return elementStyleMap.rain;
  if (/[雷极曜]/.test(text)) return elementStyleMap.thunder;
  if (/[光辉晶灯祝]/.test(text)) return elementStyleMap.light;
  if (/[暗夜影]/.test(text)) return elementStyleMap.dark;
  if (text.includes("月")) return elementStyleMap.moon;
  if (/[日阳冠]/.test(text)) return elementStyleMap.sun;
  if (/[时砂]/.test(text)) return elementStyleMap.time;
  if (/[梦幻霞绮]/.test(text)) return elementStyleMap.dream;
  if (/[镜铭]/.test(text)) return elementStyleMap.mirror;
  if (/[迷钥链愿]/.test(text)) return elementStyleMap.maze;
  if (/[盾森珀]/.test(text)) return elementStyleMap.shield;
  if (/[跳棉铃]/.test(text)) return elementStyleMap.jump;
  if (/[雪霜]/.test(text)) return elementStyleMap.snow;
  return elementStyleMap.star;
}

function getCardVariant(card: DestinyCard) {
  const code = card.name.charCodeAt(0) || 0;
  return `variant-${code % 7}`;
}

function ElementGlyph({ icon, name }: { icon: ElementIcon; name: string }): ReactNode {
  if (name.includes("蝶")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-fill" d="M48 49 C30 16 8 20 14 48 C18 68 36 66 48 52 Z M52 49 C70 16 92 20 86 48 C82 68 64 66 52 52 Z" />
        <path className="glyph-line thin" d="M50 45 V78 M38 29 C44 38 47 45 48 53 M62 29 C56 38 53 45 52 53 M31 69 C42 63 47 58 50 49 M69 69 C58 63 53 58 50 49" />
      </svg>
    );
  }

  if (name.includes("莲")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-fill" d="M50 18 C61 36 60 52 50 65 C40 52 39 36 50 18Z M31 35 C48 43 52 58 45 76 C29 67 22 50 31 35Z M69 35 C52 43 48 58 55 76 C71 67 78 50 69 35Z" />
        <path className="glyph-line thin" d="M20 79 C36 70 64 70 80 79 M28 87 C42 81 58 81 72 87" />
      </svg>
    );
  }

  if (name.includes("樱")) {
    return (
      <svg viewBox="0 0 100 100">
        <g className="glyph-fill">
          {[0, 72, 144, 216, 288].map((angle) => (
            <path key={angle} d="M50 16 C62 24 63 42 50 50 C37 42 38 24 50 16Z" transform={`rotate(${angle} 50 50)`} />
          ))}
        </g>
        <path className="glyph-line thin" d="M23 78 C43 64 62 68 78 54" />
      </svg>
    );
  }

  if (name.includes("雷")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-fill" d="M58 7 L24 56 H48 L39 93 L78 39 H55 Z" />
        <path className="glyph-line thin" d="M20 30 C35 25 47 27 60 22 M29 73 C48 66 65 70 82 59 M74 18 L88 8 M14 86 L28 75" />
      </svg>
    );
  }

  if (name.includes("时")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-line" d="M34 11 H66 M34 89 H66 M39 18 C38 34 45 42 50 50 C55 42 62 34 61 18 M39 82 C38 66 45 58 50 50 C55 58 62 66 61 82" />
        <path className="glyph-fill" d="M50 45 L57 56 H43 Z" />
        <circle className="glyph-line thin" cx="50" cy="50" r="36" />
      </svg>
    );
  }

  if (name.includes("梦")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-fill" d="M25 62 C16 45 32 28 49 37 C56 20 82 27 80 47 C94 52 88 76 70 75 H34 C25 75 20 69 25 62Z" />
        <circle className="glyph-line thin" cx="30" cy="28" r="6" />
        <circle className="glyph-line thin" cx="72" cy="28" r="4" />
        <path className="glyph-line thin" d="M24 84 C39 73 58 88 77 77" />
      </svg>
    );
  }

  if (name.includes("镜")) {
    return (
      <svg viewBox="0 0 100 100">
        <path className="glyph-fill" d="M50 9 L78 27 V58 C78 75 66 87 50 92 C34 87 22 75 22 58 V27 Z" />
        <path className="glyph-line" d="M35 27 H65 V64 H35 Z M50 27 V64 M32 77 H68" />
        <path className="glyph-line thin" d="M40 38 L60 55 M60 38 L40 55" />
      </svg>
    );
  }

  switch (icon) {
    case "flower":
      return (
        <svg viewBox="0 0 100 100">
          <g className="glyph-fill">
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx="50" cy="28" rx="12" ry="23" transform={`rotate(${angle} 50 50)`} />
            ))}
          </g>
          <circle className="glyph-line" cx="50" cy="50" r="9" />
        </svg>
      );
    case "wind":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-line" d="M18 38 C36 18 55 22 50 39 C45 55 26 47 34 34" />
          <path className="glyph-line thin" d="M20 57 C43 42 70 44 76 58 C82 72 64 78 52 68" />
          <path className="glyph-fill" d="M62 22 C72 30 73 47 60 58 C58 43 50 33 62 22Z" />
        </svg>
      );
    case "fire":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M52 12 C68 32 80 47 70 68 C62 85 36 88 27 68 C18 48 38 39 37 20 C45 28 48 36 48 45 C58 36 60 25 52 12Z" />
          <path className="glyph-line" d="M48 82 C36 68 42 56 55 43 C54 58 66 65 48 82Z" />
        </svg>
      );
    case "water":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M50 12 C64 32 75 47 75 62 C75 80 64 89 50 89 C36 89 25 80 25 62 C25 47 36 32 50 12Z" />
          <path className="glyph-line" d="M22 67 C36 58 52 76 78 62" />
        </svg>
      );
    case "thunder":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M57 8 L28 54 H49 L40 92 L75 41 H53 Z" />
          <path className="glyph-line thin" d="M25 29 L14 20 M72 76 L84 86 M79 23 L91 15" />
        </svg>
      );
    case "light":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M50 6 L59 39 L94 50 L59 61 L50 94 L41 61 L6 50 L41 39 Z" />
          <circle className="glyph-line" cx="50" cy="50" r="28" />
        </svg>
      );
    case "dark":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M64 14 C45 20 34 37 38 56 C41 74 56 85 73 84 C63 92 48 94 35 88 C16 79 8 57 16 38 C24 19 45 8 64 14Z" />
          <path className="glyph-line" d="M28 53 C43 38 62 37 77 51" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M68 12 C48 17 35 34 35 54 C35 73 48 87 67 90 C60 95 48 96 37 92 C18 84 9 62 17 41 C25 20 47 7 68 12Z" />
          <path className="glyph-line thin" d="M20 75 C42 58 64 58 86 75" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 100 100">
          <circle className="glyph-fill" cx="50" cy="50" r="22" />
          <path className="glyph-line" d="M50 7 V23 M50 77 V93 M7 50 H23 M77 50 H93 M19 19 L31 31 M69 69 L81 81 M81 19 L69 31 M31 69 L19 81" />
        </svg>
      );
    case "time":
      return (
        <svg viewBox="0 0 100 100">
          <circle className="glyph-line" cx="50" cy="50" r="34" />
          <path className="glyph-line" d="M50 26 V51 L67 64" />
          <path className="glyph-fill" d="M37 11 H63 L57 24 H43 Z M37 89 H63 L57 76 H43 Z" />
        </svg>
      );
    case "dream":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M25 62 C16 45 32 28 49 37 C56 20 82 27 80 47 C94 52 88 76 70 75 H34 C25 75 20 69 25 62Z" />
          <path className="glyph-line thin" d="M24 82 C40 73 58 88 76 78" />
        </svg>
      );
    case "mirror":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M50 10 L78 26 V58 C78 75 66 87 50 92 C34 87 22 75 22 58 V26 Z" />
          <path className="glyph-line" d="M35 28 H65 V63 H35 Z M32 76 H68" />
        </svg>
      );
    case "maze":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-line" d="M22 24 H78 V76 H22 Z M38 24 V60 H62 V40 H48 M22 50 H38 M62 60 H78" />
          <circle className="glyph-fill" cx="50" cy="50" r="5" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M50 9 L80 22 V45 C80 66 67 82 50 91 C33 82 20 66 20 45 V22 Z" />
          <path className="glyph-line" d="M50 25 V75 M34 47 H66" />
        </svg>
      );
    case "jump":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-line" d="M18 72 C33 28 69 28 82 70" />
          <path className="glyph-fill" d="M50 18 L58 40 L82 42 L63 56 L69 80 L50 66 L31 80 L37 56 L18 42 L42 40 Z" />
        </svg>
      );
    case "rain":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M24 42 C24 27 39 18 52 25 C60 13 82 22 80 42 Z" />
          <path className="glyph-line" d="M34 53 L27 74 M52 53 L45 78 M70 53 L63 74" />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-line" d="M50 12 V88 M17 31 L83 69 M83 31 L17 69" />
          <circle className="glyph-fill" cx="50" cy="50" r="9" />
        </svg>
      );
    case "void":
      return (
        <svg viewBox="0 0 100 100">
          <circle className="glyph-line" cx="50" cy="50" r="35" />
          <circle className="glyph-line thin" cx="50" cy="50" r="22" />
          <path className="glyph-line" d="M50 8 V24 M50 76 V92 M8 50 H24 M76 50 H92" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100">
          <path className="glyph-fill" d="M50 7 L61 38 L94 50 L61 62 L50 93 L39 62 L6 50 L39 38 Z" />
          <circle className="glyph-line" cx="50" cy="50" r="30" />
        </svg>
      );
  }
}
