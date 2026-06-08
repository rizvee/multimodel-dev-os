# Custom IDE Adapter Authoring Guide

MultiModel Dev OS is fully extensible. Developers and teams can build custom adapters to route protocol directives to new IDE interfaces, command-line coding agents, or company-proprietary AI environments.

---

## Authoring Workflow

To construct a new adapter:

### 1. Register the Adapter Metadata
Open [.ai/adapters/registry.yaml](file:///F:/multimodel-dev-os/.ai/adapters/registry.yaml) and declare the adapter properties:
```yaml
adapters:
  my-custom-agent:
    name: "My Custom Agent"
    config_file: ".mycustomrules"
    type: "coding-agent"
    docs: "docs/adapters/my-custom-agent.md"
```

### 2. Scaffold the Adapter Assets
Create the adapter assets directory under `adapters/my-custom-agent/`:
* **`adapters/my-custom-agent/setup.md`**: Guide for developers enabling this adapter.
* **`adapters/my-custom-agent/.mycustomrules`**: Rule boilerplate template which contains variables (e.g. system prompts or build scripts references) to be copied to project root during CLI initialization.

### 3. Register in CLI
Open `bin/multimodel-dev-os.js` and extend the `handleInit` mapping:
```javascript
} else if (adapter === 'my-custom-agent') {
  const srcFile = join(sourceRoot, 'adapters/my-custom-agent/.mycustomrules');
  const destFile = join(options.target, '.mycustomrules');
  if (existsSync(srcFile)) {
    writeFileSync(destFile, readFileSync(srcFile));
  }
}
```

### 4. Verify Compliance
Extend `scripts/verify.js` to ensure the new files are verified:
```javascript
checkFile('adapters/my-custom-agent/setup.md');
checkFile('adapters/my-custom-agent/.mycustomrules');
```

Run `npm run verify` to confirm all assertions pass cleanly.
