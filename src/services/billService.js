import api from "./api";

const billService = {
  // Create a new bill
  create: async (billData) => {
    const response = await api.post("/Bills", billData);
    return response.data;
  },

  // Get a single bill
  getById: async (billId) => {
    const response = await api.get(`/Bills/${billId}`);
    return response.data;
  },

  // Get bills belonging to the logged-in patient
  getMyBills: async () => {
    const response = await api.get("/Bills/my");
    return response.data;
  },

  // Get all bills for the receptionist
  getReceptionistBills: async () => {
    const response = await api.get("/Bills/receptionist");
    return response.data;
  },
};

export default billService;