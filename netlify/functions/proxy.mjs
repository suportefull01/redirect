// XTREAM API PROXY — NETLIFY FUNCTIONS v2.0
// Para mudar o DNS original, altere APENAS a linha abaixo.
// Use apenas uma origem que você administra ou tem autorização para consultar.
const DNS_ORIGINAL = "http://dns.explouddev.com";
const VERSAO = "2.0";

// Netlify Functions usa HTTPS na entrada e pode consultar HTTP na origem.
export const config = {
  path: ["/player_api.php", "/get.php", "/xmltv.php", "/status", "/diagnostico"]
};

const ROTAS = new Set(["/player_api.php", "/get.php", "/xmltv.php"]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Access-Control-Allow-Origin": "*",
      "X-Proxy-Version": VERSAO
    }
  });
}

function ocultar(txt, url) {
  let valor = String(txt || "");
  for (const chave of ["username", "password"]) {
    const segredo = url.searchParams.get(chave);
    if (segredo) valor = valor.split(segredo).join("[OCULTO]");
  }
  return valor.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim().slice(0, 450);
}

export default async function handler(request) {
  const entrada = new URL(request.url);
  const caminho = entrada.pathname;

  if (caminho === "/status") {
    return json({
      proxy: "ativo",
      versao: VERSAO,
      hospedagem: "Netlify Functions",
      origem_configurada: true,
      protocolo_para_origem: new URL(DNS_ORIGINAL).protocol,
      nota: "Este teste não faz contato com o DNS original."
    });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    }});
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ erro: "Método não permitido. Use GET ou HEAD." }, 405);
  }

  if (!ROTAS.has(caminho) && caminho !== "/diagnostico") {
    return json({ erro: "Caminho não autorizado.", caminho }, 404);
  }

  const diagnostico = caminho === "/diagnostico";
  const endpoint = diagnostico ? "/player_api.php" : caminho;
  const destino = new URL(DNS_ORIGINAL);
  destino.pathname = endpoint;
  destino.search = entrada.search; // Preserva todos os parâmetros, inclusive os IDs.

  if (diagnostico && (!entrada.searchParams.get("username") || !entrada.searchParams.get("password"))) {
    return json({
      erro: "Informe username e password na URL ou no painel para testar a origem.",
      exemplo: "/diagnostico?username=USUARIO&password=SENHA"
    }, 400);
  }

  try {
    const headers = {
      "Accept": request.headers.get("accept") || "*/*",
      "User-Agent": request.headers.get("user-agent") || "Mozilla/5.0 (compatible; Xtream-Proxy/2.0)"
    };

    const origem = await fetch(destino.toString(), {
      method: diagnostico ? "GET" : request.method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(22000)
    });

    const diagnosticos = {
      versao: VERSAO,
      requisicao_realizada: true,
      endpoint,
      protocolo_para_origem: destino.protocol,
      status_http_origem: origem.status,
      tipo_conteudo: origem.headers.get("content-type") || "não informado",
      servidor_origem: origem.headers.get("server") || "não informado",
      cf_ray: origem.headers.get("cf-ray") || "não informado",
      redirecionamento: origem.headers.get("location")
        ? "Servidor enviou Location (destino omitido por privacidade)"
        : "não informado"
    };

    if (diagnostico) {
      // Amostra pequena, mascarando usuário e senha para facilitar o diagnóstico.
      const corpo = await origem.text();
      return json({
        ...diagnosticos,
        resposta_valida: origem.ok,
        inicio_resposta: ocultar(corpo, entrada) || "vazia",
        observacao: origem.ok
          ? "A origem respondeu com sucesso à consulta via Netlify."
          : "A origem respondeu com erro. Não implica, sozinho, bloqueio ao Netlify."
      });
    }

    if (!origem.ok) {
      const trecho = ocultar(await origem.text(), entrada);
      return json({
        erro: "O servidor original retornou um erro HTTP.",
        ...diagnosticos,
        inicio_resposta: trecho || "vazia",
        dica: "Abra /diagnostico com o mesmo username e password para investigar."
      }, 502);
    }

    // Encaminha resposta sem reescrever dados de conta, catálogo, EPG ou links internos.
    const respostaHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "Access-Control-Allow-Origin": "*",
      "X-Proxy-Version": VERSAO
    });
    for (const chave of ["content-type", "content-disposition", "last-modified"]) {
      const valor = origem.headers.get(chave);
      if (valor) respostaHeaders.set(chave, valor);
    }
    return new Response(origem.body, { status: origem.status, headers: respostaHeaders });

  } catch (erro) {
    return json({
      erro: "A função não conseguiu consultar o DNS original.",
      versao: VERSAO,
      endpoint,
      protocolo_para_origem: destino.protocol,
      tipo: erro?.name || "Falha de rede",
      detalhe: String(erro?.message || erro).slice(0, 200)
    }, 502);
  }
}
