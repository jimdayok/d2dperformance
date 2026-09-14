import "server-only";

import { lookup } from "node:dns/promises";
import { access } from "node:fs/promises";
import ipaddr from "ipaddr.js";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";
import type { Browser, HTTPRequest } from "puppeteer-core";
import type { MarkupNote, SubmitFeedbackInput } from "@/lib/website-feedback-schema";

const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 720;
const INK = rgb(0.071, 0.102, 0.098);
const MUTED = rgb(0.35, 0.41, 0.4);
const TEAL = rgb(0.047, 0.451, 0.475);
const COPPER = rgb(0.604, 0.373, 0.204);
const PAPER = rgb(0.973, 0.957, 0.925);

type FeedbackPage = Record<string, unknown>;
type FeedbackSession = Record<string, unknown>;

const annotationLabels: Record<MarkupNote["category"], string> = {
  modify_text: "Modify text",
  change_picture: "Change picture",
  general: "General note",
};

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function printableText(value: string) {
  return value
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "?");
}

function pageAnnotations(page: FeedbackPage) {
  return Array.isArray(page.annotations) ? page.annotations as MarkupNote[] : [];
}

function markupAnchor(annotation: MarkupNote) {
  const lastPoint = annotation.points?.at(-1);
  return lastPoint ?? { x: annotation.x + annotation.width, y: annotation.y };
}

export function createMarkupOverlaySvg(annotations: MarkupNote[], width = SCREEN_WIDTH, height = SCREEN_HEIGHT) {
  const strokes = annotations.map((annotation) => {
    if (annotation.kind === "circle") {
      const centerX = (annotation.x + annotation.width / 2) * width;
      const centerY = (annotation.y + annotation.height / 2) * height;
      return `<ellipse cx="${centerX}" cy="${centerY}" rx="${Math.max(annotation.width * width / 2, 12)}" ry="${Math.max(annotation.height * height / 2, 12)}" fill="rgba(126,232,238,.08)" stroke="#e14a36" stroke-width="6" />`;
    }
    const points = annotation.points ?? [];
    if (annotation.kind === "draw" && points.length > 1) {
      return `<polyline points="${points.map((point) => `${point.x * width},${point.y * height}`).join(" ")}" fill="none" stroke="#e14a36" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />`;
    }
    if (annotation.kind === "arrow" && points.length > 1) {
      const start = points[0];
      const end = points.at(-1)!;
      return `<line x1="${start.x * width}" y1="${start.y * height}" x2="${end.x * width}" y2="${end.y * height}" stroke="#e14a36" stroke-width="7" stroke-linecap="round" marker-end="url(#arrowhead)" />`;
    }
    return "";
  }).join("");
  const pins = annotations.map((annotation, index) => {
    const anchor = markupAnchor(annotation);
    const x = Math.min(Math.max(anchor.x * width, 20), width - 20);
    const y = Math.min(Math.max(anchor.y * height, 20), height - 20);
    return `<g><circle cx="${x}" cy="${y}" r="18" fill="#e14a36" stroke="#ffffff" stroke-width="4" /><text x="${x}" y="${y + 6}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700">${index + 1}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><marker id="arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,10 L10,5 z" fill="#e14a36" /></marker></defs>${strokes}${pins}</svg>`;
}

function isPublicAddress(address: string) {
  try {
    return ipaddr.parse(address).range() === "unicast";
  } catch {
    return false;
  }
}

const publicHostCache = new Map<string, Promise<boolean>>();

async function isPublicHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (!normalized || normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local")) return false;
  if (ipaddr.isValid(normalized)) return isPublicAddress(normalized);
  const cached = publicHostCache.get(normalized);
  if (cached) return cached;
  const pending = lookup(normalized, { all: true, verbatim: true })
    .then((addresses) => addresses.length > 0 && addresses.every(({ address }) => isPublicAddress(address)))
    .catch(() => false);
  publicHostCache.set(normalized, pending);
  return pending;
}

async function isSafeBrowserUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && await isPublicHostname(url.hostname);
  } catch {
    return false;
  }
}

