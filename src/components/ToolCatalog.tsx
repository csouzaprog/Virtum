/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tool, ToolCategory, ToolCriticidade, ToolStatus } from '../types';
import { 
  Search, 
  Plus, 
  Tag, 
  MapPin, 
  Printer, 
  CheckCircle, 
  Wrench, 
  Clock, 
  Trash, 
  Layers, 
  ShieldAlert,
  SlidersHorizontal,
  FolderOpen,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react';

interface ToolCatalogProps {
  tools: Tool[];
  onAddTool: (tool: Tool) => void;
  onUpdateToolStatus: (id: string, status: ToolStatus) => void;
  userRole: 'ADMIN' | 'VISU';
}

export default function ToolCatalog({ tools, onAddTool, onUpdateToolStatus, userRole }: ToolCatalogProps) {
  const disponivelTools = tools.filter(t => t.status === 'DISPONÍVEL').length;

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedCriticidade, setSelectedCriticidade] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedFrequencia, setSelectedFrequencia] = useState<string>('TODAS');
  
  // Create / add tool modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    category: 'Ferramentas manuais' as ToolCategory,
    criticidade: 'NORMAL' as ToolCriticidade,
    addressColumn: 'C',
    addressShelve: '1',
    storageInfo: '',
    brand: '',
    serialNumber: '',
    acquisitionCost: 0,
    replacementCost: 0,
    frequenciaUso: 'MÉDIA' as 'BAIXA' | 'MÉDIA' | 'ALTA'
  });

  // Printing sticker simulation state
  const [printingToolId, setPrintingToolId] = useState<string | null>(null);

  // XLS Spreadsheet Exporter (with situation selection filters)
  const exportToExcel = (statusFilter: string) => {
    const exportTools = tools.filter(t => statusFilter === 'TODOS' || t.status === statusFilter);
    
    const headers = [
      'Código Patrimonial',
      'Nome do Ativo',
      'Categoria',
      'Criticidade',
      'Frequência de Uso',
      'Situação Atual',
      'Localização 5S',
      'Marca/Fabricante',
      'Nº Serial de Fábrica',
      'Custo Aquisição (R$)',
      'Custo Reposição (R$)',
      'Detalhes Compartimento'
    ];

    const rows = exportTools.map(t => [
      t.id,
      t.name,
      t.category,
      t.criticidade,
      t.frequenciaUso || 'MÉDIA',
      t.status === 'EM USO' ? 'EM CAMPO' : t.status,
      t.address,
      t.brand || '-',
      t.serialNumber || '-',
      t.acquisitionCost || 0,
      t.replacementCost || 0,
      t.storageInfo || ''
    ]);

    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob(["\ufeff" + content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ativos_virtum_situacao_${statusFilter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // XLS Spreadsheet Importer
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
          alert('Nenhum dado válido além do cabeçalho encontrado na planilha.');
          return;
        }

        let delimiter = '\t';
        if (lines[0].includes(';')) delimiter = ';';
        else if (lines[0].includes(',') && !lines[0].includes('\t')) delimiter = ',';

        let importedCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const col = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
          if (col.length < 2) continue;

          const colId = col[0] || '';
          const colName = col[1] || '';
          const colCategory = (col[2] || 'Ferramentas manuais') as ToolCategory;
          const colCriticidade = (col[3] || 'NORMAL') as ToolCriticidade;
          const colFrequencia = (col[4] || 'MÉDIA').toUpperCase() as 'BAIXA' | 'MÉDIA' | 'ALTA';
          const colStatus = (col[5] || 'DISPONÍVEL') as ToolStatus;
          const colAddress = col[6] || 'C-1';
          const colBrand = col[7] || '';
          const colSerial = col[8] || '';
          const colAcqu = parseFloat(col[9]) || 0;
          const colRep = parseFloat(col[10]) || colAcqu;
          const colStorage = col[11] || 'Importado via planilha';

          if (!colName) {
            errorCount++;
            continue;
          }

          const validCategories: ToolCategory[] = [
            'Medição/Precisão', 'Ferramentas elétricas', 'Ferramentas manuais',
            'EPIs elétricos', 'Escadas/Andaimes', 'Consumíveis'
          ];
          const categoryName = validCategories.find(c => c.toLowerCase() === colCategory.toLowerCase()) || 'Ferramentas manuais';

          const validCrit: ToolCriticidade[] = ['NORMAL', 'ALTA', 'CRÍTICA'];
          const critName = validCrit.find(c => c.toUpperCase() === colCriticidade.toUpperCase()) || 'NORMAL';

          const validFreq = ['BAIXA', 'MÉDIA', 'ALTA'];
          const freqName = (validFreq.find(f => f === colFrequencia) || 'MÉDIA') as 'BAIXA' | 'MÉDIA' | 'ALTA';

          const validStatus: ToolStatus[] = ['DISPONÍVEL', 'EM USO', 'EM MANUTENÇÃO', 'AVARIADA/BAIXADA'];
          let statusName = validStatus.find(s => s.toUpperCase() === colStatus.toUpperCase() || (colStatus.toUpperCase() === 'EM CAMPO' && s === 'EM USO')) || 'DISPONÍVEL';

          // Generate sequential automated ID based on categories checklist if empty
          let finalId = colId;
          if (!finalId || finalId === '-') {
            let prefix = 'FER';
            if (categoryName === 'Medição/Precisão') prefix = 'MED';
            else if (categoryName === 'EPIs elétricos') prefix = 'EPI';
            else if (categoryName === 'Escadas/Andaimes') prefix = 'ESC';
            else if (categoryName === 'Consumíveis') prefix = 'CON';

            const categoryTools = tools.filter(t => t.id.startsWith(prefix));
            let nextNum = 1;
            if (categoryTools.length > 0) {
              const numbers = categoryTools.map(t => {
                const parts = t.id.split('-');
                const num = parseInt(parts[1], 10);
                return isNaN(num) ? 0 : num;
              });
              nextNum = Math.max(...numbers) + i;
            }
            finalId = `${prefix}-${String(nextNum).padStart(4, '0')}`;
          }

          const importedTool: Tool = {
            id: finalId,
            name: colName,
            category: categoryName,
            criticidade: critName,
            address: colAddress,
            storageInfo: colStorage,
            status: statusName,
            acquisitionCost: colAcqu,
            replacementCost: colRep,
            brand: colBrand || undefined,
            serialNumber: colSerial || undefined,
            frequenciaUso: freqName,
            lastMaintenanceDate: '2026-05-24'
          };

          onAddTool(importedTool);
          importedCount++;
        }

        alert(`✅ Sucesso! Importação de dados finalizada.\n- ${importedCount} novos ativos importados com endereços 5S vinculados.\n- ${errorCount} linhas ignoradas por estarem vazias.`);
      } catch (err) {
        console.error(err);
        alert('Falha crítica ao ler a planilha. Verifique a ordem das colunas e tente novamente.');
      }
    };
    reader.readAsText(file);
    // Clear the input value so the same file can be re-imported
    e.target.value = '';
  };

  // Address lookup helper depending on category
  const getSuggestedAddress = (category: ToolCategory) => {
    switch (category) {
      case 'Medição/Precisão': return { col: 'A', info: 'Armário trancado com divisor de espuma' };
      case 'EPIs elétricos': return { col: 'D', info: 'Armário trancado exclusivo EPIs Elétricos' };
      case 'Ferramentas elétricas': return { col: 'B', info: 'Prateleira A — Setor Equipes' };
      case 'Escadas/Andaimes': return { col: 'S', info: 'Suporte de parede lateral esquerda' };
      case 'Consumíveis': return { col: 'E', info: 'Prateleira C Aberta' };
      default: return { col: 'C', info: 'Painel perfurado de silhuetas' };
    }
  };

  // Handler for category change in Add modal to guide the 5S location
  const handleCategoryChangeInAdd = (cat: ToolCategory) => {
    const sug = getSuggestedAddress(cat);
    setNewTool(prev => ({
      ...prev,
      category: cat,
      addressColumn: sug.col,
      storageInfo: sug.info
    }));
  };

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTool.name) return;

    // Generate unique ID based on Category standard in POP
    // "Todo item recebe um código único no formato: FER-[CATEGORIA]-[NÚMERO SEQUENCIAL]"
    // e.g. MED-0003, EPI-0012, FER-0004
    let prefix = 'FER';
    if (newTool.category === 'Medição/Precisão') prefix = 'MED';
    else if (newTool.category === 'EPIs elétricos') prefix = 'EPI';
    else if (newTool.category === 'Escadas/Andaimes') prefix = 'ESC';
    else if (newTool.category === 'Consumíveis') prefix = 'CON';

    const categoryTools = tools.filter(t => t.id.startsWith(prefix));
    
    // Extract sequential ID and find max
    let nextNum = 1;
    if (categoryTools.length > 0) {
      const numbers = categoryTools.map(t => {
        const parts = t.id.split('-');
        const num = parseInt(parts[1], 10);
        return isNaN(num) ? 0 : num;
      });
      nextNum = Math.max(...numbers) + 1;
    }

    const paddedNum = String(nextNum).padStart(4, '0');
    const generatedId = `${prefix}-${paddedNum}`;

    const toolToSave: Tool = {
      id: generatedId,
      name: newTool.name,
      category: newTool.category,
      criticidade: newTool.criticidade,
      address: `${newTool.addressColumn}-${newTool.addressShelve}`,
      storageInfo: newTool.storageInfo || 'Almoxarifado central',
      status: 'DISPONÍVEL',
      acquisitionCost: Number(newTool.acquisitionCost) || 0,
      replacementCost: Number(newTool.replacementCost) || Number(newTool.acquisitionCost) || 0,
      brand: newTool.brand || undefined,
      serialNumber: newTool.serialNumber || undefined,
      frequenciaUso: newTool.frequenciaUso,
      lastMaintenanceDate: new Date('2026-05-24').toISOString().split('T')[0]
    };

    onAddTool(toolToSave);
    setIsAddOpen(false);
    
    // reset form
    setNewTool({
      name: '',
      category: 'Ferramentas manuais' as ToolCategory,
      criticidade: 'NORMAL' as ToolCriticidade,
      addressColumn: 'C',
      addressShelve: '1',
      storageInfo: 'Painel perfurado de silhuetas',
      brand: '',
      serialNumber: '',
      acquisitionCost: 0,
      replacementCost: 0,
      frequenciaUso: 'MÉDIA' as 'BAIXA' | 'MÉDIA' | 'ALTA'
    });
  };

  // Filter tools
  const filteredTools = tools.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.brand && t.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.serialNumber && t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'TODAS' || t.category === selectedCategory;
    const matchesCriticidade = selectedCriticidade === 'TODAS' || t.criticidade === selectedCriticidade;
    const matchesStatus = selectedStatus === 'TODOS' || t.status === selectedStatus;
    const matchesFrequencia = selectedFrequencia === 'TODAS' || (t.frequenciaUso || 'MÉDIA') === selectedFrequencia;

    return matchesSearch && matchesCategory && matchesCriticidade && matchesStatus && matchesFrequencia;
  });

  // Criticidade badge style helper
  const getCriticidadeStyle = (crit: ToolCriticidade) => {
    switch (crit) {
      case 'CRÍTICA':
        return { 
          badge: 'bg-rose-50 text-rose-700 border-rose-200', 
          border: 'border-l-4 border-l-rose-500', 
          stickerBorder: 'border-rose-600',
          stickerHeader: 'bg-rose-600 text-white',
          text: 'text-rose-600'
        };
      case 'ALTA':
        return { 
          badge: 'bg-amber-50 text-amber-700 border-amber-200', 
          border: 'border-l-4 border-l-amber-500', 
          stickerBorder: 'border-amber-500',
          stickerHeader: 'bg-amber-500 text-slate-900 font-bold',
          text: 'text-amber-600'
        };
      default:
        return { 
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
          border: 'border-l-4 border-l-emerald-500', 
          stickerBorder: 'border-emerald-500',
          stickerHeader: 'bg-emerald-500 text-white',
          text: 'text-emerald-600'
        };
    }
  };

  // Tool status badge helper
  const getStatusBadge = (status: ToolStatus) => {
    switch (status) {
      case 'DISPONÍVEL':
        return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-sans border border-emerald-100"><CheckCircle className="w-3 h-3" /> DISPONÍVEL</span>;
      case 'EM USO':
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-sans border border-amber-100"><Clock className="w-3 h-3" /> EM USO</span>;
      case 'EM MANUTENÇÃO':
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-sans border border-blue-100"><Wrench className="w-3 h-3" /> MANUTENÇÃO</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-sans border border-slate-200"><ShieldAlert className="w-3 h-3" /> AVARIADO</span>;
    }
  };

  // Simulate label printing trigger
  const triggerPrintSimulation = (toolId: string) => {
    setPrintingToolId(toolId);
    setTimeout(() => {
      setPrintingToolId(null);
      alert(`[Etiqueta Física POP-ALM-001] Impressão concluída com sucesso para o código patrimonial ${toolId}!`);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Actions & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans">
              Base Mestra - Cadastro Patrimonial de Ferramentas
            </h2>
            <p className="text-xs text-slate-500">
              Totalizando {tools.length} itens no almoxarifado elétrico ({disponivelTools} disponíveis para retirada)
            </p>
          </div>
          {userRole === 'ADMIN' && (
            <button 
              onClick={() => setIsAddOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Cadastrar Novo Ativo
            </button>
          )}
        </div>

        {/* Console de Importacao e Exportacao Excel .XLS */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportação de Dados (.XLS)
            </div>
            <p className="text-[11px] text-slate-500">
              Exporte para o Excel. Filtre por situação para extrair lotes organizados:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['TODOS', 'DISPONÍVEL', 'EM USO', 'EM MANUTENÇÃO', 'AVARIADA/BAIXADA'].map((st) => (
                <button
                  key={st}
                  onClick={() => exportToExcel(st)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-[9.5px] font-bold px-2 py-1 rounded-md flex items-center gap-1 text-slate-700 select-none shadow-xs transition cursor-pointer"
                  title={`Exportar apenas ativos na situação: ${st}`}
                >
                  <Download className="w-2.5 h-2.5 text-slate-500" /> {st === 'TODOS' ? 'Todos' : st === 'EM USO' ? 'Em Campo' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase font-mono">
              <Upload className="w-4 h-4 text-blue-600" /> Importação de Cadastro (.XLS / CSV)
            </div>
            <p className="text-[11px] text-slate-500">
              Insira arquivos em delimitador Tabulação (.xls, .xlsx salvos como texto tabulado) ou ponto e vírgula (.csv).
            </p>
            
            {userRole === 'VISU' ? (
              <div className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1.5 rounded border border-slate-200 mt-1">
                🔒 Perfil Leitura: Altere o nível de acesso para "Administrador" para realizar importações.
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                <label className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition select-none shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Selecionar Planilha
                  <input
                    type="file"
                    accept=".xls,.xlsx,.csv,.txt"
                    onChange={handleImportExcel}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Tabulação ou CSV (;)</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          
          <div className="relative sm:col-span-2 lg:col-span-2">
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-1">PESQUISA DIRETA</div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Nome, ID, fabricante, serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs text-slate-800 pl-8 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-1">CATEGORIA</div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-xs text-slate-700 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="TODAS">Ver Todas</option>
              <option value="Medição/Precisão">Medição/Precisão</option>
              <option value="Ferramentas elétricas">Ferramentas elétricas</option>
              <option value="Ferramentas manuais">Ferramentas manuais</option>
              <option value="EPIs elétricos">EPIs elétricos</option>
              <option value="Escadas/Andaimes">Escadas/Andaimes</option>
              <option value="Consumíveis">Consumíveis</option>
            </select>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-1">CRITICIDADE</div>
            <select
              value={selectedCriticidade}
              onChange={(e) => setSelectedCriticidade(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-xs text-slate-700 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="TODAS">Todas</option>
              <option value="CRÍTICA">Crítica (Vermelho)</option>
              <option value="ALTA">Alta (Amarelo)</option>
              <option value="NORMAL">Normal (Verde)</option>
            </select>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-1">SITUAÇÃO ATUAL</div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-xs text-slate-700 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="TODOS">Todos</option>
              <option value="DISPONÍVEL">Disponível</option>
              <option value="EM USO">Em Campo</option>
              <option value="EM MANUTENÇÃO">Manutenção</option>
              <option value="AVARIADA/BAIXADA">Baixada/Avariada</option>
            </select>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mb-1">FREQUÊNCIA</div>
            <select
              value={selectedFrequencia}
              onChange={(e) => setSelectedFrequencia(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 text-xs text-slate-700 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="TODAS">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MÉDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid of Tools including Asset Stickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12 text-center col-span-full">
            <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Nenhum ativo encontrado</h3>
            <p className="text-slate-500 text-xs mt-0.5">Tente ajustar seus termos de busca ou filtros aplicados.</p>
          </div>
        ) : (
          filteredTools.map((t) => {
            const styles = getCriticidadeStyle(t.criticidade);
            return (
              <div 
                key={t.id} 
                className={`bg-white rounded-xl border border-slate-200 ${styles.border} shadow-sm hover:shadow-md transition flex flex-col justify-between`}
              >
                {/* Upper Body: Information */}
                <div className="p-4.5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{t.category}</span>
                      <h3 className="font-bold text-slate-900 text-sm font-sans mt-0.5 tracking-tight line-clamp-2">
                        {t.name}
                      </h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono leading-relaxed font-bold border ${styles.badge}`}>
                      {t.criticidade}
                    </span>
                  </div>

                  {/* Operational specifications */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patrimônio:</span>
                      <span className="font-mono font-bold text-slate-800">{t.id}</span>
                    </div>
                    {t.brand && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Marca:</span>
                        <span className="font-medium text-slate-700">{t.brand}</span>
                      </div>
                    )}
                    {t.serialNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Serial Nº:</span>
                        <span className="font-mono text-slate-700 text-[10px]">{t.serialNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 mt-1">
                      <span className="text-slate-400 flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Endereço 5S:</span>
                      <span className="font-mono text-amber-600 font-bold bg-amber-500/10 px-1.5 rounded text-[11px] border border-amber-500/20">
                        {t.address}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Freq. de Uso:</span>
                      <span className={`font-bold font-sans text-[10px] px-1.5 rounded uppercase ${
                        t.frequenciaUso === 'ALTA' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : t.frequenciaUso === 'BAIXA'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                      } border`}>
                        {t.frequenciaUso || 'MÉDIA'}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 leading-normal text-right pt-0.5">
                      {t.storageInfo}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-slate-400">Custo Reposição:</span>
                    <span className="font-mono text-slate-700 font-medium">R$ {t.replacementCost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Simulated Physical Etiqueta POP-ALM-001 Block */}
                <div className="px-4.5 pb-4 border-t border-slate-100 pt-3.5 bg-slate-50/40 space-y-3.5">
                  
                  {/* Etiqueta Visual Factory Box */}
                  <div className={`bg-white border-2 rounded-lg p-2.5 shadow-inner select-none ${styles.stickerBorder} relative overflow-hidden`}>
                    
                    {/* Header bar mirroring POP colors */}
                    <div className={`-mx-2.5 -mt-2.5 px-2.5 py-1 text-[10px] font-mono font-bold text-center border-b ${styles.stickerHeader}`}>
                      VIRTUM ENGENHARIA — POP-ALM-001
                    </div>

                    <div className="flex justify-between items-center gap-2 mt-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-[8px] text-slate-400 leading-none">CÓDIGO PATRIMONIAL</div>
                        <div className="text-sm font-black text-slate-900 font-mono tracking-tight">{t.id}</div>
                        
                        <div className="text-[8px] text-slate-400 leading-none mt-1">DESCRIÇÃO ATIVO</div>
                        <div className="text-[10px] font-bold text-slate-700 truncate">{t.name}</div>
                        
                        <div className="text-[8px] text-slate-400 leading-none mt-1">ENDEREÇAMENTO 5S / CRITICIDADE</div>
                        <div className="text-[9px] font-mono font-semibold text-slate-900">
                          COORDS: {t.address} | CLASSE: {t.criticidade}
                        </div>
                      </div>

                      {/* Dynamic Visual QR Code Simulator */}
                      <div className="w-14 h-14 bg-slate-900 shrink-0 rounded p-1 flex flex-col gap-0.5 justify-between items-center relative overflow-hidden">
                        {/* 4 Corners dots of QR code */}
                        <div className="flex w-full justify-between">
                          <span className="w-2.5 h-2.5 bg-white border border-slate-900"></span>
                          <span className="w-2.5 h-2.5 bg-white border border-slate-900"></span>
                        </div>
                        
                        {/* Fake grid of QR block */}
                        <div className="text-[5px] text-white opacity-95 tracking-[0.5px] scale-90 leading-none select-none select-all-none">
                          101100<br/>010111<br/>110010<br/>001101
                        </div>

                        <div className="flex w-full justify-between mt-auto">
                          <span className="w-2.5 h-2.5 bg-white border border-slate-900"></span>
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                        </div>
                      </div>
                    </div>
                    {/* Material background label badge watermark */}
                    <div className="absolute right-1 top-6 rotate-12 opacity-[0.06] pointer-events-none text-[32px] font-black font-mono">
                      VIRTUM
                    </div>
                  </div>

                  {/* Actions for this tool */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-[11px]">
                      {getStatusBadge(t.status)}
                    </div>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => triggerPrintSimulation(t.id)}
                        disabled={printingToolId === t.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 disabled:opacity-40 p-2 rounded-lg transition"
                        title="Imprimir Etiqueta Física"
                      >
                        <Printer className={`w-3.5 h-3.5 ${printingToolId === t.id ? 'animate-bounce text-amber-500' : ''}`} />
                      </button>
                      
                      {t.status === 'DISPONÍVEL' && (
                        <button 
                          onClick={() => onUpdateToolStatus(t.id, 'EM MANUTENÇÃO')}
                          className="bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 p-2 rounded-lg text-xs font-semibold transition flex items-center gap-0.5"
                          title="Enviar para Manutenção"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {t.status === 'EM MANUTENÇÃO' && (
                        <button 
                          onClick={() => onUpdateToolStatus(t.id, 'DISPONÍVEL')}
                          className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 p-2 rounded-lg text-xs font-bold transition flex items-center gap-0.5"
                          title="Retornar para o Almoxarifado"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Liberar
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cadastro Modal Drawer */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-blue-400">
                [VIRTUM REGISTRAR] Novo Patrimônio de Ativo
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTool} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Nome do Ativo *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Furadeira de Impacto Bosch GSB 20-2"
                  value={newTool.name}
                  onChange={(e) => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Categoria</label>
                  <select 
                    value={newTool.category}
                    onChange={(e) => handleCategoryChangeInAdd(e.target.value as ToolCategory)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg text-slate-700"
                  >
                    <option value="Medição/Precisão">Medição/Precisão</option>
                    <option value="Ferramentas elétricas">Ferramentas elétricas</option>
                    <option value="Ferramentas manuais">Ferramentas manuais</option>
                    <option value="EPIs elétricos">EPIs elétricos</option>
                    <option value="Escadas/Andaimes">Escadas/Andaimes</option>
                    <option value="Consumíveis">Consumíveis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Criticidade</label>
                  <select 
                    value={newTool.criticidade}
                    onChange={(e) => setNewTool(prev => ({ ...prev, criticidade: e.target.value as ToolCriticidade }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg text-slate-700"
                  >
                    <option value="NORMAL">NORMAL (Borda Verde)</option>
                    <option value="ALTA">ALTA (Borda Amarela)</option>
                    <option value="CRÍTICA">CRÍTICA (Borda Vermelha)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Marca / Fabricante</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Bosch, Fluke, Makita"
                    value={newTool.brand}
                    onChange={(e) => setNewTool(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Nº Serial de Fábrica</label>
                  <input 
                    type="text" 
                    placeholder="Opcional"
                    value={newTool.serialNumber}
                    onChange={(e) => setNewTool(prev => ({ ...prev, serialNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Frequência de Uso</label>
                  <select 
                    value={newTool.frequenciaUso}
                    onChange={(e) => setNewTool(prev => ({ ...prev, frequenciaUso: e.target.value as 'BAIXA' | 'MÉDIA' | 'ALTA' }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg text-slate-700 focus:outline-none"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MÉDIA">Média</option>
                    <option value="ALTA">Alta</option>
                  </select>
                </div>
              </div>

              {/* Endereço 5S layout selector */}
              <div className="border border-amber-100 bg-amber-500/5 p-3 rounded-lg space-y-2.5">
                <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Endereçamento de Coordenadas 5S do Almoxarifado
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Módulo/Coluna (Letra)</label>
                    <select
                      value={newTool.addressColumn}
                      onChange={(e) => setNewTool(prev => ({ ...prev, addressColumn: e.target.value }))}
                      className="w-full bg-white border border-slate-200 p-1.5 text-xs rounded"
                    >
                      {['A', 'B', 'C', 'D', 'E', 'S', 'P', 'X'].map(l => (
                        <option key={l} value={l}>{l} (Ex: {l === 'A' ? 'A - Medidores' : l === 'B' ? 'B - Elétricas' : l === 'C' ? 'C - Manuais' : l === 'D' ? 'D - EPIs' : l})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Prateleira/Nível (Gabarito)</label>
                    <select
                      value={newTool.addressShelve}
                      onChange={(e) => setNewTool(prev => ({ ...prev, addressShelve: e.target.value }))}
                      className="w-full bg-white border border-slate-200 p-1.5 text-xs rounded"
                    >
                      {['1', '2', '3', '4', '5'].map(n => (
                        <option key={n} value={n}>Nivel {n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Informação Física do Compartimento</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Prateleira A — Setor Equipe Azul"
                    value={newTool.storageInfo}
                    onChange={(e) => setNewTool(prev => ({ ...prev, storageInfo: e.target.value }))}
                    className="w-full bg-white border border-slate-200 p-1.5 text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Custo de Aquisição (R$)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newTool.acquisitionCost || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, acquisitionCost: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Custo de Reposição (R$)</label>
                  <input 
                    type="number" 
                    placeholder="Sugerido mesmo valor"
                    value={newTool.replacementCost || ''}
                    onChange={(e) => setNewTool(prev => ({ ...prev, replacementCost: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-lg select-none"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg select-none cursor-pointer"
                >
                  Salvar Registro Ativo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
