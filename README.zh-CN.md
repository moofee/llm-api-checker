# LLM API Checker

验证大模型 API 和 Key 可用性的工具，支持 CLI 和 Web 两种使用方式。

## 功能特性

- ✅ **Key 有效性验证** - 验证 API Key 是否有效、能否正常调用
- 📋 **可用模型列表** - 获取并列出该 Key 可用的模型列表
- 🚀 **响应测试** - 发送简单请求，测试响应速度和结果
- 💰 **余额/配额查询** - 检查账户余额或配额信息

## 支持的 API 提供商

支持所有 OpenAI 兼容格式的 API：

| 提供商 | Base URL |
|--------|----------|
| OpenAI | `https://api.openai.com/v1` |
| 阿里云 DashScope (通义千问) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 智谱 AI (GLM) | `https://open.bigmodel.cn/api/coding/paas/v4` |
| 火山方舟 (豆包) | `https://ark.cn-beijing.volces.com/api/coding/v3` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Moonshot (Kimi) | `https://api.moonshot.cn/v1` |
| 硅基流动 (SiliconFlow) | `https://api.siliconflow.cn/v1` |

> 任何实现了 OpenAI Chat Completions API 格式的服务均可直接使用。

## 安装

```bash
git clone <repo-url> llm-api-checker
cd llm-api-checker
npm install
```

> **注意：** 本项目**零外部依赖**，仅使用 Node.js 内置模块。

## 使用方式

### CLI 命令行

```bash
# 验证自定义 API
node cli.js --url https://api.openai.com/v1 --key sk-xxx

# 完整验证（包括响应测试和配额查询）
node cli.js --url https://api.openai.com/v1 --key sk-xxx --full

# 测试特定模型
node cli.js --url https://api.openai.com/v1 --key sk-xxx --model gpt-4o --full

# 查看帮助
node cli.js --help
```

#### CLI 参数

| 参数 | 缩写 | 说明 |
|------|------|------|
| `--url <url>` | `-u` | API 基础 URL（如 `https://api.openai.com/v1`） |
| `--key <key>` | `-k` | API Key |
| `--model <model>` | `-m` | 响应测试使用的模型名称（留空则自动选择） |
| `--full` | `-f` | 执行完整验证：Key 验证、模型列表、响应测试、配额查询 |
| `--help` | `-h` | 显示帮助信息 |

### Web 界面

```bash
# 启动 Web 服务器（自动打开浏览器）
npm start

# 或直接运行
node server.js
```

然后在浏览器中打开 **http://localhost:3200**

Web 界面功能：
- 从预配置的提供商中选择，或输入自定义端点
- 一键运行单项检查或完整验证
- 浏览和搜索可用模型列表
- 查看检查历史记录（存储在 `localStorage` 中）

### REST API

Web 服务器同时提供 REST API 端点：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/validate` | POST | 验证 Key 有效性 |
| `/api/models` | POST | 获取模型列表 |
| `/api/test` | POST | 测试响应 |
| `/api/quota` | POST | 查询配额 |
| `/api/full` | POST | 完整验证 |

**请求体格式：**

```json
{
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "model": "gpt-3.5-turbo"
}
```

## 工作原理

对于支持标准 `/models` 接口的端点，工具直接获取模型列表。对于不提供 `/models` 的服务商（如某些 Coding Plan 端点），工具会通过 chat completion 请求逐一探测常见模型名称，以发现可用的模型。

Key 验证首先尝试 `GET /models`，如果返回 `404` 或 `405`，则通过一系列常见模型名称发送最小化的 `POST /chat/completions` 请求，直到找到一个可用的模型。

## 项目结构

```
llm-api-checker/
├── cli.js                  # CLI 入口
├── server.js               # Web 服务器入口
├── src/
│   ├── validator.js        # 核心验证逻辑
│   └── providers/
│       ├── base.js         # 提供商基类
│       ├── openai.js       # OpenAI 兼容提供商
│       └── index.js        # 提供商注册
├── public/
│   ├── index.html          # Web 界面
│   ├── style.css           # 样式
│   └── app.js              # 前端逻辑
├── package.json
└── README.md
```

## License

[MIT](LICENSE)
