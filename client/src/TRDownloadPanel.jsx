
import { useState } from "react";
import "./TRDownloadPanel.css";

const API = "http://localhost:5000";

export default function TRDownloadPanel({ token }) {
  const [session, setSession] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDownload(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/tr/download`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session,
          registrationNumber,
          rollNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "TR download failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `TR-${rollNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("TR download ho gaya.");
    } catch (error) {
      setMessage(error.message || "Download nahi ho paya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-card tr-download-panel">
      <h2>Download My TR</h2>
      <p>Apni academic details enter karke Transfer Record download karo.</p>

      <form onSubmit={handleDownload}>
        <label>Academic Session</label>
        <input
          value={session}
          onChange={(e) => setSession(e.target.value)}
          placeholder="Example: 2024-2028"
          required
        />

        <label>Registration Number</label>
        <input
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          required
        />

        <label>Roll Number (Student ID)</label>
        <input
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          required
        />

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Downloading..." : "Download TR PDF"}
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}
