import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, GestureDebugInfo, GestureEvent, PerformanceMode } from "../types";
import {
  analyzeGesture,
  createGestureRuntime,
  emptyGestureDebug,
  landmarksToSample,
  resetGestureRuntime
} from "../utils/gesture";

interface UseHandGestureOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  gameState: GameState;
  performanceMode: PerformanceMode;
  onGesture: (event: GestureEvent) => void;
}

export function useHandGesture({ videoRef, enabled, gameState, performanceMode, onGesture }: UseHandGestureOptions) {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const runtimeRef = useRef(createGestureRuntime());
  const timerRef = useRef<number | null>(null);
  const onGestureRef = useRef(onGesture);
  const lastFrameAtRef = useRef(performance.now());
  const lastInferenceAtRef = useRef(0);
  const handPresentRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState<GestureDebugInfo>(emptyGestureDebug);
  const [isModelReady, setIsModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onGestureRef.current = onGesture;

  useEffect(() => {
    if (!enabled || landmarkerRef.current || isModelReady) return;
    let cancelled = false;

    async function loadModel() {
      try {
        setError(null);
        const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
        const options = {
          baseOptions: {
            modelAssetPath: "/mediapipe/hand_landmarker.task"
          },
          runningMode: "VIDEO" as const,
          numHands: 1,
          minHandDetectionConfidence: 0.34,
          minHandPresenceConfidence: 0.34,
          minTrackingConfidence: 0.34
        };
        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: "CPU" }
          });
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...options,
            baseOptions: options.baseOptions
          });
        }
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setIsModelReady(true);
          setDebugInfo((info) => ({ ...info, modelReady: true }));
        }
      } catch (modelError) {
        if (!cancelled) {
          setError(modelError instanceof Error ? modelError.message : "手势模型加载失败，请刷新页面后重试。");
        }
      }
    }

    loadModel();
    return () => {
      cancelled = true;
    };
  }, [enabled, isModelReady]);

  useEffect(() => {
    return () => {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isModelReady) return;

    const detect = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        setDebugInfo((info) => ({
          ...info,
          modelReady: isModelReady,
          detectorRunning: false,
          videoSize: video ? { width: video.videoWidth, height: video.videoHeight } : null
        }));
        timerRef.current = window.setTimeout(detect, 420);
        return;
      }

      const now = performance.now();
      const quietState = gameState === "DRAWING" || gameState === "REVEALING" || gameState === "RESULT";
      const hasRecentHand = now - runtimeRef.current.lastActionAt < 1400 || handPresentRef.current;
      const interval = quietState
        ? 700
        : performanceMode === "low"
          ? hasRecentHand
            ? 82
            : 240
          : hasRecentHand
            ? 66
            : 180;

      if (now - lastInferenceAtRef.current < interval) {
        timerRef.current = window.setTimeout(detect, Math.max(16, interval - (now - lastInferenceAtRef.current)));
        return;
      }
      lastInferenceAtRef.current = now;

      const fps = Math.round(1000 / Math.max(1, now - lastFrameAtRef.current));
      lastFrameAtRef.current = now;
      const result = landmarker.detectForVideo(video, now);
      const hand = result.landmarks[0];

      if (hand) {
        handPresentRef.current = true;
        const sample = landmarksToSample(hand, now);
        const { event, debug } = analyzeGesture(runtimeRef.current, sample, fps, gameState);
        setDebugInfo({
          ...debug,
          modelReady: true,
          detectorRunning: true,
          videoSize: { width: video.videoWidth, height: video.videoHeight }
        });
        if (event) onGestureRef.current(event);
      } else {
        handPresentRef.current = false;
        resetGestureRuntime(runtimeRef.current);
        setDebugInfo({
          ...emptyGestureDebug,
          fps,
          modelReady: true,
          detectorRunning: true,
          videoSize: { width: video.videoWidth, height: video.videoHeight }
        });
      }

      timerRef.current = window.setTimeout(detect, interval);
    };

    timerRef.current = window.setTimeout(detect, 240);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, gameState, isModelReady, performanceMode, videoRef]);

  const recalibrate = useCallback(() => {
    resetGestureRuntime(runtimeRef.current);
    setDebugInfo((info) => ({ ...emptyGestureDebug, modelReady: info.modelReady, videoSize: info.videoSize }));
  }, []);

  return { debugInfo, isModelReady, error, recalibrate };
}
