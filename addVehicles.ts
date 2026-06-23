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

const NEW_VEHICLES = [
  {
    name: "Camioneta Nissan KMT-45",
    description: "Camioneta doble cabina roja 4x4",
    type: "vehiculo"
  },
  {
    name: "Furgón Peugeot RTY-99",
    description: "Furgón cerrado blanco, para material delicado",
    type: "vehiculo"
  },
  {
    name: "Camión Grúa Hyundai BVC-12",
    description: "Camión 3/4 con pluma para postes",
    type: "vehiculo"
  }
];

async function run() {
  console.log("Iniciando carga de vehículos de prueba...");
  const locCol = collection(db, "locations");
  
  for (const v of NEW_VEHICLES) {
    await addDoc(locCol, v);
    console.log("Agregado vehículo: " + v.name);
  }
  
  console.log("Carga completada.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
