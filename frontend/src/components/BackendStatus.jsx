"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function BackendStatus() {
  const [status, setStatus] = useState("Checking...");
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet("/health")
      .then((data) => {
        setStatus(data.message);
      })
      .catch(() => {
        setError(true);
        setStatus("Backend not reachable");
      });
  }, []);

  return (
    <div className="mt-6 text-sm">
      {error ? (
        <span className="text-red-600">❌ {status}</span>
      ) : (
        <span className="text-green-600">✅ {status}</span>
      )}
    </div>
  );
}
