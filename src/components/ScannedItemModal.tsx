import React from "react";
import { 
  X, 
  Search, 
  MapPin, 
  Sun, 
  Wrench, 
  Truck, 
  Calendar, 
  ArrowLeftRight, 
  Edit2, 
  AlertTriangle 
} from "lucide-react";
import { InventoryItem } from "../types";
import { formatLocalDate } from "../utils/csvExport";

interface ScannedItemModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordTx: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onViewTimeline: (item: InventoryItem) => void;
}

export default function ScannedItemModal({ 
  item, 
  isOpen, 
  onClose, 
  onRecordTx, 
  onEditItem,
  onViewTimeline
}: ScannedItemModalProps) {
  if (!isOpen || !item) return null;

  const isLow = item.qty <= item.minQty;

  const statusColors = () => {
    const s = item.status?.toLowerCase() || "";
    if (s === "disponible" || s === "buen estado") {
      return "bg-emerald-950/30 text-emerald-400 border-emerald-900/60";
    } else if (s === "en ruta" || s === "retenido") {
      return "bg-cyan-950/30 text-cyan-400 border-cyan-800/50";
    } else if (s === "mantenimiento" || s === "en reparación") {
      return "bg-amber-950/30 text-amber-500 border-amber-900/60";
    } else {
      return "bg-red-950/30 text-red-500 border-red-900/60";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden animate-scale-up select-none">
        
        {/* Glow Header Accent */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 w-full" />

        {/* Modal body */}
        <div className="p-6 space-y-6">
          
          {/* Header titles */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center h-10 w-10 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">
                  Enlace QR de Bodega Activo
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">Recurso Escaneado</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scanned Card Body Details */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-zinc-900">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">
                  Identificador / SKU
                </span>
                <span className="text-sm font-mono font-extrabold text-amber-500 tracking-wider">
                  {item.sku}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase block">
                  Categoría
                </span>
                <span className="text-xs text-zinc-300 font-semibold uppercase bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                  {item.category === "materiales" ? "Panel / Fotovoltaico" : item.category === "herramientas" ? "Herramienta" : "Unidad Móvil"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white leading-snug">
                {item.name}
              </h2>
              {item.description && (
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  "{item.description}"
                </p>
              )}
            </div>

            {/* Metrics stats details */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850/60">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono font-semibold">Stock / Inventario</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className={`text-xl font-mono font-extrabold ${isLow ? "text-red-400" : "text-white"}`}>
                    {item.qty}
                  </span>
                  <span className="text-xs text-zinc-400 italic">
                    {item.unit || "unidades"}
                  </span>
                </div>
                {isLow && (
                  <span className="text-[9px] bg-red-950/40 text-red-400 font-bold uppercase py-0.5 px-1.5 rounded mt-1.5 inline-flex items-center space-x-0.5 border border-red-900/50">
                    <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                    <span>Crítico</span>
                  </span>
                )}
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono font-semibold">Ubicación Física</span>
                  <div className="flex items-center space-x-1 mt-1 text-xs text-zinc-300">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                    <span className="font-mono font-medium truncate">{item.location || "No asignado"}</span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className={`text-[9px] font-mono font-bold uppercase py-0.5 px-2 rounded-md border ${statusColors()}`}>
                    {item.status || "Disponible"}
                  </span>
                </div>
              </div>

            </div>

            {/* Footnote user & timestamp audits */}
            <div className="flex justify-between text-[9px] text-zinc-500 font-mono bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 shrink-0 text-zinc-600" />
                <span>Modificado: {formatLocalDate(item.updatedAt)}</span>
              </div>
              <span className="truncate max-w-[150px]">Por: {item.lastUpdatedBy || "operador"}</span>
            </div>

          </div>

          {/* Action trigger operations cards */}
          <div className="space-y-3">
            
            <button
              onClick={() => onRecordTx(item)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold p-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 cursor-pointer"
            >
              <ArrowLeftRight className="h-4.5 w-4.5 stroke-[2.5]" />
              <span className="text-sm">Registrar Entrada / Salida (Transacción)</span>
            </button>

            <button
              onClick={() => onViewTimeline(item)}
              className="w-full bg-[#1C2128] hover:bg-[#22272e] text-amber-400 font-extrabold p-3 rounded-xl border border-zinc-800 transition flex items-center justify-center space-x-2 cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-sm text-amber-500">timeline</span>
              <span>Línea de Tiempo de Traslados Físicos</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onEditItem(item)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/50 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Editar Detalle</span>
              </button>

              <button
                onClick={onClose}
                className="bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 border border-zinc-800 font-bold py-3 px-4 rounded-xl transition cursor-pointer text-xs"
              >
                <span>Descartar Enlace QR</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
