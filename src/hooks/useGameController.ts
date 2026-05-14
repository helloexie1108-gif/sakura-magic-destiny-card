import { useCallback, useMemo, useRef, useState } from "react";
import { destinyCards } from "../data/cards";
import type { DestinyCard, GameAction, GameState } from "../types";
import { createDestinySequence, wrapIndex } from "../utils/random";

export function useGameController() {
  const [cards, setCards] = useState(() => createDestinySequence(destinyCards));
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<GameAction | null>(null);
  const [ritualCards, setRitualCards] = useState<DestinyCard[]>([]);
  const [drawnCount, setDrawnCount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const phaseTimersRef = useRef<number[]>([]);
  const drawingRef = useRef(false);

  const currentCard = cards[currentIndex];
  const lockedCard = ritualCards[ritualCards.length - 1] || null;

  const canSelect = gameState === "CAMERA_READY" || gameState === "SHUFFLING" || gameState === "SELECTING";
  const canConfirm = gameState === "SELECTING" || gameState === "CAMERA_READY";
  const canFlip = gameState === "LOCKED";

  const clearTimers = useCallback(() => {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    phaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    phaseTimersRef.current = [];
  }, []);

  const setCameraReady = useCallback(() => {
    setGameState((state) => (state === "IDLE" ? "CAMERA_READY" : state));
  }, []);

  const setHandDetected = useCallback(() => {
    setGameState((state) => {
      if (state !== "CAMERA_READY") return state;
      const timer = window.setTimeout(() => setGameState("SELECTING"), 1200);
      phaseTimersRef.current.push(timer);
      return "SHUFFLING";
    });
  }, []);

  const focusCard = useCallback((index: number) => {
    setCurrentIndex(wrapIndex(index, cards.length));
    setGameState((state) => (state === "CAMERA_READY" ? "SELECTING" : state));
  }, [cards.length]);

  const dispatch = useCallback(
    (action: GameAction) => {
      setLastAction(action);

      if (action === "RECALIBRATE_GESTURE") return;
      if (drawingRef.current && action !== "RESET_GAME") return;

      if (action === "SHUFFLE_CARDS" && (gameState === "CAMERA_READY" || gameState === "SELECTING")) {
        setCards(createDestinySequence(destinyCards));
        setCurrentIndex((index) => wrapIndex(index + 7 + Math.floor(Math.random() * 11), cards.length));
        setGameState("SHUFFLING");
        const timer = window.setTimeout(() => setGameState("SELECTING"), 1200);
        phaseTimersRef.current.push(timer);
        return;
      }

      if (action === "RESET_GAME") {
        clearTimers();
        drawingRef.current = false;
        setGameState("RESETTING");
        window.setTimeout(() => {
          const nextCards = createDestinySequence(destinyCards);
          setCards(nextCards);
          setCurrentIndex(Math.floor(Math.random() * nextCards.length));
          setRitualCards([]);
          setDrawnCount(0);
          setRevealedCount(0);
          setGameState("SELECTING");
        }, 350);
        return;
      }

      if (action === "NEXT_CARD" && canSelect) {
        setCurrentIndex((index) => wrapIndex(index + 1, cards.length));
        setGameState("SELECTING");
        return;
      }

      if (action === "PREV_CARD" && canSelect) {
        setCurrentIndex((index) => wrapIndex(index - 1, cards.length));
        setGameState("SELECTING");
        return;
      }

      if (action === "CONFIRM_CARD" && canConfirm) {
        setGameState("LOCKED");
        return;
      }

      if (action === "FLIP_CARD" && canFlip) {
        setRitualCards((selectedCards) => {
          if (selectedCards.length >= 3) return selectedCards;
          const nextCards = [...selectedCards, currentCard];
          setRevealedCount(0);
          setGameState("DRAWING");
          drawingRef.current = true;

          const collectTimer = window.setTimeout(() => {
            setDrawnCount(nextCards.length);
          }, 720);
          phaseTimersRef.current.push(collectTimer);

          if (nextCards.length < 3) {
            const timer = window.setTimeout(() => {
              setCurrentIndex((index) => wrapIndex(index + 1 + Math.floor(Math.random() * 5), cards.length));
              drawingRef.current = false;
              setGameState("SELECTING");
            }, 1120);
            phaseTimersRef.current.push(timer);
          } else {
            revealTimerRef.current = window.setTimeout(() => {
              setRevealedCount(3);
              drawingRef.current = false;
              setGameState("RESULT");
            }, 1180);
          }

          return nextCards;
        });
        return;
      }
    },
    [canConfirm, canFlip, canSelect, cards.length, clearTimers, currentCard]
  );

  const neighbors = useMemo(
    () => ({
      previous: cards[wrapIndex(currentIndex - 1, cards.length)],
      next: cards[wrapIndex(currentIndex + 1, cards.length)]
    }),
    [cards, currentIndex]
  );

  return {
    gameState,
    currentCard,
    lockedCard,
    ritualCards,
    drawnCount,
    revealedCount,
    currentIndex,
    lastAction,
    isDebugMode,
    setIsDebugMode,
    setCameraReady,
    setHandDetected,
    focusCard,
    dispatch,
    neighbors,
    totalCards: cards.length,
    cards,
    isLocked: gameState === "LOCKED" || gameState === "DRAWING" || gameState === "REVEALING" || gameState === "RESULT"
  };
}
