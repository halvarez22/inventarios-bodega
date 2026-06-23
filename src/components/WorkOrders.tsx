import React, { useState } from "react";
import { WorkOrder, Crew } from "../types";
import { Plus, Edit2, Trash2, Briefcase, Calendar, MapPin, CheckCircle2, Clock, PlayCircle } from "lucide-react";

interface WorkOrdersProps {
  workOrders: WorkOrder[];
  crews: Crew[];
  onAddWorkOrder: (wo: Omit<WorkOrder, "id">) => Promise<void>;
  onEditWorkOrder: (id: string, wo: Partial<WorkOrder>) => Promise<void>;
  onDeleteWorkOrder: (id: string) => Promise<void>;
}

export default function WorkOrders({ workOrders, crews, onAddWorkOrder, onEditWorkOrder, onDeleteWorkOrder }: WorkOrdersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [assignedCrewId, setAssignedCrewId] = useState("");
  const [status, setStatus] = useState<WorkOrder["status"]>("pendiente");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setIdentifier("");
    setDescription("");
    setAddress("");
    setClientName("");
    setAssignedCrewId("");
    setStatus("pendiente");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (wo: WorkOrder) => {
    setIdentifier(wo.identifier);
    setDescription(wo.description);
    setAddress(wo.address || "");
    setClientName(wo.clientName || "");
    setAssignedCrewId(wo.assignedCrewId || "");
    setStatus(wo.status);
    setStartDate(wo.startDate || "");
    setEndDate(wo.endDate || "");
    setNotes(wo.notes || "");
    setEditingId(wo.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !description.trim()) {
      alert("El identificador y la descripción son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await onEditWorkOrder(editingId, { identifier, description, address, clientName, assignedCrewId, status, startDate, endDate, notes });
      } else {
        await onAddWorkOrder({ identifier, description, address, clientName, assignedCrewId, status, startDate, endDate, notes });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error al guardar la orden de trabajo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta orden de trabajo?")) {
      try {
        await onDeleteWorkOrder(id);
      } catch (err) {
        console.error(err);
        alert("Error al eliminar la orden de trabajo.");
      }
    }
  };

  const getCrewName = (id: string) => crews.find(c => c.id === id)?.name || "Sin Asignar";

  const statusConfig = {
    "pendiente": { icon: Clock, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/30", label: "Pendiente" },
    "en_progreso": { icon: PlayCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "En Progreso" },
    "completada": { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Completada" }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-amber-500" />
            <span>Órdenes de Trabajo (OS)</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Programa trabajos, asigna cuadrillas y haz seguimiento.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva OS</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-5 flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-amber-500" />
            <span>{editingId ? "Editar Orden de Trabajo" : "Crear Orden de Trabajo"}</span>
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Identificador (Ej. OS-001)</label>
                <input 
                  type="text" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none uppercase font-mono"
                  placeholder="OS-001"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Descripción del Trabajo</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none"
                  placeholder="Instalación 10kWp Planta Solar..."
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Cliente (Opcional)</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none"
                  placeholder="Nombre de la empresa o cliente"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Dirección / Ubicación</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none"
                  placeholder="Dirección de la obra"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Cuadrilla Asignada</label>
                <select 
                  value={assignedCrewId} 
                  onChange={(e) => setAssignedCrewId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none"
                >
                  <option value="">-- Sin Asignar --</option>
                  {crews.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status.replace("_", " ")})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Estado</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as WorkOrder["status"])}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Fecha de Inicio</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none color-scheme-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Fecha de Término</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none color-scheme-dark"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">Notas / Observaciones</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none resize-none"
                rows={2}
                placeholder="Instrucciones adicionales, requerimientos especiales..."
              />
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
                {loading ? "Guardando..." : "Guardar OS"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {workOrders.map((wo) => {
          const config = statusConfig[wo.status];
          const StatusIcon = config.icon;

          return (
            <div key={wo.id} className={`bg-zinc-900 border ${wo.status === 'completada' ? 'border-emerald-500/30' : 'border-zinc-800 hover:border-amber-500/50'} rounded-2xl p-5 transition group flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center`}>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-white bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 font-mono tracking-wider">
                    {wo.identifier}
                  </span>
                  <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    <span>{config.label}</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white leading-tight">{wo.description}</h4>
                  {wo.clientName && <p className="text-sm text-zinc-400 mt-0.5">Cliente: <span className="text-zinc-300 font-medium">{wo.clientName}</span></p>}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400">
                  {wo.address && (
                    <div className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                      {wo.address}
                    </div>
                  )}
                  {wo.startDate && (
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
                      Inicio: {wo.startDate}
                    </div>
                  )}
                  {wo.assignedCrewId && (
                    <div className="flex items-center">
                      <HardHat className="h-3.5 w-3.5 mr-1.5 text-amber-500/70" />
                      <span className="text-amber-400/90 font-medium">Cuadrilla: {getCrewName(wo.assignedCrewId)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 shrink-0 self-end sm:self-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleEditClick(wo)} className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition cursor-pointer font-medium text-sm flex items-center space-x-2">
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button onClick={() => handleDelete(wo.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/50 rounded-xl transition cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          );
        })}
        
        {workOrders.length === 0 && !isAdding && (
          <div className="py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30">
            <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay órdenes de trabajo</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
              Registra los trabajos a realizar para poder asignar cuadrillas y controlar las salidas de bodega específicas para cada proyecto.
            </p>
            <button 
              onClick={() => setIsAdding(true)} 
              className="mt-6 text-amber-500 font-bold hover:text-amber-400 flex items-center space-x-2 mx-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Crear la primera OS</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
