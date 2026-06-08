# Model Compatibility Registry

This directory contains the machine-readable configuration files for defining, mapping, and routing AI models inside MultiModel Dev OS.

## Registry Contents

- **`registry.yaml`**: Lists supported model definitions, capabilities (vision, tool use), cost and coding tiers.
- **`providers.yaml`**: Defines base API endpoints, headers, and required environment key variables.
- **`routing-presets.yaml`**: Standard presets for mapping specific workflow tasks (e.g. Planning, Auditing, Coding) to ideal model classes.
- **`local-models.yaml`**: Configures local offline engines (Ollama, Llama.cpp) and open-weight models.

## Usage in Workspaces

These files can be parsed by local CLI utilities or IDE assistants to dynamically route queries to the most cost-effective and task-appropriate model.
