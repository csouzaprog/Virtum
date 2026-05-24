/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tool, Cautela, OcorrenciaNC, MaintenanceItem, InventarioItem, InventarioReport } from '../types';

export const INITIAL_TOOLS: Tool[] = [
  {
    id: 'MED-0001',
    name: 'Multímetro Digital Fluke 117',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    address: 'A-1',
    storageInfo: 'Armário trancado com divisor de espuma especial',
    status: 'DISPONÍVEL',
    acquisitionCost: 1850.00,
    replacementCost: 1950.00,
    brand: 'Fluke',
    serialNumber: 'FLK-117-9921',
    lastMaintenanceDate: '2026-01-10',
    nextMaintenanceDate: '2027-01-10',
  },
  {
    id: 'MED-0002',
    name: 'Alicate Amperímetro Fluke 323',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    address: 'A-2',
    storageInfo: 'Armário trancado com divisor de espuma especial',
    status: 'EM USO',
    acquisitionCost: 1100.00,
    replacementCost: 1210.00,
    brand: 'Fluke',
    serialNumber: 'FLK-323-4556',
    lastMaintenanceDate: '2025-07-20',
    nextMaintenanceDate: '2026-07-20',
  },
  {
    id: 'MED-0003',
    name: 'Terrômetro de Haste Digital Hikari',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    address: 'A-3',
    storageInfo: 'Armário trancado com divisor de espuma especial',
    status: 'DISPONÍVEL',
    acquisitionCost: 2300.00,
    replacementCost: 2500.00,
    brand: 'Hikari',
    serialNumber: 'HKR-TER-8812',
    lastMaintenanceDate: '2025-05-15',
    nextMaintenanceDate: '2026-05-15', // Vencida há 9 dias (Since today is 2026-05-24)
  },
  {
    id: 'FER-0001',
    name: 'Furadeira de Impacto Bosch GSB 20-2',
    category: 'Ferramentas elétricas',
    criticidade: 'ALTA',
    address: 'B-1',
    storageInfo: 'Prateleira A — Setor Equipe Azul',
    status: 'EM USO',
    acquisitionCost: 650.00,
    replacementCost: 720.00,
    brand: 'Bosch',
    serialNumber: 'BSH-GSB-0192',
    lastMaintenanceDate: '2025-11-15',
    nextMaintenanceDate: '2026-05-15', // Vencida há 9 dias
  },
  {
    id: 'FER-0002',
    name: 'Parafusadeira Angular Bosch GSR 12V',
    category: 'Ferramentas elétricas',
    criticidade: 'ALTA',
    address: 'B-2',
    storageInfo: 'Prateleira A — Setor Equipe Vermelha',
    status: 'DISPONÍVEL',
    acquisitionCost: 480.00,
    replacementCost: 520.00,
    brand: 'Bosch',
    serialNumber: 'BSH-GSR-4560',
    lastMaintenanceDate: '2025-12-05',
    nextMaintenanceDate: '2026-06-05', // Atenção (due in 12 days)
  },
  {
    id: 'FER-0003',
    name: 'Serra Mármore Makita 1450W',
    category: 'Ferramentas elétricas',
    criticidade: 'ALTA',
    address: 'B-3',
    storageInfo: 'Prateleira A — Setor Geral',
    status: 'EM MANUTENÇÃO',
    acquisitionCost: 590.00,
    replacementCost: 650.00,
    brand: 'Makita',
    serialNumber: 'MKT-SRM-5511',
    lastMaintenanceDate: '2026-05-20',
    nextMaintenanceDate: '2026-11-20',
  },
  {
    id: 'FER-0004',
    name: 'Alicate Crimpador Hidráulico para Terminais Coel',
    category: 'Ferramentas manuais',
    criticidade: 'NORMAL',
    address: 'C-1',
    storageInfo: 'Painel perfurado - Silhueta #14',
    status: 'DISPONÍVEL',
    acquisitionCost: 890.00,
    replacementCost: 980.00,
    brand: 'Coel',
    serialNumber: 'COE-CRH-1234',
    lastMaintenanceDate: '2025-10-10',
    nextMaintenanceDate: '2026-10-10',
  },
  {
    id: 'FER-0005',
    name: 'Alicate Wave Decapador Universal Belzer',
    category: 'Ferramentas manuais',
    criticidade: 'NORMAL',
    address: 'C-2',
    storageInfo: 'Painel perfurado - Silhueta #21',
    status: 'DISPONÍVEL',
    acquisitionCost: 150.00,
    replacementCost: 170.00,
    brand: 'Belzer',
    serialNumber: 'BLZ-DEC-5522',
    lastMaintenanceDate: '2025-10-10',
    nextMaintenanceDate: '2026-10-10',
  },
  {
    id: 'FER-0006',
    name: 'Jogo de Chave de Fenda Isolada 1000V VDE Gedore',
    category: 'Ferramentas manuais',
    criticidade: 'NORMAL',
    address: 'C-3',
    storageInfo: 'Painel perfurado - Silhueta #4',
    status: 'DISPONÍVEL',
    acquisitionCost: 280.00,
    replacementCost: 310.00,
    brand: 'Gedore',
    serialNumber: 'GED-VDE-0929',
    lastMaintenanceDate: '2025-10-10',
    nextMaintenanceDate: '2026-10-10',
  },
  {
    id: 'EPI-0001',
    name: 'Luva de Borracha Isoladora Tipo Salva-Vidas Classe 0 (1000V)',
    category: 'EPIs elétricos',
    criticidade: 'CRÍTICA',
    address: 'D-1',
    storageInfo: 'Armário trancado exclusivo EPIs Elétricos',
    status: 'DISPONÍVEL',
    acquisitionCost: 320.00,
    replacementCost: 350.00,
    brand: 'Orion',
    serialNumber: 'ORN-LUV-0012',
    lastMaintenanceDate: '2026-03-01',
    nextMaintenanceDate: '2026-09-01',
  },
  {
    id: 'EPI-0002',
    name: 'Capacete de Proteção Classe B com Jugular e Protetor Facial',
    category: 'EPIs elétricos',
    criticidade: 'CRÍTICA',
    address: 'D-2',
    storageInfo: 'Armário trancado exclusivo EPIs Elétricos',
    status: 'DISPONÍVEL',
    acquisitionCost: 110.00,
    replacementCost: 120.00,
    brand: 'MSA',
    serialNumber: 'MSA-CAP-8772',
    lastMaintenanceDate: '2026-03-01',
    nextMaintenanceDate: '2026-09-01',
  },
  {
    id: 'ESC-0001',
    name: 'Escada de Fibra de Vidro Extensível 12 Degraus WBERTOLO',
    category: 'Escadas/Andaimes',
    criticidade: 'ALTA',
    address: 'S-1',
    storageInfo: 'Suporte de parede lateral esquerda',
    status: 'EM USO',
    acquisitionCost: 1200.00,
    replacementCost: 1350.00,
    brand: 'WBertolo',
    serialNumber: 'WBT-ESC-0129',
    lastMaintenanceDate: '2025-11-20',
    nextMaintenanceDate: '2026-05-20', // Vencida há 4 dias
  },
  {
    id: 'ESC-0002',
    name: 'Escada Americana Fibra de Vidro Simples 7 Degraus',
    category: 'Escadas/Andaimes',
    criticidade: 'ALTA',
    address: 'S-2',
    storageInfo: 'Suporte de parede lateral esquerda',
    status: 'DISPONÍVEL',
    acquisitionCost: 850.00,
    replacementCost: 950.00,
    brand: 'WBertolo',
    serialNumber: 'WBT-ESC-5591',
    lastMaintenanceDate: '2026-02-10',
    nextMaintenanceDate: '2026-08-10',
  },
  {
    id: 'CON-0001',
    name: 'Fita Isolante de Auto-Fusão 3M Scotch 23 (19mm x 10m)',
    category: 'Consumíveis',
    criticidade: 'NORMAL',
    address: 'E-1',
    storageInfo: 'Prateleira C Aberta',
    status: 'DISPONÍVEL',
    acquisitionCost: 45.00,
    replacementCost: 45.00,
    brand: '3M',
  },
  {
    id: 'CON-0002',
    name: 'Abraçadeira de Nylon HellermannTyton (Embalagem 100 un)',
    category: 'Consumíveis',
    criticidade: 'NORMAL',
    address: 'E-2',
    storageInfo: 'Prateleira C Aberta',
    status: 'DISPONÍVEL',
    acquisitionCost: 35.00,
    replacementCost: 35.00,
    brand: 'HellermannTyton',
  }
];

