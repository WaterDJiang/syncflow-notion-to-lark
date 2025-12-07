<div align="center">
  <h1>SyncFlow · Notion → Lark Bitable</h1>
  <p>Map Notion properties to Lark Bitable fields and bulk import records with a clean, Apple-like UI.</p>
</div>

<p align="center">
  <a href="./README.zh.md">中文说明</a>
</p>

## Overview

SyncFlow is a Vite + React app that helps you:

- Connect a Notion database and a Feishu/Lark Bitable table
- Map Notion properties to Bitable fields
- Bulk import records using the official Bitable batch create API
- Store credentials locally (securely obfuscated) and support Chinese/English UI

The app opens with a landing page. Click “Start Sync” to enter the step-by-step wizard: Connect Notion → Connect Lark → Map Fields → Sync.

## Features

- Landing page with clear CTA and concise product intro
- Credential Manager modal: save Notion token, Lark App ID & Secret
- Lark tenant_access_token obtained automatically when needed
- Test Connection button to validate Base Token/Table ID and permissions
- Field name fallback for robust mapping display
- Bulk create via `/records/batch_create`, success count based on returned `items`
- i18n with `react-i18next`; local assets for icons to avoid ORB

## Getting Started

Prerequisites: Node.js 18+

1. Install dependencies:
   
   `npm install`

2. Run the app:
   
   `npm run dev`

3. Open Settings (top-right) and configure credentials:
   - Notion: Integration Token
   - Lark/Feishu: App ID, App Secret

4. Go through the wizard:
   - Connect Notion database
   - Select Lark Base Token and Table ID（可在多维表链接中找到 `/base/bascn...` 和 `tbl...`）
   - Map fields
   - Choose import limit and start sync

## Configuration

- Credentials are stored via local secure storage (`services/secureStorage.ts`). They are never sent to any server.
- Lark tenant token is resolved on demand and refreshed for 401/403.
- Saved tables let you reuse Base Token & Table ID; you can rename entries in Settings.

### Optional: Environment Variables

If you plan to use AI-assisted features, you can place an API key in `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

Currently the core sync flow does not require any env variables; all credentials are set in the Settings modal.

## Deployment

- Dev uses proxy paths `/notion` and `/lark/open-apis` configured in `vite.config.ts`.
- Production options:
  - Direct: app calls `https://api.notion.com` and `https://open.feishu.cn/open-apis` when `VITE_USE_SERVER_PROXY` is not set.
  - Server proxy: set `VITE_USE_SERVER_PROXY=true` and deploy with serverless functions under `api/` (Vercel-compatible). Frontend will call `/api/notion` and `/api/lark/open-apis`.
- Host under a root path or configure Vite `base` when deploying to a subpath.

### Enable server proxy (recommended for Feishu CORS)

1. Set `VITE_USE_SERVER_PROXY=true` in `.env` or build environment.
2. Deploy with Vercel (or compatible): `api/notion.ts` and `api/lark.ts` will forward requests to official APIs and add permissive CORS headers.
3. Keep credentials in Settings; no server secrets are stored.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview build locally

## Troubleshooting

- `Tenant token missing or expired` — verify App ID & Secret in Settings and click “验证凭证”
- `91403 Permission denied` — ensure the app is a collaborator with edit access on the Base/Table
- `FieldNameNotFound` — mapping writes by field name; re-fetch schema and confirm names are correct
- `No tables found in Base` — check Base Token、permissions，或在 ConfigStep 使用“Select from Base tables”
- Test Connection — shows “Base 正常 · 表 N · 字段 M” when tableId is provided

## Credits & More

Built with React, Vite, Tailwind-style utility classes, `lucide-react`, and `react-i18next`.

More works · `https://www.wattter.cn`
