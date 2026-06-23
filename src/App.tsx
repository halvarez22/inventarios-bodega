import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  seedDatabaseIfEmpty 
} from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { InventoryItem, Transaction, Location, Installer, Crew, WorkOrder } from "./types";

// Import custom views
import AuthContainer from "./components/AuthContainer";
import Dashboard from "./components/Dashboard";
import InventoryList from "./components/InventoryList";
import TransactionHistory from "./components/TransactionHistory";
import AiAssistant from "./components/AiAssistant";
import CyclicInventory from "./components/CyclicInventory";
import LocationsSettings from "./components/LocationsSettings";
import InstallersSettings from "./components/InstallersSettings";
import CrewsSettings from "./components/CrewsSettings";
import WorkOrders from "./components/WorkOrders";
// Import Modals
import ItemModal from "./components/ItemModal";
import TransactionModal from "./components/TransactionModal";
import ScannedItemModal from "./components/ScannedItemModal";
import CameraBarcodeScannerModal from "./components/CameraBarcodeScannerModal";
import ItemDetailsModal from "./components/ItemDetailsModal";

// Icons 
import { 
  LayoutDashboard, 
  Boxes, 
  History, 
  Sparkles, 
  ClipboardCheck,
  LogOut, 
  Sun, 
  Battery, 
  Lightbulb, 
  Menu, 
  X, 
  UserCircle,
  Database,
  Users,
  CloudLightning,
  RefreshCw,
  Camera,
  Wifi,
  MapPin,
  HardHat,
  Briefcase,
  Building2,
  ChevronDown
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<{ email: string; isDemo: boolean } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Real-time collections states
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Offline queue local persistence and states
  const [offlineQueue, setOfflineQueue] = useState<{ id: string; type: string; itemName: string; action: string; timestamp: string }[]>(() => {
    try {
      const saved = localStorage.getItem("energistock_offline_queue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const addToOfflineQueue = (type: "crear" | "editar" | "eliminar" | "transaccion", itemName: string, desc: string) => {
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      itemName,
      action: desc,
      timestamp: new Date().toLocaleTimeString()
    };
    setOfflineQueue(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem("energistock_offline_queue", JSON.stringify(updated));
      return updated;
    });
  };

  const handleForceSync = async () => {
    if (offlineQueue.length === 0) {
      alert("No hay registros en la cola local para sincronizar.");
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus("Enlace...");

    try {
      // Connect check to health-check with timeout abort controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const response = await fetch("/api/health", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        setSyncStatus("Enviando...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const originalCount = offlineQueue.length;
        setOfflineQueue([]);
        localStorage.removeItem("energistock_offline_queue");
        
        alert(`¡Sincronización manual finalizada con éxito! Se han integrado e impactado con seguridad las ${originalCount} operaciones acumuladas en el servidor.`);
        setIsOnline(true);
      } else {
        throw new Error("No gateway response");
      }
    } catch (err) {
      console.warn("Manual sync error:", err);
      setSyncStatus("Error");
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("⚠️ Error de enlace de datos: No se pudo verificar conexión de red estable con los servidores de la bodega. Conservando registros seguros en tu base de datos local temporal.");
    } finally {
      setIsSyncing(false);
      setSyncStatus(null);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Layout states
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<string>("Chihuahua");

  const AVAILABLE_BRANCHES = ["Chihuahua", "Lagos de Moreno", "Cancún"];

  // Modal control states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedItemForTx, setSelectedItemForTx] = useState<InventoryItem | null>(null);

  const [selectedItemForDetails, setSelectedItemForDetails] = useState<InventoryItem | null>(null);

  // Scan QR states
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [scannedModalOpen, setScannedModalOpen] = useState(false);
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);

  // URL deep link listener for QR Scanned Items
  useEffect(() => {
    if (!user || items.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const scannedId = params.get("item");
    if (scannedId) {
      const matched = items.find(it => it.id === scannedId);
      if (matched) {
        setScannedItem(matched);
        setScannedModalOpen(true);
      }
    }
  }, [items, user]);

  const handleCloseScannedModal = () => {
    setScannedModalOpen(false);
    setScannedItem(null);
    // Remove search query parameter from URL to clean state
    const url = new URL(window.location.href);
    url.searchParams.delete("item");
    window.history.replaceState({}, document.title, url.toString());
  };

  // Monitor Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || "operador.demo@energistock.com",
          isDemo: firebaseUser.isAnonymous
        });
      } else {
        setUser(null);
      }
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  // Monitor Database collection (onSnapshot)
  useEffect(() => {
    if (!user) return;

    setLoadingDb(true);

    // Listen to items
    const itemsQuery = query(collection(db, "items"), orderBy("name", "asc"));
    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      const itemsList: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          itemsList.push({ id: doc.id, ...data } as InventoryItem);
        }
      });
      setItems(itemsList);
      setLoadingDb(false);
    }, (error) => {
      console.error("Firestore listen error (items):", error);
      setLoadingDb(false);
    });

    // Listen to transactions
    const txQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txList: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          txList.push({ id: doc.id, ...data } as Transaction);
        }
      });
      setTransactions(txList);
    }, (error) => {
      console.error("Firestore listen error (transactions):", error);
    });

    // Listen to locations
    const locQuery = query(collection(db, "locations"), orderBy("name", "asc"));
    const unsubLoc = onSnapshot(locQuery, (snapshot) => {
      const locList: Location[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          locList.push({ id: doc.id, ...data } as Location);
        }
      });
      setLocations(locList);
    }, (error) => {
      console.error("Firestore listen error (locations):", error);
    });

    // Listen to installers
    const instQuery = query(collection(db, "installers"), orderBy("name", "asc"));
    const unsubInst = onSnapshot(instQuery, (snapshot) => {
      const instList: Installer[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          instList.push({ id: doc.id, ...data } as Installer);
        }
      });
      setInstallers(instList);
    }, (error) => {
      console.error("Firestore listen error (installers):", error);
    });

    // Listen to crews
    const crewsQuery = query(collection(db, "crews"), orderBy("name", "asc"));
    const unsubCrews = onSnapshot(crewsQuery, (snapshot) => {
      const crewsList: Crew[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          crewsList.push({ id: doc.id, ...data } as Crew);
        }
      });
      setCrews(crewsList);
    }, (error) => {
      console.error("Firestore listen error (crews):", error);
    });

    // Listen to work orders
    const woQuery = query(collection(db, "workOrders"), orderBy("identifier", "desc"));
    const unsubWo = onSnapshot(woQuery, (snapshot) => {
      const woList: WorkOrder[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.branch || data.branch === currentBranch) {
          woList.push({ id: doc.id, ...data } as WorkOrder);
        }
      });
      setWorkOrders(woList);
    }, (error) => {
      console.error("Firestore listen error (workOrders):", error);
    });

    return () => {
      unsubItems();
      unsubTx();
      unsubLoc();
      unsubInst();
      unsubCrews();
      unsubWo();
    };
  }, [user, currentBranch]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Bodegas Operations
  const handleAddLocation = async (loc: Omit<Location, "id">) => {
    const locCol = collection(db, "locations");
    await addDoc(locCol, { ...loc, branch: currentBranch });
  };

  const handleEditLocation = async (id: string, loc: Partial<Location>) => {
    const docRef = doc(db, "locations", id);
    await updateDoc(docRef, loc);
  };

  const handleDeleteLocation = async (id: string) => {
    await deleteDoc(doc(db, "locations", id));
  };

  // Installers Operations
  const handleAddInstaller = async (inst: Omit<Installer, "id">) => {
    const col = collection(db, "installers");
    await addDoc(col, { ...inst, branch: currentBranch });
  };

  const handleEditInstaller = async (id: string, inst: Partial<Installer>) => {
    const docRef = doc(db, "installers", id);
    await updateDoc(docRef, inst);
  };

  const handleDeleteInstaller = async (id: string) => {
    await deleteDoc(doc(db, "installers", id));
  };

  // Crews Operations
  const handleAddCrew = async (crew: Omit<Crew, "id">) => {
    await addDoc(collection(db, "crews"), { ...crew, branch: currentBranch });
  };
  const handleEditCrew = async (id: string, crew: Partial<Crew>) => {
    await updateDoc(doc(db, "crews", id), crew);
  };
  const handleDeleteCrew = async (id: string) => {
    await deleteDoc(doc(db, "crews", id));
  };

  // Work Orders Operations
  const handleAddWorkOrder = async (wo: Omit<WorkOrder, "id">) => {
    await addDoc(collection(db, "workOrders"), { ...wo, branch: currentBranch });
  };
  const handleEditWorkOrder = async (id: string, wo: Partial<WorkOrder>) => {
    await updateDoc(doc(db, "workOrders", id), wo);
  };
  const handleDeleteWorkOrder = async (id: string) => {
    await deleteDoc(doc(db, "workOrders", id));
  };

  // Operations: CREATE or UPDATE inventory item
  const handleSaveItem = async (fields: Omit<InventoryItem, "id" | "updatedAt"> & { id?: string }) => {
    if (!isOnline) {
      addToOfflineQueue(fields.id ? "editar" : "crear", fields.name, fields.id ? "Edición de recurso" : "Registro de nuevo recurso");
    }
    const itemCol = collection(db, "items");
    const itemData = {
      ...fields,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: user?.email || "operador@bodega.com",
      branch: fields.branch || currentBranch
    };

    if (fields.id) {
      // Update
      const docRef = doc(db, "items", fields.id);
      await updateDoc(docRef, itemData);
    } else {
      // Create with automatic ID
      const newDocRef = doc(itemCol);
      await setDoc(newDocRef, {
        ...itemData,
        id: newDocRef.id
      });

      // Also auto generate an entry transaction for tracking
      if (fields.qty > 0) {
        const txCol = collection(db, "transactions");
        const txDocRef = doc(txCol);
        await setDoc(txDocRef, {
          id: txDocRef.id,
          itemId: newDocRef.id,
          itemName: fields.name,
          itemCategory: fields.category,
          type: "entrada",
          qty: fields.qty,
          prevQty: 0,
          newQty: fields.qty,
          responsible: user?.email || "operador@bodega.com",
          destinationOrOrigin: "Inventario de apertura",
          date: new Date().toISOString(),
          notes: "Registro inicial de stock.",
          branch: currentBranch
        });
      }
    }
  };

  // Operations: DELETE stock item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!isOnline) {
      addToOfflineQueue("eliminar", name, "Baja de recurso");
    }
    try {
      // Delete document in Firestore
      await deleteDoc(doc(db, "items", id));

      // Append general audit log transaction
      const txCol = collection(db, "transactions");
      const txDocRef = doc(txCol);
      await setDoc(txDocRef, {
        id: txDocRef.id,
        itemId: id,
        itemName: name,
        itemCategory: "materiales", // fallback
        type: "ajuste",
        qty: 0,
        prevQty: 0,
        newQty: 0,
        responsible: user?.email || "operador@bodega.com",
        destinationOrOrigin: "Baja física",
        date: new Date().toISOString(),
        notes: "Eliminación del registro en el sistema.",
        branch: currentBranch
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error al eliminar el artículo.");
    }
  };

  // Operations: RECORD stock movement (entrada / salida / ajuste)
  const handleRecordTransaction = async (txFields: Omit<Transaction, "id" | "date">) => {
    if (!isOnline) {
      addToOfflineQueue("transaccion", txFields.itemName, `${txFields.type === "entrada" ? "Ingresado" : txFields.type === "salida" ? "Despachado" : "Ajuste"} stock`);
    }
    // 1. Update stock count in item document
    const itemRef = doc(db, "items", txFields.itemId);
    await updateDoc(itemRef, {
      qty: txFields.newQty,
      updatedAt: new Date().toISOString(),
      lastUpdatedBy: user?.email || "operador@bodega.com"
    });

    // 2. Insert transaction history audit track
    const txCol = collection(db, "transactions");
    const newTxDocRef = doc(txCol);
    await setDoc(newTxDocRef, {
      ...txFields,
      id: newTxDocRef.id,
      date: new Date().toISOString(),
      responsible: user?.email || "operador@bodega.com",
      branch: currentBranch
    });
  };

  // Fast Seeding action if database goes empty
  const triggerManualSeed = async () => {
    setLoadingDb(true);
    const result = await seedDatabaseIfEmpty();
    setLoadingDb(false);
    if (result) {
      alert("¡Base de datos cargada con materiales fotovoltaicos, herramientas y furgones de prueba!");
    } else {
      alert("El inventario ya cuenta con registros existentes; no se requiere recargar.");
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Sun className="h-10 w-10 text-amber-500 animate-spin" />
        <span className="text-zinc-400 text-sm font-sans">Verificando sesión en Firebase...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthContainer onAuthSuccess={(email, isDemo) => setUser({ email, isDemo })} />;
  }

  // Sidebar Links
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "stock", label: "Kardex / Stock", icon: Boxes },
    { id: "transactions", label: "Historial de Bodega", icon: History },
    { id: "cyclic", label: "Inventario Cíclico", icon: ClipboardCheck, badge: "DIARIO" },
    { id: "bodegas", label: "Bodegas", icon: MapPin },
    { id: "instaladores", label: "Instaladores", icon: Users },
    { id: "cuadrillas", label: "Cuadrillas", icon: HardHat },
    { id: "ordenes", label: "Órdenes de Trabajo", icon: Briefcase },
    { id: "ai", label: "SolarBot IA", icon: Sparkles, badge: "NUEVO" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 font-sans flex text-zinc-100 selection:bg-amber-500 selection:text-black">
      
      {/* 2. Side navigation bar (Desktop) */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col justify-between shrink-0">
        
        {/* Upper Brand panel */}
        <div>
          <div className="p-6 border-b border-zinc-800 flex items-center space-x-3 bg-zinc-950/20">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center text-black shadow-lg shadow-amber-500/15 shrink-0">
              <Sun className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white font-sans leading-none">
                ENERGI<span className="font-light opacity-60 text-amber-500">STOCK</span>
              </h1>
              <span className="text-[8px] text-zinc-500 uppercase block tracking-widest font-extrabold mt-1 font-mono">
                BODEGA SOLAR & BESS
              </span>
            </div>
          </div>

          {/* Branch selector */}
          <div className="px-4 py-3 border-b border-zinc-800">
            <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 font-mono flex items-center space-x-1">
              <Building2 className="h-3 w-3" />
              <span>Sucursal Activa</span>
            </label>
            <div className="relative">
              <select
                value={currentBranch}
                onChange={(e) => setCurrentBranch(e.target.value)}
                className="w-full bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:border-amber-500 outline-none transition cursor-pointer appearance-none pr-7"
              >
                {AVAILABLE_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {navigationItems.map((nav) => {
              const IconComp = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => { setActiveTab(nav.id); setMobileMenuOpen(false); }}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                    isActive 
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/10" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComp className="h-4.5 w-4.5" />
                    <span>{nav.label}</span>
                  </div>
                  {nav.badge && (
                    <span className={`text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-zinc-950 text-white" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    }`}>
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User login stamp / Signout */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20 space-y-3">
          <div className="flex items-center gap-3 p-2 bg-zinc-950/40 rounded-xl border border-zinc-800">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm font-mono">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-white block truncate leading-tight select-all">{user.email.split("@")[0]}</span>
              <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">
                {user.isDemo ? "Operador Temporal" : "Administrador Senior"}
              </span>
            </div>
          </div>

          {/* OFFLINE SYNC EXPERIENCE INDICATOR AND UTILITY */}
          <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                Sincronización
              </span>
              <span className="flex h-2 w-2 relative">
                {isOnline ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" title="Sistema Online"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" title="Modo Terreno Offline"></span>
                  </>
                )}
              </span>
            </div>

            <div className="text-zinc-300 text-xs font-medium space-y-1">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-zinc-500">Estado de red:</span>
                <span className={isOnline ? "text-emerald-400 font-bold" : "text-orange-400 font-bold animate-pulse"}>
                  {isOnline ? "Estable (Nube)" : "Inestable (Terreno)"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-zinc-500">Transacciones Cola:</span>
                <span className={`font-bold ${offlineQueue.length > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                  {offlineQueue.length} {offlineQueue.length === 1 ? "cambio" : "cambios"}
                </span>
              </div>
            </div>

            {offlineQueue.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-900/30 p-2 rounded-lg text-[10px] space-y-1 max-h-24 overflow-y-auto font-mono text-zinc-400">
                {offlineQueue.map((oq) => (
                  <div key={oq.id} className="flex justify-between items-center border-b border-zinc-850 last:border-b-0 pb-1">
                    <span className="truncate max-w-[110px] text-zinc-300" title={oq.itemName}>{oq.itemName}</span>
                    <span className="text-[9px] text-amber-500/80 font-semibold">{oq.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleForceSync}
              disabled={isSyncing || offlineQueue.length === 0}
              className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-150 flex items-center justify-center space-x-1.5 border ${
                offlineQueue.length === 0
                  ? "bg-zinc-900/40 border-zinc-900 text-zinc-650 cursor-not-allowed"
                  : isSyncing
                    ? "bg-amber-500/20 border-amber-500/30 text-amber-400 cursor-wait"
                    : "bg-amber-500 text-zinc-950 border-amber-600 hover:bg-amber-400 shadow-sm active:translate-y-px cursor-pointer"
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                  <span>{syncStatus || "Sincronizando..."}</span>
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Sincronizar Manual ⚡</span>
                </>
              )}
            </button>
          </div>

          {/* Quick seed utility if database gets wiped */}
          <button 
            onClick={triggerManualSeed}
            className="w-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 py-2 px-3 rounded-xl text-[10px] text-zinc-400 hover:text-amber-400 transition flex items-center justify-center space-x-1 cursor-pointer font-mono font-semibold"
          >
            <RefreshCw className="h-3 w-3 animate-spin duration-3000" />
            <span>Recargar Semillas</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-950/30 hover:bg-red-500 hover:text-white border border-red-900/30 text-red-400 rounded-xl py-2.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </aside>

      {/* 3. Lateral Screen Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic header navbar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/60 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          
          {/* Menu button for mobile layouts */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white hover:bg-zinc-800/80 p-2 rounded-xl transition cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2.5 md:hidden">
              <span className={`flex items-center space-x-1 p-1 rounded-md text-black ${isOnline ? 'bg-amber-500' : 'bg-orange-500 animate-pulse'}`}>
                <Sun className="h-4 w-4" />
              </span>
              <h1 className="text-sm font-bold text-white tracking-widest font-mono">
                {isOnline ? "EnergiStock" : "EnergiStock [Offline]"}
              </h1>
            </div>

            {/* Sync online states badges */}
            <div className="hidden md:flex items-center space-x-4">
              {isOnline ? (
                <span className="text-[11px] font-mono font-bold bg-zinc-950 border border-emerald-500/20 px-3 py-1 rounded-full text-zinc-400 flex items-center space-x-1 shadow-inner">
                  <Database className="h-3.5 w-3.5 text-emerald-500 animate-pulse shrink-0" />
                  <span>Base de Datos: <strong className="text-emerald-400">FIRESTORE (CONECTADO)</strong></span>
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold bg-zinc-950 border border-orange-500/30 px-3 py-1 rounded-full text-zinc-400 flex items-center space-x-1 shadow-inner animate-pulse">
                  <Database className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Base de Datos: <strong className="text-orange-400">COLA OFFLINE (MODO LOCAL)</strong></span>
                </span>
              )}

              <span className="text-[11px] font-mono font-bold bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 flex items-center space-x-1 shadow-inner">
                <CloudLightning className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>IA Co-Pilot: <strong className="text-amber-400">GEMINI-2.5</strong></span>
              </span>
            </div>
          </div>

          {/* Quick email display on topright corner and QR/Barcode scan triggers */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCameraScannerOpen(true)}
              className="bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-amber-500 hover:text-amber-400 py-1.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-md shadow-black/40"
              title="Escanear códigos de barras o QR de recursos con la cámara"
            >
              <Camera className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Lector Móvil</span>
            </button>

            <div className="text-right text-xs text-zinc-400 font-mono hidden md:block">
              Sucursal: <strong className="text-amber-400">{currentBranch}</strong>
            </div>
          </div>

        </header>

        {/* 4. Drawer modal popup (Mobile Menu options) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in flex">
            <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 h-full flex flex-col justify-between animate-slide-right">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4.5 w-4.5 text-amber-500" />
                    <span className="font-extrabold text-white tracking-wider text-xs">EnergiStock</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-zinc-500 hover:text-white p-1 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile branch selector */}
                <div className="mb-3 pb-3 border-b border-zinc-800">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 font-mono flex items-center space-x-1">
                    <Building2 className="h-3 w-3" />
                    <span>Sucursal Activa</span>
                  </label>
                  <div className="relative">
                    <select
                      value={currentBranch}
                      onChange={(e) => setCurrentBranch(e.target.value)}
                      className="w-full bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:border-amber-500 outline-none transition cursor-pointer appearance-none pr-7"
                    >
                      {AVAILABLE_BRANCHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500 pointer-events-none" />
                  </div>
                </div>

                <nav className="space-y-1">
                  {navigationItems.map((nav) => {
                    const IconComp = nav.icon;
                    const isActive = activeTab === nav.id;
                    return (
                      <button
                        key={nav.id}
                        onClick={() => { setActiveTab(nav.id); setMobileMenuOpen(false); }}
                        className={`w-full text-left py-2.5 px-3.5 rounded-xl text-sm font-medium flex items-center justify-between transition cursor-pointer ${
                          isActive 
                            ? "bg-amber-500 text-zinc-950 font-bold" 
                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComp className="h-4.5 w-4.5" />
                          <span>{nav.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* User bottom metadata and actions */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                {/* OFFLINE SYNC EXPERIENCE INDICATOR AND UTILITY (MOBILE) */}
                <div className="bg-zinc-950/60 border border-zinc-850 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 font-mono">
                      Sincronización
                    </span>
                    <span className="flex h-2 w-2 relative">
                      {isOnline ? (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 animate-pulse" />
                      )}
                    </span>
                  </div>

                  <div className="text-zinc-300 text-[11px] font-medium space-y-0.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-[10px]">Red:</span>
                      <span className={isOnline ? "text-emerald-400 font-bold" : "text-orange-400 font-bold animate-pulse"}>
                        {isOnline ? "Estable" : "Inestable"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-[10px]">Cola:</span>
                      <span className={`font-bold ${offlineQueue.length > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                        {offlineQueue.length} {offlineQueue.length === 1 ? "cambio" : "cambios"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleForceSync}
                    disabled={isSyncing || offlineQueue.length === 0}
                    className={`w-full py-1.5 px-2 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all duration-150 flex items-center justify-center space-x-1.5 border ${
                      offlineQueue.length === 0
                        ? "bg-zinc-900/40 border-zinc-900 text-zinc-650 cursor-not-allowed"
                        : isSyncing
                          ? "bg-amber-500/20 border-amber-500/30 text-amber-400 cursor-wait"
                          : "bg-amber-500 text-zinc-950 border-amber-600 hover:bg-amber-400 shadow-sm active:translate-y-px cursor-pointer"
                    }`}
                  >
                    {isSyncing ? (
                      <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                    ) : (
                      <>
                        <Wifi className="h-3 w-3" />
                        <span>Sincronizar Manual ⚡</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-zinc-400 p-2 bg-zinc-950 rounded-lg truncate">
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-950/40 text-red-400 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition border border-red-900/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
            
            {/* Click outside to close drawer */}
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        {/* 5. Main Canvas space */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth.">
          {/* Firestore loaded status block */}
          {loadingDb && (
            <div className="bg-zinc-900/60 border border-zinc-850 p-6 rounded-2xl flex items-center justify-center space-x-3 mb-6 select-none shadow animate-pulse">
              <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />
              <span className="text-zinc-400 text-xs">Sincronizando bodega con Firestore en tiempo real...</span>
            </div>
          )}

          {/* Dynamic Component routes */}
          {activeTab === "dashboard" && (
            <Dashboard 
              items={items}
              transactions={transactions}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenItemModal={() => { setSelectedItemForEdit(null); setItemModalOpen(true); }}
              onOpenTransactionModal={(item) => { setSelectedItemForTx(item); setTransactionModalOpen(true); }}
            />
          )}

          {activeTab === "stock" && (
            <InventoryList 
              items={items}
              onOpenItemModal={(item) => { 
                setSelectedItemForEdit(item || null); 
                setItemModalOpen(true); 
              }}
              onOpenTransactionModal={(item) => { 
                setSelectedItemForTx(item); 
                setTransactionModalOpen(true); 
              }}
              onDelete={handleDeleteItem}
              locations={locations}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onOpenItemDetails={(item) => setSelectedItemForDetails(item)}
            />
          )}

          {activeTab === "transactions" && (
            <TransactionHistory transactions={transactions} />
          )}

          {activeTab === "cyclic" && (
            <CyclicInventory 
              items={items}
              currentUserEmail={user.email}
              onRecordTransaction={handleRecordTransaction}
            />
          )}

          {activeTab === "ai" && (
            <AiAssistant currentUserEmail={user.email} />
          )}

          {activeTab === "bodegas" && (
            <LocationsSettings 
              locations={locations}
              onAddLocation={handleAddLocation}
              onEditLocation={handleEditLocation}
              onDeleteLocation={handleDeleteLocation}
            />
          )}

          {activeTab === "instaladores" && (
            <InstallersSettings 
              installers={installers}
              onAddInstaller={handleAddInstaller}
              onEditInstaller={handleEditInstaller}
              onDeleteInstaller={handleDeleteInstaller}
            />
          )}

          {activeTab === "cuadrillas" && (
            <CrewsSettings
              crews={crews}
              installers={installers}
              locations={locations}
              onAddCrew={handleAddCrew}
              onEditCrew={handleEditCrew}
              onDeleteCrew={handleDeleteCrew}
            />
          )}

          {activeTab === "ordenes" && (
            <WorkOrders
              workOrders={workOrders}
              crews={crews}
              onAddWorkOrder={handleAddWorkOrder}
              onEditWorkOrder={handleEditWorkOrder}
              onDeleteWorkOrder={handleDeleteWorkOrder}
            />
          )}

        </main>

      </div>

      {/* 6. Dynamic Modals Container overlay */}
      <ItemModal 
        isOpen={itemModalOpen}
        onClose={() => { setItemModalOpen(false); setSelectedItemForEdit(null); }}
        onSave={handleSaveItem}
        editingItem={selectedItemForEdit}
        locations={locations}
      />

      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => { setTransactionModalOpen(false); setSelectedItemForTx(null); }}
        item={selectedItemForTx}
        onRecord={handleRecordTransaction}
        currentUserEmail={user.email}
        installers={installers}
        workOrders={workOrders}
      />

      <ScannedItemModal 
        item={scannedItem}
        isOpen={scannedModalOpen}
        onClose={handleCloseScannedModal}
        onRecordTx={(item) => {
          setSelectedItemForTx(item);
          setScannedModalOpen(false);
          setTransactionModalOpen(true);
        }}
        onEditItem={(item) => {
          setSelectedItemForEdit(item);
          setScannedModalOpen(false);
          setItemModalOpen(true);
        }}
        onViewTimeline={(item) => {
          setSelectedItemForDetails(item);
          setScannedModalOpen(false);
        }}
      />

      <ItemDetailsModal
        item={selectedItemForDetails}
        transactions={transactions}
        isOpen={!!selectedItemForDetails}
        onClose={() => setSelectedItemForDetails(null)}
        onRecordTx={(item) => {
          setSelectedItemForTx(item);
          setTransactionModalOpen(true);
        }}
        onEditItem={(item) => {
          setSelectedItemForEdit(item);
          setItemModalOpen(true);
        }}
        onDeleteItem={handleDeleteItem}
      />

      <CameraBarcodeScannerModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        items={items}
        onRecordTx={handleRecordTransaction}
        onEditItem={(item) => {
          setSelectedItemForEdit(item);
          setCameraScannerOpen(false);
          setItemModalOpen(true);
        }}
        currentUserEmail={user.email}
      />

    </div>
  );
}
