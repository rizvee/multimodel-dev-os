# LLM Cost & Context Optimization Playbook

Maximizing developer velocity while minimizing LLM prompt overhead and API billing budgets is a critical priority for engineering teams. This playbook maps 12 industry cost-reduction techniques directly to native `multimodel-dev-os` features.

---

## Cost Optimization Matrix

Below is how the 12 core context optimization strategies are implemented inside the workspace configuration layer:

![Cost Optimization Funnel](/assets/cost-optimization.svg)

---

### 1. Choose the Right Model
- **The Strategy:** Deploying premium large models (e.g. Claude 3.5 Sonnet, GPT-4o) only for high-reasoning tasks and lightweight models for simple code syntax editing.
- **Dev OS Implementation:** [model-map.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/context/model-map.md) stores clear instructions routing Planner, Auditor, and Scaffolder tasks to their ideal cost-efficient models.

### 2. Reduce Input Tokens
- **The Strategy:** Avoid feeding massive developer rule guides, legacy wikis, or detailed style manuals on simple prompt turns.
- **Dev OS Implementation:** Toggling **Caveman Mode** (`--caveman`) strips descriptive descriptions and examples to slash prompt rules down to **~340 tokens (saving ~79% of input token context)**. The central [context-budget.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/context/context-budget.md) details guidelines on context sizes.

### 3. Limit Output Tokens
- **The Strategy:** Prevent models from generating verbose paragraphs, chatty conversational explanations, or redundant code structures.
- **Dev OS Implementation:** Decoupled prompt guidelines inside [.ai/prompts/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/prompts/) enforce strict prompt output contracts (e.g. "Only output the code diff, no chat").

### 4. Leverage Prompt Caching
- **The Strategy:** Structure system prompts and context buffers to match the exact patterns that cloud providers (like Anthropic, OpenAI) require for prompt caching.
- **Dev OS Implementation:** Shared workspace session logs under [.ai/session-logs/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/session-logs/) provide reusable, static summaries at the bottom of the prompt buffer to maximize caching hits.

### 5. RAG Done Right (Directory Scoping)
- **The Strategy:** Never feed an entire codebase to the prompt turn; instead, scope read inputs precisely.
- **Dev OS Implementation:** Modular files within [.ai/context/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/context/) break repository information into isolated briefs (project-brief, architecture, business-rules), allowing agents to load only required profiles.

### 6. Batch Requests
- **The Strategy:** Group simple micro-features into single comprehensive execution runs instead of engaging in iterative 3-word conversations.
- **Dev OS Implementation:** Centralized backlog tracking in [TASKS.md](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/TASKS.md) structures todo steps so agents can batch scaffold logical units in one message turn.

### 7. Enforce Structured Outputs
- **The Strategy:** Enforce strict parameters to avoid wasting model cycles guessing standard format definitions.
- **Dev OS Implementation:** Structured template outlines in [.ai/templates/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/templates/) and strict check contracts inside [.ai/checks/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/checks/) guarantee predictable code blocks on the first attempt.

### 8. Prompt and Skill Reuse
- **The Strategy:** Standardize system prompts and tool commands so developers aren't authoring customized instructions from scratch.
- **Dev OS Implementation:** Reusable routines under [.ai/prompts/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/prompts/) and custom agent scripts under [.ai/skills/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/skills/) form a shared, plug-and-play prompt library.

### 9. Multi-Step Pipelines (Planner/Coder/Reviewer)
- **The Strategy:** Split high-reasoning tasks from execution runs to avoid loading massive rules files during iterative code writes.
- **Dev OS Implementation:** Isolated agent specs inside [.ai/agents/](file:///c:/Users/ADMIN/OneDrive/Desktop/multimodel-dev-os/.ai/agents/) deploy a two-step approach where a Planner agent outlines changes, and a Coder agent writes the diff.

### 10. Monitor Usage & Auditing
- **The Strategy:** Continuously verify that developers' rules aren't getting cluttered or exceeding token limits.
- **Dev OS Implementation:** Compliance assertions using `npx multimodel-dev-os validate` and advisory checkups using `doctor` warn teams when context files grow too bloated.

### 11. Multi-Provider Strategy
- **The Strategy:** Prevent vendor-lock by designing adapters to translate instructions dynamically across different LLMs.
- **Dev OS Implementation:** Neutral mappings configured inside `model-map.md` allow switching model endpoints instantly without refactoring the central repository contracts.

### 12. Embedding Hygiene
- **The Strategy:** Ensure semantic search indexes only relevant source files instead of temporary distributions.
- **Dev OS Implementation:** Strict routing specifications mapped inside `context-routing.md` and pre-configured `.gitignore` definitions protect search databases from index pollution.
