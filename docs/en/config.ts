import { createRequire } from 'module'
import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineAdditionalConfig({

    title: 'My Think',

    description: 'Record My Life,Think MySelf,My Inspiration',

    lang: 'en-US',

    themeConfig: {

        nav: nav(),

        sidebar: {
            '/en/blogs/': {
                base: '/en/blogs/',
                items: sidebarBlogs()
            },
            '/en/books/': {
                base: '/en/books/',
                items: sidebarBooks()
            }
        },

        // 1. 编辑链接
        editLink: {
            pattern: 'https://github.com/MrWhitebare/think/edit/main/docs/:path', // 编辑页面的 URL 模板
            text: 'Edit this page on GitHub' // 按钮文字
        },

        // 2. 页脚
        footer: {
            message: 'Released under the MIT License.', // 许可证信息
            copyright: 'Copyright © 2026-present Heisenberg' // 版权信息
        },

        // 3. 文档页脚（上一页 / 下一页）
        docFooter: {
            prev: 'Previous page', // 上一页
            next: 'Next page'      // 下一页
        },

        // 4. 侧边栏大纲标签
        outline: {
            label: 'On this page' // 页面导航标签
        },

        // 5. 最后更新时间
        lastUpdated: {
            text: 'Last updated on' // 前缀文字
        },

        // 6. 404 页面
        notFound: {
            title: 'Page not found', // 标题
            quote: 'If you do not change direction, you may end up where you are heading.', // 引用语
            linkLabel: 'Go to home', // 链接标签
            linkText: 'Take me home' // 链接文字
        },

        // 7. 多语言菜单标签
        langMenuLabel: 'Languages',

        // 8. 返回顶部按钮标签
        returnToTopLabel: 'Back to top',

        // 9. 侧边栏菜单标签
        sidebarMenuLabel: 'Menu',

        // 10. 深色模式切换标签
        darkModeSwitchLabel: 'Theme',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode',

        // 11. 跳转到内容标签
        skipToContentLabel: 'Skip to content'
    }
})

function nav(): DefaultTheme.NavItem[] {
    return [
        {
            text: 'Blog',
            link: '/en/blogs/markdown-examples',
            activeMatch: '/en/blogs/'
        },
        {
            text: 'My Book',
            link: '/en/books/',
            activeMatch: '/en/books/'
        }
    ]
}

function sidebarBlogs(): DefaultTheme.SidebarItem[] {
    return [
        {
            text: "Blog",
            collapsed: true,
            items: [
                { text: 'markdown-examples', link: 'markdown-examples' },
            ]
        }
    ]
}

function sidebarBooks(): DefaultTheme.SidebarItem[] {
    return [

    ]
}