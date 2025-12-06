<div align="center">
  <h1>SyncFlow · Notion → 飞书多维表</h1>
  <p>将 Notion 数据库记录映射到飞书多维表字段，并进行高效批量导入；界面简洁、动线清晰。</p>
</div>

## 概览

SyncFlow 是一个基于 Vite + React 的前端应用，用于：

- 连接 Notion 数据库与飞书/Feishu 的多维表（Bitable）
- 将 Notion 属性映射到多维表字段
- 使用官方批量创建接口进行高效写入
- 本地保存凭证（安全混淆），支持中英文界面切换

首页提供简介与操作入口。点击“开始同步”进入向导：连接 Notion → 连接飞书 → 字段映射 → 同步。

## 特性

- 落地页：清晰的产品说明与操作入口（Apple 风格版式）
- 凭证管理：在设置弹窗保存 Notion Token、飞书 App ID、App Secret
- 租户令牌：按需自动获取 `tenant_access_token`，401/403 时自动刷新
- 连接测试：一键测试 Base Token、表 ID 与权限是否有效
- 字段兜底：字段名称有缺失时进行兜底映射，保障映射面板稳定展示
- 批量导入：`/records/batch_create`，成功数以返回 `items` 严格计算
- i18n：`react-i18next` 实时切换；图标使用本地资源避免跨域/ORB

## 快速开始

前置条件：Node.js 18+

1. 安装依赖：

   `npm install`

2. 启动开发：

   `npm run dev`

3. 打开右上角“设置”，配置凭证：
   - Notion：Integration Token
   - 飞书/Feishu：App ID、App Secret

4. 依次完成向导：
   - 连接 Notion 数据库
   - 选择飞书 `Base Token` 与 `表 ID`（可在多维表链接中找到 `/base/bascn...` 与 `tbl...`）
   - 字段映射
   - 设置导入数量，开始同步

## 配置说明

- 凭证通过本地安全存储（`services/secureStorage.ts`）保存，不会上传到任何服务器
- 租户令牌在需要时自动获取；遇到 401/403 将强制刷新后重试
- “已保存的飞书表”可复用 Base Token 与表 ID；支持在设置页面重命名显示名称
- 测试连接会输出：
  - `Base 正常 · 表 N · 字段 M`（存在表 ID 时）
  - `Base 正常 · 表 N`（仅 Base 情况）

### 可选：环境变量

如需使用 AI 辅助能力，可在 `.env.local` 中设置：

```
GEMINI_API_KEY=your_key_here
```

当前核心同步功能不依赖任何环境变量；凭证均在设置弹窗中完成。

## 部署说明

- 开发环境通过 `vite.config.ts` 的代理使用 `/notion` 与 `/lark/open-apis` 路径。
- 生产环境会自动切换到 `https://api.notion.com` 与 `https://open.feishu.cn/open-apis`（在服务文件中通过 `import.meta.env.PROD` 判断）。
- 如部署在子路径（非根目录），请在 Vite 配置 `base` 或确保资源路径正确。

## 脚本

- `npm run dev` — 启动开发服务器
- `npm run build` — 生产构建
- `npm run preview` — 本地预览构建

## 常见问题

- `Tenant token missing or expired`：在设置中核对 App ID 与 Secret，并点击“验证凭证”
- `91403 Permission denied`：确保应用已作为协作者加入 Base/表，且拥有编辑权限
- `FieldNameNotFound`：写入按字段名称进行；请重新拉取表结构并确认字段名
- `No tables found in Base`：检查 Base Token 与权限，或在配置页使用“从 Base 表中选择”

## 致谢与更多

使用 React、Vite、Tailwind 风格工具类、`lucide-react`、`react-i18next` 构建。

更多作品 · `https://www.wattter.cn`
