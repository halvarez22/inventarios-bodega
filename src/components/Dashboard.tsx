import React, { useMemo, useState, useEffect } from "react";
import { InventoryItem, Transaction } from "../types";
import { 
  Sun, 
  Wrench, 
  Truck, 
  AlertTriangle, 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sliders, 
  Box, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

interface DashboardProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onNavigateToTab: (tab: string) => void;
  onOpenItemModal: () => void;
  onOpenTransactionModal: (item: InventoryItem) => void;
}

export default function Dashboard({ 
  items, 
  transactions, 
  onNavigateToTab, 
  onOpenItemModal, 
  onOpenTransactionModal 
}: DashboardProps) {
  
  const [isHighContrast, setIsHighContrast] = useState(() => {
    return localStorage.getItem("dashboard_contrast_terrain") === "true";
  });

  useEffect(() => {
    localStorage.setItem("dashboard_contrast_terrain", isHighContrast ? "true" : "false");
  }, [isHighContrast]);

  // Contrast mappings for maximum outdoor/under intense sunlight readability:
  const rootBg = isHighContrast 
    ? "bg-slate-100/95 text-zinc-950 p-6 md:p-8 rounded-3xl border-4 border-zinc-950 space-y-6 shadow-2xl transition-all duration-300" 
    : "space-y-6 transition-all duration-300";
    
  const titleText = isHighContrast ? "text-zinc-950 font-black tracking-tight" : "text-white";
  const descText = isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-400";
  
  const cardBg = isHighContrast 
    ? "bg-white border-3 border-zinc-950 rounded-2xl p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-950" 
    : "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between";
    
  const chartCardBg = isHighContrast
    ? "bg-white border-3 border-zinc-950 rounded-2xl p-5 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-950"
    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 transition";

  const chartCardColSpan2 = isHighContrast
    ? "bg-white border-3 border-zinc-950 rounded-2xl p-5 lg:col-span-2 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-950"
    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 lg:col-span-2 transition";

  const textWhiteClass = isHighContrast ? "text-zinc-950 font-black" : "text-white";
  const textZincClass = isHighContrast ? "text-zinc-950 font-extrabold" : "text-zinc-400";
  const textZincLightClass = isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500";
  
  const iconBgClass = isHighContrast 
    ? "bg-zinc-200 p-2.5 rounded-xl border-2 border-zinc-950" 
    : "bg-zinc-800 p-2.5 rounded-xl border border-zinc-700/50";
    
  const iconSolarBgClass = isHighContrast
    ? "bg-amber-100 p-2.5 rounded-xl border-2 border-amber-950 text-amber-900"
    : "bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20";
    
  const iconToolsBgClass = isHighContrast
    ? "bg-indigo-100 p-2.5 rounded-xl border-2 border-indigo-950 text-indigo-900"
    : "bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20";
    
  const iconVehiclesBgClass = isHighContrast
    ? "bg-emerald-100 p-2.5 rounded-xl border-2 border-emerald-950 text-emerald-900"
    : "bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20";

  const iconLowStockBgClass = (hasLowStock: boolean) => {
    if (hasLowStock) {
      return isHighContrast 
        ? "bg-red-200 p-2.5 rounded-xl border-2 border-red-950 text-red-950 font-bold" 
        : "bg-red-500/10 p-2.5 rounded-xl border border-red-500/20";
    } else {
      return isHighContrast
        ? "bg-emerald-100 p-2.5 rounded-xl border-2 border-emerald-950 text-emerald-950 font-bold"
        : "bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20";
    }
  };

  const badgeTheme = isHighContrast 
    ? "bg-zinc-250 border-2 border-zinc-950 text-zinc-950 font-bold flex items-center space-x-1 p-1 rounded-lg" 
    : "flex items-center space-x-3 text-[10px] font-mono bg-zinc-950 p-1.5 border border-zinc-850 rounded-xl leading-none";

  const chartColors = {
    bar: isHighContrast ? "#b45309" : "#f59e0b", // Rich dark amber/ochre for stark sunlight visibility
    pie: [
      { name: "Materiales y BESS", color: isHighContrast ? "#7c2d12" : "#f59e0b" }, // Heavy Brick-Amber
      { name: "Herramientas", color: isHighContrast ? "#1e3a8a" : "#6366f1" },     // Deep Navy-Indigo
      { name: "Flota / Móviles", color: isHighContrast ? "#064e3b" : "#10b981" }   // Heavy Dark Emerald
    ],
    lineEntradas: isHighContrast ? "#047857" : "#10b981",
    lineSalidas: isHighContrast ? "#be123c" : "#ef4444",
    grid: isHighContrast ? "#94a3b8" : "#30363D",
    axis: isHighContrast ? "#0f172a" : "#8b949e",
    tooltipBg: isHighContrast ? "#ffffff" : "#161B22",
    tooltipBorder: isHighContrast ? "#000000" : "#30363D",
    tooltipText: isHighContrast ? "#000000" : "#ffffff",
  };

  // 1. High level statistics
  const stats = useMemo(() => {
    let materialsCount = 0;
    let toolsCount = 0;
    let vehiclesCount = 0;
    let lowStockCount = 0;

    items.forEach(item => {
      if (item.category === "materiales") {
        materialsCount++;
      } else if (item.category === "herramientas") {
        toolsCount++;
      } else if (item.category === "unidades_moviles") {
        vehiclesCount++;
      }

      // Alarm condition
      if (item.qty <= item.minQty) {
        lowStockCount++;
      }
    });

    return {
      totalItems: items.length,
      materialsCount,
      toolsCount,
      vehiclesCount,
      lowStockCount
    };
  }, [items]);

  // 2. Filter out top 4 critical low stock items
  const criticalItems = useMemo(() => {
    return items
      .filter(item => item.qty <= item.minQty)
      .sort((a, b) => {
        const ratioA = a.qty / (a.minQty || 1);
        const ratioB = b.qty / (b.minQty || 1);
        return ratioA - ratioB; // lower ratio first (most critical first)
      })
      .slice(0, 4);
  }, [items]);

  // 3. Setup bar chart data (Stock by Subcategory - e.g. paneles, baterías, etc.)
  const subcategoryChartData = useMemo(() => {
    const subcats: { [key: string]: number } = {};
    items.forEach(item => {
      const name = item.subcategory || "Otros";
      subcats[name] = (subcats[name] || 0) + (Number(item.qty) || 0);
    });

    return Object.keys(subcats).map(name => ({
      name: name.length > 18 ? name.substring(0, 15) + "..." : name,
      stock: subcats[name]
    })).sort((a, b) => b.stock - a.stock);
  }, [items]);

  // 4. Setup pie chart data (Stock Volume by Category)
  const categoryStockPieData = useMemo(() => {
    let materialsStock = 0;
    let toolsStock = 0;
    let vehiclesStock = 0;

    items.forEach(item => {
      const q = Number(item.qty) || 0;
      if (item.category === "materiales") {
        materialsStock += q;
      } else if (item.category === "herramientas") {
        toolsStock += q;
      } else if (item.category === "unidades_moviles") {
        vehiclesStock += q;
      }
    });

    const totalStock = materialsStock + toolsStock + vehiclesStock;

    return {
      totalStock,
      pieData: [
        { name: "Materiales y BESS", value: materialsStock, color: "#f59e0b" }, // Amber
        { name: "Herramientas", value: toolsStock, color: "#6366f1" }, // Indigo
        { name: "Flota / Móviles", value: vehiclesStock, color: "#10b981" } // Emerald
      ].filter(cat => cat.value > 0)
    };
  }, [items]);

  // 4.5. Setup monthly transaction line chart data
  const monthlyTransactionData = useMemo(() => {
    const monthsMap: { [key: string]: { monthName: string; monthKey: string; entradas: number; salidas: number; movimientos: number } } = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Initialize last 6 months with 0 parameters to provide consistent trend line graphics
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mName = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).substring(2)}`;
      monthsMap[mKey] = {
        monthName: mName,
        monthKey: mKey,
        entradas: 0,
        salidas: 0,
        movimientos: 0
      };
    }

    transactions.forEach(tx => {
      if (!tx.date) return;
      const d = new Date(tx.date);
      if (isNaN(d.getTime())) return;
      
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mName = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).substring(2)}`;

      if (!monthsMap[mKey]) {
        // Just in case there are historic actions beyond the initial window
        monthsMap[mKey] = {
          monthName: mName,
          monthKey: mKey,
          entradas: 0,
          salidas: 0,
          movimientos: 0
        };
      }

      const count = Number(tx.qty) || 0;
      if (tx.type === "entrada") {
        monthsMap[mKey].entradas += count;
      } else if (tx.type === "salida") {
        monthsMap[mKey].salidas += count;
      }
      monthsMap[mKey].movimientos += 1;
    });

    return Object.values(monthsMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6); // Limit chart visualization to last 6 months
  }, [transactions]);

  // 5. Setup Inventory Health Chart Data (percentage of items in optimal levels vs low stock)
  const inventoryHealthData = useMemo(() => {
    let optimalCount = 0;
    let lowCount = 0;

    items.forEach(item => {
      if (item.qty <= item.minQty) {
        lowCount++;
      } else {
        optimalCount++;
      }
    });

    const total = items.length || 1;
    const optimalPct = Math.round((optimalCount / total) * 100);
    const lowPct = 100 - optimalPct;

    // High contrast color support
    const colorOptimal = isHighContrast ? "#15803d" : "#10b981"; // Heavy Green vs emerald-500
    const colorLow = isHighContrast ? "#b91c1c" : "#ef4444";     // Heavy Red vs red-500

    return {
      total,
      optimalCount,
      lowCount,
      optimalPct,
      lowPct,
      pieData: [
        { name: "Optimal Stock", value: optimalCount, color: colorOptimal, pct: optimalPct },
        { name: "Low Stock", value: lowCount, color: colorLow, pct: lowPct }
      ]
    };
  }, [items, isHighContrast]);

  // Take the 5 most recent transactions
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className={rootBg}>
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 pb-4 border-b border-zinc-800/10">
        <div>
          <h1 className={`text-2xl font-bold font-sans tracking-tight ${titleText}`}>Vista General del Inventario</h1>
          <p className={`${descText} text-sm mt-1`}>Control del Centro de Distribución y Bodega de Sistemas Solares</p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
          {/* Sunlight Mode Toggle button */}
          <button
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm transition cursor-pointer font-bold ${
              isHighContrast 
                ? "bg-zinc-950 text-white hover:bg-zinc-800 border-2 border-zinc-950 shadow-md" 
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
            }`}
            title="Ajustar contraste para lectura bajo luz solar directa o en terreno"
          >
            <Sun className={`h-4 w-4 ${isHighContrast ? "fill-amber-400 text-amber-400" : "animate-spin-slow"} shrink-0`} />
            <span>{isHighContrast ? "Modo Interiores (Estándar)" : "Modo Terreno ☀️ (Luz Solar)"}</span>
          </button>

          <button
            onClick={() => onNavigateToTab("ai")}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm transition font-medium cursor-pointer ${
              isHighContrast
                ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border-2 border-indigo-950"
                : "bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/30"
            }`}
          >
            <Sparkles className={`h-4 w-4 text-indigo-500 shrink-0 ${isHighContrast ? "" : "animate-bounce"}`} />
            <span>Consultar con Hércules IA</span>
          </button>
          
          <button
            onClick={onOpenItemModal}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg ${
              isHighContrast
                ? "bg-zinc-950 hover:bg-zinc-800 text-white border-2 border-zinc-950"
                : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/10"
            }`}
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Agregar Registro</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card: Total items */}
        <div className={cardBg}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${textZincClass}`}>Recursos Totales</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${textWhiteClass}`}>{stats.totalItems}</span>
          </div>
          <div className={iconBgClass}>
            <Box className={`h-5 w-5 ${isHighContrast ? "text-zinc-950 font-bold" : "text-zinc-400"}`} />
          </div>
        </div>

        {/* Card: Solar Materials */}
        <div className={cardBg}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${textZincClass}`}>Materiales/Stock</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${isHighContrast ? "text-amber-950" : "text-amber-500"}`}>{stats.materialsCount}</span>
          </div>
          <div className={iconSolarBgClass}>
            <Sun className={`h-5 w-5 ${isHighContrast ? "text-amber-900" : "text-amber-500"}`} />
          </div>
        </div>

        {/* Card: Tools */}
        <div className={cardBg}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${textZincClass}`}>Herramientas</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${isHighContrast ? "text-indigo-950" : "text-indigo-500"}`}>{stats.toolsCount}</span>
          </div>
          <div className={iconToolsBgClass}>
            <Wrench className={`h-5 w-5 ${isHighContrast ? "text-indigo-900" : "text-indigo-400"}`} />
          </div>
        </div>

        {/* Card: Vehicles */}
        <div className={cardBg}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${textZincClass}`}>Unidades Móviles</span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${isHighContrast ? "text-emerald-950" : "text-emerald-550"}`}>{stats.vehiclesCount}</span>
          </div>
          <div className={iconVehiclesBgClass}>
            <Truck className={`h-5 w-5 ${isHighContrast ? "text-emerald-900" : "text-emerald-400"}`} />
          </div>
        </div>

        {/* Card: Low stock trigger */}
        <div className={`${cardBg} col-span-2 lg:col-span-1 ${isHighContrast ? "border-l-5 border-l-red-600" : "border-l-red-500/40"}`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${textZincClass}`}>Alertas Stock Bajo</span>
            <span className={`text-2xl font-extrabold mt-1 font-mono block ${
              stats.lowStockCount > 0 
                ? (isHighContrast ? "text-red-700 font-black" : "text-red-500") 
                : (isHighContrast ? "text-emerald-700 font-extrabold" : "text-emerald-500")
            }`}>
              {stats.lowStockCount}
            </span>
          </div>
          <div className={iconLowStockBgClass(stats.lowStockCount > 0)}>
            <AlertTriangle className={`h-5 w-5 ${
              stats.lowStockCount > 0 
                ? (isHighContrast ? "text-red-800" : "text-red-400") 
                : (isHighContrast ? "text-emerald-800" : "text-emerald-400")
            }`} />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Chart 1: Stock levels bar chart grouped by subcategory */}
        <div className={`${chartCardColSpan2} md:col-span-2 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-4 w-4 ${isHighContrast ? "text-amber-700 font-bold" : "text-amber-500"}`} />
              <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans leading-none ${textWhiteClass}`}>
                Distribución de Stock por Subcategoría
              </h3>
            </div>
            <span className={`text-[10px] py-1 px-2.5 rounded-md font-mono font-bold ${
              isHighContrast ? "bg-zinc-200 text-zinc-900 border border-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}>
              Unidades Físicas (Top)
            </span>
          </div>
          <div className="h-64">
            {subcategoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subcategoryChartData.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={isHighContrast ? 0.7 : 0.4} />
                  <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tickLine={false} tick={{ fontWeight: isHighContrast ? "800" : "500", fill: chartColors.axis }} />
                  <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} tick={{ fontWeight: isHighContrast ? "800" : "500", fill: chartColors.axis }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: "12px", color: chartColors.tooltipText, border: isHighContrast ? "3px solid #000" : "1px solid #30363D" }}
                    itemStyle={{ color: chartColors.bar, fontWeight: "bold" }}
                  />
                  <Bar dataKey="stock" fill={chartColors.bar} name="Stock en Bodega" radius={[4, 4, 0, 0]} barSize={28} stroke={isHighContrast ? "#000000" : "none"} strokeWidth={1.5} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>No hay datos de stock registrados.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Category Pie Chart of physical stock values */}
        <div className={chartCardBg}>
          <div className="flex items-center space-x-2 mb-4">
            <Box className={`h-4 w-4 ${isHighContrast ? "text-indigo-800 font-bold" : "text-indigo-500"}`} />
            <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans leading-none ${textWhiteClass}`}>
              Distribución por Categoría
            </h3>
          </div>
          <div className="h-64 flex flex-col justify-between">
            {categoryStockPieData.pieData.length > 0 ? (
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStockPieData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryStockPieData.pieData.map((entry, index) => {
                        const customCol = chartColors.pie[index]?.color || entry.color;
                        return <Cell key={`cell-${index}`} fill={customCol} stroke={isHighContrast ? "#000000" : "none"} strokeWidth={1.5} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: "12px", color: chartColors.tooltipText, border: isHighContrast ? "3px solid #000" : "1px solid #30363D" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text absolute showing physical stock quantities */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className={`text-xl font-extrabold font-mono ${isHighContrast ? "text-zinc-950 font-black text-2xl" : "text-white"}`}>{categoryStockPieData.totalStock}</span>
                  <span className={`text-[9px] block uppercase font-bold tracking-widest leading-none mt-1 ${isHighContrast ? "text-zinc-900" : "text-zinc-500"}`}>unidades</span>
                </div>
              </div>
            ) : (
              <div className={`h-44 flex items-center justify-center text-xs ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>Sin registros de recursos.</div>
            )}
            
            {/* Legend indicators */}
            <div className={`grid grid-cols-3 gap-1 text-[10px] mt-1 pt-2 border-t ${isHighContrast ? "border-zinc-300" : "border-zinc-800/60"}`}>
              {categoryStockPieData.pieData.map((cat, idx) => {
                const customCol = chartColors.pie[idx]?.color || cat.color;
                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="flex items-center space-x-1">
                      <span className="h-2 w-2 rounded-full border border-black/10" style={{ backgroundColor: customCol }}></span>
                      <span className={`font-semibold truncate max-w-[55px] ${isHighContrast ? "text-zinc-900" : "text-zinc-400"}`} title={cat.name}>{cat.name}</span>
                    </div>
                    <span className={`font-mono font-bold mt-0.5 ${isHighContrast ? "text-zinc-950" : "text-white"}`}>{cat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 3: Inventory Health (Salud de Inventario) Donut Chart */}
        <div className={chartCardBg}>
          <div className="flex items-center space-x-2 mb-4">
            <Activity className={`h-4 w-4 ${isHighContrast ? "text-emerald-800 font-bold" : "text-emerald-500"}`} />
            <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans leading-none ${textWhiteClass}`}>
              Salud del Inventario
            </h3>
          </div>
          <div className="h-64 flex flex-col justify-between">
            {items.length > 0 ? (
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryHealthData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {inventoryHealthData.pieData.map((entry, index) => (
                        <Cell key={`cell-health-${index}`} fill={entry.color} stroke={isHighContrast ? "#000000" : "none"} strokeWidth={1.5} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: "12px", color: chartColors.tooltipText, border: isHighContrast ? "3px solid #000" : "1px solid #30363D" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text absolute showing optimal stock percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                  <span className={`text-xl font-extrabold font-mono ${isHighContrast ? "text-emerald-850 font-black text-2xl" : "text-emerald-500"}`}>
                    {inventoryHealthData.optimalPct}%
                  </span>
                  <span className={`text-[9px] block uppercase font-bold tracking-widest leading-none mt-1 ${isHighContrast ? "text-zinc-900 font-black" : "text-zinc-500"}`}>
                    Óptimo
                  </span>
                </div>
              </div>
            ) : (
              <div className={`h-44 flex items-center justify-center text-xs ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>Sin registros de recursos.</div>
            )}
            
            {/* Legend indicators */}
            <div className={`grid grid-cols-2 gap-1 text-[10px] mt-1 pt-2 border-t ${isHighContrast ? "border-zinc-300" : "border-zinc-800/60"}`}>
              {inventoryHealthData.pieData.map((cat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="flex items-center space-x-1 justify-center">
                    <span className="h-2 w-2 rounded-full border border-black/10" style={{ backgroundColor: cat.color }}></span>
                    <span className={`font-semibold truncate max-w-[80px] ${isHighContrast ? "text-zinc-900" : "text-zinc-400"}`} title={cat.name}>
                      {cat.name === "Optimal Stock" ? "Suficiente" : "Bajo Mínimo"}
                    </span>
                  </div>
                  <span className={`font-mono font-bold mt-0.5 ${isHighContrast ? "text-zinc-950" : "text-white"}`}>
                    {cat.value} ({cat.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 1.5: Full width Line chart for monthly transactions stream */}
      <div className={chartCardBg}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`h-4 w-4 ${isHighContrast ? "text-emerald-850 font-black animate-pulse" : "text-emerald-500"}`} />
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans leading-none ${textWhiteClass}`}>
                Flujo Mensual de Bodega e Historial de Transacciones
              </h3>
              <span className={`text-[10px] mt-1 block ${isHighContrast ? "text-zinc-900 font-semibold" : "text-zinc-400"}`}>Tendencia histórica de entradas y despachos de stock en los últimos 6 meses</span>
            </div>
          </div>
          <div className={badgeTheme}>
            <div className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 border border-black/10" />
              <span className={isHighContrast ? "text-zinc-900 pr-2" : "text-zinc-500"}>Entradas</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 border border-black/10" />
              <span className={isHighContrast ? "text-zinc-900" : "text-zinc-500"}>Salidas</span>
            </div>
          </div>
        </div>

        <div className="h-64">
          {transactions.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTransactionData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={isHighContrast ? 0.7 : 0.35} />
                <XAxis dataKey="monthName" stroke={chartColors.axis} fontSize={11} tickLine={false} tick={{ fontWeight: isHighContrast ? "800" : "500", fill: chartColors.axis }} />
                <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} tick={{ fontWeight: isHighContrast ? "800" : "500", fill: chartColors.axis }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartColors.tooltipBg, borderColor: chartColors.tooltipBorder, borderRadius: "12px", color: chartColors.tooltipText, border: isHighContrast ? "3px solid #000" : "1px solid #30363D" }}
                />
                <Legend verticalAlign="top" height={10} iconType="circle" wrapperStyle={{ display: 'none' }} />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke={chartColors.lineEntradas} 
                  name="Recursos Ingresados / Entradas"
                  strokeWidth={isHighContrast ? 4.5 : 2.5}
                  dot={{ r: isHighContrast ? 6 : 4, stroke: chartColors.lineEntradas, strokeWidth: 2, fill: isHighContrast ? '#ffffff' : '#161b22' }} 
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="salidas" 
                  stroke={chartColors.lineSalidas} 
                  name="Recursos Despachados / Salidas"
                  strokeWidth={isHighContrast ? 4.5 : 2.5}
                  dot={{ r: isHighContrast ? 6 : 4, stroke: chartColors.lineSalidas, strokeWidth: 2, fill: isHighContrast ? '#ffffff' : '#161b22' }} 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center text-sm ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>
              No hay movimientos de stock suficientes para proyectar el historial de transacciones.
            </div>
          )}
        </div>
      </div>

      {/* Critical Warnings & Recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Critical Stocks Warning board */}
        <div className={`${chartCardColSpan2} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center space-x-2 ${isHighContrast ? "text-red-800 font-black" : "text-red-500"}`}>
                <AlertTriangle className="h-4 w-4 animate-bounce shrink-0" />
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${textWhiteClass}`}>Alertas: Stock Crítico de Materiales</h3>
              </div>
              <button 
                onClick={() => onNavigateToTab("stock")}
                className={`text-xs flex items-center space-x-1 font-bold ${
                  isHighContrast ? "text-indigo-950 hover:underline" : "text-amber-500 hover:text-amber-400 hover:underline"
                }`}
              >
                <span>Ver todo el inventario</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
              </button>
            </div>

            {criticalItems.length > 0 ? (
              <div className="space-y-3">
                {criticalItems.map((item) => {
                  const percent = Math.min(100, Math.round((item.qty / (item.minQty || 1)) * 100));
                  return (
                    <div key={item.id} className={`select-none flex items-center justify-between ${
                      isHighContrast ? "bg-zinc-50 p-4 rounded-xl border-3 border-zinc-950 shadow-sm text-zinc-950" : "bg-zinc-950 p-4 rounded-xl border border-zinc-800"
                    }`}>
                      <div className="space-y-1 max-w-[70%]">
                        <div className="flex items-center space-x-1">
                          <span className={`font-mono text-[10px] py-0.5 px-2 rounded-md font-bold uppercase tracking-wide shrink-0 ${
                            isHighContrast ? "bg-red-200 text-red-950 border-2 border-red-950" : "bg-red-950/40 text-red-400 border border-red-900"
                          }`}>
                            CRÍTICO
                          </span>
                          <span className={`text-xs font-mono ${isHighContrast ? "text-zinc-800 font-bold" : "text-zinc-500"}`}>[{item.sku}]</span>
                        </div>
                        <h4 className={`text-xs font-semibold truncate ${isHighContrast ? "text-zinc-900 font-black" : "text-zinc-100"}`}>{item.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {/* Progress Alert Bar */}
                          <div className={`w-24 h-1.5 rounded-full overflow-hidden ${isHighContrast ? "bg-zinc-300 border border-zinc-500" : "bg-zinc-800"}`}>
                            <div 
                              className={`h-full ${isHighContrast ? "bg-red-700" : "bg-red-500"}`} 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <span className={`text-[10px] ${isHighContrast ? "text-zinc-800 font-bold" : "text-zinc-400"}`}>
                            Disponibles: <strong className={`${isHighContrast ? "text-red-800 font-black" : "text-red-400"} font-mono font-bold`}>{item.qty} {item.unit}</strong> de {item.minQty} ideales
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => onOpenTransactionModal(item)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                          isHighContrast 
                            ? "bg-zinc-900 hover:bg-zinc-800 text-white border-2 border-zinc-950" 
                            : "bg-amber-500/10 hover:bg-amber-500 hover:text-zinc-950 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        Abastecer
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`py-12 text-center text-sm border-2 border-dashed rounded-xl ${
                isHighContrast ? "border-zinc-400 text-zinc-900 bg-white font-bold" : "border-zinc-800 text-zinc-500"
              }`}>
                ✔ No hay alertas de stock bajo. Todos los productos superan los niveles óptimos.
              </div>
            )}
          </div>
          
          <div className={`mt-4 p-3 rounded-xl text-[11px] flex items-center space-x-2 ${
            isHighContrast 
              ? "bg-indigo-100 border-2 border-indigo-950 text-indigo-950 font-bold" 
              : "bg-indigo-950/20 border border-indigo-900/40 text-indigo-300"
          }`}>
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <span><strong>Tip Logístico:</strong> Si tienes proyectos agendados, utiliza el asistente de IA para calcular si el stock actual cubre los paneles solares requeridos para las próximas obras.</span>
          </div>

        </div>

        {/* Right: Recent transaction log */}
        <div className={`${chartCardBg} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className={`h-4 w-4 ${isHighContrast ? "text-zinc-800" : "text-zinc-400"}`} />
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${textWhiteClass}`}>Historial de Operaciones</h3>
              </div>
              <span className={`text-[10px] py-1 px-2.5 rounded-md font-mono font-bold ${
                isHighContrast ? "bg-zinc-200 text-zinc-900 border border-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}>Últimos</span>
            </div>

            {latestTransactions.length > 0 ? (
              <div className="space-y-3">
                {latestTransactions.map((tx) => (
                  <div key={tx.id} className={`border-b pb-2.5 last:border-b-0 last:pb-0 ${isHighContrast ? "border-zinc-300" : "border-zinc-800/80"}`}>
                    <div className="flex items-center justify-between">
                      {/* Badge indicator */}
                      <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded flex items-center space-x-1 border ${
                        tx.type === "entrada" 
                          ? (isHighContrast ? "bg-emerald-200 text-emerald-950 border-2 border-emerald-950 font-black" : "bg-emerald-950/30 text-emerald-400 border-emerald-900") 
                          : tx.type === "salida" 
                          ? (isHighContrast ? "bg-red-200 text-red-950 border-2 border-red-950 font-black" : "bg-red-950/30 text-red-400 border-red-900") 
                          : (isHighContrast ? "bg-amber-200 text-amber-950 border-2 border-amber-950 font-black" : "bg-amber-950/30 text-amber-400 border-amber-900")
                      }`}>
                        {tx.type === "entrada" ? <ArrowDownLeft className="h-2.5 w-2.5" /> : tx.type === "salida" ? <ArrowUpRight className="h-2.5 w-2.5" /> : <Sliders className="h-2.5 w-2.5" />}
                        <span>{tx.type}</span>
                      </span>
                      <span className={`text-[10px] font-mono ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-500"}`}>{tx.date.substring(5, 10)} {tx.date.substring(11, 16)}</span>
                    </div>

                    <h4 className={`text-xs font-semibold mt-1 truncate ${isHighContrast ? "text-zinc-950 font-black" : "text-zinc-200"}`}>{tx.itemName}</h4>
                    <p className={`text-[10px] mt-0.5 font-sans ${isHighContrast ? "text-zinc-900 font-bold" : "text-zinc-400"}`}>
                      Cant: <strong className={`font-mono ${isHighContrast ? "text-zinc-950 font-black" : "text-white"}`}>{tx.qty}</strong> | Encargado: <span className={`${isHighContrast ? "text-zinc-800" : "text-zinc-500"} italic truncate font-mono`}>{tx.responsible.split("@")[0]}</span>
                    </p>
                    {tx.notes && (
                      <p className={`text-[9px] mt-1 italic max-w-full truncate ${isHighContrast ? "text-zinc-800 font-semibold" : "text-zinc-500"}`}>"{tx.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`py-12 text-center text-sm border-2 border-dashed rounded-xl ${
                isHighContrast ? "border-zinc-300 text-zinc-800 bg-white" : "border-zinc-800 text-zinc-500"
              }`}>
                No hay movimientos registrados recientemente.
              </div>
            )}
          </div>

          <div className={`pt-4 border-t mt-4 text-center ${isHighContrast ? "border-zinc-300" : "border-zinc-800/80"}`}>
            <button
              onClick={() => onNavigateToTab("transactions")}
              className={`w-full text-xs transition font-black focus:outline-none ${
                isHighContrast ? "text-indigo-950 hover:underline" : "text-zinc-400 hover:text-white"
              }`}
            >
              Auditar archivo histórico completo →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
