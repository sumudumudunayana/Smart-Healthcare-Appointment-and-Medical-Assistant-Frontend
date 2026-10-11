import api from "./api";

const doctorScheduleService = {
  // ============================================================
  // GET SCHEDULES FOR A DOCTOR
  // ============================================================
  getByDoctorId: async (doctorId) => {
    const response = await api.get(
      `/DoctorSchedules/doctor/${doctorId}`
    );

    return response.data;
  },

  // ============================================================
  // CREATE DOCTOR SCHEDULE
  // ============================================================
  create: async (scheduleData) => {
    const response = await api.post(
      "/DoctorSchedules",
      scheduleData
    );

    return response.data;
  },

  // ============================================================
  // UPDATE DOCTOR SCHEDULE
  // ============================================================
  update: async (scheduleId, scheduleData) => {
    const response = await api.put(
      `/DoctorSchedules/${scheduleId}`,
      scheduleData
    );

    return response.data;
  },

  // ============================================================
  // DELETE DOCTOR SCHEDULE
  // ============================================================
  delete: async (scheduleId) => {
    const response = await api.delete(
      `/DoctorSchedules/${scheduleId}`
    );

    return response.data;
  },
};

export default doctorScheduleService;