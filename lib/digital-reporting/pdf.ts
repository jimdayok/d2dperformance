import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { clientChange, clientMetrics, clientValue } from "./client-language";
import type { Metric, Snapshot } from "./model";

export type ReportPdfOptions = { templateDraft?: boolean };
/** Two client-facing layouts. Approval/delivery state never changes a saved PDF. */
export async function renderReportPdf(
  snapshot: Snapshot,
  version: number,
  options: ReportPdfOptions = {},
) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold),
    serif = await doc.embedFont(StandardFonts.TimesRoman);
  const mark = await doc.embedPng(
    await readFile(join(process.cwd(), "public/assets/reporting/d2d-mark.png")),
  );
  const plum = rgb(0.29, 0.2, 0.2),
    rose = rgb(0.98, 0.8, 0.81),
    cream = rgb(0.97, 0.96, 0.93),
    ink = rgb(0.18, 0.16, 0.16),
    muted = rgb(0.43, 0.39, 0.38),
    lineColor = rgb(0.86, 0.83, 0.81);
  const monthly = snapshot.kind === "monthly";
  const month = (period: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${period.slice(0, 10)}T12:00:00Z`));
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7e\n]/g, "-");
  let page = doc.addPage([612, 792]),
    y = 642;
  const sections: string[] = [];
  function wrap(s: string, size: number, width: number, font = regular) {
    const output: string[] = [];
    for (const paragraph of clean(s).split("\n")) {
      let current = "";
      for (const word of paragraph.split(/\s+/)) {
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width) {
          let n = 1;
          while (
            n < rest.length &&
            font.widthOfTextAtSize(rest.slice(0, n + 1), size) <= width
          )
            n++;
          if (current) {
            output.push(current);
            current = "";
          }
          output.push(rest.slice(0, n));
          rest = rest.slice(n);
        }
        const candidate = current ? `${current} ${rest}` : rest;
        if (font.widthOfTextAtSize(candidate, size) > width) {
          output.push(current);
          current = rest;
        } else current = candidate;
      }
      output.push(current);
    }
    return output;
  }
  function header(section: string) {
    sections.push(section);
    page.drawRectangle({ x: 0, y: 680, width: 612, height: 112, color: plum });
    page.drawImage(mark, { x: 44, y: 704, width: 78, height: 50.21 });
    page.drawText("D2D MARKETING", {
      x: 143,
      y: 746,
      size: 11,
      font: bold,
      color: cream,
    });
    page.drawText(
      clean(monthly ? "MONTHLY DIGITAL REVIEW" : "INITIAL DIGITAL REVIEW"),
      { x: 143, y: 726, size: 9, font: regular, color: rose },
    );
    page.drawText(clean(section), {
      x: 143,
      y: 704,
      size: 9,
      font: regular,
      color: cream,
    });
    if (options.templateDraft)
      page.drawText("TEMPLATE DRAFT / FOR REVIEW", {
        x: 386,
        y: 774,
        size: 8,
        font: bold,
        color: rose,
      });
  }
  header(
    monthly
      ? "Your progress, explained simply"
      : "Your starting point, explained simply",
  );
  function newPage(section: string) {
    page = doc.addPage([612, 792]);
    y = 642;
    header(section);
  }
  function paragraph(
    s: string,
    size = 11,
    font: PDFFont = regular,
    color = ink,
    width = 524,
    x = 44,
  ) {
    for (const row of wrap(s, size, width, font)) {
      if (y < 72) newPage(sections.at(-1) ?? "Continued");
      page.drawText(row, { x, y, size, font, color });
      y -= size + 5.5;
    }
    y -= 9;
  }
  function title(s: string) {
    paragraph(s, 27, serif, plum);
  }
  function heading(s: string) {
    if (y < 120) newPage(sections.at(-1) ?? "Continued");
    y -= 7;
    paragraph(s, 16, serif, plum);
  }
  function note(s: string) {
    paragraph(s, 9.5, regular, muted);
  }
  function callout(label: string, body: string) {
    const rows = wrap(body, 10.5, 488);
    const h = rows.length * 16 + 46;
    if (y - h < 74) newPage(sections.at(-1) ?? "Continued");
    page.drawRectangle({
      x: 44,
      y: y - h + 8,
      width: 524,
      height: h,
      color: cream,
    });
    page.drawRectangle({
      x: 44,
      y: y - h + 8,
      width: 4,
      height: h,
      color: rose,
    });
    page.drawText(clean(label), {
      x: 60,
      y: y - 12,
      size: 10,
      font: bold,
      color: plum,
    });
    rows.forEach((row, i) =>
      page.drawText(row, {
        x: 60,
        y: y - 32 - i * 16,
        size: 10.5,
        font: regular,
        color: ink,
      }),
    );
    y -= h + 12;
  }
  const metric = (key: string) => snapshot.metrics.find((m) => m.key === key)!;
  const baseline = (key: string) =>
    snapshot.baseline?.metrics.find((m) => m.key === key);
  const previous = (key: string) =>
    snapshot.previous?.metrics.find((m) => m.key === key);
  function resultTable(keys: string[]) {
    let changedRules = false;
    const widths = monthly ? [248, 90, 90, 96] : [365, 159];
    const xs = monthly ? [44, 292, 382, 472] : [44, 409];
    const labels = monthly
      ? ["What we are measuring", "Starting point", "Last month", "This month"]
      : ["What we are measuring", "Starting result"];
    function tableHead() {
      page.drawRectangle({
        x: 44,
        y: y - 25,
        width: 524,
        height: 31,
        color: plum,
      });
      labels.forEach((label, i) =>
        page.drawText(label, {
          x: xs[i] + 8,
          y: y - 14,
          size: 9,
          font: bold,
          color: cream,
        }),
      );
      y -= 38;
    }
    tableHead();
    keys.forEach((key, index) => {
      const m = metric(key),
        def = clientMetrics[key];
      const cells = monthly
        ? [
            def.label,
            clientValue(baseline(key)),
            clientValue(previous(key)),
            clientValue(m),
          ]
        : [def.label, clientValue(m)];
      if (
        monthly &&
        m.status === "verified" &&
        [baseline(key), previous(key)].some(
          (reference) =>
            reference?.status === "verified" &&
            (reference.source !== m.source || reference.method !== m.method),
        )
      ) {
        cells[cells.length - 1] += "*";
        changedRules = true;
      }
      const rows = cells.map((v, i) =>
        wrap(v, 10, widths[i] - 16, i === 0 ? bold : regular),
      );
      const h = Math.max(...rows.map((r) => r.length)) * 15 + 16;
      if (y - h < 80) {
        newPage(sections.at(-1) ?? "Your results");
        tableHead();
      }
      if (index % 2 === 0)
        page.drawRectangle({
          x: 44,
          y: y - h + 8,
          width: 524,
          height: h,
          color: cream,
        });
      rows.forEach((r, i) =>
        r.forEach((value, j) =>
          page.drawText(value, {
            x: xs[i] + 8,
            y: y - 7 - j * 15,
            size: 10,
            font: i === 0 ? bold : regular,
            color: ink,
          }),
        ),
      );
      y -= h;
    });
    y -= 10;
    if (changedRules)
      note(
        "*This result used a different source or different counting rules. The numbers should be read separately rather than treated as a fair comparison.",
      );
  }
  const core = ["users", "organic_clicks", "leads"];
  function cards() {
    if (y < 200) newPage("At a glance");
    core.forEach((key, i) => {
      const x = 44 + i * 179;
      page.drawRectangle({
        x,
        y: y - 104,
        width: 166,
        height: 104,
        color: cream,
      });
      const label =
        key === "users"
          ? "People visiting you"
          : key === "organic_clicks"
            ? "Visits from Google"
            : "Customer inquiries";
      page.drawText(label, {
        x: x + 12,
        y: y - 20,
        size: 10,
        font: bold,
        color: plum,
      });
      const result = clientValue(metric(key));
      const size = metric(key).status === "verified" ? 22 : 12;
      page.drawText(result, {
        x: x + 12,
        y: y - 50,
        size,
        font: bold,
        color: ink,
      });
      const helper =
        metric(key).status === "verified"
          ? monthly
            ? "Recorded this month"
            : "Your starting result"
          : "We still need this information.";
      wrap(helper, 9, 142).forEach((row, j) =>
        page.drawText(row, {
          x: x + 12,
          y: y - 72 - j * 13,
          size: 9,
          font: regular,
          color: muted,
        }),
      );
    });
    y -= 125;
  }
  paragraph(
    monthly ? "Your monthly digital review" : "Your digital starting point",
    10,
    bold,
    muted,
  );
  title(snapshot.organizationName);
  note(
    `${monthly ? "Month reviewed" : "Initial review"}: ${month(snapshot.period)}`,
  );
  if (!monthly) note(`Initial review arrangement: ${snapshot.pricing}`);
  if (monthly)
    note(
      `Compared with your starting review${snapshot.baseline ? ` (${month(snapshot.baseline.period)})` : ""} and last month${snapshot.previous ? ` (${month(snapshot.previous.period)})` : ""}.`,
    );
  title(
    monthly
      ? "What changed. What comes next."
      : "Where you are today. Where we go next.",
  );
  paragraph(
    monthly
      ? "This review shows how people found your business, what they did on your website, and whether those visits led to inquiries. We compare this month with your first review and last month wherever we have matching information."
      : "This first review gives us a shared picture of how customers find your business online. It becomes the starting point for future monthly reviews, so you can see what changes and what D2D is doing for you.",
  );
  cards();
  heading(monthly ? "Your month in plain language" : "What we learned");
  paragraph(snapshot.summary);
  const confirmed = snapshot.metrics.filter(
    (m) => m.status === "verified",
  ).length;
  if (confirmed === 0)
    callout(
      monthly ? "What we can confirm this month" : "A clear starting point",
      "We do not yet have measured results for this report. That does not mean your business had no visitors or inquiries. It means we need the information before we can make a fair assessment.",
    );
  else
    callout(
      "Reading your results",
      `${confirmed} of the ${snapshot.metrics.length} measures in this review have supporting information. A result marked 'Not measured' is unknown, not zero. We explain any gaps at the back of this report.`,
    );

  newPage(
    monthly
      ? "How customers found you this month"
      : "How customers can find you",
  );
  title(
    monthly
      ? "Are more people finding you?"
      : "Can customers find your business?",
  );
  paragraph(
    "We look at two ways customers may discover you: Google search and answers from AI assistants. Being seen is useful, but website visits and real inquiries tell us more about the value to your business.",
  );
  heading("Finding you through Google");
  resultTable(["search_impressions", "organic_clicks", "search_ctr"]);
  note(
    "An appearance in search does not mean someone visited your website. A search visit means someone clicked through an unpaid Google result to your website.",
  );
  if (monthly && metric("organic_clicks").status === "verified")
    note(
      `Google search visits compared with last month: ${clientChange(metric("organic_clicks"), previous("organic_clicks"))}`,
    );
  heading("Finding you through AI assistants");
  resultTable(["ai_mentions", "ai_citations"]);
  note(
    "We ask a recorded set of customer-style questions and check whether your business is named or linked. Results can change with the question, assistant and date. These tests do not represent every AI answer.",
  );
  if (y > 160 && monthly)
    callout(
      "What this tells you",
      "More appearances do not always mean more customers. We read search and AI results alongside the visits and inquiries on the next page.",
    );
  else if (y > 160)
    callout(
      "How future reviews will use this",
      "Once these starting results are confirmed, later reviews will show what changed. If a measure is missing today, we will explain the gap rather than invent a starting number.",
    );

  newPage(
    monthly
      ? "What visitors did and whether they contacted you"
      : "Your website and customer inquiries",
  );
  title(
    monthly
      ? "Did visits lead to conversations?"
      : "From visits to customer inquiries.",
  );
  paragraph(
    "A useful website helps people understand your business and decide what to do next. We look at visits, meaningful activity, and the inquiries we can confirm.",
  );
  heading("People using your website");
  resultTable(["users", "sessions", "engagement_rate"]);
  note(
    "A person may visit more than once. 'Meaningful activity' means a visit that met the agreed tracking rules, such as spending time, viewing several pages or taking an important action.",
  );
  heading("People taking the next step");
  resultTable(["leads", "forms", "calls", "bookings"]);
  note(
    "Forms, calls and bookings can overlap. We do not add them together and call the total 'new customers.' Confirmed inquiries follow the agreed counting rules; an inquiry is not a completed sale.",
  );
  if (y < 135) {
    if (y > 115)
      note(
        "Loading speed, response time and page movement are included in the supporting details that follow.",
      );
  } else {
    heading("A smooth website experience");
    const tech = ["lcp", "inp", "cls"].map(metric);
    if (tech.every((m) => m.status !== "verified"))
      paragraph(
        "We still need information about loading speed, response time and page movement. Until those checks are available, we cannot say whether visitors experienced a technical problem.",
      );
    else resultTable(["lcp", "inp", "cls"]);
  }
  newPage(
    monthly ? "D2D's work and your next steps" : "Your first action plan",
  );
  title(
    monthly
      ? "What D2D did. What happens next."
      : "A practical plan for moving forward.",
  );
  heading(
    monthly ? "Work completed this month" : "Work completed for this review",
  );
  paragraph(
    snapshot.workCompleted ||
      "No completed work has been recorded in this draft. D2D will confirm the work before the report is released.",
  );
  heading(monthly ? "Our priorities for next month" : "Our first priorities");
  paragraph(
    snapshot.nextSteps ||
      "D2D will confirm the next priorities before releasing this report.",
  );
  callout(
    monthly
      ? "What we will check next time"
      : "What your next review will show",
    monthly
      ? "We will revisit the same measures, explain changes we can support, and report on the priorities above. When the way a result is counted changes, we will explain that before comparing it."
      : "Your monthly review will compare new results with this starting point and the previous month. We will tell you what changed, what work we completed, and what we are doing next. The original starting point remains in your report history.",
  );
  heading("What we still need to know");
  paragraph(snapshot.limitations);
  if (snapshot.proposalReference)
    note(`Your engagement reference: ${snapshot.proposalReference}`);
  note(
    "Questions about your report? Contact your D2D account team at info@d2dmktg.com.",
  );

  newPage("Supporting details / the numbers behind your review");
  title("A few additional details");
  paragraph(
    "These figures add context to the main results on the preceding pages. Each one answers a different question about your website or how people find you.",
  );
  resultTable([
    "search_position",
    "views",
    "conversion_rate",
    "lcp",
    "inp",
    "cls",
    "indexable_pages",
  ]);
  heading("What these figures mean");
  note(
    "Average place in Google is a broad average across searches, rather than a fixed ranking. Pages search engines can include are eligible for search; that does not guarantee Google will include them.",
  );
  note(
    "The share of visits that became inquiries uses the agreed inquiry-counting rules. For any percentage, a change from 10% to 12% means an increase of 2 percentage points.",
  );
  note(
    "Website loading and response times are shown in seconds or milliseconds. Less waiting and less page movement generally mean a smoother visit. More traffic or inquiries alone does not prove what caused a change.",
  );
  if (monthly) {
    note(
      `Starting review: ${snapshot.baseline ? month(snapshot.baseline.period) : "Not available"}. Previous month: ${snapshot.previous ? month(snapshot.previous.period) : "Not available"}.`,
    );
    note(
      "If the source or counting rules changed, we cannot compare the two results fairly. Months also have different numbers of days, which can affect monthly totals.",
    );
  }

  newPage("Supporting details / how we checked your results");
  title("Where your information came from");
  paragraph(
    "These sources support the results in your review. A result marked 'Not measured' still needs information; it does not mean your result was zero.",
  );
  const sourceNames: Record<string, string> = {
    "Google Search Console": "Google search records",
    GA4: "Website visitor tracking (Google Analytics)",
    "Documented prompt panel": "Recorded questions asked of AI assistants",
    "CRM / reconciled lead records": "Checked customer inquiry records",
    "GA4 / form provider": "Website forms and visitor tracking",
    "Call tracking provider": "Phone-call records",
    "Booking provider": "Booking records",
    "Reconciled leads / GA4 sessions":
      "Checked inquiries and website visit records",
    "CrUX field data": "Google's records of real visitor experiences",
    "Documented technical crawl": "A recorded check of your website pages",
  };
  const sourceGroups = new Map<string, Metric[]>();
  for (const m of snapshot.metrics) {
    const key = JSON.stringify([
      m.source,
      m.status,
      m.evidence,
      m.method,
      m.measuredAt,
      m.reason,
    ]);
    sourceGroups.set(key, [...(sourceGroups.get(key) ?? []), m]);
  }

  for (const measures of sourceGroups.values()) {
    const m = measures[0],
      label = sourceNames[m.source] ?? m.source;
    const date = m.measuredAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "America/Chicago",
        }).format(new Date(m.measuredAt))
      : "Not yet checked";
    const covered = `Used for: ${measures.map((m) => clientMetrics[m.key].label.toLowerCase()).join("; ")}.`;
    const commonReasons = [
      "No verified data supplied for this period.",
      "We have not received the information needed to measure this yet.",
    ];
    const detail =
      m.status === "verified"
        ? `Checked: ${date}. Supporting record: ${m.evidence}.\nWhat was included: ${m.method}.`
        : commonReasons.includes(m.reason)
          ? ""
          : m.reason;
    const labelRows = wrap(label, 10.5, 405, bold),
      coveredRows = wrap(covered, 9.5, 524),
      detailRows = detail ? wrap(detail, 9.5, 524) : [];
    const h =
      labelRows.length * 15 +
      coveredRows.length * 13 +
      detailRows.length * 13 +
      9;
    if (y - h < 76) newPage("Supporting details / how we checked your results");
    labelRows.forEach((row, i) =>
      page.drawText(row, {
        x: 44,
        y: y - i * 15,
        size: 10.5,
        font: bold,
        color: plum,
      }),
    );
    const status =
      m.status === "verified"
        ? "Measured"
        : m.status === "not_applicable"
          ? "Does not apply"
          : "Not measured";
    page.drawText(status, { x: 484, y, size: 9, font: regular, color: muted });
    y -= labelRows.length * 15 + 2;
    for (const row of [...coveredRows, ...detailRows]) {
      page.drawText(row, { x: 44, y, size: 9.5, font: regular, color: muted });
      y -= 13;
    }
    y -= 5;

    y -= 4;
  }
  for (const [i, p] of doc.getPages().entries()) {
    p.drawLine({
      start: { x: 44, y: 50 },
      end: { x: 568, y: 50 },
      color: lineColor,
      thickness: 0.5,
    });
    p.drawText(
      `D2D Marketing | ${clean(snapshot.organizationName).slice(0, 48)}`,
      { x: 44, y: 33, size: 8, font: regular, color: muted },
    );
    p.drawText(`Version ${version}  |  ${i + 1} / ${doc.getPageCount()}`, {
      x: 464,
      y: 33,
      size: 8,
      font: regular,
      color: muted,
    });
  }
  doc.setTitle(
    `${monthly ? "Monthly Digital Review" : "Initial Digital Review"} | ${snapshot.organizationName}`,
  );
  doc.setAuthor("D2D Marketing");
  return Buffer.from(await doc.save());
}
