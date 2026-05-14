# 樱花魔法命运牌：主播体验版部署说明

这是一个 React + TypeScript + Vite 的静态 Web 应用，适合部署到 Vercel、Netlify 或 Cloudflare Pages。

## 推荐方式：Vercel

1. 将项目推送到 GitHub。
2. 打开 Vercel，点击 `Add New Project`。
3. 选择这个仓库。
4. Vercel 会读取 `vercel.json`，确认以下配置：
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 `Deploy`。
6. 部署完成后，把 Vercel 生成的 `https://...vercel.app` 链接发给主播体验。

## 摄像头权限提醒

摄像头手势识别需要安全上下文：

- 本地开发：`localhost` 可以使用摄像头。
- 线上体验：必须使用 `https://` 链接。
- 不建议把本地 `http://localhost:5174/` 发给主播，因为那只在你的电脑上有效。

## 主播体验说明

可以直接发给主播：

> 打开链接后允许摄像头权限。
> 伸出手掌唤醒星光牌阵。
> 左右挥动寻找共鸣卡牌。
> 捏手指锁定卡牌。
> 张开手掌完成召唤。
> 三张星牌归位后，会生成最终星之回应。

## 发布前检查

每次发布前建议执行：

```bash
npm run typecheck
npm run build
```

## 当前体验版默认行为

- 正式模式下隐藏真人摄像头画面。
- 摄像头仅用于手势识别。
- Debug 默认关闭，可按 `D` 打开。
- 默认低性能模式，降低摄像头分辨率和识别频率。
- 结果页不承诺真实概率，不做真实占卜。
