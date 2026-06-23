import { InventoryItem, Transaction } from "../types";

// Helper to escape CSV cell values
const escapeCSV = (val: any): string => {
  if (val === null || val === undefined) return "";
  let str = String(val);
  // Replace quotes with double quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Translates English types/categories to friendly Spanish
const translateCategory = (cat: string): string => {
  switch (cat) {
    case "materiales": return "Materiales & Paneles";
    case "herramientas": return "Herramientas";
    case "unidades_moviles": return "Unidades Móviles";
    default: return cat;
  }
};

const translateType = (type: string): string => {
  switch (type) {
    case "entrada": return "Entrada (Ingreso)";
    case "salida": return "Salida (Despacho)";
    case "ajuste": return "Ajuste (Auditoría)";
    default: return type;
  }
};

// Formats date to a local readable string
export const formatLocalDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("es-CL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch (e) {
    return isoString;
  }
};

/**
 * Downloads a CSV of current stock.
 */
export const exportInventoryToCSV = (items: InventoryItem[]) => {
  const headers = [
    "SKU / Código",
    "Nombre de Recurso",
    "Categoría",
    "Subcategoría",
    "Stock / Cantidad",
    "Unidad",
    "Ubicación",
    "Stock Mínimo Alerta",
    "Estado",
    "Última Actualización",
    "Actualizado Por",
    "Descripción"
  ];

  const rows = items.map(item => [
    item.sku,
    item.name,
    translateCategory(item.category),
    item.subcategory || "",
    item.qty,
    item.unit,
    item.location || "",
    item.minQty,
    item.status || "Disponible",
    formatLocalDate(item.updatedAt),
    item.lastUpdatedBy || "",
    item.description || ""
  ]);

  const csvContent = [
    "\uFEFF" + headers.join(","), // UTF-8 BOM
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_Inventario_Stock_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Downloads a CSV of transactions, with optional filtering for a specific month/year.
 */
export const exportTransactionsToCSV = (
  transactions: Transaction[],
  filterMonth?: number, // 0 - 11
  filterYear?: number
) => {
  let listToExport = transactions;

  // Filter based on month and year if provided
  if (filterMonth !== undefined && filterYear !== undefined) {
    listToExport = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
  }

  const headers = [
    "Fecha / Hora",
    "Tipo de Movimiento",
    "Código de Recurso",
    "Categoría del Recurso",
    "Cantidad Operada",
    "Stock Anterior",
    "Stock Nuevo",
    "Responsable",
    "Destino u Origen",
    "Notas / Detalles"
  ];

  const rows = listToExport.map(tx => [
    formatLocalDate(tx.date),
    translateType(tx.type),
    tx.itemName,
    translateCategory(tx.itemCategory),
    tx.qty,
    tx.prevQty,
    tx.newQty,
    tx.responsible,
    tx.destinationOrOrigin || "",
    tx.notes || ""
  ]);

  const csvContent = [
    "\uFEFF" + headers.join(","), // UTF-8 BOM
    ...rows.map(row => row.map(escapeCSV).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  let fileName = "Reporte_Movimientos_Historial";
  if (filterMonth !== undefined && filterYear !== undefined) {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    fileName = `Reporte_Mensual_${monthNames[filterMonth]}_${filterYear}`;
  } else {
    const now = new Date();
    fileName += `_${now.toISOString().split("T")[0]}`;
  }

  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
