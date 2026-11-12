
import { useEffect, useState } from "react";
import "./CombinedTRPanel.css";

const API = "http://localhost:5000";

export default function CombinedTRPanel({ token }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadRecords() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/tr/combined-list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load TR files."
        );
      }

      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error.message || "Could not load TR files."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [token]);

  async function downloadTR(session) {
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/tr/combined-download/${encodeURIComponent(session)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Download failed."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `Combined-TR-${session}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(
        error.message || "Download failed."
      );
    }
  }

  return (
    <section className="combined-tr-panel">

      {/* HEADER */}
      <div className="combined-tr-header">

        <div className="combined-tr-heading">

          <div className="combined-tr-icon">
            <span>📢</span>
          </div>

          <div>
            <span className="combined-tr-tag">
              RCU STUDENT PORTAL
            </span>

            <h2>Notices & Documents</h2>

            <p>
              University announcements, results and
              important student documents.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="combined-refresh-btn"
          onClick={loadRecords}
          disabled={loading}
        >
          <span className={loading ? "refresh-spin" : ""}>
            ↻
          </span>
          {loading ? "Loading..." : "Refresh List"}
        </button>

      </div>

      {/* SECTION TITLE */}
      <div className="combined-section-title">
        <div>
          <h3>📚 Combined TR / Result PDFs</h3>
          <p>
            Session-wise results uploaded by the Tabulator.
          </p>
        </div>

        <span className="document-count">
          {records.length} Documents
        </span>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className="combined-message" role="status">
          ⚠️ {message}
        </div>
      )}

      {/* LOADING */}
      {loading ? (

        <div className="combined-empty">
          <div className="combined-loading-icon">
            ⏳
          </div>
          <h3>Loading Documents</h3>
          <p>Please wait while we fetch your documents.</p>
        </div>

      ) : records.length === 0 ? (

        /* EMPTY STATE */
        <div className="combined-empty">
          <div className="combined-loading-icon">
            📂
          </div>
          <h3>No Documents Available</h3>
          <p>
            Currently, no combined TR PDF has been uploaded.
            Please check again later.
          </p>
        </div>

      ) : (

        /* DOCUMENT LIST */
        <div className="combined-document-grid">

          {records.map((record) => (

            <div
              key={record.session}
              className="combined-document-card"
            >

              <div className="document-card-top">

                <div className="pdf-icon">
                  PDF
                </div>

                <span className="available-badge">
                  ● Available
                </span>

              </div>

              <div className="document-details">

                <span className="document-label">
                  ACADEMIC SESSION
                </span>

                <h3>
                  Session: {record.session}
                </h3>

                <p className="document-filename">
                  📄 {record.fileName}
                </p>

              </div>

              <div className="document-card-footer">

                <span className="document-format">
                  PDF Document
                </span>

                <button
                  type="button"
                  className="combined-download-btn"
                  onClick={() => downloadTR(record.session)}
                >
                  <span>⬇</span>
                  Download
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* FOOTER */}
      <div className="combined-tr-footer">
        <span>🎓</span>
        <p>
          Ramchandra Chandravansi University
        </p>
        <span className="footer-divider">|</span>
        <p>SmartCampus Student Portal</p>
      </div>

    </section>
  );
}
