import { FieldSchema } from '../types';

export const MOCK_NOTION_SCHEMA: FieldSchema[] = [
  { id: 'title', name: 'Task Name', type: 'text' },
  { id: 'status', name: 'Status', type: 'select' },
  { id: 'due_date', name: 'Due Date', type: 'date' },
  { id: 'assignee', name: 'Assignee', type: 'person' },
  { id: 'priority', name: 'Priority Level', type: 'select' },
  { id: 'est_hours', name: 'Estimated Hours', type: 'number' },
  { id: 'notes', name: 'Description', type: 'text' },
];

export const MOCK_LARK_SCHEMA: FieldSchema[] = [
  { id: 'fld_name', name: 'Title', type: 'text' },
  { id: 'fld_status', name: 'Stage', type: 'select' },
  { id: 'fld_deadline', name: 'Deadline', type: 'date' },
  { id: 'fld_owner', name: 'Owner', type: 'person' },
  { id: 'fld_prio', name: 'Priority', type: 'select' },
  { id: 'fld_hours', name: 'Man Hours', type: 'number' },
  { id: 'fld_link', name: 'Notion Link', type: 'url' },
  { id: 'fld_extra', name: 'Remarks', type: 'text' },
];

export const generateMockSyncData = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    title: `Project Task ${i + 1}`,
    status: i % 2 === 0 ? 'Done' : 'In Progress',
    priority: i % 3 === 0 ? 'High' : 'Low',
  }));
};