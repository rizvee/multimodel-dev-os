import { stats, RED, GREEN, YELLOW, NC } from './utils.js';

export function reportResults() {
  console.log('\n=====================================================');
  const total = stats.pass + stats.fail + stats.warn;
  console.log(`  Pass: ${GREEN}${stats.pass}${NC}  Fail: ${RED}${stats.fail}${NC}  Warn: ${YELLOW}${stats.warn}${NC}  Total: ${total}`);

  if (stats.fail > 0) {
    console.error(`\n${RED}Verification failed. Fix issues listed above.${NC}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}Verification passed successfully.${NC}`);
    process.exit(0);
  }
}
