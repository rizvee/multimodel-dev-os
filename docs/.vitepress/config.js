export default {
  base: '/multimodel-dev-os/',
  title: 'MultiModel Dev OS',
  description: 'Portable, vendor-neutral AI Developer OS for multi-agent coding workflows.',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/multimodel-dev-os/favicon.png', type: 'image/png' }],
    ['link', { rel: 'canonical', href: 'https://rizvee.github.io/multimodel-dev-os/' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    ['meta', { name: 'application-name', content: 'MultiModel Dev OS' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'MultiModel Dev OS' }],
    ['meta', { property: 'og:title', content: 'MultiModel Dev OS' }],
    ['meta', { property: 'og:description', content: 'Portable AI Dev OS for Codex, Antigravity, Cursor, Claude, Gemini, VS Code, and multimodel coding workflows.' }],
    ['meta', { property: 'og:image', content: 'https://rizvee.github.io/multimodel-dev-os/assets/social-preview.svg' }],
    ['meta', { property: 'og:url', content: 'https://rizvee.github.io/multimodel-dev-os/' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'MultiModel Dev OS' }],
    ['meta', { name: 'twitter:description', content: 'Portable AI Dev OS for Codex, Antigravity, Cursor, Claude, Gemini, VS Code, and multimodel coding workflows.' }],
    ['meta', { name: 'twitter:image', content: 'https://rizvee.github.io/multimodel-dev-os/assets/social-preview.svg' }],
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
        'softwareVersion': '4.0.0',
        'description': 'Portable, vendor-neutral AI Developer OS for multi-agent coding workflows.'
      })
    ]
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Templates', link: '/templates/' },
      { text: 'GitHub', link: 'https://github.com/rizvee/multimodel-dev-os' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Interactive CLI Demo', link: '/demo' },
          { text: 'FAQ', link: '/faq' }
        ]
      },
      {
        text: 'Demo Workflows',
        items: [
          { text: 'Demo Hub', link: '/demos/' },
          { text: 'Existing Repo Onboarding', link: '/demos/existing-repo-onboarding' },
          { text: 'Adapter Sync', link: '/demos/adapter-sync' },
          { text: 'Safe Improvement Loop', link: '/demos/safe-improvement-loop' },
          { text: 'Multi-Agent Handoff', link: '/demos/multi-agent-handoff' },
          { text: 'Release Check', link: '/demos/release-check' }
        ]
      },
      {
        text: 'Repo Onboarding & Adapters',
        items: [
          { text: 'Real Repo Onboarding', link: '/real-repo-onboarding' },
          { text: 'IDE Adapter Sync', link: '/adapter-sync' },
          { text: 'Template Recommendation', link: '/template-recommendation' }
        ]
      },
      {
        text: 'Protocol & QA Specifications',
        items: [
          { text: 'Protocol Specification', link: '/protocol' },
          { text: 'Stable Protocol Specification', link: '/stable-protocol' },
          { text: 'Adapter Compatibility', link: '/compatibility' },
          { text: 'Upgrades & Migration', link: '/migration-guide' },
          { text: 'v2 Migration Guide', link: '/v2-migration' },
          { text: 'v2 Release Checklist', link: '/v2-release-checklist' },
          { text: 'Package Safety', link: '/package-safety' },
          { text: 'Templates QA Blueprint', link: '/template-qa' },
          { text: 'v1.0.0 Readiness Checklist', link: '/v1-readiness' }
        ]
      },
      {
        text: 'Model Compatibility Layer',
        items: [
          { text: 'Model Capabilities Registry', link: '/model-compatibility' },
          { text: 'Model Routing & Presets', link: '/model-routing' },
          { text: 'Local & Offline Models', link: '/local-models' },
          { text: 'API Provider Strategy', link: '/provider-strategy' }
        ]
      },
      {
        text: 'Agent & IDE Extensions',
        items: [
          { text: 'Agent Compatibility Mappings', link: '/agent-compatibility' },
          { text: 'Custom Adapters Guide', link: '/adapter-authoring' },
          { text: 'Template Authoring Guide', link: '/template-authoring' },
          { text: 'Skill Authoring Guide', link: '/skill-authoring' },
          { text: 'Structured Prompts', link: '/structured-prompts' },
          { text: 'Skill Registry', link: '/skill-registry' },
          { text: 'Skill OS CLI', link: '/skill-os-cli' },
          { text: 'Skill OS Migration Guide', link: '/skill-os-migration-guide' },
          { text: 'Skill OS Adoption Checklist', link: '/skill-os-adoption-checklist' },
          { text: 'Skill OS Authoring Reference', link: '/skill-os-authoring-reference' },
          { text: 'Skill OS Examples', link: '/skill-os-examples' },
          { text: 'Business Operator Layer', link: '/business-operator-layer' },
          { text: 'Tool Permissions', link: '/tool-permissions' },
          { text: 'Agent Clusters', link: '/agent-clusters' },
          { text: 'Hooks and Guardrails', link: '/hooks-and-guardrails' },
          { text: 'Registry Contribution Guide', link: '/registry-contribution' }
        ]
      },
      {
        text: 'Mobile Integration & Delivery',
        items: [
          { text: 'Expo Android Delivery', link: '/mobile-android' }
        ]
      },
      {
        text: 'Token Cost Optimization',
        items: [
          { text: 'Token Budgets & Optimization', link: '/token-optimization' }
        ]
      },
      {
        text: 'Case Studies & Playbooks',
        items: [
          { text: 'Case Studies Gallery', link: '/case-studies/' },
          { text: 'Next.js SaaS Full-Stack', link: '/case-studies/nextjs-saas' },
          { text: 'WordPress Theme & Plugins', link: '/case-studies/wordpress-site' },
          { text: 'E-Commerce State webhooks', link: '/case-studies/ecommerce-store' },
          { text: 'SEO Landing Page Performance', link: '/case-studies/seo-landing-page' },
          { text: 'Multi-Model Handoff Protocols', link: '/case-studies/multimodel-handoff' }
        ]
      },
      {
        text: 'Adoption & Optimization',
        items: [
          { text: 'Cost Optimization Playbook', link: '/cost-optimization' },
          { text: '5-Day Adoption Roadmap', link: '/5-day-roadmap' }
        ]
      },
      {
        text: 'Core Features',
        items: [
          { text: 'Command Line Reference', link: '/CLI' },
          { text: 'Architecture Specifications', link: '/architecture' },
          { text: 'Adapters Setup Guide', link: '/adapters' },
          { text: 'Caveman Mode Specifications', link: '/caveman-mode' }
        ]
      },
      {
        text: 'Templates & Use Cases',
        items: [
          { text: 'Template Gallery', link: '/templates/' },
          { text: 'Before/After Workflows', link: '/workflow-examples' },
          { text: 'Use Cases Guide', link: '/use-cases' },
          { text: 'Templates Architecture', link: '/templates-guide' }
        ]
      },
      {
        text: 'Self-Improvement Engine',
        items: [
          { text: 'Self-Improving Codebase', link: '/self-improving-codebase' },
          { text: 'Improvement Proposals', link: '/improvement-proposals' },
          { text: 'Feedback Learning Loop', link: '/feedback-learning' },
          { text: 'Hash-Compressed Memory', link: '/hash-compressed-memory' },
          { text: 'Learning Rules', link: '/learning-rules' },
          { text: 'Approved Proposal Application', link: '/approved-proposal-apply' },
          { text: 'Repository Command Center', link: '/repository-command-center' },
          { text: 'Workflow Orchestration', link: '/workflow-orchestration' },
          { text: 'Agent Handoff Spec', link: '/agent-handoff' },
          { text: 'Interactive TUI Dashboard', link: '/dashboard' },
          { text: 'Declarative Plugin Hooks', link: '/plugin-hooks' },
          { text: 'Plugin Authoring Guide', link: '/plugin-authoring' },
          { text: 'TUI & Plugin Safety', link: '/tui-safety' },
          { text: 'Workflow Marketplace Catalog', link: '/catalog' },
          { text: 'Curated Plugin Catalog', link: '/plugin-catalog' },
          { text: 'Workflow Marketplace Guide', link: '/workflow-marketplace' },
          { text: 'Catalog Authoring Guide', link: '/catalog-authoring' }
        ]
      },
      {
        text: 'Trusted Registry & Governance',
        items: [
          { text: 'Registry Sync Guide', link: '/registry-sync' },
          { text: 'Trusted Registries', link: '/trusted-registries' },
          { text: 'Registry Policy Engine', link: '/registry-policy' },
          { text: 'Registry Security Model', link: '/registry-security' },
          { text: 'Registry Security Threat Model', link: '/security-threat-model' },
          { text: 'Remote Catalog Authoring', link: '/remote-catalog-authoring' }
        ]
      },
      {
        text: 'Distribution & Release',
        items: [
          { text: 'Distribution Guide', link: '/distribution' },
          { text: 'Release State', link: '/release-state' },
          { text: 'NPM Publishing Runbook', link: '/npm-publishing' },
          { text: 'GitHub Packages', link: '/github-packages' },
          { text: 'Release Playbook Template', link: '/release-template' },
          { text: 'Public Launch Checklist', link: '/launch-checklist' },
          { text: 'Launch & Sharing Kit', link: '/launch-kit' },
          { text: 'Future AI OS Roadmap', link: '/future-ai-os-roadmap' },
          { text: 'v4.1 Skill OS Plan', link: '/v4.1-skill-os-foundation-plan' },
          { text: 'CLI Roadmap', link: '/cli-roadmap' },
          { text: 'v3 Roadmap', link: '/v3-roadmap' },
          { text: 'v3.5.0 Release Readiness', link: '/v3.5.0-readiness' },
          { text: 'Release Policy', link: '/release-policy' },
          { text: 'Support Policy', link: '/support-policy' },
          { text: 'Pre-flight Release Testing', link: '/testing' },
          { text: 'Final Launch Guidelines', link: '/final-launch' },
          { text: 'v1.0.0 Release Checklist', link: '/v1-checklist' }
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
