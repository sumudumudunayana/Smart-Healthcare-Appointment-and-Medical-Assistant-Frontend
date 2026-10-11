import api from "./api";

const specializationService = {
  getAll: async () => {
    const response = await api.get("/Specializations");
    return response.data;
  },

  create: async (specializationData) => {
    const response = await api.post(
      "/Specializations",
      specializationData
    );

    return response.data;
  },
};

export default specializationService;