async function handleBrowserRequest(request: HTTPRequest) {
  const value = request.url();
  if (value.startsWith("data:") || value.startsWith("blob:")) {
    await request.continue();
    return;
  }
  if (await isSafeBrowserUrl(value)) await request.continue();
  else await request.abort("blockedbyclient");
}

async function localChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = process.platform === "darwin"
    ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
    : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next local browser. */ }
  }
  throw new Error("A local Chromium browser is required to preview the feedback PDF.");
}

async function launchCaptureBrowser() {
  const puppeteer = await import("puppeteer-core");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const { default: chromium } = await import("@sparticuz/chromium");
    chromium.setGraphicsMode = false;
    return puppeteer.default.launch({
      args: await puppeteer.default.defaultArgs({ args: chromium.args, headless: "shell" }),
      defaultViewport: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }
  return puppeteer.default.launch({
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
    defaultViewport: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, deviceScaleFactor: 1 },
    executablePath: await localChromePath(),
    headless: true,
  });
}

async function captureMarkedPage(browser: Browser, page: FeedbackPage) {
  const url = String(page.url ?? "");
  if (!await isSafeBrowserUrl(url)) throw new Error("The marked page is not a public website address.");
  const tab = await browser.newPage();
  try {
    await tab.setRequestInterception(true);
    tab.on("request", (request) => { void handleBrowserRequest(request); });
    await tab.goto(url, { waitUntil: "domcontentloaded", timeout: 18_000 });
    await tab.waitForNetworkIdle({ idleTime: 500, timeout: 4_000 }).catch(() => undefined);
    await tab.evaluate(() => window.scrollTo(0, 0));
    const screenshot = Buffer.from(await tab.screenshot({ type: "jpeg", quality: 68, fullPage: false }));
    const overlay = Buffer.from(createMarkupOverlaySvg(pageAnnotations(page), SCREEN_WIDTH, SCREEN_HEIGHT));
    return sharp(screenshot).composite([{ input: overlay, left: 0, top: 0 }]).jpeg({ quality: 72, chromaSubsampling: "4:2:0" }).toBuffer();
  } finally {
    await tab.close();
  }
}

async function fallbackMarkedPage(page: FeedbackPage) {
  const title = escapeXml(String(page.page_title || page.url || "Website page"));
  const url = escapeXml(String(page.url || ""));
  const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SCREEN_WIDTH}" height="${SCREEN_HEIGHT}"><rect width="100%" height="100%" fill="#f3f0e9"/><rect x="70" y="70" width="1300" height="580" fill="#ffffff" stroke="#d7d0c7" stroke-width="2"/><text x="120" y="175" fill="#173335" font-family="Georgia, serif" font-size="52" font-weight="700">${title}</text><text x="120" y="225" fill="#61706d" font-family="Arial, sans-serif" font-size="24">${url}</text><text x="120" y="330" fill="#8b5b36" font-family="Arial, sans-serif" font-size="22" font-weight="700">PAGE SNAPSHOT UNAVAILABLE</text><text x="120" y="375" fill="#61706d" font-family="Arial, sans-serif" font-size="22">The numbered drawing and complete written notes are preserved in this report.</text></svg>`);
  return sharp(base).composite([{ input: Buffer.from(createMarkupOverlaySvg(pageAnnotations(page), SCREEN_WIDTH, SCREEN_HEIGHT)) }]).jpeg({ quality: 72 }).toBuffer();
}

async function captureAllPages(pages: FeedbackPage[]) {
  const browser = await launchCaptureBrowser().catch(() => null);
  if (!browser) return Promise.all(pages.map((page) => fallbackMarkedPage(page)));
  try {
    const images = new Array<Buffer>(pages.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(3, pages.length) }, async () => {
      while (cursor < pages.length) {
        const index = cursor++;
        images[index] = await captureMarkedPage(browser, pages[index]).catch(() => fallbackMarkedPage(pages[index]));
      }
    });
    await Promise.all(workers);
    return images;
  } finally {
    await browser.close();
  }
}

