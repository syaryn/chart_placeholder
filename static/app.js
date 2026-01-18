const backgroundPlugin = {
  id: "customBackground",
  beforeDraw(chart, _args, options) {
    const { ctx, width, height } = chart;
    const alpha = typeof options.alpha === "number" ? options.alpha : 1;
    if (alpha <= 0) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = options.color || "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

Chart.register(backgroundPlugin);

document.addEventListener("alpine:init", () => {
  Alpine.data("chartBuilder", () => ({
    type: "bar",
    title: "Quarterly Revenue",
    labelsText: "Q1, Q2, Q3, Q4",
    valuesText: "12, 19, 3, 5",
    datasetLabel: "Revenue",
    width: 640,
    height: 360,
    lockAspect: false,
    aspectRatio: 640 / 360,
    aspectPreset: "custom",
    primaryColor: "#2563eb",
    background: "#ffffff",
    backgroundOpacity: 1,
    paletteText: "#2563eb, #22c55e, #f97316, #0f172a",
    showLegend: true,
    fillArea: false,
    chart: null,
    imageUrl: "",
    previewWidth: 640,
    previewHeight: 360,
    copyStatus: "",
    init() {
      this.aspectRatio = this.width / this.height;
      this.buildChart();
    },
    withSpan(spanConfig, fn) {
      const sentry = globalThis.Sentry;
      if (sentry && typeof sentry.startSpan === "function") {
        return sentry.startSpan(spanConfig, fn);
      }
      return fn();
    },
    parseList(text) {
      return text
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    },
    parseNumbers(text) {
      return this.parseList(text).map((value) => Number(value));
    },
    getPalette() {
      const colors = this.parseList(this.paletteText);
      return colors.length ? colors : [this.primaryColor];
    },
    buildChart() {
      const labels = this.parseList(this.labelsText);
      const values = this.parseNumbers(this.valuesText);
      const palette = this.getPalette();
      const canvas = this.$refs.canvas;

      if (!canvas) {
        return;
      }

      canvas.width = this.previewWidth;
      canvas.height = this.previewHeight;
      canvas.style.width = `${this.previewWidth}px`;
      canvas.style.height = `${this.previewHeight}px`;
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";

      if (this.chart) {
        this.chart.stop();
        this.chart.destroy();
        this.chart = null;
      }

      const dataset = {
        label: this.datasetLabel || "Dataset",
        data: values,
        borderColor: this.primaryColor,
        backgroundColor: this.type === "pie" || this.type === "doughnut"
          ? palette
          : this.primaryColor + "66",
        fill: this.fillArea,
        tension: 0.3,
      };

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      this.chart = new Chart(ctx, {
        type: this.type,
        data: {
          labels,
          datasets: [dataset],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              display: this.showLegend,
            },
            title: {
              display: Boolean(this.title),
              text: this.title,
            },
            customBackground: {
              color: this.background,
              alpha: this.backgroundOpacity,
            },
          },
          scales: this.type === "pie" || this.type === "doughnut" ? {} : {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      this.updateImageUrl();
    },
    onWidthChange() {
      if (!this.lockAspect || !Number.isFinite(this.width)) {
        return;
      }
      this.height = Math.round(this.width / this.aspectRatio);
    },
    onHeightChange() {
      if (!this.lockAspect || !Number.isFinite(this.height)) {
        return;
      }
      this.width = Math.round(this.height * this.aspectRatio);
    },
    applyAspectPreset() {
      const preset = this.aspectPreset;
      if (preset === "custom") {
        this.aspectRatio = this.width / this.height;
        return;
      }
      const [w, h] = preset.split(":").map((value) => Number(value));
      if (!Number.isFinite(w) || !Number.isFinite(h) || h === 0) {
        return;
      }
      this.aspectRatio = w / h;
      this.height = Math.round(this.width / this.aspectRatio);
    },
    updateImageUrl() {
      if (!this.chart) {
        this.imageUrl = "";
        return;
      }
      const params = new URLSearchParams();
      params.set("type", this.type);
      if (this.title) params.set("title", this.title);
      params.set("labels", this.labelsText);
      params.set("values", this.valuesText);
      if (this.datasetLabel) params.set("datasetLabel", this.datasetLabel);
      params.set("width", String(this.width));
      params.set("height", String(this.height));
      params.set("primaryColor", this.primaryColor);
      params.set("background", this.background);
      params.set("backgroundOpacity", String(this.backgroundOpacity));
      if (this.paletteText) params.set("palette", this.paletteText);
      params.set("showLegend", this.showLegend ? "1" : "0");
      params.set("fillArea", this.fillArea ? "1" : "0");
      this.imageUrl = `${globalThis.location.origin}/?${params.toString()}`;
    },
    copyUrl() {
      this.withSpan(
        { op: "ui.click", name: "Copy URL" },
        () => {
          if (!this.imageUrl) {
            this.copyStatus = "No URL to copy yet.";
            return;
          }
          navigator.clipboard.writeText(this.imageUrl).catch((error) => {
            this.copyStatus = "Copy failed. Please select and copy manually.";
            if (globalThis.Sentry) {
              globalThis.Sentry.captureException(error);
            }
          });
          this.copyStatus = "Copied!";
          clearTimeout(this._copyTimer);
          this._copyTimer = setTimeout(() => {
            this.copyStatus = "";
          }, 2000);
        },
      );
    },
    downloadPng() {
      this.withSpan(
        { op: "ui.click", name: "Download PNG" },
        () => {
          if (!this.imageUrl) {
            return;
          }
          const link = document.createElement("a");
          link.href = this.imageUrl;
          link.download = "chart.png";
          document.body.appendChild(link);
          link.click();
          link.remove();
        },
      );
    },
    randomize() {
      this.withSpan(
        { op: "ui.click", name: "Shuffle data" },
        () => {
          const values = this.parseNumbers(this.valuesText).map(() => {
            return Math.floor(Math.random() * 20) + 2;
          });
          this.valuesText = values.join(", ");
          this.buildChart();
        },
      );
    },
  }));
});

htmx.on("htmx:afterSwap", (event) => {
  if (event.target && globalThis.Alpine) {
    Alpine.initTree(event.target);
  }
});
