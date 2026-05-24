/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventarioItem, Tool } from '../types';
import { 
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package, 
  SlidersHorizontal,
  Bookmark,
  Check,
  ShieldCheck,
  Zap,
  Layers
} from 'lucide-react';

interface PhysicalInventoryProps {
  inventoryItems: InventarioItem[];
  tools: Tool[];
  onUpdateInventoryCount: (toolId: string, count: number) => void;
  onSyncInventoryToDatabase: () => void;
  onResetInventorySession: () => void;
  userRole?: 'ADMIN' | 'VISU';
}

export default function PhysicalInventory({
  inventoryItems,
  tools,
  onUpdateInventoryCount,
  onSyncInventoryToDatabase,
  onResetInventorySession,
  userRole = 'ADMIN'
}: PhysicalInventoryProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('TODOS');

  const countMatchesFilter = (status: string) => {
    return inventoryItems.filter(item => {
      if (status === 'TODOS') return true;
      return item.status === status;
    }).length;
  };

  // Filter items
  const filteredItems = inventoryItems.filter(it => {
    const matchesSearch = 
      it.toolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatusFilter === 'TODOS' || it.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleQtyChange = (toolId: string, value: string) => {
    const num = parseInt(value, 10);
    onUpdateInventoryCount(toolId, isNaN(num) ? 0 : num);
  };

  // Helper: Visual alert for difference status translation (Section 5 IF Formulas)
  const getDifferenceIndicator = (diff: number, status: 'OK' | 'FALTA' | 'SOBRA') => {
    if (diff === 0) {
      return {
        text: 'CONFORME (OK)',
        class: 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold',
        icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      };
    } else if (diff < 0) {
      return {
        text: `FALTA (${diff})`,
        class: 'bg-rose-50 text-rose-700 border-rose-100 font-black animate-pulse',
        icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />
      };
    } else {
      return {
        text: `SOBRA (+${diff})`,
        class: 'bg-purple-50 text-purple-700 border-purple-100 font-bold',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
      };
    }
  };

  const handleSyncClick = () => {
    const differencesCount = inventoryItems.filter(it => it.difference !== 0).length;
    if (differencesCount > 0) {
      const confirmSync = window.confirm(
        `Aviso: Existem ${differencesCount} discrepâncias identificadas entre as contagens físicas e os registros do sistema. Deseja realizar a sincronização e ajustar as quantidades e status das ferramentas?`
      );
      if (!confirmSync) return;
    }
    onSyncInventoryToDatabase();
    alert('Base patrimonial sincronizada com sucesso com base nas conferências físicas executadas!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Overview stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" /> Auditoria Geral de Inventário Físico Mensal
            </h2>
            <p className="text-xs text-slate-505">
              Fórmula de discrepância: <code className="bg-slate-100 text-slate-800 font-mono text-[10.5px] px-1 py-0.5 rounded font-bold">=Física - Sistema</code>. O sistema sinaliza as anomalias de layout ou extravio instantaneamente.
            </p>
          </div>

          {userRole === 'ADMIN' ? (
            <div className="flex gap-2">
              <button 
                onClick={onResetInventorySession}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer"
              >
                Resetar Contagem
              </button>
              <button 
                onClick={handleSyncClick}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300 animate-pulse" /> Consolidar e Atualizar Sistema
              </button>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 text-[11px] font-bold font-mono text-slate-500 px-3 py-2 rounded-lg select-none">
              🌐 APENAS CONSULTA
            </div>
          )}
        </div>

        {/* Dynamic breakdown counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          
          <div className="bg-slate-50 p-2 rounded-lg border flex flex-col justify-center text-center">
            <span className="text-[10px] text-slate-400 font-mono font-bold block">TOTAL AUDITADO</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{inventoryItems.length}</span>
          </div>

          <div className="bg-emerald-50/40 p-2 rounded-lg border border-emerald-100 flex flex-col justify-center text-center">
            <span className="text-[10px] text-emerald-600 font-mono font-bold block">CONFORMES (OK)</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{countMatchesFilter('OK')}</span>
          </div>

          <div className="bg-rose-50/30 p-2 rounded-lg border border-rose-100 flex flex-col justify-center text-center">
            <span className="text-[10px] text-rose-600 font-mono font-bold block">FALTANDO (FALTA)</span>
            <span className="text-lg font-bold text-rose-700 font-mono">{countMatchesFilter('FALTA')}</span>
          </div>

          <div className="bg-purple-50/20 p-2 rounded-lg border border-purple-100 flex flex-col justify-center text-center">
            <span className="text-[10px] text-purple-600 font-mono font-bold block">SOBRE-ALOCAÇÃO (SOBRA)</span>
            <span className="text-lg font-bold text-purple-700 font-mono">{countMatchesFilter('SOBRA')}</span>
          </div>

        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="bg-white border rounded-xl p-4.5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text"
            placeholder="Pesquisar por ID, nome ou endereço de coordenadas 5S..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-100/50"
          />
        </div>

        <div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border p-2 text-xs text-slate-705 rounded-lg focus:outline-none"
          >
            <option value="TODOS">Todos Status de Inventário</option>
            <option value="OK">Apenas OK (Conformes)</option>
            <option value="FALTA">Apenas FALTANDO (Ações Corretivas)</option>
            <option value="SOBRA">Apenas SOBRADO (Ajustes de Layout)</option>
          </select>
        </div>
      </div>

      {/* Checking ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="p-4 leading-none">Código Ativo</th>
                <th className="p-4 leading-none">Descrição / Nome do Ativo</th>
                <th className="p-4 leading-none">Localização 5S</th>
                <th className="p-4 text-center leading-none">Saldo Sistema</th>
                <th className="p-4 text-center leading-none">Contagem Física</th>
                <th className="p-4 text-center leading-none">Anomalia / Diferença</th>
                <th className="p-4 text-right leading-none">Status Inventário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    Nenhum ativo sob estes critérios de busca ou filtro.
                  </td>
                </tr>
              ) : (
                filteredItems.map((it) => {
                  const stateIndicator = getDifferenceIndicator(it.difference, it.status);
                  return (
                    <tr key={it.toolId} className="hover:bg-slate-50/30 transition">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {it.toolId}
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="font-semibold text-slate-900 text-xs">{it.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{it.category}</div>
                      </td>
                      <td className="p-4 text-slate-500">
                        <div className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block">
                          {it.address}
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-medium text-slate-700 text-xs">
                        {it.qtySystem}
                      </td>
                      <td className="p-4 text-center">
                        {userRole === 'ADMIN' ? (
                          <div className="flex justify-center items-center gap-1">
                            
                            {/* Decrement */}
                            <button
                              onClick={() => onUpdateInventoryCount(it.toolId, Math.max(0, it.qtyPhysical - 1))}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[11px] select-none cursor-pointer"
                            >
                              -
                            </button>
                            
                            {/* input text box */}
                            <input 
                              type="number"
                              min="0"
                              value={it.qtyPhysical}
                              onChange={(e) => handleQtyChange(it.toolId, e.target.value)}
                              className="w-12 bg-slate-50 focus:bg-white text-center border text-xs font-mono font-bold p-1 rounded focus:outline-none"
                            />

                            {/* Increment */}
                            <button
                              onClick={() => onUpdateInventoryCount(it.toolId, it.qtyPhysical + 1)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[11px] select-none cursor-pointer"
                            >
                              +
                            </button>

                            {/* Quick Audit Match checkbox */}
                            <button
                              onClick={() => onUpdateInventoryCount(it.toolId, it.qtySystem)}
                              className="hover:bg-emerald-50 border border-transparent hover:border-emerald-200 text-slate-400 hover:text-emerald-600 bg-slate-50 p-1 rounded cursor-pointer"
                              title="Igualar ao Saldo do Sistema"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border px-3 py-1.5 rounded">{it.qtyPhysical}</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono font-black text-xs">
                        {it.difference === 0 ? (
                          <span className="text-emerald-600 text-[11px] font-bold">0 (Conforme)</span>
                        ) : it.difference < 0 ? (
                          <span className="text-rose-600 text-[11px] font-extrabold">{it.difference}</span>
                        ) : (
                          <span className="text-purple-600 text-[11px] font-bold">+{it.difference}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase border px-2.5 py-1 rounded font-mono ${stateIndicator.class}`}>
                          {stateIndicator.icon} {stateIndicator.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5S layout quick checking audit guide */}
      <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/10">
        <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs mb-2">
          <Zap className="w-4 h-4 text-blue-600" /> Guia Prático para o Almoxarife — Cobertura POP Inventário
        </div>
        <p className="text-[11px] text-slate-550 leading-relaxed leading-normal">
          Durante a contagem, verifique os endereços impressos nas etiquetas físicas. Se econtrado em local incorreto (ex: medidor no armário D em vez do armário A), reposicione o ativo e atualize as coordenadas. No caso de consumíveis (Fita Isolante, abraçadeiras), realize a pesagem ou contagem estimada de rolos. Discrepâncias acumuladas devem ser justificadas ou cobertas abrindo NC.
        </p>
      </div>

    </div>
  );
}
