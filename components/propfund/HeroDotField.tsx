"use client";

import { useEffect, useRef } from "react";

export function HeroDotField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 };
    let width = 0;
    let height = 0;
    let frame = 0;

    function resize() {
      const bounds = field.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);


      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      if (pointer.x === 0 && pointer.y === 0) {
        pointer.x = pointer.targetX = width * 0.5;
        pointer.y = pointer.targetY = height * 0.36;
      }
    }

    function trackPointer(event: PointerEvent) {
      const bounds = field.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const inside = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height;

      if (inside) {
        pointer.targetX = x;
        pointer.targetY = y;
        pointer.targetStrength = reduceMotion ? 0 : 1;
      } else {
        pointer.targetStrength = 0;
      }
    }

    function settlePointer() {
      pointer.targetStrength = 0;
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      pointer.x += (pointer.targetX - pointer.x) * 0.09;
      pointer.y += (pointer.targetY - pointer.y) * 0.09;
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.075;

      const spacing = width < 700 ? 22 : 20;
      const influenceRadius = 155;
      const radiusSquared = influenceRadius * influenceRadius;

      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          let influence = 0;
          let drawX = x;
          let drawY = y;

          if (distanceSquared < radiusSquared && pointer.strength > 0.001) {
            const distance = Math.sqrt(distanceSquared) || 1;
            influence = (1 - distance / influenceRadius) * pointer.strength;
            const displacement = influence * influence * 8;
            drawX += (dx / distance) * displacement;
            drawY += (dy / distance) * displacement;
          }

          context.beginPath();
          context.arc(drawX, drawY, 0.75 + influence * 0.7, 0, Math.PI * 2);
          context.fillStyle = `rgba(255, 255, 255, ${0.09 + influence * 0.34})`;
          context.fill();
        }
      }

      frame = window.requestAnimationFrame(draw);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(field);
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("blur", settlePointer);
    resize();
    draw();

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("blur", settlePointer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hero-dot-field" ref={fieldRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}