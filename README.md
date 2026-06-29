# Mammon 🏦

个人资产管理应用，帮助你追踪和管理你的实物资产、数字游戏/虚拟物品和订阅服务。

## 功能

- **仪表盘** — 资产概览、价值统计、订阅到期提醒
- **资产管理** — 添加、编辑、查看、删除资产
- **资产分类** — 实物、数字游戏/虚拟物品、订阅
- **状态追踪** — 在用、闲置、转卖、丢弃、赠送
- **订阅管理** — 月付/年付/自定义周期，到期提醒
- **数据导入/导出** — JSON 备份与恢复
- **明暗主题** — 支持亮色/暗色模式切换
- **全本地存储** — 所有数据保存在浏览器 IndexedDB，不上传服务器

## 技术栈

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via [idb](https://www.npmjs.com/package/idb))
- [next-themes](https://github.com/pacocoursey/next-themes)

## 本地开发

```bash
cd mammon
npm install
npm run dev
```

然后在浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 构建

```bash
npm run build
npm start
```
