# errorlens

Paste a screenshot of an error and get a plain-language explanation, ranked likely causes, and concrete fix steps. A vision model reads the image for you.

## What it does

- Paste with `Ctrl+V`, drop an image anywhere on the page, or upload a file. Large screenshots are scaled down in the browser before they are sent.
- Works on terminal output, browser consoles, IDE problems and build logs.
- Returns a structured report: the exact error, the stack involved, a plain explanation, likely causes with likelihoods, fix steps with copyable code, and ready-made search queries.
- The model also returns where the error sits in the image, and the screenshot gets a pulsing outline around it.
- Optional context ("what were you doing?") improves the answer.
- Your last six results are kept on this device (small thumbnails in localStorage, never uploaded) so you can reopen them.

## Models

- **Demo**: a prepared example with a generated sample screenshot, no key and no network calls.
- **Anthropic or OpenAI**: bring your own key. The key and the screenshot go straight from your browser to the provider; there is no server in between and nothing is stored.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm test` runs the report parsing, image sizing and request encoding tests
- `npm run build` creates a production build

## License

MIT
