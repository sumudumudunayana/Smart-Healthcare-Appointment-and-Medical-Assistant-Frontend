import api from "./api";

const doctorService = {
  getAll: async ({
    search = "",
    specializationId = "",
    departmentId = "",
  } = {}) => {
    const params = {};

    if (search.trim()) {
      params.search = search.trim();
    }

    if (specializationId) {
      params.specializationId = specializationId;
    }

    if (departmentId) {
      params.departmentId = departmentId;
    }

    const response = await api.get("/Doctors", {
      params,
    });

    return response.data;
  },

  getById: async (doctorId) => {
    const response = await api.get(`/Doctors/${doctorId}`);

    return response.data;
  },

  create: async (doctorData) => {
    const response = await api.post("/Doctors", doctorData);

    return response.data;
  },
};

export default doctorService;