function wrapText(font: PDFFont, value: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of printableText(value).replaceAll("\r", "").split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = words.shift()!;
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

function drawWrapped(page: PDFPage, font: PDFFont, value: string, options: { x: number; y: number; size: number; maxWidth: number; lineHeight?: number; color?: ReturnType<typeof rgb> }) {
  const lineHeight = options.lineHeight ?? options.size * 1.35;
  let y = options.y;
  for (const line of wrapText(font, value, options.size, options.maxWidth)) {
    if (line) page.drawText(line, { x: options.x, y, size: options.size, font, color: options.color ?? INK });
    y -= lineHeight;
  }
  return y;
}

function drawLines(page: PDFPage, font: PDFFont, lines: string[], options: { x: number; y: number; size: number; lineHeight: number; color: ReturnType<typeof rgb> }) {
  let y = options.y;
  for (const line of lines) {
    if (line) page.drawText(line, { x: options.x, y, size: options.size, font, color: options.color });
    y -= options.lineHeight;
  }
  return y;
}

function drawReportHeader(page: PDFPage, bold: PDFFont, label: string, pageNumber: number) {
  page.drawText("D2D DIGITAL - WEBSITE REVIEW", { x: 38, y: page.getHeight() - 34, size: 9, font: bold, color: TEAL });
  page.drawText(label, { x: 38, y: page.getHeight() - 50, size: 8, font: bold, color: COPPER });
  page.drawText(String(pageNumber), { x: page.getWidth() - 52, y: page.getHeight() - 42, size: 9, font: bold, color: MUTED });
}

function detailEntries(page: FeedbackPage) {
  const annotations = pageAnnotations(page).map((annotation, index) => ({
    label: `${index + 1}. ${annotationLabels[annotation.category]}`,
    value: annotation.text || "Area marked without an additional note.",
  }));
  const answers = Object.entries((page.answers ?? {}) as Record<string, string>)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => ({ label: key.replaceAll("_", " "), value }));
  if (String(page.commentary ?? "").trim()) annotations.push({ label: "General page notes", value: String(page.commentary) });
  return [...annotations, ...answers];
}

