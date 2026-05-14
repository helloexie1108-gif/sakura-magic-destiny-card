import type { CameraDebugInfo, DestinyCard, GameAction, GameState, GestureDebugInfo, PerformanceMode } from "../types";

interface DebugPanelProps {
  visible: boolean;
  gameState: GameState;
  lastAction: GameAction | null;
  gesture: GestureDebugInfo;
  currentCard: DestinyCard;
  isLocked: boolean;
  deviceLabel: string;
  camera: CameraDebugInfo;
  performanceMode: PerformanceMode;
  onPerformanceModeChange: (mode: PerformanceMode) => void;
  onEmergencyAction: (action: GameAction) => void;
}

export function DebugPanel({
  visible,
  gameState,
  lastAction,
  gesture,
  currentCard,
  isLocked,
  deviceLabel,
  camera,
  performanceMode,
  onPerformanceModeChange,
  onEmergencyAction
}: DebugPanelProps) {
  if (!visible) return null;

  return (
    <aside className="debug-panel">
      <h3>Debug Mode</h3>
      <dl>
        <dt>GameState</dt><dd>{gameState}</dd>
        <dt>GameAction</dt><dd>{lastAction || "none"}</dd>
        <dt>handDetected</dt><dd>{gesture.handPresent ? "true" : "false"}</dd>
        <dt>Gesture</dt><dd>{gesture.gesture}</dd>
        <dt>Candidate</dt><dd>{gesture.candidateGesture}</dd>
        <dt>Confidence</dt><dd>{gesture.confidence.toFixed(2)}</dd>
        <dt>Palm</dt><dd>{gesture.palmCenter ? `${gesture.palmCenter.x.toFixed(2)}, ${gesture.palmCenter.y.toFixed(2)}` : "none"}</dd>
        <dt>IndexTip</dt><dd>{gesture.indexTip ? `${gesture.indexTip.x.toFixed(2)}, ${gesture.indexTip.y.toFixed(2)}` : "none"}</dd>
        <dt>ThumbTip</dt><dd>{gesture.thumbTip ? `${gesture.thumbTip.x.toFixed(2)}, ${gesture.thumbTip.y.toFixed(2)}` : "none"}</dd>
        <dt>Fingers</dt><dd>{gesture.extendedFingers}</dd>
        <dt>Pinch</dt><dd>{gesture.pinchDistance?.toFixed(3) || "none"}</dd>
        <dt>Swipe dx/dy</dt><dd>{gesture.swipeDx.toFixed(3)}, {gesture.swipeDy.toFixed(3)}</dd>
        <dt>DragOffset</dt><dd>{gesture.gestureDragOffset.toFixed(1)}px</dd>
        <dt>Circle</dt><dd>{gesture.circleAngleDeg.toFixed(0)}deg</dd>
        <dt>Cooldown</dt><dd>{Math.ceil(gesture.cooldownRemaining)}ms</dd>
        <dt>Blocked</dt><dd>{gesture.blockedReason || "none"}</dd>
        <dt>Card</dt><dd>{currentCard.name}</dd>
        <dt>Locked</dt><dd>{isLocked ? "yes" : "no"}</dd>
        <dt>FPS</dt><dd>{gesture.fps}</dd>
        <dt>Model</dt><dd>{gesture.modelReady ? "ready" : "loading"}</dd>
        <dt>Detector</dt><dd>{gesture.detectorRunning ? "running" : "waiting"}</dd>
        <dt>Video</dt><dd>{gesture.videoSize ? `${gesture.videoSize.width}x${gesture.videoSize.height}` : "none"}</dd>
        <dt>Origin</dt><dd>{camera.origin}</dd>
        <dt>Permission</dt><dd>{camera.permissionState}</dd>
        <dt>Ready</dt><dd>{camera.isReady ? "yes" : "no"}</dd>
        <dt>Devices</dt><dd>{camera.deviceCount}</dd>
        <dt>Perf</dt><dd>{performanceMode}</dd>
        <dt>Camera</dt><dd>{deviceLabel}</dd>
      </dl>
      <div className="debug-panel__mode">
        <button className={performanceMode === "low" ? "is-active" : ""} onClick={() => onPerformanceModeChange("low")}>低功耗</button>
        <button className={performanceMode === "normal" ? "is-active" : ""} onClick={() => onPerformanceModeChange("normal")}>普通</button>
      </div>
      <div className="debug-panel__buttons">
        <button onClick={() => onEmergencyAction("PREV_CARD")}>上一张</button>
        <button onClick={() => onEmergencyAction("NEXT_CARD")}>下一张</button>
        <button onClick={() => onEmergencyAction("CONFIRM_CARD")}>确认</button>
        <button onClick={() => onEmergencyAction("FLIP_CARD")}>翻牌</button>
        <button onClick={() => onEmergencyAction("RESET_GAME")}>重置</button>
      </div>
    </aside>
  );
}
