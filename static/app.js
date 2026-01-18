const previewId = "chart-preview";

document.addEventListener("alpine:init", () => {
  Alpine.data("chartBuilder", () => ({
    type: "bar",
    labelsText: "Q1, Q2, Q3, Q4",
    valuesText: "12, 19, 3, 5",
    width: 640,
    height: 360,
    lockAspect: false,
    aspectRatio: 640 / 360,
    aspectPreset: "custom",
    previewHeight: 320,
    fillArea: false,
    imageUrl: "",
    copyStatus: "",
    init() {
      this.aspectRatio = this.width / this.height;
      this.buildChart();
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
    buildChart() {
      const labels = this.parseList(this.labelsText);
      const values = this.parseNumbers(this.valuesText);
      const container = document.getElementById(previewId);

      if (!container) {
        return;
      }

      container.innerHTML = "";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.height = `${this.previewHeight}px`;

      const previewWidth = container.clientWidth || this.width;
      const aspectRatio = this.width > 0 && this.height > 0
        ? this.width / this.height
        : 1;
      let chartWidth = previewWidth;
      let chartHeight = chartWidth / aspectRatio;
      if (chartHeight > this.previewHeight) {
        chartHeight = this.previewHeight;
        chartWidth = chartHeight * aspectRatio;
      }
      const options = {
        width: `${Math.round(chartWidth)}px`,
        height: `${Math.round(chartHeight)}px`,
        chartPadding: 16,
      };

      try {
        if (this.type === "bar") {
          new Chartist.Bar(
            `#${previewId}`,
            { labels, series: [values] },
            options,
          );
        } else if (this.type === "line") {
          new Chartist.Line(
            `#${previewId}`,
            { labels, series: [values] },
            { ...options, showArea: this.fillArea, fullWidth: true },
          );
        } else {
          const donutWidth = Math.max(
            16,
            Math.round(Math.min(previewWidth, this.previewHeight) * 0.12),
          );
          new Chartist.Pie(
            `#${previewId}`,
            { labels, series: values },
            {
              width: options.width,
              height: options.height,
              donut: this.type === "doughnut",
              donutWidth,
              showLabel: true,
            },
          );
        }
      } catch (error) {
        if (globalThis.Sentry) {
          globalThis.Sentry.captureException(error);
        }
      } finally {
        this.updateImageUrl();
      }
    },
    updateImageUrl() {
      const params = new URLSearchParams();
      params.set("type", this.type);
      params.set("labels", this.labelsText);
      params.set("values", this.valuesText);
      params.set("width", String(this.width));
      params.set("height", String(this.height));
      params.set("fillArea", this.fillArea ? "1" : "0");
      this.imageUrl = `${globalThis.location.origin}/?${params.toString()}`;
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
    withSpan(spanConfig, fn) {
      const sentry = globalThis.Sentry;
      if (sentry && typeof sentry.startSpan === "function") {
        return sentry.startSpan(spanConfig, fn);
      }
      return fn();
    },
    copyUrl() {
      this.withSpan({ op: "ui.click", name: "Copy URL" }, () => {
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
      });
    },
    downloadSvg() {
      this.withSpan({ op: "ui.click", name: "Download SVG" }, () => {
        if (!this.imageUrl) {
          return;
        }
        const link = document.createElement("a");
        link.href = this.imageUrl;
        link.download = "chart.svg";
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
    },
    randomize() {
      this.withSpan({ op: "ui.click", name: "Shuffle data" }, () => {
        const values = this.parseNumbers(this.valuesText).map(() => {
          return Math.floor(Math.random() * 20) + 2;
        });
        this.valuesText = values.join(", ");
        this.buildChart();
      });
    },
  }));
});

htmx.on("htmx:afterSwap", (event) => {
  if (event.target && globalThis.Alpine) {
    Alpine.initTree(event.target);
  }
});
