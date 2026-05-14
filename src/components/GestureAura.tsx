import type { GameAction, GestureDebugInfo } from "../types";

interface GestureAuraProps {
  gesture: GestureDebugInfo;
  lastAction: GameAction | null;
}

export function GestureAura({ gesture, lastAction }: GestureAuraProps) {
  const x = gesture.palmCenter ? `${gesture.palmCenter.x * 100}%` : "50%";
  const y = gesture.palmCenter ? `${gesture.palmCenter.y * 100}%` : "54%";
  const actionClass = lastAction ? `gesture-aura--${lastAction.toLowerCase().replaceAll("_", "-")}` : "";

  return (
    <div className={`gesture-aura ${gesture.handPresent ? "is-active" : ""} ${actionClass}`} aria-hidden="true">
      <div className="gesture-aura__field">
        <span className="gesture-aura__orb" style={{ left: x, top: y }} />
        <span className="gesture-aura__trail" style={{ left: x, top: y }} />
        <span className="gesture-aura__ring" style={{ left: x, top: y }} />
      </div>
      <div className="gesture-aura__status">{gesture.handPresent ? gestureText[gesture.gesture] : "等待手势感应"}</div>
    </div>
  );
}

const gestureText = {
  none: "等待手势感应",
  hand_detected: "手势能量已连接",
  swipe_left: "左滑流光",
  swipe_right: "右滑流光",
  pinch: "星光回应聚拢",
  open_palm: "掌心展开",
  circle: "星轨洗牌",
  hold: "星光充能完成",
  heart_reserved: "心愿接口预留"
};
