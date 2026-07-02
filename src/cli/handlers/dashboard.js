import { join } from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { sourceRoot } from '../../core/globals.js';

/**
 * Handle terminal menu selection using arrow keys.
 * @param {string} title
 * @param {Array} items
 * @param {Function} callback
 */
export function selectMenu(title, items, callback) {
  let cursor = 0;
  
  const draw = () => {
    console.clear();
    console.log(`\n🧠 \x1b[36m${title}\x1b[0m`);
    console.log('==================================================');
    items.forEach((item, index) => {
      if (index === cursor) {
        console.log(`  \x1b[32m❯ ${item.name}\x1b[0m`);
      } else {
        console.log(`    ${item.name}`);
      }
    });
    console.log('\n\x1b[90m(Use Arrow keys to navigate, Enter to select, Esc/Ctrl+C to exit)\x1b[0m\n');
  };

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();

  const onKeypress = (str, key) => {
    if (!key) return;
    if (key.name === 'up') {
      cursor = (cursor - 1 + items.length) % items.length;
      draw();
    } else if (key.name === 'down') {
      cursor = (cursor + 1) % items.length;
      draw();
    } else if (key.name === 'return') {
      cleanup();
      callback(items[cursor]);
    } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      cleanup();
      process.exit(0);
    }
  };

  const cleanup = () => {
    process.stdin.removeListener('keypress', onKeypress);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  };

  process.stdin.on('keypress', onKeypress);
  draw();
}

/**
 * TUI Dashboard/Command Center for the MultiModel Dev OS.
 * @param {object} options
 */
