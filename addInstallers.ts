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

const NEW_INSTALLERS = [
  {
    name: "Pedro Soto",
    rut: "15.442.112-K",
    phone: "+56 9 1234 5678",
    email: "pedro.soto@empresa.com",
    company: "Interno",
    status: "activo"
  },
  {
    name: "Juan Pérez",
    rut: "12.345.678-9",
    phone: "+56 9 8765 4321",
    email: "juan.perez@contratista-sol.cl",
    company: "Contratista Soluciones Eléctricas",
    status: "activo"
  },
  {
    name: "Carlos Rivera",
    rut: "17.998.223-1",
    phone: "+56 9 5555 4444",
    email: "carlos.rivera@empresa.com",
    company: "Interno",
    status: "activo"
  },
  {
    name: "Luis Martínez",
    rut: "14.555.666-7",
    phone: "+56 9 1111 2222",
    email: "lmartinez@redes.cl",
    company: "Redes y Servicios Ltda",
    status: "activo"
  },
  {
    name: "Andrés Silva",
    rut: "19.888.777-6",
    phone: "+56 9 9999 8888",
    email: "asilva@empresa.com",
    company: "Interno",
    status: "activo"
  }
];

async function run() {
  console.log("Iniciando carga de instaladores de prueba...");
  const instCol = collection(db, "installers");
  
  for (const i of NEW_INSTALLERS) {
    await addDoc(instCol, i);
    console.log("Agregado instalador: " + i.name);
  }
  
  console.log("Carga completada.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
