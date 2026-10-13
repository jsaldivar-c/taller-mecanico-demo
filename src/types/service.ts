export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'delivered';

export interface ServiceProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface WorkshopService {
  id: string;
  rowNumber?: number; // 1-indexed row number in Google Sheet
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehicleModel: string;
  plateNumber: string;
  mileage?: string;
  date: string;
  procedure: string;
  products: ServiceProduct[];
  laborCost: number;
  totalCost: number;
  status: ServiceStatus;
  notes?: string;
  updatedAt: string;
}

export interface GoogleSheetInfo {
  id: string;
  title: string;
  url: string;
  lastSyncedAt?: string;
}

export interface SyncStats {
  totalServices: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  totalRevenue: number;
}
