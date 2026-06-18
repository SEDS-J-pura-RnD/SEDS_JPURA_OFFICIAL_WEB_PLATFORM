"use client";

import { useState, useTransition } from "react";
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  assignProjectMemberAction,
  removeProjectMemberAction,
} from "@/lib/actions/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";

interface Division {
  id: string;
  name: string;
}

interface ProjectMember {
  projectId: string;
  userId: string;
  projectRole: "LEAD" | "MEMBER";
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  divisionId: string;
  division: Division;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "PLANNING";
  technologies: string[];
  outcomes: string | null;
  imageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isPublic: boolean;
  members: ProjectMember[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProjectsClientProps {
  initialProjects: Project[];
  divisions: Division[];
  users: User[];
}

export default function ProjectsClient({
  initialProjects,
  divisions,
  users,
}: ProjectsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [filterDivisionId, setFilterDivisionId] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<Project | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "ON_HOLD" | "PLANNING">("PLANNING");
  const [technologiesText, setTechnologiesText] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Member assignment fields
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState<"LEAD" | "MEMBER">("MEMBER");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [memberError, setMemberError] = useState("");

  const filteredProjects = initialProjects.filter((p) =>
    filterDivisionId ? p.divisionId === filterDivisionId : true
  );

  function openCreateModal() {
    setEditingProject(null);
    setTitle("");
    setDescription("");
    setDivisionId(divisions[0]?.id || "");
    setStatus("PLANNING");
    setTechnologiesText("");
    setOutcomes("");
    setImageUrl("");
    setStartDateStr("");
    setEndDateStr("");
    setIsPublic(true);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setDivisionId(project.divisionId);
    setStatus(project.status);
    setTechnologiesText(project.technologies.join(", "));
    setOutcomes(project.outcomes || "");
    setImageUrl(project.imageUrl || "");
    setStartDateStr(project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "");
    setEndDateStr(project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "");
    setIsPublic(project.isPublic);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openMembersModal(project: Project) {
    setSelectedProjectForMembers(project);
    setAssignUserId(users[0]?.id || "");
    setAssignRole("MEMBER");
    setMemberError("");
    setMembersModalOpen(true);
  }

  async function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !description.trim() || !divisionId) {
      setError("Please fill in title, description, and division.");
      return;
    }

    const techArray = technologiesText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data = {
      title,
      description,
      divisionId,
      status,
      technologies: techArray,
      outcomes: outcomes || undefined,
      imageUrl: imageUrl || undefined,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
      isPublic,
    };

    startTransition(async () => {
      try {
        if (editingProject) {
          const res = await updateProjectAction(editingProject.id, data);
          if (res.success) {
            setSuccess("Project updated successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        } else {
          const res = await createProjectAction(data);
          if (res.success) {
            setSuccess("Project established successfully.");
            setTimeout(() => {
              setModalOpen(false);
              router.refresh();
            }, 1000);
          }
        }
      } catch (err: any) {
        setError(err.message || "Operation failed.");
      }
    });
  }

  async function handleDeleteProject(projectId: string, projectTitle: string) {
    if (!confirm(`Are you absolutely sure you want to delete project '${projectTitle}'? All associated records will be lost.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteProjectAction(projectId);
        if (res.success) {
          router.refresh();
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete project.");
      }
    });
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError("");
    if (!selectedProjectForMembers || !assignUserId) return;

    startTransition(async () => {
      try {
        const res = await assignProjectMemberAction(
          selectedProjectForMembers.id,
          assignUserId,
          assignRole
        );
        if (res.success) {
          // Re-fetch project details locally or let refresh sync it
          router.refresh();
          // Find updated project and update local modal state
          const updatedProj = initialProjects.find(p => p.id === selectedProjectForMembers.id);
          if (updatedProj) setSelectedProjectForMembers(updatedProj);
        }
      } catch (err: any) {
        setMemberError(err.message || "Failed to assign member.");
      }
    });
  }

  async function handleRemoveMember(userId: string) {
    if (!selectedProjectForMembers) return;

    startTransition(async () => {
      try {
        const res = await removeProjectMemberAction(selectedProjectForMembers.id, userId);
        if (res.success) {
          router.refresh();
          const updatedProj = initialProjects.find(p => p.id === selectedProjectForMembers.id);
          if (updatedProj) setSelectedProjectForMembers(updatedProj);
        }
      } catch (err: any) {
        setMemberError(err.message || "Failed to remove member.");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">🔬 Projects Command</h1>
          <p className="page-subtitle">Pioneer rocket propulsion, embedded hardware, and astronomy projects.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          🚀 Establish Project
        </button>
      </div>

      {/* Filter and Division Selection */}
      <div className="card" style={{ marginBottom: "2rem", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Filter by Division:</label>
          <select
            className="form-select"
            value={filterDivisionId}
            onChange={(e) => setFilterDivisionId(e.target.value)}
            style={{ maxWidth: "250px", padding: "0.5rem" }}
          >
            <option value="">All Research Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Projects */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: "5rem" }} className="card">
            <span>🔭</span>
            <h3 style={{ marginTop: "1rem", fontFamily: "var(--font-display)", fontWeight: 700 }}>No Research Projects</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBlock: "0.5rem" }}>Establish your first operational project.</p>
            <button onClick={openCreateModal} className="btn btn-primary" style={{ marginTop: "1rem" }}>
              New Project
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {project.imageUrl && (
                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "var(--color-space)", flexShrink: 0 }}>
                      <img src={project.imageUrl} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700 }}>{project.title}</h2>
                      <span className="badge badge-cosmic">{project.division.name}</span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                      Status: <span style={{ fontWeight: 600 }}>{project.status}</span> · Visibility: {project.isPublic ? "Public" : "Classified"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => openMembersModal(project)} className="btn btn-secondary btn-sm">
                    👥 Crew ({project.members.length})
                  </button>
                  <button onClick={() => openEditModal(project)} className="btn btn-ghost btn-sm">
                    Configure
                  </button>
                  <button onClick={() => handleDeleteProject(project.id, project.title)} className="btn btn-danger btn-sm" disabled={isPending}>
                    🗑️
                  </button>
                </div>
              </div>

              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
                {project.description}
              </p>

              {/* Technologies */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {project.technologies.map((tech) => (
                  <span key={tech} className="badge badge-stellar" style={{ fontSize: "0.7rem" }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Projects Create/Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !isPending && setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "600px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {editingProject ? "⚙️ Edit Project Specifications" : "🚀 Establish Research Operation"}
            </h2>

            <form onSubmit={handleProjectSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-title">Project Title</label>
                <input
                  id="proj-title"
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>

              <ImageUpload
                label="Project Cover Image"
                value={imageUrl}
                onChange={setImageUrl}
                disabled={isPending}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-div">Division</label>
                  <select
                    id="proj-div"
                    className="form-select"
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    disabled={isPending}
                  >
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-status">Status</label>
                  <select
                    id="proj-status"
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    disabled={isPending}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proj-tech">Technologies (comma-separated)</label>
                <input
                  id="proj-tech"
                  type="text"
                  className="form-input"
                  placeholder="e.g. ROS, Python, C++, LiDAR"
                  value={technologiesText}
                  onChange={(e) => setTechnologiesText(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-start">Start Date</label>
                  <input
                    id="proj-start"
                    type="date"
                    className="form-input"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="proj-end">End Date</label>
                  <input
                    id="proj-end"
                    type="date"
                    className="form-input"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isPending}
                />
                <span>Classify project as public listing</span>
              </label>

              {error && (
                <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.8125rem" }}>
                  ❌ {error}
                </div>
              )}

              {success && (
                <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.8125rem" }}>
                  ✔️ {success}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Syncing specifications..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crew Members Assignment Modal */}
      {membersModalOpen && selectedProjectForMembers && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => setMembersModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(3, 7, 18, 0.8)", backdropFilter: "blur(4px)" }} />
          
          <div className="card" style={{ width: "100%", maxWidth: "550px", position: "relative", zIndex: 1, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--glow-cosmic)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              👥 Project Crew assignments
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Project: <span style={{ color: "var(--color-stellar)", fontWeight: 600 }}>{selectedProjectForMembers.title}</span>
            </p>

            {/* Current Crew */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-dim)", marginBottom: "0.75rem" }}>ACTIVE MISSION CREW</h3>
              
              {selectedProjectForMembers.members.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-dim)", fontStyle: "italic" }}>No crew members assigned to this operation yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedProjectForMembers.members.map((member) => (
                    <div
                      key={member.userId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{member.user.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{member.user.email}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span className={`badge ${member.projectRole === "LEAD" ? "badge-nebula" : "badge-cosmic"}`} style={{ fontSize: "0.65rem" }}>
                          {member.projectRole}
                        </span>
                        <button onClick={() => handleRemoveMember(member.userId)} className="btn btn-danger btn-sm" style={{ padding: "0.25rem 0.5rem" }} disabled={isPending}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Crew Form */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--color-text-dim)", marginBottom: "0.75rem" }}>COMMISSION CREW MEMBER</h3>
              
              <form onSubmit={handleAddMember} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "180px" }}>
                  <label className="form-label" htmlFor="crew-user">Select Explorer</label>
                  <select
                    id="crew-user"
                    className="form-select"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    disabled={isPending}
                  >
                    {users
                      .filter(u => !selectedProjectForMembers.members.some(m => m.userId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email.slice(0, 15)}...)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group" style={{ width: "110px" }}>
                  <label className="form-label" htmlFor="crew-role">Role</label>
                  <select
                    id="crew-role"
                    className="form-select"
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value as any)}
                    disabled={isPending}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="LEAD">Lead</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ height: "38px" }} disabled={isPending || !assignUserId}>
                  Assign
                </button>
              </form>
              
              {memberError && (
                <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.8125rem", marginTop: "1rem" }}>
                  ❌ {memberError}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
              <button type="button" onClick={() => setMembersModalOpen(false)} className="btn btn-ghost">
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
