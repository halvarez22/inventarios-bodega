import React, { useState, useEffect } from "react";
import { InventoryItem, Location } from "../types";
import { X, Save, AlertTriangle, MapPin, Layers } from "lucide-react";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, "id" | "updatedAt"> & { id?: string }) => Promise<void>;
  editingItem?: InventoryItem | null;
  locations?: Location[];
}

export default function ItemModal({ isOpen, onClose, onSave, editingItem, locations = [] }: ItemModalProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"herramientas" | "materiales" | "unidades_moviles">("materiales");
  const [subcategory, setSubcategory] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [unit, setUnit] = useState("unidades");
  const [selectedZone, setSelectedZone] = useState("");
  const [subLocation, setSubLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [minQty, setMinQty] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("disponible");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingItem) {
      setSku(editingItem.sku || "");
      setName(editingItem.name || "");
      setCategory(editingItem.category || "materiales");
      setSubcategory(editingItem.subcategory || "");
      setQty(editingItem.qty || 0);
      setUnit(editingItem.unit || "unidades");
      setMinQty(editingItem.minQty || 0);
      setDescription(editingItem.description || "");
      setStatus(editingItem.status || "disponible");

      // Parse current location to restore state dropdown correctly
      const currentLoc = editingItem.location || "";
      let matchedZone = "";
      let matchedSub = "";

      const locNames = locations.map(l => l.name);

      for (const zone of locNames) {
        if (currentLoc.startsWith(zone)) {
          matchedZone = zone;
          let rest = currentLoc.substring(zone.length).trim();
          // Remove potential leading separators e.g. " - " or leading parenthesis
          if (rest.startsWith("-")) {
            rest = rest.substring(1).trim();
          }
          if (rest.startsWith("(") && rest.endsWith(")")) {
            rest = rest.substring(1, rest.length - 1).trim();
          }
          matchedSub = rest;
          break;
        }
      }

      if (matchedZone) {
        setSelectedZone(matchedZone);
        setSubLocation(matchedSub);
        setCustomLocation("");
      } else {
        setSelectedZone("custom");
        setSubLocation("");
        setCustomLocation(currentLoc);
      }
    } else {
      setSku("");
      setName("");
      setCategory("materiales");
      setSubcategory("");
      setQty(0);
      setUnit("unidades");
      setMinQty(0);
      setDescription("");
      setStatus("disponible");

      // Set default zone based on original values
      setSelectedZone(locations.length > 0 ? locations[0].name : "custom");
      setSubLocation("");
      setCustomLocation("");
    }
    setError("");
  }, [editingItem, isOpen]);

  // Handle automatic subcategory and zone helper when category changes for quicker insertion
  useEffect(() => {
    if (!editingItem) {
      if (category === "herramientas") {
        setSubcategory("Herramientas de Medición");
        setStatus("buen estado");
        setUnit("unidades");
        setSelectedZone(locations.find(l => l.type === 'bodega')?.name || "custom");
      } else if (category === "unidades_moviles") {
        setSubcategory("Logística");
        setStatus("disponible");
        setUnit("unidades");
        setQty(1);
        setMinQty(1);
        setSelectedZone(locations.find(l => l.type === 'vehiculo')?.name || "custom");
      } else {
        setSubcategory("Sistemas Fotovoltaicos");
        setStatus("disponible");
        setUnit("unidades");
        setSelectedZone(locations.find(l => l.type === 'zona')?.name || "custom");
      }
    }
  }, [category, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sku.trim()) return setError("El código SKU es obligatorio.");
    if (!name.trim()) return setError("El nombre del recurso es obligatorio.");
    if (!subcategory.trim()) return setError("La subcategoría es obligatoria.");
    if (qty < 0) return setError("El stock disponible no puede ser negativo.");
    if (minQty < 0) return setError("El stock mínimo ideal no puede ser negativo.");

    // Validate and build structured location
    let finalLocation = "";
    if (selectedZone === "custom") {
      const trimmedCustom = customLocation.trim();
      if (!trimmedCustom) {
        return setError("Por favor, especifique la ubicación personalizada o elija una del catálogo.");
      }
      
      // Prevent duplicates of predefined zone tags
      const matchesPredefined = locations.some(
        (z) => z.name.toLowerCase() === trimmedCustom.toLowerCase()
      );
      if (matchesPredefined) {
        return setError("Esta ubicación coincide exactamente con una bodega registrada. Por favor, selecciona esa opción en la lista desplegable.");
      }

      if (trimmedCustom.length < 3) {
        return setError("La ubicación personalizada debe tener al menor 3 caracteres para ser lo suficientemente descriptiva.");
      }
      finalLocation = trimmedCustom;
    } else {
      const trimmedSub = subLocation.trim();
      if (/[<>{}[\]]/.test(trimmedSub)) {
        return setError("La sub-ubicación cuenta con caracteres especiales no permitidos para evitar distorsiones.");
      }
      if (trimmedSub) {
        finalLocation = `${selectedZone} (${trimmedSub})`;
      } else {
        finalLocation = selectedZone;
      }
    }

    setLoading(true);
    try {
      await onSave({
        id: editingItem?.id,
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        subcategory: subcategory.trim(),
        qty,
        unit: unit.trim(),
        location: finalLocation || "No asignado",
        minQty,
        description: description.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Error al guardar: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{editingItem ? "Editar Recurso de Bodega" : "Crear Nuevo Recurso de Bodega"}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-2 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Código SKU
              </label>
              <input
                type="text"
                disabled={!!editingItem}
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="E.g. PV-PAN-550W"
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm transition-all focus:ring-1 focus:ring-amber-500 disabled:opacity-50 disabled:bg-zinc-900"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Categoría Principal
              </label>
              <select
                disabled={!!editingItem}
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm cursor-pointer transition-all focus:ring-1 focus:ring-amber-500"
              >
                <option value="materiales">Materiales / Stock</option>
                <option value="herramientas">Herramientas</option>
                <option value="unidades_moviles">Unidad Móvil</option>
              </select>
            </div>

            {/* Name */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Nombre del Recurso
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre descriptivo del panel, inversor, herramienta o camión..."
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Subcategoría / Tipo
              </label>
              {category === "materiales" ? (
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm cursor-pointer transition-all"
                >
                  <option value="Sistemas Fotovoltaicos">Sistemas Fotovoltaicos</option>
                  <option value="Sistemas de Baterías BESS">Sistemas de Baterías BESS</option>
                  <option value="Iluminación">Iluminación</option>
                  <option value="Cables y Accesorios">Cables y Accesorios</option>
                  <option value="Estructura de Montaje">Estructura de Montaje</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="E.g. Medición, Carga Pesada"
                  className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm"
                />
              )}
            </div>

            {/* Status (conditional values based on category) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Estado Operativo / de Conservación
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm cursor-pointer transition-all"
              >
                {category === "unidades_moviles" ? (
                  <>
                    <option value="disponible">Disponible (Estacionado)</option>
                    <option value="en ruta">En Ruta (Operando)</option>
                    <option value="mantenimiento">Mantenimiento mecánico</option>
                  </>
                ) : category === "herramientas" ? (
                  <>
                    <option value="buen estado">Excelente / Buen estado</option>
                    <option value="en reparación">En reparación física</option>
                    <option value="extraviado">Extraviado / Por regularizar</option>
                  </>
                ) : (
                  <>
                    <option value="disponible">En Stock / Disponible</option>
                    <option value="retenido">Retenido (Reservado Obras)</option>
                    <option value="agotado">Sin Existencias / Solicitado</option>
                  </>
                )}
              </select>
            </div>

            {/* Qty */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Stock Inicial disponible
              </label>
              <input
                type="number"
                disabled={!!editingItem} // If editing, quantity can ONLY be modified via registration of movements (transaction modal)
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                placeholder="Cant."
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm focus:ring-1 disabled:opacity-60"
              />
              {editingItem && (
                <span className="text-[10px] text-zinc-500 block mt-1">Modificar stock ingresando Movimientos</span>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Unidad de Medida
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="E.g. unidades, metros, juegos"
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm focus:ring-1"
              />
            </div>

            {/* Location */}
            <div className="col-span-2 border border-zinc-800 bg-zinc-950/30 p-4 rounded-xl space-y-3.5">
              <div className="flex items-center space-x-2 border-b border-zinc-850 pb-2">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Especificar Ubicación Exacta de Bodega
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Predefined Zones selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Zona o Sector de Almacenamiento
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      if (e.target.value !== "custom") {
                        setCustomLocation("");
                      }
                    }}
                    className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm cursor-pointer transition-all focus:ring-1 focus:ring-amber-500"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                    {locations.length === 0 && (
                       <option value="" disabled>No hay bodegas registradas</option>
                    )}
                    <option value="custom">⚠️ Zona Personalizada / Otra...</option>
                  </select>
                </div>

                {/* Sub-location or custom field inputs */}
                {selectedZone !== "custom" ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex justify-between">
                      <span>Especificación de Rack / Estante</span>
                      <span className="text-[9px] text-zinc-500 font-mono">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={subLocation}
                      onChange={(e) => setSubLocation(e.target.value)}
                      placeholder="E.g. Estante A-3, Nivel 2"
                      className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm transition focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex justify-between">
                      <span>Nombre de Ubicación Customizada</span>
                      <span className="text-[9px] text-amber-500 font-mono font-bold">(Requerido)</span>
                    </label>
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="E.g. Estación de calibración y pruebas"
                      className="w-full bg-zinc-950 text-white border border-zinc-850 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm focus:ring-1"
                    />
                  </div>
                )}
              </div>

              {/* Real-time formatted string previews */}
              <div className="bg-zinc-950/80 border border-zinc-900/60 p-2 rounded-lg text-[10px] text-zinc-400 font-mono flex items-center space-x-1.5">
                <span className="text-amber-500">✔</span>
                <span>
                  Ubicación formalizada: <strong className="text-zinc-200">
                    {selectedZone === "custom"
                      ? (customLocation.trim() || "[Falta especificar ubicación]")
                      : `${selectedZone}${subLocation.trim() ? ` (${subLocation.trim()})` : ""}`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Minimum ideal stock for low stock triggers */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Stock Mínimo Alerta
              </label>
              <input
                type="number"
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                placeholder="E.g. 10"
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-3 outline-none text-sm focus:ring-1"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Descripción / Notas Técnicas
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas sobre compatibilidad, marcas, modelos o números de serie..."
                rows={3}
                className="w-full bg-zinc-950 text-white border border-zinc-800 focus:border-amber-500 rounded-xl py-2.5 px-4 outline-none text-sm transition-all focus:ring-1"
              />
            </div>

          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end space-x-3 bg-zinc-900 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-sm transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold text-sm transition duration-150 flex items-center space-x-2 shadow-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Guardando..." : "Guardar Recurso"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
