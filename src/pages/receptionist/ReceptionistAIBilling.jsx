import { useEffect, useState } from "react";
import { toast } from "sonner";

import billService from "../../services/billService";
import aiService from "../../services/aiService";

import "../../styles/pages/receptionist/ReceptionistAIBilling.css";

const ReceptionistAIBilling = () => {
  const [bills, setBills] = useState([]);
  const [selectedBillId, setSelectedBillId] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);

  const [validationResult, setValidationResult] = useState(null);

  const [loadingBills, setLoadingBills] = useState(true);
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  // ============================================================
  // LOAD RECEPTIONIST BILLS
  // ============================================================

  const loadBills = async () => {
    try {
      setLoadingBills(true);

      const data = await billService.getReceptionistBills();

      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load receptionist bills:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load bills.",
      );
    } finally {
      setLoadingBills(false);
    }
  };

  // ============================================================
  // BILL VALUE HELPER
  // ============================================================

  const getBillValue = (bill, camelCaseName, pascalCaseName) => {
    if (!bill) {
      return null;
    }

    return bill[camelCaseName] ?? bill[pascalCaseName];
  };

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================

  const getBillNumber = (bill) => {
    return (
      getBillValue(bill, "billNumber", "BillNumber") ||
      "Bill Reference Unavailable"
    );
  };

  const getPatientName = (bill) => {
    return (
      getBillValue(bill, "patientName", "PatientName") ||
      "Unknown Patient"
    );
  };

  const getDoctorName = (bill) => {
    return (
      getBillValue(bill, "doctorName", "DoctorName") ||
      "Unknown Doctor"
    );
  };

  const getTotalAmount = (bill) => {
    return (
      getBillValue(bill, "totalAmount", "TotalAmount") ??
      getBillValue(bill, "amount", "Amount")
    );
  };

  const getBillStatus = (bill) => {
    return (
      getBillValue(bill, "billStatus", "BillStatus") ||
      getBillValue(bill, "status", "Status") ||
      "Not provided"
    );
  };

  const getGeneratedDate = (bill) => {
    return getBillValue(
      bill,
      "generatedDate",
      "GeneratedDate",
    );
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return "Not provided";
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return amount;
    }

    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not provided";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusClass = (status) => {
    const normalizedStatus = String(status)
      .toLowerCase()
      .trim();

    if (
      normalizedStatus === "paid" ||
      normalizedStatus === "completed"
    ) {
      return "smarthealth-receptionist-ai-billing-status-paid";
    }

    if (
      normalizedStatus === "pending" ||
      normalizedStatus === "unpaid"
    ) {
      return "smarthealth-receptionist-ai-billing-status-pending";
    }

    if (
      normalizedStatus === "cancelled" ||
      normalizedStatus === "canceled"
    ) {
      return "smarthealth-receptionist-ai-billing-status-cancelled";
    }

    return "smarthealth-receptionist-ai-billing-status-default";
  };

  // ============================================================
  // BILL SELECTION
  // ============================================================

  const handleBillChange = (event) => {
    const billId = event.target.value;

    setSelectedBillId(billId);
    setValidationResult(null);

    const bill = bills.find(
      (item) =>
        getBillValue(item, "billId", "BillId") === billId,
    );

    setSelectedBill(bill || null);
  };

  // ============================================================
  // BILLING VALIDATION
  // ============================================================

  const handleValidateBill = async () => {
    if (!selectedBillId) {
      toast.error("Please select a bill first.");
      return;
    }

    try {
      setValidationLoading(true);
      setValidationResult(null);

      const response = await aiService.process({
        request:
          "Validate this bill for billing inconsistencies, payment issues, insurance issues, duplicate charges, suspicious billing patterns, missing information, and other potential billing problems. Provide a clear validation assessment and identify anything that requires human review.",
        billId: selectedBillId,
      });

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to validate the bill.",
        );
        return;
      }

      let parsedOutput = null;

      try {
        parsedOutput = response.output
          ? JSON.parse(response.output)
          : null;
      } catch {
        parsedOutput = null;
      }

      setValidationResult({
        ...response,
        parsedOutput,
      });

      if (response.requiresHumanApproval) {
        toast.warning(
          "This billing validation requires human review.",
        );
      } else {
        toast.success(
          "Bill validation completed successfully.",
        );
      }
    } catch (error) {
      console.error("Failed to validate bill:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to validate the bill.",
      );
    } finally {
      setValidationLoading(false);
    }
  };

  // ============================================================
  // VALIDATION OUTPUT HELPERS
  // ============================================================

  const getValidationValue = (key) => {
    return validationResult?.parsedOutput?.[key];
  };

  const getIssues = () => {
    const issues = getValidationValue("issues");

    return Array.isArray(issues) ? issues : [];
  };

  const getWarnings = () => {
    const warnings = getValidationValue("warnings");

    return Array.isArray(warnings) ? warnings : [];
  };

  const getValidationChecks = () => {
    const checks = getValidationValue(
      "validationChecks",
    );

    return Array.isArray(checks) ? checks : [];
  };

  const isBillValid = getValidationValue("isValid");

  // ============================================================
  // DISPLAY
  // ============================================================

  return (
    <div className="smarthealth-receptionist-ai-billing">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <section className="smarthealth-receptionist-ai-billing-header">
        <div className="smarthealth-receptionist-ai-billing-header-content">
          <span className="smarthealth-receptionist-ai-billing-eyebrow">
            Billing Intelligence
          </span>

          <h1>AI Billing Assistant</h1>

          <p>
            Use AI-assisted billing validation to identify
            inconsistencies, potential issues, and billing
            information that may require human review.
          </p>
        </div>

        <div className="smarthealth-receptionist-ai-billing-header-icon">
          ✦
        </div>
      </section>

      {/* ======================================================
          BILL VALIDATION
      ======================================================= */}

      <section className="smarthealth-receptionist-ai-billing-panel">

        <div className="smarthealth-receptionist-ai-billing-panel-header">
          <div>
            <span className="smarthealth-receptionist-ai-billing-section-label">
              Billing Intelligence
            </span>

            <h2>Bill Validation</h2>

            <p>
              Select an existing bill and ask the Billing
              Validation Agent to review it for potential
              billing problems.
            </p>
          </div>
        </div>

        <div className="smarthealth-receptionist-ai-billing-form">

          <div className="smarthealth-receptionist-ai-billing-field">
            <label htmlFor="smarthealth-receptionist-ai-billing-select">
              Bill
            </label>

            <select
              id="smarthealth-receptionist-ai-billing-select"
              value={selectedBillId}
              onChange={handleBillChange}
              disabled={
                loadingBills || validationLoading
              }
            >
              <option value="">
                {loadingBills
                  ? "Loading bills..."
                  : "Select a bill"}
              </option>

              {bills.map((bill) => {
                const billId = getBillValue(
                  bill,
                  "billId",
                  "BillId",
                );

                const billNumber = getBillNumber(bill);
                const patientName =
                  getPatientName(bill);
                const totalAmount =
                  getTotalAmount(bill);

                return (
                  <option
                    key={billId}
                    value={billId}
                  >
                    {billNumber} — {patientName} —{" "}
                    {formatCurrency(totalAmount)}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            className="smarthealth-receptionist-ai-billing-primary-button"
            onClick={handleValidateBill}
            disabled={
              !selectedBillId || validationLoading
            }
          >
            {validationLoading
              ? "Validating..."
              : "Validate Bill"}
          </button>
        </div>

        {/* ==================================================
            SELECTED BILL
        =================================================== */}

        {selectedBill && (
          <div className="smarthealth-receptionist-ai-billing-selected">

            <div className="smarthealth-receptionist-ai-billing-selected-heading">
              <span>Selected Bill</span>

              <strong>
                {getBillNumber(selectedBill)}
              </strong>
            </div>

            <div className="smarthealth-receptionist-ai-billing-selected-grid">

              <div>
                <span>Patient</span>

                <strong>
                  {getPatientName(selectedBill)}
                </strong>
              </div>

              <div>
                <span>Doctor</span>

                <strong>
                  {getDoctorName(selectedBill)}
                </strong>
              </div>

              <div>
                <span>Amount</span>

                <strong>
                  {formatCurrency(
                    getTotalAmount(selectedBill),
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong
                  className={getStatusClass(
                    getBillStatus(selectedBill),
                  )}
                >
                  {getBillStatus(selectedBill)}
                </strong>
              </div>

              <div>
                <span>Generated</span>

                <strong>
                  {formatDate(
                    getGeneratedDate(selectedBill),
                  )}
                </strong>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================
            AI VALIDATION RESULT
        =================================================== */}

        {validationResult && (
          <div className="smarthealth-receptionist-ai-billing-result">

            <div className="smarthealth-receptionist-ai-billing-result-heading">

              <div>
                <span>
                  AI Billing Validation
                </span>

                <h3>
                  {selectedBill
                    ? getBillNumber(selectedBill)
                    : "Bill Validation"}
                </h3>

                {selectedBill && (
                  <p className="smarthealth-receptionist-ai-billing-result-patient">
                    {getPatientName(selectedBill)}
                  </p>
                )}
              </div>

              <div className="smarthealth-receptionist-ai-billing-result-badges">

                {isBillValid !== undefined && (
                  <span
                    className={
                      isBillValid
                        ? "smarthealth-receptionist-ai-billing-valid-badge"
                        : "smarthealth-receptionist-ai-billing-invalid-badge"
                    }
                  >
                    {isBillValid
                      ? "Bill Valid"
                      : "Potential Issues Found"}
                  </span>
                )}

                {validationResult.requiresHumanApproval && (
                  <span className="smarthealth-receptionist-ai-billing-warning-badge">
                    Human Review Required
                  </span>
                )}

              </div>
            </div>

            {/* Overall Assessment */}

            {getValidationValue(
              "overallAssessment",
            ) && (
              <div className="smarthealth-receptionist-ai-billing-result-block">
                <h4>Overall Assessment</h4>

                <p>
                  {getValidationValue(
                    "overallAssessment",
                  )}
                </p>
              </div>
            )}

            {/* Validation Checks */}

            {getValidationChecks().length > 0 && (
              <div className="smarthealth-receptionist-ai-billing-result-block">

                <h4>Validation Checks</h4>

                <div className="smarthealth-receptionist-ai-billing-check-list">

                  {getValidationChecks().map(
                    (check, index) => {
                      if (
                        typeof check === "string"
                      ) {
                        return (
                          <div
                            className="smarthealth-receptionist-ai-billing-check"
                            key={index}
                          >
                            {check}
                          </div>
                        );
                      }

                      return (
                        <div
                          className="smarthealth-receptionist-ai-billing-check"
                          key={index}
                        >
                          <strong>
                            {check.name ||
                              check.check ||
                              check.title ||
                              `Validation Check ${
                                index + 1
                              }`}
                          </strong>

                          {check.status && (
                            <span>
                              {check.status}
                            </span>
                          )}

                          {check.result && (
                            <p>
                              {check.result}
                            </p>
                          )}

                          {check.details && (
                            <p>
                              {check.details}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}

                </div>
              </div>
            )}

            {/* Issues / Warnings */}

            <div className="smarthealth-receptionist-ai-billing-result-grid">

              <div className="smarthealth-receptionist-ai-billing-result-card smarthealth-receptionist-ai-billing-issue-card">
                <h4>Issues</h4>

                {getIssues().length > 0 ? (
                  <ul>
                    {getIssues().map(
                      (issue, index) => (
                        <li key={index}>
                          {typeof issue ===
                          "string"
                            ? issue
                            : issue.description ||
                              issue.message ||
                              issue.issue ||
                              JSON.stringify(
                                issue,
                              )}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p>
                    No billing issues identified.
                  </p>
                )}
              </div>

              <div className="smarthealth-receptionist-ai-billing-result-card smarthealth-receptionist-ai-billing-warning-card">
                <h4>Warnings</h4>

                {getWarnings().length > 0 ? (
                  <ul>
                    {getWarnings().map(
                      (warning, index) => (
                        <li key={index}>
                          {typeof warning ===
                          "string"
                            ? warning
                            : warning.description ||
                              warning.message ||
                              warning.warning ||
                              JSON.stringify(
                                warning,
                              )}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p>
                    No billing warnings identified.
                  </p>
                )}
              </div>

            </div>

            {/* AI Reasoning */}

            {getValidationValue(
              "reasoning",
            ) && (
              <div className="smarthealth-receptionist-ai-billing-reasoning">

                <strong>AI Reasoning</strong>

                <p>
                  {getValidationValue(
                    "reasoning",
                  )}
                </p>

              </div>
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          HUMAN REVIEW INFORMATION
      ======================================================= */}

      {validationResult?.requiresHumanApproval && (
        <section className="smarthealth-receptionist-ai-billing-panel">

          <div className="smarthealth-receptionist-ai-billing-review">

            <div className="smarthealth-receptionist-ai-billing-review-icon">
              !
            </div>

            <div>
              <span>
                Clinical Governance
              </span>

              <h2>
                Human Review Required
              </h2>

              <p>
                The AI billing validation has identified
                information that requires human review.
                The AI assistant does not directly modify
                billing records or perform financial
                transactions.
              </p>
            </div>

          </div>

        </section>
      )}

      {/* ======================================================
          EMPTY STATE
      ======================================================= */}

      {!loadingBills && bills.length === 0 && (
        <section className="smarthealth-receptionist-ai-billing-panel">

          <div className="smarthealth-receptionist-ai-billing-empty">

            <div className="smarthealth-receptionist-ai-billing-empty-icon">
              $
            </div>

            <h3>
              No bills available
            </h3>

            <p>
              There are currently no bills available
              for AI billing validation.
            </p>

          </div>

        </section>
      )}

    </div>
  );
};

export default ReceptionistAIBilling;