export function handleDashboard(options) {
  const mainMenu = [
    { name: 'Active Workspace Status', action: 'command', command: 'status' },
    { name: 'Codebase Scan Analysis', action: 'command', command: 'scan' },
    { name: 'Onboarding Operations...', action: 'submenu', menu: 'onboard' },
    { name: 'Adapter Synchronization...', action: 'submenu', menu: 'adapter' },
    { name: 'Memory & Intelligence...', action: 'submenu', menu: 'memory' },
    { name: 'Developer Feedback Loops...', action: 'submenu', menu: 'feedback' },
    { name: 'Workflow Marketplace Catalog...', action: 'submenu', menu: 'catalog' },
    { name: 'Registry Sources & Cache...', action: 'submenu', menu: 'registry' },
    { name: 'Quality Gates & Diagnostics...', action: 'submenu', menu: 'quality' },
    { name: 'Plugins Status Overview', action: 'command', command: 'plugin status' },
    { name: 'Exit Command Center', action: 'exit' }
  ];

  const submenus = {
    onboard: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Onboard: Analyze Repository', action: 'command', command: 'onboard analyze' },
      { name: 'Onboard: Recommendation Summary', action: 'command', command: 'onboard recommend' },
      { name: 'Onboard: Generate Integration Plan', action: 'command', command: 'onboard plan' },
      { name: 'Onboard: Apply Configs (Dry Run)', action: 'command', command: 'onboard apply --dry-run' },
      { name: 'Onboard: View Status Heuristics', action: 'command', command: 'onboard status' }
    ],
    adapter: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Adapters: Check Sync Status', action: 'command', command: 'adapter status' },
      { name: 'Adapters: Sync All rule files (Dry Run)', action: 'command', command: 'adapter sync all --dry-run' },
      { name: 'Adapters: Diff Cursor rules', action: 'command', command: 'adapter diff cursor' },
      { name: 'Adapters: Diff Claude rules', action: 'command', command: 'adapter diff claude' }
    ],
    memory: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Memory: Build index', action: 'command', command: 'memory build' },
      { name: 'Memory: Refresh changes', action: 'command', command: 'memory refresh' },
      { name: 'Memory: Diff index status', action: 'command', command: 'memory diff' },
      { name: 'Handoff: Build session summary', action: 'command', command: 'handoff build' },
      { name: 'Handoff: Print summary to terminal', action: 'command', command: 'handoff show' }
    ],
    feedback: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Feedback: List developer corrections', action: 'command', command: 'feedback list' },
      { name: 'Feedback: Summarize to learning rules', action: 'command', command: 'feedback summarize' },
      { name: 'Proposals: Propose improvement proposal', action: 'command', command: 'improve propose' },
      { name: 'Proposals: Review active proposals list', action: 'command', command: 'improve review' }
    ],
    catalog: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Catalog: List bundled plugins', action: 'command', command: 'catalog list' },
      { name: 'Catalog: Recommend for current repo', action: 'command', command: 'catalog recommend' },
      { name: 'Catalog: Show installed catalog status', action: 'command', command: 'catalog status' }
    ],
    quality: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Doctor: Run Advisory Diagnostics', action: 'command', command: 'doctor' },
      { name: 'Validate: Strict Schema Compliance', action: 'command', command: 'validate' },
      { name: 'Verify: Run Release verification tests', action: 'command', command: 'verify' }
    ],
    registry: [
      { name: '← Back to Main Menu', action: 'back' },
      { name: 'Registry: List configured sources', action: 'command', command: 'registry list' },
      { name: 'Registry: Show sync status', action: 'command', command: 'registry status' },
      { name: 'Registry: Verify cache integrity', action: 'command', command: 'registry verify bundled' },
      { name: 'Registry: Show policy status', action: 'command', command: 'registry status' }
    ]
  };

  if (!process.stdout.isTTY || !process.stdin.isTTY || options.dryRun || options.listActions) {
    console.log(`\n📊 \x1b[36mMultiModel Dev OS Command Center (Headless/CI Preview)\x1b[0m`);
    console.log(`Target Workspace: \x1b[32m${options.target}\x1b[0m`);
    console.log('==================================================');
    
    const targetFlag = options.target === process.cwd() ? '' : ` --target "${options.target}"`;

    mainMenu.forEach(item => {
      if (item.action === 'command') {
        console.log(`  \x1b[33m•\x1b[0m ${item.name.padEnd(30)} → \x1b[36mnpx multimodel-dev-os ${item.command}${targetFlag}\x1b[0m`);
      } else if (item.action === 'submenu') {
        console.log(`\n  \x1b[35m[${item.name.replace('...', '')}]\x1b[0m`);
        submenus[item.menu].forEach(sub => {
          if (sub.action === 'command') {
            console.log(`    └── ${sub.name.padEnd(35)} → \x1b[36mnpx multimodel-dev-os ${sub.command}${targetFlag}\x1b[0m`);
          }
        });
      }
    });
    console.log('\n\x1b[90m(Run with -t or --target to specify another workspace directory)\x1b[0m\n');
    return;
  }

  const runCommandWrapper = (cmdStr) => {
    console.clear();
    const targetFlag = options.target === process.cwd() ? '' : ` --target "${options.target}"`;
    console.log(`\n\x1b[36mRunning Command:\x1b[0m npx multimodel-dev-os ${cmdStr}${targetFlag}`);
    console.log('--------------------------------------------------\n');
    try {
      const cliPath = join(sourceRoot, 'bin', 'multimodel-dev-os.js');
      execSync(`node "${cliPath}" ${cmdStr} --target "${options.target}"`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`\n\x1b[31mCommand failed with error: ${e.message}\x1b[0m`);
    }
    console.log('\n--------------------------------------------------');
    console.log('Press any key to return to menu...');
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    return new Promise(resolve => {
      process.stdin.once('keypress', () => {
        resolve();
      });
    });
  };

  const showMenu = (menuItems, title) => {
    selectMenu(title, menuItems, async (selected) => {
      if (selected.action === 'exit') {
        process.exit(0);
      } else if (selected.action === 'back') {
        showMenu(mainMenu, 'MultiModel Dev OS Command Center');
      } else if (selected.action === 'submenu') {
        showMenu(submenus[selected.menu], selected.name);
      } else if (selected.action === 'command') {
        await runCommandWrapper(selected.command);
        showMenu(menuItems, title);
      }
    });
  };

  showMenu(mainMenu, 'MultiModel Dev OS Command Center');
}
