"use client";

import { useState, useRef } from "react";
import { uploadFile } from "@/lib/supabase";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  label,
  value,
  onChange,
  bucket = "seds-media",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUpload(file);
  };

  const processUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("File type is unsupported. Must be a valid image format.");
      }
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File exceeds 5MB payload limit.");
      }

      const publicUrl = await uploadFile(file, bucket);
      onChange(publicUrl);
    } catch (err: any) {
      console.error("Supabase Storage Error: ", err);
      setError(err.message || "Failed to upload file to storage.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: "1rem" }}>
      <style>{`
        @keyframes upload-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <label className="form-label" style={{ marginBottom: 0 }}>{label}</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="btn"
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.725rem",
              background: mode === "upload" ? "var(--color-border-bright)" : "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: mode === "upload" ? "white" : "var(--color-text-muted)"
            }}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className="btn"
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.725rem",
              background: mode === "url" ? "var(--color-border-bright)" : "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: mode === "url" ? "white" : "var(--color-text-muted)"
            }}
          >
            Direct URL
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || uploading}
        />
      ) : (
        <div>
          {value ? (
            /* Uploaded Preview State */
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "var(--color-space)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <img
                  src={value}
                  alt="Uploaded preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-stellar)", fontWeight: 600, wordBreak: "break-all" }}>
                  Uploaded to orbit
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {value}
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: "0.375rem", padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}
                  disabled={disabled || uploading}
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone Area */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem 1rem",
                border: isDragOver ? "2px dashed var(--color-stellar)" : "2px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: isDragOver ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.01)",
                cursor: disabled || uploading ? "not-allowed" : "pointer",
                transition: "all var(--transition-fast)",
                textAlign: "center"
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={disabled || uploading}
              />
              {uploading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: "2.5px solid rgba(255,255,255,0.1)",
                    borderTop: "2.5px solid var(--color-stellar)",
                    borderRadius: "50%",
                    animation: "upload-spin 1s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Uploading to orbit...</span>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: "1.25rem", marginBottom: "0.375rem" }}>🛰️</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    {isDragOver ? "Release to launch file!" : "Drag & drop image, or click to browse"}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-text-dim)", marginTop: "0.2rem" }}>
                    PNG, JPG, SVG, WebP up to 5MB
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: "0.5rem",
          padding: "0.5rem 0.75rem",
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-sm)",
          color: "#fca5a5",
          fontSize: "0.725rem"
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
