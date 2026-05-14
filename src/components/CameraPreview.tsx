import { Camera, CameraOff, Play, RefreshCw, RotateCcw } from "lucide-react";
import type { RefObject } from "react";
import type { CameraDevice, GestureDebugInfo } from "../types";

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  devices: CameraDevice[];
  selectedDeviceId: string;
  isReady: boolean;
  isPreviewVisible: boolean;
  error: string | null;
  permissionState: PermissionState | "unknown";
  gesture: GestureDebugInfo;
  modelError: string | null;
  isModelReady: boolean;
  debugMode: boolean;
  onStart: () => void;
  onSwitch: (deviceId: string) => void;
  onTogglePreview: () => void;
  onRecalibrate: () => void;
}

export function CameraPreview({
  videoRef,
  devices,
  selectedDeviceId,
  isReady,
  isPreviewVisible,
  error,
  permissionState,
  gesture,
  modelError,
  isModelReady,
  debugMode,
  onStart,
  onSwitch,
  onTogglePreview,
  onRecalibrate
}: CameraPreviewProps) {
  const showPreview = debugMode && isPreviewVisible;
  return (
    <aside className={`camera-panel ${showPreview ? "" : "camera-panel--hidden-preview"} ${debugMode ? "camera-panel--debug" : ""}`}>
      <div className="camera-panel__video-wrap">
        <video ref={videoRef} className="camera-panel__video" playsInline muted />
        {!isReady && (
          <button type="button" className="camera-panel__start" onClick={onStart}>
            <Play size={18} />
            {error ? "重新请求摄像头" : "启动摄像头"}
          </button>
        )}
        {!showPreview && <div className="camera-panel__privacy">魔法感应运行中</div>}
        {error && (
          <div className="camera-panel__privacy camera-panel__privacy--error">
            {permissionState === "denied" ? "摄像头权限被拒绝" : "摄像头未启动"}
          </div>
        )}
        <div className={`camera-panel__badge ${gesture.handPresent ? "is-active" : ""}`}>
          {getGestureBadgeText(gesture, isReady)}
        </div>
      </div>

      {debugMode && <div className="camera-panel__controls">
        <button type="button" onClick={onStart} title="启动或重启摄像头">
          <RefreshCw size={16} />
        </button>
        <button type="button" onClick={onTogglePreview} title="显示或隐藏摄像头预览">
          {isPreviewVisible ? <Camera size={16} /> : <CameraOff size={16} />}
        </button>
        <button type="button" onClick={onRecalibrate} title="重新校准手势">
          <RotateCcw size={16} />
        </button>
        {devices.length > 1 && (
          <select value={selectedDeviceId} onChange={(event) => onSwitch(event.target.value)} aria-label="切换摄像头">
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        )}
      </div>}
      {(error || modelError) && <p className="camera-panel__error">{error || modelError}</p>}
      {permissionState === "denied" && (
        <p className="camera-panel__hint">
          当前站点权限状态是 denied。请检查地址栏站点设置里 localhost:5174 的摄像头权限；如果当前是内置浏览器，请用 Chrome/Safari 直接打开同一地址。
        </p>
      )}
      {!isModelReady && <p className="camera-panel__hint">手势模型加载中...</p>}
      {isModelReady && isReady && !gesture.detectorRunning && <p className="camera-panel__hint">等待视频帧进入识别...</p>}
    </aside>
  );
}

function getGestureBadgeText(gesture: GestureDebugInfo, isReady: boolean) {
  if (!isReady) return "等待摄像头";
  if (!gesture.handPresent) return "等待手掌";
  const active = gesture.gesture !== "hand_detected" && gesture.gesture !== "none" ? gesture.gesture : gesture.candidateGesture;
  const labels = {
    none: "感应中",
    hand_detected: "感应中",
    swipe_left: "左滑感应中",
    swipe_right: "右滑感应中",
    pinch: "星牌锁定中",
    open_palm: "星光展开中",
    circle: "牌阵重组中",
    hold: "星牌充能中",
    heart_reserved: "心愿感应中"
  };
  return labels[active] ?? "感应中";
}
