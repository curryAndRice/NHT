/*
AnimatedImageSpawner.tsx — Tailwind-free with random X and Y (renamed trigger: onQuizButton)

Updates per request:
- The trigger function is renamed from `onButton` to `onQuizButton` and exported.
- X position: random within MIN_X_PERCENT..MAX_X_PERCENT unless caller supplies xPercent.
- Y position: random within MIN_Y_PERCENT..MAX_Y_PERCENT (50%..70% by default) unless caller supplies yPercent.

Usage:
  import AnimatedImageSpawner, { onQuizButton } from './AnimatedImageSpawner';
  // random x/y:
  onQuizButton('/img.png');
  // fixed x, random y:
  onQuizButton('/img.png', 25);
  // fixed x & y:
  onQuizButton('/img.png', 25, 60);

Notes:
- The component must be mounted once (e.g. in App.tsx).
- Uses inline styles and CSS transitions — no Tailwind required.
*/

import React, { useEffect, useState } from 'react';

// ---------------- Configuration (tweakable) ----------------
const SIZE_PX = 120; // width & height
const BORDER_RADIUS_PX = 16;
const TRANSFORM_DURATION_MS = 800; // time to move from bottom to target Y
const SETTLE_AFTER_MS = 120; // small delay after movement before starting fade-out
const FADE_OUT_DURATION_MS = 400; // how long the fade-out takes
const TRANSFORM_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'; // decelerating

// Random ranges (percent of viewport width/height)
const MIN_X_PERCENT = 12;
const MAX_X_PERCENT = 88;
const MIN_Y_PERCENT = 50; // top=0% bottom=100%
const MAX_Y_PERCENT = 70;

// ---------------- Simple event emitter for onQuizButton ----------------
// onQuizButton(src, xPercent?, yPercent?) — xPercent and yPercent optional
type Listener = (src: string, xPercent?: number, yPercent?: number) => void;
const listeners: Listener[] = [];
let idCounter = 0;

export function onQuizButton(src: string, xPercent?: number, yPercent?: number) {
  listeners.slice().forEach((l) => l(src, xPercent, yPercent));
}

function subscribe(listener: Listener) {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

// ---------------- Spawned item ----------------
interface SpawnItem {
  id: number;
  src: string;
  xPercent: number; // 0-100
  yPercent: number; // 0-100
}

function randomPercent(min = 0, max = 100) {
  return Math.random() * (max - min) + min;
}

function SpawnedImage({ item, onDone }: { item: SpawnItem; onDone: () => void }) {
  const [active, setActive] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Start moving on next animation frame so transition runs
    let raf = requestAnimationFrame(() => setActive(true));

    const fadeOutTimer = setTimeout(() => setFadingOut(true), TRANSFORM_DURATION_MS + SETTLE_AFTER_MS);
    const removeTimer = setTimeout(() => onDone(), TRANSFORM_DURATION_MS + SETTLE_AFTER_MS + FADE_OUT_DURATION_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [onDone]);

  // Container determines final top/left position in viewport (percent)
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${item.xPercent}%`,
    top: `${item.yPercent}%`,
    pointerEvents: 'none',
    zIndex: 9999,
    transform: 'translateX(-50%)',
  };

  // Wrapper moves vertically from off-screen (translateY(100vh)) to centered relative to container (translateY(-50%)).
  const wrapperStyle: React.CSSProperties = {
    transition: `transform ${TRANSFORM_DURATION_MS}ms ${TRANSFORM_EASING}, opacity ${FADE_OUT_DURATION_MS}ms linear`,
    // Use viewport-relative starting translate so start is off-screen regardless of container position
    transform: active ? `translateY(-50%)` : `translateY(100vh)`,
    width: `${SIZE_PX}px`,
    height: `${SIZE_PX}px`,
    borderRadius: `${BORDER_RADIUS_PX}px`,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    willChange: 'transform, opacity',
    // Fade the whole wrapper (including its shadow) when fading out so the shadow doesn't linger
    opacity: fadingOut ? 0 : 1,
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: `opacity ${FADE_OUT_DURATION_MS}ms linear`,
    opacity: fadingOut ? 0 : 1,
  };

  return (
    <div aria-hidden style={containerStyle}>
      <div style={wrapperStyle}>
        <img src={item.src} alt="animated" style={imgStyle} />
      </div>
    </div>
  );
}

// ---------------- Spawner (default export) ----------------
export default function AnimatedImageSpawner(): JSX.Element {
  const [items, setItems] = useState<SpawnItem[]>([]);

  useEffect(() => {
    return subscribe((src, xPercent, yPercent) => {
      const id = ++idCounter;
      const x = typeof xPercent === 'number' ? xPercent : randomPercent(MIN_X_PERCENT, MAX_X_PERCENT);
      const y = typeof yPercent === 'number' ? yPercent : randomPercent(MIN_Y_PERCENT, MAX_Y_PERCENT);
      setItems((s) => [...s, { id, src, xPercent: x, yPercent: y }]);
    });
  }, []);

  return (
    <>
      {items.map((it) => (
        <SpawnedImage
          key={it.id}
          item={it}
          onDone={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
        />
      ))}
    </>
  );
}
