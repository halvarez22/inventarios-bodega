import React, { useState, useMemo } from "react";
import { Transaction } from "../types";
import { 
  History, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sliders, 
  Calendar, 
  User, 
  MapPin, 
  FileText,
  Clock,
  Download,
  FileSpreadsheet,
  FileDown,
  PenTool
} from "lucide-react";
import { exportTransactionsToCSV } from "../utils/csvExport";
import { exportTransactionsToPDF } from "../utils/pdfExport";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClearHistory?: () => Promise<void>;
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedMonthKey, setSelectedMonthKey] = useState("");

  // Get all unique year-month bounds from transactions to compile list of available monthly reports
  const availableMonths = useMemo(() => {
    const list: { key: string; label: string; month: number; year: number }[] = [];
    const seen = new Set<string>();
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        const y = d.getFullYear();
        const key = `${y}-${m}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            key,
            label: `${monthNames[m]} ${y}`,
            month: m,
            year: y
          });
        }
      }
    });

    // Sort chronologically (descending)
    list.sort((a, b) => b.year - a.year || b.month - a.month);
    return list;
  }, [transactions]);

  // Filter historical movements in real time based on search string and type filtering
  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      // Type matching
      if (typeFilter && tx.type !== typeFilter) {
        return false;
      }

      // Keyword matching
      const keyword = search.toLowerCase();
      const matchSearch =
        tx.itemName.toLowerCase().includes(keyword) ||
        tx.responsible.toLowerCase().includes(keyword) ||
        (tx.destinationOrOrigin && tx.destinationOrOrigin.toLowerCase().includes(keyword)) ||
        (tx.notes && tx.notes.toLowerCase().includes(keyword));

      return matchSearch;
    });
  }, [transactions, search, typeFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kardex de Movimientos Histórico</h1>
          <p className="text-zinc-400 text-sm mt-1">Archivo de auditoría completo para entradas y salidas de stock.</p>
        </div>

        {/* Audit Export Tools Panel */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full xl:w-auto">
          {availableMonths.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-zinc-800 bg-[#161B22]/60 p-1.5 rounded-xl w-full xl:w-auto">
              <select
                value={selectedMonthKey || (availableMonths[0]?.key || "")}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-zinc-950 text-white text-xs font-semibold py-2 px-3 border border-zinc-800 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer min-w-[130px] font-sans"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const key = selectedMonthKey || (availableMonths[0]?.key || "");
                    const item = availableMonths.find(m => m.key === key);
                    if (item) {
                      exportTransactionsToPDF(transactions, item.month, item.year);
                    }
                  }}
                  className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2 px-3.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-md shadow-amber-500/10"
                  title="Genera reporte PDF formal con logotipo y firmas"
                >
                  <FileDown className="h-3.5 w-3.5 shrink-0" />
                  <span>Reporte PDF</span>
                </button>

                <button
                  onClick={() => {
                    const key = selectedMonthKey || (availableMonths[0]?.key || "");
                    const item = availableMonths.find(m => m.key === key);
                    if (item) {
                      exportTransactionsToCSV(transactions, item.month, item.year);
                    }
                  }}
                  className="flex-1 sm:flex-initial bg-zinc-950 hover:bg-[#1C2128] border border-zinc-800 text-zinc-300 hover:text-white py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  title="Exporta movimientos a CSV para Excel"
                >
                  <Download className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-xs italic px-3 py-2 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800 select-none">
              Sin historial registrado
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch w-full xl:w-auto">
            <button
              onClick={() => exportTransactionsToPDF(transactions)}
              className="border border-zinc-800 hover:border-zinc-700 text-amber-500 hover:text-amber-400 bg-zinc-950/40 hover:bg-[#161B22] py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-2 font-sans"
              title="Generar PDF completo para todo el registro histórico"
            >
              <FileDown className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Reporte Completo PDF</span>
            </button>

            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              className="border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-950/40 hover:bg-[#161B22] py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-2 font-sans"
              title="Saca un backup total de las transacciones consolidadas desde la puesta en marcha"
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-zinc-500" />
              <span>Exportar Todo CSV ({transactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Searching filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Search bar input */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por artículo, responsable, destino, notas de despacho..."
            className="w-full bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 outline-none text-sm font-sans transition-all"
          />
        </div>

        {/* Dynamic type filters */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <History className="h-4 w-4" />
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 cursor-pointer outline-none text-sm transition-all"
          >
            <option value="">-- Todos los Movimientos --</option>
            <option value="entrada">Entradas (Ingresos)</option>
            <option value="salida">Salidas (Despachos)</option>
            <option value="ajuste">Ajustes (Auditoría)</option>
          </select>
        </div>

      </div>

      {/* Movements timeline layout */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredTx.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider font-mono">
                  <th className="py-4 px-6">Fecha / Hora</th>
                  <th className="py-4 px-6">Dirección</th>
                  <th className="py-4 px-6">Material / Recurso de Bodega</th>
                  <th className="py-4 px-6 text-center">Variación</th>
                  <th className="py-4 px-6 text-center">Balance Stock</th>
                  <th className="py-4 px-6">Encargado / Procedencia</th>
                  <th className="py-4 px-6">Observaciones</th>
                  <th className="py-4 px-6">Conformidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300 text-xs sm:text-sm font-sans">
                {filteredTx.map((tx) => {
                  const dateObj = new Date(tx.date);
                  const formattedDate = dateObj.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-900/60 transition group selection:bg-amber-500 selection:text-zinc-950">
                      
                      {/* Timestamp */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-zinc-500 shrink-0" />
                          <div>
                            <span className="font-mono font-medium block text-white">{formattedDate}</span>
                            <span className="text-[10px] text-zinc-500 font-mono block">{formattedTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* Direction Icon Badge */}
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-md border flex items-center space-x-1 w-max ${
                          tx.type === "entrada" 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" 
                            : tx.type === "salida" 
                            ? "bg-red-950/20 text-red-400 border-red-900/40" 
                            : "bg-amber-950/20 text-amber-500 border-amber-900/40"
                        }`}>
                          {tx.type === "entrada" ? <ArrowDownLeft className="h-3 w-4 shrink-0" /> : tx.type === "salida" ? <ArrowUpRight className="h-3 w-4 shrink-0" /> : <Sliders className="h-3 w-4 shrink-0" />}
                          <span>{tx.type}</span>
                        </span>
                      </td>

                      {/* Material identification */}
                      <td className="py-4 px-6">
                        <h4 className="font-semibold text-zinc-100 group-hover:text-amber-500 transition max-w-xs truncate">{tx.itemName}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase">Cat: {tx.itemCategory}</span>
                      </td>

                      {/* Delta Variation */}
                      <td className="py-4 px-6 text-center">
                        <span className={`font-mono font-extrabold text-sm ${
                          tx.type === "entrada" ? "text-emerald-400" : tx.type === "salida" ? "text-red-400" : "text-amber-400"
                        }`}>
                          {tx.type === "entrada" ? "+" : tx.type === "salida" ? "-" : "±"} {tx.qty}
                        </span>
                      </td>

                      {/* Remaining balance track */}
                      <td className="py-2 px-6 text-center">
                        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded px-1.5 py-1 inline-block text-center font-mono text-xs">
                          <span className="text-zinc-500 text-[10px]">Prev: </span><span className="text-zinc-400">{tx.prevQty}</span>
                          <span className="text-zinc-500"> → </span>
                          <span className="text-white font-bold">{tx.newQty}</span>
                        </div>
                      </td>

                      {/* Destination reference & User */}
                      <td className="py-4 px-6 max-w-[170px] truncate">
                        <div className="flex items-center space-x-1.5 text-xs text-zinc-300">
                          <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate font-mono">{tx.responsible.split("@")[0]}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] text-zinc-500 mt-1">
                          <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                          <span className="truncate">{tx.destinationOrOrigin || "NOMINAL"}</span>
                        </div>
                      </td>

                      {/* Notes / Descriptions */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex items-start space-x-1.5 text-xs text-zinc-400">
                          <FileText className="h-3.5 w-3.5 text-zinc-600 shrink-0 mt-0.5" />
                          <p className="italic line-clamp-2">
                            {tx.notes ? `"${tx.notes}"` : "Sin observaciones ingresadas"}
                          </p>
                        </div>
                      </td>

                      {/* Signature Preview */}
                      <td className="py-4 px-6">
                        {tx.signature ? (
                          <div className="relative group/sig inline-block">
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 py-1 px-2.5 rounded-lg flex items-center space-x-1 w-max cursor-help shadow-sm">
                              <PenTool className="h-3 w-3 text-amber-500 animate-pulse" />
                              <span>Con Firma</span>
                            </span>
                            {/* Hover tooltip showing the actual Base64 signature image nicely! */}
                            <div className="absolute right-0 bottom-full mb-2 z-50 pointer-events-none opacity-0 group-hover/sig:opacity-100 transition-all duration-200 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-48">
                              <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider mb-1.5 border-b border-zinc-850 pb-1">
                                <PenTool className="h-3 w-3 text-amber-500" />
                                <span>Firma del Responsable</span>
                              </div>
                              <div className="bg-[#161B22] rounded-lg p-2.5 flex justify-center border border-zinc-800/80">
                                <img 
                                  src={tx.signature} 
                                  alt="Firma digital" 
                                  className="h-16 object-contain pointer-events-none select-none" 
                                  referrerPolicy="no-referrer" 
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-600 block pl-3">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center bg-zinc-900 select-none">
            <History className="h-12 w-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-white text-base font-bold">No se registraron movimientos</h3>
            <p className="text-zinc-400 text-xs mt-1">No hay registros históricos de movimientos o ningún ítem califica con los filtros de búsqueda.</p>
          </div>
        )}
      </div>

    </div>
  );
}
