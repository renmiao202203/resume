import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "任妙的技术博客",
  description: "前端开发 · AI应用 · 技术分享",
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '简历', link: '/resume.html' },
      { text: '博客', link: '/blog/' }
    ],
    sidebar: {
      '/blog/': [
        {
          text: '前端技术',
          items: [
            { text: '前端项目工程基础', link: '/blog/前端项目工程基础知识' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/renmiao202203' }
    ],
    footer: {
      message: '用心记录每一个技术细节',
      copyright: '© 2026 任妙'
    }
  }
})