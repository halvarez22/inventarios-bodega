import React, { useState, useEffect, useRef } from "react";
import { InventoryItem, Transaction, Installer, WorkOrder } from "../types";
import { X, ArrowUpRight, ArrowDownLeft, Sliders, Save, AlertTriangle, PenTool, RotateCcw, Link } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onRecord: (tx: Omit<Transaction, "id" | "date">) => Promise<void>;
  currentUserEmail: string;
  installers: Installer[];
  workOrders: WorkOrder[];
}

export default function TransactionModal({ isOpen, onClose, item, onRecord, currentUserEmail, installers, workOrders }: TransactionModalProps) {
  const [type, setType] = useState<Transaction["type"]>("entrada");
  const [workOrderId, setWorkOrderId] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [responsible, setResponsible] = useState("");
  const [destinationOrOrigin, setDestinationOrOrigin] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Digital Signature Canvas configurations
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize/resize canvas
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Signature line configurations
      ctx.strokeStyle = "#F59E0B"; // Amber-500
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      setHasSignature(false);
    }, 180); // brief timeouts allow modal transition rendering to complete beautifully

    return () => clearTimeout(timer);
  }, [isOpen, type]);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  useEffect(() => {
    if (item) {
      setType("entrada");
      setQty(1);
      setResponsible(currentUserEmail || "operador@bodega.com");
      setDestinationOrOrigin("");
      setNotes("");
      setWorkOrderId("");
      setError("");
    }
  }, [item, isOpen, currentUserEmail]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (qty <= 0) {
      setError("La cantidad del movimiento debe ser un número entero mayor que cero.");
      return;
    }

    if ((type === "salida" || type === "asignacion") && qty > item.qty) {
      setError(`No hay suficiente stock disponible. Intenta retirar un máximo de ${item.qty} ${item.unit}.`);
      return;
    }

    if ((type === "salida" || type === "asignacion") && !responsible.trim()) {
      setError("Debes seleccionar un instalador responsable para registrar la salida o asignación.");
      return;
    }

    setLoading(true);
    try {
      const prevQty = item.qty;
      let newQty = item.qty;

      if (type === "entrada" || type === "devolucion") {
        newQty = prevQty + qty;
      } else if (type === "salida" || type === "asignacion") {
        newQty = prevQty - qty;
      } else if (type === "ajuste") {
        newQty = qty; // Direct adjustment
      }

      let signatureDataUrlStr: string | undefined = undefined;
      if (hasSignature && canvasRef.current) {
        signatureDataUrlStr = canvasRef.current.toDataURL("image/png");
      }

      await onRecord({
        itemId: item.id,
        itemName: item.name,
        itemCategory: item.category,
        type,
        qty: type === "ajuste" ? qty : qty, // absolute count recorded
        prevQty,
        newQty,
        responsible: responsible.trim() || "Supervisor",
        destinationOrOrigin: destinationOrOrigin.trim() || (type === "entrada" ? "Proveedor General" : type === "salida" ? "Suministro Obras" : type === "asignacion" ? "Préstamo Operativo" : type === "devolucion" ? "Retorno a Bodega" : "Auditoría Interna"),
        notes: notes.trim(),
        signature: signatureDataUrlStr,
        workOrderId: workOrderId || undefined
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Eror al procesar el movimiento: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500">Registrar Movimiento</span>
            <h2 className="text-lg font-bold text-white mt-1 limit-2-lines">{item.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-2 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 flex justify-between text-xs font-mono text-zinc-400">
            <div>SKU: <span className="text-white font-medium">{item.sku}</span></div>
            <div>Stock Actual: <span className="text-amber-500 font-bold">{item.qty} {item.unit}</span></div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type of movement selectors */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setType("entrada")}
                className={`py-2 px-1 border rounded-xl font-semibold text-[10px] sm:text-xs flex flex-col items-center justify-center space-y-1 transition duration-150 cursor-pointer ${
                  type === "entrada" 
                    ? "bg-emerald-950/30 border-emerald-500 text-emerald-400" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => setType("salida")}
                className={`py-2 px-1 border rounded-xl font-semibold text-[10px] sm:text-xs flex flex-col items-center justify-center space-y-1 transition duration-150 cursor-pointer ${
                  type === "salida" 
                    ? "bg-red-950/30 border-red-500 text-red-400" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Salida</span>
              </button>

              <button
                type="button"
                onClick={() => setType("asignacion")}
                className={`py-2 px-1 border rounded-xl font-semibold text-[10px] sm:text-xs flex flex-col items-center justify-center space-y-1 transition duration-150 cursor-pointer ${
                  type === "asignacion" 
                    ? "bg-blue-950/30 border-blue-500 text-blue-400" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
                title="Prestar equipo o vehículo a un instalador"
              >
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Asignar</span>
              </button>

              <button
                type="button"
                onClick={() => setType("devolucion")}
                className={`py-2 px-1 border rounded-xl font-semibold text-[10px] sm:text-xs flex flex-col items-center justify-center space-y-1 transition duration-150 cursor-pointer ${
                  type === "devolucion" 
                    ? "bg-purple-950/30 border-purple-500 text-purple-400" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
                title="Devolver equipo prestado a bodega"
              >
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Devolver</span>
              </button>

              <button
                type="button"
                onClick={() => setType("ajuste")}
                className={`py-2 px-1 border rounded-xl font-semibold text-[10px] sm:text-xs flex flex-col items-center justify-center space-y-1 transition duration-150 cursor-pointer col-span-2 sm:col-span-1 ${
                  type === "ajuste" 
                    ? "bg-amber-950/30 border-amber-500 text-amber-400" 
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Ajuste</span>
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Cantidad ({item.unit})
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm font-mono"
            />
            {type === "ajuste" && (
              <span className="text-[10px] text-zinc-500 mt-1 block">Establecerá el stock directamente al valor ingresado (auditoría).</span>
            )}
          </div>

          {/* Responsible Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Responsable de Operación
            </label>
            {(type === "salida" || type === "asignacion" || type === "devolucion") ? (
              <select
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm"
              >
                <option value="">-- Seleccionar Instalador --</option>
                {installers.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name} {inst.company ? `(${inst.company})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nombre o correo del operador"
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm"
              />
            )}
          </div>

          {/* Origin / Destination references */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {type === "entrada" ? "Origen (Proveedor o Bodega)" : (type === "salida" || type === "asignacion") ? "Destino / Uso" : type === "devolucion" ? "Lugar de Devolución" : "Referencia de Ajuste"}
            </label>
            <input
              type="text"
              value={destinationOrOrigin}
              onChange={(e) => setDestinationOrOrigin(e.target.value)}
              placeholder={type === "entrada" ? "E.g. Jinko Solar, Aduanas Valparaíso" : type === "salida" ? "E.g. Parque Fotovoltaico Antofagasta, Camioneta 2" : "E.g. Inventario Físico Semestral del 22-Jun"}
              className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm"
            />
          </div>

          {/* Work Order Link */}
          {(type === "salida" || type === "asignacion") && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Link className="h-3.5 w-3.5" />
                <span>Vincular a Orden de Trabajo (Opcional)</span>
              </label>
              <select
                value={workOrderId}
                onChange={(e) => setWorkOrderId(e.target.value)}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm"
              >
                <option value="">-- Sin Vincular --</option>
                {workOrders.filter(wo => wo.status !== "completada").map((wo) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.identifier} - {wo.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Observaciones / Justificación
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre guías de despacho, orden de compra, o justificación..."
              rows={2}
              className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm transition-all"
            />
          </div>

          {/* Digital Signature Capture Panel */}
          <div className="bg-zinc-950 p-4 border border-zinc-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <PenTool className="h-3.5 w-3.5 text-amber-500" />
                <span>Firma de Conformidad Operador</span>
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center space-x-1 transition cursor-pointer font-semibold"
                  title="Re-escribir firma digital"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
            
            <div className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-28 touch-none cursor-crosshair block"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-zinc-650 space-y-1">
                  <span className="text-xs font-medium text-zinc-500">Registre firma en terreno</span>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-600">Pulsar y arrastrar</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold text-sm transition duration-150 flex items-center space-x-1 shadow-lg disabled:opacity-50 pointer-events-auto cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Registrando..." : "Confirmar Movimiento"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
