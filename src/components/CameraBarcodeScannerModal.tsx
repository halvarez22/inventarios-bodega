import React, { useEffect, useRef, useState } from "react";
import { 
  X, 
  Camera, 
  RefreshCw, 
  Zap, 
  Search, 
  Sparkles, 
  ChevronRight, 
  CheckCircle, 
  Package, 
  Barcode, 
  Smartphone,
  Play,
  Square,
  AlertCircle
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { InventoryItem, Transaction } from "../types";

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onRecordTx: (fields: Omit<Transaction, "id" | "date">) => Promise<void> | void;
  onEditItem: (item: InventoryItem) => void;
  currentUserEmail: string;
}

export default function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  items,
  onRecordTx,
  onEditItem,
  currentUserEmail
}: CameraBarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>("");
  const [lastScannedText, setLastScannedText] = useState<string>("");
  
  // Custom scan success detail matching
  const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
  const [rapidMode, setRapidMode] = useState<boolean>(false);
  const [rapidSuccessMessage, setRapidSuccessMessage] = useState<string>("");

  const qrRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_DIV_ID = "camera-scanner-render-area";

  // Web Audio synthetic beep
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      // Success tone: high pleasant pitch. Failure: lower warning chime
      oscillator.frequency.setValueAtTime(isSuccess ? 987.77 : 330, audioCtx.currentTime); // B5 or E4
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      console.warn("Unable to play synthetic beep:", e);
    }
  };

  // 1. Enumerate system cameras
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer environment (back) camera automatically
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("entorno") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setScannerError("No se encontraron cámaras de video en este terminal.");
        }
      })
      .catch((err) => {
        console.error("Camera access enumerate error", err);
        setScannerError("Permiso de cámara rechazado o error de hardware.");
      });
  }, [isOpen]);

  // 2. Start/Stop scanner depending on scanning state toggles
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return;

    const startScannerInstance = async () => {
      try {
        setScannerError("");
        if (qrRef.current) {
          await qrRef.current.stop().catch(() => {});
          qrRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(SCANNER_DIV_ID);
        qrRef.current = html5QrCode;

        setIsScanning(true);
        await html5QrCode.start(
          selectedCameraId,
          {
            fps: 15,
            qrbox: (width, height) => {
              // Barcode matches want a wider landscape scan layout box
              const w = Math.min(width * 0.85, 360);
              const h = Math.min(height * 0.45, 180);
              return { width: w, height: h };
            },
            aspectRatio: 1.777778 // 16:9 widescreen layout
          },
          onScanSuccess,
          (err) => {
            // Keep scan logs silent as failure handler triggers for every empty frame
          }
        );
      } catch (err: any) {
        console.error("Failed to boot scanner:", err);
        setScannerError(`Error al iniciar la transmisión: ${err?.message || err}`);
        setIsScanning(false);
      }
    };

    startScannerInstance();

    return () => {
      if (qrRef.current) {
        qrRef.current.stop()
          .then(() => {
            qrRef.current = null;
          })
          .catch(e => console.log("cleanup stop err", e));
      }
    };
  }, [isOpen, selectedCameraId]);

  // Success Decode flow
  const onScanSuccess = async (decodedText: string) => {
    if (!decodedText) return;
    
    // Prevent duplicated rapid fire detections
    setLastScannedText(decodedText);
    playBeep(true);

    // Identify scanned item by parsed ID/SKU
    let finalItemId = "";
    let matched: InventoryItem | undefined;

    // Check if it's a URL deep link: ...?item=XYZ
    try {
      if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        const parsedUrl = new URL(decodedText);
        const urlId = parsedUrl.searchParams.get("item");
        if (urlId) {
          finalItemId = urlId;
          matched = items.find(it => it.id === finalItemId);
        }
      }
    } catch (_) {}

    // Fallback: search by exact match of UUID/id 
    if (!matched) {
      matched = items.find(it => it.id === decodedText);
    }

    // Fallback: search by SKU attribute (e.g. standard product barcode match)
    if (!matched) {
      const normalizedQuery = decodedText.trim().toLowerCase();
      matched = items.find(it => 
        it.sku.trim().toLowerCase() === normalizedQuery ||
        it.sku.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === normalizedQuery.replace(/[^a-zA-Z0-9]/g, "")
      );
    }

    if (!matched) {
      // Show warning beep of unmatched code
      playBeep(false);
      setMatchedItem(null);
      // Wait a moment and then clear so scanning can capture something else
      return;
    }

    // MATCH FOUND ACTION!
    if (rapidMode) {
      // RAPID AUDITING mode selected: instant +1 stock count without any dialog interrupts!
      const oldValue = matched.qty;
      const newValue = oldValue + 1;

      try {
        await onRecordTx({
          itemId: matched.id,
          itemName: matched.name,
          itemCategory: matched.category,
          type: "entrada",
          qty: 1,
          prevQty: oldValue,
          newQty: newValue,
          responsible: currentUserEmail,
          destinationOrOrigin: "Escáner Móvil (Rápido)",
          notes: "Incremento veloz por control físico de barra (+1 stock)."
        });

        const successMsg = `[${matched.sku}] ${matched.name} | Stock actualizado: ${oldValue} ➔ ${newValue}`;
        setRapidSuccessMessage(successMsg);
        setTimeout(() => setRapidSuccessMessage(""), 4500);

      } catch (err) {
        console.error("Rapid mode updating failed", err);
      }
    } else {
      // Normal mode: Pause frame scan and present gorgeous summary overlay
      if (qrRef.current) {
        try {
          await qrRef.current.pause();
        } catch (_) {}
      }
      setIsScanning(false);
      setMatchedItem(matched);
    }
  };

  const handleResumeScanning = async () => {
    setMatchedItem(null);
    setLastScannedText("");
    if (qrRef.current) {
      try {
        qrRef.current.resume();
        setIsScanning(true);
      } catch (err) {
        console.error("Resume failed, restarting wholly", err);
        setSelectedCameraId(prev => prev); // force reload trigger hook
      }
    }
  };

  const handleApplyRapidAdjustment = async (qtyAdjustment: number, type: "entrada" | "salida" | "ajuste") => {
    if (!matchedItem) return;

    const oldQty = matchedItem.qty;
    let newQty = oldQty;

    if (type === "entrada") newQty = oldQty + qtyAdjustment;
    else if (type === "salida") newQty = Math.max(0, oldQty - qtyAdjustment);
    else newQty = qtyAdjustment;

    await onRecordTx({
      itemId: matchedItem.id,
      itemName: matchedItem.name,
      itemCategory: matchedItem.category,
      type: type,
      qty: qtyAdjustment,
      prevQty: oldQty,
      newQty: newQty,
      responsible: currentUserEmail,
      destinationOrOrigin: "Escáner Celular",
      notes: `Auditoría directa desde cámara de dispositivo.`
    });

    playBeep(true);
    handleResumeScanning();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col md:bg-black/90 md:backdrop-blur-md items-center justify-center p-0 md:p-6 select-none overflow-hidden">
      
      {/* Outer Shell container */}
      <div className="w-full h-full md:max-w-4xl md:h-[85vh] bg-[#161B22] md:border md:border-[#30363D] md:rounded-3xl flex flex-col shadow-2xl relative">
        
        {/* Absolute header for device screen compatibility */}
        <header className="h-16 shrink-0 bg-zinc-950 border-b border-zinc-900 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-zinc-950">
              <Camera className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-none tracking-tight">
                Escáner Móvil de Bodega
              </h2>
              <span className="text-[10px] text-zinc-500 font-mono leading-none mt-1 block">
                CÁMARA: {isScanning ? "LIVE FEED" : "PAUSED"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            
            {/* Toggles camera selection dropdown if multiple units exist */}
            {cameras.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-zinc-900 p-1.5 border border-zinc-800 rounded-xl leading-none">
                <RefreshCw className="h-3 w-3 text-zinc-500 animate-spin-slow" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="bg-transparent text-white text-[10px] font-bold border-none outline-none cursor-pointer max-w-[110px] truncate"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id} className="bg-zinc-900 text-white">
                      {cam.label || `Lente ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-900 rounded-xl transition cursor-pointer"
              title="Cerrar Escáner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Master screen body splits into camera view (left) and rapid tools (right) on desktop */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* CAMERA FEED PANEL */}
          <div className="flex-1 relative bg-black flex flex-col justify-center items-center p-3">
            
            {/* Dynamic camera capture window frame marker */}
            <div className="relative w-full max-w-md aspect-[16/10] bg-zinc-950 rounded-2xl border border-zinc-900/80 overflow-hidden shadow-2xl shadow-black/80 flex items-center justify-center">
              
              {/* Actual camera layout element targets */}
              <div 
                id={SCANNER_DIV_ID} 
                className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover"
              />

              {/* Holographic camera HUD overlays */}
              <div className="absolute inset-x-8 inset-y-6 border border-dashed border-amber-500/35 rounded-xl pointer-events-none flex flex-col justify-between items-center p-4">
                <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-md" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-md" />
                </div>

                <div className="text-center bg-black/60 backdrop-blur-sm py-1 px-3 border border-zinc-800/80 rounded-md text-[9px] font-mono tracking-widest text-zinc-400 uppercase select-none">
                  Alinear Código de Barras o QR
                </div>

                <div className="flex justify-between w-full">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-md" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-md" />
                </div>
              </div>

              {/* Red sliding laser guide */}
              {isScanning && (
                <div className="absolute inset-x-4 h-0.5 bg-red-500 opacity-60 shadow-[0_0_8px_#f87171] animate-laser-scroll pointer-events-none" />
              )}

              {/* Spinner Loading */}
              {!isScanning && !scannerError && !matchedItem && (
                <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center space-y-3 z-10">
                  <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                  <p className="text-zinc-400 text-xs font-mono">Conectando servicio de cámara...</p>
                </div>
              )}

              {/* Error messages if any */}
              {scannerError && (
                <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">Fallo de inicialización</h4>
                    <p className="text-zinc-400 text-xs leading-normal max-w-xs font-mono">{scannerError}</p>
                  </div>
                  <div className="bg-zinc-950/80 p-3 rounded-lg text-[10px] text-zinc-500 font-mono text-left max-w-xs">
                    * Tip: Certifica que has otorgado los permisos de cámara en tu navegador.
                  </div>
                </div>
              )}
            </div>

            {/* Rapid counts success overlay message popups */}
            {rapidSuccessMessage && (
              <div className="absolute bottom-4 left-4 right-4 z-20 bg-emerald-950/95 border border-emerald-500/40 p-3.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center space-x-2.5 shadow-2xl animate-scale-up select-text">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-mono">{rapidSuccessMessage}</span>
              </div>
            )}

            {/* Scanned raw text for troubleshooting */}
            {lastScannedText && !matchedItem && (
              <div className="mt-3.5 bg-zinc-950/60 border border-zinc-900 rounded-xl py-2 px-3 flex items-center space-x-2 max-w-sm w-full select-all">
                <Barcode className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-[10px] text-zinc-400 font-mono truncate">
                  Leído: "{lastScannedText}"
                </span>
                <span className="text-[9px] text-zinc-600 block shrink-0">
                  (Buscando SKU/ID...)
                </span>
              </div>
            )}
          </div>

          {/* SIDE PANEL: SETTINGS & TARGET FORM MATCHES */}
          <div className="w-full md:w-80 bg-zinc-950/40 border-t md:border-t-0 md:border-l border-zinc-900 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-[45vh] md:max-h-none">
            
            {/* If no match card is active: show tools configuration */}
            {!matchedItem ? (
              <div className="space-y-5">
                
                {/* 1. Rapid count Audit switch toggle */}
                <div className="bg-zinc-900/60 p-4 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={rapidMode}
                        onChange={(e) => setRapidMode(e.target.checked)}
                        className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-amber-500/20 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-orange-400 font-sans">
                        Modo Conteo Rápido
                      </span>
                    </label>
                    <span className="flex h-2 w-2 relative">
                      {rapidMode && (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                    <strong>¿Cómo funciona?</strong> Al activar este modo, cada código o SKU que detecte la cámara ingresará automáticamente <strong>+1 stock</strong> en la bodega, permitiéndote registrar pallets enteros en segundos de forma ininterrumpida.
                  </p>
                </div>

                {/* 2. Format details and helpers */}
                <div className="bg-zinc-900/25 p-4 border border-zinc-900 rounded-xl">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono block">Formatos Aceptados</span>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2.5 text-xs text-zinc-400">
                      <Barcode className="h-4 w-4 text-zinc-600 shrink-0" />
                      <span className="font-mono">Códigos SKU (1D/128/EAN)</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-xs text-zinc-400">
                      <Smartphone className="h-4 w-4 text-zinc-600 shrink-0" />
                      <span className="font-mono">Claves de recurso / IDs</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-xs text-zinc-400">
                      <Sparkles className="h-4 w-4 text-zinc-600 shrink-0" />
                      <span className="font-mono">Códigos QR EnergiStock</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 text-zinc-500 text-[10px] italic border-l border-zinc-800 leading-relaxed font-sans">
                  "Perfecto para dispositivos celulares Android, iOS e tablets de campo en terreno."
                </div>

              </div>
            ) : (
              
              /* MATCH CARD DETECTOR FORM ACTIVE! */
              <div className="space-y-4 animate-scale-up flex flex-col h-full justify-between">
                
                <div className="space-y-4">
                  {/* Title Banner */}
                  <div className="border-b border-zinc-900 pb-3">
                    <span className="text-[10px] text-amber-500 font-bold uppercase font-mono tracking-widest block">
                      Artículo Identificado
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                      {matchedItem.name}
                    </h3>
                    <span className="font-mono text-xs text-zinc-500 tracking-wider font-bold block mt-1 bg-zinc-900/60 p-1 rounded border border-zinc-850 inline-block">
                      SKU: {matchedItem.sku}
                    </span>
                  </div>

                  {/* Stock State */}
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Stock Actual</span>
                      <span className="text-lg font-mono font-extrabold text-white">
                        {matchedItem.qty} {matchedItem.unit}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Ubicación</span>
                      <span className="text-xs font-semibold text-zinc-300">
                        {matchedItem.location || "PROV-S/A"}
                      </span>
                    </div>
                  </div>

                  {/* Operational quick updates */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono tracking-wider block">
                      Acciones de Stock Rápidas
                    </span>

                    <button
                      onClick={() => handleApplyRapidAdjustment(1, "entrada")}
                      className="w-full bg-[#1C2128] hover:bg-[#252C36] text-emerald-400 border border-emerald-900/40 hover:border-emerald-500/30 p-2.5 rounded-xl transition text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Ingresar (Entrada) +1</span>
                    </button>

                    <button
                      onClick={() => handleApplyRapidAdjustment(1, "salida")}
                      className="w-full bg-[#1C2128] hover:bg-[#252C36] text-rose-400 border border-rose-900/40 hover:border-rose-500/30 p-2.5 rounded-xl transition text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Despachar (Salida) -1</span>
                    </button>
                    
                    <div className="border-t border-zinc-900 my-2 pt-2" />

                    <button
                      onClick={() => onEditItem(matchedItem)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 cursor-pointer border border-zinc-800"
                    >
                      <span>Modificar Detalles Completos</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleResumeScanning}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold p-3 rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer font-sans"
                >
                  <Play className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Reanudar Escaneo</span>
                </button>

              </div>
            )}

            {/* Bottom Brand Stamp */}
            <div className="text-[10px] text-zinc-600 font-mono border-t border-zinc-900 pt-3 mt-4 flex items-center justify-between select-none">
              <span>WMS Barcode-Decoder v2.9</span>
              <span className="text-zinc-700">EnergiStock</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
