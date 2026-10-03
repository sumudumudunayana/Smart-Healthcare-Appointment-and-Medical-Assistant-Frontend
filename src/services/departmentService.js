import api from "./api";

const departmentService = {
  getAll: async () => {
    const response = await api.get("/Departments");
    return response.data;
  },

  create: async (departmentData) => {
    const response = await api.post(
      "/Departments",
      departmentData
    );

    return response.data;
  },
};

export default departmentService;