import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import * as Sentry from "@sentry/deno";
import { parseHTML } from "linkedom/worker";

const app = new Hono();
const allowedTypes = new Set(["bar", "line", "pie", "doughnut"]);
const CHARTIST_DEFAULT_CSS =
  ".ct-label{fill:rgba(0,0,0,.4);color:rgba(0,0,0,.4);font-size:.75rem;line-height:1}" +
  ".ct-chart-bar .ct-label,.ct-chart-line .ct-label{display:flex}" +
  ".ct-chart-donut .ct-label,.ct-chart-pie .ct-label{dominant-baseline:central}" +
  ".ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:flex-start;text-align:left}" +
  ".ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:flex-start;text-align:left}" +
  ".ct-label.ct-vertical.ct-start{align-items:flex-end;justify-content:flex-end;text-align:right}" +
  ".ct-label.ct-vertical.ct-end{align-items:flex-end;justify-content:flex-start;text-align:left}" +
  ".ct-chart-bar .ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:center;text-align:center}" +
  ".ct-chart-bar .ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:center;text-align:center}" +
  ".ct-chart-bar.ct-horizontal-bars .ct-label.ct-horizontal.ct-start{align-items:flex-end;justify-content:flex-start;text-align:left}" +
  ".ct-chart-bar.ct-horizontal-bars .ct-label.ct-horizontal.ct-end{align-items:flex-start;justify-content:flex-start;text-align:left}" +
  ".ct-chart-bar.ct-horizontal-bars .ct-label.ct-vertical.ct-start{align-items:center;justify-content:flex-end;text-align:right}" +
  ".ct-chart-bar.ct-horizontal-bars .ct-label.ct-vertical.ct-end{align-items:center;justify-content:flex-start;text-align:left}" +
  ".ct-grid{stroke:rgba(0,0,0,.2);stroke-width:1px;stroke-dasharray:2px}" +
  ".ct-grid-background{fill:none}" +
  ".ct-point{stroke-width:10px;stroke-linecap:round}" +
  ".ct-line{fill:none;stroke-width:4px}" +
  ".ct-area{stroke:none;fill-opacity:.1}" +
  ".ct-bar{fill:none;stroke-width:10px}" +
  ".ct-slice-donut{fill:none;stroke-width:60px}" +
  ".ct-series-a .ct-bar,.ct-series-a .ct-line,.ct-series-a .ct-point,.ct-series-a .ct-slice-donut{stroke:#d70206}" +
  ".ct-series-a .ct-area,.ct-series-a .ct-slice-pie{fill:#d70206}" +
  ".ct-series-b .ct-bar,.ct-series-b .ct-line,.ct-series-b .ct-point,.ct-series-b .ct-slice-donut{stroke:#f05b4f}" +
  ".ct-series-b .ct-area,.ct-series-b .ct-slice-pie{fill:#f05b4f}" +
  ".ct-series-c .ct-bar,.ct-series-c .ct-line,.ct-series-c .ct-point,.ct-series-c .ct-slice-donut{stroke:#f4c63d}" +
  ".ct-series-c .ct-area,.ct-series-c .ct-slice-pie{fill:#f4c63d}" +
  ".ct-series-d .ct-bar,.ct-series-d .ct-line,.ct-series-d .ct-point,.ct-series-d .ct-slice-donut{stroke:#d17905}" +
  ".ct-series-d .ct-area,.ct-series-d .ct-slice-pie{fill:#d17905}" +
  ".ct-series-e .ct-bar,.ct-series-e .ct-line,.ct-series-e .ct-point,.ct-series-e .ct-slice-donut{stroke:#453d3f}" +
  ".ct-series-e .ct-area,.ct-series-e .ct-slice-pie{fill:#453d3f}" +
  ".ct-series-f .ct-bar,.ct-series-f .ct-line,.ct-series-f .ct-point,.ct-series-f .ct-slice-donut{stroke:#59922b}" +
  ".ct-series-f .ct-area,.ct-series-f .ct-slice-pie{fill:#59922b}" +
  ".ct-series-g .ct-bar,.ct-series-g .ct-line,.ct-series-g .ct-point,.ct-series-g .ct-slice-donut{stroke:#0544d3}" +
  ".ct-series-g .ct-area,.ct-series-g .ct-slice-pie{fill:#0544d3}" +
  ".ct-series-h .ct-bar,.ct-series-h .ct-line,.ct-series-h .ct-point,.ct-series-h .ct-slice-donut{stroke:#6b0392}" +
  ".ct-series-h .ct-area,.ct-series-h .ct-slice-pie{fill:#6b0392}" +
  ".ct-series-i .ct-bar,.ct-series-i .ct-line,.ct-series-i .ct-point,.ct-series-i .ct-slice-donut{stroke:#e6805e}" +
  ".ct-series-i .ct-area,.ct-series-i .ct-slice-pie{fill:#e6805e}" +
  ".ct-series-j .ct-bar,.ct-series-j .ct-line,.ct-series-j .ct-point,.ct-series-j .ct-slice-donut{stroke:#dda458}" +
  ".ct-series-j .ct-area,.ct-series-j .ct-slice-pie{fill:#dda458}" +
  ".ct-series-k .ct-bar,.ct-series-k .ct-line,.ct-series-k .ct-point,.ct-series-k .ct-slice-donut{stroke:#eacf7d}" +
  ".ct-series-k .ct-area,.ct-series-k .ct-slice-pie{fill:#eacf7d}" +
  ".ct-series-l .ct-bar,.ct-series-l .ct-line,.ct-series-l .ct-point,.ct-series-l .ct-slice-donut{stroke:#86797d}" +
  ".ct-series-l .ct-area,.ct-series-l .ct-slice-pie{fill:#86797d}" +
  ".ct-series-m .ct-bar,.ct-series-m .ct-line,.ct-series-m .ct-point,.ct-series-m .ct-slice-donut{stroke:#b2c326}" +
  ".ct-series-m .ct-area,.ct-series-m .ct-slice-pie{fill:#b2c326}" +
  ".ct-series-n .ct-bar,.ct-series-n .ct-line,.ct-series-n .ct-point,.ct-series-n .ct-slice-donut{stroke:#6188e2}" +
  ".ct-series-n .ct-area,.ct-series-n .ct-slice-pie{fill:#6188e2}" +
  ".ct-series-o .ct-bar,.ct-series-o .ct-line,.ct-series-o .ct-point,.ct-series-o .ct-slice-donut{stroke:#a748ca}" +
  ".ct-series-o .ct-area,.ct-series-o .ct-slice-pie{fill:#a748ca}";

