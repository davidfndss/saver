import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text)
      return NextResponse.json({ error: "texto obrigatório" }, { status: 400 });

    const prompt = `
Você é um assistente que analisa logs de incidentes do Zabbix e deve retornar uma tabela TSV com os seguintes campos:

Host\tNome do incidente\tData e hora de abertura\tData e hora reconhecido\tMensagem de reconhecimento\tData e hora resolvido

Entrada:
${text}

Regras:
- Use os valores originais (não traduza nem altere formato de data/hora).
- Se um campo não estiver presente, deixe-o vazio ("").
- Retorne apenas UMA LINHA TSV, sem explicações adicionais.
`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    const data = await r.json();

    if (!r.ok) throw new Error(JSON.stringify(data));

    const response = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ tsv: response });
  } catch (err) {
    console.error(err);

    if (err instanceof Error) return NextResponse.json({ error: err.message || "erro" }, { status: 500 });

    return NextResponse.json({ error: "erro desconhecido" }, { status: 500 });
  }
}
