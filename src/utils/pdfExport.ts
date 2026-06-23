import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "../types";

/**
 * Generates a professional monthly or master warehouse auditing PDF report for EnergiStock.
 */
export function exportTransactionsToPDF(
  transactions: Transaction[],
  targetMonth?: number, // 0-indexed month
  targetYear?: number
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // 1. Filter transactions if a specific month and year are selected
  let filtered = transactions;
  let reportTitle = "REPORTE GENERAL DE MOVIMIENTOS";
  let reportPeriod = "Histórico Completo";

  if (targetMonth !== undefined && targetYear !== undefined) {
    filtered = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
    // Sort chronologically (ascending for reports)
    filtered = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    reportTitle = "REPORTE MENSUAL DE MOVIMIENTOS Y KARDEX";
    reportPeriod = `${monthNames[targetMonth]} ${targetYear}`;
  } else {
    // Sort chronological descending for general list
    filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // 2. Compute Executive Metrics
  let totalEntradasCount = 0;
  let totalSalidasCount = 0;
  let totalAjustesCount = 0;
  let totalUnitsEntrada = 0;
  let totalUnitsSalida = 0;

  filtered.forEach((tx) => {
    if (tx.type === "entrada") {
      totalEntradasCount++;
      totalUnitsEntrada += tx.qty;
    } else if (tx.type === "salida") {
      totalSalidasCount++;
      totalUnitsSalida += tx.qty;
    } else if (tx.type === "ajuste") {
      totalAjustesCount++;
    }
  });

  const netBalance = totalUnitsEntrada - totalUnitsSalida;

  // 3. Render Header Page Elements
  // --- Corporate Logo Drawing ---
  // Background Box for Logo Icon
  doc.setFillColor(245, 158, 11); // Brand amber
  doc.roundedRect(14, 15, 12, 12, 2, 2, "F");
  
  // Sun design inside the amber box
  doc.setFillColor(255, 255, 255); // White core
  doc.circle(20, 21, 3.5, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  // Solar rays inside logo container
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180;
    const x1 = 20 + Math.cos(rad) * 2;
    const y1 = 21 + Math.sin(rad) * 2;
    const x2 = 20 + Math.cos(rad) * 4.4;
    const y2 = 21 + Math.sin(rad) * 4.4;
    doc.line(x1, y1, x2, y2);
  }

  // Brand Typography Names
  doc.setTextColor(17, 24, 39); // Deep dark slate (tailwind zinc-900)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ENERGI STOCK", 29, 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Gray slate-500
  doc.text("BODEGA SOLAR & SISTEMAS DE ALMACENAMIENTO DE ENERGÍA (BESS)", 29, 25);

  // Divider Line below logo
  doc.setDrawColor(226, 232, 240); // Gray slate-200
  doc.setLineWidth(0.4);
  doc.line(14, 30, 196, 30);

  // Title Panel on Right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(reportTitle, 14, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // Amber dark
  doc.text(`Período de Auditoría: ${reportPeriod.toUpperCase()}`, 14, 44);

  // Metadata block on right aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  const generationDate = new Date().toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  doc.text(`Bodega Evaluada: Bodega Central de Operaciones`, 110, 38);
  doc.text(`Fecha Generación: ${generationDate}`, 110, 42);
  doc.text(`Estado Documental: Respaldo Autenticado de Servidor (Firestore)`, 110, 46);

  // 4. Executive Summary Box (Dashboard Card block)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 52, 182, 24, 2, 2, "FD");

  // Header for Executive Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("RESUMEN OPERATIVO DE BODEGA EN EL PERÍODO", 18, 57);

  // Column Metrics Grid
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  
  // Titles
  doc.text("OPERACIONES REALIZADAS", 18, 64);
  doc.text("TOTAL INGRESADO (STOCK IN)", 62, 64);
  doc.text("TOTAL DESPACHADO (STOCK OUT)", 110, 64);
  doc.text("BALANCE NETO DE BODEGA", 152, 64);

  // Values block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${filtered.length} Movimientos`, 18, 70);
  
  // Color code Entrada vs Salida
  doc.setTextColor(16, 124, 65); // Green Excel style
  doc.text(`+ ${totalUnitsEntrada} Unidades`, 62, 70);
  
  doc.setTextColor(163, 0, 0); // Red
  doc.text(`- ${totalUnitsSalida} Unidades`, 110, 70);

  // Balance Net color depending on sign
  if (netBalance >= 0) {
    doc.setTextColor(16, 124, 65);
    doc.text(`+ ${netBalance} Unidades`, 152, 70);
  } else {
    doc.setTextColor(163, 0, 0);
    doc.text(`${netBalance} Unidades`, 152, 70);
  }

  // 5. Generate tabular list of transaction movements
  const tableHeaders = [
    "Fecha/Hora",
    "Mov.",
    "Material / Equipo Solicitado",
    "Var.",
    "Stock Balance",
    "Responsable",
    "Destino u Origen / Observación"
  ];

  const tableBody = filtered.map((tx) => {
    const txDate = new Date(tx.date);
    const dateFormatted = isNaN(txDate.getTime()) 
      ? tx.date.split("T")[0] 
      : txDate.toLocaleString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

    const txTypeFormatted = tx.type.toUpperCase();
    const varSymbol = tx.type === "entrada" ? "+" : tx.type === "salida" ? "-" : "±";
    const detailText = `${tx.itemName}\n[Cat: ${tx.itemCategory.toUpperCase()}]`;
    const auditBalance = `${tx.prevQty}  ->  ${tx.newQty}`;
    const responsibleShort = tx.responsible.split("@")[0].toUpperCase();
    const infoCol = `${tx.destinationOrOrigin || "BODEGA"}${tx.notes ? `\n"${tx.notes}"` : ""}${tx.signature ? "\n[FIRMA REGISTRADA EN TERRENO]" : ""}`;

    return [
      dateFormatted,
      txTypeFormatted,
      detailText,
      `${varSymbol}${tx.qty}`,
      auditBalance,
      responsibleShort,
      infoCol
    ];
  });

  // Render automatic table with page breaks management
  autoTable(doc, {
    startY: 81,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    margin: { left: 14, right: 14, bottom: 25 },
    headStyles: {
      fillColor: [30, 41, 59], // Zinc slate-800
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "left",
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 26, fontSize: 7.5, fontStyle: "normal" }, // date
      1: { cellWidth: 15, fontSize: 7.5, fontStyle: "bold" },   // type
      2: { cellWidth: 50, fontSize: 8 },                       // material
      3: { cellWidth: 13, fontSize: 8.5, fontStyle: "bold", halign: "center" }, // qty
      4: { cellWidth: 20, fontSize: 7.5, halign: "center" },   // balance track
      5: { cellWidth: 23, fontSize: 7.5 },                     // user email
      6: { fontSize: 7.5 }                                     // destination & notes
    },
    styles: {
      cellPadding: 2.5,
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    didParseCell: (data) => {
      // Custom color Highlights inside cell types
      if (data.column.index === 1 && data.section === "body") {
        const typeVal = String(data.cell.raw).trim();
        if (typeVal === "ENTRADA") {
          data.cell.styles.textColor = [16, 124, 65]; // Green text
        } else if (typeVal === "SALIDA") {
          data.cell.styles.textColor = [185, 28, 28]; // Red text
        } else {
          data.cell.styles.textColor = [180, 83, 9];  // Amber text
        }
      }
      if (data.column.index === 3 && data.section === "body") {
        const deltaStr = String(data.cell.raw);
        if (deltaStr.startsWith("+")) {
          data.cell.styles.textColor = [16, 124, 65];
        } else if (deltaStr.startsWith("-")) {
          data.cell.styles.textColor = [185, 28, 28];
        } else {
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
    didDrawPage: (data) => {
      // Draw standard page footer on every single page
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // Slate-400
      
      const pageCount = doc.getNumberOfPages();
      const pageNum = data.pageNumber;
      
      // Footer text Left
      doc.text(
        "EnergiStock Kardex Engine - Documento de control interno confidencial de bodega solar y sistemas BESS.",
        14,
        287
      );
      
      // Footer text Right
      doc.text(
        `Página ${pageNum} de ${pageCount}`,
        185,
        287,
        { align: "right" }
      );
    }
  });

  // 6. Draw Signatures Authority panel on the final page of document
  // Compute space remaining to decide if signature fits on current page or we need a page-break
  const finalY = (doc as any).lastAutoTable.finalY || 81;
  const pageHeight = doc.internal.pageSize.getHeight();
  const spaceNeeded = 45; // mm height for signature panel

  if (finalY + spaceNeeded > pageHeight - 20) {
    doc.addPage();
    // Signature block on new blank page
    drawSignatureBlock(doc, 30);
  } else {
    // Signature block inline below table
    drawSignatureBlock(doc, finalY + 12);
  }

  function drawSignatureBlock(docInstance: jsPDF, yCoord: number) {
    docInstance.setDrawColor(203, 213, 225); // Slate-300
    docInstance.setLineWidth(0.35);
    docInstance.line(14, yCoord, 196, yCoord); // Horizontal border line
    
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(8.5);
    docInstance.setTextColor(30, 41, 59);
    docInstance.text("APROBACIÓN Y CONFORMIDAD DE AUDITORÍA", 14, yCoord + 5);

    docInstance.setFont("helvetica", "normal");
    docInstance.setFontSize(7.5);
    docInstance.setTextColor(100, 116, 139);
    docInstance.text(
      "Al firmar este kardex mensual, se certifica la exactitud física de las existencias y herramientas auditadas en bodega.",
      14,
      yCoord + 9
    );

    // Left Signature Line (Warehouse manager)
    docInstance.setDrawColor(148, 163, 184);
    docInstance.setLineWidth(0.3);
    docInstance.line(20, yCoord + 28, 80, yCoord + 28);
    
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(8);
    docInstance.setTextColor(15, 23, 42);
    docInstance.text("Firma Operador de Turno", 31, yCoord + 32);
    
    docInstance.setFont("helvetica", "normal");
    docInstance.setFontSize(7);
    docInstance.setTextColor(100, 116, 139);
    docInstance.text("Administración del Inventario", 31, yCoord + 35.5);

    // Right Signature Line (Auditor Senior)
    docInstance.line(125, yCoord + 28, 185, yCoord + 28);
    
    docInstance.setFont("helvetica", "bold");
    docInstance.setFontSize(8);
    docInstance.setTextColor(15, 23, 42);
    docInstance.text("Firma Jefe de Operaciones", 134, yCoord + 32);
    
    docInstance.setFont("helvetica", "normal");
    docInstance.setFontSize(7);
    docInstance.setTextColor(100, 116, 139);
    docInstance.text("Control y Auditoría de Obras Terreno", 128, yCoord + 35.5);
  }

  // Save / Trigger Download File in operator's browser
  const sanitizedPeriod = reportPeriod.toLowerCase().replace(/\s+/g, "_");
  doc.save(`energistock_kardex_${sanitizedPeriod}.pdf`);
}
