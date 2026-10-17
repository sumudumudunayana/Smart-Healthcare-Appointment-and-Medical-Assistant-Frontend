import api from "./api";

const specializationService = {
  // Get all specializations
  getAll: async () => {
    const response = await api.get("/Specializations");
    return response.data;
  },

  // Create a specialization
  create: async (specializationData) => {
    const response = await api.post(
      "/Specializations",
      specializationData
    );
    return response.data;
  },

  // Update an existing specialization
  update: async (id, specializationData) => {
    const response = await api.put(
      `/Specializations/${id}`,
      specializationData
    );
    return response.data;
  },

  // Delete a specialization
  delete: async (id) => {
    const response = await api.delete(
      `/Specializations/${id}`
    );
    return response.data;
  },
};

export default specializationService;