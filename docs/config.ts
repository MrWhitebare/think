import { createRequire } from 'module'
import { defineAdditionalConfig, type DefaultTheme } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('vitepress/package.json')

export default defineAdditionalConfig({

    title: "我的思考",

    description: '记录我的生活,思考我自己,记录灵感',

    lang: 'zh-Hans',

    themeConfig: {

        nav: nav(),

        sidebar: {
            '/blogs/': {
                base: '/blogs/',
                items: sidebarBlogs()
            },
            '/books/':{
                base: '/books/',
                items: sidebarBooks()
            }
        },

        editLink: {
            pattern: 'https://github.com/MrWhitebare/think/edit/main/docs/:path',
            text: '在 GitHub 上编辑此页面'
        },

        footer: {
            message: '基于 MIT 许可发布',
            copyright: '版权所有 © 2026-至今 Heisenberg'
        },

        docFooter: {
            prev: '上一页',
            next: '下一页'
        },

        outline: {
            label: '页面导航'
        },

        lastUpdated: {
            text: '最后更新于'
        },

        notFound: {
            title: '页面未找到',
            quote:
                '但如果你不改变方向，并且继续寻找，你可能最终会到达你所前往的地方。',
            linkLabel: '前往首页',
            linkText: '带我回首页'
        },

        langMenuLabel: '多语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        skipToContentLabel: '跳转到内容'

    }

})

function nav(): DefaultTheme.NavItem[] {
    return [
        {
            text: '博客',
            link: '/blogs/write-comments',
            activeMatch: '/blogs/'
        },
        {
            text: '我读的书',
            link: '/books/cosmos',
            activeMatch: '/books/'
        }
    ]
}

function sidebarBlogs(): DefaultTheme.SidebarItem[] {
    return [
        {
            text: "博客",
            collapsed: true,
            items: [
                { text: '如何写书评', link: 'write-comments' },
                { text: '2026年计划', link: 'plan-2026' },
                { text: '学习英语', link: 'learn-english' },
                { text: '2025年度总结', link: 'annual-summary-2025'},
                { text: '糟糕的一天', link: 'a-terrible-day' },
                { text: '关于我', link: 'about-me'},
                { text: '前端框架设计', link: 'synap-rs'},
                { text: '流程引擎', link:'flow'},
                { text: '随想', link:'casual-thoughts'},
                { text: '剖析我', link:'analyze-me'},
                { text: '控制的代价与生存的演化', link:'controlled' },
            ]
        },
        {
            text: "英语",
            collapsed: true,
            items:[
                {text:'语法俱乐部',link:'grammer-club'},
                {text:'生词本',link:'vocabulary-notebook'},
            ]
        },
        {
            text: "编程人生",
            collapsed: true,
            items:[
                {text:"前端性能优化",link:'performance-web'},
                {text:"记录一次iframe嵌入页面的问题",link:'same-site'},
                {text:"Java学习计划",link:"javaer"},
                {text:"PostgreSQL 外部表（Foreign Table）创建与问题排查指南",link:"pg-foreign"}
            ]
        }
    ]
}

function sidebarBooks():DefaultTheme.SidebarItem[]{
    return [
        {
            text:'我读的书',
            items:[
                { text: '宇宙', link: 'cosmos' },
            ]
        }
    ]
}