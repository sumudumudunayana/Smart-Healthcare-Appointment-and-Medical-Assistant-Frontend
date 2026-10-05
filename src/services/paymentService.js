import api from "./api";

const paymentService = {
  // Process a payment
  create: async (paymentData) => {
    const response = await api.post(
      "/Payments",
      paymentData
    );

    return response.data;
  },

  // Get all payments for a specific bill
  getByBill: async (billId) => {
    const response = await api.get(
      `/Payments/bill/${billId}`
    );

    return response.data;
  },

  // Get all payment transactions for receptionist
  getReceptionistPayments: async () => {
    const response = await api.get(
      "/Payments/receptionist"
    );

    return response.data;
  },
};

export default paymentService;