import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, relative, isAbsolute, dirname, basename } from 'path';
import { createHash } from 'crypto';
import { parseYaml } from '../../core/yaml.js';

export function handleImprovePropose(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!options.dryRun && !existsSync(proposalsDir)) {
    mkdirSync(proposalsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const timestamp = `${dateStr}-${timeStr}`;
  const id = `proposal-${timestamp}`;

  const title = options.title || 'Auto-detected codebase optimization';
  let problem = 'No specific problems detected.';
  let evidence = 'N/A';
  let riskLevel = 'low';
  let affectedFiles = [];
  let suggestedChange = 'No code suggestions compiled.';
  let verifyCommand = 'npm run verify';
  let rollbackPlan = 'git checkout -- .';

  const gitignorePath = join(options.target, '.gitignore');
  const agentsPath = join(options.target, 'AGENTS.md');

  if (!existsSync(gitignorePath)) {
    problem = 'Missing .gitignore file in target workspace. AI agents may scan large build directories and run out of token context.';
    evidence = `.gitignore file is not present at root directory: ${options.target}`;
    affectedFiles = ['.gitignore'];
    suggestedChange = 'Create a standard .gitignore file to exclude node_modules, build/ and dist/ directories.';
    rollbackPlan = 'git clean -fd .gitignore';
  } else if (!existsSync(agentsPath)) {
    problem = 'Missing AGENTS.md document in target workspace. Models will lack stack-specific implementation blueprints.';
    evidence = `AGENTS.md file is not present at root directory: ${options.target}`;
    affectedFiles = ['AGENTS.md'];
    suggestedChange = 'Create an AGENTS.md document specifying the codebase development guidelines and framework profiles.';
    rollbackPlan = 'git clean -fd AGENTS.md';
  } else {
    problem = 'Outdated codebase memory index. Memory files need to be refreshed to sync with recent local changes.';
    evidence = 'Current memory.hash.json represents a previous commit state.';
    affectedFiles = ['.ai/intelligence/memory.hash.json', '.ai/intelligence/memory.summary.md'];
    suggestedChange = 'Refresh codebase memory index using multimodel-dev-os memory refresh CLI command.';
    riskLevel = 'low';
    verifyCommand = 'node bin/multimodel-dev-os.js memory refresh';
    rollbackPlan = 'git checkout -- .ai/intelligence/';
  }

  let md = `---
id: ${id}
created_at: ${now.toISOString()}
title: ${title}
problem: ${problem}
evidence: ${evidence}
risk_level: ${riskLevel}
affected_files:
`;
  affectedFiles.forEach(f => {
    md += `  - ${f}\n`;
  });
  md += `suggested_change: ${suggestedChange}
verify_command: ${verifyCommand}
rollback_plan: ${rollbackPlan}
approval_status: pending
---

# Codebase Improvement Proposal: ${title}

> [!WARNING]
> Manual approval is required before implementing this proposal. Edit the frontmatter metadata block to change \`approval_status\` to \`approved\` to authorize modifications.

## 1. Problem Description
${problem}

## 2. Evidence
${evidence}

## 3. Suggested Modifications
${suggestedChange}

## 4. Safety & Rollback Parameters
*   **Risk Level**: ${riskLevel.toUpperCase()}
*   **Verification Command**: \`${verifyCommand}\`
*   **Rollback Command**: \`${rollbackPlan}\`
*   **Approval Status**: PENDING (Manual approval required before implementation)
`;

  const proposalFile = join(proposalsDir, `${id}.md`);
  if (options.dryRun) {
    console.log(`\x1b[36m[DRY-RUN] WOULD WRITE PROPOSAL TO ${proposalFile}:\x1b[0m`);
    console.log(md);
  } else {
    writeFileSync(proposalFile, md, 'utf8');
    console.log(`✔ Created codebase improvement proposal: .ai/proposals/${id}.md`);
  }
}

export function handleImproveReview(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    console.log('No improvement proposals found.');
    return;
  }

  try {
    const files = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
    if (files.length === 0) {
      console.log('No improvement proposals found.');
      return;
    }

    console.log(`\n📋 \x1b[36mCodebase Improvement Proposals\x1b[0m`);
    console.log('==================================================');
    
    files.forEach(file => {
      const fullPath = join(proposalsDir, file);
      const content = readFileSync(fullPath, 'utf8');
      
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (!fmMatch) return;
      
      const fmContent = fmMatch[1];
      const metadata = parseYaml(fmContent) || {};
      
      const statusColor = metadata.approval_status === 'approved' ? '\x1b[32m' : metadata.approval_status === 'rejected' ? '\x1b[31m' : '\x1b[33m';
      console.log(`\n\x1b[34m* [${metadata.id || file.replace('.md', '')}] ${metadata.title || 'Untitled'}\x1b[0m`);
      console.log(`  \x1b[37mRisk Level:\x1b[0m ${metadata.risk_level || 'unknown'}`);
      console.log(`  \x1b[37mStatus:\x1b[0m ${statusColor}${metadata.approval_status || 'pending'}\x1b[0m`);
      console.log(`  \x1b[37mProblem:\x1b[0m ${metadata.problem || 'N/A'}`);
      if (metadata.affected_files && metadata.affected_files.length > 0) {
        console.log(`  \x1b[37mAffected Files:\x1b[0m ${metadata.affected_files.join(', ')}`);
      }
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to review proposals: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

export function handleImproveStatus(options) {
  const proposalsDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(proposalsDir)) {
    console.log('Improvement Proposal Engine Status:');
    console.log('  Total Proposals:  0');
    console.log('  Pending Approval: 0');
    return;
  }

  try {
    const files = readdirSync(proposalsDir).filter(f => f.startsWith('proposal-') && f.endsWith('.md'));
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    files.forEach(file => {
      const content = readFileSync(join(proposalsDir, file), 'utf8');
      const fmMatch = content.match(/^---([\s\S]*?)---/);
      if (fmMatch) {
        const metadata = parseYaml(fmMatch[1]) || {};
        const status = metadata.approval_status || 'pending';
        if (status === 'approved') approved++;
        else if (status === 'rejected') rejected++;
        else pending++;
      }
    });

    console.log(`\n⚙ \x1b[36mImprovement Proposals Engine Status\x1b[0m`);
    console.log('==================================================');
    console.log(`  Total Proposals:  ${files.length}`);
    console.log(`  Pending Approval: \x1b[33m${pending}\x1b[0m`);
    console.log(`  Approved:         \x1b[32m${approved}\x1b[0m`);
    console.log(`  Rejected:         \x1b[31m${rejected}\x1b[0m`);
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError: Failed to fetch status: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}

export function getSha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function validatePath(targetRoot, relPath) {
  const normalizedRel = relPath.replace(/\\/g, '/');
  
  if (normalizedRel.startsWith('/') || normalizedRel.includes('..')) {
    return { valid: false, reason: `Path '${relPath}' contains directory traversal or is absolute.`, type: 'outside' };
  }

  const resolved = resolve(targetRoot, relPath);
  const relativeFromRoot = relative(targetRoot, resolved);
  
  if (relativeFromRoot.startsWith('..') || isAbsolute(relativeFromRoot) || resolved === targetRoot) {
    return { valid: false, reason: `Path '${relPath}' resolves outside the target root.`, type: 'outside' };
  }

  const parts = relativeFromRoot.replace(/\\/g, '/').split('/');
  
  const protectedFolders = [
    '.git',
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage'
  ];
  for (const part of parts) {
    if (protectedFolders.includes(part)) {
      return { valid: false, reason: `Path '${relPath}' attempts to access protected directory '${part}/'.`, type: 'protected' };
    }
  }

  const cleanRelativeFromRoot = relativeFromRoot.replace(/\\/g, '/');
  if (cleanRelativeFromRoot.startsWith('docs/.vitepress/dist') || cleanRelativeFromRoot.startsWith('docs/.vitepress/cache')) {
    return { valid: false, reason: `Path '${relPath}' attempts to access protected vitepress path.`, type: 'protected' };
  }

  const filename = parts[parts.length - 1];
  if (filename === '.env' || filename.startsWith('.env.') || filename === '.npmrc' || filename === 'credentials.json' || filename === 'package-lock.json' || filename === 'apply-log.jsonl') {
    return { valid: false, reason: `Path '${relPath}' targets a protected config/secret file.`, type: 'protected' };
  }
  if (filename.endsWith('.pem') || filename.endsWith('.key') || filename.endsWith('.jks') || filename.endsWith('.keystore')) {
    return { valid: false, reason: `Path '${relPath}' targets a protected key/certificate file.`, type: 'protected' };
  }

  return { valid: true, resolved };
}

export function validateProposal(proposalFile, targetRoot) {
  const gates = {
    frontmatter: { status: 'skip' },
    approval: { status: 'skip' },
    json: { status: 'skip' },
    types: { status: 'skip' },
    boundaries: { status: 'skip' },
    permissions: { status: 'skip' },
    constraints: { status: 'skip' }
  };

  if (!existsSync(proposalFile)) {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }

  const content = readFileSync(proposalFile, 'utf8');
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }
  const fmContent = fmMatch[1];
  const metadata = parseYaml(fmContent);
  if (!metadata || typeof metadata !== 'object') {
    gates.frontmatter = { status: 'fail', reason: 'missing frontmatter' };
    return { valid: false, reason: 'missing frontmatter', gates };
  }

  gates.frontmatter = { status: 'pass' };
  const proposalId = metadata.id || basename(proposalFile, '.md');
  const proposalTitle = metadata.title || 'Untitled Proposal';
  const proposalStatus = metadata.approval_status || 'pending';

  const isApproved = (metadata.approval_status === 'approved');
  gates.approval = isApproved ? { status: 'pass' } : { status: 'fail', reason: 'approval_status not approved' };

  const body = content.substring(fmMatch[0].length);
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n\s*```/;
  const jsonMatch = body.match(jsonBlockRegex);
  
  let operationsData = null;
  if (!jsonMatch) {
    gates.json = { status: 'fail', reason: 'no operations block' };
  } else {
    try {
      operationsData = JSON.parse(jsonMatch[1]);
      if (!operationsData || !Array.isArray(operationsData.operations) || operationsData.operations.length === 0) {
        gates.json = { status: 'fail', reason: 'no operations block' };
      } else {
        gates.json = { status: 'pass' };
      }
    } catch (e) {
      gates.json = { status: 'fail', reason: 'invalid JSON operations block' };
    }
  }

  if (gates.json.status !== 'pass') {
    const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];
    let firstFailReason = null;
    for (const g of gateOrder) {
      if (gates[g].status === 'fail') {
        firstFailReason = gates[g].reason;
        break;
      }
    }
    return {
      valid: false,
      reason: firstFailReason,
      gates,
      proposalId,
      proposalTitle,
      proposalStatus,
      operations: []
    };
  }

  let typesStatus = 'pass';
  let typesReason = '';
  let boundariesStatus = 'pass';
  let boundariesReason = '';
  let permissionsStatus = 'pass';
  let permissionsReason = '';
  let constraintsStatus = 'pass';
  let constraintsReason = '';

  const validatedOperations = [];
  const operations = operationsData.operations;

  for (let idx = 0; idx < operations.length; idx++) {
    const op = operations[idx];
    if (!op || typeof op !== 'object' || !op.type) {
      if (typesStatus === 'pass') {
        typesStatus = 'fail';
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    
    const allowedTypes = ['create_file', 'append_line', 'replace_text'];
    if (!allowedTypes.includes(op.type)) {
      if (typesStatus === 'pass') {
        typesStatus = 'fail';
        typesReason = `unsupported operation type`;
      }
      continue;
    }
    
    if (typeof op.path !== 'string' || !op.path.trim()) {
      if (boundariesStatus === 'pass') {
        boundariesStatus = 'fail';
        boundariesReason = `path outside target`;
      }
      continue;
    }
    
    const pathVal = validatePath(targetRoot, op.path);
    if (!pathVal.valid) {
      if (pathVal.type === 'outside') {
        if (boundariesStatus === 'pass') {
          boundariesStatus = 'fail';
          boundariesReason = `path outside target`;
        }
      } else if (pathVal.type === 'protected') {
        if (permissionsStatus === 'pass') {
          permissionsStatus = 'fail';
          permissionsReason = `protected path`;
        }
      }
      continue;
    }
    const resolvedPath = pathVal.resolved;
    
    if (op.type === 'create_file') {
      if (typeof op.content !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`;
        }
      } else if (existsSync(resolvedPath) && !op.overwrite) {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `create_file target exists without overwrite`;
        }
      }
    } else if (op.type === 'append_line') {
      if (typeof op.line !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`;
        }
      }
    } else if (op.type === 'replace_text') {
      if (typeof op.find !== 'string' || typeof op.replace !== 'string') {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `unsupported operation type`;
        }
      } else if (!existsSync(resolvedPath)) {
        if (constraintsStatus === 'pass') {
          constraintsStatus = 'fail';
          constraintsReason = `replace_text zero matches`;
        }
      } else {
        const fileContent = readFileSync(resolvedPath, 'utf8');
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }
        
        if (count === 0) {
          if (constraintsStatus === 'pass') {
            constraintsStatus = 'fail';
            constraintsReason = `replace_text zero matches`;
          }
        } else if (count > 1 && !op.allow_multiple) {
          if (constraintsStatus === 'pass') {
            constraintsStatus = 'fail';
            constraintsReason = `replace_text multiple matches without allow_multiple`;
          }
        }
      }
    }
    
    validatedOperations.push({
      ...op,
      resolvedPath
    });
  }

  gates.types = { status: typesStatus, reason: typesReason };
  gates.boundaries = { status: boundariesStatus, reason: boundariesReason };
  gates.permissions = { status: permissionsStatus, reason: permissionsReason };
  gates.constraints = { status: constraintsStatus, reason: constraintsReason };

  const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];
  let firstFailReason = null;
  for (const g of gateOrder) {
    if (gates[g].status === 'fail') {
      firstFailReason = gates[g].reason;
      break;
    }
  }

  const valid = (firstFailReason === null);
  return {
    valid,
    reason: firstFailReason,
    gates,
    proposalId,
    proposalTitle,
    proposalStatus,
    operations: valid ? validatedOperations : []
  };
}

export function handleImproveValidate(proposalFile, options) {
  console.log(`🛡  \x1b[34mValidating improvement proposal: ${proposalFile}\x1b[0m\n`);
  const validation = validateProposal(proposalFile, options.target);
  
  if (validation.proposalId) {
    console.log(`Proposal ID: \x1b[33m${validation.proposalId}\x1b[0m`);
    console.log(`Title:       \x1b[37m${validation.proposalTitle}\x1b[0m`);
    console.log(`Status:      ${validation.proposalStatus === 'approved' ? '\x1b[32m' : '\x1b[31m'}${validation.proposalStatus}\x1b[0m\n`);
  }

  console.log(`Safety Gate Checklist:`);
  
  const gateLabels = {
    frontmatter: 'Frontmatter Metadata',
    approval: 'Approval Status',
    json: 'Operations JSON Block',
    types: 'Operation Type Safety',
    boundaries: 'Path Boundaries (Within Target Root)',
    permissions: 'Path Permissions (No Protected Paths)',
    constraints: 'Operation Constraints (Overwrites & Replacements)'
  };

  const gateOrder = ['frontmatter', 'approval', 'json', 'types', 'boundaries', 'permissions', 'constraints'];

  gateOrder.forEach(g => {
    const gate = validation.gates[g];
    const label = gateLabels[g];
    if (gate.status === 'pass') {
      console.log(`  \x1b[32m[✓]\x1b[0m ${label}`);
    } else if (gate.status === 'fail') {
      console.log(`  \x1b[31m[✗]\x1b[0m ${label} - \x1b[31m${gate.reason}\x1b[0m`);
    } else {
      console.log(`  \x1b[37m[-]\x1b[0m ${label}`);
    }
  });
  console.log();

  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    console.error(`\x1b[33mActionable Fix:\x1b[0m`);
    if (validation.reason === 'missing frontmatter') {
      console.error(`  Please verify that the proposal file contains a valid YAML frontmatter block at the very top delimited by '---'.`);
    } else if (validation.reason === 'approval_status not approved') {
      console.error(`  The proposal approval status is not set to 'approved'. Edit the frontmatter block and set 'approval_status: approved'.`);
    } else if (validation.reason === 'no operations block') {
      console.error(`  No valid operations JSON block was found. Ensure a \`\`\`json block exists containing an "operations" array.`);
    } else if (validation.reason === 'invalid JSON operations block') {
      console.error(`  The operations block inside \`\`\`json is not valid JSON. Run it through a JSON validator to fix syntax errors.`);
    } else if (validation.reason === 'unsupported operation type') {
      console.error(`  An operation type is disallowed. Allowed types are: 'create_file', 'append_line', 'replace_text'.`);
    } else if (validation.reason === 'protected path') {
      console.error(`  An operation targets a protected directory (like .git, node_modules) or configuration file (like .env, .npmrc, apply-log.jsonl).`);
    } else if (validation.reason === 'path outside target') {
      console.error(`  An operation path tries to escape the target directory using directory traversal (..) or absolute paths.`);
    } else if (validation.reason === 'replace_text zero matches') {
      console.error(`  The 'find' text specified in a replace_text operation was not found in the target file.`);
    } else if (validation.reason === 'replace_text multiple matches without allow_multiple') {
      console.error(`  The 'find' text matched multiple times. Set 'allow_multiple: true' if you want to replace all occurrences.`);
    } else if (validation.reason === 'create_file target exists without overwrite') {
      console.error(`  The target file already exists. Set 'overwrite: true' in the operation to allow overwriting.`);
    } else {
      console.error(`  Check the proposal constraints and make sure all target files and fields are correct.`);
    }
    console.error();
    process.exit(1);
  }

  console.log(`\x1b[32m✔ Proposal is VALID and ready to be applied. ${validation.operations.length} operations parsed successfully.\x1b[0m\n`);
  process.exit(0);
}

export function handleImproveDiff(proposalFile, options) {
  console.log(`🔍  \x1b[36mGenerating diff for proposal: ${proposalFile}\x1b[0m\n`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    process.exit(1);
  }
  
  const operations = validation.operations;
  
  let createCount = 0;
  let appendCount = 0;
  let replaceCount = 0;
  const affectedFilesSet = new Set();
  
  operations.forEach(op => {
    affectedFilesSet.add(op.path);
    if (op.type === 'create_file') createCount++;
    else if (op.type === 'append_line') appendCount++;
    else if (op.type === 'replace_text') replaceCount++;
  });
  
  console.log(`Summary of Planned Changes:`);
  console.log(`---------------------------`);
  console.log(`Total Operations: \x1b[33m${operations.length}\x1b[0m`);
  console.log(`Operations Count: \x1b[32m${createCount} Create\x1b[0m, \x1b[33m${appendCount} Append\x1b[0m, \x1b[35m${replaceCount} Replace\x1b[0m`);
  console.log(`Affected Files (${affectedFilesSet.size}):`);
  affectedFilesSet.forEach(f => console.log(`  - ${f}`));
  console.log();

  const printTruncatedLines = (content, prefix, colorCode) => {
    const lines = content.split(/\r?\n/);
    const maxLines = 5;
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      console.log(`${colorCode}${prefix} ${lines[i]}\x1b[0m`);
    }
    if (lines.length > maxLines) {
      console.log(`${colorCode}${prefix} ... (${lines.length - maxLines} more lines)\x1b[0m`);
    }
  };

  const types = ['create_file', 'append_line', 'replace_text'];
  const typeHeaders = {
    create_file: '--- CREATE_FILE OPERATIONS ---',
    append_line: '--- APPEND_LINE OPERATIONS ---',
    replace_text: '--- REPLACE_TEXT OPERATIONS ---'
  };

  types.forEach(type => {
    const typeOps = operations.filter(op => op.type === type);
    if (typeOps.length === 0) return;

    console.log(`\x1b[36m\x1b[1m${typeHeaders[type]}\x1b[0m`);
    typeOps.forEach(op => {
      const idx = operations.indexOf(op);
      console.log(`\n\x1b[33m[Operation #${idx + 1}] Target: ${op.path}\x1b[0m`);

      if (type === 'create_file') {
        const exists = existsSync(op.resolvedPath);
        if (exists) {
          console.log(`  \x1b[31m⚠️   [Overwriting existing file]\x1b[0m`);
        } else {
          console.log(`  \x1b[32m+ [Creating new file]\x1b[0m`);
        }
        const linesCount = op.content.split(/\r?\n/).length;
        console.log(`  + [File content: ${linesCount} line(s), overwrite: ${!!op.overwrite}]`);
        printTruncatedLines(op.content, '  +', '\x1b[32m');
      } else if (type === 'append_line') {
        const exists = existsSync(op.resolvedPath);
        let currentFileContent = '';
        if (exists) {
          currentFileContent = readFileSync(op.resolvedPath, 'utf8');
        }
        const fileLines = currentFileContent.split(/\r?\n/);
        const lineExists = fileLines.some(l => l.trim() === op.line.trim());
        if (lineExists) {
          console.log(`  \x1b[33m[IDEMPOTENT] Line already exists in file. No changes will be made.\x1b[0m`);
        } else {
          console.log(`  \x1b[32m+ Appending line:\x1b[0m`);
          console.log(`  \x1b[32m+ ${op.line}\x1b[0m`);
        }
      } else if (type === 'replace_text') {
        console.log(`  --- a/${op.path}`);
        console.log(`  +++ b/${op.path}`);
        console.log(`  \x1b[31m- Removing:\x1b[0m`);
        printTruncatedLines(op.find, '  -', '\x1b[31m');
        console.log(`  \x1b[32m+ Inserting:\x1b[0m`);
        printTruncatedLines(op.replace, '  +', '\x1b[32m');
      }
    });
    console.log();
  });
}

export function handleImproveApply(proposalFile, options) {
  if (!options.approved) {
    console.error(`\x1b[31mError: Proposal cannot be applied without explicit user approval. Pass the --approved flag.\x1b[0m`);
    console.error(`Example: node bin/multimodel-dev-os.js improve apply ${proposalFile} --approved`);
    process.exit(1);
  }

  console.log(`🚀 \x1b[34mApplying proposal: ${proposalFile}\x1b[0m`);
  const validation = validateProposal(proposalFile, options.target);
  if (!validation.valid) {
    console.error(`\x1b[31mValidation FAILED: ${validation.reason}\x1b[0m`);
    
    // Log the refusal
    const applyId = `apply-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
    const logDir = join(options.target, '.ai', 'proposals');
    if (!existsSync(logDir)) {
      try { mkdirSync(logDir, { recursive: true }); } catch (e) {}
    }
    const logFile = join(logDir, 'apply-log.jsonl');
    const record = {
      id: applyId,
      proposal_id: validation.proposalId || basename(proposalFile, '.md'),
      applied_at: new Date().toISOString(),
      target: options.target,
      operations_count: 0,
      files_changed: [],
      before_hashes: {},
      after_hashes: {},
      status: 'refused',
      refused_reason: validation.reason,
      notes: `Validation failed: ${validation.reason}`
    };
    try {
      writeFileSync(logFile, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf8' });
    } catch (err) {}
    process.exit(1);
  }

  const operations = validation.operations;
  const proposalId = validation.proposalId;

  // Print compact operations summary
  const createCount = operations.filter(op => op.type === 'create_file').length;
  const appendCount = operations.filter(op => op.type === 'append_line').length;
  const replaceCount = operations.filter(op => op.type === 'replace_text').length;
  console.log(`Summary of Operations:`);
  console.log(`  - ${createCount} file(s) to create`);
  console.log(`  - ${appendCount} file(s) to append`);
  console.log(`  - ${replaceCount} file(s) to modify (replace)`);
  console.log(`\nApplying changes...`);

  const filesChanged = [];
  const beforeHashes = {};
  const afterHashes = {};
  let status = 'success';
  let notes = '';

  const applyId = `apply-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;

  try {
    operations.forEach(op => {
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, '/');
      if (!filesChanged.includes(relPath)) {
        filesChanged.push(relPath);
      }
      if (existsSync(op.resolvedPath)) {
        const fileContent = readFileSync(op.resolvedPath, 'utf8');
        beforeHashes[relPath] = getSha256(fileContent);
      } else {
        beforeHashes[relPath] = null;
      }
    });

    operations.forEach((op, idx) => {
      const relPath = relative(options.target, op.resolvedPath).replace(/\\/g, '/');
      console.log(`  Executing Operation #${idx + 1} (${op.type}) on '${relPath}'...`);

      if (op.type === 'create_file') {
        const dir = dirname(op.resolvedPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        const exists = existsSync(op.resolvedPath);
        writeFileSync(op.resolvedPath, op.content, 'utf8');
        if (exists) {
          console.log(`    [OVERWRITTEN] Overwrote existing file '${relPath}'.`);
        } else {
          console.log(`    [CREATED] Created new file '${relPath}'.`);
        }
      } else if (op.type === 'append_line') {
        let content = '';
        if (existsSync(op.resolvedPath)) {
          content = readFileSync(op.resolvedPath, 'utf8');
        }
        const fileLines = content.split(/\r?\n/);
        const lineExists = fileLines.some(l => l.trim() === op.line.trim());
        if (!lineExists) {
          let newContent = content;
          if (content.length > 0 && !content.endsWith('\n') && !content.endsWith('\r')) {
            newContent += '\n';
          }
          newContent += op.line + '\n';
          const dir = dirname(op.resolvedPath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(op.resolvedPath, newContent, 'utf8');
          console.log(`    [APPENDED] Appended 1 line to '${relPath}'.`);
        } else {
          console.log(`    [IDEMPOTENT] Line already exists in '${relPath}'. Skipping append.`);
        }
      } else if (op.type === 'replace_text') {
        const fileContent = readFileSync(op.resolvedPath, 'utf8');
        let count = 0;
        let pos = fileContent.indexOf(op.find);
        while (pos !== -1) {
          count++;
          pos = fileContent.indexOf(op.find, pos + op.find.length);
        }

        let newContent;
        if (op.allow_multiple) {
          newContent = fileContent.split(op.find).join(op.replace);
        } else {
          newContent = fileContent.replace(op.find, op.replace);
          if (count > 0) count = 1;
        }
        writeFileSync(op.resolvedPath, newContent, 'utf8');
        console.log(`    [REPLACED] Replaced ${count} occurrence(s) of find text in '${relPath}'.`);
      }
    });

    filesChanged.forEach(relPath => {
      const fullPath = resolve(options.target, relPath);
      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, 'utf8');
        afterHashes[relPath] = getSha256(fileContent);
      } else {
        afterHashes[relPath] = null;
      }
    });

    notes = `Successfully applied ${operations.length} operations.`;
  } catch (e) {
    status = 'failed';
    notes = `Execution error: ${e.message}`;
    console.error(`\x1b[31mError applying proposal: ${e.message}\x1b[0m`);
  }

  const logDir = join(options.target, '.ai', 'proposals');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  const logFile = join(logDir, 'apply-log.jsonl');
  
  const record = {
    id: applyId,
    proposal_id: proposalId,
    applied_at: new Date().toISOString(),
    target: options.target,
    operations_count: operations.length,
    files_changed: filesChanged,
    before_hashes: beforeHashes,
    after_hashes: afterHashes,
    status,
    refused_reason: status === 'failed' ? notes : undefined,
    notes
  };

  try {
    writeFileSync(logFile, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf8' });
  } catch (err) {
    console.error(`\x1b[31mFailed to write to audit log: ${err.message}\x1b[0m`);
  }

  if (status === 'success') {
    console.log(`\n\x1b[32m✔ Proposal applied successfully!\x1b[0m`);
    console.log(`Files changed:`);
    filesChanged.forEach(f => console.log(`  - ${f}`));
    console.log(`Audit log recorded to: ${logFile}`);
  } else {
    process.exit(1);
  }
}

export function handleImproveLog(options) {
  const logFile = join(options.target, '.ai', 'proposals', 'apply-log.jsonl');
  if (!existsSync(logFile)) {
    console.log('No apply log found.');
    return;
  }

  try {
    const lines = readFileSync(logFile, 'utf8').trim().split(/\r?\n/);
    console.log(`\n📜 \x1b[36mApplied Proposals Audit Log\x1b[0m`);
    console.log('==================================================');
    lines.forEach(line => {
      if (!line.trim()) return;
      const record = JSON.parse(line);
      const statusColor = record.status === 'success' ? '\x1b[32m' : '\x1b[31m';
      console.log(`\n\x1b[34m* [${record.id}] Proposal: ${record.proposal_id}\x1b[0m`);
      console.log(`  \x1b[37mApplied At:\x1b[0m ${record.applied_at}`);
      console.log(`  \x1b[37mOperations:\x1b[0m ${record.operations_count}`);
      console.log(`  \x1b[37mFiles Changed:\x1b[0m ${record.files_changed.join(', ')}`);
      console.log(`  \x1b[37mStatus:\x1b[0m ${statusColor}${record.status}\x1b[0m`);
      console.log(`  \x1b[37mNotes:\x1b[0m ${record.notes}`);
    });
    console.log();
  } catch (e) {
    console.error(`\x1b[31mError reading audit log: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}
