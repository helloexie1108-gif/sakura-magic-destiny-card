import { useCallback, useEffect, useState } from "react";
import { Maximize2, RotateCcw, Sparkles } from "lucide-react";
import { CameraPreview } from "./components/CameraPreview";
import { CardDeck } from "./components/CardDeck";
import { DebugPanel } from "./components/DebugPanel";
import { DrawSlots } from "./components/DrawSlots";
import { EffectLayer } from "./components/EffectLayer";
import { FairyTrail } from "./components/FairyTrail";
import { ResultPanel } from "./components/ResultPanel";
import { useCamera } from "./hooks/useCamera";
import { useGameController } from "./hooks/useGameController";
import { useHandGesture } from "./hooks/useHandGesture";
import type { GameAction, PerformanceMode } from "./types";

export default function App() {
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("low");
  const [isTouchMode, setIsTouchMode] = useState(false);
  const camera = useCamera(performanceMode);
  const game = useGameController();
  const [progressFlashKey, setProgressFlashKey] = useState(0);
  const isEmbeddedBrowser = detectEmbeddedBrowser();
  const [showBrowserTip, setShowBrowserTip] = useState(isEmbeddedBrowser);

  const handleGesture = useCallback(
    (event: { action?: GameAction }) => {
      if (!event.action) return;
      const action = event.action;
      const state = game.gameState;
      const allowed =
        (action === "SHUFFLE_CARDS" && (state === "CAMERA_READY" || state === "SELECTING")) ||
        ((action === "NEXT_CARD" || action === "PREV_CARD") && state === "SELECTING") ||
        (action === "CONFIRM_CARD" && state === "SELECTING") ||
        (action === "FLIP_CARD" && state === "LOCKED") ||
        (action === "RESET_GAME" && state === "RESULT");
      if (allowed) game.dispatch(action);
    },
    [game]
  );

  const gesture = useHandGesture({
    videoRef: camera.videoRef,
    enabled: camera.isReady,
    gameState: game.gameState,
    performanceMode,
    onGesture: handleGesture
  });

  useEffect(() => {
    camera.startCamera();
  }, []);

  useEffect(() => {
    if (camera.isReady) game.setCameraReady();
  }, [camera.isReady, game]);

  useEffect(() => {
    if (gesture.error && !gesture.isModelReady) {
      setIsTouchMode(true);
      if (game.gameState === "CAMERA_READY") game.setHandDetected();
    }
  }, [game, gesture.error, gesture.isModelReady]);

  useEffect(() => {
    if (!showBrowserTip) return;
    const timer = window.setTimeout(() => setShowBrowserTip(false), 4200);
    return () => window.clearTimeout(timer);
  }, [showBrowserTip]);

  useEffect(() => {
    if (camera.isReady && gesture.debugInfo.handPresent && game.gameState === "CAMERA_READY") {
      game.setHandDetected();
    }
  }, [camera.isReady, game, gesture.debugInfo.handPresent]);

  useEffect(() => {
    setProgressFlashKey((key) => key + 1);
  }, [game.currentIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") game.dispatch("PREV_CARD");
      if (event.key === "ArrowRight") game.dispatch("NEXT_CARD");
      if (event.code === "Space") game.dispatch("CONFIRM_CARD");
      if (event.key === "Enter") game.dispatch("FLIP_CARD");
      if (event.key.toLowerCase() === "r") game.dispatch("RESET_GAME");
      if (event.key.toLowerCase() === "d") game.setIsDebugMode((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  const recalibrate = () => {
    gesture.recalibrate();
    game.dispatch("RECALIBRATE_GESTURE");
  };

  const fullScreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const retryGestureModel = () => {
    setIsTouchMode(false);
    gesture.retryModel();
  };

  const activeRarity =
    game.gameState === "DRAWING" || game.gameState === "RESULT" || game.gameState === "REVEALING"
      ? game.lockedCard?.rarity || game.currentCard.rarity
      : "normal";

  return (
    <main className={`app app--${game.gameState.toLowerCase()} app--perf-${performanceMode} ${isTouchMode ? "app--touch-mode" : ""} ${activeRarity === "hidden" ? "app--shake" : ""}`}>
      <EffectLayer rarity={activeRarity} gameState={game.gameState} performanceMode={performanceMode} />
      <FairyTrail gesture={gesture.debugInfo} lastAction={game.lastAction} />

      {showBrowserTip && (
        <div className="browser-tip">
          当前浏览器可能限制摄像头，已支持触控兜底；建议用 Safari 或 Chrome 体验手势。
        </div>
      )}

      <header className="top-bar">
        <div>
          <p className="top-bar__eyebrow">樱花魔法命运牌</p>
          <h1>{getStatusText(game.gameState, game.drawnCount, isTouchMode)}</h1>
        </div>
        <div className="top-bar__actions">
          <button type="button" className="top-bar__debug" onClick={() => game.setIsDebugMode((value) => !value)}>
            <Sparkles size={17} />
            Debug
          </button>
          {game.isDebugMode && <button type="button" onClick={fullScreen} title="全屏展示">
            <Maximize2 size={17} />
          </button>}
          {game.isDebugMode && <button type="button" onClick={() => game.dispatch("RESET_GAME")} title="重置">
            <RotateCcw size={17} />
          </button>}
        </div>
      </header>

      <div className="magic-progress" data-flash-key={progressFlashKey} aria-label="当前星牌进度">
        <Sparkles size={14} />
        <span key={progressFlashKey}>{game.currentIndex + 1}/{game.totalCards}</span>
      </div>

      <section className="stage">
        <CardDeck
          currentCard={game.currentCard}
          previousCard={game.neighbors.previous}
          nextCard={game.neighbors.next}
          gameState={game.gameState}
          isLocked={game.isLocked}
          currentIndex={game.currentIndex}
          totalCards={game.totalCards}
          cards={game.cards}
          gestureDragOffset={gesture.debugInfo.gestureDragOffset}
          candidateGesture={gesture.debugInfo.candidateGesture}
          lastAction={game.lastAction}
          onFocusIndex={game.focusCard}
          onLongSelect={game.confirmCardAtIndex}
          onLockedActivate={() => game.dispatch("FLIP_CARD")}
        />
        <DrawSlots
          cards={game.ritualCards}
          drawnCount={game.drawnCount}
          revealedCount={game.revealedCount}
          gameState={game.gameState}
        />
        <ResultPanel gameState={game.gameState} ritualCards={game.ritualCards} revealedCount={game.revealedCount} onReset={() => game.dispatch("RESET_GAME")} />
      </section>

      {game.gameState !== "RESULT" && <div className="gesture-help">
        <span>左滑/右滑切换星牌</span>
        <span>单指转圈唤起星轨</span>
        <span>捏手指点亮回应</span>
        <span>张手展开星光</span>
      </div>}

      <CameraPreview
        videoRef={camera.videoRef}
        devices={camera.devices}
        selectedDeviceId={camera.selectedDeviceId}
        isReady={camera.isReady}
        isPreviewVisible={camera.isPreviewVisible}
        error={camera.error}
        permissionState={camera.permissionState}
        gesture={gesture.debugInfo}
        modelError={gesture.error}
        isModelReady={gesture.isModelReady}
        isTouchMode={isTouchMode}
        debugMode={game.isDebugMode}
        onStart={() => camera.startCamera()}
        onSwitch={camera.switchCamera}
        onTogglePreview={() => camera.setIsPreviewVisible(!camera.isPreviewVisible)}
        onRecalibrate={recalibrate}
        onRetryModel={retryGestureModel}
        onUseTouchMode={() => {
          setIsTouchMode(true);
          if (game.gameState === "CAMERA_READY") game.setHandDetected();
        }}
      />

      <DebugPanel
        visible={game.isDebugMode}
        gameState={game.gameState}
        lastAction={game.lastAction}
        gesture={gesture.debugInfo}
        currentCard={game.currentCard}
        isLocked={game.isLocked}
        deviceLabel={camera.deviceLabel}
        camera={{
          origin: window.location.origin,
          permissionState: camera.permissionState,
          isReady: camera.isReady,
          selectedDeviceId: camera.selectedDeviceId,
          deviceCount: camera.devices.length
        }}
        performanceMode={performanceMode}
        onPerformanceModeChange={setPerformanceMode}
        onEmergencyAction={game.dispatch}
      />
    </main>
  );
}

function detectEmbeddedBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  return /micromessenger|mqqbrowser|qq\/|weibo|pdd|bytedance|toutiao|lark|dingtalk|alipay|baiduboxapp/.test(ua);
}

function getStatusText(gameState: keyof typeof statusText, drawnCount: number, isTouchMode: boolean) {
  if (gameState === "SELECTING" && drawnCount === 1) return "第一张已归位，继续寻找下一张共鸣牌";
  if (gameState === "SELECTING" && drawnCount === 2) return "第二张已归位，最后一张正在等待你";
  if (gameState === "DRAWING" && drawnCount >= 3) return "三张卡牌已完成召唤，正在生成你的星光牌阵";
  if (isTouchMode && gameState === "SELECTING") return "左右滑动，长按锁定星牌";
  if (isTouchMode && gameState === "LOCKED") return "已锁定这张卡牌，点击卡牌完成召唤";
  return statusText[gameState];
}

const statusText = {
  IDLE: "伸出手掌，唤醒星光牌阵",
  CAMERA_READY: "等待手掌进入星光感应区",
  SHUFFLING: "星轨正在轻轻流转",
  SELECTING: "左右挥动，寻找与你共鸣的卡牌",
  LOCKED: "已锁定这张卡牌，张开手掌完成召唤",
  DRAWING: "星光回应中，卡牌正在显现",
  REVEALING: "星之气息、预感与回应正在显现",
  RESULT: "星之回应已显现",
  RESETTING: "星光牌阵正在重新归位"
};
