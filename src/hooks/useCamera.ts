import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraDevice, PerformanceMode } from "../types";

export function useCamera(performanceMode: PerformanceMode) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const refreshDevices = useCallback(async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = allDevices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `摄像头 ${index + 1}`
      }));
    setDevices(videoDevices);
    if (!selectedDeviceId && videoDevices[0]) setSelectedDeviceId(videoDevices[0].deviceId);
  }, [selectedDeviceId]);

  const refreshPermissionState = useCallback(async () => {
    try {
      const permission = await navigator.permissions?.query({ name: "camera" as PermissionName });
      if (permission) {
        setPermissionState(permission.state);
        permission.onchange = () => setPermissionState(permission.state);
      }
    } catch {
      setPermissionState("unknown");
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId = selectedDeviceId) => {
      if (isStartingRef.current) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(getCameraErrorMessage("NOT_SUPPORTED"));
        return;
      }

      try {
        isStartingRef.current = true;
        setError(null);
        stopCamera();
        const videoSize =
          performanceMode === "low"
            ? { width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 10, max: 12 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 12, max: 15 } };
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId }, ...videoSize }
            : { facingMode: "user", ...videoSize }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        setSelectedDeviceId(track.getSettings().deviceId || deviceId);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          await videoRef.current.play();
        }

        setIsReady(true);
        setPermissionState("granted");
        await refreshDevices();
      } catch (cameraError) {
        setError(getCameraErrorMessage(cameraError));
        if (cameraError instanceof DOMException && cameraError.name === "NotAllowedError") {
          setPermissionState("denied");
        }
        setIsReady(false);
      } finally {
        isStartingRef.current = false;
      }
    },
    [performanceMode, refreshDevices, selectedDeviceId, stopCamera]
  );

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      await startCamera(deviceId);
    },
    [startCamera]
  );

  useEffect(() => {
    refreshPermissionState();
    return () => stopCamera();
  }, [refreshPermissionState, stopCamera]);

  return {
    videoRef,
    devices,
    selectedDeviceId,
    isReady,
    isPreviewVisible,
    error,
    permissionState,
    startCamera,
    stopCamera,
    switchCamera,
    setIsPreviewVisible,
    refreshDevices,
    deviceLabel: devices.find((device) => device.deviceId === selectedDeviceId)?.label || "默认摄像头"
  };
}

function getCameraErrorMessage(error: unknown): string {
  if (error === "NOT_SUPPORTED") {
    return "当前浏览器不支持摄像头调用。请使用新版 Safari、Chrome 或 Edge，并确认页面通过 localhost 或 HTTPS 打开。";
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "摄像头权限被拒绝。请在浏览器地址栏或系统隐私设置里允许此页面使用摄像头，然后刷新页面。";
    }
    if (error.name === "NotFoundError") {
      return "没有检测到可用摄像头。请确认摄像头已连接，且没有被其他应用独占。";
    }
    if (error.name === "NotReadableError") {
      return "摄像头被其他应用占用或系统暂时无法读取。请关闭占用摄像头的应用后重试。";
    }
    if (error.name === "OverconstrainedError") {
      return "当前摄像头不支持请求的画面规格，正在建议切换摄像头或重启页面。";
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "摄像头启动失败，请检查权限后重试。";
}
