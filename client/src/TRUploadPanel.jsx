
import { useState } from "react";
import "./TRUploadPanel.css";

const API = "http://localhost:5000";

export default function TRUploadPanel({ token }) {
  const [session, setSession] = useState("");
  const [sourceType, setSourceType] = useState("combined");
  const [pdf, setPdf] = useState(null);
  const [individualPdfs, setIndividualPdfs] = useState([]);
  const [mapping, setMapping] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(e) {
    e.preventDefault();
    setMessage("");

    if (!session.trim()) {
      setMessage("Please enter the session.");
      return;
    }

    if (sourceType === "combined" && !pdf) {
      setMessage("Please select the combined TR PDF.");
      return;
    }

    if (sourceType === "individual" && !mapping) {
      setMessage("Please select the Excel or CSV mapping file.");
      return;
    }

    if (sourceType === "individual" && individualPdfs.length === 0) {
      setMessage("Please select individual TR PDF files.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("session", session.trim());

      let endpoint;

      if (sourceType === "combined") {
        endpoint = `${API}/api/tr/combined-upload`;
        formData.append("pdf", pdf);
      } else {
        endpoint = `${API}/api/tr/upload`;
        formData.append("sourceType", "individual");
        formData.append("mapping", mapping);

        individualPdfs.forEach((file) => {
          formData.append("individualPdfs", file);
        });
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      setMessage(data.message || "Upload successful.");
      setPdf(null);
      setIndividualPdfs([]);
      setMapping(null);
      e.target.reset();
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-card">
      <h2>TR Upload Portal</h2>
      <p>Upload the combined result PDF or individual student TR files.</p>

      <form onSubmit={handleUpload}>
        <label htmlFor="tr-session">Session</label>
        <input
          id="tr-session"
          type="text"
          placeholder="Example: 2024-2028"
          value={session}
          onChange={(e) => setSession(e.target.value)}
          required
        />

        <label htmlFor="tr-source">Upload Type</label>
        <select
          id="tr-source"
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value);
            setMessage("");
          }}
        >
          <option value="combined">Combined TR PDF</option>
          <option value="individual">Individual Student TRs</option>
        </select>

        {sourceType === "combined" ? (
          <>
            <label htmlFor="combined-pdf">Combined TR PDF</label>
            <input
              id="combined-pdf"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setPdf(e.target.files?.[0] || null)}
              required
            />
            <p>Excel/CSV mapping is not required for combined PDFs.</p>
          </>
        ) : (
          <>
            <label htmlFor="individual-pdfs">Individual TR PDF Files</label>
            <input
              id="individual-pdfs"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) =>
                setIndividualPdfs(Array.from(e.target.files || []))
              }
              required
            />

            <label htmlFor="tr-mapping">Excel/CSV Mapping File</label>
            <input
              id="tr-mapping"
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setMapping(e.target.files?.[0] || null)}
              required
            />

            <p>
              Mapping file mein Session, Registration Number, Roll Number
              aur individual PDF mapping ki required details honi chahiye.
            </p>
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload TR"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </section>
  );
}
