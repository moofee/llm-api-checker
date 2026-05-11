const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');
const { Validator, getProviderConfig } = require('./src/validator');

const PORT = process.env.PORT || 3200;

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// 解析 JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// API 路由处理
async function handleApi(req, res, pathname) {
  try {
    const body = await parseBody(req);
    let baseUrl = body.baseUrl;
    let apiKey = body.apiKey;

    // If a provider preset is specified, supplement missing info from saved config
    if (body.provider) {
      const config = getProviderConfig(body.provider);
      if (!config) {
        return sendJson(res, 400, { 
          success: false, 
          message: `No saved config found for provider: ${body.provider}` 
        });
      }
      // Use saved values where not manually provided
      if (!baseUrl) baseUrl = config.baseUrl;
      if (!apiKey) apiKey = config.apiKey;
    }

    if (!baseUrl || !apiKey) {
      return sendJson(res, 400, { 
        success: false, 
        message: 'Please provide baseUrl and apiKey, or select a provider preset' 
      });
    }

    const validator = new Validator(baseUrl, apiKey);

    switch (pathname) {
      case '/api/validate':
        const validateResult = await validator.validateKey();
        sendJson(res, 200, validateResult);
        break;

      case '/api/models':
        const modelsResult = await validator.getModels();
        sendJson(res, 200, modelsResult);
        break;

      case '/api/test':
        // 如果没有指定模型，先获取可用模型列表，使用第一个模型测试
        let testModel = body.model;
        if (!testModel) {
          const modelsResult = await validator.getModels();
          if (modelsResult.success && modelsResult.models && modelsResult.models.length > 0) {
            testModel = modelsResult.models[0].id;
          } else {
            // 如果获取模型失败，使用默认模型
            testModel = 'gpt-3.5-turbo';
          }
        }
        const testResult = await validator.testResponse(testModel);
        // 添加使用的模型信息到返回结果
        testResult.model = testModel;
        sendJson(res, 200, testResult);
        break;

      case '/api/quota':
        const quotaResult = await validator.getQuota();
        sendJson(res, 200, quotaResult);
        break;

      case '/api/full':
        const fullResult = await validator.fullCheck(body.model);
        sendJson(res, 200, fullResult);
        break;

      default:
        sendJson(res, 404, { success: false, message: 'API not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    sendJson(res, 500, { success: false, message: error.message });
  }
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 处理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 路由
  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  // 静态文件服务
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, 'public', filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  const serverUrl = `http://localhost:${PORT}`;
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           LLM API Checker - Web Interface                ║
╠══════════════════════════════════════════════════════════╣
║  🌐 Web:  ${serverUrl}                          ║
║  📡 API: ${serverUrl}/api/...                   ║
╠══════════════════════════════════════════════════════════╣
║  API Endpoints:                                          ║
║    POST /api/validate  - Validate API Key                ║
║    POST /api/models    - List Models                     ║
║    POST /api/test      - Test Response                   ║
║    POST /api/quota     - Query Quota                     ║
║    POST /api/full      - Full Check                      ║
╚══════════════════════════════════════════════════════════╝
`);

  // 自动打开浏览器
  openBrowser(serverUrl);
});

// 跨平台打开浏览器
function openBrowser(url) {
  let command;
  const platform = process.platform;

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.log(`Open your browser: ${url}`);
    }
  });
}
