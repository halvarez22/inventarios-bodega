import React, { useState } from "react";
import { Installer } from "../types";
import { Plus, Edit2, Trash2, Users, HardHat, Briefcase, UserCheck } from "lucide-react";

interface InstallersSettingsProps {
  installers: Installer[];
  onAddInstaller: (inst: Omit<Installer, "id">) => Promise<void>;
  onEditInstaller: (id: string, inst: Partial<Installer>) => Promise<void>;
  onDeleteInstaller: (id: string) => Promise<void>;
}

export default function InstallersSettings({ installers, onAddInstaller, onEditInstaller, onDeleteInstaller }: InstallersSettingsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Installer["status"]>("activo");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setRut("");
    setPhone("");
    setEmail("");
    setCompany("");
    setStatus("activo");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditClick = (inst: Installer) => {
    setName(inst.name);
    setRut(inst.rut || "");
    setPhone(inst.phone || "");
    setEmail(inst.email || "");
    setCompany(inst.company || "");
    setStatus(inst.status || "activo");
    setEditingId(inst.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (editingId) {
        await onEditInstaller(editingId, { name, rut, phone, email, company, status });
      } else {
        await onAddInstaller({ name, rut, phone, email, company, status });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el instalador.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este instalador? El historial de salidas no se borrará, pero ya no podrás asignarle nuevos equipos.")) {
      try {
        await onDeleteInstaller(id);
      } catch (err) {
        console.error(err);
        alert("Error al eliminar el instalador.");
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="h-6 w-6 text-amber-500" />
            <span>Catálogo de Instaladores</span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Administra el personal interno y contratistas autorizados para retirar material.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Instalador</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">{editingId ? "Editar Instalador" : "Registrar Instalador"}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">RUT / Identificador</label>
                <input 
                  type="text" 
                  value={rut} 
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="Ej. 12.345.678-9"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Teléfono</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="juan@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Empresa / Contratista</label>
                <input 
                  type="text" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                  placeholder="Interno o Nombre Empresa"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1">Estado</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as "activo" | "inactivo")}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:border-amber-500 outline-none"
                >
                  <option value="activo">Activo (Puede retirar)</option>
                  <option value="inactivo">Inactivo (Suspendido)</option>
                </select>
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
        {installers.map((inst) => (
          <div key={inst.id} className={`bg-zinc-900 border ${inst.status === "activo" ? "border-zinc-800 hover:border-amber-500/50" : "border-red-900/50 opacity-75"} rounded-2xl p-5 flex flex-col justify-between group transition`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${inst.status === "activo" ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                  {inst.company?.toLowerCase().includes("interno") || !inst.company ? (
                    <UserCheck className={`h-5 w-5 ${inst.status === "activo" ? "text-amber-500" : "text-red-500"}`} />
                  ) : (
                    <HardHat className={`h-5 w-5 ${inst.status === "activo" ? "text-amber-500" : "text-red-500"}`} />
                  )}
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg leading-tight">{inst.name}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">{inst.rut}</p>
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleEditClick(inst)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(inst.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 border-t border-dashed border-zinc-800 pt-3">
              {inst.company && (
                <div className="flex items-center text-xs text-zinc-400">
                  <Briefcase className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                  <span>{inst.company}</span>
                </div>
              )}
              {inst.email && (
                <div className="text-xs text-zinc-400 truncate">
                  <span className="text-zinc-500 mr-2">✉</span> {inst.email}
                </div>
              )}
              {inst.phone && (
                <div className="text-xs text-zinc-400">
                  <span className="text-zinc-500 mr-2">✆</span> {inst.phone}
                </div>
              )}
              <div className="mt-2 pt-2 flex justify-end">
                 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${inst.status === "activo" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                   {inst.status === "activo" ? "ACTIVO" : "INACTIVO"}
                 </span>
              </div>
            </div>
          </div>
        ))}
        {installers.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border border-dashed border-zinc-800 rounded-3xl">
            <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white">No hay instaladores registrados</h3>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">Comienza agregando al personal autorizado para poder asignarles las salidas de inventario.</p>
            <button onClick={() => setIsAdding(true)} className="mt-4 text-amber-500 font-semibold hover:underline cursor-pointer">Registrar Instalador</button>
          </div>
        )}
      </div>
    </div>
  );
}
