import React from "react";

export default function FetchError({ message = "Failed to fetch", onRetry }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "rgba(255, 94, 94, 0.08)",
      border: "1px solid rgba(255, 94, 94, 0.35)",
      color: "#ffb3b3",
      padding: "10px 12px",
      borderRadius: 10,
      boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
      marginBottom: 12,
    }}>
      <span style={{ fontSize: 20 }}>❌</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "#171b24",
            color: "#f5f7fb",
            border: "1px solid #252a33",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
