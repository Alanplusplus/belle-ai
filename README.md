# Belle Website

Belle 的官方网站，面向 AI 个人形象分析应用，提供色彩分析、脸型分析、妆容分析、眼镜/珠宝搭配、名人相似度匹配等内容，并配有博客与指南。

- 线上地址：<https://www.aicoloranalysis.io>

## 技术栈

- [Next.js](https://nextjs.org)（App Router）+ React + TypeScript
- Tailwind CSS
- next-intl 多语言（en、zh、ja、ko、es、fr、de、ru、tr）
- next-auth 登录

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000) 即可预览。

## 常用命令

```bash
npm run build   # 生产构建
npm run start   # 启动生产服务
npm run lint    # 代码检查
```

## 目录结构

- `src/app`：页面与路由
- `src/components`：通用组件
- `src/content`：博客等内容
- `src/messages`：多语言文案
- `src/i18n`：国际化配置
- `scripts`：翻译、内容生成等辅助脚本
