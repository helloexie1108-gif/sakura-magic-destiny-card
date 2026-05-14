import type { GameAction, GameState, GestureDebugInfo, GestureEvent, GestureName } from "../types";

type Landmark = { x: number; y: number; z?: number };

export interface GestureSample {
  palmCenter: { x: number; y: number };
  indexTip: { x: number; y: number };
  thumbTip: { x: number; y: number };
  trackingPoint: { x: number; y: number };
  extendedFingers: number;
  pinchDistance: number;
  palmSize: number;
  timestamp: number;
}

export interface GestureRuntime {
  samples: GestureSample[];
  lastActionAt: number;
  lastCooldownMs: number;
  swipeAnchor: { x: number; y: number; timestamp: number } | null;
  swipeTriggeredInGesture: boolean;
  swipeTransitionUntil: number;
  pinchArmed: boolean;
  openPalmArmed: boolean;
  pinchStartedAt: number | null;
  openPalmStartedAt: number | null;
  holdStartedAt: number | null;
  holdAnchor: { x: number; y: number } | null;
  circleStartedAt: number | null;
  lastGesture: GestureName;
}

export const emptyGestureDebug: GestureDebugInfo = {
  gesture: "none",
  candidateGesture: "none",
  confidence: 0,
  palmCenter: null,
  indexTip: null,
  thumbTip: null,
  extendedFingers: 0,
  pinchDistance: null,
  swipeDx: 0,
  swipeDy: 0,
  gestureDragOffset: 0,
  circleAngleDeg: 0,
  cooldownRemaining: 0,
  blockedReason: "",
  fps: 0,
  handPresent: false,
  modelReady: false,
  detectorRunning: false,
  videoSize: null
};

export function createGestureRuntime(): GestureRuntime {
  return {
    samples: [],
    lastActionAt: 0,
    lastCooldownMs: 0,
    swipeAnchor: null,
    swipeTriggeredInGesture: false,
    swipeTransitionUntil: 0,
    pinchArmed: true,
    openPalmArmed: true,
    pinchStartedAt: null,
    openPalmStartedAt: null,
    holdStartedAt: null,
    holdAnchor: null,
    circleStartedAt: null,
    lastGesture: "none"
  };
}

export function landmarksToSample(landmarks: Landmark[], timestamp: number): GestureSample {
  const palmIds = [0, 5, 9, 13, 17];
  const palmCenter = palmIds.reduce(
    (center, id) => ({ x: center.x + landmarks[id].x / palmIds.length, y: center.y + landmarks[id].y / palmIds.length }),
    { x: 0, y: 0 }
  );
  const indexTip = { x: landmarks[8].x, y: landmarks[8].y };
  const thumbTip = { x: landmarks[4].x, y: landmarks[4].y };
  const pinchDistance = distance(thumbTip, indexTip);
  const palmSize = Math.max(0.001, distance(landmarks[5], landmarks[17]));
  const extendedFingers = countExtendedFingers(landmarks);
  const trackingPoint = extendedFingers >= 1 || distance(indexTip, palmCenter) > palmSize * 0.72 ? indexTip : palmCenter;

  return { palmCenter, indexTip, thumbTip, trackingPoint, extendedFingers, pinchDistance, palmSize, timestamp };
}