Sentry.init({
  dsn:
    "https://aca76912cd8193affff31736ab6bc288@o4510418325864448.ingest.de.sentry.io/4510729022013520",
});

if (import.meta.main) {
  (async () => {
    let sentryTest: string | undefined;
    if (Deno.permissions?.query) {
      try {
        const permission = await Deno.permissions.query({
          name: "env",
          variable: "SENTRY_TEST",
        });
        if (permission.state === "granted") {
          sentryTest = Deno.env.get("SENTRY_TEST");
        }
      } catch {
        sentryTest = undefined;
      }
    }
    if (sentryTest === "1") {
      setTimeout(() => {
        throw new Error("Sentry test error");
      }, 0);
    }
  })();
}

app.get("/static/*", serveStatic({ root: "./" }));

app.get("/", async (c) => {
  const query = c.req.query();
  if (shouldRenderImage(query)) {
    return await renderImage(query);
  }
  return c.html(renderPage());
});

export default app;

function renderPage(): string {
  return `<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Chart Placeholder</title>
    <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@picocss/pico@latest/css/pico.min.css"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/chartist@latest/dist/chartist.min.css"
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
    <script defer src="https://cdn.jsdelivr.net/npm/chartist@latest/dist/chartist.min.js"></script>
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
              <select x-model="type" @change="buildChart()">
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
              </select>
            </label>
            <label>
              Labels (comma separated)
              <input type="text" x-model="labelsText" placeholder="Q1, Q2, Q3, Q4" />
            </label>
            <label>
              Values (comma separated)
              <input type="text" x-model="valuesText" placeholder="12, 19, 3, 5" />
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
          <div data-canvas id="chart-preview"></div>
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
              <button type="button" @click="downloadSvg()" class="contrast">
                Download SVG
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

async function renderImage(query: Record<string, string>): Promise<Response> {
  const type = normalizeType(query.type);
  const labels = parseCsv(query.labels, ["A", "B", "C", "D"]);
  const values = parseCsvNumbers(query.values, [12, 19, 3, 5]);
  const width = clampInt(query.width, 240, 1200, 640);
  const height = clampInt(query.height, 200, 800, 360);
  const fillArea = parseBool(query.fillArea, false);
  const normalized = normalizeValues(labels, values);

  const svg = await renderChartistSvg({
    type,
    labels: normalized.labels,
    values: normalized.values,
    width,
    height,
    fillArea,
  });

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function normalizeType(raw?: string): "bar" | "line" | "pie" | "doughnut" {
  if (!raw) {
    return "bar";
  }
  if (raw === "donut") {
    return "doughnut";
  }
  if (allowedTypes.has(raw)) {
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

async function renderChartistSvg(options: {
  type: "bar" | "line" | "pie" | "doughnut";
  labels: string[];
  values: number[];
  width: number;
  height: number;
  fillArea: boolean;
}): Promise<string> {
  const { type, labels, values, width, height, fillArea } = options;

  const { document, window: domWindow } = parseHTML(
    '<!doctype html><html><body><div id="chart"></div></body></html>',
  );
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousElement = globalThis.Element;
  const previousSvgElement = globalThis.SVGElement;
  const previousNode = globalThis.Node;

  const cleanupGlobals = () => {
    if (previousWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      globalThis.window = previousWindow;
    }
    if (previousDocument === undefined) {
      delete (globalThis as { document?: unknown }).document;
    } else {
      globalThis.document = previousDocument;
    }
    if (previousNavigator === undefined) {
      delete (globalThis as { navigator?: unknown }).navigator;
    } else {
      globalThis.navigator = previousNavigator;
    }
    if (previousElement === undefined) {
      delete (globalThis as { Element?: unknown }).Element;
    } else {
      globalThis.Element = previousElement;
    }
    if (previousSvgElement === undefined) {
      delete (globalThis as { SVGElement?: unknown }).SVGElement;
    } else {
      globalThis.SVGElement = previousSvgElement;
    }
    if (previousNode === undefined) {
      delete (globalThis as { Node?: unknown }).Node;
    } else {
      globalThis.Node = previousNode;
    }
  };

  globalThis.window = domWindow;
  globalThis.document = document;
  globalThis.navigator = domWindow.navigator ??
    ({ userAgent: "deno" } as Navigator);
  if (!globalThis.Element && domWindow.Element) {
    globalThis.Element = domWindow.Element;
  }
  if (!globalThis.SVGElement && domWindow.SVGElement) {
    globalThis.SVGElement = domWindow.SVGElement;
  }
  if (!globalThis.Node && domWindow.Node) {
    globalThis.Node = domWindow.Node;
  }
  Object.defineProperty(domWindow, "devicePixelRatio", {
    value: 1,
    configurable: true,
  });
  if (!domWindow.matchMedia) {
    domWindow.matchMedia = () => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (!domWindow.requestAnimationFrame) {
    domWindow.requestAnimationFrame = (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    };
    domWindow.cancelAnimationFrame = () => {};
  }

  try {
    const container = document.getElementById("chart");
    if (!container) {
      return "";
    }

    const baseOptions = {
      width: `${width}px`,
      height: `${height}px`,
      chartPadding: 16,
    };

    const { BarChart, LineChart, PieChart } = await getChartist();

    if (type === "bar") {
      new BarChart(
        container,
        { labels, series: [values] },
        baseOptions,
      );
    } else if (type === "line") {
      new LineChart(
        container,
        { labels, series: [values] },
        { ...baseOptions, showArea: fillArea, fullWidth: true },
      );
    } else {
      const donutWidth = Math.max(
        16,
        Math.round(Math.min(width, height) * 0.12),
      );
      new PieChart(
        container,
        { labels, series: values },
        {
          width: baseOptions.width,
          height: baseOptions.height,
          donut: type === "doughnut",
          donutWidth,
          showLabel: true,
        },
      );
    }

    const delay = domWindow.setTimeout ?? setTimeout;
    await new Promise((resolve) => delay(resolve, 0));
    const svg = container.querySelector("svg");
    if (!svg) {
      return "";
    }
    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }
    const svgNs = "http://www.w3.org/2000/svg";
    const styleNode = document.createElementNS(svgNs, "style");
    styleNode.setAttribute("type", "text/css");
    styleNode.textContent = CHARTIST_DEFAULT_CSS;
    svg.insertBefore(styleNode, svg.firstChild);

    return sanitizeSvgMarkup(svg.outerHTML);
  } finally {
    cleanupGlobals();
  }
}

let chartistModulePromise:
  | Promise<typeof import("chartist")>
  | null = null;

function getChartist() {
  if (!chartistModulePromise) {
    chartistModulePromise = import("chartist");
  }
  return chartistModulePromise;
}

function sanitizeSvgMarkup(svg: string): string {
  return svg
    .replace(/ ?xmlns:xmlns="[^"]*"/g, "")
    .replace(/xmlns(?=xmlns)/g, "")
    .replace(
      /xmlns="http:\/\/www\.w3\.org\/2000\/xmlns\/"/g,
      'xmlns="http://www.w3.org/1999/xhtml"',
    );
}
