import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import insuranceService from "../../services/insuranceService";
import billService from "../../services/billService";

import "../../styles/pages/receptionist/ReceptionistInsurance.css";

const ReceptionistInsurance = () => {
  const [policies, setPolicies] = useState([]);
  const [bills, setBills] = useState([]);
  const [claims, setClaims] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processingPolicy, setProcessingPolicy] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(false);

  const [policySearchTerm, setPolicySearchTerm] = useState("");
  const [policyStatusFilter, setPolicyStatusFilter] =
    useState("All");

  const [claimSearchTerm, setClaimSearchTerm] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] =
    useState("All");

  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const [policyForm, setPolicyForm] = useState({
    patientId: "",
    providerName: "",
    policyNumber: "",
    startDate: "",
    endDate: "",
    coverageAmount: "",
  });

  const [claimForm, setClaimForm] = useState({
    insurancePolicyId: "",
    billId: "",
    claimAmount: "",
    claimDetails: "",
  });

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadInsuranceData = async () => {
    try {
      setLoading(true);

      const [policiesData, billsData] = await Promise.all([
        insuranceService.getAllPolicies(),
        billService.getReceptionistBills(),
      ]);

      const safePolicies = Array.isArray(policiesData)
        ? policiesData
        : [];

      const safeBills = Array.isArray(billsData)
        ? billsData
        : [];

      setPolicies(safePolicies);
      setBills(safeBills);

      // Load claims for bills that have insurance policies.
      const claimResults = await Promise.all(
        safeBills.map(async (bill) => {
          try {
            const billClaims =
              await insuranceService.getClaimsByBill(
                bill.billId
              );

            return Array.isArray(billClaims)
              ? billClaims
              : [];
          } catch (error) {
            console.error(
              `Failed to load claims for bill ${bill.billId}:`,
              error
            );

            return [];
          }
        })
      );

      const flattenedClaims = claimResults.flat();

      // Prevent duplicate claims if any are returned more than once.
      const uniqueClaims = Array.from(
        new Map(
          flattenedClaims.map((claim) => [
            claim.claimId,
            claim,
          ])
        ).values()
      );

      setClaims(uniqueClaims);
    } catch (error) {
      console.error(
        "Failed to load insurance information:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load insurance information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsuranceData();
  }, []);

  // ============================================================
  // POLICY HELPERS
  // ============================================================

  const isPolicyExpired = (policy) => {
    if (!policy.endDate) {
      return false;
    }

    const today = new Date();
    const endDate = new Date(
      `${policy.endDate}T23:59:59`
    );

    return endDate < today;
  };

  const activePolicies = policies.filter(
    (policy) =>
      policy.status?.toLowerCase() === "active" &&
      !isPolicyExpired(policy)
  );

  const expiredPolicies = policies.filter(
    (policy) =>
      isPolicyExpired(policy) ||
      policy.status?.toLowerCase() === "expired"
  );

  const filteredPolicies = useMemo(() => {
    const search =
      policySearchTerm.trim().toLowerCase();

    return policies.filter((policy) => {
      const matchesSearch =
        !search ||
        policy.patientName
          ?.toLowerCase()
          .includes(search) ||
        policy.providerName
          ?.toLowerCase()
          .includes(search) ||
        policy.policyNumber
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        policyStatusFilter === "All" ||
        policy.status?.toLowerCase() ===
          policyStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [
    policies,
    policySearchTerm,
    policyStatusFilter,
  ]);

  // ============================================================
  // CLAIM FILTERING
  // ============================================================

  const filteredClaims = useMemo(() => {
    const search =
      claimSearchTerm.trim().toLowerCase();

    return claims.filter((claim) => {
      const matchesSearch =
        !search ||
        claim.patientName
          ?.toLowerCase()
          .includes(search) ||
        claim.providerName
          ?.toLowerCase()
          .includes(search) ||
        claim.policyNumber
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        claimStatusFilter === "All" ||
        claim.status?.toLowerCase() ===
          claimStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [
    claims,
    claimSearchTerm,
    claimStatusFilter,
  ]);

  // ============================================================
  // BILL HELPERS
  // ============================================================

  const getBillPatientId = (bill) => {
    return bill.patientId;
  };

  const getEligibleBillsForPolicy = () => {
    if (!claimForm.insurancePolicyId) {
      return [];
    }

    const selectedPolicy = policies.find(
      (policy) =>
        policy.insurancePolicyId ===
        claimForm.insurancePolicyId
    );

    if (!selectedPolicy) {
      return [];
    }

    return bills.filter(
      (bill) =>
        getBillPatientId(bill) === selectedPolicy.patientId
    );
  };

  const eligibleBills = getEligibleBillsForPolicy();

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handlePolicyChange = (event) => {
    const { name, value } = event.target;

    setPolicyForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClaimChange = (event) => {
    const { name, value } = event.target;

    setClaimForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "insurancePolicyId") {
      setClaimForm((previous) => ({
        ...previous,
        insurancePolicyId: value,
        billId: "",
        claimAmount: "",
      }));
    }
  };

  // ============================================================
  // CREATE POLICY
  // ============================================================

  const handleCreatePolicy = async (event) => {
    event.preventDefault();

    if (!policyForm.patientId) {
      toast.error("Please select a patient.");
      return;
    }

    if (!policyForm.providerName.trim()) {
      toast.error(
        "Please enter the insurance provider name."
      );
      return;
    }

    if (!policyForm.policyNumber.trim()) {
      toast.error("Please enter the policy number.");
      return;
    }

    if (!policyForm.startDate || !policyForm.endDate) {
      toast.error(
        "Please select the policy start and end dates."
      );
      return;
    }

    if (policyForm.endDate < policyForm.startDate) {
      toast.error(
        "End date cannot be before the start date."
      );
      return;
    }

    const coverageAmount = Number(
      policyForm.coverageAmount
    );

    if (
      Number.isNaN(coverageAmount) ||
      coverageAmount < 0
    ) {
      toast.error(
        "Coverage amount cannot be negative."
      );
      return;
    }

    try {
      setProcessingPolicy(true);

      await insuranceService.createPolicy({
        patientId: policyForm.patientId,
        providerName: policyForm.providerName.trim(),
        policyNumber: policyForm.policyNumber.trim(),
        startDate: policyForm.startDate,
        endDate: policyForm.endDate,
        coverageAmount,
      });

      toast.success(
        "Insurance policy created successfully."
      );

      setPolicyForm({
        patientId: "",
        providerName: "",
        policyNumber: "",
        startDate: "",
        endDate: "",
        coverageAmount: "",
      });

      setShowPolicyForm(false);

      await loadInsuranceData();
    } catch (error) {
      console.error(
        "Failed to create insurance policy:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to create insurance policy."
      );
    } finally {
      setProcessingPolicy(false);
    }
  };

  // ============================================================
  // CREATE CLAIM
  // ============================================================

  const handleCreateClaim = async (event) => {
    event.preventDefault();

    if (!claimForm.insurancePolicyId) {
      toast.error("Please select an insurance policy.");
      return;
    }

    if (!claimForm.billId) {
      toast.error("Please select a bill.");
      return;
    }

    const claimAmount = Number(
      claimForm.claimAmount
    );

    if (
      Number.isNaN(claimAmount) ||
      claimAmount <= 0
    ) {
      toast.error(
        "Claim amount must be greater than zero."
      );
      return;
    }

    const selectedBill = bills.find(
      (bill) => bill.billId === claimForm.billId
    );

    if (!selectedBill) {
      toast.error("Selected bill was not found.");
      return;
    }

    if (claimAmount > Number(selectedBill.totalAmount)) {
      toast.error(
        "Claim amount cannot exceed the bill amount."
      );
      return;
    }

    try {
      setProcessingClaim(true);

      await insuranceService.createClaim({
        insurancePolicyId:
          claimForm.insurancePolicyId,
        billId: claimForm.billId,
        claimAmount,
        claimDetails:
          claimForm.claimDetails.trim() || null,
      });

      toast.success(
        "Insurance claim submitted successfully."
      );

      setClaimForm({
        insurancePolicyId: "",
        billId: "",
        claimAmount: "",
        claimDetails: "",
      });

      setShowClaimForm(false);

      await loadInsuranceData();
    } catch (error) {
      console.error(
        "Failed to create insurance claim:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to create insurance claim."
      );
    } finally {
      setProcessingClaim(false);
    }
  };

  // ============================================================
  // FORMATTERS
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

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleString(
      "en-US",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

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
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadInsuranceData();
    toast.success(
      "Insurance information refreshed."
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="smarthealth-receptionist-insurance-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="smarthealth-receptionist-insurance-header">
        <div>
          <h1 className="smarthealth-receptionist-insurance-title">
            Insurance Management
          </h1>

          <p className="smarthealth-receptionist-insurance-subtitle">
            Manage patient insurance policies and
            insurance claims.
          </p>
        </div>

        <button
          type="button"
          className="smarthealth-receptionist-insurance-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="smarthealth-receptionist-insurance-summary-grid">

        <div className="smarthealth-receptionist-insurance-summary-card">
          <div className="smarthealth-receptionist-insurance-summary-icon">
            🛡️
          </div>

          <div>
            <span className="smarthealth-receptionist-insurance-summary-label">
              Total Policies
            </span>

            <strong className="smarthealth-receptionist-insurance-summary-value">
              {policies.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-insurance-summary-card">
          <div className="smarthealth-receptionist-insurance-summary-icon">
            ✓
          </div>

          <div>
            <span className="smarthealth-receptionist-insurance-summary-label">
              Active Policies
            </span>

            <strong className="smarthealth-receptionist-insurance-summary-value">
              {activePolicies.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-insurance-summary-card">
          <div className="smarthealth-receptionist-insurance-summary-icon">
            ⏳
          </div>

          <div>
            <span className="smarthealth-receptionist-insurance-summary-label">
              Expired Policies
            </span>

            <strong className="smarthealth-receptionist-insurance-summary-value">
              {expiredPolicies.length}
            </strong>
          </div>
        </div>

        <div className="smarthealth-receptionist-insurance-summary-card">
          <div className="smarthealth-receptionist-insurance-summary-icon">
            📄
          </div>

          <div>
            <span className="smarthealth-receptionist-insurance-summary-label">
              Total Claims
            </span>

            <strong className="smarthealth-receptionist-insurance-summary-value">
              {claims.length}
            </strong>
          </div>
        </div>

      </div>

      {/* ======================================================
          POLICIES
      ======================================================= */}

      <section className="smarthealth-receptionist-insurance-section">

        <div className="smarthealth-receptionist-insurance-section-header">

          <div>
            <h2 className="smarthealth-receptionist-insurance-section-title">
              Insurance Policies
            </h2>

            <p className="smarthealth-receptionist-insurance-section-description">
              View and manage patient insurance
              policies.
            </p>
          </div>

          <button
            type="button"
            className="smarthealth-receptionist-insurance-primary-button"
            onClick={() =>
              setShowPolicyForm(
                (previous) => !previous
              )
            }
          >
            {showPolicyForm
              ? "Close Form"
              : "+ Add Policy"}
          </button>

        </div>

        {/* Policy Form */}

        {showPolicyForm && (
          <div className="smarthealth-receptionist-insurance-form-panel">

            <div className="smarthealth-receptionist-insurance-form-header">
              <div>
                <h3 className="smarthealth-receptionist-insurance-form-title">
                  Add Insurance Policy
                </h3>

                <p className="smarthealth-receptionist-insurance-form-description">
                  Create a new insurance policy for
                  a patient.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreatePolicy}
              className="smarthealth-receptionist-insurance-form"
            >

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Patient
                </label>

                <select
                  name="patientId"
                  value={policyForm.patientId}
                  onChange={handlePolicyChange}
                  required
                >
                  <option value="">
                    Select patient
                  </option>

                  {bills
                    .filter(
                      (bill, index, array) =>
                        array.findIndex(
                          (item) =>
                            item.patientId ===
                            bill.patientId
                        ) === index
                    )
                    .map((bill) => (
                      <option
                        key={bill.patientId}
                        value={bill.patientId}
                      >
                        {bill.patientName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Provider Name
                </label>

                <input
                  type="text"
                  name="providerName"
                  value={policyForm.providerName}
                  onChange={handlePolicyChange}
                  placeholder="Enter insurance provider"
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Policy Number
                </label>

                <input
                  type="text"
                  name="policyNumber"
                  value={policyForm.policyNumber}
                  onChange={handlePolicyChange}
                  placeholder="Enter policy number"
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  name="startDate"
                  value={policyForm.startDate}
                  onChange={handlePolicyChange}
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  End Date
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={policyForm.endDate}
                  onChange={handlePolicyChange}
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Coverage Amount
                </label>

                <input
                  type="number"
                  name="coverageAmount"
                  value={policyForm.coverageAmount}
                  onChange={handlePolicyChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-actions">

                <button
                  type="button"
                  className="smarthealth-receptionist-insurance-secondary-button"
                  onClick={() =>
                    setShowPolicyForm(false)
                  }
                  disabled={processingPolicy}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-receptionist-insurance-primary-button"
                  disabled={processingPolicy}
                >
                  {processingPolicy
                    ? "Creating..."
                    : "Create Policy"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Policy Filters */}

        <div className="smarthealth-receptionist-insurance-filter-bar">

          <input
            type="text"
            value={policySearchTerm}
            onChange={(event) =>
              setPolicySearchTerm(
                event.target.value
              )
            }
            placeholder="Search patient, provider or policy..."
            className="smarthealth-receptionist-insurance-search"
          />

          <select
            value={policyStatusFilter}
            onChange={(event) =>
              setPolicyStatusFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-insurance-filter-select"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Expired">
              Expired
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          <span className="smarthealth-receptionist-insurance-count">
            {filteredPolicies.length}
          </span>

        </div>

        {/* Policy Table */}

        {loading ? (
          <div className="smarthealth-receptionist-insurance-loading">
            Loading insurance policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="smarthealth-receptionist-insurance-empty">
            <div className="smarthealth-receptionist-insurance-empty-icon">
              🛡️
            </div>

            <h3 className="smarthealth-receptionist-insurance-empty-title">
              No insurance policies
            </h3>

            <p className="smarthealth-receptionist-insurance-empty-text">
              No insurance policies match the
              current filters.
            </p>
          </div>
        ) : (
          <div className="smarthealth-receptionist-insurance-table-wrapper">

            <table className="smarthealth-receptionist-insurance-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Policy Number</th>
                  <th>Coverage</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPolicies.map(
                  (policy) => {

                    const expired =
                      isPolicyExpired(policy);

                    return (
                      <tr
                        key={
                          policy.insurancePolicyId
                        }
                      >
                        <td>
                          <strong>
                            {policy.patientName ||
                              "Unknown Patient"}
                          </strong>
                        </td>

                        <td>
                          {policy.providerName}
                        </td>

                        <td>
                          <span className="smarthealth-receptionist-insurance-policy-number">
                            {policy.policyNumber}
                          </span>
                        </td>

                        <td>
                          Rs.{" "}
                          {formatAmount(
                            policy.coverageAmount
                          )}
                        </td>

                        <td>
                          {formatDate(
                            policy.startDate
                          )}
                        </td>

                        <td>
                          {formatDate(
                            policy.endDate
                          )}
                        </td>

                        <td>
                          <span
                            className={`smarthealth-receptionist-insurance-status-badge ${
                              expired
                                ? "smarthealth-receptionist-insurance-status-expired"
                                : `smarthealth-receptionist-insurance-status-${String(
                                    policy.status ||
                                      "unknown"
                                  )
                                    .toLowerCase()
                                    .replace(
                                      /\s+/g,
                                      "-"
                                    )}`
                            }`}
                          >
                            {expired
                              ? "Expired"
                              : policy.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* ======================================================
          CLAIMS
      ======================================================= */}

      <section className="smarthealth-receptionist-insurance-section">

        <div className="smarthealth-receptionist-insurance-section-header">

          <div>
            <h2 className="smarthealth-receptionist-insurance-section-title">
              Insurance Claims
            </h2>

            <p className="smarthealth-receptionist-insurance-section-description">
              Submit and view insurance claims
              linked to patient bills.
            </p>
          </div>

          <button
            type="button"
            className="smarthealth-receptionist-insurance-primary-button"
            onClick={() =>
              setShowClaimForm(
                (previous) => !previous
              )
            }
          >
            {showClaimForm
              ? "Close Form"
              : "+ Create Claim"}
          </button>

        </div>

        {/* Claim Form */}

        {showClaimForm && (
          <div className="smarthealth-receptionist-insurance-form-panel">

            <div className="smarthealth-receptionist-insurance-form-header">
              <div>
                <h3 className="smarthealth-receptionist-insurance-form-title">
                  Create Insurance Claim
                </h3>

                <p className="smarthealth-receptionist-insurance-form-description">
                  Submit a claim against an
                  eligible patient bill.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateClaim}
              className="smarthealth-receptionist-insurance-form"
            >

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Insurance Policy
                </label>

                <select
                  name="insurancePolicyId"
                  value={
                    claimForm.insurancePolicyId
                  }
                  onChange={handleClaimChange}
                  required
                >
                  <option value="">
                    Select insurance policy
                  </option>

                  {activePolicies.map(
                    (policy) => (
                      <option
                        key={
                          policy.insurancePolicyId
                        }
                        value={
                          policy.insurancePolicyId
                        }
                      >
                        {policy.patientName} —{" "}
                        {policy.providerName} (
                        {policy.policyNumber})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Bill
                </label>

                <select
                  name="billId"
                  value={claimForm.billId}
                  onChange={handleClaimChange}
                  disabled={
                    !claimForm.insurancePolicyId
                  }
                  required
                >
                  <option value="">
                    {!claimForm.insurancePolicyId
                      ? "Select policy first"
                      : "Select bill"}
                  </option>

                  {eligibleBills.map(
                    (bill) => (
                      <option
                        key={bill.billId}
                        value={bill.billId}
                      >
                        {bill.patientName} — Rs.{" "}
                        {formatAmount(
                          bill.totalAmount
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="smarthealth-receptionist-insurance-form-group">
                <label>
                  Claim Amount
                </label>

                <input
                  type="number"
                  name="claimAmount"
                  value={claimForm.claimAmount}
                  onChange={handleClaimChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-group smarthealth-receptionist-insurance-form-group-wide">
                <label>
                  Claim Details
                </label>

                <textarea
                  name="claimDetails"
                  value={claimForm.claimDetails}
                  onChange={handleClaimChange}
                  placeholder="Enter claim details..."
                  rows="4"
                />
              </div>

              <div className="smarthealth-receptionist-insurance-form-actions">

                <button
                  type="button"
                  className="smarthealth-receptionist-insurance-secondary-button"
                  onClick={() =>
                    setShowClaimForm(false)
                  }
                  disabled={processingClaim}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="smarthealth-receptionist-insurance-primary-button"
                  disabled={processingClaim}
                >
                  {processingClaim
                    ? "Submitting..."
                    : "Submit Claim"}
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Claim Filters */}

        <div className="smarthealth-receptionist-insurance-filter-bar">

          <input
            type="text"
            value={claimSearchTerm}
            onChange={(event) =>
              setClaimSearchTerm(
                event.target.value
              )
            }
            placeholder="Search patient, provider or policy..."
            className="smarthealth-receptionist-insurance-search"
          />

          <select
            value={claimStatusFilter}
            onChange={(event) =>
              setClaimStatusFilter(
                event.target.value
              )
            }
            className="smarthealth-receptionist-insurance-filter-select"
          >
            <option value="All">
              All Statuses
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>

          <span className="smarthealth-receptionist-insurance-count">
            {filteredClaims.length}
          </span>

        </div>

        {/* Claim Table */}

        {loading ? (
          <div className="smarthealth-receptionist-insurance-loading">
            Loading insurance claims...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="smarthealth-receptionist-insurance-empty">
            <div className="smarthealth-receptionist-insurance-empty-icon">
              📄
            </div>

            <h3 className="smarthealth-receptionist-insurance-empty-title">
              No insurance claims
            </h3>

            <p className="smarthealth-receptionist-insurance-empty-text">
              Submitted insurance claims will
              appear here.
            </p>
          </div>
        ) : (
          <div className="smarthealth-receptionist-insurance-table-wrapper">

            <table className="smarthealth-receptionist-insurance-table">

              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Provider</th>
                  <th>Policy Number</th>
                  <th>Bill Amount</th>
                  <th>Claim Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredClaims.map(
                  (claim) => (
                    <tr key={claim.claimId}>

                      <td>
                        <strong>
                          {claim.patientName ||
                            "Unknown Patient"}
                        </strong>
                      </td>

                      <td>
                        {claim.providerName}
                      </td>

                      <td>
                        <span className="smarthealth-receptionist-insurance-policy-number">
                          {claim.policyNumber}
                        </span>
                      </td>

                      <td>
                        Rs.{" "}
                        {formatAmount(
                          claim.billAmount
                        )}
                      </td>

                      <td>
                        <strong className="smarthealth-receptionist-insurance-claim-amount">
                          Rs.{" "}
                          {formatAmount(
                            claim.claimAmount
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatDateTime(
                          claim.submittedAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`smarthealth-receptionist-insurance-status-badge smarthealth-receptionist-insurance-claim-status-${String(
                            claim.status ||
                              "unknown"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {claim.status}
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

export default ReceptionistInsurance;