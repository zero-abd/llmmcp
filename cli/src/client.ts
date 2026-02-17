/**
 * HTTP client for the llmmcp Cloudflare Worker backend.
 */

export interface DocResult {
  id: string;
  content: string;
  metadata: {
    provider: string;
    source: string;
    title: string;
  };
  score: number;
}

export interface ProvidersMap {
  [key: string]: string;
}

interface QueryParams {
  query: string;
  provider?: string;
  topK?: number;
}

interface QueryResponse {
  results: DocResult[];
  cached: boolean;
}

interface ProvidersResponse {
  providers: ProvidersMap;
  cached?: boolean;
}

export async function queryDocs(
  apiUrl: string,
  params: QueryParams
): Promise<DocResult[]> {
  const url = `${apiUrl}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "llmmcp-cli/0.2.0",
    },
    body: JSON.stringify({
      query: params.query,
      provider: params.provider,
      topK: params.topK ?? 3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API error (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as QueryResponse;
  return data.results;
}

export async function fetchProviders(
  apiUrl: string
): Promise<ProvidersMap> {
  const url = `${apiUrl}/providers`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "llmmcp-cli/0.2.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `API error (${response.status}): ${await response.text()}`
    );
  }

  const data = (await response.json()) as ProvidersResponse;
  return data.providers;
}
