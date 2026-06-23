import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";

// Initialize Firebase using Vite environment variables (set in Vercel / .env.local)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initial inventory data to seed if db is empty
const INITIAL_SEED_ITEMS = [
  // 1. Materiales (Materiales Fotovoltaicos, Beterías BESS, Iluminación)
  {
    sku: "PV-PAN-550W",
    name: "Panel Solar Monocristalino 550W Tier 1",
    category: "materiales",
    subcategory: "Sistemas Fotovoltaicos",
    qty: 120,
    unit: "unidades",
    location: "Estantería A-1 (Área Solar)",
    minQty: 20,
    description: "Módulo fotovoltaico de alta eficiencia con tecnología PERC de media celda, ideal para proyectos residenciales e industriales.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "PV-INV-HYB-10K",
    name: "Inversor Híbrido Trifásico 10kW",
    category: "materiales",
    subcategory: "Sistemas Fotovoltaicos",
    qty: 15,
    unit: "unidades",
    location: "Estantería A-2 (Área Inversores)",
    minQty: 4,
    description: "Inversor híbrido de 10kW con soporte para inyección a red y baterías de litio, eficiencia superior al 98%.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "BESS-LFP-5KWH",
    name: "Módulo de Batería de Litio LFP 48V 5.12kWh",
    category: "materiales",
    subcategory: "Sistemas de Baterías BESS",
    qty: 24,
    unit: "unidades",
    location: "Bodega Climatizada B-1",
    minQty: 6,
    description: "Batería de fosfato de hierro y litio (LiFePO4) montable en rack, con BMS inteligente integrado para larga duración (6000 ciclos).",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "BESS-MS-100KWH",
    name: "Gabinete BESS Comercial Containerizado 100kWh",
    category: "materiales",
    subcategory: "Sistemas de Baterías BESS",
    qty: 2,
    unit: "unidades",
    location: "Patio Trasero Secado A",
    minQty: 1,
    description: "Solución de almacenamiento de energía comercial de gran escala en gabinete exterior IP55, enfriamiento activo inteligente incorporado.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "LGT-ST-100W-SOL",
    name: "Luminaria Suburbana LED Solar 100W Autónoma",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 45,
    unit: "unidades",
    location: "Estantería C-1 (Área Iluminación)",
    minQty: 10,
    description: "Foco led para alumbrado público con panel solar monocristalino integrado, sensor de movimiento y batería de litio interna.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "LGT-FL-150W-IND",
    name: "Reflector Industrial High Bay LED 150W IP66",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 60,
    unit: "unidades",
    location: "Estantería C-2 (Área Iluminación)",
    minQty: 12,
    description: "Reflector industrial de alta eficiencia, 21,000 lúmenes, resistente a polvo y agua, ideal para naves industriales y bodegas.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "CAB-SOL-4MM-RED",
    name: "Cable Fotovoltaico XLPE 4mm² Rojo",
    category: "materiales",
    subcategory: "Cables y Accesorios",
    qty: 800,
    unit: "metros",
    location: "Estantería D-1 (Carretes)",
    minQty: 200,
    description: "Cable solar de cobre estañado ultra-flexible, resistente a rayos UV e intemperie clase TUV 1500V.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "ACC-M4-CONN",
    name: "Conectores MC4 Macho/Hembra IP68",
    category: "materiales",
    subcategory: "Cables y Accesorios",
    qty: 350,
    unit: "pares",
    location: "Cajonera E-3",
    minQty: 50,
    description: "Conector fotovoltaico rápido estándar, para cables de 2.5mm² a 6.0mm² con traba de seguridad.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },

  // 2. Herramientas
  {
    sku: "HTA-MULT-FLUKE",
    name: "Multímetro Digital Especializado Fluke 115",
    category: "herramientas",
    subcategory: "Medición Eléctrica",
    qty: 8,
    unit: "unidades",
    location: "Garantía e Instrumentos Box-2",
    minQty: 2,
    description: "Multímetro compacto de verdadero valor eficaz (RMS) para técnicos de servicio de campo y sistemas de potencia.",
    status: "buen estado",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "HTA-CRIMP-MC4",
    name: "Crimpadora Profesional para Conectores MC4",
    category: "herramientas",
    subcategory: "Prensas y Alicates",
    qty: 12,
    unit: "unidades",
    location: "Caja de Herramientas Especiales",
    minQty: 3,
    description: "Pinza ponchadora con matraca para engastado de terminales fotovoltaicas standard de 2.5/4/6 mm².",
    status: "buen estado",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "HTA-TERMO-FLIR",
    name: "Cámara Termográfica FLIR TG165-X",
    category: "herramientas",
    subcategory: "Medición Eléctrica",
    qty: 3,
    unit: "unidades",
    location: "Garantía e Instrumentos Box-1",
    minQty: 1,
    description: "Cámara térmica para inspección visual e identificación de puntos calientes en paneles fotovoltaicos y tableros eléctricos.",
    status: "buen estado",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },

  // 3. Unidades Móviles
  {
    sku: "VEH-FUR-01",
    name: "Furgón de Carga Peugeot Partner Max 2024",
    category: "unidades_moviles",
    subcategory: "Distribución Ligera",
    qty: 1,
    unit: "unidades",
    location: "Estacionamiento Bodega A",
    minQty: 1,
    description: "Furgón utilitario utilizado para traslados y repartos express de paneles, materiales de iluminación y kits solares residenciales.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  },
  {
    sku: "VEH-CAM-02",
    name: "Camioneta de Carga Mediana Ford F-350 Turbodiesel",
    category: "unidades_moviles",
    subcategory: "Carga Pesada",
    qty: 1,
    unit: "unidades",
    location: "Estacionamiento Bodega B",
    minQty: 1,
    description: "Camioneta equipada con plataforma para entrega pesada, traslados de baterías BESS y estructuras metálicas de soporte.",
    status: "en ruta",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "sistema-seed@stock.com"
  }
];

// Helper to seed database if empty
export async function seedDatabaseIfEmpty() {
  try {
    const itemsCol = collection(db, "items");
    const snapshot = await getDocs(itemsCol);
    if (snapshot.empty) {
      console.log("Database is empty, seeding default items...");
      const idMap: { [sku: string]: string } = {};

      for (const item of INITIAL_SEED_ITEMS) {
        // Create auto doc ref
        const docRef = doc(itemsCol);
        await setDoc(docRef, {
          ...item,
          id: docRef.id
        });
        idMap[item.sku] = docRef.id;
        console.log(`Seeded item: ${item.name} (${docRef.id})`);
      }

      // Also let's seed some sample transactions to populate history
      const txCol = collection(db, "transactions");
      const sampleTx = [
        {
          itemId: idMap["PV-PAN-550W"] || "1",
          itemName: "Panel Solar Monocristalino 550W Tier 1",
          itemCategory: "materiales",
          type: "entrada",
          qty: 100,
          prevQty: 20,
          newQty: 120,
          responsible: "bodega@company.com",
          destinationOrOrigin: "Llegada Buque Proveedor Jinko Solar",
          date: new Date(Date.now() - 36 * 3600000).toISOString(), // 36h ago
          notes: "Ingreso de stock correspondiente a importación trimestral."
        },
        {
          itemId: idMap["BESS-LFP-5KWH"] || "2",
          itemName: "Módulo de Batería de Litio LFP 48V 5.12kWh",
          itemCategory: "materiales",
          type: "salida",
          qty: 4,
          prevQty: 28,
          newQty: 24,
          responsible: "supervisor.obras@company.com",
          destinationOrOrigin: "Proyecto Parque Solar Copiapó",
          date: new Date(Date.now() - 12 * 3600000).toISOString(), // 12h ago
          notes: "Despacho autorizado para ampliación banco de baterías en sistema backup aislante."
        },
        {
          itemId: idMap["HTA-MULT-FLUKE"] || "3",
          itemName: "Multímetro Digital Especializado Fluke 115",
          itemCategory: "herramientas",
          type: "ajuste",
          qty: 1,
          prevQty: 7,
          newQty: 8,
          responsible: "bodega@company.com",
          destinationOrOrigin: "Bodega General",
          date: new Date(Date.now() - 2 * 3600000).toISOString(), // 2h ago
          notes: "Ajuste físico de stock tras inventario mensual. Se encontró equipo traspapelado."
        }
      ];

      for (const tx of sampleTx) {
        const txRef = doc(txCol);
        await setDoc(txRef, {
          ...tx,
          id: txRef.id
        });
      }

      console.log("Database seeded successfully!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}
