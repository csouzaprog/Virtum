/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OcorrenciaNC, Tool, ToolStatus } from '../types';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  FileText, 
  Trash, 
  Users, 
  Search, 
  Plus, 
  AlertTriangle,
  Inbox
} from 'lucide-react';

interface NonConformityNCProps {
  ocorrencias: OcorrenciaNC[];
  tools: Tool[];
  onAddNC: (nc: OcorrenciaNC) => void;
  onModifyNCStatus: (id: string, status: 'RESOLVIDA' | 'BAIXADA', remediation?: string) => void;
  userRole?: 'ADMIN' | 'VISU';
}

export default function NonConformityNC({ 
  ocorrencias, 
  tools, 
  onAddNC, 
  onModifyNCStatus,
  userRole = 'ADMIN'
}: NonConformityNCProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  
  // Custom manual NC creator form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [manualNC, setManualNC] = useState({
    toolId: '',
    colaborador: '',
    type: 'AVARIA LEVE' as 'AVARIA' | 'EXTRAVIO' | 'AVARIA LEVE',
    description: '',
    estimatedCost: 0,
    actionTaken: ''
  });

  // NC Resolving wizard states
  const [resolvingNC, setResolvingNC] = useState<OcorrenciaNC | null>(null);
  const [resolvingStatus, setResolvingStatus] = useState<'RESOLVIDA' | 'BAIXADA'>('RESOLVIDA');
  const [remediationNotes, setRemediationNotes] = useState('');

  const calculateTotalCost = () => {
    return ocorrencias.reduce((acc, curr) => acc + curr.estimatedCost, 0);
  };

  const handleCreateNC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNC.toolId || !manualNC.colaborador || !manualNC.description) {
      alert('Preencha os dados necessários.');
      return;
    }

    const nextNo = ocorrencias.length + 1;
    const generatedId = `NC-${String(nextNo).padStart(3, '0')}`;

    const selectedToolName = tools.find(t => t.id === manualNC.toolId)?.name || 'Ativo desconhecido';

    const objectNC: OcorrenciaNC = {
      id: generatedId,
      toolId: manualNC.toolId,
      toolName: selectedToolName,
      colaborador: manualNC.colaborador,
      date: '2026-05-24',
      type: manualNC.type,
      description: manualNC.description,
      estimatedCost: Number(manualNC.estimatedCost) || 0,
      actionTaken: manualNC.actionTaken || 'Ocorrência registrada no almoxarifado elétrico',
      status: 'ABERTA'
    };

    onAddNC(objectNC);
    setIsCreateOpen(false);
    
    // reset draft
    setManualNC({
      toolId: '',
      colaborador: '',
      type: 'AVARIA LEVE',
      description: '',
      estimatedCost: 0,
      actionTaken: ''
    });

    alert(`Não Conformidade ${generatedId} lançada para o patrimônio ${manualNC.toolId}!`);
  };

  const submitNCResolution = () => {
    if (!resolvingNC) return;

    onModifyNCStatus(resolvingNC.id, resolvingStatus, remediationNotes);
    alert(`Ocorrência ${resolvingNC.id} finalizada com status ${resolvingStatus}!`);
    setResolvingNC(null);
    setRemediationNotes('');
  };

  const filteredNC = ocorrencias.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.toolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.colaborador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'TODOS' || o.type === selectedType;
    const matchesStatus = selectedStatus === 'TODOS' || o.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Overview stats of incidents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-mono font-bold uppercase block">Não Conformidades Ativas (Abertas)</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-rose-600">
              {ocorrencias.filter(o => o.status === 'ABERTA').length}
            </span>
            <span className="bg-rose-50 border border-rose-100 text-[10px] text-rose-800 font-mono uppercase px-2 py-0.5 rounded font-bold">
              Crítico
            </span>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-mono font-bold uppercase block">Prejuízo / Custo Acumulado</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-slate-900">
              R$ {calculateTotalCost().toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-semibold">desde início logs</span>
          </div>
        </div>

        {/* Action column */}
        <div className="bg-slate-950 text-white rounded-xl p-5 border shadow-sm flex flex-col justify-between">
          <div className="text-xs text-blue-400 font-extrabold uppercase tracking-widest font-mono text-[10px]">Controle de Calamidades</div>
          {userRole === 'ADMIN' ? (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs p-2.5 rounded-lg flex justify-center items-center gap-1.5 transition mt-3 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Registrar NC Manualmente
            </button>
          ) : (
            <div className="text-slate-400 text-xs italic mt-3 select-none text-center bg-slate-900/40 p-2 rounded border border-slate-800">Apenas administradores podem registrar ocorrências manuais.</div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-xl p-4.5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3.5">
        
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input 
            type="text"
            placeholder="Buscar por ID, ferramenta, colaborador envolvido, fatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-100/50"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-50 border p-2 text-xs text-slate-700 rounded-lg focus:outline-none"
          >
            <option value="TODOS">Todas Avarias</option>
            <option value="AVARIA">Avaria Grave</option>
            <option value="AVARIA LEVE">Avaria Leve</option>
            <option value="EXTRAVIO">Extravios</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border p-2 text-xs text-slate-700 rounded-lg focus:outline-none"
          >
            <option value="TODOS">Todos Status</option>
            <option value="ABERTA">Abertas / Pendências</option>
            <option value="RESOLVIDA">Resolvidas / Reparadas</option>
            <option value="BAIXADA">Baixadas do Patrimônio</option>
          </select>
        </div>
      </div>

      {/* Incident logs list */}
      <div className="space-y-4">
        {filteredNC.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-dashed p-10 text-center">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
            <span className="text-slate-500 text-xs block font-bold">Nenhum registro de conformidade de avaria encontrado</span>
            <span className="text-slate-400 text-[11px] mt-0.5 block">Não há desvios ativos sob os filtros selecionados.</span>
          </div>
        ) : (
          filteredNC.map((nc) => {
            const isUnresolved = nc.status === 'ABERTA';
            return (
              <div 
                key={nc.id} 
                className={`bg-white border rounded-xl shadow-sm p-4.5 flex flex-col md:flex-row gap-4.5 justify-between ${
                  isUnresolved ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-emerald-500'
                }`}
              >
                {/* Details text block */}
                <div className="space-y-3.5 flex-1">
                  
                  {/* Row 1 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {nc.id}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-rose-100 uppercase ${
                      nc.type === 'AVARIA' ? 'bg-red-50 text-red-700' : nc.type === 'EXTRAVIO' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {nc.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-semibold">| Lançado em: {nc.date}</span>
                    
                    <span className={`text-[10px] uppercase font-bold px-1.5 rounded-full ml-auto font-mono border ${
                      nc.status === 'ABERTA' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {nc.status}
                    </span>
                  </div>

                  {/* Row 2: Tool title */}
                  <div>
                    <div className="text-xs text-slate-400 font-mono">[Ativo envolvido: {nc.toolId}]</div>
                    <div className="font-bold text-slate-900 font-sans text-sm">{nc.toolName}</div>
                  </div>

                  {/* Row 3: Facts description */}
                  <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded border border-slate-100 italic leading-relaxed">
                    "{nc.description}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-450 block font-bold uppercase text-[9px]">Colaborador Vinculado:</span>
                      <span className="font-medium text-slate-800">{nc.colaborador}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-bold uppercase text-[9px]">Ação e Tratamento Realizado:</span>
                      <span className="font-medium text-slate-800">{nc.actionTaken}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px bg-slate-100 shrink-0"></div>

                {/* Right col: cost + resolve trigger */}
                <div className="md:w-52 flex flex-col justify-between items-start md:items-end gap-3 shrink-0">
                  <div className="space-y-0.5 text-left md:text-right">
                    <span className="text-[10px] text-slate-400 font-mono font-bold block uppercase">Prejuízo Financeiro:</span>
                    <span className="text-xl font-mono font-black text-rose-600">
                      R$ {nc.estimatedCost.toFixed(2)}
                    </span>
                  </div>

                  {isUnresolved ? (
                    userRole === 'ADMIN' ? (
                      <button
                        onClick={() => setResolvingNC(nc)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition w-full text-center block select-none cursor-pointer"
                      >
                        Tratar Desvio / Baixar
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold bg-slate-150 px-2 py-1.5 rounded font-mono select-none block text-center w-full">Apenas Consulta</span>
                    )
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      ✓ Resolvido em laudo de auditoria
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Manual NC registration portal modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-slate-800 animate-fade-in">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400">
                Laudo manual de Desvio / Falha Operacional
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold font-sans"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNC} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Selecione o Ativo com Avaria *</label>
                <select 
                  required
                  value={manualNC.toolId}
                  onChange={(e) => setManualNC(prev => ({ ...prev, toolId: e.target.value }))}
                  className="w-full bg-slate-50 border p-2 text-xs rounded-lg text-slate-800"
                >
                  <option value="">Selecione a ferramenta patrimonial...</option>
                  {tools.map(t => (
                    <option key={t.id} value={t.id}>{t.id} — {t.name} (Status: {t.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Responsável Envolvido *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nome do colaborador e matrícula"
                  value={manualNC.colaborador}
                  onChange={(e) => setManualNC(prev => ({ ...prev, colaborador: e.target.value }))}
                  className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Qualificação do Fato</label>
                  <select 
                    value={manualNC.type}
                    onChange={(e) => setManualNC(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border p-1.5 text-xs rounded-lg text-slate-800"
                  >
                    <option value="AVARIA LEVE">Avaria Leve (Reparável local)</option>
                    <option value="AVARIA">Avaria Grave (Defeito/Prejuízo estrutural)</option>
                    <option value="EXTRAVIO">Extravio / Item perdido</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Prejuízo Estimado (R$)</label>
                  <input 
                    type="number" 
                    placeholder="250.00"
                    value={manualNC.estimatedCost || ''}
                    onChange={(e) => setManualNC(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Fatos / Descrição da Acontecência *</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Instâncias do acontecido. Ex: Furadeira travou gatilho após superaquecimento, colaborador deixou cair medidor..."
                  value={manualNC.description}
                  onChange={(e) => setManualNC(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Remediação Provisória / Ação</label>
                <input 
                  type="text" 
                  placeholder="Ex: Item encaminhado para bancada para laudo técnico..."
                  value={manualNC.actionTaken}
                  onChange={(e) => setManualNC(prev => ({ ...prev, actionTaken: e.target.value }))}
                  className="w-full bg-slate-50 p-2 border text-xs rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded-lg cursor-pointer"
                >
                  Registrar Fatos
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Audit treatment wizard modal */}
      {resolvingNC && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400">
                AUDITORIA NC — TRATAMENTO DE DESVIO
              </h3>
              <button 
                onClick={() => setResolvingNC(null)}
                className="text-slate-400 hover:text-white text-lg font-bold font-sans"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs">
                <div><span className="font-bold">Ocorrência:</span> {resolvingNC.id} ({resolvingNC.type})</div>
                <div><span className="font-bold">Ferramenta:</span> {resolvingNC.toolId} — {resolvingNC.toolName}</div>
                <div><span className="font-bold">Custo:</span> R$ {resolvingNC.estimatedCost.toFixed(2)}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block uppercase">Solução de Fechamento Patrimonial</label>
                <select
                  value={resolvingStatus}
                  onChange={(e) => setResolvingStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded-lg text-slate-800"
                >
                  <option value="RESOLVIDA">RESOLVER — Ferramenta reparada e retorna ao estoque</option>
                  <option value="BAIXADA">BAIXAR — Perda definitiva (Extrair ativo do almoxarifado)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block uppercase">Anotações do Laudo Técnico Final *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Instâncias técnicas de reparação ou comprovante de baixa..."
                  value={remediationNotes}
                  onChange={(e) => setRemediationNotes(e.target.value)}
                  className="w-full bg-white border p-2 text-xs rounded-lg"
                />
              </div>

              <div className="bg-slate-50 border p-3 rounded text-[11px] text-slate-500 leading-snug">
                {resolvingStatus === 'RESOLVIDA' ? (
                  <span>O status da ferramenta retornará para <span className="font-bold text-slate-800">DISPONÍVEL</span> apto para novo empréstimo no almoxarifado assim que finalizado.</span>
                ) : (
                  <span>A ferramenta será extraída em definitivo com status <span className="font-bold text-rose-750">BAIXADA/AVARIADA</span>, o que impede novos empréstimos por segurança regulamentar.</span>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => setResolvingNC(null)}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={submitNCResolution}
                  disabled={!remediationNotes}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg cursor-pointer shadow-xs"
                >
                  Concluir Lançamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
