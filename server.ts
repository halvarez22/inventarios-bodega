import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Firebase inside the server context using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Lazy initialization of Groq API
let aiClient: Groq | null = null;
function getAi(): Groq {
  if (!aiClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("La variable de entorno GROQ_API_KEY es requerida y no está configurada.");
    }
    aiClient = new Groq({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Midlewares
  app.use(express.json());

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { prompt, history } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "El campo 'prompt' es requerido." });
        return;
      }

      // 1. Fetch current items from Firestore
      const itemsSnapshot = await getDocs(collection(db, "items"));
      const itemsData: any[] = [];
      itemsSnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() });
      });

      // 2. Fetch recent transactions from Firestore
      const txQuery = query(collection(db, "transactions"), orderBy("date", "desc"), limit(10));
      const txSnapshot = await getDocs(txQuery);
      const txData: any[] = [];
      txSnapshot.forEach((doc) => {
        txData.push({ id: doc.id, ...doc.data() });
      });

      // 3. Format items and transactions as context for Gemini
      const itemsContext = itemsData.map((item) => {
        const isLow = item.qty <= item.minQty;
        return `- [SKU: ${item.sku}] ${item.name} (${item.category === "unidades_moviles" ? "Unidad Móvil" : item.category}): Qty: ${item.qty} ${item.unit || "uds"}, MinIdeal: ${item.minQty}, Ubicación: "${item.location || "N/A"}", SubCategoría: "${item.subcategory || "N/A"}", Estado: "${item.status || "N/A"}" ${isLow ? "⚠️ (STOCK BAJO)" : ""}`;
      }).join("\n");

      const txContext = txData.map((tx) => {
        return `- ${tx.date.substring(0, 10)} | ${tx.type.toUpperCase()}: ${tx.qty} ${tx.itemName} por ${tx.responsible || "usuario"} -> Origen/Destino: "${tx.destinationOrOrigin || "N/A"}"`;
      }).join("\n");

      const finalContext = `
INFORMACIÓN DEL INVENTARIO DE LA BODEGA (TIEMPO REAL):
======================================================
${itemsContext || "No hay artículos en el inventario actualmente."}

ÚLTIMOS 10 MOVIMIENTOS REGISTRADOS:
==================================
${txContext || "No hay transacciones registradas todavía."}
      `;

      // 4. Initialize Gemini (will throw descriptive error if API key is missing)
      const ai = getAi();

      // Build history formatting for system instructions
      const systemInstruction = `
Eres SolarBot, el asistente experto en administración de inventarios para nuestra bodega técnica de sistemas fotovoltaicos, iluminación industrial y sistemas de almacenamiento por batería BESS (Battery Energy Storage Systems). 

Tu misión es resolver consultas sobre el inventario, stock, alertas y movimientos usando únicamente la información en tiempo real provista a continuación.

Reglas de respuesta:
1. Responde de manera profesional, estructurada y en ESPAÑOL.
2. Basate estrictamente en los datos de "INFORMACIÓN DEL INVENTARIO" y "ÚLTIMOS MOVIMIENTOS" provistos.
3. Si te preguntan por productos con bajo stock, lista aquellos que tienen la marca "⚠️ (STOCK BAJO)".
4. Si te preguntan por ubicaciones, sé preciso y nombra el pasillo, estantería o bodega climatizada indicada en la ficha del producto.
5. Si un artículo o consulta no figura en los datos, aclara amablemente que no posees registros de ese ítem en la base de datos actual.
6. Si te preguntan cosas informales o fuera del tema de inventarios, reconduce amablemente la conversación hacia la administración de la bodega.

Contexto actual del inventario:
${finalContext}
      `;

      // Formulate conversational structure
      const messages: any[] = [{ role: "system", content: systemInstruction }];
      
      if (Array.isArray(history)) {
        history.forEach((h: any) => {
          messages.push({
            role: h.role === "model" ? "assistant" : "user",
            content: h.content
          });
        });
      }

      messages.push({
        role: "user",
        content: prompt
      });

      // Call Groq API
      const completion = await ai.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || "No se pudo obtener una respuesta del asistente de IA.";
      res.json({ response: responseText });

    } catch (error: any) {
      console.error("Error en endpoint /api/ai-chat:", error);
      res.status(500).json({ 
        error: "Ocurrió un error al procesar tu consulta con la IA.",
        message: error.message || String(error)
      });
    }
  });

  // Serve static assets in production, otherwise spin up Vite development middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Corriendo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fallo al iniciar el servidor Express + Vite:", err);
});
