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

  // ============================================================
  // GET DOCTOR APPOINTMENTS FOR A SPECIFIC DATE
  // Used to identify booked appointment slots.
  // ============================================================
  getDoctorAppointmentsByDate: async (doctorId, date) => {
    const response = await api.get(
      `/Appointments/doctor/${doctorId}/date/${date}`
    );

    return response.data;
  },

  // ============================================================
  // CREATE APPOINTMENT FOR A PATIENT (RECEPTIONIST)
  // ============================================================
  createForReceptionist: async (appointmentData) => {
    const response = await api.post(
      "/Appointments/receptionist",
      appointmentData
    );

    return response.data;
  },
};

export default appointmentService;