export function analyzeGesture(runtime: GestureRuntime, sample: GestureSample, fps: number, gameState: GameState): {
  event: GestureEvent | null;
  debug: GestureDebugInfo;
} {
  runtime.samples.push(sample);
  runtime.samples = runtime.samples.filter((item) => sample.timestamp - item.timestamp <= 1600);

  const cooldownRemaining = Math.max(0, runtime.lastCooldownMs - (sample.timestamp - runtime.lastActionAt));
  const cooldownActive = cooldownRemaining > 0;
  const swipeTransitionActive = sample.timestamp < runtime.swipeTransitionUntil;
  const stateBlocksGestures = gameState === "SHUFFLING" || gameState === "DRAWING" || gameState === "REVEALING" || gameState === "RESULT" || gameState === "RESETTING";
  let gesture: GestureName = "hand_detected";
  let candidateGesture: GestureName = "hand_detected";
  let confidence = 0.45;
  let action: GameAction | undefined;
  let blockedReason = stateBlocksGestures ? `state:${gameState}` : swipeTransitionActive ? "swipe-transition" : cooldownActive ? "cooldown" : "";

  const swipe = detectSwipe(runtime, sample);
  const circle = detectCircle(runtime.samples, sample.timestamp);
  const normalizedPinch = sample.pinchDistance / sample.palmSize;
  const pinchCandidate = (sample.pinchDistance < 0.075 || normalizedPinch < 0.72) && sample.extendedFingers <= 2;
  const pinchConfirm = (sample.pinchDistance < 0.052 || normalizedPinch < 0.48) && sample.extendedFingers <= 2;
  const isOpenPalm = sample.extendedFingers >= (gameState === "LOCKED" ? 3 : 4) && normalizedPinch > 0.78;

  if (!pinchCandidate && normalizedPinch > 0.95) runtime.pinchArmed = true;
  if (!isOpenPalm && sample.extendedFingers <= 2) runtime.openPalmArmed = true;
  if (pinchConfirm && runtime.pinchStartedAt === null) runtime.pinchStartedAt = sample.timestamp;
  if (!pinchConfirm) runtime.pinchStartedAt = null;
  if (isOpenPalm && runtime.openPalmStartedAt === null) runtime.openPalmStartedAt = sample.timestamp;
  if (!isOpenPalm) runtime.openPalmStartedAt = null;

  const canAct = !stateBlocksGestures && !cooldownActive && !swipeTransitionActive;

  if (gameState === "LOCKED") {
    if (isOpenPalm) {
      candidateGesture = "open_palm";
      confidence = 0.82;
      if (canAct && runtime.openPalmArmed && runtime.openPalmStartedAt && sample.timestamp - runtime.openPalmStartedAt >= 180) {
        gesture = "open_palm";
        action = "FLIP_CARD";
        confidence = 0.9;
        runtime.openPalmArmed = false;
      }
    }
  } else if (gameState === "SELECTING" || gameState === "CAMERA_READY") {
    if (circle.detected || circle.angleDeg > 120) {
      candidateGesture = "circle";
      confidence = Math.min(0.9, 0.45 + circle.angleDeg / 360);
      if (canAct && circle.detected) {
        gesture = "circle";
        action = "SHUFFLE_CARDS";
        confidence = 0.88;
        runtime.circleStartedAt = sample.timestamp;
      }
    } else if (pinchCandidate || pinchConfirm) {
      candidateGesture = "pinch";
      confidence = pinchConfirm ? 0.88 : 0.62;
      if (canAct && runtime.pinchArmed && runtime.pinchStartedAt && sample.timestamp - runtime.pinchStartedAt >= 180) {
        gesture = "pinch";
        action = "CONFIRM_CARD";
        confidence = 0.92;
        runtime.pinchArmed = false;
      }
    } else if (swipe.candidate) {
      candidateGesture = swipe.dx < 0 ? "swipe_left" : "swipe_right";
      confidence = swipe.triggered ? 0.88 : 0.6;
      if (runtime.swipeTriggeredInGesture && !blockedReason) blockedReason = "swipe-lock";
      if (canAct && swipe.triggered && !runtime.swipeTriggeredInGesture) {
        gesture = swipe.dx < 0 ? "swipe_left" : "swipe_right";
        action = swipe.dx < 0 ? "NEXT_CARD" : "PREV_CARD";
        confidence = 0.9;
        runtime.swipeTriggeredInGesture = true;
        runtime.swipeTransitionUntil = sample.timestamp + 540;
      }
    }
  }

  if (action) {
    runtime.lastActionAt = sample.timestamp;
    runtime.lastCooldownMs = getCooldownMs(action);
    runtime.lastGesture = gesture;
    blockedReason = "";
  } else if (candidateGesture !== "hand_detected" && !blockedReason) {
    blockedReason = "candidate";
  }

  return {
    event: action ? { gesture, action, confidence, timestamp: sample.timestamp } : null,
    debug: {
      gesture,
      candidateGesture,
      confidence,
      palmCenter: sample.palmCenter,
      indexTip: sample.indexTip,
      thumbTip: sample.thumbTip,
      extendedFingers: sample.extendedFingers,
      pinchDistance: sample.pinchDistance,
      swipeDx: swipe.dx,
      swipeDy: swipe.dy,
      gestureDragOffset: swipe.dragOffset,
      circleAngleDeg: circle.angleDeg,
      cooldownRemaining,
      blockedReason,
      fps,
      handPresent: true,
      modelReady: true,
      detectorRunning: true,
      videoSize: null
    }
  };
}

