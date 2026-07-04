"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";
import { checkTeamPrivilegeAction, updateProfileImageAction, getMemberProfileAction, updateMemberProfileAction } from "@/lib/actions/profile";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile image upload state
  const [isPrivileged, setIsPrivileged] = useState<boolean | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");
  const [imageUploadSuccess, setImageUploadSuccess] = useState("");
  const [updatingImage, setUpdatingImage] = useState(false);

  // Biography/Profile states
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [awards, setAwards] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (session) {
      checkTeamPrivilegeAction().then((res) => {
        setIsPrivileged(res);
        setImageUrl(session.user.image || "");
        if (res) {
          setProfileLoading(true);
          getMemberProfileAction()
            .then((prof) => {
              if (prof) {
                setBio(prof.bio ?? "");
                setInterests(prof.interests ? prof.interests.join(", ") : "");
                setAwards(prof.awards ?? "");
                setLinkedin(prof.linkedin ?? "");
                setGithub(prof.github ?? "");
                setWebsite(prof.website ?? "");
              }
            })
            .catch((err) => {
              console.error("Failed to load biography:", err);
            })
            .finally(() => {
              setProfileLoading(false);
            });
        }
      });
    }
  }, [session]);

  async function handleImageChange(url: string) {
    setImageUploadError("");
    setImageUploadSuccess("");
    setUpdatingImage(true);
    try {
      const res = await updateProfileImageAction(url);
      if (res.success) {
        setImageUrl(url);
        setImageUploadSuccess(url ? "Avatar updated successfully!" : "Avatar removed successfully!");
        // Refresh local session client state
        await authClient.getSession();
      }
    } catch (err: any) {
      setImageUploadError(err.message || "Failed to update profile image.");
    } finally {
      setUpdatingImage(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (changeError) {
        setError(changeError.message || "Failed to update password. Verify your current password is correct.");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setSavingProfile(true);

    const parsedInterests = interests
      ? interests.split(",").map((i) => i.trim()).filter(Boolean)
      : [];

    try {
      const res = await updateMemberProfileAction({
        bio,
        interests: parsedInterests,
        awards,
        linkedin,
        github,
        website,
      });

      if (res.success) {
        setProfileSuccess(true);
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile details.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (isPending) {
    return (
      <div className="container" style={{ paddingBlock: "5rem", textAlign: "center" }}>
        <span className="spinner" style={{ width: 32, height: 32, margin: "auto" }} />
        <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>Accessing profile console...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container" style={{ paddingBlock: "5rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Unauthorized. Please sign in.</p>
        <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
          🚀 Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock: "3rem", maxWidth: "800px" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          ← Back to Terminal
        </Link>
      </div>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "2.5rem" }}>
        <div>
          <h1 className="page-title">⚙️ Profile settings</h1>
          <p className="page-subtitle">Configure your personal explorer profile and secure credentials.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Profile Details Card */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>👤</span> Identity Records
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", width: 64, height: 64, borderRadius: "50%", border: "2px solid var(--color-stellar)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-space)" }}>
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "1.75rem" }}>👨‍🚀</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>{session.user.name}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Email: {session.user.email}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem" }}>
                Commissioned on: {new Date(session.user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Avatar Upload Section */}
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            {isPrivileged === null ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTop: "2px solid var(--color-stellar)",
                  borderRadius: "50%",
                  animation: "upload-spin 1s linear infinite"
                }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Checking team page permissions...</span>
              </div>
            ) : isPrivileged ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <ImageUpload
                  label="Orbit Avatar Image"
                  value={imageUrl}
                  onChange={handleImageChange}
                  disabled={updatingImage}
                />
                {imageUploadError && (
                  <div style={{ padding: "0.5rem 0.75rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "var(--radius-sm)", color: "#fca5a5", fontSize: "0.725rem" }}>
                    ⚠️ {imageUploadError}
                  </div>
                )}
                {imageUploadSuccess && (
                  <div style={{ padding: "0.5rem 0.75rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-sm)", color: "#6ee7b7", fontSize: "0.725rem" }}>
                    ✔️ {imageUploadSuccess}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem", padding: "1rem", background: "rgba(56, 189, 248, 0.04)", border: "1px solid rgba(56, 189, 248, 0.12)", borderRadius: "var(--radius-md)", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.25rem", marginTop: "-0.1rem" }}>🔒</span>
                <div>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-stellar)" }}>Standard Explorer Profile</div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                    Custom avatar uploads are reserved for active team leaders and members listed on the public <Link href="/team" className="text-link" style={{ textDecoration: "underline", color: "var(--color-stellar)" }}>Team page</Link>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Biography & Achievements Card (Only for active team members) */}
        {isPrivileged && (
          <div className="card">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🚀</span> Explorer Biography
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              These details will be displayed publicly on your member profile page. You can customize your bio, interest areas, and awards.
            </p>

            {profileLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBlock: "1rem" }}>
                <span className="spinner" style={{ width: 20, height: 20 }} />
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>Loading profile data...</span>
              </div>
            ) : (
              <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="bio">Biography / About</label>
                  <textarea
                    id="bio"
                    className="form-input form-textarea"
                    placeholder="Tell us about yourself, your background, and your path in SEDS..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={savingProfile}
                    style={{ minHeight: "120px" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="interests">Interest Areas</label>
                  <input
                    id="interests"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rocketry, biomedical science, astrobiology (comma separated)"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    disabled={savingProfile}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "0.25rem", display: "block" }}>
                    Separate multiple topics with a comma.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="awards">Awards &amp; Recognitions</label>
                  <textarea
                    id="awards"
                    className="form-input form-textarea"
                    placeholder="List down any awards, recognitions, or achievements within or outside SEDS..."
                    value={awards}
                    onChange={(e) => setAwards(e.target.value)}
                    disabled={savingProfile}
                    style={{ minHeight: "100px" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="linkedin">LinkedIn Profile URL</label>
                  <input
                    id="linkedin"
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    disabled={savingProfile}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="github">GitHub Profile URL</label>
                  <input
                    id="github"
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://github.com/username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    disabled={savingProfile}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="website">Personal Website / Portfolio URL</label>
                  <input
                    id="website"
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://mywebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={savingProfile}
                  />
                </div>

                {profileError && (
                  <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem" }}>
                    ❌ {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.875rem" }}>
                    ✔️ Biography updated successfully!
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingProfile}
                    style={{ minWidth: "160px" }}
                  >
                    {savingProfile ? (
                      <>
                        <span className="spinner" style={{ width: 14, height: 14 }} /> Syncing profile...
                      </>
                    ) : (
                      "Save Biography"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Change Password Card */}
        <div className="card">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🔒</span> Secure Key Override
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            Authorize password updates to secure your access keys. Passwords must be at least 8 characters.
          </p>

          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius-md)", color: "#fca5a5", fontSize: "0.875rem" }}>
                ❌ {error}
              </div>
            )}

            {success && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "var(--radius-md)", color: "#6ee7b7", fontSize: "0.875rem" }}>
                ✔️ Credentials updated successfully! All other sessions have been revoked.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: "160px" }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Hashing keys...
                  </>
                ) : (
                  "Update Credentials"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
