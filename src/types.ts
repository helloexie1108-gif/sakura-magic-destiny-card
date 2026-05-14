export type GameAction =
  | "NEXT_CARD"
  | "PREV_CARD"
  | "CONFIRM_CARD"
  | "FLIP_CARD"
  | "SHUFFLE_CARDS"
  | "RESET_GAME"
  | "RECALIBRATE_GESTURE";

export type GameState =
  | "IDLE"
  | "CAMERA_READY"
  | "SHUFFLING"
  | "SELECTING"
  | "LOCKED"
  | "DRAWING"
  | "REVEALING"
  | "RESULT"
  | "RESETTING";

export type PerformanceMode = "low" | "normal";

export type CardRarity = "normal" | "rare" | "epic" | "hidden";

export interface DestinyCard {
  id: string;
  name: string;
  type: string;
  rarity: CardRarity;
  fortuneText: string;
  adviceText: string;
  buffText: string;
  barragePrompt: string;
  effectLevel: 1 | 2 | 3 | 4;
}

export type GestureName =
  | "none"
  | "hand_detected"
  | "swipe_left"
  | "swipe_right"
  | "pinch"
  | "open_palm"
  | "circle"
  | "hold"
  | "heart_reserved";

export interface GestureDebugInfo {
  gesture: GestureName;
  candidateGesture: GestureName;
  confidence: number;
  palmCenter: { x: number; y: number } | null;
  indexTip: { x: number; y: number } | null;
  thumbTip: { x: number; y: number } | null;
  extendedFingers: number;
  pinchDistance: number | null;
  swipeDx: number;
  swipeDy: number;
  gestureDragOffset: number;
  circleAngleDeg: number;
  cooldownRemaining: number;
  blockedReason: string;
  fps: number;
  handPresent: boolean;
  modelReady: boolean;
  detectorRunning: boolean;
  videoSize: { width: number; height: number } | null;
}

export interface CameraDebugInfo {
  origin: string;
  permissionState: PermissionState | "unknown";
  isReady: boolean;
  selectedDeviceId: string;
  deviceCount: number;
}

export interface GestureEvent {
  gesture: GestureName;
  action?: GameAction;
  confidence: number;
  timestamp: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}
