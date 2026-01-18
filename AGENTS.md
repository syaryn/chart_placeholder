# Repository Guidelines

## Project Structure & Module Organization

- `main.ts` hosts the Hono app, HTML rendering, and SVG placeholder generation.
- `static/` contains browser assets (`app.js`, `favicon.svg`) served via
  `/static/*`.
- `main_test.ts` includes Deno unit tests for HTTP endpoints.
- `tests/` holds Playwright end-to-end specs (`*.spec.ts`).
- `playwright.config.ts`, `deno.json`, and `mise.toml` define test and task
  configuration.

## Build, Test, and Development Commands

- `mise run dev`: start the dev server (wraps `deno task dev` with file
  watching).
- `deno task dev`: run `deno serve --watch --allow-net --allow-read main.ts`.
- `mise run test`: run Deno tests (`deno test --allow-net --allow-read`).
- `mise run e2e`: run Playwright against the UI and image endpoint
  (`npx playwright test`).
- `mise run lint` / `mise run fmt`: lint and format with Deno tooling.

## Coding Style & Naming Conventions

- Use Deno formatting and linting; run `deno fmt` and `deno lint` before
  changes.
- Stick to the existing 2-space indentation and TypeScript style.
- Playwright tests should be named `*.spec.ts` in `tests/`.

## Testing Guidelines

- Unit tests use `Deno.test` in `main_test.ts`.
- End-to-end tests use Playwright in `tests/` and expect the server at
  `http://127.0.0.1:8000`.
- If you add routes or UI flows, update both unit and e2e coverage as needed.

## Commit & Pull Request Guidelines

- There is no established commit message convention yet; use short, imperative
  summaries (e.g., "Add donut chart defaults") and include rationale in the body
  if needed.
- PRs should include a clear description, steps to test, and screenshots for UI
  changes. Link related issues when available.

## Security & Configuration Tips

- Server-side image generation uses SVG output and requires `--allow-net` and
  `--allow-read`.
- Ensure Node is installed and `npm install` has been run for Playwright tests.
