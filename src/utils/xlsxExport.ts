import * as XLSX from "xlsx";
import { InventoryItem } from "../types";
import { formatLocalDate } from "./csvExport";

// Translates English categories to friendly Spanish
const translateCategory = (cat: string): string => {
  switch (cat) {
    case "materiales": return "Materiales & Paneles";
    case "herramientas": return "Herramientas";
    case "unidades_moviles": return "Unidades Móviles";
    default: return cat;
  }
};

/**
 * Downloads a professional XLSX file of the current stock.
 * Displays critical stock conditions elegantly.
 */
export const exportInventoryToXLSX = (items: InventoryItem[]) => {
  // Title block & Metadata headers
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const titleRow = ["REPORTE PROFESIONAL DE INVENTARIO Y STOCK - ENERGISTOCK"];
  const metaRow = [
    `Fecha de Generación: ${formatLocalDate(now.toISOString())}`,
    `Total Recursos Controlados: ${items.length}`
  ];
  const blankRow = [""];

  // Column Headers
  const headers = [
    "SKU / Código",
    "Nombre de Recurso",
    "Categoría",
    "Subcategoría",
    "Stock Actual",
    "Unidad",
    "Ubicación / Pasillo",
    "Stock Mínimo Alerta",
    "Condición de Alerta", // This will be our formatted cell content
    "Estado Operativo",
    "Última Actualización"
  ];

  // Map inventory data to worksheet rows
  const dataRows = items.map(item => {
    const isCritical = item.qty <= item.minQty;
    const alertCondition = isCritical 
      ? `🚨 ALERTA CRÍTICA: Reabastecer inmediatamente (Mínimo: ${item.minQty})` 
      : "✅ Stock Seguro / Suficiente";

    return [
      item.sku,
      item.name,
      translateCategory(item.category),
      item.subcategory || "N/A",
      item.qty,
      item.unit,
      item.location || "General",
      item.minQty,
      alertCondition,
      item.status || "Disponible",
      formatLocalDate(item.updatedAt)
    ];
  });

  // Combine components into array representing cell grid
  const grid = [
    titleRow,
    metaRow,
    blankRow,
    headers,
    ...dataRows
  ];

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(grid);

  // Apply row classifications & formatting
  // The sheet metadata rows are indices 0, 1, 2. The headers are at index 3 (Row 4). Data starts at index 4 (Row 5).
  dataRows.forEach((row, i) => {
    const item = items[i];
    const isCritical = item.qty <= item.minQty;
    const rowIndex = 4 + i; // Offset in worksheet (0-indexed representing the 5th row)

    // Cell coordinates:
    // Column E (Stock Actual) is index 4
    // Column H (Stock Mínimo Alerta) is index 7
    // Column I (Condición de Alerta) is index 8

    const stockCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 4 });
    const minCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 7 });
    const alertCellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 8 });

    // Explicitly enforce numeric state & formatting for sheet engine
    if (ws[stockCellRef]) {
      ws[stockCellRef].t = "n"; // number type
      ws[stockCellRef].z = "#,##0"; // number formatting
    }
    if (ws[minCellRef]) {
      ws[minCellRef].t = "n";
      ws[minCellRef].z = "#,##0";
    }

    // Embed styling annotations structure. Although basic XLSX can't render custom fills
    // without xlsx-style module, sheetjs will preserve it, and cell readers will read it.
    if (ws[alertCellRef]) {
      ws[alertCellRef].s = {
        font: {
          bold: isCritical,
          color: { rgb: isCritical ? "FF0000" : "008000" }
        },
        fill: {
          fgColor: { rgb: isCritical ? "FFE6E6" : "E6F2E6" }
        }
      };
    }
  });

  // Calculate & define optimal column widths automatically
  const colWidths = headers.map((header, colIndex) => {
    // Find length of longest value in column
    let maxLength = header.length;
    grid.forEach(row => {
      if (row && row[colIndex] !== undefined) {
        const valLength = String(row[colIndex]).length;
        if (valLength > maxLength) {
          maxLength = valLength;
        }
      }
    });
    return { wch: Math.min(maxLength + 3, 50) }; // cap at width 50, pad with 3
  });

  ws["!cols"] = colWidths;

  // Create Workbook & append sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario de Almacén");

  // Output File download
  XLSX.writeFile(wb, `Reporte_Inventario_Stock_Profesional_${dateStr}.xlsx`);
};
