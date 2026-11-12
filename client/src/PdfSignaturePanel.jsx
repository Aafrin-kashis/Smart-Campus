import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PdfSignaturePanel.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SIGNER_ROLES = [
  "Tabulator",
  "ExaminationController",
  "Principal",
];
const PDF_WIDTH = 720;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfSignaturePanel({
  applications,
  user,
  apiFetch,
  onRefresh,
}) {
  const [selectedId, setSelectedId] = useState("");
  const [requiredSigners, setRequiredSigners] = useState([]);
  const [signatureFile, setSignatureFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: PDF_WIDTH, height: 930 });
  const [placement, setPlacement] = useState({
    x: 68,
    y: 78,
    width: 24,
    height: 9,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pageWrapRef = useRef(null);
  const signatureUrl = useMemo(
    () => (signatureFile ? URL.createObjectURL(signatureFile) : ""),
    [signatureFile]
  );

  useEffect(() => {
    return () => {
      if (signatureUrl) URL.revokeObjectURL(signatureUrl);
    };
  }, [signatureUrl]);

  const visibleApplications = useMemo(() => {
    const source = Array.isArray(applications) ? applications : [];
    return source.filter((app) => {
      const path = app.signedDocument?.filePath || app.document?.filePath || "";
      const isPdf = /\.pdf(?:$|\?)/i.test(path);
      if (!isPdf) return false;

      if (user.role === "AppController") return true;
      return (
        app.recipientRole === user.role ||
        (app.requiredSigners || []).includes(user.role)
      );
    });
  }, [applications, user.role]);

  const selectedApplication =
    visibleApplications.find((item) => item._id === selectedId) ||
    visibleApplications[0] ||
    null;

  useEffect(() => {
    if (!visibleApplications.length) {
      setSelectedId("");
      setRequiredSigners([]);
      return;
    }
    if (!visibleApplications.some((item) => item._id === selectedId)) {
      setSelectedId(visibleApplications[0]._id);
    }
  }, [visibleApplications, selectedId]);

  useEffect(() => {
    setRequiredSigners(selectedApplication?.requiredSigners || []);
    setPageNumber(1);
    setPageCount(0);
    setPlacement({ x: 68, y: 78, width: 24, height: 9 });
    setMessage("");
  }, [selectedApplication?._id]);

  const sourcePath =
    selectedApplication?.signedDocument?.filePath ||
    selectedApplication?.document?.filePath ||
    "";
  const pdfUrl = sourcePath ? `${API}${sourcePath}` : "";
  const canConfigure =
    user.role === "AppController" ||
    user.role === selectedApplication?.recipientRole;
  const canSign =
    SIGNER_ROLES.includes(user.role) &&
    (selectedApplication?.requiredSigners || []).includes(user.role) &&
    !(selectedApplication?.signatures || []).some(
      (signature) => signature.role === user.role
    );

  function handlePdfLoad(pdf) {
    setPageCount(pdf.numPages);
    const safePage = Math.min(pageNumber, pdf.numPages || 1);
    setPageNumber(safePage);
    pdf.getPage(safePage).then((page) => {
      const viewport = page.getViewport({ scale: PDF_WIDTH / page.getViewport({ scale: 1 }).width });
      setPageSize({ width: viewport.width, height: viewport.height });
    }).catch((error) => {
      console.error("Could not measure PDF page:", error);
    });
  }

  useEffect(() => {
    if (!pdfUrl || !pageCount) return;
    // Refresh page measurements when the selected page changes.
    let cancelled = false;
    const measure = async () => {
      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageNumber);
        const original = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: PDF_WIDTH / original.width });
        if (!cancelled) {
          setPageSize({ width: viewport.width, height: viewport.height });
        }
        await pdf.destroy();
      } catch (error) {
        console.error("Could not measure PDF page:", error);
      }
    };
    measure();
    return () => { cancelled = true; };
  }, [pdfUrl, pageNumber, pageCount]);

  function updatePlacementFromPixels(x, y, width, height) {
    const rect = pageWrapRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    setPlacement({
      x: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (y / rect.height) * 100)),
      width: Math.max(1, Math.min(100, (width / rect.width) * 100)),
      height: Math.max(1, Math.min(100, (height / rect.height) * 100)),
    });
  }

  async function saveRequiredSigners() {
    if (!selectedApplication) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await apiFetch(
        `/applications/${selectedApplication._id}/required-signers`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requiredSigners }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save required signers.");
      setMessage("Required signers saved.");
      await onRefresh();
    } catch (error) {
      setMessage(error.message || "Could not save required signers.");
    } finally {
      setBusy(false);
    }
  }

  async function signPdf() {
    if (!selectedApplication || !signatureFile) {
      setMessage("Select a PNG or JPG signature image first.");
      return;
    }

    const rect = pageWrapRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) {
      setMessage("PDF page is still loading. Please try again.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("signature", signatureFile);
      formData.append("page", String(pageNumber));
      formData.append("x", String(placement.x));
      formData.append("y", String(placement.y));
      formData.append("width", String(placement.width));
      formData.append("height", String(placement.height));

      const response = await apiFetch(
        `/applications/${selectedApplication._id}/sign`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "PDF signing failed.");

      setMessage("Signature embedded in the PDF successfully.");
      setSignatureFile(null);
      await onRefresh();
    } catch (error) {
      setMessage(error.message || "PDF signing failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pdf-signature-page">
      <div className="page-title">
        <h2>PDF Signatures</h2>
        <p>Select a PDF, choose its required signers, and place your signature on the page.</p>
      </div>

      <div className="content-card">
        <div className="pdf-signature-toolbar">
          <div className="form-group pdf-signature-select">
            <label htmlFor="signature-application">Application PDF</label>
            <select
              id="signature-application"
              value={selectedApplication?._id || ""}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={!visibleApplications.length}
            >
              {visibleApplications.length === 0 && (
                <option value="">No PDF applications available</option>
              )}
              {visibleApplications.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.studentName} — {app.applicationType}
                </option>
              ))}
            </select>
          </div>
          {selectedApplication?.signedDocument?.filePath && (
            <a
              className="primary-btn pdf-download-link"
              href={`${API}${selectedApplication.signedDocument.filePath}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Current Signed PDF
            </a>
          )}
        </div>

        {selectedApplication ? (
          <>
            <div className="pdf-signature-details">
              <strong>{selectedApplication.applicationType}</strong>
              <span>Student: {selectedApplication.studentName || "-"}</span>
              <span>ID: {selectedApplication.studentId || "-"}</span>
              <span>Recipient: {selectedApplication.recipientRole || "-"}</span>
            </div>

            {canConfigure && (
              <section className="required-signers">
                <h3>Required signers for this document</h3>
                <p>Select only the officers whose signatures this particular document needs.</p>
                <div className="required-signers-options">
                  {SIGNER_ROLES.map((role) => (
                    <label key={role}>
                      <input
                        type="checkbox"
                        checked={requiredSigners.includes(role)}
                        onChange={(event) => {
                          setRequiredSigners((previous) =>
                            event.target.checked
                              ? [...new Set([...previous, role])]
                              : previous.filter((item) => item !== role)
                          );
                        }}
                      />
                      {role}
                    </label>
                  ))}
                </div>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={saveRequiredSigners}
                  disabled={busy}
                >
                  Save Required Signers
                </button>
              </section>
            )}

            <div className="pdf-signature-controls">
              <label className="signature-upload">
                Signature image (PNG/JPG)
                <input
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(event) => setSignatureFile(event.target.files?.[0] || null)}
                />
              </label>

              <div className="pdf-page-controls">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                  disabled={pageNumber <= 1}
                >
                  Previous page
                </button>
                <span>Page {pageNumber}{pageCount ? ` of ${pageCount}` : ""}</span>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
                  disabled={!pageCount || pageNumber >= pageCount}
                >
                  Next page
                </button>
              </div>
            </div>

            {signatureUrl && (
              <p className="signature-tip">
                Drag the signature to move it. Use its corner handles to resize it before signing.
              </p>
            )}

            <div className="pdf-preview-scroll">
              <Document
                file={pdfUrl}
                onLoadSuccess={handlePdfLoad}
                onLoadError={(error) => setMessage(`Could not load PDF: ${error.message}`)}
                loading={<p>Loading PDF…</p>}
                error={<p>PDF preview could not be loaded.</p>}
              >
                <div
                  className="pdf-page-overlay"
                  ref={pageWrapRef}
                  style={{
                    width: `${pageSize.width}px`,
                    height: `${pageSize.height}px`,
                  }}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={PDF_WIDTH}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  {signatureUrl && (
                    <Rnd
                      bounds="parent"
                      size={{
                        width: pageSize.width * placement.width / 100,
                        height: pageSize.height * placement.height / 100,
                      }}
                      position={{
                        x: pageSize.width * placement.x / 100,
                        y: pageSize.height * placement.y / 100,
                      }}
                      onDragStop={(event, data) => {
                        updatePlacementFromPixels(
                          data.x,
                          data.y,
                          pageSize.width * placement.width / 100,
                          pageSize.height * placement.height / 100
                        );
                      }}
                      onResizeStop={(event, direction, ref, delta, position) => {
                        updatePlacementFromPixels(
                          position.x,
                          position.y,
                          ref.offsetWidth,
                          ref.offsetHeight
                        );
                      }}
                      minWidth={45}
                      minHeight={20}
                      className="signature-rnd"
                    >
                      <img src={signatureUrl} alt="Signature preview" />
                    </Rnd>
                  )}
                </div>
              </Document>
            </div>

            <div className="pdf-signature-footer">
              <div>
                <strong>Signed roles:</strong>{" "}
                {(selectedApplication.signatures || []).length
                  ? selectedApplication.signatures.map((item) => item.role).join(", ")
                  : "No signatures yet"}
              </div>
              {canSign ? (
                <button
                  className="success-btn"
                  type="button"
                  onClick={signPdf}
                  disabled={busy || !signatureFile}
                >
                  {busy ? "Please wait…" : "Embed Signature in PDF"}
                </button>
              ) : (
                <p className="signature-permission-note">
                  {SIGNER_ROLES.includes(user.role)
                    ? "Your role must be selected as a required signer, and it can sign only once per document."
                    : "Your role can configure signers only when it is the recipient or AppController."}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            No PDF application is available for your role. The original document must be a PDF.
          </div>
        )}

        {message && <div className="alert alert-info pdf-signature-message">{message}</div>}
      </div>
    </div>
  );
}