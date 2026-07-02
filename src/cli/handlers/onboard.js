import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { sourceRoot } from '../../core/globals.js';
import { parseYaml } from '../../core/yaml.js';
import { getAnalysis } from '../../core/analysis.js';

/**
 * Generate onboarding recommendation based on workspace analysis.
 * @param {object} analysis
 */
export function getRecommendation(analysis) {
  const scores = {
    'nextjs-saas': 0.0,
    'expo-react-native-android': 0.0,
    'wordpress-site': 0.0,
    'ecommerce-store': 0.0,
    'seo-landing-page': 0.0,
    'general-app': 0.1
  };

  if (analysis.frameworks.includes('Next.js')) scores['nextjs-saas'] += 0.6;
  if (analysis.frameworks.includes('React')) scores['nextjs-saas'] += 0.2;
  if (analysis.frameworks.includes('TypeScript')) scores['nextjs-saas'] += 0.1;

  if (analysis.repoType === 'mobile app') scores['expo-react-native-android'] += 0.6;
  if (analysis.frameworks.includes('Expo') || analysis.frameworks.includes('React Native')) scores['expo-react-native-android'] += 0.3;

  if (analysis.repoType === 'WordPress theme/plugin') scores['wordpress-site'] += 0.6;
  if (analysis.frameworks.includes('WordPress/PHP')) scores['wordpress-site'] += 0.3;

  if (analysis.frameworks.includes('Vite') || analysis.frameworks.includes('React')) scores['seo-landing-page'] += 0.3;

  let recommended = 'general-app';
  let maxScore = 0.0;
  Object.keys(scores).forEach(k => {
    if (scores[k] > maxScore) {
      maxScore = scores[k];
      recommended = k;
    }
  });

  const suggestedAdapters = ['cursor', 'claude', 'gemini', 'vscode', 'antigravity'];

  return {
    template: recommended,
    confidence: Math.min(1.0, maxScore === 0.1 ? 0.5 : maxScore),
    suggestedAdapters,
    riskNotes: analysis.envRiskMarkers.length > 0 ? 'Workspace contains unignored credentials or key files. Ensure .gitignore covers them.' : 'None'
  };
}

/**
 * Analyze target workspace layout and metadata.
 * @param {object} options
 */
export function handleOnboardAnalyze(options) {
  console.log(`\n🔍 \x1b[36mAnalyzing Workspace for Onboarding: ${options.target}\x1b[0m`);
  console.log('==================================================');
  const analysis = getAnalysis(options.target);

  console.log(`  Package Manager:       ${analysis.packageManagers.join(', ') || 'None'}`);
  console.log(`  Detected Frameworks:   ${analysis.frameworks.join(', ') || 'None'}`);
  console.log(`  Dominant Language:     ${analysis.language}`);
  console.log(`  Repository Type:       ${analysis.repoType}`);
  console.log(`  Existing AI Tools:     ${analysis.existingTools.join(', ') || 'None'}`);
  console.log(`  GitHub Workflows:      ${analysis.githubWorkflows.join(', ') || 'None'}`);
  console.log(`  Security Risk Markers: ${analysis.envRiskMarkers.length} files found`);
  if (analysis.envRiskMarkers.length > 0) {
    analysis.envRiskMarkers.forEach(m => console.log(`    └──> ${m} (potential secrets exposure risk)`));
  }
  console.log();
}

/**
 * Display recommendations based on repository characteristics.
 * @param {object} options
 */
export function handleOnboardRecommend(options) {
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);

  console.log(`\n💡 \x1b[36mOnboarding Recommendation for: ${options.target}\x1b[0m`);
  console.log('==================================================');
  console.log(`  Recommended Template:  \x1b[32m${rec.template}\x1b[0m`);
  console.log(`  Confidence Score:      ${(rec.confidence * 100).toFixed(0)}%`);
  console.log(`  Suggested Adapters:    ${rec.suggestedAdapters.join(', ')}`);
  console.log(`  Risk Notes:            ${rec.riskNotes}`);
  console.log(`  Suggested Next Command:`);
  console.log(`    npx multimodel-dev-os onboard plan --target .`);
  console.log();
}

/**
 * Scaffolds the onboarding configurations plan.
 * @param {object} options
 */
