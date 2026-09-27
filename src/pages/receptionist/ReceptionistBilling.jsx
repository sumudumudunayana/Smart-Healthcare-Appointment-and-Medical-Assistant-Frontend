import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import appointmentService from "../../services/appointmentService";
import billService from "../../services/billService";

import "../../styles/pages/receptionist/ReceptionistBilling.css";

const ReceptionistBilling = () => {
  // ============================================================
  // DATA
  // ============================================================

  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);

  // ============================================================
  // SELECTION
  // ============================================================

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  // ============================================================
  // APPOINTMENT FILTERS
  // ============================================================

  const [appointmentSearchTerm, setAppointmentSearchTerm] =
    useState("");

  const [appointmentStatusFilter, setAppointmentStatusFilter] =
    useState("All");

  // ============================================================
  // BILL FILTERS
  // ============================================================

  const [billSearchTerm, setBillSearchTerm] =
    useState("");

  const [billStatusFilter, setBillStatusFilter] =
    useState("All");

  // ============================================================
  // BILL FORM
  // ============================================================

  const [amount, setAmount] = useState("");
  const [createdBill, setCreatedBill] = useState(null);

  // ============================================================
  // LOADING STATES
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [creatingBill, setCreatingBill] = useState(false);

  // ============================================================
  // LOAD BILLING DATA
  // ============================================================

  const loadBillingData = async () => {
    try {
      setLoading(true);

      const [appointmentsData, billsData] =
        await Promise.all([
          appointmentService.getReceptionistAppointments(),
          billService.getReceptionistBills(),
        ]);

      setAppointments(
        Array.isArray(appointmentsData)
          ? appointmentsData
          : []
      );

      setBills(
        Array.isArray(billsData)
          ? billsData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load receptionist billing data:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load billing information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // ============================================================
  // FIND BILLED APPOINTMENT IDS
  // ============================================================

  const billedAppointmentIds = useMemo(() => {
    return new Set(
      bills.map((bill) => bill.appointmentId)
    );
  }, [bills]);

  // ============================================================
  // UNBILLED APPOINTMENTS
  // ============================================================

  const unbilledAppointments = useMemo(() => {
    return appointments.filter(
      (appointment) =>
        !billedAppointmentIds.has(
          appointment.appointmentId
        )
    );
  }, [appointments, billedAppointmentIds]);

  // ============================================================
  // FILTER UNBILLED APPOINTMENTS
  // ============================================================

  const filteredAppointments = useMemo(() => {
    const normalizedSearch =
      appointmentSearchTerm.trim().toLowerCase();

    return unbilledAppointments.filter(
      (appointment) => {
        const matchesSearch =
          !normalizedSearch ||
          appointment.patientName
            ?.toLowerCase()
            .includes(normalizedSearch) ||
          appointment.doctorName
            ?.toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          appointmentStatusFilter === "All" ||
          appointment.status?.toLowerCase() ===
            appointmentStatusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      }
    );
  }, [
    unbilledAppointments,
    appointmentSearchTerm,
    appointmentStatusFilter,
  ]);

  // ============================================================
  // FILTER BILLS
  // ============================================================

  const filteredBills = useMemo(() => {
    const normalizedSearch =
      billSearchTerm.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesSearch =
        !normalizedSearch ||
        bill.patientName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        bill.doctorName
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        billStatusFilter === "All" ||
        bill.billStatus?.toLowerCase() ===
          billStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [
    bills,
    billSearchTerm,
    billStatusFilter,
  ]);

  // ============================================================
  // BILL STATUS OPTIONS
  // ============================================================

  const billStatuses = useMemo(() => {
    const statuses = bills
      .map((bill) => bill.billStatus)
      .filter(Boolean);

    return [...new Set(statuses)];
  }, [bills]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const totalBills = bills.length;

  const pendingBills = bills.filter(
    (bill) =>
      bill.billStatus?.toLowerCase() === "pending"
  ).length;

  const totalBilledAmount = bills.reduce(
    (total, bill) =>
      total + Number(bill.totalAmount || 0),
    0
  );

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(
      `${dateValue}T00:00:00`
    );

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (timeValue) => {
    if (!timeValue) {
      return "-";
    }

    const [hours, minutes] =
      timeValue.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ============================================================
  // FORMAT AMOUNT
  // ============================================================

  const formatAmount = (value) => {
    return Number(value || 0).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // ============================================================
  // CREATE BILL
  // ============================================================

  const handleCreateBill = async (event) => {
    event.preventDefault();

    if (!selectedAppointment) {
      toast.error(
        "Please select an appointment."
      );

      return;
    }

    const numericAmount = Number(amount);

    if (!amount.trim()) {
      toast.error(
        "Please enter the bill amount."
      );

      return;
    }

    if (
      Number.isNaN(numericAmount) ||
      numericAmount < 0
    ) {
      toast.error(
        "Bill amount must be zero or greater."
      );

      return;
    }

    try {
      setCreatingBill(true);

      const bill = await billService.create({
        appointmentId:
          selectedAppointment.appointmentId,

        totalAmount: numericAmount,
      });

      setCreatedBill(bill);

      setAmount("");

      toast.success(
        "Bill created successfully."
      );

      // Reload both appointments and bills.
      // This causes the billed appointment to
      // automatically move out of the unbilled list.
      await loadBillingData();

      // Keep the created bill visible in the
      // success section.
      setCreatedBill(bill);

      // Clear selected appointment after
      // successful billing.
      setSelectedAppointment(null);
    } catch (error) {
      console.error(
        "Failed to create bill:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to create bill."
      );
    } finally {
      setCreatingBill(false);
    }
  };

  // ============================================================
  // SELECT APPOINTMENT
  // ============================================================

  const handleSelectAppointment = (
    appointment
  ) => {
    setSelectedAppointment(appointment);
    setCreatedBill(null);
    setAmount("");
  };

  // ============================================================
  // RESET BILL CREATION AREA
  // ============================================================

  const handleClearSelection = () => {
    setSelectedAppointment(null);
    setCreatedBill(null);
    setAmount("");
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadBillingData();

    toast.success(
      "Billing information refreshed."
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-receptionist-billing-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="smarthealth-receptionist-billing-header">

        <div>
          <h1 className="smarthealth-receptionist-billing-title">
            Billing
          </h1>

          <p className="smarthealth-receptionist-billing-subtitle">
            Manage appointment billing and
            billed appointments.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-billing-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ======================================================= */}

      <div className="smarthealth-receptionist-billing-summary-grid">

        <div className="smarthealth-receptionist-billing-summary-card">

          <div className="smarthealth-receptionist-billing-summary-icon">
            📋
          </div>

          <div>
            <span className="smarthealth-receptionist-billing-summary-label">
              Appointments To Bill
            </span>

            <strong className="smarthealth-receptionist-billing-summary-value">
              {unbilledAppointments.length}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-billing-summary-card">

          <div className="smarthealth-receptionist-billing-summary-icon">
            💳
          </div>

          <div>
            <span className="smarthealth-receptionist-billing-summary-label">
              Total Bills
            </span>

            <strong className="smarthealth-receptionist-billing-summary-value">
              {totalBills}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-billing-summary-card">

          <div className="smarthealth-receptionist-billing-summary-icon">
            ⏳
          </div>

          <div>
            <span className="smarthealth-receptionist-billing-summary-label">
              Pending Bills
            </span>

            <strong className="smarthealth-receptionist-billing-summary-value">
              {pendingBills}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-billing-summary-card">

          <div className="smarthealth-receptionist-billing-summary-icon">
            💰
          </div>

          <div>
            <span className="smarthealth-receptionist-billing-summary-label">
              Total Billed
            </span>

            <strong className="smarthealth-receptionist-billing-summary-value">
              Rs. {formatAmount(totalBilledAmount)}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================================
          APPOINTMENTS TO BILL
      ======================================================= */}

      <section className="smarthealth-receptionist-billing-section">

        <div className="smarthealth-receptionist-billing-section-header">

          <div>
            <h2 className="smarthealth-receptionist-billing-section-title">
              Appointments To Bill
            </h2>

            <p className="smarthealth-receptionist-billing-section-description">
              These appointments do not have a bill yet.
            </p>
          </div>

          <span className="smarthealth-receptionist-billing-count">
            {filteredAppointments.length}
          </span>

        </div>

        {/* FILTERS */}

        <div className="smarthealth-receptionist-billing-filters">

          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={appointmentSearchTerm}
            onChange={(event) =>
              setAppointmentSearchTerm(
                event.target.value
              )
            }
            className="smarthealth-receptionist-billing-search"
          />

          <select
            value={appointmentStatusFilter}
            onChange={(event) =>
              setAppointmentStatusFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-billing-status-filter"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Scheduled">
              Scheduled
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>

            <option value="NoShow">
              No Show
            </option>
          </select>

        </div>

        {/* APPOINTMENT LIST */}

        {loading ? (
          <div className="smarthealth-receptionist-billing-loading">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="smarthealth-receptionist-billing-empty">

            <div className="smarthealth-receptionist-billing-empty-icon">
              ✓
            </div>

            <h3 className="smarthealth-receptionist-billing-empty-title">
              No appointments to bill
            </h3>

            <p className="smarthealth-receptionist-billing-empty-text">
              All available appointments have
              already been billed.
            </p>

          </div>
        ) : (
          <div className="smarthealth-receptionist-billing-appointment-list">

            {filteredAppointments.map(
              (appointment) => {

                const isSelected =
                  selectedAppointment?.appointmentId ===
                  appointment.appointmentId;

                return (
                  <button
                    type="button"
                    key={appointment.appointmentId}
                    onClick={() =>
                      handleSelectAppointment(
                        appointment
                      )
                    }
                    className={`smarthealth-receptionist-billing-appointment-item ${
                      isSelected
                        ? "smarthealth-receptionist-billing-appointment-item-selected"
                        : ""
                    }`}
                  >

                    <div className="smarthealth-receptionist-billing-appointment-date">

                      <strong>
                        {formatDate(
                          appointment.appointmentDate
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          appointment.appointmentTime
                        )}
                      </span>

                    </div>

                    <div className="smarthealth-receptionist-billing-appointment-info">

                      <strong>
                        {appointment.patientName ||
                          "Unknown Patient"}
                      </strong>

                      <span>
                        Dr.{" "}
                        {appointment.doctorName ||
                          "Unknown Doctor"}
                      </span>

                    </div>

                    <span className="smarthealth-receptionist-billing-appointment-status">
                      {appointment.status}
                    </span>

                  </button>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          BILL CREATION
      ======================================================= */}

      <section className="smarthealth-receptionist-billing-form-card">

        {!selectedAppointment ? (

          <div className="smarthealth-receptionist-billing-placeholder">

            <div className="smarthealth-receptionist-billing-placeholder-icon">
              💳
            </div>

            <h2 className="smarthealth-receptionist-billing-placeholder-title">
              {createdBill
                ? "Bill Created Successfully"
                : "Select an Appointment"}
            </h2>

            <p className="smarthealth-receptionist-billing-placeholder-text">
              {createdBill
                ? "The appointment has been moved to billed appointments."
                : "Select an appointment from the list above to create a patient bill."}
            </p>

            {createdBill && (
              <div className="smarthealth-receptionist-billing-created-summary">

                <div>
                  <span>Bill ID</span>

                  <strong>
                    {createdBill.billId}
                  </strong>
                </div>

                <div>
                  <span>Patient</span>

                  <strong>
                    {createdBill.patientName}
                  </strong>
                </div>

                <div>
                  <span>Doctor</span>

                  <strong>
                    Dr.{" "}
                    {createdBill.doctorName}
                  </strong>
                </div>

                <div>
                  <span>Total Amount</span>

                  <strong>
                    Rs.{" "}
                    {formatAmount(
                      createdBill.totalAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong>
                    {createdBill.billStatus}
                  </strong>
                </div>

                <div>
                  <span>Generated Date</span>

                  <strong>
                    {formatDate(
                      createdBill.generatedDate
                    )}
                  </strong>
                </div>

              </div>
            )}

          </div>

        ) : (

          <div>

            {/* FORM HEADER */}

            <div className="smarthealth-receptionist-billing-form-header">

              <div>
                <h2 className="smarthealth-receptionist-billing-form-title">
                  Create Bill
                </h2>

                <p className="smarthealth-receptionist-billing-form-subtitle">
                  Enter the total amount for
                  this appointment.
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-receptionist-billing-close-button"
                onClick={handleClearSelection}
              >
                ✕
              </button>

            </div>

            {/* SELECTED APPOINTMENT DETAILS */}

            <div className="smarthealth-receptionist-billing-selected-details">

              <div>
                <span>Patient</span>

                <strong>
                  {selectedAppointment.patientName ||
                    "Unknown Patient"}
                </strong>
              </div>

              <div>
                <span>Doctor</span>

                <strong>
                  Dr.{" "}
                  {selectedAppointment.doctorName ||
                    "Unknown Doctor"}
                </strong>
              </div>

              <div>
                <span>Appointment</span>

                <strong>
                  {formatDate(
                    selectedAppointment.appointmentDate
                  )}{" "}
                  ·{" "}
                  {formatTime(
                    selectedAppointment.appointmentTime
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {selectedAppointment.status}
                </strong>
              </div>

            </div>

            {/* BILL FORM */}

            <form
              onSubmit={handleCreateBill}
              className="smarthealth-receptionist-billing-form"
            >

              <div className="smarthealth-receptionist-billing-form-group">

                <label
                  htmlFor="smarthealth-receptionist-billing-amount"
                  className="smarthealth-receptionist-billing-label"
                >
                  Total Amount
                </label>

                <div className="smarthealth-receptionist-billing-amount-wrapper">

                  <span className="smarthealth-receptionist-billing-currency">
                    Rs.
                  </span>

                  <input
                    id="smarthealth-receptionist-billing-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="smarthealth-receptionist-billing-amount-input"
                  />

                </div>

              </div>

              <button
                type="submit"
                className="smarthealth-receptionist-billing-create-button"
                disabled={creatingBill}
              >
                {creatingBill
                  ? "Creating Bill..."
                  : "Create Bill"}
              </button>

            </form>

          </div>

        )}

      </section>

      {/* ======================================================
          BILLED APPOINTMENTS
      ======================================================= */}

      <section className="smarthealth-receptionist-billing-billed-section">

        <div className="smarthealth-receptionist-billing-section-header">

          <div>
            <h2 className="smarthealth-receptionist-billing-section-title">
              Billed Appointments
            </h2>

            <p className="smarthealth-receptionist-billing-section-description">
              Appointments that already have a bill.
            </p>
          </div>

          <span className="smarthealth-receptionist-billing-count">
            {filteredBills.length}
          </span>

        </div>

        {/* BILL FILTERS */}

        <div className="smarthealth-receptionist-billing-filters">

          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={billSearchTerm}
            onChange={(event) =>
              setBillSearchTerm(
                event.target.value
              )
            }
            className="smarthealth-receptionist-billing-search"
          />

          <select
            value={billStatusFilter}
            onChange={(event) =>
              setBillStatusFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-billing-status-filter"
          >
            <option value="All">
              All Bill Statuses
            </option>

            {billStatuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}

          </select>

        </div>

        {/* BILLS */}

        {loading ? (
          <div className="smarthealth-receptionist-billing-loading">
            Loading bills...
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="smarthealth-receptionist-billing-empty">

            <div className="smarthealth-receptionist-billing-empty-icon">
              💳
            </div>

            <h3 className="smarthealth-receptionist-billing-empty-title">
              No billed appointments
            </h3>

            <p className="smarthealth-receptionist-billing-empty-text">
              Bills created for appointments will
              appear here.
            </p>

          </div>
        ) : (
          <div className="smarthealth-receptionist-billing-table-wrapper">

            <table className="smarthealth-receptionist-billing-table">

              <thead>

                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Appointment</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Generated Date</th>
                </tr>

              </thead>

              <tbody>

                {filteredBills.map((bill) => (

                  <tr key={bill.billId}>

                    <td>
                      <div className="smarthealth-receptionist-billing-patient-cell">

                        <strong>
                          {bill.patientName ||
                            "Unknown Patient"}
                        </strong>

                        <span>
                          {bill.billId}
                        </span>

                      </div>
                    </td>

                    <td>
                      Dr.{" "}
                      {bill.doctorName ||
                        "Unknown Doctor"}
                    </td>

                    <td>
                      <span className="smarthealth-receptionist-billing-appointment-id">
                        {bill.appointmentId}
                      </span>
                    </td>

                    <td>
                      <strong className="smarthealth-receptionist-billing-amount-value">
                        Rs.{" "}
                        {formatAmount(
                          bill.totalAmount
                        )}
                      </strong>
                    </td>

                    <td>

                      <span
                        className={`smarthealth-receptionist-billing-bill-status smarthealth-receptionist-billing-bill-status-${String(
                          bill.billStatus || "unknown"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {bill.billStatus || "-"}
                      </span>

                    </td>

                    <td>
                      {formatDate(
                        bill.generatedDate
                      )}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
};

export default ReceptionistBilling;