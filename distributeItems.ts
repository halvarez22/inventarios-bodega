import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
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

async function run() {
  console.log("Distribuyendo items equitativamente en bodegas...");
  const locSnapshot = await getDocs(collection(db, "locations"));
  const locs = locSnapshot.docs.map(d => d.data().name);

  if (locs.length === 0) {
    console.error("No hay bodegas registradas. Por favor crea bodegas primero en la app.");
    process.exit(1);
  }

  const itemsSnapshot = await getDocs(collection(db, "items"));
  const items = itemsSnapshot.docs;

  // Shuffle items for better randomization
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  let locIndex = 0;
  let updatedCount = 0;
  for (const itemDoc of items) {
    const locName = locs[locIndex];
    const ref = doc(db, "items", itemDoc.id);
    await updateDoc(ref, { location: locName });
    console.log(`Asignado [${itemDoc.data().name}] a la bodega [${locName}]`);
    locIndex = (locIndex + 1) % locs.length;
    updatedCount++;
  }
  
  console.log(`Distribución completada exitosamente. ${updatedCount} items actualizados.`);
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
