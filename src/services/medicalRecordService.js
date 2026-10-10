import api from "./api";

const medicalRecordService = {
  // Get all medical records created by the logged-in doctor
  getMyDoctorRecords: async () => {
    const response = await api.get("/MedicalRecords/doctor/my");
    return response.data;
  },

  // Get a medical record for a specific appointment
  getByAppointment: async (appointmentId) => {
    const response = await api.get(
      `/MedicalRecords/appointment/${appointmentId}`
    );
    return response.data;
  },

  // Create a medical record
  create: async (recordData) => {
    const response = await api.post(
      "/MedicalRecords",
      recordData
    );
    return response.data;
  },
};

export default medicalRecordService;