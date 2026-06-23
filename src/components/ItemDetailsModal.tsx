import React from "react";
import { motion } from "motion/react";
import { 
  X, 
  MapPin, 
  Calendar, 
  User, 
  ArrowDownRight, 
  ArrowUpRight, 
  Sliders, 
  Info,
  Layers,
  TrendingUp,
  Clock,
  PenTool,
  Package,
  Trash2
} from "lucide-react";
import { InventoryItem, Transaction } from "../types";
import { formatLocalDate } from "../utils/csvExport";

interface ItemDetailsModalProps {
  item: InventoryItem | null;
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onRecordTx?: (item: InventoryItem) => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (id: string, name: string) => void;
}

export default function ItemDetailsModal({
  item,
  transactions,
  isOpen,
  onClose,
  onRecordTx,
  onEditItem,
  onDeleteItem
}: ItemDetailsModalProps) {
  if (!isOpen || !item) return null;

  // Filter transactions belonging to this item
  const itemTx = transactions
    .filter((tx) => tx.itemId === item.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest first

  const isLow = item.qty <= item.minQty;

  const getStatusColor = () => {
    const s = item.status?.toLowerCase() || "";
    if (s === "disponible" || s === "buen estado") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    } else if (s === "en ruta" || s === "retenido") {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    } else if (s === "mantenimiento" || s === "en reparación") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    } else {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest block">
                Ficha de Control Físico
              </span>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>Rastreo del Recurso: {item.sku}</span>
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Card Overview section */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-550 block uppercase tracking-wider">
                  Especificación de Producto / Material
                </span>
                <h3 className="text-xl font-extrabold text-white leading-tight select-all">
                  {item.name}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-zinc-300 font-semibold uppercase bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                    {item.category === "materiales" ? "Material / Stock" : item.category === "herramientas" ? "Herramienta" : "Unidad Móvil"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono italic">
                    {item.subcategory}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-start bg-zinc-900/60 py-3 px-4 rounded-xl border border-zinc-850">
                <div className="text-center sm:text-right">
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono font-black">Stock Actual</span>
                  <div className="flex items-baseline space-x-1 mt-0.5 justify-center sm:justify-end">
                    <span className={`text-2xl font-mono font-black ${isLow ? "text-red-400" : "text-emerald-400"}`}>
                      {item.qty}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">{item.unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {item.description && (
              <div className="border-t border-zinc-900 pt-3.5">
                <p className="text-xs text-zinc-400 leading-relaxed font-sans pr-4 py-2 bg-zinc-900/10 rounded-lg px-3">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block font-bold mb-1">Observaciones de Referencia</span>
                  "{item.description}"
                </p>
              </div>
            )}

            {/* Sub-status grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-zinc-900/35 border border-zinc-850/50 p-3 rounded-xl flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono font-bold leading-none">Ubicación Actual Bodega</span>
                  <span className="text-xs font-mono font-black text-zinc-200 block mt-1 uppercase">{item.location || "Coordenada general"}</span>
                </div>
              </div>

              <div className="bg-zinc-900/35 border border-zinc-850/50 p-3 rounded-xl flex items-center space-x-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 border ${getStatusColor()} ${item.status === 'en ruta' ? 'animate-pulse' : ''}`} />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-mono font-bold leading-none">Condición Operativa</span>
                  <span className="text-xs font-mono font-black text-zinc-200 block mt-1 uppercase">{item.status || "Disponible"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual History Location & Movements Timeline Title */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono">
                  Historial de Ubicaciones Físicas y Traslados
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-zinc-850 py-1 px-2.5 border border-zinc-800 text-zinc-400 rounded-lg">
                {itemTx.length} {itemTx.length === 1 ? "registro" : "registros"}
              </span>
            </div>

            {/* TimeLine Render */}
            {itemTx.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2.5 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-amber-500/80 before:via-zinc-800 before:to-zinc-850">
                
                {itemTx.map((tx, idx) => {
                  const isEntrada = tx.type === "entrada";
                  const isSalida = tx.type === "salida";
                  const isAjuste = tx.type === "ajuste";

                  // Define arrow directional flow text
                  let routeFlowText = "";
                  if (isEntrada) {
                    routeFlowText = `Traslado desde [${tx.destinationOrOrigin || "Proveedor General"}] ➜ Almacén general [${item.location}]`;
                  } else if (isSalida) {
                    routeFlowText = `Despacho desde Bodega [${item.location}] ➜ [${tx.destinationOrOrigin || "Suministro Obras"}]`;
                  } else {
                    routeFlowText = `Ajuste / Rotación de inventario en almacén [${item.location}]`;
                  }

                  return (
                    <div key={tx.id} className="relative group/tl-node transition-all duration-150 rounded-xl hover:bg-zinc-800/10.">
                      {/* Timeline Node Bullet */}
                      <span className={`absolute -left-[27px] top-1.5 h-6.5 w-6.5 rounded-full flex items-center justify-center border transition-all shadow-md group-hover/tl-node:scale-110 ${
                        isEntrada 
                          ? "bg-emerald-950/90 border-emerald-500/80 text-emerald-400" 
                          : isSalida 
                            ? "bg-cyan-950/90 border-cyan-500/80 text-cyan-400" 
                            : "bg-amber-950/90 border-amber-500/80 text-amber-500"
                      }`}>
                        {isEntrada && <ArrowDownRight className="h-3.5 w-3.5 stroke-[2.5]" />}
                        {isSalida && <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />}
                        {isAjuste && <Sliders className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </span>

                      {/* Detail block */}
                      <div className="bg-[#161B22]/60 border border-zinc-850/90 hover:border-zinc-800/80 rounded-xl p-4 space-y-3 shadow-inner">
                        
                        {/* Title, qty, and timestamp */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-zinc-900">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded font-mono ${
                              isEntrada 
                                ? "bg-emerald-500/10 text-emerald-400" 
                                : isSalida 
                                  ? "bg-cyan-500/10 text-cyan-400" 
                                  : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {isEntrada ? "Entrada / Recepción" : isSalida ? "Egreso / Despacho" : "Ajuste Auditoría"}
                            </span>
                            <span className="text-zinc-500 text-[11px] font-mono">
                              #{tx.id.substring(0, 6).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2.5">
                            <span className="text-[11px] font-bold text-zinc-400 flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span>{formatLocalDate(tx.date)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Physical Transfer Routing Map Indicator */}
                        <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5 space-y-1">
                          <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            <span>Ruta de Movilidad Física</span>
                          </div>
                          <p className="text-xs text-zinc-200 font-semibold">
                            {routeFlowText}
                          </p>
                        </div>

                        {/* Movement details: Quantities & audit */}
                        <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/10 p-2 rounded-lg">
                          <div>
                            <span className="text-[9px] text-zinc-500 block">Flujo de Stock:</span>
                            <strong className={`text-xs ${isEntrada ? "text-emerald-400" : isSalida ? "text-red-400" : "text-amber-500"}`}>
                              {isEntrada ? "+" : isSalida ? "-" : ""}{tx.qty} {item.unit}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 block">Evolución:</span>
                            <span className="text-zinc-300">
                              {tx.prevQty} ➔ {tx.newQty}
                            </span>
                          </div>
                        </div>

                        {/* Audit Details */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-1 gap-2 border-t border-zinc-900 text-xs">
                          {/* Operator */}
                          <div className="flex items-center space-x-1.5 text-zinc-400">
                            <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                            <span>Operador: <strong className="text-zinc-300">{tx.responsible}</strong></span>
                          </div>

                          {/* Digital Signature */}
                          {tx.signature && (
                            <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 py-0.5 px-2 rounded-md">
                              <PenTool className="h-3 w-3 text-amber-500 animate-pulse shrink-0" />
                              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-mono">
                                Firma en Terreno Registrada
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {tx.notes && (
                          <div className="mt-2 text-xs bg-zinc-950/20 border-l border-zinc-800 p-2 text-zinc-400 italic">
                            "{tx.notes}"
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}

              </div>
            ) : (
              <div className="bg-[#161B22]/35 border border-dashed border-zinc-850 p-8 rounded-xl text-center select-none space-y-2">
                <Info className="h-8 w-8 text-zinc-700 mx-auto" />
                <h4 className="text-zinc-300 text-sm font-bold">Sin histórico de traslados</h4>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Este recurso aún conserva su stock y pasillo iniciales sin movimientos físicos o ingresos de despacho registrados en el Kardex.
                </p>
                {onRecordTx && (
                  <button
                    onClick={() => {
                      onClose();
                      onRecordTx(item);
                    }}
                    className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-amber-500 hover:text-amber-400 underline cursor-pointer"
                  >
                    Registrar primer movimiento físico ⚡
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-between bg-zinc-950 items-center">
          <div>
            {onDeleteItem && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Estás seguro que deseas eliminar el equipo "${item.name}"? Esta acción es irreversible.`)) {
                    onClose();
                    onDeleteItem(item.id, item.name);
                  }
                }}
                className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-xs sm:text-sm transition flex items-center space-x-1.5 font-semibold cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Equipo</span>
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            {onEditItem && !isLow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditItem(item);
                }}
                className="py-2 px-4 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs sm:text-sm transition font-semibold cursor-pointer"
              >
                Editar Especificaciones
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black text-xs sm:text-sm transition duration-150 shadow-lg cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
