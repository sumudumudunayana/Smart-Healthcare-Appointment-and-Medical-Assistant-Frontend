import api from "./api";

const receptionistService = {
  getAll: async () => {
    const response = await api.get("/Receptionists");
    return response.data;
  },

  create: async (receptionistData) => {
    const response = await api.post(
      "/Receptionists",
      receptionistData
    );
    return response.data;
  },
};

export default receptionistService;