export const INITIAL_CAUTELAS: Cautela[] = [
  {
    id: 'CAU-1001',
    dateOut: '2026-05-20',
    timeOut: '07:30',
    colaborador: 'Carlos Silva',
    matricula: 'VRT-0812',
    obraDestino: 'Instalação Predial Shopping Center Rio',
    status: 'ATIVA',
    expectedReturnDate: '2026-05-23', // Vencida (expected 2026-05-23, today 2026-05-24)
    items: [
      {
        toolId: 'MED-0002',
        name: 'Alicate Amperímetro Fluke 323',
        category: 'Medição/Precisão',
        conditionOut: 'EXCELENTE'
      },
      {
        toolId: 'FER-0001',
        name: 'Furadeira de Impacto Bosch GSB 20-2',
        category: 'Ferramentas elétricas',
        conditionOut: 'BOM'
      }
    ]
  },
  {
    id: 'CAU-1002',
    dateOut: '2026-05-22',
    timeOut: '08:15',
    colaborador: 'Marcos Oliveira',
    matricula: 'VRT-1144',
    obraDestino: 'Subestação Industrial TecnoGeral',
    status: 'ATIVA',
    expectedReturnDate: '2026-05-29', // Dentro do prazo
    items: [
      {
        toolId: 'ESC-0001',
        name: 'Escada de Fibra de Vidro Extensível 12 Degraus WBERTOLO',
        category: 'Escadas/Andaimes',
        conditionOut: 'ÓTIMO'
      }
    ]
  },
  {
    id: 'CAU-0999',
    dateOut: '2026-05-10',
    timeOut: '14:00',
    colaborador: 'Reginaldo Souza',
    matricula: 'VRT-0743',
    obraDestino: 'Prédio Residencial Atlântico',
    status: 'FINALIZADA',
    expectedReturnDate: '2026-05-15',
    actualReturnDate: '2026-05-15',
    items: [
      {
        toolId: 'MED-0001',
        name: 'Multímetro Digital Fluke 117',
        category: 'Medição/Precisão',
        conditionOut: 'ÓTIMO',
        conditionIn: 'ÓTIMO',
        returnedDate: '2026-05-15'
      }
    ]
  },
  {
    id: 'CAU-0998',
    dateOut: '2026-05-12',
    timeOut: '08:00',
    colaborador: 'Carlos Silva',
    matricula: 'VRT-0812',
    obraDestino: 'Manutenção de Transformador Alfa',
    status: 'FINALIZADA',
    expectedReturnDate: '2026-05-14',
    actualReturnDate: '2026-05-14',
    items: [
      {
        toolId: 'FER-0002',
        name: 'Parafusadeira Angular Bosch GSR 12V',
        category: 'Ferramentas elétricas',
        conditionOut: 'BOM',
        conditionIn: 'BOM',
        returnedDate: '2026-05-14'
      }
    ]
  }
];

