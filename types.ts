export type UserRole = 'ADMIN' | 'EDITOR' | 'USER';

export interface User {
  username: string;
  role: UserRole;
  name: string;
}

export interface UserAccount extends User {
  password: string; 
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: number;
}

export interface InventoryItem {
  id: string;
  size: string;
  gsm: string;
  closingStock: number;
  minStock: number;
  company?: string;
  remarks?: string;
  reorderStatus?: 'Pending' | 'Order Placed' | 'Received' | 'Other';
  reorderCompany?: string;
  reorderQty?: number;
  reorderDate?: string;
  expectedDeliveryDate?: string;
  reorderRemarks?: string;
  category?: 'SINGLE' | 'DOUBLE' | 'DOUBLE_LEFT';
  isPendingApproval?: boolean; // New: indicates a metadata change is waiting for admin
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: 'ADD_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM' | 'APPROVE_CHANGE' | 'DENY_CHANGE' | 'USER_VERIFY';
  details: string;
  itemId?: string;
}

export interface ChangeRequest {
  id: string;
  timestamp: number;
  requestedBy: string;
  requestedByName: string;
  type: 'UPDATE' | 'DELETE' | 'ADD';
  itemId?: string;
  itemData: Partial<InventoryItem>;
  oldData?: Partial<InventoryItem>;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export interface AccessRequest {
  id: string;
  viewMode: ViewMode;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  timestamp: number;
  userName: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  STOCK_IN_LOGS = 'STOCK_IN_LOGS',
  STOCK_OUT_LOGS = 'STOCK_OUT_LOGS',
  PENDING_WORKS = 'PENDING_WORKS',
  REORDER_ALERTS = 'REORDER_ALERTS',
  REORDER_HISTORY = 'REORDER_HISTORY',
  FORECAST = 'FORECAST',
  PAPER_CALCULATOR = 'PAPER_CALCULATOR',
  JOB_CARD_GENERATOR = 'JOB_CARD_GENERATOR',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export interface StockTransaction {
  id: string;
  type: 'IN' | 'OUT' | 'REORDER';
  date: string;
  month: string;
  itemId: string;
  size: string;
  gsm: string;
  quantity: number;
  company?: string;
  invoice?: string;
  storageLocation?: string;
  itemCode?: string;
  workName?: string;
  unit?: string;
  cuttingSize?: string;
  status?: string;
  vehicle?: string;
  priority?: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  receivedQty?: number;
  remarks?: string;
  timestamp: number;
}

export interface JobCardData {
  id: string;
  jobCardNo: string;
  date: string;
  itemCode: string;
  workName: string;
  size: string;
  gsm: string;
  totalGross: string;
  deliveryLocation: string;
  loadingDate: string;
  supervisorSign?: string;
  accountantSign?: string;
}