# Context Routing & Token Optimization Skill

> Instructions for actively selecting only necessary context files to pass to a model's prompt.

## Protocol
1. Calculate the active token budget.
2. Select only relevant files (e.g., frontend task -> do not include database/devops context).
3. Switch config to Caveman Mode if nearing target budget limit.
