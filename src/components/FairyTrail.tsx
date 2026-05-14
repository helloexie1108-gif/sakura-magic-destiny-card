import { useEffect, useMemo, useRef, useState } from "react";
import type { GameAction, GestureDebugInfo } from "../types";

interface FairyTrailProps {
  gesture: GestureDebugInfo;
  lastAction: GameAction | null;
}

const PARTICLE_COUNT = 13;

export function FairyTrail({ gesture, lastAction }: FairyTrailProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLSpanElement | null>(null);
  const ribbonRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);
  const circleRef = useRef<HTMLSpanElement | null>(null);
  const particleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const targetRef = useRef({ x: 0.5, y: 0.54 });
  const activeRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const head = useRef({ x: 0, y: 0 });
  const prevHead = useRef({ x: 0, y: 0 });
  const isPositioned = useRef(false);
  const lastFrame = useRef(0);
  const lastTarget = useRef<{ x: number; y: number } | null>(null);
  const trail = useRef(Array.from({ length: PARTICLE_COUNT }, () => ({ x: 0, y: 0 })));
  const [pulseKey, setPulseKey] = useState(0);

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, index) => index), []);
  const actionClass = lastAction ? `fairy-trail--${lastAction.toLowerCase().replaceAll("_", "-")}` : "";
  const candidateClass = gesture.candidateGesture !== "none" && gesture.candidateGesture !== "hand_detected" ? `fairy-trail--candidate-${gesture.candidateGesture.replaceAll("_", "-")}` : "";

  useEffect(() => {
    const target = gesture.indexTip || gesture.palmCenter;
    if (target) {
      const previous = lastTarget.current;
      if (!previous || Math.hypot(target.x - previous.x, target.y - previous.y) < 0.36) {
        targetRef.current = target;
        lastTarget.current = target;
      } else {
        targetRef.current = {
          x: previous.x + (target.x - previous.x) * 0.32,
          y: previous.y + (target.y - previous.y) * 0.32
        };
        lastTarget.current = targetRef.current;
      }
    }
    activeRef.current = gesture.handPresent;
  }, [gesture.handPresent, gesture.indexTip, gesture.palmCenter]);

  useEffect(() => {
    if (lastAction) setPulseKey((value) => value + 1);
  }, [lastAction]);

  useEffect(() => {
    const animate = (time = 0) => {
      if (time - lastFrame.current < 30) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrame.current = time;
      const root = rootRef.current;
      const headNode = headRef.current;
      const ribbon = ribbonRef.current;
      if (!root || !headNode || !ribbon) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = root.getBoundingClientRect();
      const target = {
        x: targetRef.current.x * rect.width,
        y: targetRef.current.y * rect.height
      };

      if (!isPositioned.current) {
        head.current = target;
        prevHead.current = target;
        trail.current = trail.current.map(() => ({ ...target }));
        isPositioned.current = true;
      }

      prevHead.current = { ...head.current };
      if (activeRef.current) {
        head.current = target;
      } else {
        head.current.x += (target.x - head.current.x) * 0.18;
        head.current.y += (target.y - head.current.y) * 0.18;
      }

      const dx = head.current.x - prevHead.current.x;
      const dy = head.current.y - prevHead.current.y;
      const speed = Math.min(1, Math.hypot(dx, dy) / 34);
      const angle = Math.atan2(dy, dx) || 0;
      const fade = activeRef.current ? 1 : 0;

      headNode.style.transform = `translate3d(${head.current.x}px, ${head.current.y}px, 0) translate(-50%, -50%)`;
      headNode.style.opacity = `${0.25 + fade * 0.75}`;

      const ribbonLength = 58 + speed * 150;
      ribbon.style.width = `${ribbonLength}px`;
      ribbon.style.opacity = `${fade * (0.18 + speed * 0.5)}`;
      ribbon.style.transform = `translate3d(${head.current.x}px, ${head.current.y}px, 0) translate(-92%, -50%) rotate(${angle}rad)`;

      trail.current.forEach((point, index) => {
        const leader = index === 0 ? head.current : trail.current[index - 1];
        const follow = 0.34 - Math.min(index, 9) * 0.018;
        const sway = Math.sin(time / 260 + index * 0.8) * (2.2 + speed * 5);
        point.x += (leader.x - point.x) * follow;
        point.y += (leader.y - point.y) * follow;

        const particle = particleRefs.current[index];
        if (!particle) return;
        const size = Math.max(3, 13 - index * 0.65 + speed * 4);
        const opacity = fade * Math.max(0, 0.84 - index * 0.055) * (0.56 + speed * 0.44);
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = `${opacity}`;
        particle.style.transform = `translate3d(${point.x + Math.sin(angle + Math.PI / 2) * sway}px, ${point.y + Math.cos(angle + Math.PI / 2) * sway}px, 0) translate(-50%, -50%) rotate(${angle + index * 0.18}rad)`;
      });

      if (ringRef.current) {
        ringRef.current.style.left = `${head.current.x}px`;
        ringRef.current.style.top = `${head.current.y}px`;
      }
      if (circleRef.current) {
        circleRef.current.style.left = `${head.current.x}px`;
        circleRef.current.style.top = `${head.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={`fairy-trail ${gesture.handPresent ? "is-active" : ""} ${actionClass} ${candidateClass}`} ref={rootRef} aria-hidden="true">
      <span className="fairy-trail__ribbon" ref={ribbonRef} />
      {particles.map((index) => (
        <span
          className={`fairy-trail__particle fairy-trail__particle--${index % 4}`}
          key={index}
          ref={(node) => {
            particleRefs.current[index] = node;
          }}
        />
      ))}
      <span className="fairy-trail__head" ref={headRef}>
        <i />
      </span>
      <span className="fairy-trail__pulse" key={`pulse-${pulseKey}`} ref={ringRef} />
      <span className="fairy-trail__circle" key={`circle-${pulseKey}`} ref={circleRef} />
      <div className="fairy-trail__status">{gesture.handPresent ? gestureText[gesture.gesture] : "等待手势感应"}</div>
    </div>
  );
}

const gestureText = {
  none: "等待手势感应",
  hand_detected: "星尾已连接",
  swipe_left: "左滑星尾",
  swipe_right: "右滑星尾",
  pinch: "星屑聚拢",
  open_palm: "星光展开",
  circle: "星轨成环",
  hold: "星尾充能",
  heart_reserved: "心愿接口预留"
};
