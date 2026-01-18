# Chart Placeholder

Chart Placeholder is a lightweight web app that generates placeholder chart
images. Configure chart parameters in the browser and get a shareable image URL
for mockups, product docs, dashboards, and UI prototyping.

## Getting Started

These instructions help you run the app locally for development and testing. See
Deployment for production notes.

### Prerequisites

- Deno (recommended via mise)
- Node.js (for Playwright tests)

```sh
# Install Deno + Node via mise
mise install deno@latest
mise install node@lts
```

### Installing

```sh
# Clone the repository (use your preferred git URL)
git clone https://github.com/syaryn/chart_placeholder.git
cd chart_placeholder

# Install Playwright test runner
npm install

# Install Deno dependencies
deno install --entrypoint main.ts
```

```sh
# Start the dev server
mise run dev
```

Open in browser: `http://localhost:8000/`

Example placeholder image URL:
`http://localhost:8000/?title=Demo&labels=A,B,C&values=5,9,12&type=bar&width=640&height=360`

## Running the tests

Use the tasks below to run automated checks.

### End-to-end tests

Runs Playwright against the UI and the image URL endpoint.

```sh
mise run e2e
```

### Lint and format

Checks code quality and formatting.

```sh
mise run lint
mise run fmt
```

## Deployment

- Use `deno serve --allow-net --allow-read main.ts` in production.
- Server-side image generation outputs SVG and works on Deno Deploy.

## Built With

- [Deno](https://deno.com/) - Runtime and tooling
- [Hono](https://hono.dev/) - Web framework
- [Chartist.js](https://chartist-js.github.io/) - SVG chart rendering
- [Pico CSS](https://picocss.com/) - Minimal CSS framework
- [HTMX](https://htmx.org/) - HTML-driven interactions
- [Alpine.js](https://alpinejs.dev/) - Lightweight UI state
- [Playwright](https://playwright.dev/) - End-to-end testing

## Versioning

Use SemVer for releases. Tag releases in your repository.

## License

MIT

## Acknowledgments

- Chartist.js and the community around it.
- Pico CSS and its minimal default styles.
