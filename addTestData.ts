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

const NEW_ITEMS = [
  // 5 Luminarias de Interiores
  {
    sku: "LGT-INT-P60X60",
    name: "Panel LED Embutir 60x60 40W Luz Fría",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 150,
    unit: "unidades",
    location: "Estantería Iluminación A-1",
    minQty: 30,
    description: "Panel LED ultra delgado ideal para oficinas y cielos falsos.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-INT-PLAF18W",
    name: "Plafón LED Sobreponer 18W Redondo",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 200,
    unit: "unidades",
    location: "Estantería Iluminación A-2",
    minQty: 50,
    description: "Plafón redondo para sobreponer en techos de concreto o yeso.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-INT-E27-12W",
    name: "Foco LED E27 12W Bulbo A60",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 500,
    unit: "unidades",
    location: "Cajonera Iluminación",
    minQty: 100,
    description: "Foco tradicional LED de 12W, ahorro energético.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-INT-T8-18W",
    name: "Tubo LED T8 18W 1.2m Vidrio",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 300,
    unit: "unidades",
    location: "Estantería Iluminación A-3",
    minQty: 80,
    description: "Tubo LED de reemplazo directo para tubos fluorescentes de 36W.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-INT-HB-150W",
    name: "Campana LED Industrial High Bay 150W",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 40,
    unit: "unidades",
    location: "Estantería Iluminación B-1",
    minQty: 10,
    description: "Luminaria colgante industrial tipo UFO para galpones e interiores altos.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },

  // 5 Luminarias de Alumbrado Público
  {
    sku: "LGT-EXT-VIAL100W",
    name: "Luminaria LED Vial 100W IP65",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 85,
    unit: "unidades",
    location: "Estantería Exterior C-1",
    minQty: 20,
    description: "Luminaria de alumbrado público estándar, protección IP65 contra intemperie.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-EXT-SOL200W",
    name: "Foco Solar Autónomo 200W con Sensor",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 60,
    unit: "unidades",
    location: "Estantería Exterior C-2",
    minQty: 15,
    description: "All-in-one solar vial. Panel, batería de litio y placa LED integrados.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-EXT-COB150W",
    name: "Luminaria Vial COB 150W 5000K",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 45,
    unit: "unidades",
    location: "Estantería Exterior C-3",
    minQty: 10,
    description: "Luminaria de calle de alta potencia con tecnología Chip on Board (COB).",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-EXT-PARQ50W",
    name: "Farol LED Clásico para Parques 50W",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 25,
    unit: "unidades",
    location: "Estantería Exterior D-1",
    minQty: 5,
    description: "Farol decorativo LED para plazas, parques y condominios.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  },
  {
    sku: "LGT-EXT-PROY250W",
    name: "Proyector LED Asimétrico 250W",
    category: "materiales",
    subcategory: "Iluminación",
    qty: 30,
    unit: "unidades",
    location: "Estantería Exterior D-2",
    minQty: 8,
    description: "Proyector de área de gran alcance, ideal para canchas deportivas o patios de maniobra.",
    status: "disponible",
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "admin@empresa.com"
  }
];

async function run() {
  console.log("Iniciando carga secundaria de datos de prueba...");
  const itemsCol = collection(db, "items");
  
  for (const item of NEW_ITEMS) {
    await addDoc(itemsCol, item);
    console.log("Agregado: " + item.name);
  }
  
  console.log("Carga completada.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
