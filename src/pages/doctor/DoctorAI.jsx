import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import appointmentService from "../../services/appointmentService";
import aiService from "../../services/aiService";

import "../../styles/pages/doctor/DoctorAI.css";

const DoctorAI = () => {
  const [appointments, setAppointments] = useState([]);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientName, setSelectedPatientName] = useState("");

  const [symptoms, setSymptoms] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  const [medicalSummary, setMedicalSummary] = useState(null);

  const [recommendations, setRecommendations] = useState([]);

  const [pendingApprovals, setPendingApprovals] = useState([]);

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [approvalComments, setApprovalComments] = useState({});


  useEffect(() => {
    loadDoctorAppointments();
    loadPendingApprovals();
  }, []);

  const loadDoctorAppointments = async () => {
    try {
      setLoadingPatients(true);

      const data = await appointmentService.getDoctorAppointments();

      setAppointments(data || []);
    } catch (error) {
      console.error("Failed to load doctor appointments:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load your patients.",
      );
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const data = await aiService.getPendingApprovals();

      setPendingApprovals(data || []);
    } catch (error) {
      console.error("Failed to load AI approvals:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load pending AI approvals.",
      );
    }
  };

  /*
   * =========================================================
   * UNIQUE PATIENTS FROM REAL DOCTOR APPOINTMENTS
   * =========================================================
   */

  const patients = useMemo(() => {
    const patientMap = new Map();

    appointments.forEach((appointment) => {
      if (!appointment.patientId) {
        return;
      }

      if (!patientMap.has(appointment.patientId)) {
        patientMap.set(appointment.patientId, {
          patientId: appointment.patientId,
          patientName: appointment.patientName || "Unnamed Patient",
        });
      }
    });

    return Array.from(patientMap.values()).sort((first, second) =>
      first.patientName.localeCompare(second.patientName),
    );
  }, [appointments]);

  /*
   * =========================================================
   * PATIENT SELECTION
   * =========================================================
   */

  const handlePatientChange = (event) => {
    const patientId = event.target.value;

    setSelectedPatientId(patientId);

    const selectedPatient = patients.find(
      (patient) => patient.patientId === patientId,
    );

    setSelectedPatientName(selectedPatient?.patientName || "");

    setMedicalSummary(null);
    setRecommendations([]);
  };

  /*
   * =========================================================
   * MEDICAL SUMMARY
   * =========================================================
   */

  const handleGenerateMedicalSummary = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient first.");
      return;
    }

    try {
      setSummaryLoading(true);

      const response = await aiService.process({
        request:
          "Generate a medical summary for this patient using the patient's medical history and records.",
        patientId: selectedPatientId,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to generate medical summary.");
        return;
      }

      let parsedOutput = null;

      try {
        parsedOutput = response.output ? JSON.parse(response.output) : null;
      } catch {
        parsedOutput = null;
      }

      setMedicalSummary({
        ...response,
        parsedOutput,
      });

      if (response.workflowId) {
        await loadRecommendations(response.workflowId);
      }

      toast.success("Medical summary generated successfully.");
    } catch (error) {
      console.error("Failed to generate medical summary:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to generate medical summary.",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  /*
   * =========================================================
   * TRIAGE
   * =========================================================
   */

  const handleTriage = async () => {
    if (!symptoms.trim()) {
      toast.error("Please enter the patient's symptoms.");
      return;
    }

    try {
      setTriageLoading(true);

      const response = await aiService.process({
        request: `Patient symptom assessment: ${symptoms}`,
        patientId: selectedPatientId || null,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to perform AI triage.");
        return;
      }

      let parsedOutput = null;

      try {
        parsedOutput = response.output ? JSON.parse(response.output) : null;
      } catch {
        parsedOutput = null;
      }

      setTriageResult({
        ...response,
        parsedOutput,
      });

      if (response.workflowId) {
        await loadRecommendations(response.workflowId);
      }

      if (response.requiresHumanApproval) {
        toast.warning("This triage result requires human review.");

        await loadPendingApprovals();
      } else {
        toast.success("AI triage completed.");
      }
    } catch (error) {
      console.error("Failed to perform AI triage:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to perform AI triage.",
      );
    } finally {
      setTriageLoading(false);
    }
  };

  /*
   * =========================================================
   * RECOMMENDATIONS
   * =========================================================
   */

  const loadRecommendations = async (workflowId) => {
    try {
      const data = await aiService.getWorkflowRecommendations(workflowId);

      setRecommendations(data || []);
    } catch (error) {
      console.error("Failed to load AI recommendations:", error);
    }
  };

  /*
   * =========================================================
   * APPROVAL COMMENTS
   * =========================================================
   */

  const handleApprovalCommentChange = (approvalId, value) => {
    setApprovalComments((previous) => ({
      ...previous,
      [approvalId]: value,
    }));
  };

  /*
   * =========================================================
   * APPROVE
   * =========================================================
   */

  const handleApprove = async (approvalId) => {
    try {
      setApprovalLoading(true);

      const comments = approvalComments[approvalId] || "";

      await aiService.approve(approvalId, comments);

      toast.success("AI recommendation approved.");

      await loadPendingApprovals();
    } catch (error) {
      console.error("Failed to approve AI recommendation:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to approve AI recommendation.",
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  /*
   * =========================================================
   * REJECT
   * =========================================================
   */

  const handleReject = async (approvalId) => {
    const comments = approvalComments[approvalId]?.trim() || "";

    if (!comments) {
      toast.error("Please provide a reason before rejecting.");
      return;
    }

    try {
      setApprovalLoading(true);

      await aiService.reject(approvalId, comments);

      toast.success("AI recommendation rejected.");

      await loadPendingApprovals();
    } catch (error) {
      console.error("Failed to reject AI recommendation:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to reject AI recommendation.",
      );
    } finally {
      setApprovalLoading(false);
    }
  };

  /*
   * =========================================================
   * OUTPUT HELPERS
   * =========================================================
   */

  const getSummaryValue = (key) => {
    return medicalSummary?.parsedOutput?.[key];
  };

  const getTriageValue = (key) => {
    return triageResult?.parsedOutput?.[key];
  };

  return (
    <div className="smarthealth-doctor-ai">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="smarthealth-doctor-ai-header">
        <div className="smarthealth-doctor-ai-header-content">
          <span className="smarthealth-doctor-ai-eyebrow">
            Clinical Intelligence
          </span>

          <h1>AI Assistant</h1>

          <p>
            Use AI-assisted medical summaries, symptom triage, recommendations,
            and human approval workflows.
          </p>
        </div>

        <div className="smarthealth-doctor-ai-header-icon">✨</div>
      </section>

      {/* =====================================================
          MEDICAL SUMMARY
      ====================================================== */}

      <section className="smarthealth-doctor-ai-panel">
        <div className="smarthealth-doctor-ai-panel-header">
          <div>
            <span className="smarthealth-doctor-ai-section-label">
              Medical Intelligence
            </span>

            <h2>Medical Summary</h2>

            <p>
              Generate an AI-assisted summary from the selected patient's
              existing medical records.
            </p>
          </div>
        </div>

        <div className="smarthealth-doctor-ai-form">
          <div className="smarthealth-doctor-ai-field">
            <label htmlFor="smarthealth-doctor-ai-patient">Patient</label>

            <select
              id="smarthealth-doctor-ai-patient"
              value={selectedPatientId}
              onChange={handlePatientChange}
              disabled={loadingPatients || summaryLoading}
            >
              <option value="">
                {loadingPatients ? "Loading patients..." : "Select a patient"}
              </option>

              {patients.map((patient) => (
                <option key={patient.patientId} value={patient.patientId}>
                  {patient.patientName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="smarthealth-doctor-ai-primary-button"
            onClick={handleGenerateMedicalSummary}
            disabled={!selectedPatientId || summaryLoading}
          >
            {summaryLoading ? "Generating..." : "Generate Medical Summary"}
          </button>
        </div>

        {selectedPatientName && (
          <div className="smarthealth-doctor-ai-selected-patient">
            <span>Selected patient</span>
            <strong>{selectedPatientName}</strong>
          </div>
        )}

        {medicalSummary && (
          <div className="smarthealth-doctor-ai-result">
            <div className="smarthealth-doctor-ai-result-heading">
              <div>
                <span>AI Medical Summary</span>

                <h3>{selectedPatientName}</h3>
              </div>

              {medicalSummary.requiresHumanApproval && (
                <span className="smarthealth-doctor-ai-warning-badge">
                  Human Review Required
                </span>
              )}
            </div>

            {getSummaryValue("patientOverview") && (
              <div className="smarthealth-doctor-ai-result-block">
                <h4>Patient Overview</h4>

                <p>{getSummaryValue("patientOverview")}</p>
              </div>
            )}

            {getSummaryValue("clinicalSummary") && (
              <div className="smarthealth-doctor-ai-result-block">
                <h4>Clinical Summary</h4>

                <p>{getSummaryValue("clinicalSummary")}</p>
              </div>
            )}

            <div className="smarthealth-doctor-ai-result-grid">
              <div className="smarthealth-doctor-ai-result-card">
                <h4>Allergies</h4>

                {Array.isArray(getSummaryValue("allergies")) &&
                getSummaryValue("allergies").length > 0 ? (
                  <ul>
                    {getSummaryValue("allergies").map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No allergies recorded.</p>
                )}
              </div>

              <div className="smarthealth-doctor-ai-result-card">
                <h4>Chronic Conditions</h4>

                {Array.isArray(getSummaryValue("chronicConditions")) &&
                getSummaryValue("chronicConditions").length > 0 ? (
                  <ul>
                    {getSummaryValue("chronicConditions").map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No chronic conditions recorded.</p>
                )}
              </div>

              <div className="smarthealth-doctor-ai-result-card">
                <h4>Recent Diagnoses</h4>

                {Array.isArray(getSummaryValue("recentDiagnoses")) &&
                getSummaryValue("recentDiagnoses").length > 0 ? (
                  <ul>
                    {getSummaryValue("recentDiagnoses").map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent diagnoses recorded.</p>
                )}
              </div>

              <div className="smarthealth-doctor-ai-result-card">
                <h4>Recent Medications</h4>

                {Array.isArray(getSummaryValue("recentMedications")) &&
                getSummaryValue("recentMedications").length > 0 ? (
                  <ul>
                    {getSummaryValue("recentMedications").map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No recent medications recorded.</p>
                )}
              </div>
            </div>

            {getSummaryValue("limitations") && (
              <div className="smarthealth-doctor-ai-limitation">
                <strong>Limitations</strong>

                <p>{getSummaryValue("limitations")}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          TRIAGE
      ====================================================== */}

      <section className="smarthealth-doctor-ai-panel">
        <div className="smarthealth-doctor-ai-panel-header">
          <div>
            <span className="smarthealth-doctor-ai-section-label">
              Clinical Support
            </span>

            <h2>Patient Triage Review</h2>

            <p>
              Submit symptoms to the AI triage agent for an urgency and
              specialization recommendation.
            </p>
          </div>
        </div>

        <div className="smarthealth-doctor-ai-triage-form">
          <div className="smarthealth-doctor-ai-field">
            <label htmlFor="smarthealth-doctor-ai-symptoms">Symptoms</label>

            <textarea
              id="smarthealth-doctor-ai-symptoms"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder="Enter the patient's reported symptoms..."
              rows={5}
              disabled={triageLoading}
            />
          </div>

          <button
            type="button"
            className="smarthealth-doctor-ai-primary-button"
            onClick={handleTriage}
            disabled={!symptoms.trim() || triageLoading}
          >
            {triageLoading ? "Assessing..." : "Run AI Triage"}
          </button>
        </div>

        {triageResult && (
          <div className="smarthealth-doctor-ai-triage-result">
            <div className="smarthealth-doctor-ai-result-heading">
              <div>
                <span>AI Triage Result</span>
                <h3>Clinical Assessment</h3>
              </div>

              {triageResult.requiresHumanApproval && (
                <span className="smarthealth-doctor-ai-warning-badge">
                  Human Review Required
                </span>
              )}
            </div>

            <div className="smarthealth-doctor-ai-triage-grid">
              <div className="smarthealth-doctor-ai-triage-card">
                <span>Urgency Level</span>

                <strong>
                  {getTriageValue("urgencyLevel") || "Not provided"}
                </strong>
              </div>

              <div className="smarthealth-doctor-ai-triage-card">
                <span>Recommended Specialization</span>

                <strong>
                  {getTriageValue("recommendedSpecialization") ||
                    "Not provided"}
                </strong>
              </div>

              <div className="smarthealth-doctor-ai-triage-card">
                <span>Emergency Indicator</span>

                <strong
                  className={
                    getTriageValue("emergencyIndicator")
                      ? "smarthealth-doctor-ai-emergency"
                      : "smarthealth-doctor-ai-no-emergency"
                  }
                >
                  {getTriageValue("emergencyIndicator") ? "Yes" : "No"}
                </strong>
              </div>
            </div>

            {getTriageValue("reasoning") && (
              <div className="smarthealth-doctor-ai-result-block">
                <h4>AI Reasoning</h4>

                <p>{getTriageValue("reasoning")}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          AI RECOMMENDATIONS
      ====================================================== */}

      {recommendations.length > 0 && (
        <section className="smarthealth-doctor-ai-panel">
          <div className="smarthealth-doctor-ai-panel-header">
            <div>
              <span className="smarthealth-doctor-ai-section-label">
                AI Output
              </span>

              <h2>AI Recommendations</h2>

              <p>Recommendations generated during the latest AI workflow.</p>
            </div>
          </div>

          <div className="smarthealth-doctor-ai-recommendation-list">
            {recommendations.map((recommendation) => (
              <div
                className="smarthealth-doctor-ai-recommendation"
                key={recommendation.recommendationId}
              >
                <div className="smarthealth-doctor-ai-recommendation-header">
                  <span>{recommendation.recommendationType}</span>

                  <small>{recommendation.status}</small>
                </div>

                <p>{recommendation.recommendation}</p>

                {recommendation.reasoning && (
                  <div className="smarthealth-doctor-ai-recommendation-reasoning">
                    <strong>Reasoning</strong>

                    <p>{recommendation.reasoning}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          HUMAN APPROVAL
      ====================================================== */}

      <section className="smarthealth-doctor-ai-panel">
        <div className="smarthealth-doctor-ai-panel-header">
          <div>
            <span className="smarthealth-doctor-ai-section-label">
              Clinical Governance
            </span>

            <h2>Pending Human Approvals</h2>

            <p>Review AI workflows that require a doctor's decision.</p>
          </div>

          <button
            type="button"
            className="smarthealth-doctor-ai-secondary-button"
            onClick={loadPendingApprovals}
            disabled={approvalLoading}
          >
            Refresh
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="smarthealth-doctor-ai-empty">
            <div className="smarthealth-doctor-ai-empty-icon">✓</div>

            <h3>No pending approvals</h3>

            <p>There are currently no AI workflows waiting for your review.</p>
          </div>
        ) : (
          <div className="smarthealth-doctor-ai-approval-list">
            {pendingApprovals.map((approval) => (
              <div
                className="smarthealth-doctor-ai-approval"
                key={approval.approvalId}
              >
                <div className="smarthealth-doctor-ai-approval-header">
                  <div>
                    <span>{approval.workflowType || "AI Workflow"}</span>

                    <h3>
                      {approval.userRequest || "AI workflow requires review"}
                    </h3>
                  </div>

                  <span className="smarthealth-doctor-ai-pending-badge">
                    Pending
                  </span>
                </div>

                <div className="smarthealth-doctor-ai-approval-meta">
                  {approval.patientId && (
                    <span>Patient ID: {approval.patientId}</span>
                  )}

                  {approval.appointmentId && (
                    <span>Appointment ID: {approval.appointmentId}</span>
                  )}
                </div>

                <div className="smarthealth-doctor-ai-field">
                  <label
                    htmlFor={`smarthealth-doctor-ai-approval-${approval.approvalId}`}
                  >
                    Comments
                  </label>

                  <textarea
                    id={`smarthealth-doctor-ai-approval-${approval.approvalId}`}
                    value={approvalComments[approval.approvalId] || ""}
                    onChange={(event) =>
                      handleApprovalCommentChange(
                        approval.approvalId,
                        event.target.value,
                      )
                    }
                    placeholder="Add your review comments..."
                    rows={3}
                  />
                </div>

                <div className="smarthealth-doctor-ai-approval-actions">
                  <button
                    type="button"
                    className="smarthealth-doctor-ai-approve-button"
                    onClick={() => handleApprove(approval.approvalId)}
                    disabled={approvalLoading}
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="smarthealth-doctor-ai-reject-button"
                    onClick={() => handleReject(approval.approvalId)}
                    disabled={approvalLoading}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorAI;
