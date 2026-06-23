import React, { useEffect, useState } from "react";
import { X, Download, Printer, Copy, Check, QrCode, ClipboardList } from "lucide-react";
import QRCode from "qrcode";
import { InventoryItem } from "../types";

interface ItemQrCodeModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemQrCodeModal({ item, isOpen, onClose }: ItemQrCodeModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const scanUrl = item 
    ? `${window.location.origin}${window.location.pathname}?item=${item.id}` 
    : "";

  useEffect(() => {
    if (!item || !isOpen) return;

    QRCode.toDataURL(scanUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#0F1115",  // Hex color for QR code dots
        light: "#FFFFFF"  // Background color
      },
      errorCorrectionLevel: "H" // High error correction so labels remain readable even if partly smudged
    })
    .then(url => {
      setQrUrl(url);
    })
    .catch(err => {
      console.error("Error generating local QR code:", err);
    });
  }, [item, isOpen, scanUrl]);

  if (!isOpen || !item) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QR_EnergiStock_${item.sku}_${item.name.replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes en tu navegador para imprimir etiquetas.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta QR - ${item.sku}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              text-align: center;
              padding: 20px;
              margin: 0;
              background: white;
              color: black;
            }
            .label-card {
              border: 2px dashed black;
              padding: 15px;
              width: 280px;
              margin: auto;
              display: inline-block;
            }
            .title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .sub {
              font-size: 10px;
              color: #444;
              margin-bottom: 12px;
              border-bottom: 1px solid #111;
              padding-bottom: 5px;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 10px auto;
            }
            .sku {
              font-size: 18px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 5px 0;
              background-color: #000;
              color: #fff;
              padding: 4px 0;
            }
            .name {
              font-size: 11px;
              font-weight: bold;
              margin-top: 5px;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
            .meta {
              font-size: 9px;
              color: #555;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="title">ENERGI<span style="font-weight: 300;">STOCK</span></div>
            <div class="sub">Etiqueta de inventario e-WMS</div>
            <img class="qr-img" src="${qrUrl}" alt="QR" />
            <div class="sku">${item.sku}</div>
            <div class="name">${item.name}</div>
            <div class="meta">Ubicación: ${item.location || "PASILLO S/A"} | Cat: ${item.category}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden animate-scale-up select-none">
        
        {/* Glow Header */}
        <div className="h-1 bg-amber-500 w-full" />

        {/* Modal content body */}
        <div className="p-6 space-y-6">
          
          {/* Top Panel Brand */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center h-10 w-10 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Generador de Etiquetas</span>
                <h3 className="text-base font-bold text-white tracking-tight">Etiqueta QR Única</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Code display inside white card so that contrast is perfect */}
          <div className="flex flex-col items-center space-y-4">
            
            <div className="bg-white p-4 rounded-xl border-4 border-zinc-950 shadow-inner flex flex-col items-center justify-center">
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt={`QR de ${item.sku}`} 
                  className="w-48 h-48 block"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-400 font-mono text-xs italic">
                  Generando matriz...
                </div>
              )}
            </div>

            {/* Simple resource visual card details */}
            <div className="w-full text-center space-y-1">
              <span className="bg-amber-500/15 border border-amber-500/20 text-amber-500 font-mono font-bold text-xs tracking-widest px-2.5 py-1 rounded inline-block">
                {item.sku}
              </span>
              <h4 className="text-white font-bold text-sm truncate px-4">{item.name}</h4>
              <p className="text-[10px] text-zinc-500 font-mono">
                Ubicación física: <strong className="text-zinc-400 font-medium">{item.location || "Sin asignar"}</strong>
              </p>
            </div>

          </div>

          {/* Deep linking scanner details */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] text-zinc-400 font-mono font-semibold uppercase block">
              Enlace de escaneo directo (Deep Link):
            </span>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                readOnly 
                value={scanUrl} 
                className="flex-1 bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-400 select-all focus:outline-none"
              />
              <button 
                onClick={handleCopyLink}
                className="bg-zinc-800 hover:bg-zinc-700/80 active:bg-zinc-900 md:p-2 p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
                title="Copiar enlace al portapapeles"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[9px] text-zinc-500 leading-normal">
              Al escanear este QR con la cámara de un móvil, se redireccionará de forma segura al portal web de Bodega, donde se abrirá en tiempo real el modal de operaciones de este artículo.
            </p>
          </div>

          {/* Printable or downloadable commands */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleDownload}
              className="bg-[#1C2128] hover:bg-[#222831] border border-zinc-700/50 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer text-xs"
            >
              <Download className="h-4 w-4 text-zinc-400" />
              <span>Guardar PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-zinc-950 hover:bg-zinc-900 border border-[#30363D] text-amber-500 hover:text-amber-400 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer text-xs"
            >
              <Printer className="h-4 w-4 text-amber-500" />
              <span>Imprimir Etiqueta</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
