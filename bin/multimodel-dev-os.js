#!/usr/bin/env node

/**
 * multimodel-dev-os CLI
 * Dependency-free local initialization, diagnostics, and validation utility.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sourceRoot = resolve(__dirname, '..');

let version = '0.5.1';
try {
  const pkgData = JSON.parse(readFileSync(resolve(sourceRoot, 'package.json'), 'utf8'));
  version = pkgData.version;
} catch (e) {}

const ARGS = process.argv.slice(2);

// Parse parameters manually to avoid external dependencies
function parseArgs(args) {
  const params = {
    command: null,
    target: process.cwd(),
    template: 'general-app',
    adapters: [],
    caveman: false,
    dryRun: false,
    force: false,
    help: false,
    tokens: false,
    modelPreset: null,
    agent: null,
    stack: null,
    mobile: null,
    aiApp: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' || arg === '-t') {
      params.target = resolve(args[++i]);
    } else if (arg === '--template') {
      params.template = args[++i];
    } else if (arg === '--adapter' || arg === '-a') {
      params.adapters.push(args[++i]);
    } else if (arg === '--caveman') {
      params.caveman = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      params.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      params.force = true;
    } else if (arg === '--help' || arg === '-h') {
      params.help = true;
    } else if (arg === '--tokens') {
      params.tokens = true;
    } else if (arg === '--model-preset') {
      params.modelPreset = args[++i];
    } else if (arg === '--agent') {
      params.agent = args[++i];
    } else if (arg === '--stack') {
      params.stack = args[++i];
    } else if (arg === '--mobile') {
      params.mobile = args[++i];
    } else if (arg === '--ai-app') {
      params.aiApp = args[++i];
    } else if (!params.command && !arg.startsWith('-')) {
      params.command = arg;
    }
  }
  return params;
}

const params = parseArgs(ARGS);
const COMMAND = params.command;

const TEMPLATES = {
  // --- A. Web / Frontend ---
  'nextjs-saas': {
    name: 'nextjs-saas',
    description: 'Next.js App Router starter with TypeScript, Prisma database, Tailwind CSS, and Stripe subscription setup.',
    stack: 'Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma ORM, Stripe payments',
    skill: 'nextjs-action-build.md',
    skillDesc: 'React Server Actions secure implementation conventions.'
  },
  'nextjs-dashboard': {
    name: 'nextjs-dashboard',
    description: 'Production-ready dashboard with chart widgets, tables, search, and dynamic routing components.',
    stack: 'Next.js 14, Tailwind CSS, Recharts, TypeScript',
    skill: 'dashboard-chart.md',
    skillDesc: 'Dynamic client-side chart hydration and loading states.'
  },
  'nextjs-ecommerce': {
    name: 'nextjs-ecommerce',
    description: 'Headless storefront with local state basket management and Stripe Checkout integration.',
    stack: 'Next.js, Tailwind, Stripe API',
    skill: 'checkout-session.md',
    skillDesc: 'Centralized storefront checkout redirect routines.'
  },
  'react-spa': {
    name: 'react-spa',
    description: 'Standard single-page React app bundled with Vite and React Router.',
    stack: 'React, React Router, Vite, CSS Modules',
    skill: 'spa-router.md',
    skillDesc: 'Client-side fallback routing and lazy-loading components.'
  },
  'vite-react': {
    name: 'vite-react',
    description: 'Clean React + TypeScript skeleton with asset optimization scripts.',
    stack: 'Vite, React 18, TypeScript, Tailwind CSS',
    skill: 'vite-asset.md',
    skillDesc: 'Dynamic asset preloading and static chunking.'
  },
  'astro-content-site': {
    name: 'astro-content-site',
    description: 'Astro content site optimized for 100/100 Lighthouse performance and Core Web Vitals.',
    stack: 'Astro, HTML5, structured JSON-LD SEO markup',
    skill: 'astro-seo.md',
    skillDesc: 'Structured schema injection and responsive image generation.'
  },
  'vue-nuxt-app': {
    name: 'vue-nuxt-app',
    description: 'Nuxt.js SSR application with pinia state management.',
    stack: 'Nuxt 3, Vue 3, Pinia, Tailwind CSS',
    skill: 'nuxt-ssr.md',
    skillDesc: 'Server-side state hydration and API integration.'
  },
  'sveltekit-app': {
    name: 'sveltekit-app',
    description: 'SvelteKit application skeleton with built-in routing.',
    stack: 'SvelteKit, Svelte, Vite',
    skill: 'svelte-routing.md',
    skillDesc: 'Directory-based routing and load function integration.'
  },

  // --- B. Backend / API ---
  'node-express-api': {
    name: 'node-express-api',
    description: 'Express.js backend with JSON Web Tokens, Joi schema validation, and SQL logger hooks.',
    stack: 'Node.js, Express, JWT, Joi, Winston logger',
    skill: 'express-auth.md',
    skillDesc: 'Secure middleware filters and authorization token parsing.'
  },
  'nestjs-api': {
    name: 'nestjs-api',
    description: 'Modular NestJS backend with Swagger documentation and PostgreSQL repository.',
    stack: 'NestJS, TypeORM, PostgreSQL, Swagger',
    skill: 'nestjs-controller.md',
    skillDesc: 'DTO validations and guard decorators.'
  },
  'fastapi-python': {
    name: 'fastapi-python',
    description: 'FastAPI application with Pydantic validation, SQLite hooks, and automatic OpenAPI generation.',
    stack: 'FastAPI, Python, Pydantic, SQLAlchemy',
    skill: 'fastapi-route.md',
    skillDesc: 'Async route handlers and query dependency injection.'
  },
  'django-api': {
    name: 'django-api',
    description: 'Django REST Framework starter with model serializing and standard authentication.',
    stack: 'Django, Python, DRF, SQLite',
    skill: 'django-serialize.md',
    skillDesc: 'Model serializer mappings and security filters.'
  },
  'laravel-api': {
    name: 'laravel-api',
    description: 'Laravel API backend with Eloquent models and Sanctum auth token management.',
    stack: 'Laravel, PHP, Eloquent, Sanctum',
    skill: 'laravel-route.md',
    skillDesc: 'Controller resource routes and validation requests.'
  },
  'go-api': {
    name: 'go-api',
    description: 'Go REST API boilerplate with gorilla/mux routing and sqlx connections.',
    stack: 'Go, Gorilla Mux, sqlx, PostgreSQL',
    skill: 'go-handler.md',
    skillDesc: 'JSON body decoding and DB transactions.'
  },
  'dotnet-api': {
    name: 'dotnet-api',
    description: '.NET Core Web API template with Entity Framework Core.',
    stack: 'C#, .NET Core, Entity Framework, SQL Server',
    skill: 'dotnet-controller.md',
    skillDesc: 'API controller mapping and dependency injection.'
  },
  'java-spring-api': {
    name: 'java-spring-api',
    description: 'Spring Boot REST API with JPA hibernate repositories and security controls.',
    stack: 'Java, Spring Boot, Spring Security, Hibernate',
    skill: 'spring-repository.md',
    skillDesc: 'JPA entity mapping and transaction boundaries.'
  },

  // --- C. Mobile ---
  'expo-react-native-android': {
    name: 'expo-react-native-android',
    description: 'Production-ready Expo React Native Android application boilerplate with EAS Build, env profiles, secure store, and API clients.',
    stack: 'Expo, React Native, TypeScript, EAS Build CLI, expo-secure-store',
    skill: 'expo-android-build.md',
    skillDesc: 'Expo EAS Build configurations and environment validation checklists.'
  },
  'expo-react-native-cross-platform': {
    name: 'expo-react-native-cross-platform',
    description: 'Expo starter with Android, iOS, and Web deployment configurations.',
    stack: 'Expo, React Native, React Native Web, TypeScript',
    skill: 'expo-platform.md',
    skillDesc: 'Cross-platform component splitting and styles.'
  },
  'react-native-production-app': {
    name: 'react-native-production-app',
    description: 'Bare React Native workspace setup with native Android folders.',
    stack: 'React Native CLI, TypeScript, Native Modules',
    skill: 'rn-native.md',
    skillDesc: 'Native module bridge configuration.'
  },
  'flutter-app': {
    name: 'flutter-app',
    description: 'Flutter project skeleton with Bloc state management.',
    stack: 'Flutter, Dart, Bloc, Provider',
    skill: 'flutter-bloc.md',
    skillDesc: 'Bloc event mapping and state transitions.'
  },

  // --- D. AI / Agentic Apps ---
  'ai-chat-app': {
    name: 'ai-chat-app',
    description: 'Chat interface with server-sent event (SSE) streaming capabilities.',
    stack: 'Vite, React, EventSource API, Node.js',
    skill: 'chat-stream.md',
    skillDesc: 'SSE chunk decoder and chat history managers.'
  },
  'rag-knowledge-base': {
    name: 'rag-knowledge-base',
    description: 'Document ingestion pipelines, text chunking hooks, and vector DB search scripts.',
    stack: 'Python, LlamaIndex, Qdrant, FastAPI',
    skill: 'rag-embed.md',
    skillDesc: 'Vector embedding generation and semantic retrieval.'
  },
  'ai-agent-workflow': {
    name: 'ai-agent-workflow',
    description: 'Multi-agent state machine orchestration layout with workflow memory.',
    stack: 'LangGraph, Python, SQLite state saver',
    skill: 'agent-state.md',
    skillDesc: 'State machine node definitions and reducer logic.'
  },
  'mcp-server-project': {
    name: 'mcp-server-project',
    description: 'Model Context Protocol server template to register custom tools.',
    stack: 'Node.js, TypeScript, MCP SDK',
    skill: 'mcp-tool.md',
    skillDesc: 'MCP tool schema mapping and request routing.'
  },
  'local-llm-app': {
    name: 'local-llm-app',
    description: 'Local inference app leveraging Ollama or Llama.cpp endpoints.',
    stack: 'HTML, JS, Ollama API, Llama.cpp',
    skill: 'local-inference.md',
    skillDesc: 'Local fetch routing and fallback model mapping.'
  },
  'multimodel-router-app': {
    name: 'multimodel-router-app',
    description: 'Dynamic routing middleware selecting models based on cost and reasoning tiers.',
    stack: 'Node.js, TypeScript, providers YAML registry',
    skill: 'model-route.md',
    skillDesc: 'Dynamic payload forwarding and token counter.'
  },
  'browser-agent-automation': {
    name: 'browser-agent-automation',
    description: 'Puppeteer and Playwright automation scripts for agent interaction testing.',
    stack: 'Node.js, Playwright, Chromium API',
    skill: 'browser-automation.md',
    skillDesc: 'DOM locator verification and screen recording loops.'
  },
  'voice-agent-app': {
    name: 'voice-agent-app',
    description: 'Real-time audio streaming and speech-to-text integration widgets.',
    stack: 'WebSocket, Web Audio API, Gemini Live API',
    skill: 'voice-stream.md',
    skillDesc: 'Audio PCM buffer conversion and WebSocket listeners.'
  },

  // --- E. Business / Growth ---
  'ecommerce-store': {
    name: 'ecommerce-store',
    description: 'PCI-compliant headless e-commerce store with secure checkout loops, card state validations, and Stripe webhooks.',
    stack: 'Headless Store API, cart states, secure payment webhooks, order database triggers',
    skill: 'webhook-handler.md',
    skillDesc: 'Stripe order checkout webhook secure listener verification rules.'
  },
  'wordpress-site': {
    name: 'wordpress-site',
    description: 'WordPress custom block theme and plugin development profile with secure PHP database query rules.',
    stack: 'WordPress Core, PHP, Gutenberg Block APIs, theme customization hooks',
    skill: 'plugin-boilerplate.md',
    skillDesc: 'PHP hook registrations and sanitization gates boilerplate.'
  },
  'seo-landing-page': {
    name: 'seo-landing-page',
    description: 'Ultra-fast static landing page layout optimized for Astro, high Core Web Vitals scores, and JSON-LD schema markup.',
    stack: 'Astro, HTML5, structured JSON-LD SEO markup, asset minification frameworks',
    skill: 'seo-audit.md',
    skillDesc: 'Lighthouse audits optimization guidelines and Core Web Vitals targets.'
  },
  'content-marketing-engine': {
    name: 'content-marketing-engine',
    description: 'Markdown-based blog engine optimized for search visibility.',
    stack: 'Astro, Markdown, Tailwind CSS',
    skill: 'blog-seo.md',
    skillDesc: 'Sitemap dynamic compiler and canonical tag validation.'
  },
  'analytics-dashboard': {
    name: 'analytics-dashboard',
    description: 'Customer analytics tracker interface with visual charts.',
    stack: 'React, Vite, Chart.js',
    skill: 'chart-render.md',
    skillDesc: 'Dynamic data mapping and tooltip events.'
  },
  'crm-lightweight': {
    name: 'crm-lightweight',
    description: 'Sales pipeline tracker interface.',
    stack: 'Next.js, SQLite, Tailwind CSS',
    skill: 'crm-pipeline.md',
    skillDesc: 'Deal stage drag-and-drop state modifications.'
  },
  'customer-support-agent': {
    name: 'customer-support-agent',
    description: 'AI-driven customer support chat widget.',
    stack: 'HTML, Vanilla JS, OpenAI Assistants API',
    skill: 'support-widget.md',
    skillDesc: 'Assistants thread handling and message polling.'
  },

  // --- F. DevOps / Automation ---
  'github-actions-ci': {
    name: 'github-actions-ci',
    description: 'CI/CD workflows for building and testing multi-model applications.',
    stack: 'GitHub Actions, Docker, Node.js environment',
    skill: 'ci-workflow.md',
    skillDesc: 'Workflow triggers and test reporting steps.'
  },
  'dockerized-app': {
    name: 'dockerized-app',
    description: 'Docker Compose setups for multi-container web apps.',
    stack: 'Docker, Docker Compose, Nginx, PostgreSQL',
    skill: 'docker-compose.md',
    skillDesc: 'Environment variables injection and network bridges.'
  },
  'cpanel-deploy-app': {
    name: 'cpanel-deploy-app',
    description: 'FTP/SFTP deployment automation and server checklists.',
    stack: 'Node.js, SFTP Client, FTP Deploy',
    skill: 'cpanel-deploy.md',
    skillDesc: 'Secure file transfer protocols and remote permission audits.'
  },
  'cloudflare-worker': {
    name: 'cloudflare-worker',
    description: 'Cloudflare Worker template for edge API routing.',
    stack: 'Wrangler, Cloudflare Workers, Hono framework',
    skill: 'worker-route.md',
    skillDesc: 'Edge routing handlers and KV storage bindings.'
  },
  'vercel-app': {
    name: 'vercel-app',
    description: 'Serverless deployment config file with serverless functions settings.',
    stack: 'Vercel CLI, vercel.json configuration',
    skill: 'vercel-deploy.md',
    skillDesc: 'Redirect mappings and custom headers.'
  },
  'railway-app': {
    name: 'railway-app',
    description: 'Railway cloud platform deployment configuration template.',
    stack: 'Railway CLI, Railway Config',
    skill: 'railway-deploy.md',
    skillDesc: 'Database binding linkages and start commands.'
  },
  'supabase-app': {
    name: 'supabase-app',
    description: 'Supabase database migrations and edge functions setups.',
    stack: 'Supabase CLI, PostgreSQL, Deno edge functions',
    skill: 'supabase-edge.md',
    skillDesc: 'JWT verification and edge route handlers.'
  },
  'firebase-app': {
    name: 'firebase-app',
    description: 'Firebase hosting configurations and cloud functions.',
    stack: 'Firebase CLI, TypeScript, Cloud Functions',
    skill: 'firebase-function.md',
    skillDesc: 'HTTPS cloud functions triggered routes.'
  },

  // --- G. Data / Analytics ---
  'python-data-pipeline': {
    name: 'python-data-pipeline',
    description: 'Pandas and Polars data ingestion and sanitization pipeline.',
    stack: 'Python, Pandas, Polars, DuckDB',
    skill: 'data-pipeline.md',
    skillDesc: 'CSV parsing and database bulk copy loops.'
  },
  'postgres-app': {
    name: 'postgres-app',
    description: 'Database schema migration scripts and indexing strategies.',
    stack: 'PostgreSQL, SQL, Knex.js migrations',
    skill: 'db-migration.md',
    skillDesc: 'Table definitions and composite index optimization.'
  },
  'vector-db-rag': {
    name: 'vector-db-rag',
    description: 'Vector DB schemas, collections, and custom index settings.',
    stack: 'Pinecone, Qdrant, Milvus SDK',
    skill: 'vector-index.md',
    skillDesc: 'Distance metrics configuration and payload filtering.'
  },
  'warehouse-reporting': {
    name: 'warehouse-reporting',
    description: 'Data warehouse analytical queries and report compilers.',
    stack: 'ClickHouse, SQL, Node.js charts',
    skill: 'db-reporting.md',
    skillDesc: 'Analytical aggregation queries and dashboard bindings.'
  },
  'general-app': {
    name: 'general-app',
    description: 'Baseline generic fallback profile for standard backend systems (Python, Go, Node, Rust) and universal git workflows.',
    stack: 'Universal backends baseline structure, default git flow parameters',
    skill: 'example-skill.md',
    skillDesc: 'Generic baseline instructions and coding standards.'
  }
};

if (params.help || !COMMAND) {
  showHelp();
  process.exit(0);
}

if (COMMAND === 'init') {
  if (params.mobile === 'android') {
    params.template = 'expo-react-native-android';
  } else if (params.aiApp === 'rag') {
    params.template = 'rag-knowledge-base';
  }
  handleInit(params);
} else if (COMMAND === 'verify') {
  handleVerify(params);
} else if (COMMAND === 'templates' || COMMAND === 'list-templates') {
  handleListTemplates();
} else if (COMMAND === 'show-template') {
  const tName = ARGS[1];
  if (!tName || tName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a template name. Example: node bin/multimodel-dev-os.js show-template nextjs-saas\x1b[0m');
    process.exit(1);
  }
  handleShowTemplate(tName);
} else if (COMMAND === 'doctor') {
  handleDoctor(params);
} else if (COMMAND === 'validate') {
  handleValidate(params);
} else if (COMMAND === 'models') {
  handleListModels();
} else if (COMMAND === 'show-model') {
  const mName = ARGS[1];
  if (!mName || mName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a model name. Example: node bin/multimodel-dev-os.js show-model claude-sonnet-latest\x1b[0m');
    process.exit(1);
  }
  handleShowModel(mName);
} else if (COMMAND === 'providers') {
  handleListProviders();
} else if (COMMAND === 'route-model') {
  const taskName = ARGS[1];
  if (!taskName || taskName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a task. Example: node bin/multimodel-dev-os.js route-model planning\x1b[0m');
    process.exit(1);
  }
  handleRouteModel(taskName);
} else if (COMMAND === 'adapters') {
  handleListAdapters();
} else if (COMMAND === 'show-adapter') {
  const aName = ARGS[1];
  if (!aName || aName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify an adapter name. Example: node bin/multimodel-dev-os.js show-adapter cursor\x1b[0m');
    process.exit(1);
  }
  handleShowAdapter(aName);
} else if (COMMAND === 'skills') {
  handleListSkills(params);
} else if (COMMAND === 'show-skill') {
  const sName = ARGS[1];
  if (!sName || sName.startsWith('-')) {
    console.error('\x1b[31mError: Please specify a skill name. Example: node bin/multimodel-dev-os.js show-skill bug-fix\x1b[0m');
    process.exit(1);
  }
  handleShowSkill(sName, params);
} else {
  console.error(`\x1b[31mUnknown command: ${COMMAND}\x1b[0m`);
  showHelp();
  process.exit(1);
}

function showHelp() {
  console.log(`\n🧠 \x1b[36mmultimodel-dev-os CLI v${version}\x1b[0m`);
  console.log('====================================');
  console.log('Usage: node bin/multimodel-dev-os.js <command> [options]\n');
  console.log('Commands:');
  console.log('  init              Initialize a project with configs and adapters');
  console.log('  verify            Validate structural integrity of an existing project');
  console.log('  templates         List all built-in template profiles with details');
  console.log('  list-templates    Alias for templates command');
  console.log('  show-template <t> Inspect detailed stack specifications of template <t>');
  console.log('  doctor            Advisory checkup of project compatibility loops and ignored folders');
  console.log('  validate          Strict validation checks to verify directory schema compliance');
  console.log('  models            List registered model aliases in the capabilities registry');
  console.log('  show-model <m>    View specifications of model <m> in registry');
  console.log('  providers         List configured AI provider API endpoints');
  console.log('  route-model <tsk> Suggest optimal model mapping for task <tsk>');
  console.log('  adapters          List IDE and terminal tool adapters');
  console.log('  show-adapter <a>  Inspect config specifications of adapter <a>');
  console.log('  skills            List active skills custom prompts in target workspace');
  console.log('  show-skill <s>    View prompt contents of target workspace skill <s>\n');
  console.log('Options:');
  console.log('  -t, --target <path>     Target folder destination (default: current working directory)');
  console.log('  --template <name>       Template profile: nextjs-saas, expo-react-native-android, etc.');
  console.log('  -a, --adapter <name>    Inject specific adapter: cursor, claude, vscode, gemini, etc.');
  console.log('  --caveman               Use minimal-token templates (~79% fewer tokens)');
  console.log('  --tokens                Run a deeper token-sink size analysis during doctor checkup');
  console.log('  -d, --dry-run           Preview planned file actions without modifying the filesystem');
  console.log('  -f, --force             Overwrite existing files without prompting\n');
}

function handleListTemplates() {
  console.log(`\n🧠 \x1b[36mBuilt-in Template Profiles [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(TEMPLATES).forEach(key => {
    const t = TEMPLATES[key];
    console.log(`\n\x1b[32m* ${t.name}\x1b[0m`);
    console.log(`  \x1b[33mStack:\x1b[0m ${t.stack}`);
    console.log(`  \x1b[37mDescription:\x1b[0m ${t.description}`);
  });
  console.log('\nUse \x1b[36mshow-template <template-name>\x1b[0m to view detailed layout specifications.\n');
}

function handleShowTemplate(name) {
  const t = TEMPLATES[name];
  if (!t) {
    console.error(`\n\x1b[31mError: Template '${name}' does not exist. Available: nextjs-saas, wordpress-site, ecommerce-store, seo-landing-page, general-app\x1b[0m\n`);
    process.exit(1);
  }

  console.log(`\n🔍 \x1b[36mTemplate Profile: ${t.name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mStack Blueprint:\x1b[0m ${t.stack}`);
  console.log(`\x1b[33mOverview:\x1b[0m ${t.description}`);
  console.log(`\x1b[33mHighlighted Skill:\x1b[0m .ai/skills/${t.skill}`);
  console.log(`  └─> ${t.skillDesc}`);
  console.log('\n\x1b[33mScaffolding Directory Layout:\x1b[0m');
  console.log('  ├── AGENTS.md                   (Stack building conventions)');
  console.log('  ├── MEMORY.md                   (Architectural constraints record)');
  console.log('  ├── TASKS.md                    (Pre-populated first project tasks)');
  console.log('  ├── RUNBOOK.md                  (Default operations guide)');
  console.log('  └── .ai/');
  console.log('      ├── config.yaml             (Enabled adapter options)');
  console.log('      ├── context/');
  console.log('      │   ├── project-brief.md    (Scaffolding baseline brief)');
  console.log('      │   ├── architecture.md     (Stack specific architecture map)');
  console.log('      │   ├── model-map.md        (AI routing specifications)');
  console.log('      │   └── context-budget.md   (Token allocation guidelines)');
  console.log(`      └── skills/`);
  console.log(`          └── ${t.skill}     (Custom template skills code boiler)`);
  console.log('\nUse \x1b[32minit --template ' + t.name + '\x1b[0m to bootstrap this profile.\n');
}

function handleInit(options) {
  console.log(`\n\x1b[34mInitializing multimodel-dev-os in: ${options.target}\x1b[0m`);
  console.log(`Template profile: \x1b[32m${options.template}\x1b[0m`);
  if (options.caveman) console.log('Bone variant: \x1b[33mCaveman Mode Active\x1b[0m');
  if (options.dryRun) console.log('\x1b[36mDry Run active - no actual modifications will occur\x1b[0m');

  const operations = [];
  const conflicts = [];

  // Source path mapping for core files
  let templateDir = join(sourceRoot, 'examples', options.template);
  if (!existsSync(templateDir)) {
    console.warn(`  \x1b[33m[WARNING] Template '${options.template}' not found. Falling back to 'general-app' profile.\x1b[0m`);
    templateDir = join(sourceRoot, 'examples', 'general-app');
  }

  let agentsSrc = join(templateDir, 'AGENTS.md');
  let memorySrc = join(templateDir, 'MEMORY.md');
  let tasksSrc = join(templateDir, 'TASKS.md');
  let runbookSrc = join(sourceRoot, 'RUNBOOK.md'); // Global operational runbook fallback
  let configSrc = join(templateDir, '.ai', 'config.yaml');

  // Handle Caveman Mode overrides
  if (options.caveman) {
    agentsSrc = join(sourceRoot, '.ai', 'templates', 'AGENTS.caveman.md');
    memorySrc = join(sourceRoot, '.ai', 'templates', 'MEMORY.caveman.md');
    tasksSrc = join(sourceRoot, '.ai', 'templates', 'TASKS.caveman.md');
    runbookSrc = join(sourceRoot, '.ai', 'templates', 'RUNBOOK.caveman.md');
  }

  operations.push({ dest: 'AGENTS.md', src: agentsSrc });
  operations.push({ dest: 'MEMORY.md', src: memorySrc });
  operations.push({ dest: 'TASKS.md', src: tasksSrc });
  operations.push({ dest: 'RUNBOOK.md', src: runbookSrc });
  operations.push({ dest: '.ai/config.yaml', src: configSrc });

  // Add all files from template-specific context and skills folders if they exist
  const templateAiDir = join(templateDir, '.ai');
  if (existsSync(templateAiDir) && !options.caveman) {
    const subdirs = ['context', 'skills'];
    subdirs.forEach(sub => {
      const subPath = join(templateAiDir, sub);
      if (existsSync(subPath)) {
        readdirSync(subPath).forEach(file => {
          operations.push({
            dest: join('.ai', sub, file),
            src: join(subPath, file)
          });
        });
      }
    });
  }

  // Fallback to copy default global folders if files aren't already included by template
  const globalAiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs'];
  globalAiSubdirs.forEach(sub => {
    const globalPath = join(sourceRoot, '.ai', sub);
    if (existsSync(globalPath)) {
      readdirSync(globalPath).forEach(file => {
        const destRel = join('.ai', sub, file);
        // Only push if not already loaded from the template specific directory overrides
        if (!operations.some(op => op.dest === destRel)) {
          // If --caveman is active, skip regular context/skills to save token files
          if (options.caveman && (sub === 'context' || sub === 'skills' || sub === 'prompts' || sub === 'checks')) {
            return;
          }
          operations.push({
            dest: destRel,
            src: join(globalPath, file)
          });
        }
      });
    }
  });

  // Selected Adapters
  options.adapters.forEach(adapter => {
    const adapterDir = join(sourceRoot, 'adapters', adapter);
    if (existsSync(adapterDir)) {
      const copyRecursive = (currSrc, currRel) => {
        if (statSync(currSrc).isDirectory()) {
          readdirSync(currSrc).forEach(file => {
            copyRecursive(join(currSrc, file), join(currRel, file));
          });
        } else {
          operations.push({
            dest: join('adapters', adapter, currRel),
            src: currSrc
          });
        }
      };
      readdirSync(adapterDir).forEach(file => {
        copyRecursive(join(adapterDir, file), file);
      });
    } else {
      console.warn(`\x1b[33mWarning: Adapter '${adapter}' not found. Skipping.\x1b[0m`);
    }
  });

  // Audit conflicts
  operations.forEach(op => {
    const targetFile = join(options.target, op.dest);
    if (existsSync(targetFile)) {
      if (!options.force) {
        conflicts.push(op.dest);
      }
    }
  });

  if (conflicts.length > 0) {
    console.error('\n\x1b[31m[ABORT] Overwrite Conflict Detected!\x1b[0m');
    console.error('The following files already exist in the target directory:');
    conflicts.forEach(c => console.error(`  - ${c}`));
    console.error('\nRun command with \x1b[33m--force\x1b[0m to overwrite these files.');
    process.exit(1);
  }

  // Execute operations
  operations.forEach(op => {
    const targetFile = join(options.target, op.dest);
    const targetDir = dirname(targetFile);

    if (options.dryRun) {
      console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE:\x1b[0m ${op.dest}`);
    } else {
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      const data = readFileSync(op.src);
      writeFileSync(targetFile, data);
      console.log(`  \x1b[32mCREATE:\x1b[0m ${op.dest}`);
    }
  });

  // Ensure crucial directories exist (e.g. for --caveman or missing folders check compliance)
  const dirsToEnsure = ['.ai/context', '.ai/skills', '.ai/session-logs'];
  dirsToEnsure.forEach(d => {
    const fullPath = join(options.target, d);
    if (!options.dryRun && !existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`  \x1b[32mCREATE DIR:\x1b[0m ${d}`);
    }
  });

  // Copy root-level adapter rule files if selected
  if (!options.dryRun) {
    options.adapters.forEach(adapter => {
      if (adapter === 'cursor') {
        const srcFile = join(sourceRoot, 'adapters/cursor/.cursorrules');
        const destFile = join(options.target, '.cursorrules');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .cursorrules`);
        }
      } else if (adapter === 'claude') {
        const srcFile = join(sourceRoot, 'adapters/claude/CLAUDE.md');
        const destFile = join(options.target, 'CLAUDE.md');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m CLAUDE.md`);
        }
      } else if (adapter === 'vscode') {
        const srcFile = join(sourceRoot, 'adapters/vscode/.vscode/settings.json');
        const destDir = join(options.target, '.vscode');
        const destFile = join(destDir, 'settings.json');
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .vscode/settings.json`);
        }
      } else if (adapter === 'gemini') {
        const srcFile = join(sourceRoot, 'adapters/gemini/GEMINI.md');
        const destFile = join(options.target, 'GEMINI.md');
        if (existsSync(srcFile)) {
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m GEMINI.md`);
        }
      } else if (adapter === 'antigravity') {
        const srcFile = join(sourceRoot, 'adapters/antigravity/.gemini/settings.json');
        const destDir = join(options.target, '.gemini');
        const destFile = join(destDir, 'settings.json');
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destFile, readFileSync(srcFile));
          console.log(`  \x1b[32mCREATE ROOT ADAPTER FILE:\x1b[0m .gemini/settings.json`);
        }
      }
    });

    // Dynamically enable selected adapters in the target .ai/config.yaml
    const targetConfigPath = join(options.target, '.ai/config.yaml');
    if (existsSync(targetConfigPath) && options.adapters.length > 0) {
      let configContent = readFileSync(targetConfigPath, 'utf8');
      options.adapters.forEach(adapter => {
        const regex = new RegExp(`${adapter}:\\s*false`, 'g');
        configContent = configContent.replace(regex, `${adapter}: true`);
      });
      writeFileSync(targetConfigPath, configContent, 'utf8');
      console.log(`  \x1b[32mUPDATE CONFIG:\x1b[0m Enabled selected adapters [${options.adapters.join(', ')}] in .ai/config.yaml`);
    }
  } else {
    // Dry run notes
    options.adapters.forEach(adapter => {
      if (adapter === 'cursor') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .cursorrules`);
      else if (adapter === 'claude') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m CLAUDE.md`);
      else if (adapter === 'vscode') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .vscode/settings.json`);
      else if (adapter === 'gemini') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m GEMINI.md`);
      else if (adapter === 'antigravity') console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE ROOT ADAPTER FILE:\x1b[0m .gemini/settings.json`);
    });
  }

  console.log(`\n\x1b[32m✔ Project initialized successfully! [Total Operations: ${operations.length}]\x1b[0m\n`);
}

function handleVerify(options) {
  console.log(`\n\x1b[34mRunning strict verification in: ${options.target}\x1b[0m\n`);

  let passed = 0;
  let failed = 0;

  const assertFile = (relPath) => {
    const fullPath = join(options.target, relPath);
    if (existsSync(fullPath) && statSync(fullPath).isFile()) {
      console.log(`  \x1b[32m✓\x1b[0m ${relPath}`);
      passed++;
    } else {
      console.error(`  \x1b[31m✗ ${relPath} (missing)\x1b[0m`);
      failed++;
    }
  };

  const rootFiles = ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml'];
  rootFiles.forEach(assertFile);

  const contextFiles = [
    '.ai/context/project-brief.md',
    '.ai/context/architecture.md',
    '.ai/context/business-rules.md',
    '.ai/context/seo-rules.md',
    '.ai/context/deployment-rules.md',
    '.ai/context/model-map.md',
    '.ai/context/context-budget.md'
  ];
  contextFiles.forEach(assertFile);

  const agentFiles = [
    '.ai/agents/multimodel-orchestrator.md',
    '.ai/agents/planner.md',
    '.ai/agents/coder.md',
    '.ai/agents/reviewer.md',
    '.ai/agents/qa-tester.md',
    '.ai/agents/security-auditor.md',
    '.ai/agents/seo-auditor.md',
    '.ai/agents/devops.md'
  ];
  agentFiles.forEach(assertFile);

  console.log('\n=====================================');
  if (failed > 0) {
    console.error(`  \x1b[31mVerification FAILED. [Passed: ${passed}, Failed: ${failed}]\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`  \x1b[32mVerification PASSED. [All ${passed} files present]\x1b[0m\n`);
    process.exit(0);
  }
}

function handleDoctor(options) {
  if (options.tokens) {
    handleDoctorTokens(options);
    return;
  }
  console.log(`\n🩺 \x1b[36mRunning advisory doctor checkup in: ${options.target}\x1b[0m\n`);

  let warnings = 0;

  const warn = (msg) => {
    console.warn(`  \x1b[33m[WARNING]\x1b[0m ${msg}`);
    warnings++;
  };

  // 1. .gitignore checks
  const gitignorePath = join(options.target, '.gitignore');
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf8');
    if (!content.includes('node_modules')) {
      warn('.gitignore is missing node_modules! This will cause AI tools to choke by scanning dependencies.');
    }
    if (!content.includes('.env')) {
      warn('.gitignore is missing .env config boundaries! Secret tokens might get exposed to models.');
    }
  } else {
    warn('Missing .gitignore file in target workspace! AI tools might read large build artifacts.');
  }

  // 2. Build/test/lint presence inside AGENTS.md
  const agentsPath = join(options.target, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf8');
    if (!content.includes('build:') && !content.includes('build')) {
      warn('AGENTS.md is missing build command specifications.');
    }
    if (!content.includes('test:') && !content.includes('test')) {
      warn('AGENTS.md is missing test command specifications.');
    }
    if (!content.includes('lint:') && !content.includes('lint')) {
      warn('AGENTS.md is missing lint command specifications.');
    }
  } else {
    warn('AGENTS.md is missing from project root.');
  }

  // 3. Null placeholders check in MEMORY.md
  const memoryPath = join(options.target, 'MEMORY.md');
  if (existsSync(memoryPath)) {
    const content = readFileSync(memoryPath, 'utf8');
    const placeholdersCount = (content.match(/null/g) || []).length;
    if (placeholdersCount > 3) {
      warn(`MEMORY.md contains ${placeholdersCount} empty 'null' placeholders. Update project constraints.`);
    }
  }

  // 4. Tasks checklist status
  const tasksPath = join(options.target, 'TASKS.md');
  if (existsSync(tasksPath)) {
    const content = readFileSync(tasksPath, 'utf8');
    if (!content.includes('- [ ]') && !content.includes('- [/]')) {
      warn('TASKS.md has no active task section (no tasks marked as - [ ] or - [/]).');
    }
  } else {
    warn('TASKS.md is missing from project root.');
  }

  // 5. Active adapters files audit
  const configPath = join(options.target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    const checkAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const filePath = join(options.target, filename);
        if (!existsSync(filePath)) {
          warn(`Adapter '${adapterName}' is enabled in .ai/config.yaml but matching adapter file '${filename}' is missing from root.`);
        }
      }
    };
    checkAdapter('cursor', '.cursorrules');
    checkAdapter('claude', 'CLAUDE.md');
    checkAdapter('gemini', 'GEMINI.md');
    checkAdapter('vscode', '.vscode/settings.json');
    checkAdapter('antigravity', '.gemini/settings.json');
  } else {
    warn('.ai/config.yaml is missing from project. Active adapters could not be audited.');
  }

  // 6. Token sinks audit
  const sinkFolders = ['node_modules', 'dist', 'build', '.next', '.git'];
  sinkFolders.forEach(folder => {
    const fullPath = join(options.target, folder);
    if (existsSync(fullPath)) {
      const gitignore = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
      if (!gitignore.includes(folder)) {
        warn(`Large token-sink directory '${folder}/' is present in workspace but not ignored in .gitignore. AI tools may read it.`);
      }
    }
  });

  console.log('\n==================================================');
  if (warnings > 0) {
    console.log(`\x1b[33mDoctor checkup complete. Found ${warnings} advisory warnings.\x1b[0m\n`);
  } else {
    console.log('\x1b[32m✔ Doctor checkup complete. Your project context layout is pristine!\x1b[0m\n');
  }
}

function handleValidate(options) {
  console.log(`\n🛡 \x1b[34mRunning strict schema validation in: ${options.target}\x1b[0m\n`);

  let errors = 0;

  const assertPath = (relPath, type) => {
    const fullPath = join(options.target, relPath);
    if (existsSync(fullPath)) {
      const stat = statSync(fullPath);
      const isOk = (type === 'file') ? stat.isFile() : stat.isDirectory();
      if (isOk) {
        console.log(`  \x1b[32m✓\x1b[0m ${relPath} (${type})`);
      } else {
        console.error(`  \x1b[31m✗ ${relPath} (expected to be a ${type})\x1b[0m`);
        errors++;
      }
    } else {
      console.error(`  \x1b[31m✗ ${relPath} (missing)\x1b[0m`);
      errors++;
    }
  };

  // 1. Assert Core files
  const core = ['AGENTS.md', 'MEMORY.md', 'TASKS.md', 'RUNBOOK.md', '.ai/config.yaml'];
  core.forEach(f => assertPath(f, 'file'));

  // 2. Assert Core folders (excluding agents first)
  const dirs = ['.ai/context', '.ai/skills', '.ai/session-logs'];
  dirs.forEach(d => assertPath(d, 'dir'));

  // 3. Assert .ai/agents exists OR global agent use is explained in AGENTS.md
  const agentsPath = join(options.target, '.ai/agents');
  const agentsExist = existsSync(agentsPath) && statSync(agentsPath).isDirectory();
  if (agentsExist) {
    console.log(`  \x1b[32m✓\x1b[0m .ai/agents (dir)`);
  } else {
    const agentsMdPath = join(options.target, 'AGENTS.md');
    let explained = false;
    if (existsSync(agentsMdPath)) {
      const agentsMdContent = readFileSync(agentsMdPath, 'utf8');
      if (
        agentsMdContent.includes('multimodel') ||
        agentsMdContent.includes('orchestrator') ||
        agentsMdContent.includes('global') ||
        agentsMdContent.includes('role') ||
        agentsMdContent.includes('Agent Roles')
      ) {
        explained = true;
      }
    }
    if (explained) {
      console.log(`  \x1b[32m✓\x1b[0m .ai/agents (missing, but global agent/orchestrator usage explained in AGENTS.md)`);
    } else {
      console.error(`  \x1b[31m✗ .ai/agents (missing and global agent use is not explained in AGENTS.md)\x1b[0m`);
      errors++;
    }
  }

  // 4. Assert Active adapters files (adapter references are not broken)
  const configPath = join(options.target, '.ai', 'config.yaml');
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, 'utf8');
    const assertAdapter = (adapterName, filename) => {
      const regex = new RegExp(`${adapterName}:\\s*true`);
      if (regex.test(content)) {
        const fullPath = join(options.target, filename);
        if (existsSync(fullPath)) {
          console.log(`  \x1b[32m✓\x1b[0m ${filename} (enabled adapter rules file verified)`);
        } else {
          console.error(`  \x1b[31m✗ ${filename} (adapter '${adapterName}' is enabled in .ai/config.yaml, but rule file is missing!)\x1b[0m`);
          errors++;
        }
      }
    };
    assertAdapter('cursor', '.cursorrules');
    assertAdapter('claude', 'CLAUDE.md');
    assertAdapter('gemini', 'GEMINI.md');
    assertAdapter('vscode', '.vscode/settings.json');
    assertAdapter('antigravity', '.gemini/settings.json');
  }

  // Template-specific validation
  if (options.template === 'expo-react-native-android') {
    const mobileFiles = [
      'app.json',
      'eas.json',
      'app.config.ts',
      'jest.config.js',
      'src/app/_layout.tsx',
      'src/lib/secure-storage.ts',
      'src/services/api-client.ts'
    ];
    mobileFiles.forEach(f => assertPath(f, 'file'));
  }

  console.log('\n==================================================');
  if (errors > 0) {
    console.error(`  \x1b[31mValidation FAILED. Found ${errors} strict structural compliance errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log('  \x1b[32m✔ Validation PASSED. Your project context structure is strictly compliant!\x1b[0m\n');
    process.exit(0);
  }
}

// --- YAML Parser Helper ---
function parseYaml(content) {
  const root = {};
  const stack = [{ obj: root, indent: -1, key: null, isArray: false }];

  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    line = line.trimEnd();
    if (!line.trim()) continue;

    const indent = line.match(/^ */)[0].length;
    let trimmed = line.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    if (trimmed.startsWith('-')) {
      trimmed = trimmed.substring(1).trim();
      if (!Array.isArray(parent.obj[parent.key])) {
        parent.obj[parent.key] = [];
      }
      
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) {
        parent.obj[parent.key].push(trimmed);
      } else {
        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null') val = null;
        else if (/^\d+$/.test(val)) val = parseInt(val, 10);

        const newObj = { [key]: val };
        parent.obj[parent.key].push(newObj);
        stack.push({ obj: newObj, indent: indent, key: key, isArray: false });
      }
    } else {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const key = trimmed.substring(0, colonIdx).trim();
      let val = trimmed.substring(colonIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^\d+$/.test(val)) val = parseInt(val, 10);

      if (val === '') {
        parent.obj[key] = {};
        stack.push({ obj: parent.obj[key], indent: indent, key: key, isArray: false });
      } else {
        parent.obj[key] = val;
      }
    }
  }
  return root;
}

