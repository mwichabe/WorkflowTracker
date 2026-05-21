import { Check, X, HelpCircle } from "lucide-react";

const STEPS = [
  { key: "Draft",       label: "Draft" },
  { key: "Submitted",   label: "Submitted" },
  { key: "Under Review",label: "Under Review" },
  { key: "Decision",    label: "Decision" },
];

const STATUS_TO_STEP = {
  "Draft":                 0,
  "Submitted":             1,
  "Under Review":          2,
  "Need More Information": 3,
  "Approved":              3,
  "Rejected":              3,
};

export function WorkflowStepper({ status }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;

  const nodeState = (i) => {
    if (i < currentStep) return "done";
    if (i === currentStep) {
      if (status === "Approved") return "approved";
      if (status === "Rejected") return "rejected";
      if (status === "Need More Information") return "nmi";
      return "current";
    }
    return "pending";
  };

  const lineState = (i) => {
    if (i + 1 < currentStep) return "done";
    if (i + 1 === currentStep) {
      if (status === "Approved") return "approved";
      if (status === "Rejected") return "rejected";
      return "done";
    }
    return "pending";
  };

  return (
    <div className="stepper-wrap">
      <div className="stepper-title">Workflow Progress</div>
      <div className="stepper">
        {STEPS.map((step, i) => {
          const ns = nodeState(i);
          return (
            <div key={step.key} className="step">
              <div className="step-node">
                <div className={`step-circle ${ns}`}>
                  {ns === "done"     && <Check size={13} strokeWidth={3} />}
                  {ns === "approved" && <Check size={13} strokeWidth={3} />}
                  {ns === "rejected" && <X     size={13} strokeWidth={3} />}
                  {ns === "nmi"      && <HelpCircle size={13} />}
                  {(ns === "current" || ns === "pending") && (
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  )}
                </div>
                <span className={`step-label ${ns}`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-line ${lineState(i)}`} />
              )}
            </div>
          );
        })}
      </div>

      {status === "Need More Information" && (
        <div className="stepper-note">
          <HelpCircle size={12} />
          Application returned — awaiting resubmission from applicant
        </div>
      )}
    </div>
  );
}
