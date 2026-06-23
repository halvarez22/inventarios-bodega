import React, { useState, useEffect } from "react";
import { 
  collection, 
  setDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { InventoryItem, Transaction } from "../types";
import { 
  ClipboardCheck, 
  RefreshCw, 
  Calendar, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  FileSpreadsheet, 
  History, 
  Flame, 
  TrendingUp, 
  Sliders, 
  Plus, 
  Minus, 
  ChevronRight,
  Info
} from "lucide-react";
import { formatLocalDate } from "../utils/csvExport";

interface CyclicInventoryProps {
  items: InventoryItem[];
  currentUserEmail: string;
  onRecordTransaction: (txFields: Omit<Transaction, "id" | "date">) => Promise<void>;
}

interface AuditDetail {
  itemId: string;
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  location: string;
  systemQty: number;
  physicalQty: number;
  discrepancy: number;
  unit: string;
}

interface CyclicAudit {
  id: string;
  date: string;
  createdAt: any;
  responsible: string;
  itemsCounted: number;
  discrepanciesCount: number;
  notes: string;
  details: AuditDetail[];
}

export default function CyclicInventory({
  items,
  currentUserEmail,
  onRecordTransaction
}: CyclicInventoryProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "history">("audit");
  
  // Daily suggestions lists state
  const [suggestedItems, setSuggestedItems] = useState<InventoryItem[]>([]);
  
  // Object keeping track of physical count for each suggested item ID
  // e.g. { "item-123": 25, "item-456": 12 }
  const [physicalCounts, setPhysicalCounts] = useState<{ [itemId: string]: string }>({});
  
  // Notes for the current audit
  const [auditNotes, setAuditNotes] = useState("");
  
  // Historical audits from Firestore
  const [pastAudits, setPastAudits] = useState<CyclicAudit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Selected audit for detailed viewing modal
  const [viewingPastAudit, setViewingPastAudit] = useState<CyclicAudit | null>(null);
  
  // UI States for saving audits
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Deterministically generate/suggest the 10 daily items based on date
  useEffect(() => {
    if (items.length === 0) return;

    const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    
    // Simple deterministic string hash to seed
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Pseudo-random seeded generator
    const seededRandom = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    // Shuffle items list deterministically
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    // Slice up to 10
    const suggested = shuffled.slice(0, 10);
    setSuggestedItems(suggested);
  }, [items]);

  // Subscribe to past cyclic audits stored in Firestore
  useEffect(() => {
    const auditsCol = collection(db, "cyclic_audits");
    const q = query(auditsCol, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: CyclicAudit[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as CyclicAudit);
      });
      setPastAudits(data);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error setting up real-time listener for cyclic audits:", error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, []);

  // Set physical count input
  const handleCountChange = (itemId: string, val: string) => {
    // Only accept numbers or empty string
    if (val === "" || /^[0-9]\d*$/.test(val)) {
      setPhysicalCounts(prev => ({
        ...prev,
        [itemId]: val
      }));
    }
  };

  // Quick increment/decrement physical counters
  const adjustCount = (itemId: string, systemVal: number, step: number) => {
    const currentValStr = physicalCounts[itemId];
    const currentVal = currentValStr !== undefined && currentValStr !== "" 
      ? parseInt(currentValStr, 10) 
      : systemVal;
    
    const newVal = Math.max(0, currentVal + step);
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: String(newVal)
    }));
  };

  // Quick action: Set physical count matching system stock precisely
  const copySystemCount = (itemId: string, systemQty: number) => {
    setPhysicalCounts(prev => ({
      ...prev,
      [itemId]: String(systemQty)
    }));
  };

  // Quick action: set all remaining suggested items matching system stock
  const matchAllToSystem = () => {
    const updated = { ...physicalCounts };
    suggestedItems.forEach(item => {
      if (updated[item.id] === undefined || updated[item.id] === "") {
        updated[item.id] = String(item.qty);
      }
    });
    setPhysicalCounts(updated);
  };

  // Compute calculated metrics of discrepancies for active items
  const getDiscrepancySummary = () => {
    let counted = 0;
    let discrepancies = 0;
    const detailsList: AuditDetail[] = [];

    suggestedItems.forEach(item => {
      const inputStr = physicalCounts[item.id];
      const isCounted = inputStr !== undefined && inputStr !== "";
      
      if (isCounted) {
        counted++;
        const pQty = parseInt(inputStr, 10);
        const sQty = item.qty;
        const diff = pQty - sQty;

        if (diff !== 0) {
          discrepancies++;
        }

        detailsList.push({
          itemId: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          subcategory: item.subcategory || "General",
          location: item.location || "General",
          systemQty: sQty,
          physicalQty: pQty,
          discrepancy: diff,
          unit: item.unit
        });
      }
    });

    return {
      counted,
      total: suggestedItems.length,
      discrepancies,
      detailsList
    };
  };

  const currentSummary = getDiscrepancySummary();

  // Save the report and apply automatic adjustments to Firestore in batch
  const handleSaveAudit = async () => {
    if (currentSummary.counted === 0) {
      alert("⚠️ Error: Ingresa al menos un conteo físico para poder consolidar el reporte.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const newAuditDocRef = doc(collection(db, "cyclic_audits"));
      
      const newAudit: Omit<CyclicAudit, "id"> = {
        date: todayStr,
        createdAt: new Date().toISOString(), // Fallback list sorting string, saved as ISO for offline stability
        responsible: currentUserEmail,
        itemsCounted: currentSummary.counted,
        discrepanciesCount: currentSummary.discrepancies,
        notes: auditNotes,
        details: currentSummary.detailsList
      };

      // 1. Save general audit report logs in firestore
      await setDoc(newAuditDocRef, {
        ...newAudit,
        createdAt: serverTimestamp() // real server timestamp for audit tracking
      });

      // 2. Loop discrepancies and run system record updates & transaction logging
      for (const det of currentSummary.detailsList) {
        if (det.discrepancy !== 0) {
          const typeLabel = det.discrepancy > 0 ? "entrada" : "salida";
          const absoluteQty = Math.abs(det.discrepancy);

          await onRecordTransaction({
            itemId: det.itemId,
            itemName: det.name,
            itemCategory: det.category as any,
            type: "ajuste",
            qty: absoluteQty,
            prevQty: det.systemQty,
            newQty: det.physicalQty,
            responsible: currentUserEmail,
            destinationOrOrigin: `Inventario Cíclico (${todayStr})`,
            notes: `Auto-ajustado por discrepancia de auditoría cíclica. Conteo físico real: ${det.physicalQty} ${det.unit} (Sistema anterior: ${det.systemQty} ${det.unit}). Obs: ${auditNotes || "Sin notas adicionales"}`
          });
        }
      }

      alert("🎉 ¡Auditoría de inventario consolidada con éxito! Se han registrado los logs de control y balanceado las cantidades del sistema automáticamente.");
      
      // Cleanup States
      setPhysicalCounts({});
      setAuditNotes("");
      setShowReportModal(false);
      setActiveTab("history");

    } catch (error) {
      console.error("Error saving cyclic audit report: ", error);
      alert("No se pudo guardar la auditoría. Revisa tu conexión de red o configuraciones de la bodega local.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header with Solar Theme */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="h-6 w-6 text-amber-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">
              módulo de auditoría inteligente
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none pt-1">
            Inventario Cíclico Bodega
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl pt-1">
            Mitiga discrepancias operativas en terreno mediante conteos sistemáticos diarios de bajo impacto. El sistema selecciona 
            de manera inteligente y matemática un lote de <span className="text-white font-bold">10 recursos</span> de rotación por día para ser auditados físicamente.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "audit" 
                ? "bg-amber-500 text-zinc-950 shadow" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Auditoría de Hoy</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "history" 
                ? "bg-amber-500 text-zinc-950 shadow" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Ver Historial Guardados</span>
          </button>
        </div>
      </div>

      {activeTab === "audit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main counting panel */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-mono text-[11px] text-zinc-400">
                <Calendar className="h-4 w-4 text-amber-500" />
                <span>Auditoría Sugerida del Día: <strong>{formatLocalDate(new Date().toISOString())}</strong></span>
              </div>
              <button
                onClick={matchAllToSystem}
                className="text-[10px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
              >
                Match Automático (Copiar Todo)
              </button>
            </div>

            {items.length === 0 ? (
              <div className="bg-[#161B22]/60 border border-dashed border-zinc-800 p-12 rounded-2xl text-center">
                <RefreshCw className="h-6 w-6 text-zinc-600 animate-spin mx-auto mb-2" />
                <p className="text-zinc-400 text-xs">Cargando base de recursos para el lote diario...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedItems.map((item, index) => {
                  const pVal = physicalCounts[item.id];
                  const hasValue = pVal !== undefined && pVal !== "";
                  const physicalNum = hasValue ? parseInt(pVal, 10) : NaN;
                  const delta = isNaN(physicalNum) ? 0 : physicalNum - item.qty;

                  return (
                    <div 
                      key={item.id} 
                      className={`bg-[#161B22]/50 border rounded-2xl p-4.5 transition-all duration-150 ${
                        hasValue 
                          ? delta === 0 
                            ? "border-emerald-500/20 bg-emerald-950/5" 
                            : "border-amber-500/30 bg-amber-950/5"
                          : "border-zinc-850 hover:border-zinc-800"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        
                        {/* Header details */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono font-black py-0.5 px-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              LOTE {index + 1}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono font-bold">
                              {item.sku}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-black text-white leading-snug truncate">
                            {item.name}
                          </h3>

                          {/* category/subcategory & physical aisle */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-zinc-400 font-mono">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-amber-500" />
                              <span className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 uppercase font-bold text-zinc-300">
                                {item.location || "Coordenada general"}
                              </span>
                            </div>
                            <span className="text-zinc-500 italic">
                              {item.subcategory || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Counting Controls side */}
                        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 self-end sm:self-center">
                          <div className="flex-1 sm:flex-initial text-center bg-zinc-950 p-2 rounded-xl border border-zinc-900 font-mono min-w-[70px]">
                            <span className="text-[8px] text-zinc-500 block uppercase leading-none pb-0.5 font-bold">Bodega</span>
                            <span className="text-sm font-black text-white">{item.qty}</span>
                            <span className="text-[9px] text-zinc-400 block">{item.unit}</span>
                          </div>

                          <div className="text-center font-mono shrink-0">
                            <span className="text-[15px] font-bold text-zinc-500 block">➔</span>
                          </div>

                          {/* Physics Input controller */}
                          <div className="flex flex-col items-center space-y-1 shrink-0">
                            <div className="flex items-center bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
                              <button
                                type="button"
                                onClick={() => adjustCount(item.id, item.qty, -1)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition active:scale-95 cursor-pointer"
                                title="Restar 1"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>

                              <input
                                type="text"
                                placeholder="?"
                                value={pVal ?? ""}
                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                className="w-12 bg-transparent text-center text-sm text-amber-400 font-black focus:outline-none placeholder-zinc-700 font-mono border-x border-zinc-900 h-9"
                              />

                              <button
                                type="button"
                                onClick={() => adjustCount(item.id, item.qty, 1)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition active:scale-95 cursor-pointer"
                                title="Sumar 1"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => copySystemCount(item.id, item.qty)}
                              className="text-[9px] text-zinc-500 hover:text-zinc-300 font-bold transition underline"
                            >
                              Copiar Sistema
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Display Alert status details dynamically */}
                      {hasValue && (
                        <div className="mt-3.5 pt-2 border-t border-zinc-900/60 flex items-center justify-between text-xs font-mono">
                          <span className="text-zinc-500">Resultado Auditoría:</span>
                          {delta === 0 ? (
                            <span className="text-emerald-400 font-bold flex items-center space-x-1">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>Ok (Control Cuadrante Seguro)</span>
                            </span>
                          ) : (
                            <span className="text-amber-500 font-bold flex items-center space-x-1 animate-pulse">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>
                                {delta > 0 
                                  ? `Sobrante Encontrado (+${delta} ${item.unit})` 
                                  : `Faltante de Stock (${delta} ${item.unit})`}
                              </span>
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Audit report sidebar action controller */}
          <div className="space-y-4">
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-[#F8FAFC] text-sm">Resumen de Auditoría Cíclica</h3>
              </div>

              {/* Progress bars & statistics */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-zinc-400">
                  <span>Operador Responsable:</span>
                  <strong className="text-zinc-200 truncate max-w-[120px]" title={currentUserEmail}>
                    {currentUserEmail}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-zinc-400">
                  <span>Lote del día:</span>
                  <strong className="text-zinc-200">10 recursos</strong>
                </div>

                {/* Progress bar of items counted */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
                    <span>Avance Control Físico:</span>
                    <span className="font-bold text-white">
                      {currentSummary.counted} / {currentSummary.total} ({Math.round((currentSummary.counted / currentSummary.total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${(currentSummary.counted / currentSummary.total) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Conflict / Discrepancy metric gauge */}
                {currentSummary.counted > 0 && (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-2 mt-4">
                    <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Hallazgos Críticos</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-zinc-900 border border-zinc-850/40 p-1.5 rounded-lg">
                        <span className="text-[10px] text-zinc-400 block font-mono">Concordancias</span>
                        <strong className="text-emerald-400 text-sm font-mono block">
                          {currentSummary.counted - currentSummary.discrepancies}
                        </strong>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-850/40 p-1.5 rounded-lg1">
                        <span className="text-[10px] text-zinc-400 block font-mono">Discrepancias</span>
                        <strong className={`text-sm font-mono block ${currentSummary.discrepancies > 0 ? "text-amber-500 animate-pulse" : "text-zinc-400"}`}>
                          {currentSummary.discrepancies}
                        </strong>
                      </div>
                    </div>

                    {currentSummary.discrepancies > 0 && (
                      <p className="text-[10px] text-amber-500/80 leading-relaxed font-sans mt-1">
                        ⚠️ Al guardar, el sistema generará de manera autónoma las transacciones de ajuste y nivelará las bases de datos de inmediato.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Audit general Notes text box */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] uppercase tracking-wider font-mono font-bold text-zinc-400 block">
                  Notas de Auditoría / Observaciones en Terreno
                </label>
                <textarea
                  placeholder="Ej: Se detectó diferencia de embalaje en inversor pasillo C-3, se procedió a etiquetado manual..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full bg-[#161B22]/80 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-650 font-sans focus:outline-none focus:border-amber-500/50 min-h-[90px] transition resize-none leading-relaxed"
                />
              </div>

              {/* Big Action compilation triggering */}
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                disabled={currentSummary.counted === 0}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center space-x-2 border shadow-lg ${
                  currentSummary.counted === 0
                    ? "bg-zinc-950 text-zinc-600 border-zinc-850 cursor-not-allowed shadow-none"
                    : "bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-600 hover:shadow-amber-500/10 cursor-pointer active:scale-[0.98]"
                }`}
              >
                <span>Generar Reporte de Discrepancias 📝</span>
              </button>

            </div>

            {/* General informational tips card */}
            <div className="bg-[#161B22]/20 border border-zinc-850 p-4.5 rounded-2xl flex items-start space-x-3 text-zinc-550">
              <Info className="h-5 w-5 text-amber-500/80 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-zinc-400">Eficiencia Operativa</h4>
                <p className="leading-normal text-zinc-400 text-[11px]">
                  Un inventario cíclico diario constante elimina la necesidad de cerrar bodegas y paralizar entregas una vez al año para auditorías integrales. Al auditar 10 recursos diarios, estás barriendo toda la bodega central cada 45-60 días calendario.
                </p>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Historical saved audits collection view */
        <div className="space-y-4">
          
          <div className="bg-zinc-950/40 p-4.5 rounded-xl border border-zinc-850 flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono text-[11px] text-zinc-400">
              <History className="h-4 w-4 text-amber-500" />
              <span>Bitácora Consolidada de Control y Conciliaciones Cíclicas</span>
            </div>
            <span className="text-[10px] bg-zinc-900 py-1 px-2.5 rounded-lg text-zinc-400 font-mono border border-zinc-800">
              {pastAudits.length} Reportes Guardados
            </span>
          </div>

          {loadingHistory ? (
            <div className="p-16 text-center">
              <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto mb-2" />
              <p className="text-zinc-400 text-xs font-mono font-bold">Cargando bitácora de auditorías...</p>
            </div>
          ) : pastAudits.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-850 p-16 rounded-2xl text-center select-none space-y-2">
              <ClipboardCheck className="h-10 w-10 text-zinc-700 mx-auto" />
              <h4 className="text-zinc-300 font-bold text-sm">Sin auditorías registradas</h4>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                Ningún operador ha consolidado hojas de conteo cíclico temporal en esta bodega aún. Comienza cargando conteos en la pestaña "Auditoría de Hoy".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAudits.map((aud) => {
                const totalDiffCount = aud.details?.reduce((acc, current) => acc + (current.discrepancy !== 0 ? 1 : 0), 0) || aud.discrepanciesCount || 0;
                const matchRate = aud.details?.length 
                  ? Math.round(((aud.details.length - totalDiffCount) / aud.details.length) * 100)
                  : 100;

                return (
                  <div 
                    key={aud.id}
                    className="bg-[#161B22]/55 border border-zinc-850 rounded-2xl p-5 hover:border-zinc-800 transition-all flex flex-col justify-between space-y-4 shadow-md"
                  >
                    <div className="space-y-3">
                      
                      {/* Date & Title */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">CONCILIACIÓN FÍSICA</span>
                          <h4 className="text-sm font-black text-white hover:text-amber-500 transition cursor-pointer">
                            Control del {formatLocalDate(aud.date)}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
                          totalDiffCount === 0 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {totalDiffCount === 0 ? "OK" : `${totalDiffCount} Dif.`}
                        </span>
                      </div>

                      {/* Summary details */}
                      <div className="text-[11px] font-mono text-zinc-400 space-y-1 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900">
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Auditor:</span>
                          <span className="text-zinc-300 truncate max-w-[120px]">{aud.responsible}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-550">Ítems Contados:</span>
                          <span className="text-zinc-300">{aud.itemsCounted || aud.details?.length || 0} recursos</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-zinc-900">
                          <span className="text-zinc-550">Tasa de Precisión:</span>
                          <span className={matchRate === 100 ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                            {matchRate}% Concordantes
                          </span>
                        </div>
                      </div>

                      {aud.notes && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 italic leading-relaxed">
                          "{aud.notes}"
                        </p>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingPastAudit(aud)}
                      className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold rounded-xl text-zinc-300 hover:text-white transition cursor-pointer flex items-center justify-center space-x-1.5 active:scale-98"
                    >
                      <span>Inspeccionar Ficha 🔍</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: PRE-SUBMIT SYSTEM DISCREPANCIES RECONCILIATION SUMMARY REPORT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-850 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest block">
                    cuadre de discrepancias
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">Reporte Auditoría Cíclica</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              <div className="bg-zinc-950 p-4.5 rounded-xl border border-zinc-850 space-y-3">
                <div className="text-xs font-mono space-y-1.5 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Fecha de Control:</span>
                    <strong className="text-zinc-200">{formatLocalDate(new Date().toISOString())}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ítems con control de terreno:</span>
                    <strong className="text-zinc-200">{currentSummary.counted} / {currentSummary.total}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sobrantes / Escaseces detectados:</span>
                    <strong className={currentSummary.discrepancies > 0 ? "text-amber-500" : "text-emerald-400"}>
                      {currentSummary.discrepancies} discrepancias
                    </strong>
                  </div>
                </div>
              </div>

              {/* Discrepancy detailed matrix listing */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">
                  Matriz de Diferencias Físicas vs Conteo del Sistema
                </h4>

                {currentSummary.detailsList.length === 0 ? (
                  <p className="text-zinc-500 text-xs italic">No has ingresado ningún conteo aún para analizar.</p>
                ) : (
                  <div className="border border-zinc-850/80 rounded-xl overflow-hidden divide-y divide-zinc-900 font-mono text-[11px]">
                    <div className="bg-zinc-950 p-2 px-3 text-zinc-500 font-bold grid grid-cols-12 gap-1 select-none">
                      <div className="col-span-5 truncate text-[10px]">RECURSO / SKU</div>
                      <div className="col-span-2 text-right text-[10px]">SIST.</div>
                      <div className="col-span-2 text-right text-[10px]">FÍS.</div>
                      <div className="col-span-3 text-right text-[10px]">DIF.</div>
                    </div>

                    {currentSummary.detailsList.map(det => {
                      const isPerfect = det.discrepancy === 0;
                      return (
                        <div key={det.itemId} className="p-2.5 px-3 bg-[#161B22]/40 text-zinc-300 grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-5 truncate">
                            <span className="block font-bold text-white text-[11px] truncate">{det.name}</span>
                            <span className="text-[9px] text-zinc-500 font-bold">{det.sku}</span>
                          </div>
                          <div className="col-span-2 text-right text-zinc-300">{det.systemQty}</div>
                          <div className="col-span-2 text-right font-black text-amber-400">{det.physicalQty}</div>
                          <div className={`col-span-3 text-right font-bold ${
                            isPerfect 
                              ? "text-emerald-400" 
                              : det.discrepancy > 0 
                                ? "text-emerald-400" 
                                : "text-red-400"
                          }`}>
                            {isPerfect 
                              ? "0" 
                              : det.discrepancy > 0 
                                ? `+${det.discrepancy}` 
                                : det.discrepancy}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {auditNotes && (
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 font-mono block mb-1">Notas de Auditoría</span>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-850 italic font-sans break-words text-left">
                    "{auditNotes}"
                  </p>
                </div>
              )}

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
                <h5 className="text-[12px] font-black text-amber-500 flex items-center space-x-1.5 font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 animate-bounce" />
                  <span>¿Deseas impactar y ajustar las cantidades?</span>
                </h5>
                <p className="text-[11px] text-zinc-400 leading-normal font-sans text-left">
                  Si hay discrepancias, esta acción registrará transacciones automáticas de ajuste en las bitácoras y actualizará la cantidad física como el nuevo stock válido en nuestra bodega BESS central.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-850 flex justify-end bg-zinc-950 space-x-2.5">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="py-2.5 px-4 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-xs font-bold rounded-lg cursor-pointer"
              >
                Volver a corregir
              </button>
              <button
                type="button"
                onClick={handleSaveAudit}
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-amber-500 text-zinc-950 hover:bg-amber-400 transition text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Guardando y Ajustando...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar y Ajustar Stock ⚡</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: HISTORICAL SAVED AUDIT DETAILS VIEW OVERLAY */}
      {viewingPastAudit && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-850 flex justify-between items-center bg-zinc-950">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[9px] font-mono font-black text-amber-500 uppercase tracking-widest block">
                    Ficha de historial cyclic_audits
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Auditoría del {formatLocalDate(viewingPastAudit.date)}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setViewingPastAudit(null)}
                className="text-zinc-400 hover:text-white p-1 rounded transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-left">
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950 p-4 rounded-xl border border-zinc-850 text-zinc-400 font-mono">
                <div>
                  <span className="text-[9px] text-zinc-550 block font-bold uppercase">Auditor Responsable</span>
                  <span className="text-zinc-200 font-sans block mt-0.5 truncate" title={viewingPastAudit.responsible}>
                    {viewingPastAudit.responsible}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 block font-bold uppercase">Ubicación Bodega</span>
                  <span className="text-zinc-200 block mt-0.5">Sede Central Solar BESS</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 block font-bold uppercase">Recursos Auditados</span>
                  <span className="text-zinc-200 block mt-0.5">{viewingPastAudit.itemsCounted || viewingPastAudit.details?.length || 0}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-550 block font-bold uppercase">Discrepancias Totales</span>
                  <span className={`block font-bold mt-0.5 ${viewingPastAudit.discrepanciesCount > 0 ? "text-amber-500" : "text-emerald-400"}`}>
                    {viewingPastAudit.discrepanciesCount} hallazgos
                  </span>
                </div>
              </div>

              {/* Details table list representation */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-zinc-400 font-mono block">
                  Corte y Registro de Conteo en Matriz Física
                </span>

                {viewingPastAudit.details && viewingPastAudit.details.length > 0 ? (
                  <div className="border border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-900 font-mono text-[11px]">
                    <div className="bg-zinc-950 p-2 px-3 text-zinc-500 font-bold grid grid-cols-12 gap-1 select-none">
                      <div className="col-span-5 truncate text-[10px]">RECURSO / SKU</div>
                      <div className="col-span-2 text-right text-[10px]">SIST.</div>
                      <div className="col-span-2 text-right text-[10px]">FÍS.</div>
                      <div className="col-span-3 text-right text-[10px]">DIF.</div>
                    </div>

                    {viewingPastAudit.details.map(det => {
                      const isPerfect = det.discrepancy === 0;
                      return (
                        <div key={det.itemId} className="p-2.5 px-3 bg-[#161B22]/30 text-zinc-300 grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-5 truncate">
                            <span className="block font-bold text-white text-[11px] truncate">{det.name}</span>
                            <span className="text-[9px] text-zinc-500 font-bold">{det.sku}</span>
                          </div>
                          <div className="col-span-2 text-right text-zinc-300">{det.systemQty}</div>
                          <div className="col-span-2 text-right font-black text-amber-500">{det.physicalQty}</div>
                          <div className={`col-span-3 text-right font-bold ${
                            isPerfect 
                              ? "text-emerald-400" 
                              : det.discrepancy > 0 
                                ? "text-emerald-400" 
                                : "text-red-400"
                          }`}>
                            {isPerfect 
                              ? "0" 
                              : det.discrepancy > 0 
                                ? `+${det.discrepancy}` 
                                : det.discrepancy}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-850 text-center text-xs text-zinc-500">
                    Detalles no archivados en el documento de auditoría.
                  </div>
                )}
              </div>

              {viewingPastAudit.notes && (
                <div className="pt-2">
                  <span className="text-[9px] font-black uppercase text-zinc-500 font-mono block mb-1">Notas del Auditor</span>
                  <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-850 italic font-sans break-words">
                    "{viewingPastAudit.notes}"
                  </p>
                </div>
              )}

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2.5">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-400">
                  Conciliación de Inventario Completada & Cerrada
                </span>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-850 flex justify-end bg-zinc-950">
              <button
                type="button"
                onClick={() => setViewingPastAudit(null)}
                className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-black text-xs transition duration-150 cursor-pointer shadow"
              >
                Cerrar Ficha
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
