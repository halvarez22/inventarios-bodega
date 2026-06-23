import React, { useState, useMemo } from "react";
import { InventoryItem, Location } from "../types";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Wrench, 
  Truck, 
  Sun, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  ArrowLeftRight, 
  MapPin, 
  Layers,
  HeartCrack,
  CheckCircle,
  PlusCircle,
  Download,
  FileSpreadsheet,
  QrCode,
  Map,
  Warehouse
} from "lucide-react";
import { exportInventoryToCSV } from "../utils/csvExport";
import { exportInventoryToXLSX } from "../utils/xlsxExport";
import ItemQrCodeModal from "./ItemQrCodeModal";

interface InventoryListProps {
  items: InventoryItem[];
  onOpenItemModal: (item?: InventoryItem) => void;
  onOpenTransactionModal: (item: InventoryItem) => void;
  onDelete: (id: string, name: string) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  onOpenItemDetails: (item: InventoryItem) => void;
  locations?: Location[];
}

type TabType = "todos" | "materiales" | "herramientas" | "unidades_moviles";

export default function InventoryList({ 
  items, 
  onOpenItemModal, 
  onOpenTransactionModal, 
  onDelete,
  onNavigateToTab,
  onOpenItemDetails,
  locations = []
}: InventoryListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [search, setSearch] = useState("");
  const [subcatFilter, setSubcatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [isInspectionMode, setIsInspectionMode] = useState<boolean>(false);

  // 2D Warehouse map integration states
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showWarehouseMap, setShowWarehouseMap] = useState<boolean>(true);

  // Check if high contrast terrain mode is enabled (synced with Dashboard)
  const isHighContrast = useMemo(() => {
    return localStorage.getItem("dashboard_contrast_terrain") === "true";
  }, []);

  // Collect dynamic subcategories depending on loaded items for the filter selector
  const availableSubcategories = useMemo(() => {
    const list = new Set<string>();
    items.forEach(item => {
      if (item.subcategory) {
        list.add(item.subcategory);
      }
    });
    return Array.from(list);
  }, [items]);

  // Real-time item count and low stock indicators for each warehouse zone
  const zoneCounts = useMemo(() => {
    const counts: Record<string, { total: number; low: number }> = {};
    
    // Initialize counters for all known locations
    locations.forEach(loc => {
      counts[loc.name] = { total: 0, low: 0 };
    });
    // Fallback for items with locations not in the array (or empty)
    counts["custom"] = { total: 0, low: 0 };

    items.forEach(item => {
      const isLow = item.qty <= item.minQty;
      const locName = item.location || "";
      
      if (counts[locName]) {
        counts[locName].total++;
        if (isLow) counts[locName].low++;
      } else {
        counts["custom"].total++;
        if (isLow) counts["custom"].low++;
      }
    });

    return counts;
  }, [items, locations]);

  // Click on a zone to toggle filtering
  const handleZoneClick = (zoneId: string) => {
    if (selectedZone === zoneId) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zoneId);
      setActiveTab("todos"); // Switch tabs to "todos" to prevent missing matched zone items in a filtered category
    }
  };

  // Filter items in real time based on active tab, search bar query, subcategory picker, and status dropdown
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab matching
      if (activeTab !== "todos" && item.category !== activeTab) {
        return false;
      }
      
      // Selected 2D Zone matching
      if (selectedZone) {
        if (selectedZone === "custom") {
          const isKnown = locations.some(l => l.name === item.location);
          if (isKnown) return false;
        } else {
          if (item.location !== selectedZone) return false;
        }
      }
      
      // Search matching (SKU, Name, Subcategory, Location)
      const keyword = search.toLowerCase();
      const matchSearch = 
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(keyword)) ||
        (item.location && item.location.toLowerCase().includes(keyword));
      
      if (!matchSearch) return false;

      // Subcategory matching
      if (subcatFilter && item.subcategory !== subcatFilter) {
        return false;
      }

      // Status matching
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [items, activeTab, search, subcatFilter, statusFilter, selectedZone]);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async (id: string, name: string) => {
    await onDelete(id, name);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kardex de Bodega y Stock</h1>
          <p className="text-zinc-400 text-sm mt-1">Navega, filtra, edita o registra entradas y salidas físicas de recursos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Professional Excel Export Button */}
          <button
            onClick={() => exportInventoryToXLSX(filteredItems)}
            className="border-2 border-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 py-2.5 px-4 rounded-xl text-sm font-black transition duration-150 cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/5 active:scale-[0.98]"
            title="Exporta la selección filtrada visible a un archivo Excel XLSX profesional con alertas de stock crítico"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Excel Profesional 📊 ({filteredItems.length})</span>
          </button>

          {/* Simple CSV Fallback Export Button */}
          <button
            onClick={() => exportInventoryToCSV(filteredItems)}
            className="border border-zinc-855 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-950/40 hover:bg-[#161B22] py-2.5 px-4 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.98]"
            title="Exporta la selección filtrada visible a un formato de texto plano CSV estándar"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV ({filteredItems.length})</span>
          </button>

          <button
            onClick={() => setShowWarehouseMap(!showWarehouseMap)}
            className={`border transition cursor-pointer flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold ${
              showWarehouseMap 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/35 hover:bg-amber-500/20" 
                : "border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-950/40 hover:bg-[#161B22]"
            }`}
            title="Mostrar u ocultar mapa de distribución interactivo 2D"
          >
            <Map className="h-4 w-4" />
            <span>{showWarehouseMap ? "Ocultar Plano" : "Mapa Bodega 2D"}</span>
          </button>

          <button
            onClick={() => {
              setIsInspectionMode(!isInspectionMode);
              if (!isInspectionMode) {
                // When entering inspection mode, we can auto-hide warehouse map to focus purely on the large item cards
                setShowWarehouseMap(false);
              } else {
                setShowWarehouseMap(true);
              }
            }}
            className={`border transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold shadow-md ${
              isInspectionMode 
                ? "bg-amber-500 text-zinc-950 border-amber-600 hover:bg-amber-400 font-extrabold ring-2 ring-amber-500/30" 
                : "border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 bg-zinc-950/40 hover:bg-[#161B22]"
            }`}
            title="Optimizar visualización para tablets en terreno con sol directo. Bloquea edición."
          >
            <Sun className={`h-4 w-4 ${isInspectionMode ? 'animate-spin text-zinc-950' : 'text-zinc-400'}`} />
            <span>{isInspectionMode ? "Salir Inspección ☀️" : "Inspección Terreno ☀️"}</span>
          </button>

          {isInspectionMode ? (
            <div className="border border-red-500/40 bg-red-950/20 text-red-400 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 cursor-not-allowed select-none select-none">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Lectura Bloqueada</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenItemModal()}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 px-4 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/5 shadow-amber-500/10"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span>Agregar Nuevo Recurso</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Switch Tabs */}
      <div className="border-b border-zinc-800 flex overflow-x-auto scroller-hidden">
        
        <button
          onClick={() => { setActiveTab("todos"); setSubcatFilter(""); setStatusFilter(""); setSelectedZone(null); }}
          className={`py-3.5 px-6 font-semibold text-sm outline-none border-b-2 hover:text-white transition shrink-0 cursor-pointer ${
            activeTab === "todos" 
              ? "border-amber-500 text-amber-500" 
              : "border-transparent text-zinc-400"
          }`}
        >
          🏷️ Todos ({items.length})
        </button>

        <button
          onClick={() => { setActiveTab("materiales"); setSubcatFilter(""); setStatusFilter(""); setSelectedZone(null); }}
          className={`py-3.5 px-6 font-semibold text-sm outline-none border-b-2 hover:text-white transition shrink-0 cursor-pointer ${
            activeTab === "materiales" 
              ? "border-amber-500 text-amber-500" 
              : "border-transparent text-zinc-400"
          }`}
        >
          ⚡ Materiales & Paneles
        </button>

        <button
          onClick={() => { setActiveTab("herramientas"); setSubcatFilter(""); setStatusFilter(""); setSelectedZone(null); }}
          className={`py-3.5 px-6 font-semibold text-sm outline-none border-b-2 hover:text-white transition shrink-0 cursor-pointer ${
            activeTab === "herramientas" 
              ? "border-amber-500 text-amber-500" 
              : "border-transparent text-zinc-400"
          }`}
        >
          🛠️ Herramientas
        </button>

        <button
          onClick={() => { setActiveTab("unidades_moviles"); setSubcatFilter(""); setStatusFilter(""); setSelectedZone(null); }}
          className={`py-3.5 px-6 font-semibold text-sm outline-none border-b-2 hover:text-white transition shrink-0 cursor-pointer ${
            activeTab === "unidades_moviles" 
              ? "border-amber-500 text-amber-500" 
              : "border-transparent text-zinc-400"
          }`}
        >
          🚛 Unidades Móviles
        </button>

      </div>

      {/* Interactive 2D Warehouse floor distribution map */}
      {showWarehouseMap && (
        <div className={`rounded-2xl p-5 border transition-all duration-300 ${
          isHighContrast 
            ? "bg-white border-3 border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
            : "bg-[#0c1015]/90 border border-zinc-800"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-dashed border-zinc-800">
            <div className="flex items-start space-x-2.5">
              <Warehouse className={`h-5 w-5 mt-0.5 shrink-0 ${isHighContrast ? "text-amber-800 font-bold" : "text-amber-500"}`} />
              <div>
                <h3 className={`text-sm font-bold tracking-tight ${isHighContrast ? "text-[#0c1015]" : "text-white"}`}>
                  Plano Arquitectónico de Almacén (Distribución Física 2D)
                </h3>
                <p className={`text-xs mt-0.5 ${isHighContrast ? "text-zinc-700" : "text-zinc-400"}`}>
                  Selecciona cualquier zona física para filtrar su stock en tiempo real
                </p>
              </div>
            </div>
            {selectedZone && (
              <button
                onClick={() => setSelectedZone(null)}
                className="self-start sm:self-center text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-lg transition shadow-md shadow-amber-500/10 cursor-pointer select-none border border-amber-600/20 uppercase"
              >
                Clear Filtro Zona (Mostrar Todos)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => {
              let Icon = <MapPin className="h-20 w-20 text-zinc-500" />;
              let activeClasses = "";
              let hoverClasses = "";
              let badgeActive = "";
              
              if (loc.type === "bodega") {
                Icon = <Layers className="h-20 w-20 text-indigo-500" />;
                activeClasses = isHighContrast ? "bg-indigo-100 border-3 border-indigo-900 shadow-md" : "bg-indigo-500/10 border-2 border-indigo-500 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30";
                hoverClasses = isHighContrast ? "bg-zinc-55 border-2 border-zinc-400 hover:border-indigo-600" : "bg-zinc-950/45 border border-zinc-800/80 hover:bg-[#161B22]/70 hover:border-zinc-750";
                badgeActive = "bg-indigo-500 text-white";
              } else if (loc.type === "estante") {
                Icon = <MapPin className="h-20 w-20 text-emerald-500" />;
                activeClasses = isHighContrast ? "bg-emerald-100 border-3 border-emerald-900 shadow-md" : "bg-emerald-500/10 border-2 border-emerald-500 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30";
                hoverClasses = isHighContrast ? "bg-zinc-55 border-2 border-zinc-400 hover:border-emerald-600" : "bg-zinc-950/45 border border-zinc-800/80 hover:bg-[#161B22]/70 hover:border-zinc-750";
                badgeActive = "bg-emerald-500 text-zinc-950";
              } else if (loc.type === "zona") {
                Icon = <Warehouse className="h-20 w-20 text-cyan-500" />;
                activeClasses = isHighContrast ? "bg-cyan-100 border-3 border-cyan-900 shadow-md" : "bg-cyan-500/10 border-2 border-cyan-500 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30";
                hoverClasses = isHighContrast ? "bg-zinc-55 border-2 border-zinc-400 hover:border-cyan-600" : "bg-zinc-950/45 border border-zinc-800/80 hover:bg-[#161B22]/70 hover:border-zinc-750";
                badgeActive = "bg-cyan-500 text-zinc-950";
              } else if (loc.type === "vehiculo") {
                Icon = <Truck className="h-20 w-20 text-amber-500" />;
                activeClasses = isHighContrast ? "bg-amber-100 border-3 border-amber-900 shadow-md" : "bg-amber-500/10 border-2 border-amber-500 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30";
                hoverClasses = isHighContrast ? "bg-zinc-55 border-2 border-zinc-400 hover:border-amber-600" : "bg-zinc-950/45 border border-zinc-800/80 hover:bg-[#161B22]/70 hover:border-zinc-750";
                badgeActive = "bg-amber-500 text-zinc-950";
              }

              return (
                <button
                  key={loc.id}
                  onClick={() => handleZoneClick(loc.name)}
                  className={`relative h-28 text-left rounded-xl p-3.5 border transition-all flex flex-col justify-between group overflow-hidden cursor-pointer ${
                    selectedZone === loc.name ? activeClasses : hoverClasses
                  }`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                    {Icon}
                  </div>
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded ${
                      selectedZone === loc.name ? badgeActive : (isHighContrast ? "bg-zinc-200 text-zinc-800" : "bg-zinc-800/80 text-zinc-400")
                    }`}>
                      {loc.type}
                    </span>
                    {zoneCounts[loc.name] && zoneCounts[loc.name].low > 0 && (
                      <span className="text-[10px] bg-red-500/15 text-red-500 font-bold px-2 py-0.5 rounded border border-red-500/20 flex items-center space-x-1 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        <span>BAJO ({zoneCounts[loc.name].low})</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold leading-tight ${isHighContrast ? "text-zinc-950" : "text-zinc-100"}`}>
                      {loc.name}
                    </h4>
                    <p className="text-[10px] font-mono mt-0.5 text-zinc-500 line-clamp-1">
                      {loc.description || "Sin descripción"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold border-t border-dashed border-zinc-800/60 pt-2 mt-2">
                    <span className={isHighContrast ? "text-zinc-700" : "text-zinc-400"}>Artículos registrados:</span>
                    <span className={`font-mono ${isHighContrast ? "text-zinc-950" : "text-white"}`}>
                      {zoneCounts[loc.name]?.total || 0}
                    </span>
                  </div>
                </button>
              );
            })}

            {locations.length === 0 && (
              <div className="col-span-full py-8 text-center bg-zinc-950/50 border border-dashed border-zinc-800 rounded-xl">
                <MapPin className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <h3 className="text-zinc-300 font-bold text-sm">No hay bodegas registradas</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Por favor, ve al menú de "Bodegas" en la barra lateral para crear la estructura física de tu almacén.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced filters and search bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por SKU, nombre, subcategoría, estante..."
            className="w-full bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700/80 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 outline-none text-sm font-sans transition-all focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Subcategory select filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Layers className="h-4 w-4" />
          </span>
          <select
            value={subcatFilter}
            onChange={(e) => setSubcatFilter(e.target.value)}
            className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 cursor-pointer outline-none text-sm transition-all focus:ring-1 focus:ring-amber-500"
          >
            <option value="">-- Subcategorías --</option>
            {availableSubcategories.map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Status code selector filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Filter className="h-4 w-4" />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-4 cursor-pointer outline-none text-sm transition-all focus:ring-1 focus:ring-amber-500"
          >
            <option value="">-- Cualquier Estado --</option>
            <option value="disponible">Disponible / En Stock</option>
            <option value="buen estado">Buen estado (Herramientas)</option>
            <option value="en ruta">En ruta (Vehículos)</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="en reparación">En reparación</option>
            <option value="retenido">Retenido</option>
            <option value="extraviado">Extraviado</option>
          </select>
        </div>

      </div>

      {/* Items list / Responsive spreadsheet table / Sunlight Inspection Grid */}
      {isInspectionMode ? (
        <div className="bg-white border-4 border-zinc-950 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-zinc-950">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-zinc-950 pb-4 mb-6">
            <div>
              <span className="text-[11px] uppercase font-mono font-black tracking-widest text-[#0c1015] bg-amber-400 border-2 border-zinc-950 px-3 py-1 rounded-md">⚠️ MODO INSPECCIÓN ACTIVADO</span>
              <h2 className="text-2xl font-black mt-2 text-[#0c1015] tracking-tight">Kardex de Terreno / Alto Contraste</h2>
              <p className="text-sm text-zinc-700 font-medium mt-1">Tipografía extra grande y colores refractivos optimizados para lectura bajo luz solar directa en tablets.</p>
            </div>
            <div className="mt-4 sm:mt-0 bg-red-100 text-red-800 border-2 border-zinc-950 py-1.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-1.5 select-none">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>🔒 EDICIÓN BLOQUEADA</span>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isLow = item.qty <= item.minQty;
                
                // Color configuration optimized for outdoor glare
                const getStatusStyleOutdoors = () => {
                  const s = item.status?.toLowerCase() || "";
                  if (s === "disponible" || s === "buen estado") {
                    return "bg-emerald-100 text-emerald-950 border-emerald-900";
                  } else if (s === "en ruta" || s === "retenido") {
                    return "bg-cyan-100 text-cyan-950 border-cyan-800";
                  } else if (s === "mantenimiento" || s === "en reparación") {
                    return "bg-amber-100 text-amber-950 border-amber-900";
                  } else {
                    return "bg-red-100 text-red-950 border-red-900";
                  }
                };

                return (
                  <div 
                    key={item.id} 
                    className="border-4 border-zinc-950 p-6 rounded-2xl flex flex-col justify-between space-y-4 bg-white text-zinc-950 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {/* SKU and Category Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 shrink-0 font-extrabold">
                          {item.category === "materiales" ? <Sun className="h-5 w-5 text-amber-600" /> : item.category === "herramientas" ? <Wrench className="h-5 w-5 text-indigo-700" /> : <Truck className="h-5 w-5 text-emerald-700" />}
                        </span>
                        <span className="text-xs font-black font-mono tracking-wide uppercase px-2 py-0.5 bg-zinc-100 text-zinc-900 border-2 border-zinc-950 rounded">
                          {item.sku}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setQrItem(item)}
                        title="Ampliar código QR para scanner de tablet"
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-3 py-1.5 rounded-lg border-2 border-zinc-955 transition flex items-center space-x-1.5 font-bold text-xs cursor-pointer"
                      >
                        <QrCode className="h-4 w-4 text-zinc-955" />
                        <span>Ver QR</span>
                      </button>
                    </div>

                    {/* Name and description in large font */}
                    <div>
                      <h3 
                        onClick={() => onOpenItemDetails(item)}
                        className="text-xl font-black text-black leading-tight tracking-tight select-all cursor-pointer hover:text-amber-600 transition flex items-center justify-between"
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] bg-zinc-200 text-zinc-850 py-1 px-2 border-2 border-zinc-950 font-mono font-black uppercase rounded shrink-0">Ficha 🔍</span>
                      </h3>
                      <p className="text-xs text-zinc-700 font-bold mt-1 uppercase tracking-wider font-mono">
                        {item.subcategory || "General"}
                      </p>
                      <p className="text-sm text-zinc-800 font-semibold mt-2.5 border-l-4 border-zinc-950 pl-2.5">
                        {item.description || "Sin descripción física registrada"}
                      </p>
                    </div>

                    {/* Quantity / Stock in MASSIVE typography with large targets */}
                    <div className="bg-zinc-50 border-3 border-zinc-950 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-black text-zinc-700 uppercase tracking-widest leading-none">
                        STOCK DISPONIBLE
                      </span>
                      <div className="text-right">
                        <span className={`text-6xl font-black font-mono tracking-tight ${isLow ? "text-red-600 animate-pulse" : "text-emerald-700"}`} style={{ display: 'block' }}>
                          {item.qty}
                        </span>
                        <span className="text-xs font-black text-zinc-800 tracking-wider uppercase font-mono mt-0.5 block">{item.unit || "unidades"}</span>
                      </div>
                    </div>

                    {/* Physical Location in physical style shelf-rack layout */}
                    <div className="bg-amber-50 border-2 border-zinc-950 p-3 rounded-xl flex items-center space-x-2 text-amber-955">
                      <MapPin className="h-5 w-5 text-zinc-950 shrink-0 font-bold" />
                      <div>
                        <span className="text-[10px] uppercase font-black text-zinc-700 block leading-none">ESTANTERÍA / COORDENADA</span>
                        <span className="text-sm font-black font-mono uppercase tracking-wider block mt-1">{item.location || "PASILLO GENERAL"}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className={`flex-1 border-2 text-center font-black p-2 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 ${getStatusStyleOutdoors()}`}>
                          <span>ESTADO: {item.status || "vigente"}</span>
                        </div>
                        {isLow && (
                          <div className="bg-red-600 text-white border-2 border-black text-center font-black p-2 rounded-xl text-xs tracking-widest uppercase flex items-center justify-center space-x-1.5 animate-pulse">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>MÍN ({item.minQty})</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center select-none bg-zinc-50 rounded-2xl border-2 border-zinc-950">
              <HeartCrack className="h-12 w-12 text-zinc-800 mx-auto mb-3 font-bold" />
              <h3 className="text-black text-lg font-black">No se encontraron ítems en inspección</h3>
              <p className="text-zinc-800 text-sm mt-1 max-w-sm mx-auto font-medium">Prueba limpiando tu texto de búsqueda u otros filtros de sector.</p>
              <div className="mt-4 flex justify-center">
                <button 
                  onClick={() => { setSearch(""); setSubcatFilter(""); setStatusFilter(""); }}
                  className="text-xs font-black bg-zinc-950 text-white py-2.5 px-4 border-2 border-zinc-950 hover:bg-zinc-800 rounded-lg transition uppercase"
                >
                  Limpiar Filtros de Búsqueda
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider font-mono">
                    <th className="py-4 px-6">Identificador / SKU</th>
                    <th className="py-4 px-6">Detalle del Recurso</th>
                    <th className="py-4 px-6 text-center">Stock / Cantidad</th>
                    <th className="py-4 px-6">Pasillo-Estante</th>
                    <th className="py-4 px-6">Condición / Estado</th>
                    <th className="py-4 px-6 text-right">Acciones de Operación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300 text-sm font-sans">
                  {filteredItems.map((item) => {
                    const isLow = item.qty <= item.minQty;
                    
                    // Color codes for status badge
                    const statusColors = () => {
                      const s = item.status?.toLowerCase() || "";
                      if (s === "disponible" || s === "buen estado") {
                        return "bg-emerald-950/20 text-emerald-400 border-emerald-900/50";
                      } else if (s === "en ruta" || s === "retenido") {
                        return "bg-cyan-950/20 text-cyan-400 border-cyan-800/40";
                      } else if (s === "mantenimiento" || s === "en reparación") {
                        return "bg-amber-950/20 text-amber-500 border-amber-900/50";
                      } else {
                        return "bg-red-950/20 text-red-400 border-red-900/50";
                      }
                    };

                    return (
                      <tr key={item.id} className="hover:bg-zinc-900/60 transition group selection:bg-amber-500 selection:text-zinc-950">
                        
                        {/* SKU / Class ID */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-zinc-500 shrink-0">
                              {item.category === "materiales" ? <Sun className="h-4 w-4 text-amber-500/70" /> : item.category === "herramientas" ? <Wrench className="h-4 w-4 text-indigo-400/80" /> : <Truck className="h-4 w-4 text-emerald-400/80" />}
                            </span>
                            <span className="font-mono text-xs font-bold text-white tracking-wide">{item.sku}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block ml-6 font-mono font-medium truncate uppercase">{item.subcategory}</span>
                        </td>

                        {/* Detail / Description */}
                        <td className="py-4 px-6 max-w-sm">
                          <h4 
                            onClick={() => onOpenItemDetails(item)}
                            className="font-semibold text-zinc-100 truncate group-hover:text-amber-500 hover:text-amber-400 transition cursor-pointer flex items-center space-x-2"
                          >
                            <span>{item.name}</span>
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 py-0.5 px-1.5 rounded font-mono font-bold uppercase transition hover:bg-zinc-750">🔍 Ver Ficha</span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description || "Sin descripción guardada"}</p>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-mono font-extrabold text-base ${isLow ? "text-red-500" : "text-zinc-100"}`}>
                              {item.qty}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono italic">{item.unit || "unidades"}</span>
                          </div>
                        </td>

                        {/* Physical Location */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[130px] font-mono text-zinc-400">{item.location}</span>
                          </div>
                        </td>

                        {/* Status / Alarm */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col space-y-1 items-start">
                            <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-md border ${statusColors()}`}>
                              {item.status || "vigente"}
                            </span>
                            {isLow && (
                              <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-900/60 font-bold uppercase tracking-wider py-0.5 px-1.5 rounded flex items-center space-x-0.5">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                <span>STOCK BAJO</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Movement / Operations */}
                        <td className="py-4 px-6 text-right">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center justify-end space-x-1 animate-fade-in">
                              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide mr-1">¿Borrar?</span>
                              <button
                                onClick={() => confirmDelete(item.id, item.name)}
                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-2.5 rounded text-xs font-bold transition cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 py-1 px-2 rounded text-xs transition cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              {/* Transact trigger */}
                              <button
                                onClick={() => onOpenTransactionModal(item)}
                                title="Registrar entrada/salida de stock"
                                className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-zinc-950 p-2 rounded-xl transition cursor-pointer border border-amber-500/20"
                              >
                                <ArrowLeftRight className="h-4 w-4" />
                              </button>

                              {/* QR code trigger */}
                               <button
                                 onClick={() => setQrItem(item)}
                                 title="Ver/Imprimir Código QR de bodega"
                                 className="bg-zinc-850 hover:bg-zinc-800 hover:text-amber-500 p-2 text-zinc-400 rounded-xl transition cursor-pointer border border-zinc-750/30"
                               >
                                 <QrCode className="h-4 w-4" />
                               </button>

                               {/* Edit trigger */}
                              <button
                                onClick={() => onOpenItemModal(item)}
                                title="Editar especificaciones de recurso"
                                className="bg-zinc-800 hover:bg-zinc-700 hover:text-white p-2 text-zinc-400 rounded-xl transition cursor-pointer border border-zinc-700/40"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Delete trigger */}
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                title="Eliminar registro"
                                className="bg-zinc-800 hover:bg-red-950 hover:text-red-400 p-2 text-zinc-500 rounded-xl transition cursor-pointer border border-zinc-700/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center select-none">
              <HeartCrack className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-white text-base font-bold">No se encontraron recursos</h3>
              <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">No hay registros de bodega que coincidan con los filtros o coincidencias de búsqueda seleccionados.</p>
              <div className="mt-4 flex justify-center space-x-2">
                <button 
                  onClick={() => { setSearch(""); setSubcatFilter(""); setStatusFilter(""); }}
                  className="text-xs font-semibold bg-zinc-800 text-zinc-300 py-2 px-3 border border-zinc-700 hover:bg-zinc-700 hover:text-white rounded-lg transition"
                >
                  Limpiar Filtros
                </button>
                <button 
                  onClick={() => onOpenItemModal()}
                  className="text-xs font-semibold bg-amber-500 text-black py-2 px-3 rounded-lg transition"
                >
                  Crear Nuevo Producto
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item QR Code Modal overlay viewer */}
      <ItemQrCodeModal 
        item={qrItem} 
        isOpen={!!qrItem} 
        onClose={() => setQrItem(null)} 
      />

    </div>
  );
}