export const INITIAL_OCS: OcorrenciaNC[] = [
  {
    id: 'NC-001',
    cautelaId: 'CAU-0995',
    toolId: 'FER-0003',
    toolName: 'Serra Mármore Makita 1450W',
    colaborador: 'Thiago Mendes (Matrícula VRT-0925)',
    date: '2026-05-20',
    type: 'AVARIA',
    description: 'Carcaça trincada após queda acidental do andaime. Cabo de alimentação rompido na base.',
    estimatedCost: 280.00,
    actionTaken: 'Item encaminhado para assistência técnica autorizada para troca da carcaça e cabo térmico. Devido ao custo, foi aberta esta NC de cobrança e conscientização de segurança.',
    status: 'ABERTA'
  },
  {
    id: 'NC-002',
    cautelaId: 'CAU-0988',
    toolId: 'FER-0005',
    toolName: 'Alicate Wave Decapador Universal Belzer',
    colaborador: 'Lucas Pereira (Matrícula VRT-1033)',
    date: '2026-05-05',
    type: 'EXTRAVIO',
    description: 'Perda reportada pelo colaborador ao final da jornada de instalação elétrica no terceiro pavimento.',
    estimatedCost: 150.00,
    actionTaken: 'Ferramenta baixada do patrimônio. Reposição providenciada e custo debitado parcialmente na folha do colaborador conforme cautela assinada.',
    status: 'RESOLVIDA'
  }
];

