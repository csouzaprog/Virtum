/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolCategory = 
  | 'Medição/Precisão' 
  | 'Ferramentas elétricas' 
  | 'Ferramentas manuais' 
  | 'EPIs elétricos' 
  | 'Escadas/Andaimes' 
  | 'Consumíveis';

export type ToolCriticidade = 'CRÍTICA' | 'ALTA' | 'NORMAL';

export type ToolStatus = 'DISPONÍVEL' | 'EM USO' | 'EM MANUTENÇÃO' | 'AVARIADA/BAIXADA';

export interface Tool {
  id: string; // E.g., "FER-0001", "MED-0003", "EPI-0012"
  name: string;
  category: ToolCategory;
  criticidade: ToolCriticidade;
  address: string; // Dynamic coordinates column (letter) x prateleira (number), e.g., "A-1"
  storageInfo: string; // Detail e.g., "Armário fechado com espuma", "Painel de silhuetas"
  status: ToolStatus;
  acquisitionCost: number;
  replacementCost: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  serialNumber?: string;
  brand?: string;
  frequenciaUso?: 'BAIXA' | 'MÉDIA' | 'ALTA';
}

export interface CautelaItem {
  toolId: string;
  name: string;
  category: ToolCategory;
  conditionOut: string;
  conditionIn?: string;
  returnedDate?: string;
}

export interface Cautela {
  id: string; // CAU-XXXX
  dateOut: string; // YYYY-MM-DD
  timeOut: string; // HH:MM
  colaborador: string;
  matricula: string;
  obraDestino: string;
  status: 'ATIVA' | 'FINALIZADA';
  items: CautelaItem[];
  expectedReturnDate: string; // YYYY-MM-DD
  actualReturnDate?: string; // YYYY-MM-DD
}

export interface MaintenanceItem {
  id: string; // PM-XXXX
  toolId: string;
  toolName: string;
  category: ToolCategory;
  criticidade: ToolCriticidade;
  serviceType: string; // E.g., "Calibração periódica", "Revisão elétrica", "Inspeção NR-35"
  frequencyDays: number; // 365, 180, 30, etc.
  lastDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  performedBy?: string;
  notes?: string;
}

export interface OcorrenciaNC {
  id: string; // NC-XXXX
  cautelaId?: string;
  toolId: string;
  toolName: string;
  colaborador: string; // Colaborador responsável
  date: string; // YYYY-MM-DD
  type: 'AVARIA' | 'EXTRAVIO' | 'AVARIA LEVE';
  description: string;
  estimatedCost: number;
  actionTaken: string; // Ação adotada
  status: 'ABERTA' | 'RESOLVIDA' | 'BAIXADA';
}

export interface InventarioItem {
  toolId: string;
  name: string;
  category: ToolCategory;
  address: string;
  qtySystem: number; // For normal tools, it's 1. For consumables, it might be actual balance.
  qtyPhysical: number;
  difference: number; // qtyPhysical - qtySystem
  status: 'OK' | 'FALTA' | 'SOBRA';
  scannedAt?: string;
}

export interface InventarioReport {
  id: string;
  date: string;
  responsible: string;
  items: InventarioItem[];
  status: 'EM_ANDAMENTO' | 'FINALIZADO';
}

export interface AppUser {
  email: string;
  name: string;
  matricula?: string;
  role: 'ADMIN' | 'VISU';
  sector?: string;
  id?: string;
}

