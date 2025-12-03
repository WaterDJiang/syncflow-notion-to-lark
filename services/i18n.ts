export type Lang = 'en' | 'zh';

type Dict = Record<string, Record<Lang, string>>;

const STORAGE_KEY = 'app_lang';

const dict: Dict = {
  connect_notion: { en: 'Connect Notion', zh: '连接 Notion' },
  connect_lark: { en: 'Connect Lark', zh: '连接飞书' },
  map_fields: { en: 'Map Fields', zh: '字段映射' },
  sync: { en: 'Sync', zh: '同步' },
  credentials_required: { en: 'Credentials Required', zh: '需要凭证' },
  open_settings: { en: 'Open Settings', zh: '打开设置' },
  continue: { en: 'Continue', zh: '继续' },
  connect_workspace: { en: 'Connect Workspace', zh: '连接工作区' },
  select_database: { en: 'Select Database', zh: '选择数据库' },
  choose_database: { en: 'Choose a database...', zh: '选择一个数据库...' },
  database_id_manual: { en: 'Database ID (manual)', zh: '数据库 ID（手动）' },
  saved_lark_tables: { en: 'Saved Lark Tables', zh: '已保存的飞书表' },
  base_token: { en: 'Base Token', zh: 'Base Token' },
  table_id: { en: 'Table ID', zh: '表 ID' },
  test_connection: { en: 'Test Connection', zh: '测试连接' },
  data_mapping: { en: 'Data Mapping', zh: '数据映射' },
  mapping_subtitle: { en: 'Match your Notion properties to Lark Base fields.', zh: '将 Notion 属性映射到飞书多维表字段。' },
  auto_map: { en: 'Auto-Map with AI', zh: 'AI 自动映射' },
  notion_source: { en: 'Notion Source', zh: 'Notion 来源' },
  lark_destination: { en: 'Lark Destination', zh: '飞书目标' },
  select_field: { en: 'Select Field', zh: '选择字段' },
  add_another_field: { en: 'Add Another Field', zh: '添加映射行' },
  confirm_configuration: { en: 'Confirm Configuration', zh: '确认配置' },
  sync_overview: { en: 'Sync Overview', zh: '同步概览' },
  notion_records: { en: 'Notion records', zh: 'Notion 记录数' },
  success: { en: 'Success', zh: '成功' },
  errors: { en: 'Errors', zh: '错误' },
  warnings: { en: 'Warnings', zh: '警告' },
  sync_limit: { en: 'Sync Limit', zh: '导入数量' },
  bulk_import: { en: 'Bulk Import', zh: '批量导入数据' },
  start_sync: { en: 'Start Sync', zh: '开始同步' },
  new_sync: { en: 'New Sync', zh: '重新同步' },
};

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) || 'zh';

export const getLang = (): Lang => currentLang;
export const setLang = (lang: Lang) => { currentLang = lang; localStorage.setItem(STORAGE_KEY, lang); };
export const t = (key: keyof typeof dict): string => dict[key]?.[currentLang] || dict[key]?.en || String(key);
