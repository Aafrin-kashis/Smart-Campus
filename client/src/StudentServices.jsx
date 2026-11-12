import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StudentServices({ user, setPage }) {
  const [service, setService] = useState("");

  const [applicationType, setApplicationType] = useState("");
  const [applicationReason, setApplicationReason] =
    useState("");
  const [applicationMessage, setApplicationMessage] =
    useState("");

  const [examForm, setExamForm] = useState({
    examFormNumber: "",
    examName: "",
    session: "",
    semester: "",
    course: "",
    dateOfBirth: "",
    fatherName: "",
    motherName: "",
    address: "",
    pinCode: "",
    collegeName: "",
    universityRegistrationNo: "",
    collegeRollNo: "",
    examFee: "",
    transactionId: "",
  });

  const [subjects, setSubjects] = useState([
    { code: "", name: "" },
  ]);

  const [feeReceipt, setFeeReceipt] = useState(null);
  const [examMessage, setExamMessage] = useState("");

  const [registrationForm, setRegistrationForm] =
    useState({
      session: "",
      semester: "",
      course: "",
      registrationNumber: "",
      details: "",
    });

  const [registrationDocuments, setRegistrationDocuments] =
    useState([]);

  const [registrationMessage, setRegistrationMessage] =
    useState("");

  const [documentForm, setDocumentForm] = useState({
    requestType: "",
    reason: "",
  });

  const [documentFile, setDocumentFile] =
    useState(null);

  const [documentMessage, setDocumentMessage] =
    useState("");

  function getToken() {
    return localStorage.getItem("smartCampusToken");
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();

    return fetch(`${API}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /* =========================
     GENERAL APPLICATION
  ========================= */

  async function submitApplication(e) {
    e.preventDefault();

    setApplicationMessage("");

    try {
      const response = await apiFetch(
        "/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentName: user.name,
            studentId: user.studentId,
            applicationType,
            reason: applicationReason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setApplicationMessage(
          data.message ||
            "Application submit failed."
        );
        return;
      }

      setApplicationMessage(
        "Application submitted successfully!"
      );

      setApplicationType("");
      setApplicationReason("");
    } catch (error) {
      console.error(error);

      setApplicationMessage(
        "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================
     EXAM FORM
  ========================= */

  function updateExamField(field, value) {
    setExamForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateSubject(index, field, value) {
    setSubjects((previous) =>
      previous.map((subject, i) =>
        i === index
          ? {
              ...subject,
              [field]: value,
            }
          : subject
      )
    );
  }

  function addSubject() {
    setSubjects((previous) => [
      ...previous,
      {
        code: "",
        name: "",
      },
    ]);
  }

  function removeSubject(index) {
    setSubjects((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  async function submitExamForm(e) {
    e.preventDefault();

    setExamMessage("");

    try {
      const formData = new FormData();

      formData.append(
        "examFormNumber",
        examForm.examFormNumber
      );

      formData.append(
        "examName",
        examForm.examName
      );

      formData.append(
        "session",
        examForm.session
      );

      formData.append(
        "semester",
        examForm.semester
      );

      formData.append(
        "course",
        examForm.course
      );

      formData.append(
        "dateOfBirth",
        examForm.dateOfBirth
      );

      formData.append(
        "fatherName",
        examForm.fatherName
      );

      formData.append(
        "motherName",
        examForm.motherName
      );

      formData.append(
        "address",
        examForm.address
      );

      formData.append(
        "pinCode",
        examForm.pinCode
      );

      formData.append(
        "collegeName",
        examForm.collegeName
      );

      formData.append(
        "universityRegistrationNo",
        examForm.universityRegistrationNo
      );

      formData.append(
        "collegeRollNo",
        examForm.collegeRollNo
      );

      formData.append(
        "examFee",
        examForm.examFee
      );

      formData.append(
        "transactionId",
        examForm.transactionId
      );

      formData.append(
        "subjects",
        JSON.stringify(subjects)
      );

      if (feeReceipt) {
        formData.append(
          "feeReceipt",
          feeReceipt
        );
      }

      const response = await apiFetch(
        "/exam-applications",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setExamMessage(
          data.message ||
            "Exam form submit failed."
        );
        return;
      }

      setExamMessage(
        "Exam form successfully submitted to Department!"
      );

      setExamForm({
        examFormNumber: "",
        examName: "",
        session: "",
        semester: "",
        course: "",
        dateOfBirth: "",
        fatherName: "",
        motherName: "",
        address: "",
        pinCode: "",
        collegeName: "",
        universityRegistrationNo: "",
        collegeRollNo: "",
        examFee: "",
        transactionId: "",
      });

      setSubjects([
        {
          code: "",
          name: "",
        },
      ]);

      setFeeReceipt(null);

      e.target.reset();
    } catch (error) {
      console.error(error);

      setExamMessage(
        "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================
     REGISTRATION FORM
  ========================= */

  async function submitRegistrationForm(e) {
    e.preventDefault();

    setRegistrationMessage("");

    try {
      const formData = new FormData();

      formData.append(
        "session",
        registrationForm.session
      );

      formData.append(
        "semester",
        registrationForm.semester
      );

      formData.append(
        "course",
        registrationForm.course
      );

      formData.append(
        "registrationNumber",
        registrationForm.registrationNumber
      );

      formData.append(
        "details",
        registrationForm.details
      );

      registrationDocuments.forEach(
        (file) => {
          formData.append(
            "documents",
            file
          );
        }
      );

      const response = await apiFetch(
        "/registration-applications",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRegistrationMessage(
          data.message ||
            "Registration form submit failed."
        );
        return;
      }

      setRegistrationMessage(
        "Registration form successfully submitted to Department!"
      );

      setRegistrationForm({
        session: "",
        semester: "",
        course: "",
        registrationNumber: "",
        details: "",
      });

      setRegistrationDocuments([]);

      e.target.reset();
    } catch (error) {
      console.error(error);

      setRegistrationMessage(
        "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================
     DOCUMENT REQUEST
  ========================= */

  async function submitDocumentRequest(e) {
    e.preventDefault();

    setDocumentMessage("");

    try {
      const formData = new FormData();

      formData.append(
        "requestType",
        documentForm.requestType
      );

      formData.append(
        "reason",
        documentForm.reason
      );

      if (documentFile) {
        formData.append(
          "document",
          documentFile
        );
      }

      const response = await apiFetch(
        "/document-requests",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setDocumentMessage(
          data.message ||
            "Document request failed."
        );
        return;
      }

      setDocumentMessage(
        "Document request successfully submitted!"
      );

      setDocumentForm({
        requestType: "",
        reason: "",
      });

      setDocumentFile(null);

      e.target.reset();
    } catch (error) {
      console.error(error);

      setDocumentMessage(
        "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================
     SERVICE MENU
  ========================= */

  if (!service) {
    return (
      <div>

        <div className="page-title">
          <h2>Student Services</h2>

          <p>
            Select the service you want to use.
          </p>
        </div>

        <div className="role-grid">

          <div
            className="role-card"
            onClick={() =>
              setService("application")
            }
            style={{ cursor: "pointer" }}
          >
            <h3>
              Online Applications
            </h3>

            <p>
              Submit leave, fees, examination,
              library, HOD and other college
              applications online.
            </p>
          </div>

          <div
            className="role-card"
            onClick={() =>
              setService("exam")
            }
            style={{ cursor: "pointer" }}
          >
            <h3>
              Exam Services
            </h3>

            <p>
              Fill your exam form online and
              upload your exam fee receipt.
            </p>
          </div>

          <div
            className="role-card"
            onClick={() =>
              setService("registration")
            }
            style={{ cursor: "pointer" }}
          >
            <h3>
              Registration Form
            </h3>

            <p>
              Submit your registration form
              online to the Department.
            </p>
          </div>

          <div
            className="role-card"
            onClick={() =>
              setService("document")
            }
            style={{ cursor: "pointer" }}
          >
            <h3>
              Document Services
            </h3>

            <p>
              Request TR, Bonafide, No-Dues
              and other documents.
            </p>
          </div>

        </div>

      </div>
    );
  }

  /* =========================
     ONLINE APPLICATION
  ========================= */

  if (service === "application") {
    return (
      <div>

        <div className="page-title">

          <button
            className="secondary-btn"
            onClick={() => setService("")}
          >
            ← Back
          </button>

          <h2 style={{ marginTop: "18px" }}>
            Online Application
          </h2>

          <p>
            Submit your application to the
            concerned college authority.
          </p>

        </div>

        <div className="content-card">

          <form onSubmit={submitApplication}>

            <div className="form-group">

              <label>
                Application Type
              </label>

              <select
                value={applicationType}
                onChange={(e) =>
                  setApplicationType(
                    e.target.value
                  )
                }
                required
              >

                <option value="">
                  Select Application
                </option>

                <option value="Leave Request">
                  Leave Request
                </option>

                <option value="Fees Request">
                  Fees Request
                </option>

                <option value="TR Request">
                  TR Request
                </option>

                <option value="Principal Signature">
                  Principal Signature
                </option>

                <option value="Bonafide">
                  Bonafide
                </option>

                <option value="Library Card">
                  Library Card
                </option>

                <option value="Library No Dues">
                  Library No Dues
                </option>

                <option value="Examination Inquiry">
                  Examination Inquiry
                </option>

                <option value="Examination Report">
                  Examination Report
                </option>

                <option value="Admit Card Request">
                  Admit Card Request
                </option>

                <option value="Mess No Dues">
                  Mess No Dues
                </option>

                <option value="Bus Reservation">
                  Bus Reservation
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Reason / Description
              </label>

              <textarea
                value={applicationReason}
                onChange={(e) =>
                  setApplicationReason(
                    e.target.value
                  )
                }
                placeholder="Enter your reason or application details"
                required
              />

            </div>

            <button
              type="submit"
              className="primary-btn"
            >
              Submit Application
            </button>

          </form>

          {applicationMessage && (
            <div className="alert alert-info">
              {applicationMessage}
            </div>
          )}

        </div>

      </div>
    );
  }

  /* =========================
     EXAM SERVICES
  ========================= */

  if (service === "exam") {
    return (
      <div>

        <div className="page-title">

          <button
            className="secondary-btn"
            onClick={() => setService("")}
          >
            ← Back
          </button>

          <h2 style={{ marginTop: "18px" }}>
            Online Exam Form
          </h2>

          <p>
            Fill the examination form and
            submit it directly to Department.
          </p>

        </div>

        <div className="content-card">

          <form onSubmit={submitExamForm}>

            <div className="form-grid">

              <div className="form-group">
                <label>
                  Exam Form Number
                </label>

                <input
                  value={
                    examForm.examFormNumber
                  }
                  onChange={(e) =>
                    updateExamField(
                      "examFormNumber",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Exam Name
                </label>

                <input
                  placeholder="Semester Examination"
                  value={examForm.examName}
                  onChange={(e) =>
                    updateExamField(
                      "examName",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Session
                </label>

                <input
                  placeholder="2026-27"
                  value={examForm.session}
                  onChange={(e) =>
                    updateExamField(
                      "session",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Semester
                </label>

                <input
                  placeholder="4th Semester"
                  value={examForm.semester}
                  onChange={(e) =>
                    updateExamField(
                      "semester",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Course
                </label>

                <input
                  placeholder="B.Tech CSE"
                  value={examForm.course}
                  onChange={(e) =>
                    updateExamField(
                      "course",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={
                    examForm.dateOfBirth
                  }
                  onChange={(e) =>
                    updateExamField(
                      "dateOfBirth",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Father's Name
                </label>

                <input
                  value={examForm.fatherName}
                  onChange={(e) =>
                    updateExamField(
                      "fatherName",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Mother's Name
                </label>

                <input
                  value={examForm.motherName}
                  onChange={(e) =>
                    updateExamField(
                      "motherName",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  PIN Code
                </label>

                <input
                  value={examForm.pinCode}
                  onChange={(e) =>
                    updateExamField(
                      "pinCode",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  College Name
                </label>

                <input
                  value={examForm.collegeName}
                  onChange={(e) =>
                    updateExamField(
                      "collegeName",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  University Registration No.
                </label>

                <input
                  value={
                    examForm.universityRegistrationNo
                  }
                  onChange={(e) =>
                    updateExamField(
                      "universityRegistrationNo",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  College Roll No.
                </label>

                <input
                  value={
                    examForm.collegeRollNo
                  }
                  onChange={(e) =>
                    updateExamField(
                      "collegeRollNo",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Exam Fee
                </label>

                <input
                  type="number"
                  value={examForm.examFee}
                  onChange={(e) =>
                    updateExamField(
                      "examFee",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Transaction ID
                </label>

                <input
                  value={
                    examForm.transactionId
                  }
                  onChange={(e) =>
                    updateExamField(
                      "transactionId",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group form-full">
                <label>
                  Address
                </label>

                <textarea
                  value={examForm.address}
                  onChange={(e) =>
                    updateExamField(
                      "address",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

            </div>

            <h3 style={{ margin: "25px 0 15px" }}>
              Subjects
            </h3>

            {subjects.map(
              (subject, index) => (
                <div
                  className="form-grid"
                  key={index}
                  style={{
                    marginBottom: "12px",
                  }}
                >

                  <div className="form-group">

                    <label>
                      Subject Code
                    </label>

                    <input
                      value={subject.code}
                      onChange={(e) =>
                        updateSubject(
                          index,
                          "code",
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Subject Name
                    </label>

                    <input
                      value={subject.name}
                      onChange={(e) =>
                        updateSubject(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                  {subjects.length > 1 && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() =>
                        removeSubject(index)
                      }
                    >
                      Remove Subject
                    </button>
                  )}

                </div>
              )
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={addSubject}
              style={{ marginBottom: "20px" }}
            >
              + Add Subject
            </button>

            <div className="form-group">

              <label>
                Exam Fee Receipt
              </label>

              <input
                className="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  setFeeReceipt(
                    e.target.files[0] || null
                  )
                }
                required
              />

              <small>
                JPG, PNG or PDF — Maximum 5 MB
              </small>

            </div>

            <button
              className="primary-btn"
              type="submit"
            >
              Submit Exam Form
            </button>

          </form>

          {examMessage && (
            <div className="alert alert-info">
              {examMessage}
            </div>
          )}

        </div>

      </div>
    );
  }

  /* =========================
     REGISTRATION FORM
  ========================= */

  if (service === "registration") {
    return (
      <div>

        <div className="page-title">

          <button
            className="secondary-btn"
            onClick={() => setService("")}
          >
            ← Back
          </button>

          <h2 style={{ marginTop: "18px" }}>
            Online Registration Form
          </h2>

          <p>
            Submit your registration details
            directly to Department.
          </p>

        </div>

        <div className="content-card">

          <form
            onSubmit={
              submitRegistrationForm
            }
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Session
                </label>

                <input
                  placeholder="2026-27"
                  value={
                    registrationForm.session
                  }
                  onChange={(e) =>
                    setRegistrationForm(
                      (previous) => ({
                        ...previous,
                        session:
                          e.target.value,
                      })
                    )
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Semester
                </label>

                <input
                  value={
                    registrationForm.semester
                  }
                  onChange={(e) =>
                    setRegistrationForm(
                      (previous) => ({
                        ...previous,
                        semester:
                          e.target.value,
                      })
                    )
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Course
                </label>

                <input
                  placeholder="B.Tech CSE"
                  value={
                    registrationForm.course
                  }
                  onChange={(e) =>
                    setRegistrationForm(
                      (previous) => ({
                        ...previous,
                        course:
                          e.target.value,
                      })
                    )
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Registration Number
                </label>

                <input
                  value={
                    registrationForm.registrationNumber
                  }
                  onChange={(e) =>
                    setRegistrationForm(
                      (previous) => ({
                        ...previous,
                        registrationNumber:
                          e.target.value,
                      })
                    )
                  }
                />

              </div>

              <div className="form-group form-full">

                <label>
                  Details
                </label>

                <textarea
                  value={
                    registrationForm.details
                  }
                  onChange={(e) =>
                    setRegistrationForm(
                      (previous) => ({
                        ...previous,
                        details:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="Enter registration details"
                  required
                />

              </div>

              <div className="form-group form-full">

                <label>
                  Supporting Documents
                </label>

                <input
                  className="file-input"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) =>
                    setRegistrationDocuments(
                      Array.from(
                        e.target.files
                      ).slice(0, 5)
                    )
                  }
                />

                <small>
                  Maximum 5 documents. JPG,
                  PNG or PDF.
                </small>

              </div>

            </div>

            <button
              className="primary-btn"
              type="submit"
            >
              Submit Registration Form
            </button>

          </form>

          {registrationMessage && (
            <div className="alert alert-info">
              {registrationMessage}
            </div>
          )}

        </div>

      </div>
    );
  }

  /* =========================
     DOCUMENT SERVICES
  ========================= */

  if (service === "document") {
    return (
      <div>

        <div className="page-title">

          <button
            className="secondary-btn"
            onClick={() => setService("")}
          >
            ← Back
          </button>

          <h2 style={{ marginTop: "18px" }}>
            Document Services
          </h2>

          <p>
            Request important college documents
            online.
          </p>

        </div>

        <div className="content-card">

          <form
            onSubmit={
              submitDocumentRequest
            }
          >

            <div className="form-group">

              <label>
                Document Type
              </label>

              <select
                value={
                  documentForm.requestType
                }
                onChange={(e) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,
                      requestType:
                        e.target.value,
                    })
                  )
                }
                required
              >

                <option value="">
                  Select Document
                </option>

                <option value="TR">
                  Transfer Certificate
                </option>

                <option value="Bonafide">
                  Bonafide Certificate
                </option>

                <option value="No Dues">
                  No Dues Certificate
                </option>

                <option value="Other Document">
                  Other Document
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Reason
              </label>

              <textarea
                value={
                  documentForm.reason
                }
                onChange={(e) =>
                  setDocumentForm(
                    (previous) => ({
                      ...previous,
                      reason:
                        e.target.value,
                    })
                  )
                }
                placeholder="Enter reason for document request"
                required
              />

            </div>

            <div className="form-group">

              <label>
                Supporting Document
              </label>

              <input
                className="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) =>
                  setDocumentFile(
                    e.target.files[0] ||
                      null
                  )
                }
              />

            </div>

            <button
              className="primary-btn"
              type="submit"
            >
              Submit Document Request
            </button>

          </form>

          {documentMessage && (
            <div className="alert alert-info">
              {documentMessage}
            </div>
          )}

        </div>

      </div>
    );
  }

  return null;
}

export default StudentServices;