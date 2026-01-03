import { defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin,
  localIconLoader
} from 'vitepress-plugin-group-icons'

const prod=!!process.env.NETLIFY

// https://vitepress.dev/reference/site-config
export default defineConfig({
  
  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  markdown:{
    math:true,
    image:{
      lazyLoading:true
    },
    codeTransformers: [
      // We use `[!!code` in demo to prevent transformation, here we revert it back.
      {
        postprocess(code) {
          return code.replace(/\[\!\!code/g, '[!code')
        }
      }
    ],
    config(md) {
      // TODO: remove when https://github.com/vuejs/vitepress/issues/4431 is fixed
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const { localeIndex = 'root' } = env
        const codeCopyButtonTitle = (() => {
          switch (localeIndex) {
            case 'es':
              return 'Copiar código'
            case 'fa':
              return 'کپی کد'
            case 'ko':
              return '코드 복사'
            case 'pt':
              return 'Copiar código'
            case 'ru':
              return 'Скопировать код'
            case 'zh':
              return '复制代码'
            case 'ja':
              return 'コードをコピー'
            default:
              return 'Copy code'
          }
        })()
        return fence(tokens, idx, options, env, self).replace(
          '<button title="Copy Code" class="copy"></button>',
          `<button title="${codeCopyButtonTitle}" class="copy"></button>`
        )
      }
      md.use(groupIconMdPlugin)
    }
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MrWhitebare/think' }
    ]
  },
  locales:{
    root:{
      label:'简体中文',
      lang:'zh-Hans',
      dir:"ltr"
    },
    en:{
      label:"English",
      lang:'en-US',
      dir:'ltr'
    }
  },

})