export function handleOnboardPlan(options) {
  console.log(`\n📋 \x1b[36mGenerating Onboarding Plan: ${options.target}\x1b[0m`);
  console.log('==================================================');
  const analysis = getAnalysis(options.target);
  const rec = getRecommendation(analysis);

  const planPath = join(options.target, '.ai', 'intelligence', 'onboarding.plan.json');
  const reportPath = join(options.target, '.ai', 'intelligence', 'onboarding.report.md');

  const plannedFiles = [
    { action: 'CREATE', path: 'AGENTS.md', source_template: `examples/${rec.template}/AGENTS.md` },
    { action: 'CREATE', path: 'MEMORY.md', source_template: `examples/${rec.template}/MEMORY.md` },
    { action: 'CREATE', path: 'TASKS.md', source_template: `examples/${rec.template}/TASKS.md` },
    { action: 'CREATE', path: 'RUNBOOK.md', source_template: `RUNBOOK.md` },
    { action: 'CREATE', path: '.ai/config.yaml', source_template: `examples/${rec.template}/.ai/config.yaml` }
  ];

  const planData = {
    generated_at: new Date().toISOString(),
    target_path: options.target,
    project_analysis: {
      package_manager: analysis.packageManagers.join(', ') || 'npm',
      framework: analysis.frameworks.join(', ') || 'Generic',
      language: analysis.language,
      repo_type: analysis.repoType,
      has_existing_ai_config: analysis.aiSignals.includes('.ai/config.yaml'),
      risk_markers: analysis.envRiskMarkers
    },
    recommendation: {
      template: rec.template,
      confidence: rec.confidence,
      suggested_adapters: rec.suggestedAdapters,
      reasons: [`Detected dominant language ${analysis.language}`, `Detected framework ${analysis.frameworks.join(', ')}`]
    },
    planned_files: plannedFiles
  };

  let reportMd = `# MultiModel Dev OS Onboarding Report\n\n`;
  reportMd += `**Generated At:** ${planData.generated_at}\n`;
  reportMd += `**Target Path:** ${planData.target_path}\n\n`;
  reportMd += `## 1. Project Analysis Details\n`;
  reportMd += `- **Package Manager:** ${planData.project_analysis.package_manager}\n`;
  reportMd += `- **Frameworks:** ${planData.project_analysis.framework}\n`;
  reportMd += `- **Language:** ${planData.project_analysis.language}\n`;
  reportMd += `- **Repo Type:** ${planData.project_analysis.repo_type}\n\n`;

  reportMd += `## 2. Onboarding Recommendation\n`;
  reportMd += `- **Recommended Profile:** **${planData.recommendation.template}** (Confidence: ${(planData.recommendation.confidence * 100).toFixed(0)}%)\n`;
  reportMd += `- **Suggested Adapters:** ${planData.recommendation.suggested_adapters.join(', ')}\n\n`;

  reportMd += `## 3. Planned File Operations\n`;
  reportMd += `| Action | Target Path | Source Template |\n`;
  reportMd += `|---|---|---|\n`;
  plannedFiles.forEach(f => {
    reportMd += `| ${f.action} | ${f.path} | ${f.source_template} |\n`;
  });
  reportMd += `\n`;

  reportMd += `## 4. Next Step\n`;
  reportMd += `To safely apply this plan, run:\n`;
  reportMd += `\`\`\`bash\n`;
  reportMd += `npx multimodel-dev-os onboard apply --target . --approved\n`;
  reportMd += `\`\`\`\n`;

  try {
    const intelDir = join(options.target, '.ai', 'intelligence');
    if (!options.dryRun && !existsSync(intelDir)) {
      mkdirSync(intelDir, { recursive: true });
    }
    if (!options.dryRun) {
      writeFileSync(planPath, JSON.stringify(planData, null, 2), 'utf8');
      writeFileSync(reportPath, reportMd, 'utf8');
    }

    console.log(`  [SUCCESS] Onboarding plan generated:`);
    console.log(`    - Plan JSON:   .ai/intelligence/onboarding.plan.json`);
    console.log(`    - Report MD:   .ai/intelligence/onboarding.report.md`);
    console.log(`\nReview the plan and run "npx multimodel-dev-os onboard apply --target . --approved" to execute.\n`);
  } catch (e) {
    console.error(`\x1b[31mError writing plan: ${e.message}\x1b[0m`);
  }
}

/**
 * Apply the planned onboarding configurations to the workspace.
 * @param {object} options
 */