export function resetGestureRuntime(runtime: GestureRuntime) {
  runtime.samples = [];
  runtime.lastActionAt = 0;
  runtime.lastCooldownMs = 0;
  runtime.swipeAnchor = null;
  runtime.swipeTriggeredInGesture = false;
  runtime.swipeTransitionUntil = 0;
  runtime.pinchArmed = true;
  runtime.openPalmArmed = true;
  runtime.pinchStartedAt = null;
  runtime.openPalmStartedAt = null;
  runtime.holdStartedAt = null;
  runtime.holdAnchor = null;
  runtime.circleStartedAt = null;
  runtime.lastGesture = "none";
}

function detectSwipe(runtime: GestureRuntime, sample: GestureSample): { candidate: boolean; triggered: boolean; dx: number; dy: number; dragOffset: number } {
  const point = sample.trackingPoint;
  if (!runtime.swipeAnchor) {
    runtime.swipeAnchor = { x: point.x, y: point.y, timestamp: sample.timestamp };
  }

  const anchor = runtime.swipeAnchor;
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const age = sample.timestamp - anchor.timestamp;
  const neutral = absDx < 0.024 || absDy > 0.26 || age > 850;

  if (neutral && !runtime.swipeTriggeredInGesture && age > 120) {
    runtime.swipeAnchor = { x: point.x, y: point.y, timestamp: sample.timestamp };
    return { candidate: false, triggered: false, dx: 0, dy: 0, dragOffset: 0 };
  }

  if (runtime.swipeTriggeredInGesture && absDx < 0.032) {
    runtime.swipeTriggeredInGesture = false;
    runtime.swipeAnchor = { x: point.x, y: point.y, timestamp: sample.timestamp };
    return { candidate: false, triggered: false, dx: 0, dy: 0, dragOffset: 0 };
  }

  if (age > 850) {
    runtime.swipeTriggeredInGesture = false;
    runtime.swipeAnchor = { x: point.x, y: point.y, timestamp: sample.timestamp };
    return { candidate: false, triggered: false, dx: 0, dy: 0, dragOffset: 0 };
  }

  const candidate = absDx > 0.02 && absDx > absDy * 0.82 && absDy < 0.24;
  const triggered = absDx > 0.085 && absDx > absDy * 0.9 && absDy < 0.24 && age <= 760;
  return { candidate, triggered, dx, dy, dragOffset: candidate ? clamp(dx * 560, -48, 48) : 0 };
}

function detectCircle(samples: GestureSample[], now: number): { detected: boolean; angleDeg: number } {
  const windowSamples = samples.filter((sample) => now - sample.timestamp <= 1500);
  if (windowSamples.length < 8) return { detected: false, angleDeg: 0 };
  const center = windowSamples.reduce(
    (sum, sample) => ({ x: sum.x + sample.indexTip.x / windowSamples.length, y: sum.y + sample.indexTip.y / windowSamples.length }),
    { x: 0, y: 0 }
  );
  const angles = windowSamples.map((sample) => Math.atan2(sample.indexTip.y - center.y, sample.indexTip.x - center.x));
  let rotation = 0;
  for (let index = 1; index < angles.length; index += 1) {
    let delta = angles[index] - angles[index - 1];
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    rotation += delta;
  }
  const radius = windowSamples.reduce((sum, sample) => sum + distance(sample.indexTip, center), 0) / windowSamples.length;
  const angleDeg = Math.abs(rotation) * (180 / Math.PI);
  return { detected: angleDeg > 220 && radius > 0.035 && radius < 0.28, angleDeg };
}

function countExtendedFingers(landmarks: Landmark[]): number {
  const wrist = landmarks[0];
  const fingers = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18]
  ];
  const extended = fingers.filter(([tip, pip]) => {
    const tipPoint = landmarks[tip];
    const pipPoint = landmarks[pip];
    const vertical = tipPoint.y < pipPoint.y - 0.014;
    const radial = distance(tipPoint, wrist) > distance(pipPoint, wrist) + 0.022;
    return vertical || radial;
  }).length;
  const thumbExtended =
    distance(landmarks[4], landmarks[9]) > distance(landmarks[3], landmarks[9]) + 0.026 ||
    distance(landmarks[4], wrist) > distance(landmarks[3], wrist) + 0.026
      ? 1
      : 0;
  return extended + thumbExtended;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getCooldownMs(action: GameAction): number {
  if (action === "NEXT_CARD" || action === "PREV_CARD") return 420;
  if (action === "CONFIRM_CARD") return 600;
  if (action === "FLIP_CARD") return 800;
  if (action === "SHUFFLE_CARDS") return 1500;
  return 700;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
