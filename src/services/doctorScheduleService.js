import api from "./api";

const doctorScheduleService = {
  getByDoctorId: async (doctorId) => {
    const response = await api.get(
      `/DoctorSchedules/doctor/${doctorId}`
    );

    return response.data;
  },
};

export default doctorScheduleService;