// --- Command Handler Functions ---
function handleListModels() {
  const registryPath = join(sourceRoot, '.ai', 'models', 'registry.yaml');
  if (!existsSync(registryPath)) {
    console.error('Error: Model registry not found.');
    process.exit(1);
  }
  const registry = parseYaml(readFileSync(registryPath, 'utf8'));
  const models = registry.models || {};
  console.log(`\n🤖 \x1b[36mModel Registry [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(models).forEach(name => {
    const m = models[name];
    console.log(`\n\x1b[32m* ${name}\x1b[0m (${m.alias || ''})`);
    console.log(`  \x1b[33mProvider:\x1b[0m ${m.provider}`);
    console.log(`  \x1b[33mOfficial ID:\x1b[0m ${m.official_id}`);
    console.log(`  \x1b[33mContext Window:\x1b[0m ${m.context_window} tokens`);
    console.log(`  \x1b[33mTiers:\x1b[0m Cost: ${m.tiers?.cost}, Reasoning: ${m.tiers?.reasoning}, Coding: ${m.tiers?.coding}`);
  });
  console.log('\nUse \x1b[36mshow-model <model-alias>\x1b[0m to view detailed model capabilities.\n');
}

function handleShowModel(name) {
  const registryPath = join(sourceRoot, '.ai', 'models', 'registry.yaml');
  if (!existsSync(registryPath)) {
    console.error('Error: Model registry not found.');
    process.exit(1);
  }
  const registry = parseYaml(readFileSync(registryPath, 'utf8'));
  const models = registry.models || {};
  const m = models[name];
  if (!m) {
    console.error(`\x1b[31mError: Model alias '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🔍 \x1b[36mModel: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mProvider:\x1b[0m ${m.provider}`);
  console.log(`\x1b[33mAlias:\x1b[0m ${m.alias}`);
  console.log(`\x1b[33mOfficial ID:\x1b[0m ${m.official_id}`);
  console.log(`\x1b[33mContext Window:\x1b[0m ${m.context_window} tokens`);
  console.log(`\x1b[33mCapabilities:\x1b[0m`);
  console.log(`  ├─ Vision: ${m.capabilities?.vision ? 'Yes' : 'No'}`);
  console.log(`  └─ Tool Use: ${m.capabilities?.tool_use ? 'Yes' : 'No'}`);
  console.log(`\x1b[33mTiers:\x1b[0m`);
  console.log(`  ├─ Cost: ${m.tiers?.cost}`);
  console.log(`  ├─ Speed: ${m.tiers?.speed}`);
  console.log(`  ├─ Reasoning: ${m.tiers?.reasoning}`);
  console.log(`  └─ Coding: ${m.tiers?.coding}`);
  console.log();
}

function handleListProviders() {
  const providersPath = join(sourceRoot, '.ai', 'models', 'providers.yaml');
  if (!existsSync(providersPath)) {
    console.error('Error: Providers registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(providersPath, 'utf8'));
  const providers = reg.providers || {};
  console.log(`\n🔌 \x1b[36mAI Providers [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(providers).forEach(name => {
    const p = providers[name];
    console.log(`\n\x1b[32m* ${p.name || name}\x1b[0m (${name})`);
    console.log(`  \x1b[33mEndpoint:\x1b[0m ${p.api_endpoint || 'Local'}`);
    console.log(`  \x1b[33mEnv Key:\x1b[0m ${p.env_key || 'None'}`);
  });
  console.log();
}

function handleRouteModel(task) {
  const presetsPath = join(sourceRoot, '.ai', 'models', 'routing-presets.yaml');
  if (!existsSync(presetsPath)) {
    console.error('Error: Routing presets not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(presetsPath, 'utf8'));
  const presets = reg.presets || {};
  const preset = presets[task];
  if (!preset) {
    console.error(`\x1b[31mError: Routing preset for task '${task}' not found. Available: ${Object.keys(presets).join(', ')}\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🎯 \x1b[36mRouting Suggestion for: ${task}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mPrimary Model:\x1b[0m \x1b[32m${preset.primary}\x1b[0m`);
  console.log(`\x1b[33mFallback Model:\x1b[0m \x1b[33m${preset.fallback}\x1b[0m`);
  console.log();
}

function handleListAdapters() {
  const adaptersPath = join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  if (!existsSync(adaptersPath)) {
    console.error('Error: Adapters registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(adaptersPath, 'utf8'));
  const adapters = reg.adapters || {};
  console.log(`\n🔌 \x1b[36mIDE & Agent Adapters [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(adapters).forEach(name => {
    const a = adapters[name];
    console.log(`\n\x1b[32m* ${a.name || name}\x1b[0m (${name})`);
    console.log(`  \x1b[33mRules File:\x1b[0m ${a.rules_file}`);
    console.log(`  \x1b[33mAdapter Type:\x1b[0m ${a.type}`);
    console.log(`  \x1b[33mRule Format:\x1b[0m ${a.format}`);
  });
  console.log('\nUse \x1b[36mshow-adapter <adapter-name>\x1b[0m to view detailed adapter metadata.\n');
}

function handleShowAdapter(name) {
  const adaptersPath = join(sourceRoot, '.ai', 'adapters', 'registry.yaml');
  if (!existsSync(adaptersPath)) {
    console.error('Error: Adapters registry not found.');
    process.exit(1);
  }
  const reg = parseYaml(readFileSync(adaptersPath, 'utf8'));
  const adapters = reg.adapters || {};
  const a = adapters[name];
  if (!a) {
    console.error(`\x1b[31mError: Adapter '${name}' not found in registry.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n🔍 \x1b[36mAdapter: ${a.name || name}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mRules File:\x1b[0m ${a.rules_file}`);
  console.log(`\x1b[33mType:\x1b[0m ${a.type}`);
  console.log(`\x1b[33mFormat:\x1b[0m ${a.format}`);
  console.log();
}

function handleListSkills(options) {
  const skillsDir = join(options.target, '.ai', 'skills');
  if (!existsSync(skillsDir)) {
    console.log('\n\x1b[33m[Notice] .ai/skills directory is not initialized in the target workspace.\x1b[0m\n');
    return;
  }
  const files = readdirSync(skillsDir).filter(f => f.endsWith('.md'));
  console.log(`\n🧠 \x1b[36mAvailable Skills in Target [v${version}]\x1b[0m`);
  console.log('==================================================');
  files.forEach(f => {
    console.log(`  \x1b[32m- ${f.replace('.md', '')}\x1b[0m (file: .ai/skills/${f})`);
  });
  console.log('\nUse \x1b[36mshow-skill <skill-name>\x1b[0m to read a skill\'s prompt text.\n');
}

function handleShowSkill(name, options) {
  const skillsDir = join(options.target, '.ai', 'skills');
  const skillFile = join(skillsDir, name.endsWith('.md') ? name : `${name}.md`);
  if (!existsSync(skillFile)) {
    console.error(`\x1b[31mError: Skill '${name}' not found in target .ai/skills/.\x1b[0m`);
    process.exit(1);
  }
  console.log(`\n📖 \x1b[36mSkill Prompt: ${name}\x1b[0m`);
  console.log('==================================================');
  console.log(readFileSync(skillFile, 'utf8'));
  console.log();
}

function handleDoctorTokens(options) {
  console.log(`\n🪙 \x1b[36mRunning Token Budget & Sink Audit in: ${options.target}\x1b[0m\n`);
  
  const filesFound = [];
  const ignoredDirs = ['.git', 'node_modules', 'dist', 'build', '.next', '.expo', 'bin', 'assets', 'docs'];
  
  function scan(dir) {
    if (!existsSync(dir)) return;
    const items = readdirSync(dir);
    for (const item of items) {
      if (ignoredDirs.includes(item)) continue;
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (stat.isFile()) {
          filesFound.push({
            relPath: replaceBackslashes(fullPath.replace(options.target, '')),
            size: stat.size
          });
        }
      } catch (e) {}
    }
  }

  function replaceBackslashes(p) {
    let clean = p.replace(/\\/g, '/');
    if (clean.startsWith('/')) clean = clean.substring(1);
    return clean;
  }

  scan(options.target);
  
  filesFound.sort((a, b) => b.size - a.size);
  
  console.log('Top 10 Largest Files in Scanned Workspace:');
  filesFound.slice(0, 10).forEach(f => {
    let sizeDesc = `${f.size} bytes`;
    if (f.size > 1024 * 1024) sizeDesc = `${(f.size / (1024 * 1024)).toFixed(2)} MB`;
    else if (f.size > 1024) sizeDesc = `${(f.size / 1024).toFixed(2)} KB`;
    
    let color = '\x1b[32m';
    if (f.size > 100 * 1024) color = '\x1b[31m';
    else if (f.size > 30 * 1024) color = '\x1b[33m';
    
    console.log(`  ${color}* ${f.relPath}\x1b[0m (${sizeDesc})`);
  });
  
  console.log('\n==================================================');
  console.log(`Total Scanned Files: ${filesFound.length}`);
  console.log('Recommendation: Exclude files in red (>100KB) from active coding prompts or add them to your adapter ignore rules.');
  console.log();
}
