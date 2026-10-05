import api from "./api";

const appointmentService = {
  // ============================================================
  // DOCTOR APPOINTMENTS
  // ============================================================
  getDoctorAppointments: async () => {
    const response = await api.get(
      "/Appointments/doctor/my"
    );

    return response.data;
  },

  // ============================================================
  // PATIENT APPOINTMENTS
  // ============================================================
  getMyAppointments: async () => {
    const response = await api.get(
      "/Appointments/my"
    );

    return response.data;
  },

  // ============================================================
  // APPOINTMENT BY ID
  // ============================================================
  getById: async (appointmentId) => {
    const response = await api.get(
      `/Appointments/${appointmentId}`
    );

    return response.data;
  },

  // ============================================================
  // CANCEL APPOINTMENT
  // ============================================================
  cancel: async (appointmentId) => {
    const response = await api.patch(
      `/Appointments/${appointmentId}/cancel`
    );

    return response.data;
  },

  // ============================================================
  // RECEPTIONIST APPOINTMENTS
  // ============================================================
  getReceptionistAppointments: async () => {
    const response = await api.get(
      "/Appointments/receptionist"
    );

    return response.data;
  },
};

export default appointmentService;