import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { comparison, metricDefinitions, type Snapshot } from "./model";

/** Fixed-layout, paginated output; text wraps before drawing and every version is stored. */
export async function renderReportPdf(snapshot: Snapshot, version: number) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const display = await doc.embedFont(StandardFonts.TimesRoman);
  const ink = rgb(0.09, 0.13, 0.11),
    copper = rgb(0.6, 0.37, 0.2),
    muted = rgb(0.39, 0.38, 0.35);
  let page = doc.addPage([612, 792]),
    y = 690;
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e\n]/g, "-");
  function newPage() {
    page = doc.addPage([612, 792]);
    y = 690;
  }
  function lines(s: string, size: number, width: number, font = regular) {
    const output: string[] = [];
    for (const paragraph of clean(s).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        // Split unbroken URLs/evidence identifiers as well as ordinary words.
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width) {
          let n = 1;
          while (
            n < rest.length &&
            font.widthOfTextAtSize(rest.slice(0, n + 1), size) <= width
          )
            n++;
          if (line) {
            output.push(line);
            line = "";
          }
          output.push(rest.slice(0, n));
          rest = rest.slice(n);
        }
        const candidate = line ? `${line} ${rest}` : rest;
        if (font.widthOfTextAtSize(candidate, size) > width) {
          output.push(line);
          line = rest;
        } else line = candidate;
      }
      output.push(line);
    }
    return output;
  }
  function text(
    s: string,
    size = 10,
    font = regular,
    color = ink,
    width = 516,
  ) {
    for (const line of lines(s, size, width, font)) {
      if (y < 70) newPage();
      page.drawText(line, { x: 48, y, size, font, color });
      y -= size + 5;
    }
    y -= 7;
  }
  function heading(s: string) {
    if (y < 135) newPage();
    y -= 9;
    text(s, 17, display, copper);
  }
  text("DIGITAL PERFORMANCE REPORT", 11, bold, copper);
  text(snapshot.organizationName, 30, display);
  text(
    snapshot.kind === "audit"
      ? "Initial Digital Visibility & Website Audit"
      : "Monthly Performance & Accountability",
    17,
    display,
  );
  text(
    `Reporting period: ${snapshot.period.slice(0, 7)}  |  Version ${version}  |  Prepared ${snapshot.createdAt.slice(0, 10)}`,
    10,
    regular,
    muted,
  );
  text(
    snapshot.kind === "audit"
      ? `Audit arrangement: ${snapshot.pricing}. The approved audit establishes a permanent measurement baseline.`
      : `Baseline: ${snapshot.baseline?.period.slice(0, 7) ?? "Unavailable"}  |  Prior period: ${snapshot.previous?.period.slice(0, 7) ?? "Unavailable"}`,
    10,
    regular,
    muted,
  );
  heading("Executive assessment");
  text(snapshot.summary);
  heading("Data coverage & limitations");
  const verified = snapshot.metrics.filter(
    (m) => m.status === "verified",
  ).length;
  text(
    `${verified} of ${metricDefinitions.length} metrics have supplied evidence. Missing data is not zero. Changes indicate movement, not proof of causation or improvement. Percentage metrics are compared by relative percent change.`,
    10,
  );
  text(snapshot.limitations);
  newPage();
  heading("Monthly digital performance scorecard");
  text(
    "Current, baseline and prior-period values. Full source evidence follows.",
    10,
    regular,
    muted,
  );
  const columns = [48, 215, 281, 347, 413, 482];
  const labels = [
    "Metric",
    "Current",
    "Baseline",
    "Prior month",
    "Vs baseline",
    "Vs prior",
  ];
  labels.forEach((label, i) =>
    page.drawText(label, {
      x: columns[i],
      y,
      size: 8,
      font: bold,
      color: copper,
    }),
  );
  y -= 26;
  function value(m?: (typeof snapshot.metrics)[number]) {
    return m?.status === "verified" && m.value !== null
      ? String(m.value)
      : "Unavailable";
  }
  for (const [key, , label, unit] of metricDefinitions) {
    const m = snapshot.metrics.find((m) => m.key === key)!;
    const b = snapshot.baseline?.metrics.find((m) => m.key === key),
      p = snapshot.previous?.metrics.find((m) => m.key === key);
    const cells = [
      `${label} (${unit})`,
      value(m),
      value(b),
      value(p),
      comparison(m, b),
      comparison(m, p),
    ];
    const wrapped = cells.map((cell, i) => lines(cell, 8, i === 0 ? 156 : 61));
    const rowHeight = Math.max(...wrapped.map((l) => l.length)) * 12 + 10;
    if (y - rowHeight < 70) newPage();
    wrapped.forEach((cell, i) =>
      cell.forEach((line, j) =>
        page.drawText(line, {
          x: columns[i],
          y: y - j * 12,
          size: 8,
          font: i === 0 ? bold : regular,
          color: ink,
        }),
      ),
    );
    y -= rowHeight;
    page.drawLine({
      start: { x: 48, y: y + 5 },
      end: { x: 564, y: y + 5 },
      color: rgb(0.89, 0.87, 0.84),
      thickness: 0.4,
    });
  }
  newPage();
  let category = "";
  for (const [key, group, label, unit] of metricDefinitions) {
    if (category !== group) {
      if (category) newPage();
      category = group;
      heading(group);
    }
    const m = snapshot.metrics.find((m) => m.key === key)!;
    if (y < 200) newPage();
    text(label, 12, bold);
    text(
      m.status === "verified"
        ? `${m.value} ${unit}  |  Baseline change: ${comparison(
            m,
            snapshot.baseline?.metrics.find((b) => b.key === key),
          )}  |  Prior-period change: ${comparison(
            m,
            snapshot.previous?.metrics.find((b) => b.key === key),
          )}`
        : `${m.status === "missing" ? "UNAVAILABLE" : "NOT APPLICABLE"}: ${m.reason}`,
      10,
      regular,
      m.status === "verified" ? ink : muted,
    );
    text(
      `Baseline value: ${snapshot.baseline?.metrics.find((b) => b.key === key)?.status === "verified" ? snapshot.baseline.metrics.find((b) => b.key === key)?.value : "Unavailable"}  |  Prior-period value: ${snapshot.previous?.metrics.find((b) => b.key === key)?.status === "verified" ? snapshot.previous.metrics.find((b) => b.key === key)?.value : "Unavailable"}\nSource: ${m.source}\nMethod / scope: ${m.method}\nEvidence: ${m.evidence || "None supplied"}\nCollected: ${m.measuredAt || "Not collected"}`,
      9,
      regular,
      muted,
    );
    y -= 7;
  }
  newPage();
  heading("D2D accountability");
  heading("Work completed");
  text(snapshot.workCompleted || "No completed work recorded for this report.");
  heading("Next month's priorities");
  text(
    snapshot.nextSteps ||
      "No next steps recorded. Administrator review required.",
  );
  heading("Measurement notes");
  text(
    "Use matching property, geography, channel filters, timezone and definitions across periods. Monthly totals are not normalized for unequal month lengths. AI visibility reflects only the documented prompt panel, providers, model versions, locations, dates and repeated runs; it is not a universal ranking or guarantee. Lab tests and field measurements must use distinct methods. Qualified leads require a documented deduplication and qualification rule.",
  );
  if (snapshot.proposalReference) {
    heading("Engagement reference");
    text(snapshot.proposalReference);
  }
  text(
    `Report recipients: ${snapshot.recipients.join(", ")}`,
    9,
    regular,
    muted,
  );
  for (const [index, p] of doc.getPages().entries()) {
    p.drawRectangle({ x: 0, y: 736, width: 612, height: 56, color: ink });
    p.drawText("D2D", {
      x: 48,
      y: 754,
      size: 23,
      font: bold,
      color: rgb(0.84, 0.65, 0.49),
    });
    p.drawText("MARKETING  /  DIGITAL PERFORMANCE", {
      x: 116,
      y: 761,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
    });
    p.drawText("Search visibility. AI discovery. Website performance.", {
      x: 116,
      y: 747,
      size: 8,
      font: regular,
      color: rgb(0.8, 0.8, 0.76),
    });
    p.drawText(
      `D2D Marketing  |  ${clean(snapshot.organizationName).slice(0, 55)}  |  v${version}`,
      { x: 48, y: 35, size: 8, font: regular, color: muted },
    );
    p.drawText(`${index + 1} / ${doc.getPageCount()}`, {
      x: 520,
      y: 35,
      size: 8,
      font: regular,
      color: muted,
    });
  }
  doc.setTitle(`D2D Digital Performance Report - ${snapshot.organizationName}`);
  doc.setAuthor("D2D Marketing");
  return Buffer.from(await doc.save());
}
