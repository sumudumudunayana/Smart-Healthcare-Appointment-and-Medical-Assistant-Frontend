import api from "./api";

const prescriptionService = {
  getMyDoctorPrescriptions: async () => {
    const response = await api.get("/Prescriptions/doctor/my");
    return response.data;
  },

  getByRecord: async (recordId) => {
    const response = await api.get(
      `/Prescriptions/record/${recordId}`
    );
    return response.data;
  },

  create: async (prescriptionData) => {
    const response = await api.post(
      "/Prescriptions",
      prescriptionData
    );
    return response.data;
  },
};

export default prescriptionService;