import api from "./api";

const insuranceService = {
  // ============================================================
  // INSURANCE POLICIES
  // ============================================================

  getAllPolicies: async () => {
    const response = await api.get("/InsurancePolicies");
    return response.data;
  },

  getPolicyById: async (insurancePolicyId) => {
    const response = await api.get(
      `/InsurancePolicies/${insurancePolicyId}`
    );

    return response.data;
  },

  createPolicy: async (policyData) => {
    const response = await api.post(
      "/InsurancePolicies",
      policyData
    );

    return response.data;
  },

  // ============================================================
  // INSURANCE CLAIMS
  // ============================================================

  getClaimsByBill: async (billId) => {
    const response = await api.get(
      `/InsuranceClaims/bill/${billId}`
    );

    return response.data;
  },

  createClaim: async (claimData) => {
    const response = await api.post(
      "/InsuranceClaims",
      claimData
    );

    return response.data;
  },
};

export default insuranceService;