export async function generateWebsiteFeedbackPdf(session: FeedbackSession, pages: FeedbackPage[], overall: SubmitFeedbackInput, options?: { screenshots?: Buffer[] }) {
  const screenshots = options?.screenshots ?? await captureAllPages(pages);
  if (screenshots.length !== pages.length) throw new Error("Every reviewed page needs one PDF snapshot.");
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const titleFont = await document.embedFont(StandardFonts.TimesRomanBold);
  document.setTitle(`Website Feedback - ${String(session.company)}`);
  document.setAuthor("D2D Digital and Marketing teams");
  document.setSubject("Client website markup and revision notes");

  let pageNumber = 1;
  const cover = document.addPage([612, 792]);
  cover.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: PAPER });
  cover.drawRectangle({ x: 0, y: 522, width: 612, height: 270, color: INK });
  cover.drawText("D2D DIGITAL", { x: 46, y: 735, size: 11, font: bold, color: TEAL });
  cover.drawText("WEBSITE REVIEW", { x: 46, y: 705, size: 10, font: bold, color: rgb(0.82, 0.86, 0.84) });
  let coverY = drawWrapped(cover, titleFont, String(session.company), { x: 46, y: 650, size: 33, maxWidth: 520, lineHeight: 38, color: rgb(1, 1, 1) });
  coverY = drawWrapped(cover, regular, `Submitted by ${String(session.client_name)} - ${String(session.client_email)}`, { x: 46, y: coverY - 12, size: 11, maxWidth: 520, lineHeight: 16, color: rgb(0.82, 0.86, 0.84) });
  cover.drawText(`${pages.length} ${pages.length === 1 ? "page" : "pages"} reviewed`, { x: 46, y: coverY - 34, size: 12, font: bold, color: TEAL });
  cover.drawText(`${overall.satisfactionScore}/10 overall satisfaction`, { x: 46, y: 475, size: 18, font: bold, color: INK });
  cover.drawText(overall.approvalStatus.replaceAll("_", " ").toUpperCase(), { x: 46, y: 447, size: 10, font: bold, color: COPPER });
  let overallY = 405;
  for (const [key, value] of Object.entries(overall.overallAnswers).filter(([, value]) => value.trim())) {
    cover.drawText(key.replaceAll("_", " ").toUpperCase(), { x: 46, y: overallY, size: 8, font: bold, color: TEAL });
    overallY = drawWrapped(cover, regular, value, { x: 46, y: overallY - 15, size: 10, maxWidth: 520, lineHeight: 14, color: MUTED }) - 12;
    if (overallY < 55) break;
  }
  cover.drawText("Prepared for the D2D Digital and Marketing teams", { x: 46, y: 30, size: 8, font: bold, color: MUTED });

  for (let index = 0; index < pages.length; index += 1) {
    const feedbackPage = pages[index];
    pageNumber += 1;
    const imagePage = document.addPage([792, 612]);
    imagePage.drawRectangle({ x: 0, y: 0, width: 792, height: 612, color: PAPER });
    drawReportHeader(imagePage, bold, `PAGE ${index + 1} - MARKED WEBSITE`, pageNumber);
    imagePage.drawText(printableText(String(feedbackPage.page_title || `Page ${index + 1}`)), { x: 28, y: 532, size: 18, font: titleFont, color: INK });
    drawWrapped(imagePage, regular, String(feedbackPage.url ?? ""), { x: 28, y: 514, size: 7, maxWidth: 736, lineHeight: 10, color: MUTED });
    const embedded = await document.embedJpg(screenshots[index]);
    imagePage.drawImage(embedded, { x: 28, y: 126, width: 736, height: 368 });
    const markCount = pageAnnotations(feedbackPage).length;
    imagePage.drawText(`${markCount} ${markCount === 1 ? "marked item" : "marked items"} - complete written notes follow`, { x: 28, y: 98, size: 10, font: bold, color: TEAL });
    if (String(feedbackPage.commentary ?? "").trim()) drawWrapped(imagePage, regular, `General note: ${String(feedbackPage.commentary)}`, { x: 28, y: 80, size: 8, maxWidth: 736, lineHeight: 11, color: MUTED });

    let entries = detailEntries(feedbackPage);
    let detailPage: PDFPage | null = null;
    let detailY = 0;
    while (entries.length || detailPage === null) {
      pageNumber += 1;
      detailPage = document.addPage([612, 792]);
      detailPage.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: PAPER });
      drawReportHeader(detailPage, bold, `PAGE ${index + 1} - NOTES`, pageNumber);
      detailPage.drawText(printableText(String(feedbackPage.page_title || `Page ${index + 1}`)), { x: 38, y: 705, size: 24, font: titleFont, color: INK });
      detailPage.drawText(`Page score: ${String(feedbackPage.page_score ?? "-")}/5`, { x: 38, y: 680, size: 10, font: bold, color: COPPER });
      detailY = 646;
      if (!entries.length) {
        detailPage.drawText("No written notes were added for this page.", { x: 38, y: detailY, size: 10, font: regular, color: MUTED });
        break;
      }
      while (entries.length) {
        const entry = entries[0];
        const lines = wrapText(regular, entry.value, 10, 536);
        const availableLines = Math.max(1, Math.floor((detailY - 82) / 14));
        if (availableLines < 3) break;
        const visibleLines = lines.slice(0, availableLines);
        const remainingLines = lines.slice(availableLines);
        entries = entries.slice(1);
        detailPage.drawText(printableText(entry.label.toUpperCase()), { x: 38, y: detailY, size: 8, font: bold, color: TEAL });
        detailY = drawLines(detailPage, regular, visibleLines, { x: 38, y: detailY - 16, size: 10, lineHeight: 14, color: MUTED }) - 16;
        detailPage.drawLine({ start: { x: 38, y: detailY + 7 }, end: { x: 574, y: detailY + 7 }, thickness: 0.5, color: rgb(0.84, 0.81, 0.76) });
        if (remainingLines.length) {
          entries = [{ label: `${entry.label} continued`, value: remainingLines.join(" ") }, ...entries];
          break;
        }
      }
    }
  }

  return Buffer.from(await document.save({ useObjectStreams: true }));
}