export const INITIAL_MAINTENANCE_SCHEDULE: MaintenanceItem[] = [
  {
    id: 'PM-0001',
    toolId: 'MED-0001',
    toolName: 'Multímetro Digital Fluke 117',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    serviceType: 'Calibração Certificada em Laboratório RBC',
    frequencyDays: 365,
    lastDate: '2026-01-10',
    dueDate: '2027-01-10'
  },
  {
    id: 'PM-0002',
    toolId: 'MED-0002',
    toolName: 'Alicate Amperímetro Fluke 323',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    serviceType: 'Calibração Certificada em Laboratório RBC',
    frequencyDays: 365,
    lastDate: '2025-07-20',
    dueDate: '2026-07-20'
  },
  {
    id: 'PM-0003',
    toolId: 'MED-0003',
    toolName: 'Terrômetro de Haste Digital Hikari',
    category: 'Medição/Precisão',
    criticidade: 'CRÍTICA',
    serviceType: 'Calibração Certificada em Laboratório RBC',
    frequencyDays: 365,
    lastDate: '2025-05-15',
    dueDate: '2026-05-15' // VENCIDA
  },
  {
    id: 'PM-0004',
    toolId: 'FER-0001',
    toolName: 'Furadeira de Impacto Bosch GSB 20-2',
    category: 'Ferramentas elétricas',
    criticidade: 'ALTA',
    serviceType: 'Tratamento Preventivo Escovas/Lubrificação',
    frequencyDays: 180,
    lastDate: '2025-11-15',
    dueDate: '2026-05-15' // VENCIDA
  },
  {
    id: 'PM-0005',
    toolId: 'FER-0002',
    toolName: 'Parafusadeira Angular Bosch GSR 12V',
    category: 'Ferramentas elétricas',
    criticidade: 'ALTA',
    serviceType: 'Inspeção Funcional e Limpeza Induzido',
    frequencyDays: 180,
    lastDate: '2025-12-05',
    dueDate: '2026-06-05' // ATENÇÃO (due in 12 days)
  },
  {
    id: 'PM-0006',
    toolId: 'ESC-0001',
    toolName: 'Escada de Fibra de Vidro Extensível 12 Degraus WBERTOLO',
    category: 'Escadas/Andaimes',
    criticidade: 'ALTA',
    serviceType: 'Verificação de Degraus, Base emborrachada e NR-35',
    frequencyDays: 180,
    lastDate: '2025-11-20',
    dueDate: '2026-05-20' // VENCIDA
  }
];

export const INITIAL_INVENTORY: InventarioItem[] = [
  {
    toolId: 'MED-0001',
    name: 'Multímetro Digital Fluke 117',
    category: 'Medição/Precisão',
    address: 'A-1',
    qtySystem: 1,
    qtyPhysical: 1,
    difference: 0,
    status: 'OK'
  },
  {
    toolId: 'MED-0002',
    name: 'Alicate Amperímetro Fluke 323',
    category: 'Medição/Precisão',
    address: 'A-2',
    qtySystem: 1,
    qtyPhysical: 1,
    difference: 0,
    status: 'OK'
  },
  {
    toolId: 'FER-0002',
    name: 'Parafusadeira Angular Bosch GSR 12V',
    category: 'Ferramentas elétricas',
    address: 'B-2',
    qtySystem: 1,
    qtyPhysical: 1,
    difference: 0,
    status: 'OK'
  },
  {
    toolId: 'FER-0004',
    name: 'Alicate Crimpador Hidráulico para Terminais Coel',
    category: 'Ferramentas manuais',
    address: 'C-1',
    qtySystem: 1,
    qtyPhysical: 0, // FALTANDO no inventário físico anterior
    difference: -1,
    status: 'FALTA'
  },
  {
    toolId: 'CON-0001',
    name: 'Fita Isolante de Auto-Fusão 3M Scotch 23 (19mm x 10m)',
    category: 'Consumíveis',
    address: 'E-1',
    qtySystem: 12,
    qtyPhysical: 14, // SOBRANDO
    difference: 2,
    status: 'SOBRA'
  }
];
