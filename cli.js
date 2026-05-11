#!/usr/bin/env node

const { Validator, getProviderConfig } = require('./src/validator');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    key: null,
    preset: null,
    model: null,
    full: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--url':
      case '-u':
        options.url = args[++i];
        break;
      case '--key':
      case '-k':
        options.key = args[++i];
        break;
      case '--preset':
      case '-p':
        options.preset = args[++i];
        break;
      case '--model':
      case '-m':
        options.model = args[++i];
        break;
      case '--full':
      case '-f':
        options.full = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

// 显示帮助
function showHelp() {
  console.log(`
LLM API Checker - Validate LLM API keys and check endpoint availability

Usage:
  node cli.js [options]

Options:
  -u, --url <url>       API base URL (e.g. https://api.openai.com/v1)
  -k, --key <key>       API Key
  -p, --preset <name>   Use a saved provider config (e.g. alibaba-cn, deepseek)
  -m, --model <model>   Model name for response testing (default: auto-select first available)
  -f, --full            Run all checks (key validation + model list + response test + quota)
  -h, --help            Show this help message

Examples:
  # Validate a custom API endpoint
  node cli.js --url https://api.openai.com/v1 --key sk-xxx --full

  # Validate using a saved provider preset
  node cli.js --preset alibaba-cn --full

  # Key validation only
  node cli.js --url https://dashscope.aliyuncs.com/compatible-mode/v1 --key sk-xxx

  # Test a specific model
  node cli.js --preset alibaba-cn --model qwen-turbo --full
`);
}

// 主函数
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  let baseUrl, apiKey;

  // Load from saved provider config
  if (options.preset) {
    const config = getProviderConfig(options.preset);
    if (!config) {
      console.error(`❌ No saved config found for provider: ${options.preset}`);
      console.log('Available presets depend on your local config file.');
      process.exit(1);
    }
    baseUrl = config.baseUrl;
    apiKey = config.apiKey;
    console.log(`📌 Using provider preset: ${options.preset}`);
  } else if (options.url && options.key) {
    baseUrl = options.url;
    apiKey = options.key;
  } else {
    console.error('❌ Please provide --url and --key, or use --preset to select a saved provider');
    console.log('Run --help for usage instructions');
    process.exit(1);
  }

  console.log(`\n🔗 API URL: ${baseUrl}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const validator = new Validator(baseUrl, apiKey);

  if (options.full) {
    // Full validation
    const results = await validator.fullCheck(options.model);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Overall: ${results.overall === 'passed' ? '✅ Passed' : results.overall === 'partial' ? '⚠️ Partial' : '❌ Failed'}`);
  } else {
    // Key validation only
    const result = await validator.validateKey();
    console.log(result.valid ? '✅ Valid' : '❌ Invalid');
    console.log(`   ${result.message}`);
  }

  console.log('');
}

main().catch(console.error);
