export default {
  base: '/multimodel-dev-os/',
  title: 'MultiModel Dev OS',
  description: 'Portable, vendor-neutral AI Developer OS for multi-agent coding workflows.',
  ignoreDeadLinks: true,
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
          { text: 'Interactive CLI Demo', link: '/demo' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'FAQ', link: '/faq' }
        ]
      },
      {
        text: 'Protocol & QA Specifications',
        items: [
          { text: 'Protocol Specification', link: '/protocol' },
          { text: 'Stable Protocol Specification', link: '/stable-protocol' },
          { text: 'Adapter Compatibility', link: '/compatibility' },
          { text: 'Upgrades & Migration', link: '/migration-guide' },
          { text: 'Templates QA Blueprint', link: '/template-qa' },
          { text: 'v1.0.0 Readiness Checklist', link: '/v1-readiness' }
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
        text: 'Operations & Publishing',
        items: [
          { text: 'Public Launch Checklist', link: '/launch-checklist' },
          { text: 'Release Playbook Template', link: '/release-template' },
          { text: 'CLI Roadmap', link: '/cli-roadmap' },
          { text: 'NPM Publishing Runbook', link: '/npm-publishing' },
          { text: 'Pre-flight Release Testing', link: '/testing-v0.2' },
          { text: 'Release Policy', link: '/release-policy' },
          { text: 'Support Policy', link: '/support-policy' },
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
