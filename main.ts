import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import * as Sentry from "@sentry/deno";
import { Chart, registerables } from "chart.js";
import { createCanvas } from "canvas";

const app = new Hono();
const allowedTypes = new Set(["bar", "line", "pie", "doughnut"]);

Sentry.init({
  dsn:
    "https://aca76912cd8193affff31736ab6bc288@o4510418325864448.ingest.de.sentry.io/4510729022013520",
});

if (import.meta.main) {
  let sentryTest: string | undefined;
  try {
    sentryTest = Deno.env.get("SENTRY_TEST");
  } catch {
    sentryTest = undefined;
  }
  if (sentryTest === "1") {
    setTimeout(() => {
      throw new Error("Sentry test error");
    }, 0);
  }
}

app.get("/static/*", serveStatic({ root: "./" }));

app.get("/", (c) => {
  const query = c.req.query();
  if (shouldRenderImage(query)) {
    return renderImage(query);
  }
  return c.html(renderPage());
});

export default app;

const backgroundPlugin = {
  id: "customBackground",
  beforeDraw(
    chart: Chart,
    _args: unknown,
    options: { color?: string; alpha?: number },
  ) {
    const { ctx, width, height } = chart;
    const alpha = typeof options?.alpha === "number" ? options.alpha : 1;
    if (alpha <= 0) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = options?.color ?? "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

Chart.register(...registerables, backgroundPlugin);

function renderPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chart Placeholder</title>
    <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@picocss/pico@latest/css/pico.min.css"
    />
    <script
      src="https://js-de.sentry-cdn.com/aca76912cd8193affff31736ab6bc288.min.js"
      crossorigin="anonymous"
    ></script>
    <script>
      Sentry.onLoad(function () {
        Sentry.init({
          // Tracing
          tracesSampleRate: 1.0,
          // Session Replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });
      });
    </script>
    <script src="https://unpkg.com/htmx.org@latest"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js@latest"></script>
    <script defer src="/static/app.js"></script>
    <script defer src="https://unpkg.com/alpinejs@latest/dist/cdn.min.js"></script>
  </head>
  <body>
    <header class="container">
      <hgroup>
        <h1>Build a chart image URL in seconds.</h1>
      <p data-lead>
        Generate placeholder chart images for mockups, product docs, and
        dashboards. Configure chart parameters in the browser and get a shareable
        image URL instantly for web design and UI prototyping.
      </p>
      </hgroup>
    </header>

    <main class="container" x-data="chartBuilder()" x-cloak>
      <section class="grid">
        <article style="max-height: 70vh; overflow-y: auto; overflow-x: hidden;">
          <h2>Chart Controls</h2>
          <form @input.debounce.200ms="buildChart()">
            <label>
              Chart type
              <select x-model="type">
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
              </select>
            </label>
            <label>
              Title
              <input type="text" x-model="title" placeholder="Quarterly Revenue" />
            </label>
            <label>
              Labels (comma separated)
              <input type="text" x-model="labelsText" placeholder="Q1, Q2, Q3, Q4" />
            </label>
            <label>
              Values (comma separated)
              <input type="text" x-model="valuesText" placeholder="12, 19, 3, 5" />
            </label>
            <label>
              Dataset label
              <input type="text" x-model="datasetLabel" placeholder="Revenue" />
            </label>
            <div class="grid">
              <label>
                Width
                <input
                  type="number"
                  min="240"
                  max="1200"
                  x-model.number="width"
                  @input="onWidthChange()"
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min="200"
                  max="800"
                  x-model.number="height"
                  @input="onHeightChange()"
                />
              </label>
            </div>
            <label>
              <input type="checkbox" x-model="lockAspect" />
              Lock aspect ratio
              <span
                data-tooltip="Keep the preview and output size proportional when changing width or height."
                data-placement="right"
                aria-label="Help"
              >
                ⓘ
              </span>
            </label>
            <label>
              Aspect ratio preset
              <select
                x-model="aspectPreset"
                :disabled="!lockAspect"
                @change="applyAspectPreset()"
              >
                <option value="custom">Custom</option>
                <option value="1:1">1:1</option>
                <option value="3:2">3:2</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
              </select>
            </label>
            <div class="grid">
              <label>
                Primary color
                <input type="color" x-model="primaryColor" />
              </label>
              <label>
                Background
                <input type="color" x-model="background" />
              </label>
            </div>
            <label>
              Background opacity
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                x-model.number="backgroundOpacity"
              />
              <small>0 = transparent, 1 = solid.</small>
            </label>
            <label>
              Palette (comma separated colors for pie/doughnut)
              <input
                type="text"
                x-model="paletteText"
                placeholder="#2563eb, #22c55e, #f97316, #0f172a"
              />
            </label>
            <label>
              <input type="checkbox" x-model="showLegend" />
              Show legend
            </label>
            <label>
              <input type="checkbox" x-model="fillArea" />
              Fill area (line)
              <span
                data-tooltip="For line charts, fill the area under the line."
                data-placement="right"
                aria-label="Help"
              >
                ⓘ
              </span>
            </label>
          </form>
        </article>

        <article>
          <header>
            <h2>Preview & Export</h2>
          </header>
          <div data-canvas>
            <canvas x-ref="canvas"></canvas>
          </div>
          <hr />
          <div>
            <label>
              Image URL
              <input
                type="text"
                readonly
                :value="imageUrl"
              />
            </label>
            <div class="grid">
              <button type="button" @click="copyUrl()" class="secondary">
                Copy URL
              </button>
              <button type="button" @click="downloadPng()" class="contrast">
                Download PNG
              </button>
              <button type="button" @click="randomize()">Shuffle data</button>
            </div>
            <small aria-live="polite" x-text="copyStatus"></small>
          </div>
        </article>
      </section>
    </main>
  </body>
</html>`;
}

function shouldRenderImage(query: Record<string, string>): boolean {
  if ("ui" in query) {
    return false;
  }
  return Object.keys(query).length > 0;
}

function renderImage(query: Record<string, string>): Response {
  const type = normalizeType(query.type);
  const title = query.title ?? "";
  const labels = parseCsv(query.labels, ["A", "B", "C", "D"]);
  const values = parseCsvNumbers(query.values, [12, 19, 3, 5]);
  const datasetLabel = query.datasetLabel ?? "Dataset";
  const width = clampInt(query.width, 240, 1200, 640);
  const height = clampInt(query.height, 200, 800, 360);
  const primaryColor = query.primaryColor ?? "#2563eb";
  const background = query.background ?? "#ffffff";
  const backgroundOpacity = clampFloat(query.backgroundOpacity, 0, 1, 1);
  const palette = parseCsv(query.palette, [
    "#2563eb",
    "#22c55e",
    "#f97316",
    "#0f172a",
  ]);
  const showLegend = parseBool(query.showLegend, true);
  const fillArea = parseBool(query.fillArea, false);
  const normalized = normalizeValues(labels, values);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const dataset = {
    label: datasetLabel,
    data: normalized.values,
    borderColor: primaryColor,
    backgroundColor: type === "pie" || type === "doughnut"
      ? palette
      : withAlpha(primaryColor, 0.4),
    fill: fillArea,
    tension: 0.3,
  };

  const plugins = {
    legend: {
      display: showLegend,
    },
    title: {
      display: Boolean(title),
      text: title,
    },
    customBackground: {
      color: background,
      alpha: backgroundOpacity,
    },
  } as Record<string, unknown>;

  const chart = new Chart(ctx, {
    type,
    data: {
      labels: normalized.labels,
      datasets: [dataset],
    },
    options: {
      responsive: false,
      animation: false,
      plugins,
      scales: type === "pie" || type === "doughnut" ? {} : {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  chart.update();
  const buffer = canvas.toBuffer("image/png");
  chart.destroy();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
    },
  });
}

function normalizeType(raw?: string): "bar" | "line" | "pie" | "doughnut" {
  if (raw && allowedTypes.has(raw)) {
    return raw as "bar" | "line" | "pie" | "doughnut";
  }
  return "bar";
}

function parseCsv(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) {
    return fallback;
  }
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length ? items : fallback;
}

function parseCsvNumbers(
  raw: string | undefined,
  fallback: number[],
): number[] {
  if (!raw) {
    return fallback;
  }
  const items = raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isFinite(value));
  return items.length ? items : fallback;
}

function clampInt(
  raw: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampFloat(
  raw: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) {
    return fallback;
  }
  return raw === "1" || raw.toLowerCase() === "true" || raw === "on";
}

function normalizeValues(labels: string[], values: number[]) {
  if (!labels.length) {
    return { labels, values };
  }
  if (values.length >= labels.length) {
    return {
      labels,
      values: values.slice(0, labels.length),
    };
  }
  const padded = [...values];
  while (padded.length < labels.length) {
    padded.push(values[values.length - 1] ?? 0);
  }
  return { labels, values: padded };
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const value = Math.round(alpha * 255);
  const suffix = value.toString(16).padStart(2, "0");
  return `#${normalized}${suffix}`;
}
