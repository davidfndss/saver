"use client";
import React, { useState } from "react";

export default function IncidentParser() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    setError(null);
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error(`Erro: ${res.status}`);
      const data = await res.json();

      setOutput(data.tsv);
    } catch (err) {
        if (err instanceof Error)  { setError(err.message) } 
        else setError("Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    alert("Copiado para área de transferência. Cole no Excel (Colar -> Colar especial -> Texto) ou Ctrl+V.");
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Saver: Incidente Zabbix → Excel</h1>
      <p className="mb-4 text-sm text-gray-600">Cole aqui a descrção do incidente do Zabbix. O parser tentará extrair os campos solicitados e devolverá uma linha pronta para colar no Excel.</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={12}
        className="w-full p-3 rounded-lg mb-3 font-mono resize-none border border-zinc-700 bg-zinc-900"
        placeholder="Cole o incidente aqui..."
      />

      <div className="flex gap-2">
        <button
          onClick={handleParse}
          className="px-4 py-2 bg-white text-zinc-950 font-[400] rounded transition cursor-pointer hover:bg-green-600 hover:text-white"
          disabled={loading}
        >
          {loading ? "Processando..." : "Gerar tabela"}
        </button>

        <button
          onClick={() => { setInput(""); setOutput(null); setError(null); }}
          className="px-4 py-2 bg-gray-800 rounded cursor-pointer"
        >
          Limpar
        </button>
      </div>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {output && (
        <div className="mt-6">
          <div className="mb-2 font-medium">Resultado (TSV — pronto para colar no Excel)</div>
          <pre className="p-3 bg-gray-50 border rounded font-mono overflow-x-auto">{output}</pre>
          <div className="flex gap-2 mt-3">
            <button onClick={copyToClipboard} className="px-4 py-2 bg-green-600 text-white rounded">Copiar</button>
            <button onClick={() => navigator.clipboard.writeText(output)} className="px-4 py-2 bg-indigo-600 text-white rounded">Copiar (alternativo)</button>
          </div>

          <div className="mt-3 text-sm text-gray-600">Copie e cole no Excel normalmente. O separador é tab (TSV).</div>
        </div>
      )}
    </div>
  );
}