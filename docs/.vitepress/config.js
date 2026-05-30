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
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'FAQ', link: '/faq' }
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
          { text: 'Use Cases Guide', link: '/use-cases' },
          { text: 'Templates Architecture', link: '/templates-guide' }
        ]
      },
      {
        text: 'Operations & Publishing',
        items: [
          { text: 'CLI Roadmap', link: '/cli-roadmap' },
          { text: 'NPM Publishing Runbook', link: '/npm-publishing' },
          { text: 'Pre-flight Release Testing', link: '/testing-v0.2' }
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
