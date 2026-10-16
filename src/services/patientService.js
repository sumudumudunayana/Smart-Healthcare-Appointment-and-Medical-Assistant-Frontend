import api from "./api";

const patientService = {
  // Get all patients
  getAll: async () => {
    const response = await api.get("/Patients");
    return response.data;
  },

  // Get a patient by ID
  getById: async (patientId) => {
    const response = await api.get(`/Patients/${patientId}`);
    return response.data;
  },

  // Create a new patient
  create: async (patientData) => {
    const response = await api.post("/Patients", patientData);
    return response.data;
  },

  // Update patient information
  update: async (patientId, patientData) => {
    const response = await api.put(
      `/Patients/${patientId}`,
      patientData,
    );
    return response.data;
  },

  // Deactivate a patient account
  deactivate: async (patientId) => {
    const response = await api.delete(`/Patients/${patientId}`);
    return response.data;
  },
};

export default patientService;