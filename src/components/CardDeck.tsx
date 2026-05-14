import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DestinyCard, GameAction, GameState, GestureName } from "../types";
import { CardView } from "./CardView";

interface CardDeckProps {
  currentCard: DestinyCard;
  previousCard: DestinyCard;
  nextCard: DestinyCard;
  gameState: GameState;
  isLocked: boolean;
  totalCards: number;
  currentIndex: number;
  cards: DestinyCard[];
  gestureDragOffset: number;
  candidateGesture: GestureName;
  lastAction: GameAction | null;
  onFocusIndex: (index: number) => void;
  onLongSelect: () => void;
}

const RING_RADIUS = 560;
const DRAG_SENSITIVITY = 0.22;
const INERTIA = 0.92;
const LONG_PRESS_MS = 1400;

export function CardDeck({
  currentCard,
  gameState,
  isLocked,
  totalCards,
  currentIndex,
  cards,
  gestureDragOffset,
  candidateGesture,
  lastAction,
  onFocusIndex,
  onLongSelect
}: CardDeckProps) {
  const isShuffling = gameState === "SHUFFLING";
  const isCenterRevealed = gameState === "DRAWING";
  const hideDeck = gameState === "REVEALING" || gameState === "RESULT";
  const canInteract = gameState === "CAMERA_READY" || gameState === "SELECTING" || gameState === "SHUFFLING";
  const step = 360 / totalCards;
  const [rotation, setRotation] = useState(-currentIndex * step);
  const [dragging, setDragging] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [switchDirection, setSwitchDirection] = useState<"left" | "right" | null>(null);
  const velocityRef = useRef(0);
  const dragRef = useRef({ x: 0, rotation: 0, moved: false });
  const pressTimerRef = useRef<number | null>(null);
  const inertiaTimerRef = useRef<number | null>(null);
  const longPressDoneRef = useRef(false);

  const ringCards = useMemo(() => cards.map((card, index) => ({ card, index })), [cards]);

  useEffect(() => {
    if (!dragging) setRotation(-currentIndex * step);
  }, [currentIndex, dragging, step]);

  useEffect(() => {
    if (lastAction !== "NEXT_CARD" && lastAction !== "PREV_CARD") return;
    setSwitchDirection(lastAction === "NEXT_CARD" ? "left" : "right");
    const timer = window.setTimeout(() => setSwitchDirection(null), 520);
    return () => window.clearTimeout(timer);
  }, [currentIndex, lastAction]);

  useEffect(() => {
    return () => {
      if (inertiaTimerRef.current) window.clearInterval(inertiaTimerRef.current);
      if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    };
  }, []);

  const snapToNearest = (value: number) => {
    const nextIndex = ((Math.round(-value / step) % totalCards) + totalCards) % totalCards;
    onFocusIndex(nextIndex);
    setRotation(-nextIndex * step);
  };

  const clearLongPress = () => {
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
    setPressing(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!canInteract) return;
    if (inertiaTimerRef.current) window.clearInterval(inertiaTimerRef.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, rotation, moved: false };
    velocityRef.current = 0;
    longPressDoneRef.current = false;
    setDragging(true);
    setPressing(true);
    pressTimerRef.current = window.setTimeout(() => {
      if (!dragRef.current.moved && canInteract) {
        longPressDoneRef.current = true;
        setPressing(false);
        onLongSelect();
      }
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    const dx = event.clientX - dragRef.current.x;
    if (Math.abs(dx) > 6) {
      dragRef.current.moved = true;
      clearLongPress();
    }
    const nextRotation = dragRef.current.rotation + dx * DRAG_SENSITIVITY;
    velocityRef.current = dx * DRAG_SENSITIVITY * 0.12;
    setRotation(nextRotation);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    clearLongPress();
    if (!longPressDoneRef.current) {
      let projected = rotation;
      inertiaTimerRef.current = window.setInterval(() => {
        velocityRef.current *= INERTIA;
        projected += velocityRef.current;
        setRotation(projected);
        if (Math.abs(velocityRef.current) < 0.05) {
          if (inertiaTimerRef.current) window.clearInterval(inertiaTimerRef.current);
          inertiaTimerRef.current = null;
          snapToNearest(projected);
        }
      }, 24);
    }
  };

  return (
    <section
      className={`deck deck--${gameState.toLowerCase()} ${dragging ? "is-dragging" : ""} ${pressing ? "is-long-pressing" : ""} ${isLocked && !hideDeck ? "is-locked" : ""} ${switchDirection ? `is-switching-${switchDirection}` : ""} ${candidateGesture === "swipe_left" ? "is-gesture-left" : ""} ${candidateGesture === "swipe_right" ? "is-gesture-right" : ""} ${candidateGesture === "circle" ? "is-circling" : ""} ${candidateGesture === "pinch" ? "is-pinching" : ""} ${candidateGesture === "open_palm" ? "is-opening" : ""}`}
      style={{ "--gesture-drag": `${gestureDragOffset}px`, "--gesture-tilt": `${gestureDragOffset * 0.08}deg` } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="deck__halo" />
      {isShuffling && <div className="deck__shuffle-ring" aria-hidden="true" />}
      <div className={`deck__arc ${hideDeck ? "is-hidden" : ""}`} aria-label="星光牌阵">
        <div className="deck__ring">
        {ringCards.map(({ card, index }) => {
          const offset = ((index - currentIndex + totalCards / 2) % totalCards) - totalCards / 2;
          const visibleOffset = Math.max(-13, Math.min(13, offset));
          const frontFactor = 1 - Math.min(1, Math.abs(visibleOffset) / 14);
          const isCenter = index === currentIndex;
          const isInFrontArc = Math.abs(offset) <= 13;
          const opacity = isCenter ? 1 : isInFrontArc ? 0.35 + frontFactor * 0.48 : 0.08;
          const scale = isCenter ? 1.08 : isInFrontArc ? 0.56 + frontFactor * 0.22 : 0.42;
          const gestureFlow = !isLocked ? (gestureDragOffset / 48) * 0.38 : 0;
          const flowOffset = visibleOffset + gestureFlow;
          const flowAngle = flowOffset * 5.6;
          const flowRad = ((flowAngle - 90) * Math.PI) / 180;
          const flowX = Math.cos(flowRad) * RING_RADIUS;
          const flowY = Math.sin(flowRad) * 210 + 118;
          const centerDragX = isCenter && !isLocked ? gestureDragOffset : 0;
          const centerDragRotate = isCenter && !isLocked ? gestureDragOffset * 0.08 : 0;
          const directionLift = !isCenter && ((gestureDragOffset < -6 && offset > 0 && offset <= 2) || (gestureDragOffset > 6 && offset < 0 && offset >= -2));
          const transform = isCenter
            ? `translate3d(${centerDragX}px, 62px, 0) translate(-50%, -50%) rotate(${centerDragRotate}deg) scale(${scale})`
            : `translate3d(${flowX}px, ${flowY}px, 0) translate(-50%, -50%) rotate(${flowAngle * 0.62}deg) scale(${scale})`;
          return (
            <div
              key={card.id}
              className={`deck__arc-card ${isCenter ? "is-center" : ""} ${directionLift ? "is-direction-preview" : ""}`}
              style={
                {
                  zIndex: Math.round(20 + frontFactor * 60) + (isCenter ? 80 : 0),
                  "--card-opacity": opacity,
                  opacity,
                  transform
                } as CSSProperties
              }
            >
              {isCenter ? <CardView card={card} variant="main" isBack={!isCenterRevealed} /> : <div className="mini-card-back" />}
              {isCenter && <div className="deck__energy-ring" />}
              {isCenter && gameState === "LOCKED" && <div className="deck__locked-tip">星牌已锁定</div>}
            </div>
          );
        })}
        </div>
      </div>
      <AnimatePresence>
        {(gameState === "LOCKED" || gameState === "DRAWING") && !hideDeck && (
          <motion.div className="deck__lock-sigil" initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
        )}
      </AnimatePresence>
    </section>
  );
}
