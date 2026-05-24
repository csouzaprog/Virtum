/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MaintenanceItem, Tool, ToolStatus } from '../types';
import { 
  CalendarClock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Wrench, 
  Clock, 
  Plus, 
  Search, 
  Grid, 
  Settings, 
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';

interface MaintenancePlannerProps {
  maintenance: MaintenanceItem[];
  tools: Tool[];
  onAddMaintenance: (m: MaintenanceItem) => void;
  onPerformMaintenance: (id: string, performedBy: string, notes?: string) => void;
  userRole?: 'ADMIN' | 'VISU';
}

export default function MaintenancePlanner({ 
  maintenance, 
  tools, 
  onAddMaintenance, 
  onPerformMaintenance,
  userRole = 'ADMIN'
}: MaintenancePlannerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<string>('TODOS');
  
  // Custom execution state
  const [executingItem, setExecutingItem] = useState<MaintenanceItem | null>(null);
  const [performedBy, setPerformedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Calendar timeline view state (Section 4.2)
  const [activePlannerYear, setActivePlannerYear] = useState(2026);

  // Helper: date relative calculations (Today is 2026-05-24)
  const getDaysDiff = (dateStr: string) => {
    const today = new Date('2026-05-24T00:00:00Z');
    const target = new Date(dateStr + 'T00:00:00Z');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // POP formula calculation:
  // STATUS ALERTA: =IF(dias<0,"VENCIDA", IF(dias<=30,"URGENTE", IF(dias<=60,"ATENÇÃO","OK")))
  const getAlertStatusAndClass = (dueDate: string) => {
    const dias = getDaysDiff(dueDate);
    if (dias < 0) {
      return {
        label: 'VENCIDA',
        spanClass: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
        cardBorder: 'border-l-4 border-l-rose-600',
        textClass: 'text-rose-600',
        stage: 'FALHA CRÍTICA'
      };
    } else if (dias <= 30) {
      return {
        label: 'URGENTE',
        spanClass: 'bg-amber-100 text-amber-800 border-amber-200 font-bold animate-pulse',
        cardBorder: 'border-l-4 border-l-amber-500',
        textClass: 'text-amber-600',
        stage: 'CHAMADO REVISÃO'
      };
    } else if (dias <= 60) {
      return {
        label: 'ATENÇÃO',
        spanClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cardBorder: 'border-l-4 border-l-indigo-400',
        textClass: 'text-indigo-600',
        stage: 'PLANEJAMENTO EM CURSO'
      };
    } else {
      return {
        label: 'OK',
        spanClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBorder: 'border-l-4 border-l-emerald-500',
        textClass: 'text-emerald-600',
        stage: 'NORMALIZADA'
      };
    }
  };

  const handleExecuteMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingItem) return;

    onPerformMaintenance(executingItem.id, performedBy || 'Almoxarife Virtum', notes);
    alert(`Preventiva / Calibração registrada para o ID ${executingItem.toolId}! A próxima data de manutenção foi reagendada.`);
    setExecutingItem(null);
    setPerformedBy('');
    setNotes('');
  };

  // Filter schedules
  const filteredMaintenance = maintenance.filter(m => {
    const statusObj = getAlertStatusAndClass(m.dueDate);
    const matchesSearch = 
      m.toolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAlert = selectedAlert === 'TODOS' || statusObj.label === selectedAlert;

    return matchesSearch && matchesAlert;
  });

  // Reference tables from section 4.2
  // Calibração: JAN (✓), JUL (✓)
  // Elétricas: FEV (✓), JUN (✓), OUT (✓)
  // EPIs: todos meses (✓)
  // Inventário geral: JAN, JUN, DEZ
  const popChecklist2026 = [
    { service: 'Calibração Instrumentos (Lab. Credenciado)', months: [true, false, false, false, false, false, true, false, false, false, false, false] },
    { service: 'Revisão Corretiva/Preventiva Elétricas', months: [false, true, false, false, false, true, false, false, false, true, false, false] },
    { service: 'Inspeção e Laudo EPI Elétricos (Classe 00/0)', months: [true, true, true, true, true, true, true, true, true, true, true, true] },
    { service: 'Inventário Geral Patrimoniado', months: [true, false, false, false, false, true, false, false, false, false, false, true] },
    { service: 'Inspeção de Escadas de Fibra (NR-35)', months: [false, true, false, false, false, false, false, true, false, false, false, false] }
  ];

  const monthShortNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  return (
    <div className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-600" /> Cronograma de Manutenção Preventiva & Calibração
            </h2>
            <p className="text-xs text-slate-500">
              Lógica por criticidade: Calibração obrigatória anual (medição), revisão semestral (elétricas), inspeções periódicas (EPI elétricos & escadas).
            </p>
          </div>
        </div>

        {/* Filters and search info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100 mt-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text"
              placeholder="Filtrar por nome do ativo, código patrimonial ou tipo de manutenção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <select
              value={selectedAlert}
              onChange={(e) => setSelectedAlert(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="TODOS">Todos os Alertas</option>
              <option value="VENCIDA">Vencidas (Pendência Operacional)</option>
              <option value="URGENTE">Urgente (Menos de 30 dias)</option>
              <option value="ATENÇÃO">Atenção (Menos de 60 dias)</option>
              <option value="OK">OK (Garantia Ativa)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of preventive items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaintenance.map((m) => {
          const alertInfo = getAlertStatusAndClass(m.dueDate);
          const daysRem = getDaysDiff(m.dueDate);
          return (
            <div 
              key={m.id} 
              className={`bg-white rounded-xl border border-slate-200 ${alertInfo.cardBorder} shadow-sm p-4.5 flex flex-col justify-between space-y-4`}
            >
              <div>
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">{m.toolId}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">{m.toolName}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${alertInfo.spanClass}`}>
                    {alertInfo.label}
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex flex-col gap-0.5 bg-slate-50/70 p-2 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">Tipo de Serviço POP:</span>
                    <span className="font-semibold text-slate-800 leading-normal">{m.serviceType}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block pb-0.5">Última Realização:</span>
                      <span className="font-mono text-slate-800 font-bold">{m.lastDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block pb-0.5">Próximo Vencimento:</span>
                      <span className={`font-mono font-bold ${daysRem < 0 ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                        {m.dueDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons and summary */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/20 -mx-4.5 -mb-4.5 p-4 rounded-b-xl">
                <div className="text-[10px] text-slate-500 font-mono">
                  {daysRem < 0 ? (
                    <span className="text-rose-600 font-bold">Atrasada há {Math.abs(daysRem)} dias!</span>
                  ) : (
                    <span>Faltam {daysRem} dias</span>
                  )}
                </div>

                {userRole === 'ADMIN' ? (
                  <button 
                    onClick={() => setExecutingItem(m)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Registrar Realização
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded font-mono select-none">Apenas Consulta</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reconstitution of complete visual Section 4.2 Yearly Schedule matrix */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold font-sans text-slate-900 text-sm">Cronograma Anual Simplificado (Guia de Metas POP-ALM-001)</h3>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-mono font-bold">Ano Referência: {activePlannerYear}</span>
        </div>

        <p className="text-xs text-slate-505 leading-relaxed">
          Gabarito visual das atividades corporativas planejadas para o ano em curso. Os ticks indicam conformidade de realização física obrigatória em laboratório central ou auditor de segurança em campo:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-mono text-[10px]">
              <tr>
                <th className="p-3 text-left">SERVIÇO PROGRAMADO POP</th>
                {monthShortNames.map(m => (
                  <th key={m} className="p-2 text-center border-l border-slate-800">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {popChecklist2026.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-850 truncate max-w-[280px]">
                    {row.service}
                  </td>
                  {row.months.map((isPresent, mIdx) => (
                    <td key={mIdx} className="p-2 text-center border-l">
                      {isPresent ? (
                        <span className="inline-flex justify-center items-center w-5 h-5 rounded bg-amber-500/10 border border-amber-300 text-amber-600 text-xs font-bold font-mono">
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-350 select-none">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3 border text-slate-500 text-[11px] leading-normal font-sans italic">
          <span className="font-bold text-slate-800 not-italic">Gatilhos adicionais que antecipam a manutenção:</span> devolução com avaria registrada, reclamação de usuário em campo ou falha funcional identificada na conferência de saída.
        </div>
      </div>

      {/* Execution register modal */}
      {executingItem && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400">
                Laudo de Preventiva / Calibração Ativa
              </h3>
              <button 
                onClick={() => setExecutingItem(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteMaintenance} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                <div><span className="font-bold">Item:</span> {executingItem.toolName}</div>
                <div><span className="font-bold">Patrimônio ID:</span> {executingItem.toolId}</div>
                <div><span className="font-bold">Vencimento Programado:</span> {executingItem.dueDate}</div>
                <div><span className="font-bold">Periodicidade:</span> Cada {executingItem.frequencyDays} dias</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Técnico / Responsável pela Execução *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Laboratório RBC Credenciado, Almoxarife Virtum"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Laudo de Liberação / Notas Técnicas</label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes como: número do certificado RBC, lubrificações aplicadas, testes funcionais concluídos com sucesso..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-[11px] text-blue-800 leading-normal">
                 Ao registrar, o sistema calculará automaticamente o próximo vencimento adicionando <span className="font-bold font-mono">{executingItem.frequencyDays} dias</span> a partir de hoje (24/05/2026), e o status do ativo será redefinido para <span className="font-bold">DISPONÍVEL</span>.
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  type="button"
                  onClick={() => setExecutingItem(null)}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded-lg cursor-pointer shadow-xs"
                >
                  Salvar e Reajustar Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
