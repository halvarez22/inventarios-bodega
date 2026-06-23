import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fbConfig from "./firebase-applet-config.json" with { type: "json" };

const firebaseConfig = {
  apiKey: fbConfig.apiKey,
  authDomain: fbConfig.authDomain,
  projectId: fbConfig.projectId,
  storageBucket: fbConfig.storageBucket,
  messagingSenderId: fbConfig.messagingSenderId,
  appId: fbConfig.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BRANCHES = ["Chihuahua", "Lagos de Moreno", "Cancún"];

// ─── BODEGAS POR SUCURSAL ───────────────────────────────────────────────────
const BODEGAS_TEMPLATE = [
  { name: "Bodega Principal", description: "Almacén central de materiales y herramientas", type: "bodega" },
  { name: "Bodega Secundaria", description: "Almacén de materiales de reserva y excedentes", type: "bodega" },
  { name: "Zona de Carga / Descarga", description: "Área de recepción y despacho de material", type: "zona" },
  { name: "Estante A – Luminarias", description: "Estantería para luminarias interiores y exteriores", type: "estante" },
  { name: "Estante B – Materiales Eléctricos", description: "Cables, conduits, canaletas y accesorios eléctricos", type: "estante" },
];

// ─── VEHÍCULOS POR SUCURSAL ─────────────────────────────────────────────────
const VEHICLES_TEMPLATES: Record<string, { name: string; description: string }[]> = {
  "Chihuahua": [
    { name: "Camioneta RAM 1500 CHI-001", description: "Pickup doble cabina blanca 4x4" },
    { name: "Furgón Peugeot Expert CHI-002", description: "Furgón cerrado, transporte de equipos frágiles" },
    { name: "Camión Grúa Ford F-350 CHI-003", description: "Camión 3/4 con pluma telescópica para postes" },
  ],
  "Lagos de Moreno": [
    { name: "Camioneta Hilux LM-001", description: "Pickup doble cabina negra 4x4" },
    { name: "Van Sprinter LM-002", description: "Van de carga de gran volumen para material en rollo" },
    { name: "Motocicleta Honda CB LM-003", description: "Moto para inspecciones y supervisión de ruta" },
  ],
  "Cancún": [
    { name: "Camioneta Ranger CUN-001", description: "Pickup cabina simple, uso en zonas costeras" },
    { name: "Furgón NV350 CUN-002", description: "Furgón refrigerado para baterías y electrónica sensible" },
    { name: "Buggy Eléctrico CUN-003", description: "Vehículo eléctrico para operaciones en zonas hoteleras" },
  ]
};

// ─── INSTALADORES POR SUCURSAL ──────────────────────────────────────────────
const INSTALLERS_TEMPLATES: Record<string, { name: string; rut: string; phone: string; email: string; company: string }[]> = {
  "Chihuahua": [
    { name: "Roberto Chávez", rut: "CHI-EMP-001", phone: "+52 614 100 2001", email: "r.chavez@energistock.mx", company: "Interno" },
    { name: "Miguel Flores", rut: "CHI-EMP-002", phone: "+52 614 100 2002", email: "m.flores@energistock.mx", company: "Interno" },
    { name: "Ernesto Vidal", rut: "CHI-CON-001", phone: "+52 614 100 2003", email: "evidal@contratista-norte.mx", company: "Contratista Norte" },
    { name: "Patricia Ríos", rut: "CHI-EMP-003", phone: "+52 614 100 2004", email: "p.rios@energistock.mx", company: "Interno" },
  ],
  "Lagos de Moreno": [
    { name: "Jesús Hernández", rut: "LM-EMP-001", phone: "+52 474 100 3001", email: "j.hernandez@energistock.mx", company: "Interno" },
    { name: "Raúl Gutiérrez", rut: "LM-EMP-002", phone: "+52 474 100 3002", email: "r.gutierrez@energistock.mx", company: "Interno" },
    { name: "Diana Morales", rut: "LM-CON-001", phone: "+52 474 100 3003", email: "dmorales@servicios-bajio.mx", company: "Servicios Bajío" },
    { name: "Alfredo Salinas", rut: "LM-EMP-003", phone: "+52 474 100 3004", email: "a.salinas@energistock.mx", company: "Interno" },
  ],
  "Cancún": [
    { name: "Jorge Pérez", rut: "CUN-EMP-001", phone: "+52 998 100 4001", email: "j.perez@energistock.mx", company: "Interno" },
    { name: "Sandra López", rut: "CUN-EMP-002", phone: "+52 998 100 4002", email: "s.lopez@energistock.mx", company: "Interno" },
    { name: "Marcos Castillo", rut: "CUN-CON-001", phone: "+52 998 100 4003", email: "mcastillo@caribe-service.mx", company: "Caribe Service" },
    { name: "Valeria Ruiz", rut: "CUN-EMP-003", phone: "+52 998 100 4004", email: "v.ruiz@energistock.mx", company: "Interno" },
  ]
};

// ─── HERRAMIENTAS (mismas para todas las sucursales, dist. aleatoria de qty) ─
function herramientas(branch: string, prefix: string) {
  const r = () => Math.floor(Math.random() * 6) + 1; // 1-6
  return [
    { sku: `${prefix}-TOOL-TALADRO`, name: "Taladro Percutor Bosch 850W", category: "herramientas", subcategory: "Electricidad", qty: r(), unit: "piezas", location: "Bodega Principal", minQty: 1, description: "Taladro de impacto profesional con maletín y brocas", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-FLEX`, name: "Esmeril Angular 4.5\" Dewalt", category: "herramientas", subcategory: "Corte", qty: r(), unit: "piezas", location: "Bodega Principal", minQty: 1, description: "Amoladora de 750W con guarda de seguridad", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-LLAV`, name: "Juego de Llaves Mixtas 12 pzas", category: "herramientas", subcategory: "Manual", qty: r() + 2, unit: "juegos", location: "Estante B – Materiales Eléctricos", minQty: 2, description: "Set de llaves de 8mm a 22mm acero cromo-vanadio", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-NIVEL`, name: "Nivel Láser Autonivelante", category: "herramientas", subcategory: "Medición", qty: r(), unit: "piezas", location: "Bodega Principal", minQty: 1, description: "Nivel láser de líneas cruzadas para instalaciones en altura", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-MULT`, name: "Multímetro Digital Fluke 115", category: "herramientas", subcategory: "Medición", qty: r() + 1, unit: "piezas", location: "Estante B – Materiales Eléctricos", minQty: 2, description: "Multímetro de campo con medición de tensión CA/CC y continuidad", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-EPP-CASCO`, name: "Casco de Seguridad Arnesado", category: "herramientas", subcategory: "EPP", qty: r() + 3, unit: "piezas", location: "Bodega Principal", minQty: 4, description: "Casco tipo II con arnés de 6 puntos y porta-linterna", status: "buen estado", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-TOOL-EPP-ARN`, name: "Arnés Anticaída Full Body", category: "herramientas", subcategory: "EPP", qty: r() + 2, unit: "piezas", location: "Bodega Principal", minQty: 3, description: "Arnés de cuerpo completo certificado ANSI Z359", status: "buen estado", updatedAt: new Date().toISOString(), branch },
  ];
}

// ─── STOCK / MATERIALES ──────────────────────────────────────────────────────
function stockMateriales(branch: string, prefix: string) {
  const q = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  return [
    { sku: `${prefix}-MAT-PANEL400`, name: "Panel Solar Monocristalino 400W", category: "materiales", subcategory: "Fotovoltaico", qty: q(10, 60), unit: "unidades", location: "Bodega Principal", minQty: 5, description: "Panel solar de alta eficiencia, marco de aluminio anodizado", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-INVERT5K`, name: "Inversor On-Grid 5kW Growatt", category: "materiales", subcategory: "Inversores", qty: q(2, 15), unit: "unidades", location: "Bodega Secundaria", minQty: 2, description: "Inversor monofásico con monitoreo WiFi integrado", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-BAT-LFP`, name: "Batería LiFePO4 100Ah 48V", category: "materiales", subcategory: "BESS", qty: q(4, 20), unit: "unidades", location: "Bodega Secundaria", minQty: 4, description: "Batería de litio-hierro-fosfato de ciclo profundo para almacenamiento", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-CABLE6`, name: "Cable Solar THSW-LS 6mm² (rollo 100m)", category: "materiales", subcategory: "Cableado", qty: q(5, 30), unit: "rollos", location: "Estante B – Materiales Eléctricos", minQty: 5, description: "Cable doble aislamiento UV-R para conexión de paneles solares", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-CONECTOR`, name: "Conectores MC4 Macho/Hembra (par)", category: "materiales", subcategory: "Cableado", qty: q(50, 300), unit: "pares", location: "Estante B – Materiales Eléctricos", minQty: 50, description: "Conectores estancos para panel solar, IP68", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-ESTRUC`, name: "Estructura Aluminio p/Panel (2 paneles)", category: "materiales", subcategory: "Estructuras", qty: q(10, 40), unit: "kits", location: "Zona de Carga / Descarga", minQty: 10, description: "Kit de montaje en techo inclinado, ajustable 15-35°", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-LUM-VIAL`, name: "Luminaria LED Vial 100W IP65", category: "materiales", subcategory: "Iluminación", qty: q(10, 50), unit: "unidades", location: "Estante A – Luminarias", minQty: 10, description: "Luminaria de alumbrado público, IP65 anticorrosión", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-LUM-CAMP`, name: "Campana LED Industrial 150W High Bay", category: "materiales", subcategory: "Iluminación", qty: q(5, 25), unit: "unidades", location: "Estante A – Luminarias", minQty: 5, description: "Luminaria UFO para galpones e interiores de gran altura", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-BREAKER`, name: "Breaker Bifásico 63A Schneider", category: "materiales", subcategory: "Eléctrico", qty: q(10, 50), unit: "unidades", location: "Estante B – Materiales Eléctricos", minQty: 10, description: "Interruptor termomagnético para tableros eléctricos residenciales", status: "disponible", updatedAt: new Date().toISOString(), branch },
    { sku: `${prefix}-MAT-CANALETA`, name: "Canaleta PVC 60x40mm (tramo 2m)", category: "materiales", subcategory: "Cableado", qty: q(20, 100), unit: "tramos", location: "Estante B – Materiales Eléctricos", minQty: 20, description: "Canaleta ranurada con tapa para instalaciones interiores", status: "disponible", updatedAt: new Date().toISOString(), branch },
  ];
}

// ─── PREFIJOS POR SUCURSAL ───────────────────────────────────────────────────
const PREFIX: Record<string, string> = {
  "Chihuahua": "CHI",
  "Lagos de Moreno": "LM",
  "Cancún": "CUN"
};

async function run() {
  for (const branch of BRANCHES) {
    const prefix = PREFIX[branch];
    console.log(`\n====  Cargando datos para SUCURSAL: ${branch}  ====`);

    // Bodegas
    for (const b of BODEGAS_TEMPLATE) {
      await addDoc(collection(db, "locations"), { ...b, branch });
      console.log(`  [Bodega] ${b.name}`);
    }
    // Vehículos
    for (const v of VEHICLES_TEMPLATES[branch]) {
      await addDoc(collection(db, "locations"), { ...v, type: "vehiculo", branch });
      console.log(`  [Vehículo] ${v.name}`);
    }
    // Instaladores
    for (const i of INSTALLERS_TEMPLATES[branch]) {
      await addDoc(collection(db, "installers"), { ...i, status: "activo", branch });
      console.log(`  [Instalador] ${i.name}`);
    }
    // Herramientas
    for (const h of herramientas(branch, prefix)) {
      await addDoc(collection(db, "items"), h);
      console.log(`  [Herramienta] ${h.name} (qty: ${h.qty})`);
    }
    // Stock / Materiales
    for (const m of stockMateriales(branch, prefix)) {
      await addDoc(collection(db, "items"), m);
      console.log(`  [Material] ${m.name} (qty: ${m.qty})`);
    }
  }

  console.log("\n✅ Carga completa para las 3 sucursales.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
