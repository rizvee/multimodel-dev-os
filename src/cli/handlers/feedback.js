import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export function handleFeedbackAdd(options) {
  const intelDir = join(options.target, '.ai', 'intelligence');
  if (!options.dryRun && !existsSync(intelDir)) {
    mkdirSync(intelDir, { recursive: true });
  }

  const addIdx = process.argv.indexOf('add');
  const text = (addIdx !== -1 && process.argv[addIdx + 1] && !process.argv[addIdx + 1].startsWith('-')) ? process.argv[addIdx + 1] : null;

  if (!text) {
    console.error(`\x1b[31mError: Please provide feedback text.\x1b[0m`);
    console.log(`Example: node bin/multimodel-dev-os.js feedback add "Prefer CSS modules"`);
    process.exit(1);
  }

  const uuid = createHash('md5').update(new Date().toISOString() + Math.random().toString()).digest('hex').substring(0, 16);
  const tagsStr = options.tags || '';
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];
  const filesStr = options.files || '';
  const related_files = filesStr ? filesStr.split(',').map(f => f.trim()) : [];

  const rawRecord = {
    id: `fb-${uuid}`,
    created_at: new Date().toISOString(),
    source: 'user',
    type: options.type || 'unknown',
    text: text,
    tags: tags,
    related_files: related_files
  };

  rawRecord.hash = createHash('sha256').update(JSON.stringify(rawRecord)).digest('hex');

  const recordLine = JSON.stringify(rawRecord) + '\n';
  const feedbackLogPath = join(intelDir, 'feedback-log.jsonl');

  if (options.dryRun) {
    console.log(`\x1b[36m[DRY-RUN] WOULD APPEND TO ${feedbackLogPath}:\x1b[0m`);
    console.log(recordLine.trim());
  } else {
    try {
      let isDuplicate = false;
      if (existsSync(feedbackLogPath)) {
        const lines = readFileSync(feedbackLogPath, 'utf8').split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (entry.text === text && JSON.stringify(entry.related_files) === JSON.stringify(related_files)) {
              isDuplicate = true;
              break;
            }
          } catch (e) {}
        }
      }
      if (isDuplicate) {
        console.log(`\x1b[33mFeedback already exists. Skipping duplicate entry.\x1b[0m`);
        return;
      }

      writeFileSync(feedbackLogPath, recordLine, { flag: 'a', encoding: 'utf8' });
      console.log(`✔ Feedback successfully added (ID: ${rawRecord.id})`);
    } catch (e) {
      console.error(`\x1b[31mError: Failed to write to feedback-log.jsonl: ${e.message}\x1b[0m`);
      process.exit(1);
    }
  }
}

export function handleFeedbackList(options) {
  const feedbackLogPath = join(options.target, '.ai', 'intelligence', 'feedback-log.jsonl');
  if (!existsSync(feedbackLogPath)) {
    console.log('No feedback logged yet.');
    return;
  }

  try {
    const content = readFileSync(feedbackLogPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      console.log('No feedback logged yet.');
      return;
    }

    console.log(`\n🧠 \x1b[36mLogged Feedback Entries\x1b[0m`);
    console.log('==================================================');
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        console.log(`\n\x1b[32m* [${entry.type || 'unknown'}] (${entry.id})\x1b[0m`);
        console.log(`  \x1b[37mText:\x1b[0m ${entry.text}`);
        if (entry.tags && entry.tags.length > 0) {
          console.log(`  \x1b[33mTags:\x1b[0m ${entry.tags.join(', ')}`);
        }
        if (entry.related_files && entry.related_files.length > 0) {
          console.log(`  \x1b[33mFiles:\x1b[0m ${entry.related_files.join(', ')}`);
        }
        console.log(`  \x1b[33mLogged:\x1b[0m ${entry.created_at}`);
      } catch (e) {}
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to read feedback log: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

export function handleFeedbackSummarize(options) {
  const intelDir = join(options.target, '.ai', 'intelligence');
  const feedbackLogPath = join(intelDir, 'feedback-log.jsonl');
  if (!existsSync(feedbackLogPath)) {
    console.log('No feedback logs found to compile.');
    return;
  }

  try {
    const content = readFileSync(feedbackLogPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      console.log('No feedback logs found to compile.');
      return;
    }

    const categories = {};
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        const cat = entry.type || 'general';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(entry);
      } catch (e) {}
    });

    let md = `# Compiled Learning Rules\n\n`;
    md += `*Generated automatically by MultiModel Dev OS. Do not modify manually.*\n\n`;
    md += `**Last compiled:** ${new Date().toISOString()}\n`;
    md += `**Total source feedback items:** ${lines.length}\n\n`;
    md += `## Active Instructions\n\n`;

    Object.keys(categories).forEach(cat => {
      md += `### Category: ${cat}\n`;
      categories[cat].forEach(entry => {
        const pattern = entry.related_files && entry.related_files.length > 0 ? entry.related_files.join(', ') : '*';
        md += `*   **Pattern:** \`${pattern}\`\n`;
        md += `    *   **Rule:** ${entry.text}\n`;
        md += `    *   **Source ID:** \`${entry.id}\`\n\n`;
      });
    });

    const targetRulesPath = join(intelDir, 'learning-rules.md');
    if (options.dryRun) {
      console.log(`\x1b[36m[DRY-RUN] WOULD WRITE TO ${targetRulesPath}:\x1b[0m`);
      console.log(md);
    } else {
      writeFileSync(targetRulesPath, md, 'utf8');
      console.log(`✔ Compiled ${lines.length} feedback items into learning rules in .ai/intelligence/learning-rules.md`);
    }
  } catch (e) {
    console.error(`\x1b[31mError: Failed to compile learning rules: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}
