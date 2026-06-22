import { loadTemplates, version } from '../../core/globals.js';

/**
 * List all available templates.
 * @param {object} options 
 */
export function handleListTemplates(options) {
  const TEMPLATES = loadTemplates(options?.registry);
  if (options && options.json) {
    console.log(JSON.stringify(TEMPLATES, null, 2));
    return;
  }
  console.log(`\n🧠 \x1b[36mBuilt-in Template Profiles [v${version}]\x1b[0m`);
  console.log('==================================================');
  Object.keys(TEMPLATES).forEach(key => {
    const t = TEMPLATES[key];
    const statusStr = t.status === 'planned' ? ' (Planned)' : t.status === 'experimental' ? ' (Experimental)' : '';
    console.log(`\n\x1b[32m* ${t.name}${statusStr}\x1b[0m`);
    console.log(`  \x1b[33mStack:\x1b[0m ${t.stack}`);
    console.log(`  \x1b[37mDescription:\x1b[0m ${t.description}`);
  });
  console.log('\nUse \x1b[36mshow-template <template-name>\x1b[0m to view detailed layout specifications.\n');
}

/**
 * Show detailed information for a template.
 * @param {string} name 
 * @param {object} options 
 */
export function handleShowTemplate(name, options) {
  const TEMPLATES = loadTemplates(options?.registry);
  const t = TEMPLATES[name];
  if (!t) {
    const available = Object.keys(TEMPLATES).join(', ');
    console.error(`\n\x1b[31mError: Template '${name}' does not exist. Available: ${available}\x1b[0m\n`);
    process.exit(1);
  }

  const statusStr = t.status === 'planned' ? ' (Planned)' : t.status === 'experimental' ? ' (Experimental)' : ' (Stable)';
  console.log(`\n🔍 \x1b[36mTemplate Profile: ${t.name}${statusStr}\x1b[0m`);
  console.log('==================================================');
  console.log(`\x1b[33mStack Blueprint:\x1b[0m ${t.stack}`);
  console.log(`\x1b[33mOverview:\x1b[0m ${t.description}`);
  if (t.skill) {
    console.log(`\x1b[33mHighlighted Skill:\x1b[0m .ai/skills/${t.skill}`);
    console.log(`  └──> ${t.skillDesc}`);
  }
  console.log('\n\x1b[33mScaffolding Directory Layout:\x1b[0m');
  console.log('  ├── AGENTS.md                   (Stack building conventions)');
  console.log('  ├── MEMORY.md                   (Architectural constraints record)');
  console.log('  ├── TASKS.md                    (Pre-populated first project tasks)');
  console.log('  └── RUNBOOK.md                  (Default operations guide)');
  console.log('  └── .ai/');
  console.log('      ├── config.yaml             (Enabled adapter options)');
  console.log('      ├── context/');
  console.log('      │   ├── project-brief.md    (Scaffolding baseline brief)');
  console.log('      │   ├── architecture.md     (Stack specific architecture map)');
  console.log('      │   ├── model-map.md        (AI routing specifications)');
  console.log('      │   └── context-budget.md   (Token allocation guidelines)');
  console.log(`      └── skills/`);
  if (t.skill) {
    console.log(`          └── ${t.skill}     (Custom template skills code boiler)`);
  } else {
    console.log(`          └── [custom-skill].md   (Custom template skills code boiler)`);
  }
  console.log('\nUse \x1b[32minit --template ' + t.name + '\x1b[0m to bootstrap this profile.\n');
}
