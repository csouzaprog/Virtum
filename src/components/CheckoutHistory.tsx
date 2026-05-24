/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cautela, Tool, ToolStatus, OcorrenciaNC } from '../types';
import { 
  FileText, 
  Calendar, 
  User, 
  PenTool, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeftRight, 
  Clock, 
  ChevronRight, 
  Check, 
  Plus, 
  Printer, 
  ShieldAlert,
  Archive,
  Search
} from 'lucide-react';

interface CheckoutHistoryProps {
  cautelas: Cautela[];
  tools: Tool[];
  onCreateCautela: (cautela: Cautela) => void;
  onReturnCautela: (cautelaId: string, toolId: string, conditionIn: string, isAvaria: boolean, avariaDetails?: { type: 'AVARIA' | 'EXTRAVIO' | 'AVARIA LEVE'; description: string; cost: number }) => void;
  userRole: 'ADMIN' | 'VISU';
  onUpdateExpectedReturnDate: (cautelaId: string, newDate: string) => void;
}

export default function CheckoutHistory({ 
  cautelas, 
  tools, 
  onCreateCautela, 
  onReturnCautela,
  userRole,
  onUpdateExpectedReturnDate
}: CheckoutHistoryProps) {
  
  // Tab states: 'LISTA' | 'NOVA_CAUTELA' | 'PREVIEW_CAUTELA'
  const [panelMode, setPanelMode] = useState<'LISTA' | 'NOVA_CAUTELA' | 'PREVIEW_CAUTELA'>('LISTA');
  const [selectedCautelaId, setSelectedCautelaId] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Date editing state
  const [editingCautelaId, setEditingCautelaId] = useState<string | null>(null);
  const [newExpectedDate, setNewExpectedDate] = useState('');

  // Form states for checkout flow
  const [colaborador, setColaborador] = useState('');
  const [matricula, setMatricula] = useState('');
  const [obraDestino, setObraDestino] = useState('');
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-05-31');

  // Devolution handler state
  const [devolvingCautela, setDevolvingCautela] = useState<Cautela | null>(null);
  const [devolvingToolId, setDevolvingToolId] = useState<string | null>(null);
  const [conditionIn, setConditionIn] = useState('Fiel ao Retirado (OK)');
  const [isAvariado, setIsAvariado] = useState(false);
  const [avariaType, setAvariaType] = useState<'AVARIA' | 'EXTRAVIO' | 'AVARIA LEVE'>('AVARIA LEVE');
  const [avariaDesc, setAvariaDesc] = useState('');
  const [avariaCost, setAvariaCost] = useState(150);

  // Helper: date relative counts (today is 2026-05-24)
  const getDaysRetido = (c: Cautela) => {
    const today = new Date('2026-05-24T00:00:00Z');
    const start = new Date(c.dateOut + 'T00:00:00Z');
    const end = c.actualReturnDate ? new Date(c.actualReturnDate + 'T00:00:00Z') : today;
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDaysDiff = (dateStr: string) => {
    const today = new Date('2026-05-24T00:00:00Z');
    const target = new Date(dateStr + 'T00:00:00Z');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const availableTools = tools.filter(t => t.status === 'DISPONÍVEL');

  // Trigger Cautela submission
  const handleCreateCautela = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colaborador || !matricula || !obraDestino || selectedToolIds.length === 0) {
      alert('Por favor, preencha todos os campos do almoxarifado.');
      return;
    }

    // Find custom sequential ID for Cautela
    const numbers = cautelas.map(c => {
      const p = c.id.split('-');
      const num = parseInt(p[1], 10);
      return isNaN(num) ? 1000 : num;
    });
    const nextNum = Math.max(...numbers, 999) + 1;
    const generatedCautelaId = `CAU-${nextNum}`;

    const newCautelaItems = selectedToolIds.map(tid => {
      const masterTool = tools.find(t => t.id === tid)!;
      return {
        toolId: tid,
        name: masterTool.name,
        category: masterTool.category,
        conditionOut: 'EXCELENTE'
      };
    });

    const created: Cautela = {
      id: generatedCautelaId,
      dateOut: '2026-05-24',
      timeOut: '02:43',
      colaborador,
      matricula,
      obraDestino,
      status: 'ATIVA',
      expectedReturnDate,
      items: newCautelaItems
    };

    onCreateCautela(created);
    
    // reset draft fields
    setColaborador('');
    setMatricula('');
    setObraDestino('');
    setSelectedToolIds([]);
    setSelectedCautelaId(generatedCautelaId);
    setPanelMode('PREVIEW_CAUTELA');
  };

  // Toggle selected tool for checkout draft
  const toggleToolSelection = (id: string) => {
    setSelectedToolIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Handle devolution submission
  const submitDevolution = () => {
    if (!devolvingCautela || !devolvingToolId) return;

    onReturnCautela(
      devolvingCautela.id,
      devolvingToolId,
      conditionIn,
      isAvariado,
      isAvariado ? {
        type: avariaType,
        description: avariaDesc || `Avaria reportada no retorno para a ferramenta.`,
        cost: Number(avariaCost) || 150
      } : undefined
    );

    alert(`Retorno registrado com sucesso para a ferramenta no termo ${devolvingCautela.id}!`);
    setDevolvingCautela(null);
    setDevolvingToolId(null);
    setIsAvariado(false);
    setAvariaDesc('');
    setAvariaCost(150);
  };

  // Filtered list of cautelas
  const filteredCautelas = cautelas.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(term) ||
      c.colaborador.toLowerCase().includes(term) ||
      c.matricula.toLowerCase().includes(term) ||
      c.obraDestino.toLowerCase().includes(term) ||
      c.items.some(it => it.name.toLowerCase().includes(term))
    );
  });

  const selectedCautela = cautelas.find(c => c.id === selectedCautelaId);

  return (
    <div className="space-y-6">
      
      {/* Header with quick toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" /> Registro de Ativos em Campo (Saídas/Retiradas)
          </h2>
          <p className="text-xs text-slate-500">
            Regra do Almoxarifado: Controle rigoroso dos ativos que estão em posse das equipes em campo.
          </p>
        </div>

        <div className="flex gap-2">
          {panelMode !== 'LISTA' && (
            <button 
              onClick={() => setPanelMode('LISTA')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg transition"
            >
              Ver Ativos em Campo
            </button>
          )}

          {panelMode === 'LISTA' && userRole === 'ADMIN' && (
            <button 
              onClick={() => setPanelMode('NOVA_CAUTELA')}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Retirada (Saída)
            </button>
          )}
          
          {panelMode === 'LISTA' && userRole === 'VISU' && (
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg">
              🔒 Perfil de Leitura
            </span>
          )}
        </div>
      </div>

      {panelMode === 'LISTA' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Pesquisar por Cautela, Colaborador, Matrícula, Obra ou ferramenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-0 outline-none text-sm text-slate-800 focus:bg-white placeholder-slate-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Nº Termo</th>
                    <th className="p-4">Colaborador / Obra</th>
                    <th className="p-4">Retirada em</th>
                    <th className="p-4">Ativos Retirados</th>
                    <th className="p-4">Tempo em Campo</th>
                    <th className="p-4">Previsão e Alertas</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCautelas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Nenhum ativo associado em campo nesta busca.
                      </td>
                    </tr>
                  ) : (
                    filteredCautelas.map((c) => {
                      const daysCount = getDaysRetido(c);
                      const isOverdue = c.status === 'ATIVA' && getDaysDiff(c.expectedReturnDate) < 0;
                      
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition duration-150">
                          <td className="p-4 font-mono font-bold text-slate-900">
                            {c.id}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <div className="font-semibold text-slate-900">{c.colaborador}</div>
                            <div className="text-[10px] text-slate-400">Matrícula: {c.matricula}</div>
                            <div className="text-[10.5px] text-slate-550 font-sans leading-relaxed truncate max-w-xs">{c.obraDestino}</div>
                          </td>
                          <td className="p-4 text-slate-500 font-mono space-y-0.5">
                            <div>{c.dateOut}</div>
                            <div className="text-[10px] text-slate-400">{c.timeOut}</div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {c.items.map((it, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] text-slate-600 font-semibold">{it.toolId}</span>
                                  <span className="text-slate-700 text-[11px] font-medium truncate max-w-[200px]">{it.name}</span>
                                  {it.returnedDate ? (
                                    <span className="text-xs text-emerald-600 font-mono bg-emerald-50 px-1 rounded ml-1" title="Devolvido para o Almoxarifado">
                                      ✔ Devolvido
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-600 font-mono bg-amber-50 px-1 rounded ml-1" title="Ativo em campo com a equipe">
                                      • Em Campo
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-mono">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{daysCount} dias</span>
                              <span className="text-[10px] text-slate-400">
                                {c.status === 'ATIVA' ? 'corrido até hoje' : 'periodo fechado'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 space-y-1.5">
                            {c.status === 'ATIVA' ? (
                              isOverdue ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-200">
                                    <AlertCircle className="w-3 h-3" /> ULTRAPASSADO
                                  </span>
                                  <div className="text-[10px] text-rose-600 font-bold font-mono">
                                    Previsto: {c.expectedReturnDate}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-blue-200">
                                    <Clock className="w-3 h-3" /> EM DIA
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-semibold font-mono">
                                    Previsto: {c.expectedReturnDate}
                                  </div>
                                </div>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> CONCLUÍDO
                              </span>
                            )}

                            {c.status === 'ATIVA' && userRole === 'ADMIN' && (
                              <button
                                onClick={() => {
                                  setEditingCautelaId(c.id);
                                  setNewExpectedDate(c.expectedReturnDate);
                                }}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline transition select-none block cursor-pointer"
                              >
                                Alterar Prazo
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-right space-y-1">
                            <button 
                              onClick={() => {
                                setSelectedCautelaId(c.id);
                                setPanelMode('PREVIEW_CAUTELA');
                              }}
                              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-2 py-1 rounded transition flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" /> Ver Recibo
                            </button>

                            {c.status === 'ATIVA' && userRole === 'ADMIN' && (
                              <div className="flex flex-col gap-1 items-end mt-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Confirmar Devolução:</span>
                                {c.items.filter(it => !it.returnedDate).map((it, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setDevolvingCautela(c);
                                      setDevolvingToolId(it.toolId);
                                      const repCost = tools.find(tx => tx.id === it.toolId)?.replacementCost || 150;
                                      setAvariaCost(repCost);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-0.5 rounded transition block uppercase font-mono mt-0.5 cursor-pointer shadow-xs"
                                  >
                                    Retornar {it.toolId}
                                  </button>
                                ))}
                              </div>
                            )}

                            {c.status === 'ATIVA' && userRole === 'VISU' && (
                              <div className="text-[10px] text-slate-400 mt-2 text-right">
                                Devolução restrita ao Administrador
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Checkout draft creation flow */}
      {panelMode === 'NOVA_CAUTELA' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-md font-bold text-slate-950 border-b pb-2 mb-4">
            Emissão de Termo de Cautela — Ficha de Saída
          </h3>

          <form onSubmit={handleCreateCautela} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Colaborador Solicitante *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Nome completo do colaborador"
                    value={colaborador}
                    onChange={(e) => setColaborador(e.target.value)}
                    className="w-full bg-slate-50 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Matrícula do Solicitante *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: VRT-0812"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full bg-slate-50 p-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Prazo de Retorno Esperado *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    required
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full bg-slate-50 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase">Obra ou Setor de Destino *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Instalação Predial Shopping Center Rio, Subestação transformador"
                  value={obraDestino}
                  onChange={(e) => setObraDestino(e.target.value)}
                  className="w-full bg-slate-50 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Selection list of only DISPONIVEL tools */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase block">Selecionar Ferramentas para Cautela ({selectedToolIds.length} selecionadas)</label>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 text-[10px] font-mono text-slate-500 font-bold border-b select-none flex justify-between">
                  <span>MARQUE AS FERRAMENTAS PARA EMISSÃO</span>
                  <span>{availableTools.length} FERRAMENTAS EM ESTOQUE</span>
                </div>

                <div className="max-h-[250px] overflow-y-auto divide-y divide-slate-100 p-1">
                  {availableTools.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs text-medium">
                      Estoque indisponível ou todos os itens estão em campo. Realize uma devolução primeiro.
                    </div>
                  ) : (
                    availableTools.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => toggleToolSelection(t.id)}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 font-sans transition rounded-lg ${
                          selectedToolIds.includes(t.id) ? 'bg-blue-50 border border-blue-200 shadow-xs' : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={selectedToolIds.includes(t.id)}
                            readOnly
                            className="w-4 h-4 accent-blue-600 pointer-events-none"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              {t.name}
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 rounded">{t.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Endereço: {t.address} | Armazenamento: {t.storageInfo}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          t.criticidade === 'CRÍTICA' ? 'bg-rose-50 text-rose-700' : t.criticidade === 'ALTA' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {t.criticidade}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
              <button 
                type="button"
                onClick={() => setPanelMode('LISTA')}
                className="bg-slate-100 hover:bg-slate-250 text-slate-600 px-4 py-2.5 rounded-lg"
              >
                Voltar
              </button>
              <button 
                type="submit"
                disabled={selectedToolIds.length === 0}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Autorizar & Gerar Cautela Física
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Recibo de Cautela visual render EXACTLY representing ascii art */}
      {panelMode === 'PREVIEW_CAUTELA' && selectedCautela && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm uppercase font-mono text-slate-700">Recibo Assinado Digitamente — Cautela</h3>
            <button 
              onClick={() => {
                window.print();
              }}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 px-3 py-1.5 rounded flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Documento
            </button>
          </div>

          {/* ASCII styled Cautela block */}
          <div className="border border-slate-400 bg-slate-50 p-6 rounded-lg max-w-2xl mx-auto overflow-x-auto select-all">
            <pre className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre font-semibold">
{`╔══════════════════════════════════════════════════════════════╗
║      VIRTUM ENGENHARIA — TERMO DE CAUTELA DE FERRAMENTAS     ║
╠══════════════════════════════════════════════════════════════╣
║  Nº Cautela: ${selectedCautela.id.padEnd(10)} Data: ${selectedCautela.dateOut.replace(/-/g, '/')}  Hora: ${selectedCautela.timeOut}  ║
║  Colaborador: ${selectedCautela.colaborador.padEnd(21)} Matrícula: ${selectedCautela.matricula.padEnd(14)} ║
║  Obra/Destino: ${selectedCautela.obraDestino.padEnd(46)} ║
╠══════════════════════════════════════════════════════════════╣
║  ITEM  │ Nº PATRIMÔNIO │ DESCRIÇÃO          │ QTD │ CONDIÇÃO ║
║  ───── │ ───────────── │ ────────────────── │ ─── │ ──────── ║`}
{selectedCautela.items.map((it, idx) => {
  const itemNo = String(idx + 1).padEnd(4);
  const pat = it.toolId.padEnd(13);
  const name = it.name.substring(0, 18).padEnd(18);
  const cond = it.conditionOut.padEnd(8);
  return `║  ${itemNo}  │ ${pat} │ ${name} │  1  │ ${cond} ║`;
}).join('\n')}
{`╠══════════════════════════════════════════════════════════════╣
║  DECLARAÇÃO: Responsabilizo-me pela guarda, conservação e    ║
║  devolução em perfeito estado. Danos por mau uso ou extravio ║
║  serão apurados conforme política interna da empresa.        ║
╠══════════════════════════════════════════════════════════════╣
║  Assinatura colaborador: DISP-CONTR-DIGITAL Data: 2026/05/24 ║
║  Assinatura almoxarife:  csouza1102@gmail   Retorno: UNRESOL ║
╚══════════════════════════════════════════════════════════════╝`}
            </pre>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setPanelMode('LISTA')}
              className="bg-slate-900 text-white text-xs font-bold px-6 py-2 rounded-lg"
            >
              Retornar para Lista de Auditoria
            </button>
          </div>
        </div>
      )}

      {/* Devolution Wizard Side Modal */}
      {devolvingCautela && devolvingToolId && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400 flex items-center gap-1">
                <PenTool className="w-4 h-4 text-amber-500" /> [RETORNO DE ATIVO] Fiscalização 5S
              </h3>
              <button 
                onClick={() => {
                  setDevolvingCautela(null);
                  setDevolvingToolId(null);
                  setIsAvariado(false);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-700">
                <div><span className="font-bold">Termo:</span> {devolvingCautela.id}</div>
                <div><span className="font-bold">Ativo:</span> {devolvingToolId} — {tools.find(t => t.id === devolvingToolId)?.name}</div>
                <div><span className="font-bold">Colaborador:</span> {devolvingCautela.colaborador} (Matrícula: {devolvingCautela.matricula})</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block uppercase">Condição de Devolução</label>
                <select
                  value={conditionIn}
                  onChange={(e) => setConditionIn(e.target.value)}
                  className="w-full bg-slate-50 border p-2 text-xs rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="Conforme Saída (Excelente)">Excelente — perfeito funcionamento</option>
                  <option value="Firme desgaste natural (BOM)">Bom — com marcas leves de uso</option>
                  <option value="Apresenta Danos / Desgaste Crítico">Avaria / Falha Funcional na Entrega</option>
                  <option value="EXTRAVIADA / PERDIDA EM CAMPO">Extraviado/Não deparado pelo colaborador</option>
                </select>
              </div>

              {/* Toggle to trigger NC creation */}
              <div className="p-4 border border-rose-100 rounded-lg bg-rose-50/20 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-sans">
                  <input 
                    type="checkbox"
                    checked={isAvariado}
                    onChange={(e) => setIsAvariado(e.target.checked)}
                    className="w-4 h-4 accent-rose-600"
                  />
                  <span className="text-xs font-bold text-rose-900 uppercase">
                    Avariado ou Extraviado? (Abrir NC Automática)
                  </span>
                </label>

                {isAvariado && (
                  <div className="space-y-3 pt-2 border-t border-dashed border-rose-200">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">CLASSIFICAÇÃO NC</label>
                        <select
                          value={avariaType}
                          onChange={(e) => setAvariaType(e.target.value as any)}
                          className="w-full bg-white border p-1 rounded font-sans text-xs text-slate-700 focus:outline-none"
                        >
                          <option value="AVARIA LEVE">Avaria Leve (Reparo no local)</option>
                          <option value="AVARIA">Avaria Grave (Descarte / Lab)</option>
                          <option value="EXTRAVIO">Extravio (Item perdido)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">CUSTO APURAÇÃO (R$)</label>
                        <input 
                          type="number"
                          value={avariaCost}
                          onChange={(e) => setAvariaCost(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border p-1 rounded font-mono text-xs text-slate-800 focus:outline-none"
                          placeholder="Custo estimado"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">DESCRIÇÃO DOS FATOS</label>
                      <textarea
                        rows={2}
                        required
                        value={avariaDesc}
                        onChange={(e) => setAvariaDesc(e.target.value)}
                        placeholder="Ex: Cabo de força rompido, mandril quebrado por pancada..."
                        className="w-full bg-white border p-1 text-xs rounded text-slate-850 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => {
                    setDevolvingCautela(null);
                    setDevolvingToolId(null);
                    setIsAvariado(false);
                  }}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={submitDevolution}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  Confirmar Recebimento Físico
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Date updating expected return date dialog */}
      {editingCautelaId && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400">
                ✏ Alterar Previsão de Retorno
              </h3>
              <button 
                onClick={() => setEditingCautelaId(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs leading-normal text-slate-600">
                Ajuste a estimativa de devolução do ativo em uso. O novo prazo refletirá nos alertas do painel geral.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 block uppercase">Próxima Pretensão de Devolução</label>
                <input 
                  type="date"
                  value={newExpectedDate}
                  onChange={(e) => setNewExpectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => setEditingCautelaId(null)}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onUpdateExpectedReturnDate(editingCautelaId, newExpectedDate);
                    setEditingCautelaId(null);
                    alert(`✅ Prazo de devolução prorrogado! Próxima previsão: ${newExpectedDate}`);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 rounded-lg cursor-pointer transition shadow-xs"
                >
                  Salvar Nova Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
