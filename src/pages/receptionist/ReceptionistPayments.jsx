import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import billService from "../../services/billService";
import paymentService from "../../services/paymentService";

import "../../styles/pages/receptionist/ReceptionistPayments.css";

const ReceptionistPayments = () => {
  // ============================================================
  // DATA
  // ============================================================

  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  // ============================================================
  // SELECTED BILL
  // ============================================================

  const [selectedBill, setSelectedBill] = useState(null);

  // ============================================================
  // PAYMENT FORM
  // ============================================================

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // ============================================================
  // FILTERS
  // ============================================================

  const [billSearchTerm, setBillSearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] =
    useState("");

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState("All");

  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState("All");

  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] =
    useState(false);

  // ============================================================
  // LOAD PAYMENT DATA
  // ============================================================

  const loadPaymentData = async () => {
    try {
      setLoading(true);

      const [billsData, paymentsData] =
        await Promise.all([
          billService.getReceptionistBills(),
          paymentService.getReceptionistPayments(),
        ]);

      setBills(
        Array.isArray(billsData)
          ? billsData
          : []
      );

      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load receptionist payment data:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load payment information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  // ============================================================
  // CALCULATE TOTAL PAID FOR EACH BILL
  // ============================================================

  const getBillPaidAmount = (billId) => {
    return payments
      .filter(
        (payment) =>
          payment.billId === billId &&
          payment.paymentStatus?.toLowerCase() ===
            "completed"
      )
      .reduce(
        (total, payment) =>
          total + Number(payment.paymentAmount || 0),
        0
      );
  };

  // ============================================================
  // BILLS WITH OUTSTANDING BALANCE
  // ============================================================

  const outstandingBills = useMemo(() => {
    return bills.filter((bill) => {
      const paidAmount =
        getBillPaidAmount(bill.billId);

      const remainingAmount =
        Number(bill.totalAmount || 0) -
        paidAmount;

      return remainingAmount > 0;
    });
  }, [bills, payments]);

  // ============================================================
  // FILTER OUTSTANDING BILLS
  // ============================================================

  const filteredOutstandingBills = useMemo(() => {
    const normalizedSearch =
      billSearchTerm.trim().toLowerCase();

    return outstandingBills.filter((bill) => {
      return (
        !normalizedSearch ||
        bill.patientName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        bill.doctorName
          ?.toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [
    outstandingBills,
    billSearchTerm,
  ]);

  // ============================================================
  // FILTER PAYMENT HISTORY
  // ============================================================

  const filteredPayments = useMemo(() => {
    const normalizedSearch =
      paymentSearchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !normalizedSearch ||
        payment.patientName
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        paymentStatusFilter === "All" ||
        payment.paymentStatus?.toLowerCase() ===
          paymentStatusFilter.toLowerCase();

      const matchesMethod =
        paymentMethodFilter === "All" ||
        payment.paymentMethod?.toLowerCase() ===
          paymentMethodFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [
    payments,
    paymentSearchTerm,
    paymentStatusFilter,
    paymentMethodFilter,
  ]);

  // ============================================================
  // SUMMARY VALUES
  // ============================================================

  const totalOutstanding = outstandingBills.reduce(
    (total, bill) => {
      const paidAmount =
        getBillPaidAmount(bill.billId);

      const remaining =
        Number(bill.totalAmount || 0) -
        paidAmount;

      return total + Math.max(remaining, 0);
    },
    0
  );

  const totalPayments = payments.length;

  const totalCollected = payments.reduce(
    (total, payment) =>
      total +
      Number(payment.paymentAmount || 0),
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
  // SELECT BILL
  // ============================================================

  const handleSelectBill = (bill) => {
    const paidAmount =
      getBillPaidAmount(bill.billId);

    const remainingAmount =
      Number(bill.totalAmount || 0) -
      paidAmount;

    setSelectedBill({
      ...bill,
      calculatedPaidAmount: paidAmount,
      calculatedRemainingAmount:
        Math.max(remainingAmount, 0),
    });

    setPaymentAmount("");
    setPaymentMethod("Cash");
  };

  // ============================================================
  // CLEAR BILL SELECTION
  // ============================================================

  const handleClearSelection = () => {
    setSelectedBill(null);
    setPaymentAmount("");
    setPaymentMethod("Cash");
  };

  // ============================================================
  // PROCESS PAYMENT
  // ============================================================

  const handleProcessPayment = async (event) => {
    event.preventDefault();

    if (!selectedBill) {
      toast.error(
        "Please select a bill."
      );

      return;
    }

    if (!paymentAmount.trim()) {
      toast.error(
        "Please enter the payment amount."
      );

      return;
    }

    const numericAmount =
      Number(paymentAmount);

    if (
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error(
        "Payment amount must be greater than zero."
      );

      return;
    }

    const remainingAmount =
      Number(
        selectedBill.calculatedRemainingAmount
      );

    if (numericAmount > remainingAmount) {
      toast.error(
        `Payment cannot exceed the remaining amount of Rs. ${formatAmount(
          remainingAmount
        )}.`
      );

      return;
    }

    try {
      setProcessingPayment(true);

      const payment =
        await paymentService.create({
          billId: selectedBill.billId,
          amount: numericAmount,
          paymentMethod,
        });

      toast.success(
        "Payment processed successfully."
      );

      setPaymentAmount("");

      // Reload actual backend data.
      await loadPaymentData();

      // Clear selection because the bill
      // may now be fully paid.
      setSelectedBill(null);

      console.log(
        "Payment processed:",
        payment
      );
    } catch (error) {
      console.error(
        "Failed to process payment:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to process payment."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadPaymentData();

    toast.success(
      "Payment information refreshed."
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-receptionist-payment-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="smarthealth-receptionist-payment-header">

        <div>
          <h1 className="smarthealth-receptionist-payment-title">
            Payments
          </h1>

          <p className="smarthealth-receptionist-payment-subtitle">
            Process patient payments and manage
            payment history.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-payment-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ Refresh
        </button>

      </div>

      {/* ======================================================
          SUMMARY CARDS
      ======================================================= */}

      <div className="smarthealth-receptionist-payment-summary-grid">

        <div className="smarthealth-receptionist-payment-summary-card">

          <div className="smarthealth-receptionist-payment-summary-icon">
            ⏳
          </div>

          <div>
            <span className="smarthealth-receptionist-payment-summary-label">
              Outstanding Bills
            </span>

            <strong className="smarthealth-receptionist-payment-summary-value">
              {outstandingBills.length}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-payment-summary-card">

          <div className="smarthealth-receptionist-payment-summary-icon">
            💳
          </div>

          <div>
            <span className="smarthealth-receptionist-payment-summary-label">
              Payments Processed
            </span>

            <strong className="smarthealth-receptionist-payment-summary-value">
              {totalPayments}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-payment-summary-card">

          <div className="smarthealth-receptionist-payment-summary-icon">
            💰
          </div>

          <div>
            <span className="smarthealth-receptionist-payment-summary-label">
              Total Collected
            </span>

            <strong className="smarthealth-receptionist-payment-summary-value">
              Rs.{" "}
              {formatAmount(
                totalCollected
              )}
            </strong>
          </div>

        </div>

        <div className="smarthealth-receptionist-payment-summary-card">

          <div className="smarthealth-receptionist-payment-summary-icon">
            📌
          </div>

          <div>
            <span className="smarthealth-receptionist-payment-summary-label">
              Outstanding Amount
            </span>

            <strong className="smarthealth-receptionist-payment-summary-value">
              Rs.{" "}
              {formatAmount(
                totalOutstanding
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* ======================================================
          BILLS AWAITING PAYMENT
      ======================================================= */}

      <section className="smarthealth-receptionist-payment-section">

        <div className="smarthealth-receptionist-payment-section-header">

          <div>
            <h2 className="smarthealth-receptionist-payment-section-title">
              Bills Awaiting Payment
            </h2>

            <p className="smarthealth-receptionist-payment-section-description">
              Select a bill to process a full or
              partial payment.
            </p>
          </div>

          <span className="smarthealth-receptionist-payment-count">
            {filteredOutstandingBills.length}
          </span>

        </div>

        {/* SEARCH */}

        <div className="smarthealth-receptionist-payment-filter-bar">

          <input
            type="text"
            value={billSearchTerm}
            onChange={(event) =>
              setBillSearchTerm(
                event.target.value
              )
            }
            placeholder="Search patient or doctor..."
            className="smarthealth-receptionist-payment-search"
          />

        </div>

        {/* BILL LIST */}

        {loading ? (
          <div className="smarthealth-receptionist-payment-loading">
            Loading outstanding bills...
          </div>
        ) : filteredOutstandingBills.length ===
          0 ? (
          <div className="smarthealth-receptionist-payment-empty">

            <div className="smarthealth-receptionist-payment-empty-icon">
              ✓
            </div>

            <h3 className="smarthealth-receptionist-payment-empty-title">
              No outstanding bills
            </h3>

            <p className="smarthealth-receptionist-payment-empty-text">
              There are currently no bills
              waiting for payment.
            </p>

          </div>
        ) : (
          <div className="smarthealth-receptionist-payment-bill-list">

            {filteredOutstandingBills.map(
              (bill) => {

                const paidAmount =
                  getBillPaidAmount(
                    bill.billId
                  );

                const remainingAmount =
                  Math.max(
                    Number(
                      bill.totalAmount || 0
                    ) - paidAmount,
                    0
                  );

                const isSelected =
                  selectedBill?.billId ===
                  bill.billId;

                return (
                  <button
                    type="button"
                    key={bill.billId}
                    onClick={() =>
                      handleSelectBill(
                        bill
                      )
                    }
                    className={`smarthealth-receptionist-payment-bill-item ${
                      isSelected
                        ? "smarthealth-receptionist-payment-bill-item-selected"
                        : ""
                    }`}
                  >

                    <div className="smarthealth-receptionist-payment-bill-main">

                      <strong>
                        {bill.patientName ||
                          "Unknown Patient"}
                      </strong>

                      <span>
                        Dr.{" "}
                        {bill.doctorName ||
                          "Unknown Doctor"}
                      </span>

                    </div>

                    <div className="smarthealth-receptionist-payment-bill-amounts">

                      <div>
                        <span>
                          Bill
                        </span>

                        <strong>
                          Rs.{" "}
                          {formatAmount(
                            bill.totalAmount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Paid
                        </span>

                        <strong className="smarthealth-receptionist-payment-paid-value">
                          Rs.{" "}
                          {formatAmount(
                            paidAmount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Remaining
                        </span>

                        <strong className="smarthealth-receptionist-payment-remaining-value">
                          Rs.{" "}
                          {formatAmount(
                            remainingAmount
                          )}
                        </strong>
                      </div>

                    </div>

                    <span className="smarthealth-receptionist-payment-bill-status">
                      {bill.billStatus}
                    </span>

                  </button>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          PROCESS PAYMENT
      ======================================================= */}

      <section className="smarthealth-receptionist-payment-form-card">

        {!selectedBill ? (

          <div className="smarthealth-receptionist-payment-placeholder">

            <div className="smarthealth-receptionist-payment-placeholder-icon">
              💳
            </div>

            <h2 className="smarthealth-receptionist-payment-placeholder-title">
              Select a Bill
            </h2>

            <p className="smarthealth-receptionist-payment-placeholder-text">
              Select an outstanding bill above
              to process a payment.
            </p>

          </div>

        ) : (

          <div>

            {/* FORM HEADER */}

            <div className="smarthealth-receptionist-payment-form-header">

              <div>
                <h2 className="smarthealth-receptionist-payment-form-title">
                  Process Payment
                </h2>

                <p className="smarthealth-receptionist-payment-form-subtitle">
                  Record a cash or insurance
                  payment for this bill.
                </p>
              </div>

              <button
                type="button"
                className="smarthealth-receptionist-payment-close-button"
                onClick={
                  handleClearSelection
                }
              >
                ✕
              </button>

            </div>

            {/* BILL DETAILS */}

            <div className="smarthealth-receptionist-payment-selected-details">

              <div>
                <span>
                  Patient
                </span>

                <strong>
                  {selectedBill.patientName}
                </strong>
              </div>

              <div>
                <span>
                  Doctor
                </span>

                <strong>
                  Dr.{" "}
                  {selectedBill.doctorName}
                </strong>
              </div>

              <div>
                <span>
                  Bill Amount
                </span>

                <strong>
                  Rs.{" "}
                  {formatAmount(
                    selectedBill.totalAmount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Already Paid
                </span>

                <strong>
                  Rs.{" "}
                  {formatAmount(
                    selectedBill.calculatedPaidAmount
                  )}
                </strong>
              </div>

              <div className="smarthealth-receptionist-payment-selected-remaining">

                <span>
                  Remaining Amount
                </span>

                <strong>
                  Rs.{" "}
                  {formatAmount(
                    selectedBill.calculatedRemainingAmount
                  )}
                </strong>

              </div>

            </div>

            {/* PAYMENT FORM */}

            <form
              onSubmit={
                handleProcessPayment
              }
              className="smarthealth-receptionist-payment-form"
            >

              <div className="smarthealth-receptionist-payment-form-group">

                <label
                  htmlFor="smarthealth-receptionist-payment-amount"
                  className="smarthealth-receptionist-payment-label"
                >
                  Payment Amount
                </label>

                <div className="smarthealth-receptionist-payment-amount-wrapper">

                  <span className="smarthealth-receptionist-payment-currency">
                    Rs.
                  </span>

                  <input
                    id="smarthealth-receptionist-payment-amount"
                    type="number"
                    min="0.01"
                    max={
                      selectedBill.calculatedRemainingAmount
                    }
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className="smarthealth-receptionist-payment-amount-input"
                  />

                </div>

              </div>

              <div className="smarthealth-receptionist-payment-form-group">

                <label
                  htmlFor="smarthealth-receptionist-payment-method"
                  className="smarthealth-receptionist-payment-label"
                >
                  Payment Method
                </label>

                <select
                  id="smarthealth-receptionist-payment-method"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                  className="smarthealth-receptionist-payment-method-select"
                >
                  <option value="Cash">
                    Cash
                  </option>

                  <option value="Insurance">
                    Insurance
                  </option>
                </select>

              </div>

              <button
                type="submit"
                className="smarthealth-receptionist-payment-process-button"
                disabled={processingPayment}
              >
                {processingPayment
                  ? "Processing..."
                  : "Process Payment"}
              </button>

            </form>

          </div>

        )}

      </section>

      {/* ======================================================
          PAYMENT HISTORY
      ======================================================= */}

      <section className="smarthealth-receptionist-payment-history-section">

        <div className="smarthealth-receptionist-payment-section-header">

          <div>
            <h2 className="smarthealth-receptionist-payment-section-title">
              Payment History
            </h2>

            <p className="smarthealth-receptionist-payment-section-description">
              View all payment transactions.
            </p>
          </div>

          <span className="smarthealth-receptionist-payment-count">
            {filteredPayments.length}
          </span>

        </div>

        {/* PAYMENT FILTERS */}

        <div className="smarthealth-receptionist-payment-filter-bar">

          <input
            type="text"
            value={paymentSearchTerm}
            onChange={(event) =>
              setPaymentSearchTerm(
                event.target.value
              )
            }
            placeholder="Search patient..."
            className="smarthealth-receptionist-payment-search"
          />

          <select
            value={paymentMethodFilter}
            onChange={(event) =>
              setPaymentMethodFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-payment-filter-select"
          >
            <option value="All">
              All Methods
            </option>

            <option value="Cash">
              Cash
            </option>

            <option value="Insurance">
              Insurance
            </option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(event) =>
              setPaymentStatusFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-payment-filter-select"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Pending">
              Pending
            </option>
          </select>

        </div>

        {/* PAYMENT TABLE */}

        {loading ? (
          <div className="smarthealth-receptionist-payment-loading">
            Loading payment history...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="smarthealth-receptionist-payment-empty">

            <div className="smarthealth-receptionist-payment-empty-icon">
              💳
            </div>

            <h3 className="smarthealth-receptionist-payment-empty-title">
              No payment history
            </h3>

            <p className="smarthealth-receptionist-payment-empty-text">
              Processed payments will appear
              here.
            </p>

          </div>
        ) : (
          <div className="smarthealth-receptionist-payment-table-wrapper">

            <table className="smarthealth-receptionist-payment-table">

              <thead>

                <tr>
                  <th>Patient</th>
                  <th>Bill Amount</th>
                  <th>Payment</th>
                  <th>Remaining</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Bill Status</th>
                </tr>

              </thead>

              <tbody>

                {filteredPayments.map(
                  (payment) => (

                    <tr
                      key={
                        payment.paymentId
                      }
                    >

                      <td>
                        <div className="smarthealth-receptionist-payment-patient-cell">

                          <strong>
                            {payment.patientName ||
                              "Unknown Patient"}
                          </strong>

                          <span>
                            Bill:{" "}
                            {payment.billId}
                          </span>

                        </div>
                      </td>

                      <td>
                        Rs.{" "}
                        {formatAmount(
                          payment.billAmount
                        )}
                      </td>

                      <td>
                        <strong className="smarthealth-receptionist-payment-history-amount">
                          Rs.{" "}
                          {formatAmount(
                            payment.paymentAmount
                          )}
                        </strong>
                      </td>

                      <td>
                        Rs.{" "}
                        {formatAmount(
                          payment.remainingAmount
                        )}
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-payment-method-badge">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          payment.paymentDate
                        )}
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-payment-status-badge">
                          {payment.paymentStatus}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`smarthealth-receptionist-payment-bill-status-badge smarthealth-receptionist-payment-bill-status-${String(
                            payment.billStatus ||
                              "unknown"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {payment.billStatus ||
                            "-"}
                        </span>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
};

export default ReceptionistPayments;