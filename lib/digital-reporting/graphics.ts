import { rgb, type PDFPage, type PDFFont, type RGB } from "pdf-lib";
import type { Metric, Snapshot } from "./model";
export type IconName =
  "search" | "people" | "inquiry" | "sparkles" | "website" | "plan" | "chart";
/** Small, crisp vector symbols remain sharp at print size. */
export function drawIcon(
  page: PDFPage,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: RGB,
) {
  const scale = size / 24;
  const line = (ax: number, ay: number, bx: number, by: number) =>
    page.drawLine({
      start: { x: x + ax * scale, y: y + ay * scale },
      end: { x: x + bx * scale, y: y + by * scale },
      thickness: 1.5 * scale,
      color,
    });
  const circle = (cx: number, cy: number, r: number) =>
    page.drawCircle({
      x: x + cx * scale,
      y: y + cy * scale,
      size: r * scale,
      borderColor: color,
      borderWidth: 1.5 * scale,
    });
  const box = (ax: number, ay: number, w: number, h: number) =>
    page.drawRectangle({
      x: x + ax * scale,
      y: y + ay * scale,
      width: w * scale,
      height: h * scale,
      borderColor: color,
      borderWidth: 1.5 * scale,
    });
  if (name === "search") {
    circle(10, 14, 6);
    line(14, 10, 21, 3);
  }
  if (name === "people") {
    circle(9, 17, 3.5);
    circle(18, 16, 2.5);
    line(3, 5, 3, 9);
    line(3, 9, 6, 12);
    line(6, 12, 12, 12);
    line(12, 12, 15, 9);
    line(15, 9, 15, 5);
    line(17, 11, 21, 8);
    line(21, 8, 21, 5);
  }
  if (name === "inquiry") {
    box(3, 7, 18, 14);
    line(7, 7, 7, 3);
    line(7, 3, 12, 7);
    line(7, 15, 17, 15);
    line(7, 11, 14, 11);
  }
  if (name === "sparkles") {
    line(12, 22, 15, 15);
    line(15, 15, 22, 12);
    line(22, 12, 15, 9);
    line(15, 9, 12, 2);
    line(12, 2, 9, 9);
    line(9, 9, 2, 12);
    line(2, 12, 9, 15);
    line(9, 15, 12, 22);
    line(3, 22, 3, 18);
    line(1, 20, 5, 20);
  }
  if (name === "website") {
    box(2, 3, 20, 18);
    line(2, 16, 22, 16);
    circle(5, 19, 0.4);
    circle(8, 19, 0.4);
    line(6, 12, 18, 12);
    line(6, 8, 13, 8);
  }
  if (name === "plan") {
    box(4, 2, 16, 20);
    line(7, 17, 8.5, 15.5);
    line(8.5, 15.5, 11, 18);
    line(13, 17, 17, 17);
    line(7, 11, 8.5, 9.5);
    line(8.5, 9.5, 11, 12);
    line(13, 11, 17, 11);
    line(7, 5, 17, 5);
  }
  if (name === "chart") {
    line(2, 2, 2, 22);
    line(2, 2, 23, 2);
    box(6, 3, 3, 6);
    box(12, 3, 3, 11);
    box(18, 3, 3, 17);
  }
}
export type ChartPoint = {
  label: string;
  date: string | null;
  metric: Metric | undefined;
  value: number | null;
  reason: "missing" | "different_rules" | null;
};
export function chartPoints(snapshot: Snapshot, key: string): ChartPoint[] {
  const current = snapshot.metrics.find((m) => m.key === key);
  const date = (period?: string) =>
    period
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${period.slice(0, 10)}T12:00:00Z`))
      : null;
  const candidates =
    snapshot.kind === "audit"
      ? [
          {
            label: "Starting result",
            date: date(snapshot.period),
            metric: current,
          },
        ]
      : [
          {
            label: "Starting point",
            date: date(snapshot.baseline?.period),
            metric: snapshot.baseline?.metrics.find((m) => m.key === key),
          },
          {
            label: "Last month",
            date: date(snapshot.previous?.period),
            metric: snapshot.previous?.metrics.find((m) => m.key === key),
          },
          { label: "This month", date: date(snapshot.period), metric: current },
        ];
  const anchor =
    current?.status === "verified"
      ? current
      : candidates.find((p) => p.metric?.status === "verified")?.metric;
  return candidates.map((p) => {
    if (p.metric?.status !== "verified" || p.metric.value === null)
      return { ...p, value: null, reason: "missing" as const };
    if (
      anchor &&
      (p.metric.source !== anchor.source || p.metric.method !== anchor.method)
    )
      return { ...p, value: null, reason: "different_rules" as const };
    return { ...p, value: p.metric.value, reason: null };
  });
}
export function drawComparisonGraph(
  page: PDFPage,
  points: ChartPoint[],
  label: string,
  icon: IconName,
  x: number,
  top: number,
  width: number,
  height: number,
  font: PDFFont,
  bold: PDFFont,
  illustrative: boolean,
) {
  const ink = rgb(0.29, 0.2, 0.2),
    muted = rgb(0.43, 0.39, 0.38),
    colors = [rgb(0.72, 0.67, 0.65), rgb(0.9, 0.69, 0.71), ink];
  page.drawRectangle({
    x,
    y: top - height,
    width,
    height,
    color: rgb(0.97, 0.96, 0.93),
  });
  drawIcon(page, icon, x + 12, top - 28, 15, ink);
  page.drawText(label, {
    x: x + 36,
    y: top - 24,
    size: 11,
    font: bold,
    color: ink,
  });
  if (illustrative)
    page.drawText("ILLUSTRATIVE FIGURES", {
      x: x + width - 136,
      y: top - 22,
      size: 7.5,
      font: bold,
      color: muted,
    });
  const chartX = x + 125,
    chartW = width - 192,
    chartTop = top - 45,
    barH = 10,
    rowGap = points.length === 1 ? 23 : 23;
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value])),
    max = Math.max(1, ...values);
  const power = 10 ** Math.floor(Math.log10(max)),
    upper = Math.ceil(max / power) * power;
  const compact = (n: number) =>
    new Intl.NumberFormat("en-US", {
      notation: n >= 10000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(n);
  const axisY = top - height + 22;
  if (values.length) {
    page.drawLine({
      start: { x: chartX, y: axisY + 10 },
      end: { x: chartX + chartW, y: axisY + 10 },
      color: rgb(0.86, 0.83, 0.81),
      thickness: 0.6,
    });
    [0, 0.5, 1].forEach((f) => {
      const px = chartX + chartW * f;
      page.drawLine({
        start: { x: px, y: axisY + 10 },
        end: { x: px, y: chartTop + 7 },
        color: rgb(0.86, 0.83, 0.81),
        thickness: 0.6,
      });
      page.drawText(compact(upper * f), {
        x: px - 3,
        y: axisY - 2,
        size: 8,
        font,
        color: muted,
      });
    });
  }
  points.forEach((p, i) => {
    const rowY = points.length === 1 ? top - 70 : chartTop - i * rowGap;
    page.drawText(p.label, {
      x: x + 12,
      y: rowY + 3,
      size: 9,
      font,
      color: ink,
    });
    if (p.date)
      page.drawText(p.date, {
        x: x + 12,
        y: rowY - 8,
        size: 8,
        font,
        color: muted,
      });
    if (p.value === null) {
      page.drawText(
        p.reason === "different_rules"
          ? "Different counting rules"
          : "Waiting for information",
        { x: chartX, y: rowY, size: 9, font, color: muted },
      );
    } else {
      if (p.value > 0)
        page.drawRectangle({
          x: chartX,
          y: rowY - 2,
          width: chartW * (p.value / upper),
          height: barH,
          color: points.length === 1 ? ink : colors[i],
        });
      page.drawText(compact(p.value), {
        x: chartX + chartW + 9,
        y: rowY,
        size: 9,
        font: bold,
        color: ink,
      });
    }
  });
  if (!values.length)
    page.drawText("No confirmed numbers to plot yet.", {
      x: chartX,
      y: axisY - 2,
      size: 8,
      font,
      color: muted,
    });
}
