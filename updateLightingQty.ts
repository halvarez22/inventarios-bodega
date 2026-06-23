import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
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
  console.log("Ajustando stock de iluminación...");
  const itemsCol = collection(db, "items");
  const q = query(itemsCol, where("subcategory", "==", "Iluminación"));
  const snapshot = await getDocs(q);

  let i = 1;
  for (const itemDoc of snapshot.docs) {
    const ref = doc(db, "items", itemDoc.id);
    const newQty = 4 + (i % 4); // values: 5, 6, 7, 4
    await updateDoc(ref, { qty: newQty });
    console.log(`Actualizado: ${itemDoc.data().name} a cantidad ${newQty}`);
    i++;
  }
  
  console.log("Ajuste completado.");
  process.exit(0);
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
