"use client";

import type { NatalChart, PlanetPosition } from "@/lib/astrology/types";
import { useCallback, useEffect, useRef } from "react";
import styles from "./astrology.module.css";

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 120;
const R_PLANET = 95;

const SIGN_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#a8e6cf",
  "#ff8b94",
  "#c7ceea",
  "#ffd3b6",
  "#ffaaa5",
  "#dcedc1",
  "#84a59d",
  "#f7b267",
  "#9b5de5",
];

const PLANET_COLORS: Record<string, string> = {
  Sun: "#ffd700",
  Moon: "#e0e0ff",
  Mercury: "#b8b8ff",
  Venus: "#ffb7c5",
  Mars: "#ff4444",
  Jupiter: "#ffa500",
  Saturn: "#c0c0c0",
  Uranus: "#40e0d0",
  Neptune: "#4169e1",
  Pluto: "#8b008b",
  "North Node": "#fffacd",
};

interface ChartWheelProps {
  chart: NatalChart;
  selected?: string | null;
  onSelectPlanet?: (name: string) => void;
}

function lonToXY(lon: number, r: number): [number, number] {
  const rad = ((90 - lon) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
}

export default function ChartWheel({
  chart,
  selected,
  onSelectPlanet,
}: ChartWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    const grad = ctx.createRadialGradient(CX, CY, 20, CX, CY, R_OUTER);
    grad.addColorStop(0, "#1a0a3a");
    grad.addColorStop(1, "#050510");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, R_OUTER + 8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 12; i++) {
      const start = i * 30;
      const end = start + 30;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      const [x1, y1] = lonToXY(start, R_OUTER);
      const [x2, y2] = lonToXY(end, R_OUTER);
      ctx.arc(CX, CY, R_OUTER, (-(start + 90) * Math.PI) / 180, (-(end + 90) * Math.PI) / 180, true);
      ctx.closePath();
      ctx.fillStyle = SIGN_COLORS[i] + "33";
      ctx.fill();
      ctx.strokeStyle = "rgba(192, 132, 252, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(192, 132, 252, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CX, CY, R_OUTER, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CX, CY, R_PLANET - 15, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();

    const ascLon = chart.ascendant.longitude;
    const [ax, ay] = lonToXY(ascLon, R_OUTER + 4);
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    const planets = Object.entries(chart.planets);
    for (const [name, p] of planets) {
      const [px, py] = lonToXY(p.longitude, R_PLANET);
      const isSel = selected === name;
      ctx.beginPath();
      ctx.arc(px, py, isSel ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = PLANET_COLORS[name] ?? "#fff";
      ctx.fill();
      if (isSel) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    const [ascX, ascY] = lonToXY(ascLon, R_OUTER - 18);
    ctx.fillText("ASC", ascX, ascY + 4);
  }, [chart, selected]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectPlanet) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let best: { name: string; d: number } | null = null;
    for (const [name, p] of Object.entries(chart.planets)) {
      const [px, py] = lonToXY(p.longitude, R_PLANET);
      const d = Math.hypot(mx - px, my - py);
      if (d < 18 && (!best || d < best.d)) best = { name, d };
    }
    if (best) onSelectPlanet(best.name);
    else if (
      Math.hypot(
        mx - lonToXY(chart.ascendant.longitude, R_PLANET)[0],
        my - lonToXY(chart.ascendant.longitude, R_PLANET)[1],
      ) < 22
    ) {
      onSelectPlanet("Ascendant");
    }
  };

  return (
    <div className={styles.chartWrap}>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className={styles.canvas}
        onClick={handleClick}
        role="img"
        aria-label="本命星盤"
      />
    </div>
  );
}

export function formatPlanetLine(p: PlanetPosition, label: string): string {
  const rx = p.retrograde ? " ℞" : "";
  return `${label} · ${p.zodiac_zh} ${p.deg.toFixed(1)}° · 第${p.house}宮${rx}`;
}
