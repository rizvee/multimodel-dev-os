export default {
  base: '/multimodel-dev-os/',
  title: 'MultiModel Dev OS',
  description: 'Portable, validation-first workspace and localhost gateway foundation for governed multi-agent development.',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/multimodel-dev-os/favicon.png', type: 'image/png' }],
    ['link', { rel: 'canonical', href: 'https://rizvee.github.io/multimodel-dev-os/' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'application-name', content: 'MultiModel Dev OS' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'MultiModel Dev OS' }],
    ['meta', { property: 'og:title', content: 'MultiModel Dev OS' }],
    ['meta', { property: 'og:description', content: 'Portable, validation-first workspace and localhost gateway foundation for governed multi-agent development.' }],
    ['meta', { property: 'og:image', content: 'https://rizvee.github.io/multimodel-dev-os/github-social-preview.svg' }],
    ['meta', { property: 'og:url', content: 'https://rizvee.github.io/multimodel-dev-os/' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'MultiModel Dev OS' }],
    ['meta', { name: 'twitter:description', content: 'Portable, validation-first workspace and localhost gateway foundation for governed multi-agent development.' }],
    ['meta', { name: 'twitter:image', content: 'https://rizvee.github.io/multimodel-dev-os/github-social-preview.svg' }],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'MultiModel Dev OS',
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Windows, macOS, Linux',
        'programmingLanguage': 'JavaScript',
        'license': 'https://opensource.org/licenses/MIT',
        'url': 'https://github.com/rizvee/multimodel-dev-os',
        'downloadUrl': 'https://www.npmjs.com/package/multimodel-dev-os',
        'softwareVersion': '4.2.0',
        'description': 'Portable, validation-first workspace and localhost gateway foundation for governed multi-agent development.'
      })
    ]
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Docs Map', link: '/documentation-map' },
      { text: 'Gateway', link: '/gateway-architecture' },
      { text: 'Skill OS', link: '/skill-os-cli' },
      { text: 'Security', link: '/gateway-security-model' },
      { text: 'Release v4.2.0', link: '/releases/v4.2.0' },
      { text: 'GitHub', link: 'https://github.com/rizvee/multimodel-dev-os' }
    ],
    sidebar: [
      {
        text: '1. Start Here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Documentation Map', link: '/documentation-map' },
          { text: 'Interactive CLI Demo', link: '/demo' },
          { text: 'FAQ', link: '/faq' }
        ]
      },
      {
        text: '2. Core Concepts & Architecture',
        items: [
          { text: 'Architecture Specifications', link: '/architecture' },
          { text: 'Future-Proof Architecture', link: '/future-proof-architecture' },
          { text: 'Protocol Specification', link: '/protocol' },
          { text: 'Stable Protocol Specification', link: '/stable-protocol' },
          { text: 'Package Safety Model', link: '/package-safety' }
        ]
      },
      {
        text: '3. CLI & Workflows',
        items: [
          { text: 'Command Line Reference', link: '/CLI' },
          { text: 'Real Repo Onboarding', link: '/real-repo-onboarding' },
          { text: 'Multimodel Workflow', link: '/multimodel-workflow' },
          { text: 'Workflow Orchestration', link: '/workflow-orchestration' },
          { text: 'Workflow Examples', link: '/workflow-examples' },
          { text: 'Caveman Mode Specifications', link: '/caveman-mode' }
        ]
      },
      {
        text: '4. Skill OS & Governance',
        items: [
          { text: 'Skill OS CLI', link: '/skill-os-cli' },
          { text: 'Skill Registry', link: '/skill-registry' },
          { text: 'Skill Authoring Guide', link: '/skill-authoring' },
          { text: 'Skill OS Authoring Reference', link: '/skill-os-authoring-reference' },
          { text: 'Skill OS Migration Guide', link: '/skill-os-migration-guide' },
          { text: 'Skill OS Adoption Checklist', link: '/skill-os-adoption-checklist' },
          { text: 'Skill OS Examples', link: '/skill-os-examples' },
          { text: 'Structured Prompts', link: '/structured-prompts' },
          { text: 'Business Operator Layer', link: '/business-operator-layer' },
          { text: 'Tool Permissions', link: '/tool-permissions' }
        ]
      },
      {
        text: '5. Gateway Foundation',
        items: [
          { text: 'Gateway Architecture', link: '/gateway-architecture' },
          { text: 'Gateway Protocol', link: '/gateway-protocol' },
          { text: 'Gateway OpenAI Compatibility', link: '/gateway-openai-compatibility' },
          { text: 'Gateway Runtime Registry', link: '/gateway-runtime-registry' },
          { text: 'Gateway Routing Engine', link: '/gateway-routing-engine' },
          { text: 'Gateway Routing Strategies', link: '/gateway-routing-strategies' },
          { text: 'Gateway Route Explanations', link: '/gateway-route-explanations' },
          { text: 'Gateway Resilience', link: '/gateway-resilience' },
          { text: 'Gateway Retry Policy', link: '/gateway-retry-policy' },
          { text: 'Gateway Circuit Breaker', link: '/gateway-circuit-breaker' },
          { text: 'Gateway Resilience Simulation', link: '/gateway-resilience-simulation' },
          { text: 'Gateway Runtime', link: '/gateway-runtime' },
          { text: 'Gateway Local Server', link: '/gateway-local-server' },
          { text: 'Gateway Mock Provider', link: '/gateway-mock-provider' },
          { text: 'Gateway Streaming', link: '/gateway-streaming' },
          { text: 'Gateway Authentication', link: '/gateway-authentication' },
          { text: 'Gateway Observability', link: '/gateway-observability' },
          { text: 'Gateway Usage Accounting', link: '/gateway-usage-accounting' },
          { text: 'Gateway Cost Estimation', link: '/gateway-cost-estimation' },
          { text: 'Gateway Request Tracing', link: '/gateway-request-tracing' },
          { text: 'Gateway Provider Health', link: '/gateway-provider-health' },
          { text: 'Gateway Audit Events', link: '/gateway-audit-events' },
          { text: 'Gateway Observability Security', link: '/gateway-observability-security' },
          { text: 'v4.2 Known Limitations', link: '/v4.2-known-limitations' }
        ]
      },
      {
        text: '6. Registries & Trust',
        items: [
          { text: 'Trusted Registries', link: '/trusted-registries' },
          { text: 'Registry Sync Guide', link: '/registry-sync' },
          { text: 'Registry Policy Engine', link: '/registry-policy' },
          { text: 'Registry Signing', link: '/registry-signing' },
          { text: 'Registry Trust Store', link: '/registry-trust-store' },
          { text: 'Registry Security Model', link: '/registry-security' },
          { text: 'Remote Catalog Authoring', link: '/remote-catalog-authoring' }
        ]
      },
      {
        text: '7. Adapters & Client Integrations',
        items: [
          { text: 'Adapters Setup Guide', link: '/adapters' },
          { text: 'IDE Adapter Sync', link: '/adapter-sync' },
          { text: 'Custom Adapters Guide', link: '/adapter-authoring' },
          { text: 'Agent Compatibility Mappings', link: '/agent-compatibility' },
          { text: 'Gateway Client Integrations', link: '/gateway-client-integrations' },
          { text: 'Gateway Client Compatibility', link: '/gateway-client-compatibility' },
          { text: 'Gateway Client Matrix', link: '/gateway-client-compatibility-matrix' },
          { text: 'Gateway Client Configuration', link: '/gateway-client-configuration' },
          { text: 'Gateway Antigravity', link: '/gateway-antigravity' },
          { text: 'Gateway Claude Code', link: '/gateway-claude-code' },
          { text: 'Gateway Codex', link: '/gateway-codex' },
          { text: 'Gateway Cursor', link: '/gateway-cursor' },
          { text: 'Gateway Cline & Roo', link: '/gateway-cline-roo' },
          { text: 'Gateway Continue', link: '/gateway-continue' },
          { text: 'Gateway Aider', link: '/gateway-aider' },
          { text: 'Gateway MCP Integration', link: '/gateway-mcp' },
          { text: 'Gateway Custom Clients', link: '/gateway-custom-clients' }
        ]
      },
      {
        text: '8. Security & Safety',
        items: [
          { text: 'Gateway Security Model', link: '/gateway-security-model' },
          { text: 'Security Threat Model', link: '/security-threat-model' },
          { text: 'Hooks and Guardrails', link: '/hooks-and-guardrails' },
          { text: 'TUI & Plugin Safety', link: '/tui-safety' }
        ]
      },
      {
        text: '9. Examples & Use Cases',
        items: [
          { text: 'Use Cases Guide', link: '/use-cases' },
          { text: 'Case Studies Gallery', link: '/case-studies/' },
          { text: 'Next.js SaaS Full-Stack', link: '/case-studies/nextjs-saas' },
          { text: 'WordPress Site', link: '/case-studies/wordpress-site' },
          { text: 'E-Commerce Store', link: '/case-studies/ecommerce-store' },
          { text: 'SEO Landing Page', link: '/case-studies/seo-landing-page' },
          { text: 'Multi-Model Handoff', link: '/case-studies/multimodel-handoff' }
        ]
      },
      {
        text: '10. Reference & Authoring',
        items: [
          { text: 'Template Gallery', link: '/templates/' },
          { text: 'Template Recommendation', link: '/template-recommendation' },
          { text: 'Template Authoring Guide', link: '/template-authoring' },
          { text: 'Plugin Authoring Guide', link: '/plugin-authoring' },
          { text: 'Catalog Authoring Guide', link: '/catalog-authoring' },
          { text: 'Model Capabilities Registry', link: '/model-compatibility' },
          { text: 'Model Routing & Presets', link: '/model-routing' },
          { text: 'Local & Offline Models', link: '/local-models' },
          { text: 'API Provider Strategy', link: '/provider-strategy' },
          { text: 'Gateway API Reference', link: '/gateway-api-reference' }
        ]
      },
      {
        text: '11. Contributing & Governance',
        items: [
          { text: 'Contributing Guide', link: '/contributing' },
          { text: 'Registry Contribution', link: '/registry-contribution' },
          { text: 'Support Policy', link: '/support-policy' },
          { text: 'Release Policy', link: '/release-policy' },
          { text: 'Self-Improving Codebase', link: '/self-improving-codebase' }
        ]
      },
      {
        text: '12. Releases & Historical Plans',
        items: [
          { text: 'Release v4.2.0', link: '/releases/v4.2.0' },
          { text: 'Release State', link: '/release-state' },
          { text: 'v4.2 Release Readiness', link: '/v4.2-release-readiness' },
          { text: 'v4.2 Gateway Planning (Archive)', link: '/v4.2-planning' },
          { text: 'v4.1 Skill OS Plan (Archive)', link: '/v4.1-skill-os-foundation-plan' },
          { text: 'v3 Roadmap (Archive)', link: '/v3-roadmap' },
          { text: 'Future AI OS Roadmap', link: '/future-ai-os-roadmap' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rizvee/multimodel-dev-os' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present MultiModel Dev OS team.'
    }
  }
}
