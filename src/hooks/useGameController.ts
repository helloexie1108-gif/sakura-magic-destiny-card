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
  const [lockedCard, setLockedCard] = useState<DestinyCard | null>(null);
  const [drawnCount, setDrawnCount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const phaseTimersRef = useRef<number[]>([]);
  const drawingRef = useRef(false);

  const currentCard = cards[currentIndex] ?? cards[0] ?? destinyCards[0];

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

  const stepRandomCard = useCallback((direction: "next" | "prev") => {
    if (!canSelect || drawingRef.current || cards.length <= 1) return;
    const randomStep = Math.min(cards.length - 1, 1 + Math.floor(Math.random() * 4));
    const signedStep = direction === "next" ? randomStep : -randomStep;
    setLastAction(direction === "next" ? "NEXT_CARD" : "PREV_CARD");
    setCurrentIndex((index) => wrapIndex(index + signedStep, cards.length));
    setGameState("SELECTING");
  }, [canSelect, cards.length]);

  const confirmCardAtIndex = useCallback((index: number) => {
    if (!canConfirm || drawingRef.current || cards.length === 0) return;
    const targetIndex = wrapIndex(index, cards.length);
    const targetCard = cards[targetIndex];
    if (!targetCard || ritualCards.some((card) => card.id === targetCard.id)) return;
    setCurrentIndex(targetIndex);
    setLockedCard(targetCard);
    setGameState("LOCKED");
    setLastAction("CONFIRM_CARD");
  }, [canConfirm, cards, ritualCards]);

  const dispatch = useCallback(
    (action: GameAction) => {
      setLastAction(action);

      if (action === "RECALIBRATE_GESTURE") return;
      if (drawingRef.current && action !== "RESET_GAME") return;

      if (action === "SHUFFLE_CARDS" && (gameState === "CAMERA_READY" || gameState === "SELECTING")) {
        const selectedIds = new Set(ritualCards.map((card) => card.id));
        const nextCards = createDestinySequence(destinyCards).filter((card) => !selectedIds.has(card.id));
        setCards(nextCards);
        setCurrentIndex((index) => wrapIndex(index + 7 + Math.floor(Math.random() * 11), nextCards.length));
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
          setLockedCard(null);
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
        if (!currentCard || ritualCards.some((card) => card.id === currentCard.id)) return;
        setLockedCard(currentCard);
        setGameState("LOCKED");
        return;
      }

      if (action === "FLIP_CARD" && canFlip) {
        const cardToDraw = lockedCard ?? currentCard;
        if (!cardToDraw || ritualCards.some((card) => card.id === cardToDraw.id)) return;
        setRitualCards((selectedCards) => {
          if (selectedCards.length >= 3) return selectedCards;
          if (selectedCards.some((card) => card.id === cardToDraw.id)) return selectedCards;
          const nextCards = [...selectedCards, cardToDraw];
          setRevealedCount(0);
          setGameState("DRAWING");
          drawingRef.current = true;

          const collectTimer = window.setTimeout(() => {
            setDrawnCount(nextCards.length);
          }, 720);
          phaseTimersRef.current.push(collectTimer);

          if (nextCards.length < 3) {
            const timer = window.setTimeout(() => {
              setCards((remainingCards) => {
                const updatedCards = remainingCards.filter((card) => card.id !== cardToDraw.id);
                setCurrentIndex((index) => wrapIndex(index + 1 + Math.floor(Math.random() * 5), updatedCards.length || 1));
                return updatedCards;
              });
              setLockedCard(null);
              drawingRef.current = false;
              setGameState("SELECTING");
            }, 1120);
            phaseTimersRef.current.push(timer);
          } else {
            revealTimerRef.current = window.setTimeout(() => {
              setCards((remainingCards) => remainingCards.filter((card) => card.id !== cardToDraw.id));
              setRevealedCount(3);
              setLockedCard(null);
              drawingRef.current = false;
              setGameState("RESULT");
            }, 1180);
          }

          return nextCards;
        });
        return;
      }
    },
    [canConfirm, canFlip, canSelect, cards.length, clearTimers, currentCard, gameState, lockedCard, ritualCards]
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
    stepRandomCard,
    confirmCardAtIndex,
    dispatch,
    neighbors,
    totalCards: cards.length,
    cards,
    isLocked: gameState === "LOCKED" || gameState === "DRAWING" || gameState === "REVEALING" || gameState === "RESULT"
  };
}
