# LLM API Checker

A tool for validating LLM API keys and checking endpoint availability. Supports both CLI and Web UI.

## Features

- **Key Validation** — Verify whether an API key is valid and can make successful calls
- **Model Listing** — Retrieve and display all models available under a given key
- **Response Testing** — Send a lightweight request and measure latency and output
- **Quota / Balance Query** — Check account balance or usage quota (where supported)

## Supported Providers

Works with any OpenAI-compatible API endpoint:

| Provider | Base URL |
|----------|----------|
| OpenAI | `https://api.openai.com/v1` |
| Alibaba Cloud DashScope (Qwen) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Zhipu AI (GLM) | `https://open.bigmodel.cn/api/coding/paas/v4` |
| Volcengine Ark (Doubao) | `https://ark.cn-beijing.volces.com/api/coding/v3` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Moonshot (Kimi) | `https://api.moonshot.cn/v1` |
| SiliconFlow | `https://api.siliconflow.cn/v1` |

> Any other service that implements the OpenAI chat completions API format should work out of the box.

## Installation

```bash
git clone <repo-url> llm-api-checker
cd llm-api-checker
npm install
```

> **Note:** This project has **zero external dependencies** — it uses only Node.js built-in modules.

## Usage

### CLI

```bash
# Validate a custom API endpoint
node cli.js --url https://api.openai.com/v1 --key sk-xxx

# Full validation (key check + model list + response test + quota query)
node cli.js --url https://api.openai.com/v1 --key sk-xxx --full

# Test a specific model
node cli.js --url https://api.openai.com/v1 --key sk-xxx --model gpt-4o --full

# Show help
node cli.js --help
```

#### CLI Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--url <url>` | `-u` | API base URL (e.g. `https://api.openai.com/v1`) |
| `--key <key>` | `-k` | API key |
| `--model <model>` | `-m` | Model name to use for response testing (auto-selected if omitted) |
| `--full` | `-f` | Run all checks: key validation, model listing, response test, and quota query |
| `--help` | `-h` | Show help message |

### Web UI

```bash
# Start the web server (opens browser automatically)
npm start

# Or run directly
node server.js
```

Then open **http://localhost:3200** in your browser.

The web interface lets you:
- Select from pre-configured providers or enter a custom endpoint
- Run individual checks or a full validation with one click
- Browse and search available models
- View check history (stored in `localStorage`)

### REST API

The web server also exposes REST endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/validate` | POST | Validate API key |
| `/api/models` | POST | List available models |
| `/api/test` | POST | Test a chat completion request |
| `/api/quota` | POST | Query account balance / quota |
| `/api/full` | POST | Run all checks |

**Request body** (manual credentials):

```json
{
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "model": "gpt-3.5-turbo"
}
```

## How It Works

For endpoints that support the standard `/models` API, the tool fetches the model list directly. For providers that don't expose `/models` (e.g. certain coding plan endpoints), it falls back to probing well-known model names via chat completion requests to discover which models are available.

Key validation attempts `GET /models` first. If that returns `404` or `405`, it tries a minimal `POST /chat/completions` request with a series of common model names until one succeeds.

## Project Structure

```
llm-api-checker/
├── cli.js                  # CLI entry point
├── server.js               # Web server entry point
├── src/
│   ├── validator.js        # Core validation orchestrator
│   └── providers/
│       ├── base.js         # Provider base class
│       ├── openai.js       # OpenAI-compatible provider
│       └── index.js        # Provider registry
├── public/
│   ├── index.html          # Web UI
│   ├── style.css           # Styles
│   └── app.js              # Frontend logic
├── package.json
└── README.md
```

## License

[MIT](LICENSE)
