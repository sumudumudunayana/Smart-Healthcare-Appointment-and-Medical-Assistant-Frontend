import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import aiService from "../../services/aiService";

import "../../styles/pages/admin/AdminAI.css";

const AdminAI = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [approvalActionId, setApprovalActionId] = useState(null);
  const [approvalComments, setApprovalComments] = useState({});

  const [auditStatusFilter, setAuditStatusFilter] = useState("All");
  const [auditAgentFilter, setAuditAgentFilter] = useState("All");

  // =========================================================
  // LOAD WORKFLOWS
  // =========================================================

  const loadWorkflows = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await aiService.getWorkflows();

      setWorkflows(data || []);
    } catch (error) {
      console.error("Failed to load AI workflows:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load AI workflows.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // LOAD PENDING AI APPROVALS
  // =========================================================

  const loadPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);

      const data = await aiService.getPendingApprovals();

      setPendingApprovals(data || []);
    } catch (error) {
      console.error("Failed to load pending AI approvals:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load pending AI approvals.",
      );
    } finally {
      setApprovalsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadPendingApprovals();
  }, []);

  // =========================================================
  // LOAD WORKFLOW DETAILS
  // =========================================================

  const handleWorkflowSelect = async (workflowId) => {
    try {
      setDetailsLoading(true);

      const workflow = await aiService.getWorkflow(workflowId);

      let recommendations = [];

      try {
        recommendations =
          await aiService.getWorkflowRecommendations(workflowId);
      } catch (recommendationError) {
        console.error(
          "Failed to load AI recommendations:",
          recommendationError,
        );
      }

      setSelectedWorkflow({
        ...workflow,
        recommendations: recommendations || [],
      });
    } catch (error) {
      console.error("Failed to load AI workflow details:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load workflow details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // =========================================================
  // FIND WORKFLOW FOR APPROVAL
  // =========================================================

  const getWorkflowForApproval = (approval) => {
    return workflows.find(
      (workflow) => workflow.workflowId === approval.workflowId,
    );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const workflowStatistics = useMemo(() => {
    const statistics = {
      total: workflows.length,
      started: 0,
      completed: 0,
      awaitingApproval: 0,
      failed: 0,
      approved: 0,
      rejected: 0,
    };

    workflows.forEach((workflow) => {
      const status = workflow.status?.toLowerCase();

      switch (status) {
        case "started":
          statistics.started += 1;
          break;

        case "completed":
          statistics.completed += 1;
          break;

        case "awaitingapproval":
          statistics.awaitingApproval += 1;
          break;

        case "failed":
          statistics.failed += 1;
          break;

        case "approved":
          statistics.approved += 1;
          break;

        case "rejected":
          statistics.rejected += 1;
          break;

        default:
          break;
      }
    });

    return statistics;
  }, [workflows]);

  const auditAgents = useMemo(() => {
    return [
      ...new Set(
        workflows.map((workflow) => workflow.agentName).filter(Boolean),
      ),
    ].sort();
  }, [workflows]);

  const auditStatuses = useMemo(() => {
    return [
      ...new Set(workflows.map((workflow) => workflow.status).filter(Boolean)),
    ].sort();
  }, [workflows]);

  const auditHistory = useMemo(() => {
    return workflows
      .filter((workflow) => {
        const statusMatches =
          auditStatusFilter === "All" ||
          workflow.status?.toLowerCase() === auditStatusFilter.toLowerCase();

        const agentMatches =
          auditAgentFilter === "All" || workflow.agentName === auditAgentFilter;

        return statusMatches && agentMatches;
      })
      .sort(
        (first, second) =>
          new Date(second.startedAt) - new Date(first.startedAt),
      );
  }, [workflows, auditStatusFilter, auditAgentFilter]);

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  };

  // =========================================================
  // DATE ONLY FORMAT
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  };

  // =========================================================
  // TIME FORMAT
  // =========================================================

  const formatTime = (value) => {
    if (!value) {
      return "—";
    }

    const timeParts = value.split(":");

    if (timeParts.length < 2) {
      return value;
    }

    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // DISPLAY AGENT NAME
  // =========================================================

  const formatAgentName = (agentName) => {
    if (!agentName) {
      return "Healthcare AI";
    }

    const formattedNames = {
      AppointmentSchedulingAgent: "Appointment Scheduling Agent",
      PatientTriageAgent: "Patient Triage Agent",
      MedicalSummaryAgent: "Medical Summary Agent",
      BillingValidationAgent: "Billing Validation Agent",
    };

    return formattedNames[agentName] || agentName;
  };

  // =========================================================
  // DISPLAY WORKFLOW TYPE
  // =========================================================

  const formatWorkflowType = (workflowType) => {
    if (!workflowType) {
      return "Healthcare AI";
    }

    const formattedTypes = {
      AppointmentScheduling: "Appointment Scheduling",
      PatientTriage: "Patient Triage",
      MedicalSummary: "Medical Summary",
      BillingValidation: "Billing Validation",
      HealthcareAI: "Healthcare AI",
    };

    return formattedTypes[workflowType] || workflowType;
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-completed";

      case "started":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-started";

      case "awaitingapproval":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-awaiting";

      case "approved":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-approved";

      case "rejected":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-rejected";

      case "failed":
        return "smarthealth-admin-ai-status smarthealth-admin-ai-status-failed";

      default:
        return "smarthealth-admin-ai-status";
    }
  };

  // =========================================================
  // AGENT STEP STATUS
  // =========================================================

  const getStepStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "smarthealth-admin-ai-step-status smarthealth-admin-ai-step-status-completed";

      case "started":
        return "smarthealth-admin-ai-step-status smarthealth-admin-ai-step-status-started";

      case "failed":
        return "smarthealth-admin-ai-step-status smarthealth-admin-ai-step-status-failed";

      default:
        return "smarthealth-admin-ai-step-status";
    }
  };

  // =========================================================
  // CLOSE DETAILS
  // =========================================================

  const closeWorkflowDetails = () => {
    setSelectedWorkflow(null);
  };

  // =========================================================
  // APPROVE / REJECT AI APPROVAL
  // =========================================================

  const handleApprovalDecision = async (approvalId, decision) => {
    const comments = approvalComments[approvalId] || "";

    try {
      setApprovalActionId(approvalId);

      if (decision === "approve") {
        await aiService.approve(approvalId, comments);

        toast.success("AI approval completed successfully.");
      } else {
        await aiService.reject(approvalId, comments);

        toast.success("AI approval rejected successfully.");
      }

      setApprovalComments((previousComments) => {
        const updatedComments = { ...previousComments };

        delete updatedComments[approvalId];

        return updatedComments;
      });

      await loadPendingApprovals();
      await loadWorkflows(true);

      if (selectedWorkflow?.workflowId) {
        await handleWorkflowSelect(selectedWorkflow.workflowId);
      }
    } catch (error) {
      console.error("Failed to process AI approval:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to process AI approval.",
      );
    } finally {
      setApprovalActionId(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="smarthealth-admin-ai">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="smarthealth-admin-ai-header">
        <div>
          <span className="smarthealth-admin-ai-eyebrow">AI Governance</span>

          <h1>AI Dashboard</h1>

          <p>
            Monitor AI workflows, agent activity, recommendations, and human
            approval activity across the healthcare system.
          </p>
        </div>

        <div className="smarthealth-admin-ai-header-icon">✨</div>
      </section>

      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <section className="smarthealth-admin-ai-statistics">
        <div className="smarthealth-admin-ai-stat-card">
          <span>Total Workflows</span>
          <strong>{workflowStatistics.total}</strong>
        </div>

        <div className="smarthealth-admin-ai-stat-card">
          <span>Completed</span>
          <strong>{workflowStatistics.completed}</strong>
        </div>

        <div className="smarthealth-admin-ai-stat-card">
          <span>Awaiting Approval</span>
          <strong>{workflowStatistics.awaitingApproval}</strong>
        </div>

        <div className="smarthealth-admin-ai-stat-card">
          <span>Failed</span>
          <strong>{workflowStatistics.failed}</strong>
        </div>
      </section>

      {/* =====================================================
    PENDING AI APPROVALS
====================================================== */}

      <section className="smarthealth-admin-ai-panel">
        <div className="smarthealth-admin-ai-panel-header">
          <div>
            <span className="smarthealth-admin-ai-section-label">
              Human Review
            </span>

            <h2>Pending AI Approvals</h2>

            <p>
              Review AI decisions that require human approval before completion.
            </p>
          </div>

          <button
            type="button"
            className="smarthealth-admin-ai-refresh-button"
            onClick={loadPendingApprovals}
            disabled={approvalsLoading}
          >
            {approvalsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {approvalsLoading ? (
          <div className="smarthealth-admin-ai-loading">
            <div className="smarthealth-admin-ai-spinner" />

            <p>Loading pending approvals...</p>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="smarthealth-admin-ai-empty">
            <div className="smarthealth-admin-ai-empty-icon">✓</div>

            <h3>No pending approvals</h3>

            <p>
              There are currently no AI workflows waiting for human approval.
            </p>
          </div>
        ) : (
          <div className="smarthealth-admin-ai-pending-approval-list">
            {pendingApprovals.map((approval) => {
              const workflow = getWorkflowForApproval(approval);

              return (
                <div
                  className="smarthealth-admin-ai-pending-approval"
                  key={approval.approvalId}
                >
                  {/* APPROVAL HEADER */}

                  <div className="smarthealth-admin-ai-pending-approval-header">
                    <div>
                      <span className="smarthealth-admin-ai-pending-approval-label">
                        AI Approval Request
                      </span>

                      <h3>{formatWorkflowType(approval.workflowType)}</h3>
                    </div>

                    <span className={getStatusClass(approval.workflowStatus)}>
                      {approval.decision}
                    </span>
                  </div>

                  {/* APPROVAL INFORMATION */}

                  <div className="smarthealth-admin-ai-pending-approval-grid">
                    <div>
                      <span>Patient</span>

                      <strong>
                        {workflow?.patientName || "Unknown Patient"}
                      </strong>
                    </div>

                    <div>
                      <span>AI Agent</span>

                      <strong>{formatAgentName(workflow?.agentName)}</strong>
                    </div>

                    <div>
                      <span>Workflow</span>

                      <strong>
                        {formatWorkflowType(approval.workflowType)}
                      </strong>
                    </div>

                    <div>
                      <span>Requested</span>

                      <strong>{formatDateTime(approval.requestedAt)}</strong>
                    </div>
                  </div>

                  {/* USER REQUEST */}

                  <div className="smarthealth-admin-ai-pending-approval-request">
                    <strong>User Request</strong>

                    <p>{approval.userRequest || "No request recorded."}</p>
                  </div>

                  {/* AI RECOMMENDATIONS */}

                  {workflow?.recommendations &&
                    workflow.recommendations.length > 0 && (
                      <div className="smarthealth-admin-ai-pending-approval-recommendations">
                        <strong>AI Recommendation</strong>

                        {workflow.recommendations.map((recommendation) => (
                          <div
                            key={recommendation.recommendationId}
                            className="smarthealth-admin-ai-pending-approval-recommendation"
                          >
                            <div className="smarthealth-admin-ai-pending-approval-recommendation-header">
                              <span>{recommendation.recommendationType}</span>

                              <span>{recommendation.status}</span>
                            </div>

                            <p>{recommendation.recommendation}</p>

                            {recommendation.reasoning && (
                              <div>
                                <strong>Reasoning</strong>

                                <p>{recommendation.reasoning}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* COMMENTS */}

                  <div className="smarthealth-admin-ai-pending-approval-comments">
                    <label htmlFor={`approval-comments-${approval.approvalId}`}>
                      Review Comments
                    </label>

                    <textarea
                      id={`approval-comments-${approval.approvalId}`}
                      value={approvalComments[approval.approvalId] || ""}
                      onChange={(event) => {
                        const value = event.target.value;

                        setApprovalComments((previousComments) => ({
                          ...previousComments,
                          [approval.approvalId]: value,
                        }));
                      }}
                      placeholder="Add comments about your approval decision..."
                      rows={3}
                      disabled={approvalActionId === approval.approvalId}
                    />
                  </div>

                  {/* ACTIONS */}

                  <div className="smarthealth-admin-ai-pending-approval-actions">
                    <button
                      type="button"
                      className="smarthealth-admin-ai-pending-approval-reject"
                      onClick={() =>
                        handleApprovalDecision(approval.approvalId, "reject")
                      }
                      disabled={approvalActionId === approval.approvalId}
                    >
                      {approvalActionId === approval.approvalId
                        ? "Processing..."
                        : "Reject"}
                    </button>

                    <button
                      type="button"
                      className="smarthealth-admin-ai-pending-approval-approve"
                      onClick={() =>
                        handleApprovalDecision(approval.approvalId, "approve")
                      }
                      disabled={approvalActionId === approval.approvalId}
                    >
                      {approvalActionId === approval.approvalId
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          WORKFLOW MONITORING
      ====================================================== */}

      <section className="smarthealth-admin-ai-panel">
        <div className="smarthealth-admin-ai-panel-header">
          <div>
            <span className="smarthealth-admin-ai-section-label">
              Monitoring
            </span>

            <h2>AI Workflow Activity</h2>

            <p>Review AI workflows generated by the healthcare system.</p>
          </div>

          <button
            type="button"
            className="smarthealth-admin-ai-refresh-button"
            onClick={() => loadWorkflows(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="smarthealth-admin-ai-loading">
            <div className="smarthealth-admin-ai-spinner" />

            <p>Loading AI workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="smarthealth-admin-ai-empty">
            <div className="smarthealth-admin-ai-empty-icon">✓</div>

            <h3>No AI workflows found</h3>

            <p>
              AI workflow activity will appear here once the system processes AI
              requests.
            </p>
          </div>
        ) : (
          <div className="smarthealth-admin-ai-table-wrapper">
            <table className="smarthealth-admin-ai-table">
              <thead>
                <tr>
                  <th>AI Agent</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Patient</th>
                  <th>Started</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {workflows.map((workflow) => (
                  <tr key={workflow.workflowId}>
                    {/* AI Agent */}

                    <td>
                      <strong>{formatAgentName(workflow.agentName)}</strong>
                    </td>

                    {/* Workflow Type */}

                    <td>{formatWorkflowType(workflow.workflowType)}</td>

                    {/* Status */}

                    <td>
                      <span className={getStatusClass(workflow.status)}>
                        {workflow.status || "Unknown"}
                      </span>
                    </td>

                    {/* Patient */}

                    <td>
                      <strong>
                        {workflow.patientName || "Unknown Patient"}
                      </strong>
                    </td>

                    {/* Started */}

                    <td>{formatDateTime(workflow.startedAt)}</td>

                    {/* Action */}

                    <td>
                      <button
                        type="button"
                        className="smarthealth-admin-ai-view-button"
                        onClick={() =>
                          handleWorkflowSelect(workflow.workflowId)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      

      {/* =====================================================
          WORKFLOW DETAILS
      ====================================================== */}

      {selectedWorkflow && (
        <section className="smarthealth-admin-ai-panel">
          <div className="smarthealth-admin-ai-panel-header">
            <div>
              <span className="smarthealth-admin-ai-section-label">
                Audit Trail
              </span>

              <h2>Workflow Details</h2>

              <p>
                Detailed execution information for the selected AI workflow.
              </p>
            </div>

            <button
              type="button"
              className="smarthealth-admin-ai-secondary-button"
              onClick={closeWorkflowDetails}
            >
              Close
            </button>
          </div>

          {detailsLoading ? (
            <div className="smarthealth-admin-ai-loading">
              <div className="smarthealth-admin-ai-spinner" />

              <p>Loading workflow details...</p>
            </div>
          ) : (
            <>
              {/* =================================================
                  WORKFLOW INFORMATION
              ================================================== */}

              <div className="smarthealth-admin-ai-detail-grid">
                {/* Patient */}

                <div>
                  <span>Patient</span>

                  <strong>
                    {selectedWorkflow.patientName || "Unknown Patient"}
                  </strong>
                </div>

                {/* AI Agent */}

                <div>
                  <span>AI Agent</span>

                  <strong>{formatAgentName(selectedWorkflow.agentName)}</strong>
                </div>

                {/* Workflow Type */}

                <div>
                  <span>Workflow Type</span>

                  <strong>
                    {formatWorkflowType(selectedWorkflow.workflowType)}
                  </strong>
                </div>

                {/* Status */}

                <div>
                  <span>Status</span>

                  <strong>{selectedWorkflow.status || "—"}</strong>
                </div>

                {/* Doctor */}

                <div>
                  <span>Doctor</span>

                  <strong>
                    {selectedWorkflow.doctorName || "Not associated"}
                  </strong>
                </div>

                {/* Appointment */}

                <div>
                  <span>Appointment</span>

                  <strong>
                    {selectedWorkflow.appointmentDate
                      ? `${formatDate(selectedWorkflow.appointmentDate)} ${
                          selectedWorkflow.appointmentTime
                            ? `at ${formatTime(
                                selectedWorkflow.appointmentTime,
                              )}`
                            : ""
                        }`
                      : "Not associated"}
                  </strong>
                </div>

                {/* Started */}

                <div>
                  <span>Started</span>

                  <strong>{formatDateTime(selectedWorkflow.startedAt)}</strong>
                </div>

                {/* Completed */}

                <div>
                  <span>Completed</span>

                  <strong>
                    {formatDateTime(selectedWorkflow.completedAt)}
                  </strong>
                </div>
              </div>

              {/* =================================================
                  USER REQUEST
              ================================================== */}

              <div className="smarthealth-admin-ai-detail-section">
                <h3>User Request</h3>

                <div className="smarthealth-admin-ai-request">
                  {selectedWorkflow.userRequest || "No request recorded."}
                </div>
              </div>

              {/* =================================================
                  WORKFLOW STEPS
              ================================================== */}

              <div className="smarthealth-admin-ai-detail-section">
                <h3>Agent Workflow Steps</h3>

                {!selectedWorkflow.steps ||
                selectedWorkflow.steps.length === 0 ? (
                  <div className="smarthealth-admin-ai-detail-empty">
                    No workflow steps recorded.
                  </div>
                ) : (
                  <div className="smarthealth-admin-ai-step-list">
                    {selectedWorkflow.steps
                      .slice()
                      .sort(
                        (first, second) => first.stepOrder - second.stepOrder,
                      )
                      .map((step) => (
                        <div
                          className="smarthealth-admin-ai-step"
                          key={step.stepId}
                        >
                          <div className="smarthealth-admin-ai-step-number">
                            {step.stepOrder}
                          </div>

                          <div className="smarthealth-admin-ai-step-content">
                            <div className="smarthealth-admin-ai-step-header">
                              <div>
                                <span>Agent</span>

                                <strong>
                                  {formatAgentName(step.agentName)}
                                </strong>
                              </div>

                              <span className={getStepStatusClass(step.status)}>
                                {step.status}
                              </span>
                            </div>

                            <div className="smarthealth-admin-ai-step-times">
                              <span>
                                Started: {formatDateTime(step.startedAt)}
                              </span>

                              <span>
                                Completed: {formatDateTime(step.completedAt)}
                              </span>
                            </div>

                            {step.inputData && (
                              <details>
                                <summary>Input Data</summary>

                                <pre>{step.inputData}</pre>
                              </details>
                            )}

                            {step.outputData && (
                              <details>
                                <summary>Output Data</summary>

                                <pre>{step.outputData}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* =================================================
                  RECOMMENDATIONS
              ================================================== */}

              <div className="smarthealth-admin-ai-detail-section">
                <h3>AI Recommendations</h3>

                {!selectedWorkflow.recommendations ||
                selectedWorkflow.recommendations.length === 0 ? (
                  <div className="smarthealth-admin-ai-detail-empty">
                    No recommendations recorded.
                  </div>
                ) : (
                  <div className="smarthealth-admin-ai-recommendation-list">
                    {selectedWorkflow.recommendations.map((recommendation) => (
                      <div
                        className="smarthealth-admin-ai-recommendation"
                        key={recommendation.recommendationId}
                      >
                        <div className="smarthealth-admin-ai-recommendation-header">
                          <strong>{recommendation.recommendationType}</strong>

                          <span>{recommendation.status}</span>
                        </div>

                        <p>{recommendation.recommendation}</p>

                        {recommendation.reasoning && (
                          <div>
                            <strong>Reasoning</strong>

                            <p>{recommendation.reasoning}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* =================================================
                  APPROVALS
              ================================================== */}

              <div className="smarthealth-admin-ai-detail-section">
                <h3>Approval Information</h3>

                {!selectedWorkflow.approvals ||
                selectedWorkflow.approvals.length === 0 ? (
                  <div className="smarthealth-admin-ai-detail-empty">
                    No approval records associated with this workflow.
                  </div>
                ) : (
                  <div className="smarthealth-admin-ai-approval-list">
                    {selectedWorkflow.approvals.map((approval) => (
                      <div
                        className="smarthealth-admin-ai-approval"
                        key={approval.approvalId}
                      >
                        <div>
                          <strong>Decision</strong>

                          <span>{approval.decision}</span>
                        </div>

                        <div>
                          <strong>Comments</strong>

                          <p>{approval.comments || "No comments."}</p>
                        </div>

                        <div>
                          <strong>Requested</strong>

                          <span>{formatDateTime(approval.requestedAt)}</span>
                        </div>

                        <div>
                          <strong>Decided</strong>

                          <span>{formatDateTime(approval.decidedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminAI;
