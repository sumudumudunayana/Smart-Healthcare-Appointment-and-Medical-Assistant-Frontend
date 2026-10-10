import api from "./api";

const labReportService = {
  getMyDoctorReports: async () => {
    const response = await api.get("/LabReports/doctor/my");
    return response.data;
  },

  getByRecord: async (recordId) => {
    const response = await api.get(
      `/LabReports/record/${recordId}`
    );
    return response.data;
  },

  create: async (reportData) => {
    const response = await api.post(
      "/LabReports",
      reportData
    );
    return response.data;
  },
};

export default labReportService;