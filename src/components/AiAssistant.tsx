import React, { useState, useRef, useEffect } from "react";
import { AssistantMessage } from "../types";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  Trash2, 
  AlertCircle, 
  Loader2,
  HelpCircle,
  TrendingDown
} from "lucide-react";

interface AiAssistantProps {
  currentUserEmail: string;
}

export default function AiAssistant({ currentUserEmail }: AiAssistantProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Hola! Soy **SolarBot** ☀️🤖, tu asistente logístico integrado con inteligencia artificial.\n\nTengo acceso de lectura directo a los registros de **Firestore en tiempo real**. Puedo darte resúmenes consolidados de existencias, alertarte sobre stock bajo, indicarte exactamente en qué estantería física se encuentra un repuesto o repasar las transacciones recientes.\n\n¿En qué te puedo ayudar hoy? Escribe tu consulta abajo o presiona uno de los atajos sugeridos.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Pre-made chips of Spanish queries requested
  const SUGGESTIONS = [
    { label: "🚨 Stock Crítico", query: "¿Qué materiales tienen stock crítico o están bajos actualmente?" },
    { label: "🔋 Ubicación Baterías BESS", query: "¿Dónde están las baterías de litio y qué capacidad tienen?" },
    { label: "🛠️ Herramientas Dañadas", query: "¿Hay herramientas registradas 'en reparación' o perdidas?" },
    { label: "🚛 Flota de Vehículos", query: "¿Cuál es el estado de las unidades móviles y camiones?" },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    setError("");
    
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build brief local history
      const formattedHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      })).slice(-8); // send last 8 messages as chat context

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: formattedHistory
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Error de servidor (${res.status})`);
      }

      const data = await res.json();
      
      const assistantMessage: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo comunicar con el asistente.");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: "Chat reiniciado. ¿En qué puedo ayudarte ahora? Pregúntame sobre materiales, stock mínimo, ubicaciones de herramientas o vehículos.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError("");
  };

  // Safe internal parser that formats formatting like bold '**text**' or lines starting with '-' into neat JSX tags
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Empty line -> break
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Bullets check
      let isBullet = false;
      let displayLine = line;
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        isBullet = true;
        displayLine = line.trim().substring(2);
      }

      // Parse bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(displayLine)) !== null) {
        const matchIndex = match.index;
        // Non-bold prefix
        if (matchIndex > lastIndex) {
          parts.push(displayLine.substring(lastIndex, matchIndex));
        }
        // Bold part
        parts.push(
          <span key={matchIndex} className="font-extrabold text-white">
            {match[1]}
          </span>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < displayLine.length) {
        parts.push(displayLine.substring(lastIndex));
      }

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-1.5 ml-3 my-0.5">
            <span className="text-amber-400 mt-1">&#9670;</span>
            <span className="text-zinc-200 text-xs sm:text-sm font-sans">{parts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-zinc-200 text-xs sm:text-sm font-sans leading-relaxed my-1">
          {parts}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Assistant Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/15 p-2 rounded-xl border border-amber-500/30">
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Hércules / SolarBot IA</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            </h2>
            <p className="text-[10px] text-zinc-400">Analista y Asistente Integrado de la Bodega</p>
          </div>
        </div>

        <button 
          onClick={clearChat}
          title="Limpiar conversación"
          className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20 p-2 rounded-xl border border-transparent hover:border-red-900/40 transition cursor-pointer"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Suggested Fast Prompts */}
      <div className="bg-zinc-950 p-3.5 border-b border-zinc-800/80">
        <div className="flex items-center space-x-1 mb-2">
          <HelpCircle className="h-3 w-3 text-zinc-500" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Atajos de Consulta Rápida:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sug.query)}
              disabled={loading}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-400 py-1.5 px-3 rounded-lg transition-all text-left flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <span>{sug.label}</span>
              <ArrowRight className="h-3 w-3 inline shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/40">
        {messages.map((m) => {
          const isBot = m.role === "assistant";
          return (
            <div 
              key={m.id} 
              className={`flex items-start space-x-3 max-w-[85%] ${
                isBot ? "mr-auto" : "ml-auto flex-row-reverse space-x-reverse"
              }`}
            >
              {/* Avatar circle */}
              <div className={`p-2 rounded-xl shrink-0 border ${
                isBot 
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                  : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
              }`}>
                {isBot ? <Bot className="h-4 sm:h-5 w-4 sm:w-5" /> : <User className="h-4 sm:h-5 w-4 sm:w-5" />}
              </div>

              {/* Message balloon */}
              <div className={`p-4 rounded-3xl ${
                isBot 
                  ? "bg-zinc-900 border border-zinc-800 text-zinc-200" 
                  : "bg-zinc-800 border border-transparent text-white"
              }`}>
                <div className="space-y-1">
                  {renderFormattedText(m.content)}
                </div>
                <div className="text-[9px] text-zinc-500 text-right mt-1.5 font-mono">
                  {m.timestamp}
                </div>
              </div>

            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start space-x-3 max-w-[80%] mr-auto">
            <div className="p-2 rounded-xl shrink-0 bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <span className="text-xs text-zinc-400 font-medium">Buscando en Firestore y analizando inventario...</span>
            </div>
          </div>
        )}

        {/* Global error banner inside Chat */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start space-x-2 text-xs text-red-200 max-w-sm ml-auto mr-auto">
            <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong>Fallo de Asistencia:</strong> {error}
              <p className="text-[9px] text-zinc-400 mt-1">Por favor verifica que la variable GEMINI_API_KEY esté configurada en tus secretos.</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input controls form */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Pregunta algo (e.g. ¿Cuáles cables solares están en stock crítico?)"
            className="flex-1 bg-zinc-950 text-white border border-zinc-800 hover:border-zinc-700/80 focus:border-amber-500 rounded-xl py-3 px-4 outline-none text-sm transition-all focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 p-3 rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center justify-center cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600 shrink-0 outline-none"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
        <span className="text-[9px] text-zinc-500 mt-1.5 block text-center font-mono">
          Desarrollado con Gemini 2.5 y Firestore. La IA nunca inventa stock; lee resúmenes y SKU reales de tu base de datos.
        </span>
      </div>

    </div>
  );
}
