export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'herramientas' | 'materiales' | 'unidades_moviles';
  subcategory: string;
  qty: number;
  unit: string;
  location: string;
  minQty: number;
  description: string;
  status?: string; // e.g., 'buen estado', 'en reparación', 'disponible', 'en ruta', 'mantenimiento'
  updatedAt: string; // ISO string or timestamp
  lastUpdatedBy?: string;
  branch?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: 'herramientas' | 'materiales' | 'unidades_moviles';
  type: 'entrada' | 'salida' | 'ajuste' | 'asignacion' | 'devolucion';
  qty: number;
  prevQty: number;
  newQty: number;
  responsible: string;
  destinationOrOrigin?: string;
  date: string; // ISO string
  notes?: string;
  signature?: string; // Base64 signature image for operator check-out/check-in
  workOrderId?: string; // Link to an active Work Order
  branch?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  type: 'bodega' | 'vehiculo' | 'zona' | 'estante';
  branch?: string;
}

export interface Installer {
  id: string;
  name: string;
  rut: string;
  phone: string;
  email: string;
  company?: string;
  status: 'activo' | 'inactivo';
  branch?: string;
}

export interface Crew {
  id: string;
  name: string;
  leaderId: string; // Installer ID
  membersIds: string[]; // Array of Installer IDs
  vehicleId?: string; // Location ID of type 'vehiculo'
  status: 'disponible' | 'en_ruta' | 'trabajando' | 'inactiva';
  branch?: string;
}

export interface WorkOrder {
  id: string;
  identifier: string; // e.g. OS-001
  description: string;
  address?: string;
  clientName?: string;
  assignedCrewId?: string; // Crew ID
  status: 'pendiente' | 'en_progreso' | 'completada';
  startDate?: string;
  endDate?: string;
  notes?: string;
  branch?: string;
}
