/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Tool, 
  Cautela, 
  OcorrenciaNC, 
  MaintenanceItem, 
  InventarioItem, 
  ToolStatus,
  AppUser
} from './types';
import { 
  INITIAL_TOOLS, 
  INITIAL_CAUTELAS, 
  INITIAL_OCS, 
  INITIAL_MAINTENANCE_SCHEDULE, 
  INITIAL_INVENTORY 
} from './utils/initialData';

import Dashboard from './components/Dashboard';
import ToolCatalog from './components/ToolCatalog';
import CheckoutHistory from './components/CheckoutHistory';
import MaintenancePlanner from './components/MaintenancePlanner';
import NonConformityNC from './components/NonConformityNC';
import PhysicalInventory from './components/PhysicalInventory';
import LoginScreen from './components/LoginScreen';

import { 
  LayoutDashboard, 
  FileCode, 
  ShieldAlert, 
  Wrench, 
  ClipboardList, 
  Boxes,
  HelpCircle,
  LogOut,
  UserCheck
} from 'lucide-react';

import { db } from './lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem('virtum_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [userRole, setUserRole] = useState<'ADMIN' | 'VISU'>(() => {
    const cached = localStorage.getItem('virtum_user');
    if (cached) {
      try {
        return JSON.parse(cached).role;
      } catch (e) {
        return 'ADMIN';
      }
    }
    return 'ADMIN';
  });

  // Core Persistent States
  const [tools, setTools] = useState<Tool[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaNC[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [inventory, setInventory] = useState<InventarioItem[]>([]);

  // Real-time Cloud Synchronization & Seeding on Load
  useEffect(() => {
    // 1. Sync & Listen to Tools
    const unsubscribeTools = onSnapshot(collection(db, 'tools'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_TOOLS.forEach((t) => {
          setDoc(doc(db, 'tools', t.id), t).catch(console.error);
        });
      } else {
        const loaded: Tool[] = [];
        snapshot.forEach((doc) => loaded.push(doc.data() as Tool));
        setTools(loaded.sort((a, b) => a.id.localeCompare(b.id)));
      }
    }, (error) => {
      console.error("Firestore error subscribing to 'tools':", error);
    });

    // 2. Sync & Listen to Cautelas (Checkouts)
    const unsubscribeCautelas = onSnapshot(collection(db, 'cautelas'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_CAUTELAS.forEach((c) => {
          setDoc(doc(db, 'cautelas', c.id), c).catch(console.error);
        });
      } else {
        const loaded: Cautela[] = [];
        snapshot.forEach((doc) => loaded.push(doc.data() as Cautela));
        setCautelas(loaded.sort((a, b) => b.id.localeCompare(a.id)));
      }
    }, (error) => {
      console.error("Firestore error subscribing to 'cautelas':", error);
    });

    // 3. Sync & Listen to Ocorrencias (Non-conformities)
    const unsubscribeOcorrencias = onSnapshot(collection(db, 'ocorrencias'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_OCS.forEach((o) => {
          setDoc(doc(db, 'ocorrencias', o.id), o).catch(console.error);
        });
      } else {
        const loaded: OcorrenciaNC[] = [];
        snapshot.forEach((doc) => loaded.push(doc.data() as OcorrenciaNC));
        setOcorrencias(loaded.sort((a, b) => b.id.localeCompare(a.id)));
      }
    }, (error) => {
      console.error("Firestore error subscribing to 'ocorrencias':", error);
    });

    // 4. Sync & Listen to Maintenance schedule
    const unsubscribeMaintenance = onSnapshot(collection(db, 'maintenance'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_MAINTENANCE_SCHEDULE.forEach((m) => {
          setDoc(doc(db, 'maintenance', m.id), m).catch(console.error);
        });
      } else {
        const loaded: MaintenanceItem[] = [];
        snapshot.forEach((doc) => loaded.push(doc.data() as MaintenanceItem));
        setMaintenance(loaded.sort((a, b) => a.id.localeCompare(b.id)));
      }
    }, (error) => {
      console.error("Firestore error subscribing to 'maintenance':", error);
    });

    // 5. Sync & Listen to Inventory
    const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      if (snapshot.empty) {
        INITIAL_INVENTORY.forEach((i) => {
          setDoc(doc(db, 'inventory', i.toolId), i).catch(console.error);
        });
      } else {
        const loaded: InventarioItem[] = [];
        snapshot.forEach((doc) => loaded.push(doc.data() as InventarioItem));
        setInventory(loaded.sort((a, b) => a.toolId.localeCompare(b.toolId)));
      }
    }, (error) => {
      console.error("Firestore error subscribing to 'inventory':", error);
    });

    return () => {
      unsubscribeTools();
      unsubscribeCautelas();
      unsubscribeOcorrencias();
      unsubscribeMaintenance();
      unsubscribeInventory();
    };
  }, []);

  // Sync state & Firestore persistence helpers
  const saveToolsState = (updatedTools: Tool[]) => {
    setTools(updatedTools);
    localStorage.setItem('virtum_tools', JSON.stringify(updatedTools));
    updatedTools.forEach((t) => {
      setDoc(doc(db, 'tools', t.id), t).catch(console.error);
    });
  };

  const saveCautelasState = (updatedCautelas: Cautela[]) => {
    setCautelas(updatedCautelas);
    localStorage.setItem('virtum_cautelas', JSON.stringify(updatedCautelas));
    updatedCautelas.forEach((c) => {
      setDoc(doc(db, 'cautelas', c.id), c).catch(console.error);
    });
  };

  const saveOcorrenciasState = (updatedOcorrencias: OcorrenciaNC[]) => {
    setOcorrencias(updatedOcorrencias);
    localStorage.setItem('virtum_ocorrencias', JSON.stringify(updatedOcorrencias));
    updatedOcorrencias.forEach((o) => {
      setDoc(doc(db, 'ocorrencias', o.id), o).catch(console.error);
    });
  };

  const saveMaintenanceState = (updatedMaintenance: MaintenanceItem[]) => {
    setMaintenance(updatedMaintenance);
    localStorage.setItem('virtum_maintenance', JSON.stringify(updatedMaintenance));
    updatedMaintenance.forEach((m) => {
      setDoc(doc(db, 'maintenance', m.id), m).catch(console.error);
    });
  };

  const saveInventoryState = (updatedInventory: InventarioItem[]) => {
    setInventory(updatedInventory);
    localStorage.setItem('virtum_inventory', JSON.stringify(updatedInventory));
    updatedInventory.forEach((i) => {
      setDoc(doc(db, 'inventory', i.toolId), i).catch(console.error);
    });
  };

  // --- ACTIONS WORKFLOW COORDINATION ---

  // Update expected return date
  const handleUpdateExpectedReturnDate = (cautelaId: string, newDate: string) => {
    const updated = cautelas.map(c => c.id === cautelaId ? { ...c, expectedReturnDate: newDate } : c);
    saveCautelasState(updated);
  };

  // Add new tool
  const handleAddTool = (newTool: Tool) => {
    const updated = [newTool, ...tools];
    saveToolsState(updated);

    // Automatically seed an InventoryItem on the fly
    const newInv: InventarioItem = {
      toolId: newTool.id,
      name: newTool.name,
      category: newTool.category,
      address: newTool.address,
      qtySystem: newTool.category === 'Consumíveis' ? 10 : 1, // Default qty for consumibles
      qtyPhysical: newTool.category === 'Consumíveis' ? 10 : 1,
      difference: 0,
      status: 'OK'
    };
    saveInventoryState([newInv, ...inventory]);

    // If critical or high, automatically add a Maintenance schedule
    if (newTool.criticidade === 'CRÍTICA' || newTool.criticidade === 'ALTA') {
      const isCritical = newTool.criticidade === 'CRÍTICA';
      
      const newPM: MaintenanceItem = {
        id: `PM-${String(maintenance.length + 1).padStart(4, '0')}`,
        toolId: newTool.id,
        toolName: newTool.name,
        category: newTool.category,
        criticidade: newTool.criticidade,
        serviceType: isCritical 
          ? 'Calibração Certificada em Laboratório RBC' 
          : 'Revisão Técnica Escovas/Estrutural Secundário',
        frequencyDays: isCritical ? 365 : 180,
        lastDate: newTool.lastMaintenanceDate || '2026-05-24',
        dueDate: isCritical ? '2027-05-24' : '2026-11-20'
      };
      saveMaintenanceState([...maintenance, newPM]);
    }
  };

  // Change tool status
  const handleUpdateToolStatus = (id: string, status: ToolStatus) => {
    const updated = tools.map(t => t.id === id ? { ...t, status } : t);
    saveToolsState(updated);
  };

  // Create active checkout cautela (Terms)
  const handleCreateCautela = (newCautela: Cautela) => {
    // 1. Add Cautela
    saveCautelasState([newCautela, ...cautelas]);

    // 2. Turn status of tools involved to 'EM USO'
    const toolIdsToUse = newCautela.items.map(it => it.toolId);
    const updatedTools = tools.map(t => 
      toolIdsToUse.includes(t.id) ? { ...t, status: 'EM USO' as ToolStatus } : t
    );
    saveToolsState(updatedTools);
  };

  // Return item checkout + automatic NC triggers
  const handleReturnCautela = (
    cautelaId: string, 
    toolId: string, 
    conditionIn: string, 
    isAvaria: boolean, 
    avariaDetails?: { type: 'AVARIA' | 'EXTRAVIO' | 'AVARIA LEVE'; description: string; cost: number }
  ) => {
    const todayStr = '2026-05-24';

    // 1. Update checkout item returned details
    const updatedCautelas = cautelas.map(c => {
      if (c.id !== cautelaId) return c;
      
      const updatedItems = c.items.map(it => {
        if (it.toolId !== toolId) return it;
        return {
          ...it,
          conditionIn,
          returnedDate: todayStr
        };
      });

      // Check if all items are fully returned
      const allReturned = updatedItems.every(it => !!it.returnedDate);

      return {
        ...c,
        items: updatedItems,
        status: allReturned ? 'FINALIZADA' as const : 'ATIVA' as const,
        actualReturnDate: allReturned ? todayStr : undefined
      };
    });
    saveCautelasState(updatedCautelas);

    // 2. Adjust physical tool status
    // Default is back to DISPONIVEL, but if avaria occurs, mark as AVARIADA/BAIXADA
    const nextStatus: ToolStatus = isAvaria ? 'AVARIADA/BAIXADA' : 'DISPONÍVEL';
    const updatedTools = tools.map(t => t.id === toolId ? { ...t, status: nextStatus } : t);
    saveToolsState(updatedTools);

    // 3. Register non-conformity if requested
    if (isAvaria && avariaDetails) {
      const activeCaut = cautelas.find(c => c.id === cautelaId);
      const workman = activeCaut ? `${activeCaut.colaborador} (Matrícula ${activeCaut.matricula})` : 'Operador';
      
      const nextNo = ocorrencias.length + 1;
      const generatedId = `NC-${String(nextNo).padStart(3, '0')}`;
      const toolName = tools.find(t => t.id === toolId)?.name || 'Ativo';

      const automaticNC: OcorrenciaNC = {
        id: generatedId,
        cautelaId,
        toolId,
        toolName,
        colaborador: workman,
        date: todayStr,
        type: avariaDetails.type,
        description: avariaDetails.description,
        estimatedCost: avariaDetails.cost,
        actionTaken: avariaDetails.type === 'EXTRAVIO' 
          ? 'Cobrança parcial do colaborador estabelecida na cautela e baixa patrimonial.' 
          : 'Ativo retido em bancada de testes para reparo corretivo emergencial.',
        status: 'ABERTA'
      };

      saveOcorrenciasState([automaticNC, ...ocorrencias]);
    }
  };

  // Perform calibration / revision trigger
  const handlePerformMaintenance = (id: string, performedBy: string, notes?: string) => {
    const todayStr = '2026-05-24';

    const updated = maintenance.map(m => {
      if (m.id !== id) return m;

      const baseDate = new Date(todayStr + 'T00:00:00Z');
      baseDate.setDate(baseDate.getDate() + m.frequencyDays);
      const nextDue = baseDate.toISOString().split('T')[0];

      return {
        ...m,
        lastDate: todayStr,
        dueDate: nextDue,
        performedBy,
        notes
      };
    });
    saveMaintenanceState(updated);

    // Reset tool status involved to DISPONIVEL
    const mItem = maintenance.find(m => m.id === id);
    if (mItem) {
      const updatedTools = tools.map(t => t.id === mItem.toolId ? { ...t, status: 'DISPONÍVEL' as ToolStatus } : t);
      saveToolsState(updatedTools);
    }
  };

  // Manual NC Registration add
  const handleAddNC = (nc: OcorrenciaNC) => {
    saveOcorrenciasState([nc, ...ocorrencias]);

    // If NC is serious avaria or extravio, instantly flag tool as AVARIADA/BAIXADA
    if (nc.type === 'AVARIA' || nc.type === 'EXTRAVIO') {
      const updatedTools = tools.map(t => t.id === nc.toolId ? { ...t, status: 'AVARIADA/BAIXADA' as ToolStatus } : t);
      saveToolsState(updatedTools);
    }
  };

  // Resolve / Close Non conformity is completed
  const handleModifyNCStatus = (id: string, status: 'RESOLVIDA' | 'BAIXADA', remediation?: string) => {
    const updated = ocorrencias.map(o => {
      if (o.id !== id) return o;
      return {
        ...o,
        status,
        actionTaken: remediation || o.actionTaken
      };
    });
    saveOcorrenciasState(updated);

    // If RESOLVIDA (Restored to stock), restore tool back to 'DISPONÍVEL'
    // If BAIXADA (Baixa), keep/make tool 'AVARIADA/BAIXADA'
    const ncItem = ocorrencias.find(o => o.id === id);
    if (ncItem) {
      const nextToolStatus: ToolStatus = status === 'RESOLVIDA' ? 'DISPONÍVEL' : 'AVARIADA/BAIXADA';
      const updatedTools = tools.map(t => t.id === ncItem.toolId ? { ...t, status: nextToolStatus } : t);
      saveToolsState(updatedTools);
    }
  };

  // Physical Inventory: Update physical counted quantity of individual item
  const handleUpdateInventoryCount = (toolId: string, count: number) => {
    const updated = inventory.map(item => {
      if (item.toolId !== toolId) return item;
      const difference = count - item.qtySystem;
      let status: 'OK' | 'FALTA' | 'SOBRA' = 'OK';
      if (difference < 0) status = 'FALTA';
      else if (difference > 0) status = 'SOBRA';

      return {
        ...item,
        qtyPhysical: count,
        difference,
        status
      };
    });
    saveInventoryState(updated);
  };

  // Physical Inventory: Consolidate / Sincronizar system stocks
  const handleSyncInventoryToDatabase = () => {
    const todayStr = '2026-05-24';
    let currentTools = [...tools];
    let currentNCs = [...ocorrencias];

    inventory.forEach(item => {
      // Discrepancy handler
      if (item.difference < 0) { // FALTA (loss)
        // 1. Mark tool in catalog as BAIXADA
        currentTools = currentTools.map(t => t.id === item.toolId ? { ...t, status: 'AVARIADA/BAIXADA' as ToolStatus } : t);
        
        // 2. Automatically launch a Non-Conformity NC
        const nextNo = currentNCs.length + 1;
        const generatedId = `NC-${String(nextNo).padStart(3, '0')}`;
        const autoNC: OcorrenciaNC = {
          id: generatedId,
          toolId: item.toolId,
          toolName: item.name,
          colaborador: 'Divergência de Estoque Física (FALTA)',
          date: todayStr,
          type: 'EXTRAVIO',
          description: `Item não localizado durante a contagem de inventário físico mensal.`,
          estimatedCost: tools.find(tx => tx.id === item.toolId)?.replacementCost || 200,
          actionTaken: 'Ativo baixado automaticamente por meio do painel de inventário.',
          status: 'ABERTA'
        };
        currentNCs.unshift(autoNC);

      } else if (item.difference > 0) { // SOBRA
        // If it was marked as lost, restore it to DISPONIVEL
        currentTools = currentTools.map(t => t.id === item.toolId && t.status === 'AVARIADA/BAIXADA' ? { ...t, status: 'DISPONÍVEL' as ToolStatus } : t);
      }
    });

    saveToolsState(currentTools);
    saveOcorrenciasState(currentNCs);

    // Equalize inventory list after sync (differences return to 0)
    const resetInventory = inventory.map(item => ({
      ...item,
      qtySystem: item.qtyPhysical,
      difference: 0,
      status: 'OK' as const
    }));
    saveInventoryState(resetInventory);
  };

  // Reset physical inventory drafts back to system baseline numbers
  const handleResetInventorySession = () => {
    const reset = tools.map(t => {
      // Create fresh inventory items mapping to current actual status
      const existing = inventory.find(inv => inv.toolId === t.id);
      return {
        toolId: t.id,
        name: t.name,
        category: t.category,
        address: t.address,
        qtySystem: existing ? existing.qtySystem : 1,
        qtyPhysical: existing ? existing.qtySystem : 1,
        difference: 0,
        status: 'OK' as const
      };
    });
    saveInventoryState(reset);
    alert('Sessão de contagem restaurada com base nos dados do sistema atual!');
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setUserRole(user.role);
    localStorage.setItem('virtum_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('virtum_user');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col">
      
      {/* Visual Factory Top Ribbon */}
      <div className="bg-blue-600 text-white font-mono text-[9.5px] font-black tracking-widest text-center py-2 uppercase select-none shadow-sm shrink-0">
        ⚠ SISTEMA DE GESTÃO DE ALMOXARIFADO ELÉTRICO — CONFORME PROCEDIMENTO OPERACIONAL PADRÃO POP-ALM-001 ⚠
      </div>

      {/* Main Structural Layout Appbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md border-b border-slate-800 shrink-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 px-3 py-1 font-black text-lg tracking-tighter rounded text-white shadow-sm flex items-center justify-center">
              VIRTUM
            </div>
            <div className="h-6 w-px bg-slate-800 hidden md:block"></div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-white text-xs tracking-wider flex items-center gap-1.5 uppercase font-sans">
                GESTÃO DE FERRAMENTAS <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1 py-0.5 rounded text-[9px] font-mono font-normal">POP-ALM-001</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono font-normal">Unidade Central — Lean Almoxarifado v1.5</div>
            </div>
          </div>

          {/* Tab Selection Navigation */}
          <nav className="hidden lg:flex gap-1">
            {[
              { id: 'Dashboard', label: 'Painel Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'Cadastro', label: 'Cadastro Ativos', icon: <FileCode className="w-4 h-4" /> },
              { id: 'Checkouts', label: 'Ativos em Campo', icon: <ClipboardList className="w-4 h-4" /> },
              { id: 'Manutenção', label: 'Manutenção (PM)', icon: <Wrench className="w-4 h-4" /> },
              { id: 'OcorrênciasNC', label: 'Avarias (NC)', icon: <ShieldAlert className="w-4 h-4" /> },
              { id: 'Inventário', label: 'Inventário Físico', icon: <Boxes className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition select-none ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Active User Profile and Logout Header Widget */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-bold text-white block truncate max-w-[150px]" title={currentUser.name}>
                {currentUser.name}
              </span>
              <span className="text-[9px] text-slate-400 font-mono block uppercase">
                {userRole === 'ADMIN' ? '🛠️ Administrador' : '👁️ Consulta'}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 p-2 overflow-x-auto">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { id: 'Dashboard', label: 'Painel', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
                { id: 'Cadastro', label: 'Cadastro', icon: <FileCode className="w-3.5 h-3.5" /> },
                { id: 'Checkouts', label: 'Ativos em Campo', icon: <ClipboardList className="w-3.5 h-3.5" /> },
                { id: 'Manutenção', label: 'Manutenção', icon: <Wrench className="w-3.5 h-3.5" /> },
                { id: 'OcorrênciasNC', label: 'NCs', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
                { id: 'Inventário', label: 'Inventário', icon: <Boxes className="w-3.5 h-3.5" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold shrink-0 transition ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-950/40 text-rose-400 p-2 rounded-md border border-red-900/40 shrink-0 transition cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'Dashboard' && (
          <Dashboard 
            tools={tools} 
            cautelas={cautelas} 
            ocorrencias={ocorrencias} 
            maintenance={maintenance} 
            inventory={inventory}
            setActiveTab={setActiveTab}
            userRole={userRole}
            onUpdateExpectedReturnDate={handleUpdateExpectedReturnDate}
          />
        )}

        {activeTab === 'Cadastro' && (
          <ToolCatalog 
            tools={tools} 
            onAddTool={handleAddTool} 
            onUpdateToolStatus={handleUpdateToolStatus} 
            userRole={userRole}
          />
        )}

        {activeTab === 'Checkouts' && (
          <CheckoutHistory 
            cautelas={cautelas} 
            tools={tools} 
            onCreateCautela={handleCreateCautela}
            onReturnCautela={handleReturnCautela}
            userRole={userRole}
            onUpdateExpectedReturnDate={handleUpdateExpectedReturnDate}
          />
        )}

        {activeTab === 'Manutenção' && (
          <MaintenancePlanner 
            maintenance={maintenance} 
            tools={tools} 
            onAddMaintenance={(m) => saveMaintenanceState([...maintenance, m])}
            onPerformMaintenance={handlePerformMaintenance}
            userRole={userRole}
          />
        )}

        {activeTab === 'OcorrênciasNC' && (
          <NonConformityNC 
            ocorrencias={ocorrencias} 
            tools={tools} 
            onAddNC={handleAddNC}
            onModifyNCStatus={handleModifyNCStatus}
            userRole={userRole}
          />
        )}

        {activeTab === 'Inventário' && (
          <PhysicalInventory 
            inventoryItems={inventory} 
            tools={tools} 
            onUpdateInventoryCount={handleUpdateInventoryCount}
            onSyncInventoryToDatabase={handleSyncInventoryToDatabase}
            onResetInventorySession={handleResetInventorySession}
            userRole={userRole}
          />
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center mt-12 text-xs text-slate-400">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            &copy; 2026 Virtum Engenharia S/A. Todos os direitos reservados.
          </div>
          <div className="font-mono text-[10px]">
            Auditoria POP-ALM-001 | Layout Lean 5S | Controlo Malha Fechada
          </div>
        </div>
      </footer>

    </div>
  );
}
