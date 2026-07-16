#!/usr/bin/env node

/**
 * multimodel-dev-os strict cross-platform release verification script.
 * Orchestration entry point — delegates to modular verification sub-modules.
 * Checks that all required files and directories exist in their exact locations.
 * Runs on Windows, macOS, and Linux with zero external dependencies.
 */

import { checkLayout, checkUntrackedFiles } from './filesystem.js';
import { verifyPackage } from './package.js';
import { checkSecurityHygiene } from './security.js';
import {
  checkRegistryParsers,
  checkDashboardAndPlugins,
  checkCatalogAndMarketplace,
  checkCatalogSearchEmptyState,
  checkRegistryCLICommands,
  checkSecurityHotfixRegressions,
  checkSignedRegistryE2E
} from './registry.js';
import { checkMemoryBuildMention } from './docs.js';
import { checkDryRunVerifyCommand } from './tests.js';
import { checkBuildOutput } from './build.js';
import { checkYamlParserRegressions, checkRegistryPolicyEngine } from './policies.js';
import { checkSkillOsValidation } from './skill-os.js';
import { checkGatewayContracts } from './gateway-contracts.js';
import { checkGatewayRegistry } from './gateway-registry.js';
import { checkGatewayRouter } from './gateway-router.js';
import { checkGatewayResilience } from './gateway-resilience.js';
import { checkGatewayRuntime } from './gateway-runtime.js';
import { checkGatewayClients } from './gateway-clients.js';
import { reportResults } from './reporting.js';

console.log('multimodel-dev-os - Strict Release Audit Verification');
console.log('=====================================================');
console.log('');

// 1. Filesystem layout, required files, ignored files
checkLayout();

// 2. Registry parsers and syntax sanity
checkRegistryParsers();

// 3. CLI & packaging pre-flight (package.json, prepublish guard, npm pack)
verifyPackage();

// 4. Post-build generated CLI checks
checkBuildOutput();

// 5. TUI Dashboard & Plugin pre-flight
checkDashboardAndPlugins();

// 6. Catalog & Marketplace pre-flight
checkCatalogAndMarketplace();

// 7. YAML parser regression check (Catalog section in original)
checkYamlParserRegressions();

// 8. Catalog search empty state check
checkCatalogSearchEmptyState();

// 9. Docs memory build mention check
checkMemoryBuildMention();

// 10. Verify generated runtime files are not tracked
checkUntrackedFiles();

// 11. Verify npm pack dry-run and CLI verify command
checkDryRunVerifyCommand();

// 12. Registry & Policy Engine Verification
checkRegistryPolicyEngine();

// 13. Registry CLI command tests
checkRegistryCLICommands();

// 14. Security Hotfix v3.0.2 Regression checks
checkSecurityHotfixRegressions();

// 15. Registry Signing & Provenance Checks
checkSecurityHygiene();

// 16. Signed Registry E2E & Readiness Checks
checkSignedRegistryE2E();

// 17. Skill OS Foundation Verification
checkSkillOsValidation();

// 18. Gateway Protocol Contract Verification
checkGatewayContracts();

// 19. Gateway Runtime Registry Verification
checkGatewayRegistry();

// 20. Gateway Deterministic Router Verification
checkGatewayRouter();

// 21. Gateway Resilience Planning Verification
checkGatewayResilience();

// 22. Gateway Local Runtime Verification
await checkGatewayRuntime();

// 23. Gateway Client Integration Verification
await checkGatewayClients();

// 24. Final report
reportResults();
