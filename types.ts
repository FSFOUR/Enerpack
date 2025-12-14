
export interface InventoryItem {
  id: string;
  pageNo?: string; // Kept for legacy compatibility if needed, but not shown in main view
  size: string;
  gsm: string; // Changed to string to support "GYT"
  closingStock: number;
  minStock: number; // Reorder level
  remarks?: string;

  // Reorder Tracking Fields
  reorderStatus?: 'Pending' | 'Order Placed' | 'Other';
  reorderCompany?: string;
  reorderQty?: number;
  reorderDate?: string;
  expectedDeliveryDate?: string;
  reorderRemarks?: string;
}

export interface JobCardData {
  id: string;
  jobCardNo: string;
  date: string;
  workName: string;
  itemCode?: string; // Added Item Code
  size: string;
  gsm: string;
  totalGross: string;
  deliveryLocation: string;
  loadingDate: string;
  supervisorSign: string;
  accountantSign: string;
  originalText?: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  JOB_CARDS = 'JOB_CARDS',
  STOCK_IN_LOGS = 'STOCK_IN_LOGS',
  STOCK_OUT_LOGS = 'STOCK_OUT_LOGS',
  PENDING_WORKS = 'PENDING_WORKS',
  REORDER_ALERTS = 'REORDER_ALERTS',
  REORDER_LOGS = 'REORDER_LOGS',
  PAPER_CALCULATOR = 'PAPER_CALCULATOR',
  FORECAST = 'FORECAST',
}

export interface StockTransaction {
  id: string;
  type: 'IN' | 'OUT' | 'REORDER';
  date: string;
  month: string;
  
  // Linked Item
  itemId: string;
  size: string;
  gsm: string;
  quantity: number;

  // Stock In Fields
  company?: string;
  invoice?: string;
  storageLocation?: string;

  // Stock Out Fields
  itemCode?: string;
  workName?: string;
  unit?: string;
  cuttingSize?: string;
  status?: string;
  vehicle?: string;
  priority?: string; // Very Urgent, Urgent, High, Medium, Low
  
  // Reorder Fields
  expectedDeliveryDate?: string;

  // Common
  remarks?: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}
