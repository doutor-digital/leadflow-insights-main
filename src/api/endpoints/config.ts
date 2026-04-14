import { apiClient } from "../client";
import type { CloudiaApiKeyStatus } from "../types";

export const configApi = {
  setCloudiaApiKey: (apiKey: string, adminKey: string) =>
    apiClient.post("/api/config/cloudia-api-key", { apiKey }, {
      headers: { "X-Admin-Key": adminKey },
    }).then((r) => r.data),

  getCloudiaApiKeyStatus: (adminKey: string) =>
    apiClient.get<CloudiaApiKeyStatus>("/api/config/cloudia-api-key/status", {
      headers: { "X-Admin-Key": adminKey },
    }).then((r) => r.data),

  deleteCloudiaApiKey: (adminKey: string) =>
    apiClient.delete("/api/config/cloudia-api-key", {
      headers: { "X-Admin-Key": adminKey },
    }).then((r) => r.data),
};
