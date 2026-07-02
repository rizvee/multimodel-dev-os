#!/usr/bin/env node

/**
 * multimodel-dev-os strict cross-platform release verification script.
 * Entry point — delegates to the modular verification engine at scripts/verify/index.js.
 * Runs on Windows, macOS, and Linux with zero external dependencies.
 */

import './verify/index.js';
