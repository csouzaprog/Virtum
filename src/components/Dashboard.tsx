/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Tool, 
  Cautela, 
  OcorrenciaNC, 
  MaintenanceItem, 
  InventarioItem 
} from '../types';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  Wrench, 
  DollarSign, 
  ClipboardCheck, 
  ChevronRight, 
  Info
} from 'lucide-react';

interface DashboardProps {
  tools: Tool[];
  cautelas: Cautela[];
  ocorrencias: OcorrenciaNC[];
  maintenance: MaintenanceItem[];
  inventory: InventarioItem[];
  setActiveTab: (tab: string) => void;
  userRole: 'ADMIN' | 'VISU';
  onUpdateExpectedReturnDate: (cautelaId: string, newDate: string) => void;
}

export default function Dashboard({ 
  tools, 
  cautelas, 
  ocorrencias, 
  maintenance, 
  inventory,
  setActiveTab,
  userRole,
  onUpdateExpectedReturnDate
}: DashboardProps) {
  
  const [dashboardSubTab, setDashboardSubTab] = React.useState<'ALERTAS' | 'ESGOTADOS'>('ALERTAS');
  const [selectedInFieldToolId, setSelectedInFieldToolId] = React.useState<string | null>(null);
  
  // Rescheduling states
  const [reschedulingCautelaId, setReschedulingCautelaId] = React.useState<string | null>(null);
  const [reschedulingDate, setReschedulingDate] = React.useState<string>('');
  
  // Calculate date diff helper in days
  const getDaysDiff = (dateStr: string) => {
    const today = new Date('2026-05-24T00:00:00Z');
    const target = new Date(dateStr + 'T00:00:00Z');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- KPI CALCULATIONS ---
  
  // 1. Taxa de Disponibilidade (Disponíveis / Total Cadastrado) * 100
  const totalTools = tools.length;
  const disponivelTools = tools.filter(t => t.status === 'DISPONÍVEL').length;
  const availabilityRate = totalTools > 0 ? (disponivelTools / totalTools) * 100 : 0;
  const isAvailabilityOk = availabilityRate >= 85;

  // 2. Taxa de Retenção em Campo (Em uso / Total Cadastrado) * 100
  const inFieldToolsList = tools.filter(t => t.status === 'EM USO');
  const inFieldTools = inFieldToolsList.length;
  const fieldRetentionRate = totalTools > 0 ? (inFieldTools / totalTools) * 100 : 0;
  const isRetentionOk = fieldRetentionRate < 60;

  // 3. Taxa de NC por Avaria (NCs Abertas / Cautelas Emitidas) * 100
  const activeNCsCount = ocorrencias.filter(o => o.status === 'ABERTA').length;
  const totalCautelasCount = cautelas.length;
  const ncRate = totalCautelasCount > 0 ? (activeNCsCount / totalCautelasCount) * 100 : 0;
  const isNcRateOk = ncRate < 5;

  // 4. Tempo Médio de Retenção (Soma dias retido / total de cautelas)
  const calculateAverageRetentionDays = () => {
    let totalDays = 0;
    let countedCautelas = 0;
    
    cautelas.forEach(c => {
      const start = new Date(c.dateOut + 'T00:00:00Z');
      const end = c.actualReturnDate 
        ? new Date(c.actualReturnDate + 'T00:00:00Z') 
        : new Date('2026-05-24T00:00:00Z'); // counts until today if still active
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDays += Math.max(0, diffDays);
      countedCautelas++;
    });

    return countedCautelas > 0 ? Number((totalDays / countedCautelas).toFixed(1)) : 0;
  };
  const avgRetentionDays = calculateAverageRetentionDays();
  const isRetentionDaysOk = avgRetentionDays < 5;

  // 5. Índice de Manutenção Vencida (Itens vencidos com PM / Total com PM) * 100
  const totalPMItems = maintenance.length;
  const overduePMItems = maintenance.filter(m => getDaysDiff(m.dueDate) < 0).length;
  const overduePMPercentage = totalPMItems > 0 ? (overduePMItems / totalPMItems) * 100 : 0;
  const isPmOk = overduePMItems === 0;

  // 6. Cobertura de Inventário (Itens do inventário / total catalogos)
  const totalCounted = inventory.length; // unique registered items audited
  const inventoryCoverage = totalTools > 0 ? (totalCounted / totalTools) * 100 : 0;
  const isInventoryOk = inventoryCoverage >= 100;

  // 7. Custo de Reposição Mensal (Soma custos de NCs abertas ou resolvidas no mês de Maio 2026)
  const currentMonthReplenishCost = ocorrencias
    .filter(o => o.date.startsWith('2026-05'))
    .reduce((acc, curr) => acc + curr.estimatedCost, 0);
  const baselineCostLimit = 1500;
  const isRepositionOk = currentMonthReplenishCost < baselineCostLimit;

  // Fetch pending active alerts for "Ação se Desviar" (Section 3 list)
  const alerts: { title: string; desc: string; type: 'warning' | 'error' | 'success'; action: string }[] = [];

  if (!isAvailabilityOk) {
    alerts.push({
      title: 'Baixa Disponibilidade',
      desc: `Taxa de disponibilidade atual está em ${availabilityRate.toFixed(1)}% (Meta: ≥ 85%)`,
      type: 'error',
      action: 'Identificar ferramentas retidas além do prazo limite em campo e providenciar manutenções pendentes.'
    });
  }
  if (!isRetentionOk) {
    alerts.push({
      title: 'Alta Retenção em Campo',
      desc: `Saturação de campo em ${fieldRetentionRate.toFixed(1)}% (Meta: < 60%)`,
      type: 'warning',
      action: 'Cobrar devoluções imediatas de equipes com termos de cautela abertos há mais de 5 dias.'
    });
  }
  if (!isNcRateOk) {
    alerts.push({
      title: 'Alto Índice de Não Conformidades (NC)',
      desc: `Taxa de avarias em ${ncRate.toFixed(1)}% (Meta: < 5%)`,
      type: 'error',
      action: 'Agendar treinamento operacional de uso correto, inspeção de aterramentos e ergonomia das ferramentas.'
    });
  }
  if (!isRetentionDaysOk) {
    alerts.push({
      title: 'Tempo de Retenção Excedido',
      desc: `Tempo médio de campo está em ${avgRetentionDays} dias (Meta: < 5 dias)`,
      type: 'warning',
      action: 'Alertar supervisores e paralisar novas retiradas para equipes com devoluções atrasadas.'
    });
  }
  if (!isPmOk) {
    alerts.push({
      title: 'Manutenção Crítica Pendente',
      desc: `${overduePMItems} instrumentos de calibração ou ferramentas elétricas com revisão atrasada.`,
      type: 'error',
      action: 'Acionar manutenção imediatamente. Instrumentos de medição vencidos invalidam laudos e expõem a risco NR-10.'
    });
  }
  if (!isInventoryOk) {
    alerts.push({
      title: 'Inventário Geral Pendente',
      desc: `Apenas ${inventoryCoverage.toFixed(1)}% dos ativos auditados até o momento.`,
      type: 'warning',
      action: 'Finalizar a contagem física mensal do almoxarifado elétrico até o dia 10 para evitar perdas ocultas.'
    });
  }
  if (!isRepositionOk) {
    alerts.push({
      title: 'Orçamento de Reposição Estourado',
      desc: `Custo total de avarias este mês somam R$ ${currentMonthReplenishCost.toFixed(2)} (Meta: < R$ ${baselineCostLimit})`,
      type: 'error',
      action: 'Investigar causa raiz — avaliar se houve desgaste natural, fadiga de material ou imperícia grave.'
    });
  }

  // Active late checkouts (more than 5 days or expected date in the past)
  const lateCautelas = cautelas.filter(c => {
    if (c.status !== 'ATIVA') return false;
    const isOverdue = getDaysDiff(c.expectedReturnDate) < 0;
    return isOverdue;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full font-mono border border-blue-500/20">
            POP-ALM-001 | Lean Almoxarifado
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2 font-sans text-white">
            Virtum Engenharia — Almoxarifado Elétrico
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Controle integrado em malha fechada de ferramentas, calibrações e conformidade de segurança.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 font-mono text-sm">
          <div>
            <div className="text-slate-400 text-xs">HORÁRIO OPERACIONAL (UTC)</div>
            <div className="text-white font-semibold">2026-05-24 02:43:32</div>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div>
            <div className="text-slate-400 text-xs">ALMOXARIFE RESP.</div>
            <div className="text-blue-400 font-semibold">csouza1102@gmail</div>
          </div>
        </div>
      </div>

      {/* KPI Panel Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-2.5 mb-4">
          Indicadores de Desempenho (KPIs do Almoxarifado)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Disponibilidade */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-500">Taxa de Disponibilidade</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isAvailabilityOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                Meta ≥ 85%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{availabilityRate.toFixed(1)}%</span>
              <span className="text-sm text-slate-500 font-mono">({disponivelTools}/{totalTools})</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isAvailabilityOk ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, availabilityRate)}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                {isAvailabilityOk ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                <span>{isAvailabilityOk ? 'Disponibilidade Adequada' : 'Nível Crítico de Ativos'}</span>
              </div>
            </div>
          </div>

          {/* Retencao em Campo */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-500">Retenção em Campo</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isRetentionOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                Meta &lt; 60%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{fieldRetentionRate.toFixed(1)}%</span>
              <span className="text-sm text-slate-500 font-mono">({inFieldTools} em uso)</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isRetentionOk ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, fieldRetentionRate)}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                {isRetentionOk ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isRetentionOk ? 'Estoque Estável' : 'Reter ferramentas em excesso'}</span>
              </div>
            </div>
          </div>

          {/* Taxa de NC por Avaria */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-500">Taxa NC por Avaria</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isNcRateOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                Meta &lt; 5%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{ncRate.toFixed(1)}%</span>
              <span className="text-sm text-slate-500 font-mono">({activeNCsCount} abertas)</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isNcRateOk ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, ncRate * 10)}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                {isNcRateOk ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                <span>{isNcRateOk ? 'Nível Aceitável de Danos' : 'Avarias acima do Limite'}</span>
              </div>
            </div>
          </div>

          {/* Tempo Medio de Retencao */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-500">Tempo Médio Retenção</span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${isRetentionDaysOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                Meta &lt; 5 dias
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{avgRetentionDays} <span className="text-sm font-normal">dias</span></span>
              <span className="text-sm text-slate-500 font-mono">/ cautela</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isRetentionDaysOk ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (avgRetentionDays / 7) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                {isRetentionDaysOk ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isRetentionDaysOk ? 'Giro de Ativo Saudável' : 'Ferramentas paradas em campo'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Grid Secundária de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PM Indicator & Inventory */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <h3 className="font-semibold text-slate-800 text-sm tracking-wide uppercase">Controle Operacional Secundário</h3>
          
          {/* Manutenção Vencida */}
          <div className="space-y-1.5 pb-4 border-b border-slate-100">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Manutenção Vencida</span>
              <span className="font-mono font-medium text-slate-900 bg-slate-100 px-1.5 rounded">Meta: 0%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-xl font-bold text-slate-950 flex items-center gap-1.5">
                {overduePMItems === 0 ? (
                  <span className="text-emerald-600">0%</span>
                ) : (
                  <span className="text-rose-600">{overduePMPercentage.toFixed(0)}%</span>
                )}
                <span className="text-xs text-slate-400 font-normal">({overduePMItems} de {totalPMItems} itens PM)</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${overduePMItems === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 font-bold'}`}>
                {overduePMItems === 0 ? 'CALIBRAÇÃO OK' : 'ATRASO CRÍTICO'}
              </span>
            </div>
          </div>

          {/* Cobertura de Inventário */}
          <div className="space-y-1.5 pb-4 border-b border-slate-100">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Cobertura de Inventário</span>
              <span className="font-mono font-medium text-slate-900 bg-slate-100 px-1.5 rounded">Meta: 100% mensal</span>
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-xl font-bold text-slate-950">
                {inventoryCoverage.toFixed(0)}%
                <span className="text-xs text-slate-400 font-normal"> ({totalCounted} de {totalTools} ativos)</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isInventoryOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {isInventoryOk ? 'AUDITADO OK' : 'CONTAGEM PARCIAL'}
              </span>
            </div>
          </div>

          {/* Custo Reposição Mensal */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Custo de Reposição Mensal</span>
              <span className="font-mono font-medium text-slate-900 bg-slate-100 px-1.5 rounded">Meta &lt; R$ 1.500</span>
            </div>
            <div className="flex justify-between items-baseline">
              <div className={`text-xl font-bold ${isRepositionOk ? 'text-slate-950' : 'text-rose-600 font-extrabold'}`}>
                R$ {currentMonthReplenishCost.toFixed(2)}
              </div>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isRepositionOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-700 font-bold'}`}>
                {isRepositionOk ? 'DENTRO DA VERBA' : 'ORÇAMENTO ESTOURADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Closed-loop Control Actuator: "Ação se Desviar" section */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">Controle em Malha Fechada — Tratamento de Desvios</h3>
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Monitoramento automático dos parâmetros. Sempre que um desvio ocorre em relação à especificação do POP-ALM-001, o sistema aciona ordens de ação imediatas:
            </p>

            <div className="space-y-3.5 max-h-[195px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">ALMOXARIFADO EM EQUILÍBRIO (SETPOINT OK)</div>
                    <div className="text-[11px] opacity-90">Nenhum indicador violou as regras regulamentares operacionais da Virtum Engenharia.</div>
                  </div>
                </div>
              ) : (
                alerts.map((al, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border text-xs flex gap-2.5 items-start ${
                    al.type === 'error' ? 'bg-rose-50/70 border-rose-100 text-rose-900' : 'bg-blue-50/70 border-blue-100 text-blue-900'
                  }`}>
                    {al.type === 'error' ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">{al.title}</div>
                      <div className="text-[11px] opacity-90">{al.desc}</div>
                      <div className="border-t border-dashed mt-1.5 pt-1 font-medium italic flex items-center gap-1">
                        <span className="font-bold font-mono">Ação Corretiva:</span> {al.action}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
            <button 
              onClick={() => setActiveTab('OcorrênciasNC')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Auditar Não Conformidades <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Checkouts and Urgent PM Alerts lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Twin interactive sub-tabs for Field Allocations and Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">Controle de Ativos Deslocados em Campo</h3>
              </div>
              <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                Padrão POP-ALM
              </span>
            </div>

            {/* Sub-tabs header */}
            <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-lg mb-4 select-none">
              <button 
                type="button"
                onClick={() => setDashboardSubTab('ALERTAS')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition ${dashboardSubTab === 'ALERTAS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Prazos & Alertas ({lateCautelas.length})
              </button>
              <button 
                type="button"
                onClick={() => setDashboardSubTab('ESGOTADOS')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-md transition ${dashboardSubTab === 'ESGOTADOS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Ativos Esgotados no Almoxarifado ({inFieldToolsList.length})
              </button>
            </div>

            {/* Sub-tab view container */}
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              
              {dashboardSubTab === 'ALERTAS' && (
                <>
                  {lateCautelas.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Nenhum ativo apresenta atraso severo nas pretensões de devolução campo.
                    </div>
                  ) : (
                    lateCautelas.map((c) => {
                      const diff = getDaysDiff(c.expectedReturnDate);
                      return (
                        <div key={c.id} className="border border-red-100 bg-red-50/15 p-3 rounded-lg text-xs space-y-2">
                          <div className="flex justify-between items-start gap-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 font-mono">{c.id}</span>
                                <span className="text-slate-500">|</span>
                                <span className="font-bold text-slate-800">{c.colaborador}</span>
                              </div>
                              <div className="text-slate-500 text-[10px] font-mono mt-0.5">
                                Retirado em: {c.dateOut} • Obra: {c.obraDestino}
                              </div>
                            </div>
                            <span className="bg-red-50 text-red-700 font-extrabold text-[9px] px-1.5 py-0.5 rounded border border-red-200 font-mono tracking-tighter uppercase shrink-0">
                              {Math.abs(diff)}d Atraso
                            </span>
                          </div>

                          <div className="text-slate-600 text-[11px] font-medium font-sans">
                            Ativos: <span className="font-bold text-slate-700">{c.items.map(it => it.name).join(', ')}</span>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-dashed border-red-100">
                            <span className="text-[10px] text-rose-600 font-bold font-mono">Vencimento: {c.expectedReturnDate}</span>
                            
                            {userRole === 'ADMIN' ? (
                              reschedulingCautelaId === c.id ? (
                                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
                                  <input 
                                    type="date"
                                    value={reschedulingDate}
                                    onChange={(e) => setReschedulingDate(e.target.value)}
                                    className="bg-white border border-slate-300 text-[11.5px] p-1 rounded font-mono focus:outline-none"
                                  />
                                  <button 
                                    onClick={() => {
                                      if(!reschedulingDate) return;
                                      onUpdateExpectedReturnDate(c.id, reschedulingDate);
                                      setReschedulingCautelaId(null);
                                      alert(`✅ Data de Pretenção prorrogada com sucesso para ${reschedulingDate}!`);
                                    }}
                                    className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                                  >
                                    Salvar
                                  </button>
                                  <button 
                                    onClick={() => setReschedulingCautelaId(null)}
                                    className="bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded cursor-pointer"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReschedulingCautelaId(c.id);
                                    setReschedulingDate(c.expectedReturnDate);
                                  }}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                                >
                                  ✏ Alterar Data Antiga
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Login como Admin para alterar prazo</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {dashboardSubTab === 'ESGOTADOS' && (
                <>
                  {inFieldToolsList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Todos os ativos do catálogo elétrico estão disponíveis no estoque físico.
                    </div>
                  ) : (
                    inFieldToolsList.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => setSelectedInFieldToolId(selectedInFieldToolId === t.id ? null : t.id)}
                        className={`border rounded-lg p-2.5 hover:bg-slate-50 transition cursor-pointer ${selectedInFieldToolId === t.id ? 'border-blue-300 bg-blue-50/10' : 'border-slate-100 bg-white'}`}
                      >
                        <div className="flex justify-between items-start gap-1 text-xs">
                          <div>
                            <span className="font-mono bg-slate-150 text-slate-700 px-1 py-0.5 rounded text-[10px] font-bold mr-1.5">{t.id}</span>
                            <span className="font-bold text-slate-800">{t.name}</span>
                          </div>
                          <span className="bg-amber-100/80 text-amber-800 font-bold text-[9px] px-1.5 rounded uppercase font-sans border border-amber-200/50 shrink-0">
                            Zerado no Estoque
                          </span>
                        </div>

                        {selectedInFieldToolId === t.id ? (
                          <div className="mt-2.5 p-2 bg-blue-50 border border-blue-150 rounded-md text-[11px] space-y-1 text-slate-705 text-slate-700 animate-in fade-in duration-100">
                            <div className="text-[9.5px] font-mono font-bold text-blue-900 tracking-wider">👤 COLABORADOR EM POSSE:</div>
                            {(() => {
                              const activeC = cautelas.find(c => c.status === 'ATIVA' && c.items.some(it => it.toolId === t.id));
                              if (activeC) {
                                return (
                                  <>
                                    <div><span className="font-bold">Nome:</span> {activeC.colaborador} (Matrícula: {activeC.matricula})</div>
                                    <div><span className="font-bold">Destino / Obra:</span> {activeC.obraDestino}</div>
                                    <div className="text-[10px] text-slate-500">Retirado em: <span className="font-mono">{activeC.dateOut} {activeC.timeOut}</span></div>
                                    <div className="text-[10px] text-rose-600 font-bold">Expectativa Prazo: <span className="font-mono">{activeC.expectedReturnDate}</span></div>
                                  </>
                                );
                              } else {
                                return <div className="text-slate-500 italic">Nenhum termo de saída ativo encontrado para este ativo.</div>;
                              }
                            })()}
                          </div>
                        ) : (
                          <div className="mt-1 flex justify-between items-center text-[10.5px]">
                            <span className="text-slate-400">Categoria: {t.category}</span>
                            <span className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-0.5">
                              🔎 Ver Responsável em Campo
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setActiveTab('Checkouts')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Auditar Ativos em Campo (Registros) <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Maintenance Alerts List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-sm">Próximas Manutenções & Calibrações</h3>
            </div>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-100">
              {maintenance.filter(m => getDaysDiff(m.dueDate) <= 30).length} ALERTAS DE PRAZO
            </span>
          </div>

          <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
            {maintenance.slice(0, 5).map((m, idx) => {
              const diff = getDaysDiff(m.dueDate);
              let labelClass = 'bg-slate-100 text-slate-700';
              let statusText = 'OK';
              
              if (diff < 0) {
                labelClass = 'bg-rose-100 text-rose-800 font-bold';
                statusText = 'VENCIDA';
              } else if (diff <= 30) {
                labelClass = 'bg-amber-100 text-amber-800 font-semibold';
                statusText = 'URGENTE';
              } else if (diff <= 60) {
                labelClass = 'bg-slate-100 text-slate-700';
                statusText = 'ATENÇÃO';
              }

              return (
                <div key={idx} className="border border-slate-100 p-2.5 rounded-lg text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{m.toolName}</div>
                    <div className="text-slate-500 text-[10px] uppercase font-mono mt-0.5">
                      Cod: {m.toolId} • Serviço: {m.serviceType}
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-1 font-mono text-[10px]">
                      <span>Vencimento: {m.dueDate}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${labelClass}`}>
                      {statusText}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {diff < 0 ? `Atrasada ${Math.abs(diff)} dias` : `Faltam ${diff} dias`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setActiveTab('Manutenção')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              Abrir Cronograma Completo <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Lean 5S Visual Factoring Layout Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold font-sans text-slate-900 text-sm">Organização de Layout Físico 5S (Referência de Endereço)</h3>
        </div>
        
        <p className="text-xs text-slate-500 mb-4">
          Conforme definidido no <span className="font-bold text-slate-900">POP-ALM-001</span>, cada ferramenta patrimoniada tem coordenadas cartesiano fixas, descritas na etiqueta. Abaixo, repassa-se as regras de alocação de prateleiras e setores dedicados por criticidade:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-150 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="font-mono text-xs font-bold text-slate-800">ARMÁRIO TRANCADO</span>
            </div>
            <div className="text-slate-400 text-[11px] mb-1">Coordenadas: Setores A-XX, D-XX</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Equipamento de Medição/Precisão e Luvas Elétricas isolantes (Classe 00/0). Trancado com espuma, cujas chaves ficam exclusivamente com o almoxarife.
            </p>
          </div>

          <div className="border border-slate-150 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-mono text-xs font-bold text-slate-800">PRATELEIRAS SETOR B</span>
            </div>
            <div className="text-slate-400 text-[11px] mb-1">Coordenadas: Setores B-XX, S-XX</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Ferramentas elétricas (Furadeiras/Parafusadeiras) por equipe e Escadas em suportes de trilho de parede lateral esquerda. Alto giro mecânico.
            </p>
          </div>

          <div className="border border-slate-150 rounded-lg p-3 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-xs font-bold text-slate-800">PAINEL DE SILHUETAS</span>
            </div>
            <div className="text-slate-400 text-[11px] mb-1">Coordenadas: Setores C-XX, E-XX</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Ferramentas manuais (Alicates, chaves, martelos) dispostas por silhueta visível a 3 metros (vazio indica imediatamente ausência física do ativo).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
