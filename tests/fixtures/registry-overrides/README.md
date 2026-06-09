# Registry Overrides Test Fixture Guide

This fixture folder demonstrates and validates overriding the default model/adapter/template registries using custom YAML files and the `--registry` flag.

## Files Structure

For testing registry overrides, you can specify custom templates/adapters files:

* `custom-templates.yaml`: Defines mock template profiles.
* `custom-adapters.yaml`: Defines mock adapters setup.

## Usage in Testing

```bash
# List templates from the custom templates fixture file
node bin/multimodel-dev-os.js templates --registry tests/fixtures/registry-overrides/custom-templates.yaml

# Run validations on a custom template entry
node bin/multimodel-dev-os.js validate-template my-mock-template --registry tests/fixtures/registry-overrides/custom-templates.yaml
```
