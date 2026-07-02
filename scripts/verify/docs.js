import { readFileSync } from 'fs';
import { join } from 'path';
import { projectRoot, stats, RED, GREEN, NC } from './utils.js';

export function checkMemoryBuildMention() {
  try {
    const mdContent = readFileSync(join(projectRoot, 'docs', 'hash-compressed-memory.md'), 'utf8');
    if (mdContent.includes('memory build')) {
      console.log(`  ${GREEN}✓${NC} docs/hash-compressed-memory.md mentions 'memory build'`);
      stats.pass++;
    } else {
      console.error(`  ${RED}✗${NC} docs/hash-compressed-memory.md does not mention 'memory build'`);
      stats.fail++;
    }
  } catch (e) {
    console.error(`  ${RED}✗${NC} docs check failed: ${e.message}`);
    stats.fail++;
  }
}
