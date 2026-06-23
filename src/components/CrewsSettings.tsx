import React, { useState } from "react";
import { Crew, Installer, Location } from "../types";
import { Plus, Edit2, Trash2, HardHat, Truck, UserCheck, Users } from "lucide-react";

interface CrewsSettingsProps {
  crews: Crew[];
  installers: Installer[];
  locations: Location[];
  onAddCrew: (crew: Omit<Crew, "id">) => Promise<void>;
  onEditCrew: (id: string, crew: Partial<Crew>) => Promise<void>;
  onDeleteCrew: (id: string) => Promise<void>;
}

export default function CrewsSettings({ crews, installers, locations, onAddCrew, onEditCrew, onDeleteCrew }: CrewsSettingsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [membersIds, setMembersIds] = useState<string[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [status, setStatus] = useState<Crew["status"]>("disponible");
  const [loading, setLoading] = useState(false);

  const vehicles = locations.filter(loc => loc.type === "vehiculo");

  // Compute installers already assigned to OTHER active crews
  const busyInstallerIds = React.useMemo(() => {
    const otherCrews = crews.filter(c => c.id !== editingId && c.status !== "inactiva");
    const busy = new Set<string>();
    otherCrews.forEach(c => {
      busy.add(c.leaderId);
      (c.membersIds || []).forEach(mid => busy.add(mid));
    });
    return busy;
  }, [crews, editingId]);

  const getCrewOfInstaller = (instId: string) => {
    return crews.find(c => c.id !== editingId && c.status !== "inactiva" &&
      (c.leaderId === instId || (c.membersIds || []).includes(instId)));
  };

  const resetForm = () => {
    setName("");
    setLeaderId("");
    setMembersIds([]);
    setVehicleId("");
    setStatus("disponible");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (crew: Crew) => {
    setName(crew.name);
    setLeaderId(crew.leaderId);
    setMembersIds(crew.membersIds || []);
    setVehicleId(crew.vehicleId || "");
    setStatus(crew.status || "disponible");
    setEditingId(crew.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !leaderId) {
      alert("El nombre y el líder son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await onEditCrew(editingId, { name, leaderId, membersIds, vehicleId, status });
      } else {
        await onAddCrew({ name, leaderId, membersIds, vehicleId, status });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la cuadrilla.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cuadrilla?")) {
      try {
        await onDeleteCrew(id);
      } catch (err) {
        console.error(err);
        alert("Error al eliminar la cuadrilla.");
      }
    }
  };

  const toggleMember = (instId: string) => {
    if (membersIds.includes(instId)) {
      setMembersIds(membersIds.filter(id => id !== instId));
    } else {
      setMembersIds([...membersIds, instId]);
    }
  };

  const getInstallerName = (id: string) => installers.find(i => i.id === id)?.name || "Desconocido";
  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || "Ninguno";

  const statusColors = {
    "disponible": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "en_ruta": "bg-blue-500/10 text-blue-400 border-blue-500/30",
    "trabajando": "bg-amber-500/10 text-amber-400 border-amber-500/30",
    "inactiva": "bg-red-500/10 text-red-400 border-red-500/30"
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <HardHat className="h-6 w-6 text-amber-500" />
            <span>Gestión de Cuadrillas</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Organiza equipos de trabajo y asígnales vehículos.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Cuadrilla</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
            <Users className="h-5 w-5 text-amber-500" />
            <span>{editingId ? "Editar Cuadrilla" : "Configurar Cuadrilla"}</span>
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Nombre de la Cuadrilla</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none transition"
                    placeholder="Ej. Equipo Alpha, Cuadrilla Sur"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Líder / Jefe de Cuadrilla</label>
                  <select 
                    value={leaderId} 
                    onChange={(e) => setLeaderId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none transition"
                     required
                  >
                    <option value="">-- Seleccionar Instalador --</option>
                    {installers.filter(i => i.status === "activo").map(inst => {
                      const busy = busyInstallerIds.has(inst.id);
                      const occupiedCrew = busy ? getCrewOfInstaller(inst.id) : null;
                      return (
                        <option key={inst.id} value={inst.id} disabled={busy}>
                          {inst.name} ({inst.company || "Interno"}){busy ? ` — En: ${occupiedCrew?.name}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Vehículo Asignado (Opcional)</label>
                  <select 
                    value={vehicleId} 
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none transition"
                  >
                    <option value="">-- Sin Vehículo --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Estado</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as Crew["status"])}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none transition"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_ruta">En Ruta</option>
                    <option value="trabajando">Trabajando</option>
                    <option value="inactiva">Inactiva</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-3">Miembros de Apoyo</label>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {installers.filter(i => i.status === "activo" && i.id !== leaderId).map(inst => {
                    const busy = busyInstallerIds.has(inst.id);
                    const occupiedCrew = busy ? getCrewOfInstaller(inst.id) : null;
                    return (
                      <label key={inst.id} className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer border transition ${
                        busy
                          ? "opacity-50 cursor-not-allowed border-red-900/20 bg-red-950/10"
                          : "hover:bg-zinc-900 border-transparent hover:border-zinc-800"
                      }`}>
                        <input
                          type="checkbox"
                          checked={membersIds.includes(inst.id)}
                          onChange={() => !busy && toggleMember(inst.id)}
                          disabled={busy}
                          className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/30 bg-zinc-950"
                        />
                        <span className="text-sm text-zinc-300">{inst.name}</span>
                        <span className="text-[10px] text-zinc-600">{inst.company || "Interno"}</span>
                        {busy && (
                          <span className="ml-auto text-[9px] text-red-400 font-bold font-mono">EN: {occupiedCrew?.name}</span>
                        )}
                      </label>
                    );
                  })}
                  {installers.length === 0 && (
                    <div className="text-xs text-zinc-500 italic p-2">No hay otros instaladores disponibles.</div>
                  )}
                </div>
              </div>

            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800 mt-6">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {loading ? "Guardando..." : "Guardar Cuadrilla"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {crews.map((crew) => (
          <div key={crew.id} className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between group transition">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-bold text-lg leading-tight flex items-center space-x-2">
                  <span>{crew.name}</span>
                </h4>
                <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[crew.status]}`}>
                  {crew.status.replace("_", " ")}
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleEditClick(crew)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer transition">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(crew.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg cursor-pointer transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 border-t border-dashed border-zinc-800 pt-4">
              
              <div className="flex items-start space-x-3">
                <UserCheck className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Líder</p>
                  <p className="text-sm text-zinc-200">{getInstallerName(crew.leaderId)}</p>
                </div>
              </div>

              {crew.membersIds && crew.membersIds.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Users className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Miembros ({crew.membersIds.length})</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {crew.membersIds.map(id => getInstallerName(id)).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 mt-2">
                <Truck className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Vehículo</p>
                  <p className={`text-xs font-mono mt-0.5 ${crew.vehicleId ? "text-amber-400 font-bold" : "text-zinc-600"}`}>
                    {crew.vehicleId ? getVehicleName(crew.vehicleId) : "Sin asignar"}
                  </p>
                </div>
              </div>

            </div>
          </div>
        ))}
        
        {crews.length === 0 && !isAdding && (
          <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
            <HardHat className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay cuadrillas configuradas</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
              Agrupa a tus instaladores y asignales vehículos para despachar materiales de forma más eficiente.
            </p>
            <button 
              onClick={() => setIsAdding(true)} 
              className="mt-6 text-amber-500 font-bold hover:text-amber-400 flex items-center space-x-2 mx-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear la primera cuadrilla</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
