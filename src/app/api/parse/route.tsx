import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text)
      return NextResponse.json({ error: "texto obrigatório" }, { status: 400 });

    const prompt = `
Você é um assistente que analisa logs de incidentes do Zabbix e deve retornar uma tabela TSV com os seguintes campos:

Cumprimento do ANS\tData/Horário de Início do Evento\tData/Horário de Encerramento do Evento\tStatus do Evento\tItem de Configuração\tInformação do Evento\tPrioridade do Evento\tCategorização do Evento\tNº do Registro na Ferramenta de ITSM\tData/Horário Registro na Ferramenta de ITSM\tData/Horário Execução do Plano de Comunicação\tAções do Plano de Comunicação\tObservação\tResponsável Contatado\tAnalista do Centro de Operações Responsável pelo Evento\tTempo de Reação Registro do Evento na Ferramenta de ITSM\tTempo de Reação Plano de Comunicação\tAcordo de Nível de Serviço (Registro do Evento na Ferramenta de ITSM)\tAcordo de Nível de Serviço (Execução Plano de Comunicação)\tTempo para Resolução do Evento\tTurno Responsável Pela Atuação\tTurno Responsável Pela Resolução\tTempo de Resolução do Evento a partir da Execução do Plano de Comunicação\tContrato

Entrada:
${text}

Indicações:

- Cumprimento do ANS: Sempre vai ser OK
- Data/Horário de Início do Evento
- Data/Horário de Encerramento do Evento
- Status do Evento: Resolvido ou Pendente
- Item de Configuração: Nome do Host
- Informação do Evento: Descrião do Evento
- Prioridade do Evento: Crítico
- Categorização do Evento: Alto ou Desastre
- Nº do Registro na Ferramenta de ITSM: Fica sempre na mensagem de reconhecimento, apenas os números
- Data/Horário Registro na Ferramenta de ITSM: Será sempre o horário de reconhecimento
- Data/Horário Execução do Plano de Comunicação: Será sempre o horário de reconhecimento
- Ações do Plano de Comunicação: Será sempre CITSMART/TEAMS/TELEGRAM
- Observação: Será sempre Não aplicável
- Responsável Contatado
- Analista do Centro de Operações Responsável pelo Evento
- Tempo de Reação Registro do Evento na Ferramenta de ITSM: Será sempre 8:00
- Tempo de Reação Plano de Comunicação: Será sempre 8:00
- Acordo de Nível de Serviço (Registro do Evento na Ferramenta de ITSM): Será sempre 15:00
- Acordo de Nível de Serviço (Execução Plano de Comunicação): Será sempre 15:00
- Tempo para Resolução do Evento: Horário de Encerramento do evento - Horário de Início do evento
- Turno Responsável Pela Atuação: Manhã, Tarde, Noite ou Madrugada
- Turno Responsável Pela Resolução: Manhã, Tarde, Noite ou Madrugada
- Tempo de Resolução do Evento a partir da Execução do Plano de Comunicação	Contrato: Tempo para Resolução do Evento - Horário de abertura do chamado
- Contrato

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
