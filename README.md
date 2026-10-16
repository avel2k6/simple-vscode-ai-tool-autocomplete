# Simple VS Code AI Tool Autocomplete

A lightweight VS Code extension that generates **inline code completions** using any **OpenAI-compatible** chat API. It sends the surrounding context of your current caret position to a `POST /chat/completions` endpoint and inserts the model's response right at the caret — so you can quickly fill in the next piece of code in the context of your file.

Works with self-hosted servers, reverse proxies, or any hosted endpoint that speaks the OpenAI chat-completions format.

## Features

- **Bring your own API.** Point `baseUrl` at any OpenAI-compatible `/chat/completions` endpoint.
- **Context-aware.** Sends the text above and below the caret so the model can produce a relevant completion.
- **Optional auth.** Send an `Authorization: Bearer …` header via `apiKey`; leave it empty for unauthenticated endpoints.
- **Clean output.** Strips Markdown code fences (```` ``` ````) from the response so only clean code is inserted.
- **Fully configurable.** Model, base URL, API key, and temperature are all user settings.
- **One-key trigger.** `Alt+/` while a text editor is focused, or the Command Palette.

## How it works

1. With a text editor focused, trigger the command (`Alt+/`, or **Hello World** in the Command Palette).
2. The extension reads the active editor and splits the document at the current caret:
   - everything **above** the caret, and
   - everything **from the caret to the end of the file**.
3. It builds a prompt of the form:

   ```
   **{text above caret}<autocomplte_text_goes_here>{text below caret}**
   ```

   The `<autocomplte_text_goes_here>` token marks the exact spot where the completion belongs; the surrounding text is included purely as context.
4. The prompt is sent as a chat-completion request to `{baseUrl}/chat/completions/`.
5. A system prompt instructs the model to return **only** the code that belongs at that token — no explanations and no Markdown wrapping.
6. Any Markdown code fence in the response is stripped, and the resulting text is **inserted at the caret** (replacing whatever is currently selected).

> The surrounding context is sent for grounding, but only the snippet returned by the model is written into your document.

## Requirements

- **VS Code** `^1.140.0` or newer.
- An **OpenAI-compatible** chat-completions endpoint (`POST {baseUrl}/chat/completions/`) reachable from your machine.

## Installation

### From source

```bash
git clone https://github.com/avel2k6/simple-vscode-ai-tool-autocomplete.git
cd simple-vscode-ai-tool-autocomplete
npm install
```

Open the project folder in VS Code and press **F5** (the **Run Extension** launch config). This compiles the extension and opens a new *Extension Development Host* window with it loaded.

### Package a `.vsix`

```bash
npm run package
npx @vscode/vsce package
```

This produces `simple-vscode-ai-tool-autocomplete-<version>.vsix`, which you can install via:

- **Extensions: Install from VSIX…** in the Command Palette, or
- `code --install-extension ./simple-vscode-ai-tool-autocomplete-<version>.vsix`

## Configuration

Open Settings (`Ctrl+,`) and search for **AI Autocomplete**, or edit `settings.json` directly:

| Setting | Type | Default | Description |
| ------- | ---- | ------- | ----------- |
| `simple-vscode-ai-tool-autocomplete.baseUrl` | `string` | `""` | Base URL of an OpenAI-compatible API. The request is sent to `{baseUrl}/chat/completions/`. |
| `simple-vscode-ai-tool-autocomplete.model` | `string` | `""` | Model name to send in the request body. |
| `simple-vscode-ai-tool-autocomplete.apiKey` | `string` | `""` | API key, sent as `Authorization: Bearer <key>`. Leave empty for endpoints that don't require auth. |
| `simple-vscode-ai-tool-autocomplete.temperature` | `number` | `0.2` | Sampling temperature for the completion. |
| `simple-vscode-ai-tool-autocomplete.timeout` | `number` | `30000` | Request timeout in milliseconds for the API call. |

Minimal example:

```jsonc
{
  "simple-vscode-ai-tool-autocomplete.baseUrl": "http://localhost:8080",
  "simple-vscode-ai-tool-autocomplete.model": "your-model-name",
  "simple-vscode-ai-tool-autocomplete.apiKey": "sk-...",
  "simple-vscode-ai-tool-autocomplete.temperature": 0.2
}
```

## Usage

1. Place the caret where you want the completion to appear.
2. Press `Alt+/` (with a text editor focused), or open the Command Palette (`Ctrl+Shift+P`) and run **Hello World**.
3. Wait for the request to finish — the generated code is inserted at the caret, replacing any current selection.

> The command is still registered under the scaffold name `helloWorld` / title **Hello World** (a leftover from the extension template). This is cosmetic only — it performs the AI completion described above.

## Project structure

```
.
├── src/
│   ├── extension.ts          # Extension entry point: command registration, API request, and insertion logic
│   ├── sanitize.ts           # Strips Markdown code fences from the model response
│   └── test/
│       ├── extension.test.ts # Placeholder sample test from the scaffold
│       └── sanitize.test.ts  # Unit tests for sanitize.ts
├── dist/                     # Webpack output (built bundle: extension.js)
├── out/                      # Compiled test output (tsc)
├── .vscode/                  # Run/test tasks and recommended extensions
├── .vscode-test.mjs          # @vscode/test-cli configuration
├── webpack.config.js         # Webpack build for the extension
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
└── package.json              # Extension manifest
```

## Development

### Prerequisites

- **Node.js** and **npm**
- The recommended extensions listed in `.vscode/extensions.json` give a smoother dev experience: `dbaeumer.vscode-eslint`, `amodio.tsl-problem-matcher`, and `ms-vscode.extension-test-runner`.

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run compile` | Build the extension bundle once (dev mode). |
| `npm run watch` | Rebuild the extension bundle on change. |
| `npm run package` | Build a production bundle (minified, hidden source maps). |
| `npm run compile-tests` | Compile the tests to `out/` with `tsc`. |
| `npm run watch-tests` | Compile the tests on change. |
| `npm run lint` | Run ESLint over the project. |
| `npm test` | Compile tests + build + lint, then run tests in a VS Code test host. |
| `npm run vscode:prepublish` | Runs `npm run package` before publishing. |

### Running and debugging

- Press **F5** (the **Run Extension** launch configuration) to build and open an Extension Development Host window with the extension loaded.
- Set breakpoints in `src/extension.ts` and debug from that window; logs appear in the Debug Console.

### Running tests

- `npm test` builds everything and runs the suite inside a VS Code test host via `@vscode/test-cli` (configured in `.vscode-test.mjs` to pick up `out/test/**/*.test.js`).
- Alternatively, use the **Testing** view with the recommended *Extension Test Runner* extension — run the `tasks: watch-tests` task first so newly added tests are picked up.
- Tests live in `src/test/**/*.test.ts`. `src/test/sanitize.test.ts` holds the real unit tests; `src/test/extension.test.ts` is a placeholder from the scaffold.

## License

No license is currently specified for this repository.
