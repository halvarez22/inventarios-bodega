import React, { useState } from "react";
import { Location } from "../types";
import { Plus, Edit2, Trash2, MapPin, Truck, Layers, Box } from "lucide-react";

interface LocationsSettingsProps {
  locations: Location[];
  onAddLocation: (loc: Omit<Location, "id">) => Promise<void>;
  onEditLocation: (id: string, loc: Partial<Location>) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export default function LocationsSettings({ locations, onAddLocation, onEditLocation, onDeleteLocation }: LocationsSettingsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<Location["type"]>("bodega");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setType("bodega");
    setDescription("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (loc: Location) => {
    setName(loc.name);
    setType(loc.type || "bodega");
    setDescription(loc.description || "");
    setEditingId(loc.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingId) {
        await onEditLocation(editingId, { name, type, description });
      } else {
        await onAddLocation({ name, type, description });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la ubicación.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta ubicación? Si hay equipos vinculados a ella, podrían quedar huérfanos.")) {
      try {
        await onDeleteLocation(id);
      } catch (err) {
        console.error(err);
        alert("Error al eliminar la ubicación.");
      }
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "vehiculo": return <Truck className="h-5 w-5 text-indigo-400" />;
      case "zona": return <Layers className="h-5 w-5 text-emerald-400" />;
      case "estante": return <Box className="h-5 w-5 text-amber-400" />;
      default: return <MapPin className="h-5 w-5 text-rose-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-amber-500" />
            <span>Configuración de Bodegas</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Administra los lugares físicos y vehículos donde se almacenan los equipos.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Ubicación</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">{editingId ? "Editar Ubicación" : "Crear Ubicación"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="Ej. Bodega Norte"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Tipo</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                >
                  <option value="bodega">Bodega Principal</option>
                  <option value="zona">Zona / Patio</option>
                  <option value="estante">Estantería</option>
                  <option value="vehiculo">Vehículo Móvil</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Descripción (Opcional)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="Detalles sobre esta ubicación..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-xl font-semibold transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between group transition">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-zinc-950 p-2 rounded-lg">
                {getTypeIcon(loc.type)}
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleEditClick(loc)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(loc.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">{loc.name}</h4>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-1">{loc.type}</p>
              {loc.description && (
                <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{loc.description}</p>
              )}
            </div>
          </div>
        ))}
        {locations.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-3xl">
            <MapPin className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white">No hay bodegas registradas</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">Comienza agregando las ubicaciones de tu inventario para mantener todo organizado.</p>
            <button onClick={() => setIsAdding(true)} className="mt-4 text-amber-500 font-semibold hover:underline cursor-pointer">Agregar Ubicación</button>
          </div>
        )}
      </div>
    </div>
  );
}
