 import api from "./api";

const departmentService = {
  getAll: async () => {
    const response = await api.get("/Departments");
    return response.data;
  },

  create: async (departmentData) => {
    const response = await api.post("/Departments", departmentData);
    return response.data;
  },

  update: async (id, departmentData) => {
    const response = await api.put(`/Departments/${id}`, departmentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/Departments/${id}`);
    return response.data;
  },
};

export default departmentService;