export function handleOnboardApply(options) {
  if (!options.approved) {
    console.error('\x1b[31mError: Onboarding apply requires explicit approval flag: --approved\x1b[0m');
    console.log('Example: node bin/multimodel-dev-os.js onboard apply --approved');
    process.exit(1);
  }

  const planPath = join(options.target, '.ai', 'intelligence', 'onboarding.plan.json');
  if (!existsSync(planPath)) {
    console.error('\x1b[31mError: Onboarding plan not found. Run "npx multimodel-dev-os onboard plan" first.\x1b[0m');
    process.exit(1);
  }

  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, 'utf8'));
  } catch (e) {
    console.error(`\x1b[31mError reading plan JSON: ${e.message}\x1b[0m`);
    process.exit(1);
  }

  console.log(`\n🚀 \x1b[36mApplying Onboarding Scaffolding: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const template = plan.recommendation.template;
  options.template = template;

  const operations = [];

  plan.planned_files.forEach(f => {
    let srcFile;
    if (f.source_template === 'RUNBOOK.md') {
      srcFile = join(sourceRoot, 'RUNBOOK.md');
    } else {
      srcFile = join(sourceRoot, f.source_template);
    }
    operations.push({ dest: f.path, src: srcFile });
  });

  const templateDir = join(sourceRoot, 'examples', template);
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

  const globalAiSubdirs = ['context', 'agents', 'skills', 'prompts', 'checks', 'templates', 'session-logs', 'registries', 'proposals', 'intelligence'];
  globalAiSubdirs.forEach(sub => {
    const globalPath = join(sourceRoot, '.ai', sub);
    if (existsSync(globalPath)) {
      readdirSync(globalPath).forEach(file => {
        const destRel = join('.ai', sub, file);
        if (!operations.some(op => op.dest === destRel)) {
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

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  operations.forEach(op => {
    const destPath = join(options.target, op.dest);
    const destDir = dirname(destPath);

    if (existsSync(destPath)) {
      if (options.force) {
        if (!options.dryRun) {
          const backupPath = destPath + '.bak';
          writeFileSync(backupPath, readFileSync(destPath));
          if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
          writeFileSync(destPath, readFileSync(op.src));
          console.log(`  \x1b[33mOVERWRITE (BACKUP CREATED):\x1b[0m ${op.dest} -> ${op.dest}.bak`);
        } else {
          console.log(`  \x1b[36m[DRY-RUN] WOULD OVERWRITE & BACKUP:\x1b[0m ${op.dest}`);
        }
        updatedCount++;
      } else {
        console.log(`  \x1b[37m[SKIP] Already exists:\x1b[0m ${op.dest}`);
        skippedCount++;
      }
    } else {
      if (!options.dryRun) {
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        writeFileSync(destPath, readFileSync(op.src));
        console.log(`  \x1b[32mCREATE:\x1b[0m ${op.dest}`);
      } else {
        console.log(`  \x1b[36m[DRY-RUN] WOULD CREATE:\x1b[0m ${op.dest}`);
      }
      createdCount++;
    }
  });

  console.log(`\n✔ Onboarding apply complete! Created: ${createdCount}, Skipped: ${skippedCount}, Overwritten (with backup): ${updatedCount}\n`);
}

/**
 * Check completeness status of workspace configs.
 * @param {object} options
 */
export function handleOnboardStatus(options) {
  console.log(`\n📊 \x1b[36mOnboarding Status Dashboard: ${options.target}\x1b[0m`);
  console.log('==================================================');

  const crucialFiles = [
    'AGENTS.md',
    'MEMORY.md',
    'TASKS.md',
    'RUNBOOK.md',
    '.ai/config.yaml'
  ];

  let presentCount = 0;
  crucialFiles.forEach(f => {
    const fullPath = join(options.target, f);
    const exists = existsSync(fullPath);
    if (exists) presentCount++;
    console.log(`  [${exists ? '✔' : ' '}] ${f}`);
  });

  const percentage = (presentCount / crucialFiles.length) * 100;
  console.log(`\n  Completeness Score: ${percentage.toFixed(0)}%`);
  if (percentage === 100) {
    console.log('  Status: \x1b[32mREADY (Onboarding complete)\x1b[0m\n');
  } else if (percentage > 0) {
    console.log('  Status: \x1b[33mIN_PROGRESS (Run "onboard apply --approved" to initialize remaining files)\x1b[0m\n');
  } else {
    console.log('  Status: \x1b[31mMISSING (Run "onboard plan" and "onboard apply" to onboard this repo)\x1b[0m\n');
  }
}
