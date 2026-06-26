export type ApiHealthResponse = {
  status: "UP" | "DOWN";
  service: string;
  version: string;
};

export async function fetchApiHealth(baseUrl: string): Promise<ApiHealthResponse> {
  const response = await fetch(`${baseUrl}/api/v1/system/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<ApiHealthResponse>;
}
