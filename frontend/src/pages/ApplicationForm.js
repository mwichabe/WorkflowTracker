import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, User, Mail, Building2, Tag, FileText, Save, Info } from "lucide-react";
import { api } from "../api/client";
import { APPLICATION_TYPES } from "../components/StatusBadge";

const EMPTY = { applicant_name: "", applicant_email: "", company_name: "", application_type: "", description: "" };

const TYPE_DESCRIPTIONS = {
  "Recordation":          "Register ownership or interest in a trademark or work.",
  "Renewal":              "Extend the validity of an existing registration.",
  "Change of Ownership":  "Transfer ownership rights to a new entity.",
  "Change of Name":       "Update the registered name of the applicant or owner.",
  "Discontinuation":      "Formally withdraw or cancel an existing registration.",
};

export default function ApplicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm]     = useState(EMPTY);
  const [loading, setLoad]  = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(id)
      .then((app) => setForm({
        applicant_name:   app.applicant_name,
        applicant_email:  app.applicant_email,
        company_name:     app.company_name,
        application_type: app.application_type,
        description:      app.description,
      }))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoad(false));
  }, [id, isEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.update(id, form);
        toast.success("Application updated successfully!");
        navigate(`/${id}`);
      } else {
        const app = await api.create(form);
        toast.success("Draft application created!");
        navigate(`/${app.id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-label">Loading application…</span>
    </div>
  );

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(isEdit ? `/${id}` : "/")}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="form-header">
        <h1>{isEdit ? "Edit Application" : "New Application"}</h1>
        <p>
          {isEdit
            ? "Update the details below. All fields are saved to the database immediately."
            : "Complete all sections to create a new draft application."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-card">

          {/* ── Section 1: Applicant ── */}
          <div className="form-sec">
            <div className="form-sec-title"><User size={12} /> Applicant Information</div>
            <div className="form-row">
              <div className="fg">
                <label><User size={11} /> Applicant Name <span className="req">*</span></label>
                <input
                  required
                  value={form.applicant_name}
                  onChange={set("applicant_name")}
                  placeholder="Full legal name"
                />
              </div>
              <div className="fg">
                <label><Mail size={11} /> Email Address <span className="req">*</span></label>
                <input
                  required
                  type="email"
                  value={form.applicant_email}
                  onChange={set("applicant_email")}
                  placeholder="email@example.com"
                />
                <span className="field-hint">Used for notifications and correspondence.</span>
              </div>
            </div>
          </div>

          {/* ── Section 2: Application details ── */}
          <div className="form-sec">
            <div className="form-sec-title"><Tag size={12} /> Application Details</div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="fg">
                <label><Building2 size={11} /> Company / Organisation <span className="req">*</span></label>
                <input
                  required
                  value={form.company_name}
                  onChange={set("company_name")}
                  placeholder="Registered company or organisation name"
                />
              </div>
              <div className="fg">
                <label><Tag size={11} /> Application Type <span className="req">*</span></label>
                <select
                  required
                  value={form.application_type}
                  onChange={set("application_type")}
                >
                  <option value="">Select a type…</option>
                  {APPLICATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {form.application_type && (
                  <span className="field-hint" style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <Info size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                    {TYPE_DESCRIPTIONS[form.application_type]}
                  </span>
                )}
              </div>
            </div>

            <div className="fg">
              <label><FileText size={11} /> Description <span className="req">*</span></label>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the purpose, scope, and any relevant details of this application…"
              />
              <span className="field-hint">
                This field is stored in the database and visible to reviewers.
                {form.description.length > 0 && ` (${form.description.length} characters)`}
              </span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="form-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(isEdit ? `/${id}` : "/")}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={13} />
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Draft"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
