import api from "./api";

const aiService = {
  // =========================================================
  // AI ORCHESTRATOR
  // =========================================================

  process: async (requestData) => {
    const response = await api.post("/ai/process", requestData);

    return response.data;
  },

  // =========================================================
  // AI WORKFLOWS
  // =========================================================

  getWorkflows: async () => {
    const response = await api.get("/ai/workflows");

    return response.data;
  },

  getWorkflow: async (workflowId) => {
    const response = await api.get(`/ai/workflows/${workflowId}`);

    return response.data;
  },

  // =========================================================
  // AI APPROVALS
  // =========================================================

  getPendingApprovals: async () => {
    const response = await api.get("/ai/approvals/pending");

    return response.data;
  },

  approve: async (approvalId, comments = "") => {
    const response = await api.post(`/ai/approvals/${approvalId}/approve`, {
      comments,
    });

    return response.data;
  },

  reject: async (approvalId, comments = "") => {
    const response = await api.post(`/ai/approvals/${approvalId}/reject`, {
      comments,
    });

    return response.data;
  },

  // =========================================================
  // AI RECOMMENDATIONS
  // =========================================================

  getWorkflowRecommendations: async (workflowId) => {
    const response = await api.get(
      `/ai/recommendations/workflow/${workflowId}`,
    );

    return response.data;
  },
};

export default aiService;
