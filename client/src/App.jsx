import { useEffect, useState } from "react";
import "./App.css";
import StudentServices from "./StudentServices";
import PdfSignaturePanel from "./PdfSignaturePanel";
import TRUploadPanel from "./TRUploadPanel";
import TRDownloadPanel from "./TRDownloadPanel";
import CombinedTRPanel from "./CombinedTRPanel";
import CampusCalendarWeather from "./CampusCalendarWeather";


const API = "http://localhost:5000";

const ROLES = [
  "Admin",
  "Student",
  "AppController",
  "Principal",
  "HOD",
  "Library",
  "ExaminationController",
  "Tabulator",
  "MessCanteen",
  "Transport",
  "Department",
];

const APPLICATION_TYPES = [
  "TR Request",
  "Principal Signature",
  "Tabulator Signature",
  "Bonafide",
  "Other Document",
  "Leave Request",
  "Library Card",
  "Library No Dues",
  "Examination Inquiry",
  "Examination Report",
  "Exam Form",
  "Registration Form",
  "Admit Card Request",
  "Mess No Dues",
  "Bus Reservation",
  "Fees Request",
  "Message / Report",
];

/* =========================================================
   APPLICATION TABLE
========================================================= */

function ApplicationTable({
  applications,
  user,
  updateApplicationStatus,
  deleteApplication,
}) {

  /* =========================================================
     ROLE BASED APPLICATION FILTER
  ========================================================= */

  const roleApplications =
    user.role === "Admin"
      ? applications
      : applications.filter(
          (application) =>
            application.recipientRole === user.role
        );

  return (
    <div className="content-card">
      <h3>Applications</h3>

      {roleApplications.length === 0 ? (
        <div className="empty-state">
          No applications found.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Type</th>
                <th>Reason</th>
<th>Document</th>
<th>Recipient</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {roleApplications.map((application) => (
                <tr key={application._id}>
                  <td>{application.studentName}</td>

                  <td>{application.studentId}</td>

                  <td>{application.applicationType}</td>

                  <td>
                    {application.applicationType ===
                      "Admit Card Request" &&
                    application.examApplication
                      ? `${application.examApplication.examName || "Exam"} - Semester ${
                          application.examApplication.semester || "-"
                        } - ${application.examApplication.session || "-"}`
                      : application.reason}
                  </td>

                  <td>
  {application.applicationType ===
    "Principal Signature" &&
  application.document?.filePath ? (
    <a
      href={`${API}${application.document.filePath}`}
      target="_blank"
      rel="noreferrer"
    >
      View Document
    </a>
  ) : (
    "-"
  )}
</td>


                  <td>
                    {application.recipientRole || "-"}
                  </td>

                  <td>
                    <span
                      className={`status status-${String(
                        application.status || "Pending"
                      ).toLowerCase()}`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">

                      {application.status === "Pending" && (
                        <>
                          <button
                            className="success-btn"
                            onClick={() =>
                              updateApplicationStatus(
                                application._id,
                                "Approved"
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="danger-btn"
                            onClick={() =>
                              updateApplicationStatus(
                                application._id,
                                "Rejected"
                              )
                            }
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {user.role === "Admin" && (
                        <button
                          className="danger-btn"
                          onClick={() =>
                            deleteApplication(application._id)
                          }
                        >
                          Delete
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DEPARTMENT WORKFLOW PAGE
========================================================= */

function DepartmentWorkflowPage({
  departmentRequests,
  departmentLoading,
  loadDepartmentApplications,
  updateDepartmentRequest,
  admitCardFiles,
  handleAdmitCardFileChange,
  sendAdmitCard,
  uploadingAdmitCardId,
  viewAdmitCard,
}) {
  const examRequests = departmentRequests.filter(
    (item) => item.workflowType === "exam"
  );

  const registrationRequests = departmentRequests.filter(
    (item) => item.workflowType === "registration"
  );

  const generalRequests = departmentRequests.filter(
    (item) => item.workflowType === "general"
  );

  return (
    <>
      <div className="page-title">
        <h2>Department Workflow</h2>

        <p>
          Review exam forms, registration forms and other
          applications assigned to Department.
        </p>
      </div>

      <div className="cards-grid">
        <div className="stat-card">
          <h3>Total Requests</h3>
          <strong>{departmentRequests.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Exam Forms</h3>
          <strong>{examRequests.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Registration Forms</h3>
          <strong>{registrationRequests.length}</strong>
        </div>

        <div className="stat-card">
          <h3>Other Requests</h3>
          <strong>{generalRequests.length}</strong>
        </div>
      </div>

      <div className="content-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <h3>Department Requests</h3>

          <button
            className="primary-btn"
            onClick={loadDepartmentApplications}
            disabled={departmentLoading}
          >
            {departmentLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {departmentLoading ? (
          <div className="empty-state">
            Loading department requests...
          </div>
        ) : departmentRequests.length === 0 ? (
          <div className="empty-state">
            No requests found for Department.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {departmentRequests.map((item) => (
                  <tr
                    key={`${item.workflowType}-${item._id}`}
                  >
                    <td>{item.studentName || "-"}</td>

                    <td>{item.studentId || "-"}</td>

                    <td>{item.displayType || "-"}</td>

                    <td>{item.displayReason || "-"}</td>

                    <td>
                      <span
                        className={`status status-${String(
                          item.status || "Pending"
                        ).toLowerCase()}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        {item.status === "Pending" && (
                          <>
                            <button
                              className="success-btn"
                              onClick={() =>
                                updateDepartmentRequest(
                                  item,
                                  "Approved"
                                )
                              }
                            >
                              Approve
                            </button>

                            <button
                              className="danger-btn"
                              onClick={() =>
                                updateDepartmentRequest(
                                  item,
                                  "Rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* ADMIT CARD */}

                        {item.workflowType === "exam" &&
                          item.status === "Approved" && (
                            <div
                              style={{
                                marginTop: "10px",
                                padding: "10px",
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                minWidth: "250px",
                              }}
                            >
                              <strong
                                style={{
                                  display: "block",
                                  marginBottom: "8px",
                                }}
                              >
                                Admit Card
                              </strong>

                              {item.admitCard?.filePath ? (
                                <div
                                  style={{
                                    marginBottom: "10px",
                                  }}
                                >
                                  <button
                                    className="primary-btn"
                                    type="button"
                                    onClick={() =>
                                      viewAdmitCard(
                                        item._id,
                                        item.admitCard
                                          ?.fileName ||
                                          "admit-card"
                                      )
                                    }
                                  >
                                    View Current Admit Card
                                  </button>
                                </div>
                              ) : (
                                <p
                                  style={{
                                    fontSize: "13px",
                                    margin: "0 0 8px 0",
                                  }}
                                >
                                  No admit card uploaded yet.
                                </p>
                              )}

                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) =>
                                  handleAdmitCardFileChange(
                                    item._id,
                                    e.target.files?.[0]
                                  )
                                }
                              />

                              {admitCardFiles[item._id] && (
                                <p
                                  style={{
                                    fontSize: "13px",
                                    margin: "8px 0",
                                  }}
                                >
                                  Selected:{" "}
                                  <strong>
                                    {
                                      admitCardFiles[
                                        item._id
                                      ].name
                                    }
                                  </strong>
                                </p>
                              )}

                              <button
                                className="success-btn"
                                type="button"
                                style={{
                                  marginTop: "8px",
                                }}
                                onClick={() =>
                                  sendAdmitCard(item)
                                }
                                disabled={
                                  uploadingAdmitCardId ===
                                  item._id
                                }
                              >
                                {uploadingAdmitCardId ===
                                item._id
                                  ? "Sending..."
                                  : item.admitCard?.filePath
                                  ? "Replace & Send Admit Card"
                                  : "Send Admit Card"}
                              </button>
                            </div>
                          )}

                        {item.workflowType === "exam" &&
                          item.status === "Pending" && (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Approve exam form first to
                              send admit card.
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   STUDENT REQUEST PAGE
========================================================= */

function StudentRequestPage({
  myExamApplications,
  applicationType,
  setApplicationType,
  selectedExamApplication,
  setSelectedExamApplication,
  reason,
  setReason,
  handleApplicationSubmit,
  applicationDocument,
setApplicationDocument,
  applicationMessage,
  setApplicationMessage,
  messageRecipient,
  setMessageRecipient,
}) {
  const approvedExamApplications =
    myExamApplications.filter(
      (exam) => exam.status === "Approved"
    );

  return (
    <>
      <div className="page-title">
        <h2>Request Application</h2>

        <p>
          Submit your college application online.
        </p>
      </div>

      <div className="content-card">
        <form onSubmit={handleApplicationSubmit}>

          {/* APPLICATION TYPE */}

          <div className="form-group">
            <label>Application Type</label>

            <select
              value={applicationType}
              onChange={(e) => {
                const value = e.target.value;

                setApplicationType(value);

                if (value !== "Admit Card Request") {
                  setSelectedExamApplication("");
                }

                if (value !== "Message / Report") {
                  setMessageRecipient("");
                }

                setApplicationMessage("");
              }}
              required
            >
              <option value="">
                Select Application Type
              </option>

              {APPLICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {(
  applicationType === "Principal Signature" ||
  applicationType === "Tabulator Signature"
) && (
  <div className="form-group">
    <label>Upload Document</label>

    <input
      type="file"
      accept=".pdf,.png,.jpg,.jpeg"
      onChange={(e) =>
        setApplicationDocument(
          e.target.files[0] || null
        )
      }
      required
    />

    <small>
      Upload the document that requires the Principal's signature.
    </small>
  </div>
)}

          {/* =================================================
              MESSAGE / REPORT - SEND TO
          ================================================= */}

          {applicationType === "Message / Report" && (
            <div className="form-group">

              <label>Send To</label>

              <select
                value={messageRecipient}
                onChange={(e) =>
                  setMessageRecipient(e.target.value)
                }
                required
              >
                <option value="">
                  Select Authority
                </option>

                <option value="Admin">
                  Admin
                </option>

                <option value="Principal">
                  Principal
                </option>

                <option value="HOD">
                  HOD
                </option>

                <option value="ExaminationController">
                  Examination Controller
                </option>

                <option value="Library">
                  Library
                </option>

                <option value="Department">
                  Department
                </option>

                <option value="MessCanteen">
                  Mess / Canteen
                </option>

                <option value="Transport">
                  Transport
                </option>
              </select>

            </div>
          )}

          {/* =================================================
              APPROVED EXAM FORM
          ================================================= */}

          {applicationType === "Admit Card Request" && (
            <div className="form-group">

              <label>Select Approved Exam Form</label>

              <select
                value={selectedExamApplication}
                onChange={(e) =>
                  setSelectedExamApplication(
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Approved Exam Form
                </option>

                {approvedExamApplications.map((exam) => (
                  <option
                    key={exam._id}
                    value={exam._id}
                  >
                    {exam.examName || "Exam"} - Semester{" "}
                    {exam.semester || "-"} -{" "}
                    {exam.session || "-"}
                  </option>
                ))}
              </select>

              {approvedExamApplications.length === 0 && (
                <small
                  style={{
                    display: "block",
                    marginTop: "8px",
                    color: "#666",
                  }}
                >
                  No approved exam form is available
                  for Admit Card Request.
                </small>
              )}

            </div>
          )}

          {/* =================================================
              REASON / MESSAGE / REPORT
          ================================================= */}

          <div className="form-group">

            <label>
              {applicationType === "Message / Report"
                ? "Message / Report"
                : "Reason / Description"}
            </label>

            <textarea
              placeholder={
                applicationType === "Message / Report"
                  ? "Enter your message or report"
                  : "Enter reason or details"
              }
              value={reason}
              onChange={(e) =>
                setReason(e.target.value)
              }
              required
            />

          </div>

          {/* SUBMIT */}

          <button
            className="primary-btn"
            type="submit"
            disabled={
              applicationType ===
                "Admit Card Request" &&
              approvedExamApplications.length === 0
            }
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
    </>
  );
}
/* =========================================================
   MY APPLICATIONS PAGE
========================================================= */

function MyApplicationsPage({
  getAllStudentApplications,
  viewAdmitCard,
}) {
  const allStudentApplications =
    getAllStudentApplications();

  const total = allStudentApplications.length;

  const pending = allStudentApplications.filter(
    (item) => item.status === "Pending"
  ).length;

  const approved = allStudentApplications.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejected = allStudentApplications.filter(
    (item) => item.status === "Rejected"
  ).length;

  return (
    <>
      <div className="page-title">
        <h2>My Applications</h2>

        <p>
          Track all your applications, exam forms,
          registration forms and document requests.
        </p>
      </div>

      <div className="cards-grid">
        <div className="stat-card">
          <h3>Total</h3>
          <strong>{total}</strong>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <strong>{pending}</strong>
        </div>

        <div className="stat-card">
          <h3>Approved</h3>
          <strong>{approved}</strong>
        </div>

        <div className="stat-card">
          <h3>Rejected</h3>
          <strong>{rejected}</strong>
        </div>
      </div>

      <div className="content-card">
        {allStudentApplications.length === 0 ? (
          <div className="empty-state">
            No application submitted yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Reason / Details</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Document</th>
                </tr>
              </thead>

              <tbody>
                {allStudentApplications.map(
                  (application) => (
                    <tr key={application.id}>
                      <td>{application.type}</td>

                      <td>{application.reason}</td>

                      <td>{application.recipient}</td>

                      <td>
                        <span
                          className={`status status-${String(
                            application.status ||
                              "Pending"
                          ).toLowerCase()}`}
                        >
                          {application.status ||
                            "Pending"}
                        </span>
                      </td>

                      <td>
                        {application.createdAt
                          ? new Date(
                              application.createdAt
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td>
                        {application.signedDocument?.filePath ? (
                          <a
                            href={`${API}${application.signedDocument.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="success-btn"
                            style={{
                              display: "inline-block",
                              textDecoration: "none",
                            }}
                          >
                            View / Download Signed PDF
                          </a>
                        ) : application.type ===
                        "Exam Form" ? (
                          application.admitCard
                            ?.filePath ? (
                            <button
                              className="success-btn"
                              type="button"
                              onClick={() =>
                                viewAdmitCard(
                                  application.examApplicationId,
                                  application.admitCard
                                    ?.fileName ||
                                    "admit-card"
                                )
                              }
                            >
                              View / Download
                            </button>
                          ) : application.status ===
                            "Approved" ? (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Approved. Admit card
                              not sent yet.
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Available after
                              approval.
                            </span>
                          )
                        ) : application.type ===
                          "Admit Card Request" ? (
                          application.admitCard
                            ?.filePath ? (
                            <button
                              className="success-btn"
                              type="button"
                              onClick={() =>
                                viewAdmitCard(
                                  application.examApplicationId,
                                  application.admitCard
                                    ?.fileName ||
                                    "admit-card"
                                )
                              }
                            >
                              View / Download
                            </button>
                          ) : application.status ===
                            "Approved" ? (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Request approved.
                              Admit card is not
                              uploaded yet.
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              Admit card will be
                              available after
                              Department sends it.
                            </span>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   APP CONTROLLER PAGE
========================================================= */

function ControllerPage({
  registrationAllowed,
  toggleRegistration,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newRole,
  setNewRole,
  newUserStudentId,
  setNewUserStudentId,
  newUserType,
  setNewUserType,
  newUserDepartment,
  setNewUserDepartment,
  createRoleUser,
  controllerMessage,
  controllerUsers,
  changeUserAccess,
}) {
  return (
    <>
      <div className="page-title">
        <h2>App Controller</h2>

        <p>
          Manage registered users and registration
          access.
        </p>
      </div>

      <div className="content-card">
        <h3>Registration Access</h3>

        <p style={{ marginBottom: "15px" }}>
          Current status:{" "}
          <strong>
            {registrationAllowed
              ? "Allowed"
              : "Blocked"}
          </strong>
        </p>

        <button
          className={
            registrationAllowed
              ? "danger-btn"
              : "success-btn"
          }
          onClick={toggleRegistration}
        >
          {registrationAllowed
            ? "Block Registration"
            : "Allow Registration"}
        </button>
      </div>

      <div className="content-card">
        <h3>Create Role User</h3>

        <form
          className="form-grid"
          onSubmit={createRoleUser}
        >
          <div className="form-group">
            <label>Name</label>

            <input
              value={newUserName}
              onChange={(e) =>
                setNewUserName(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              value={newUserEmail}
              onChange={(e) =>
                setNewUserEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={newUserPassword}
              onChange={(e) =>
                setNewUserPassword(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>

            <select
              value={newRole}
              onChange={(e) =>
                setNewRole(e.target.value)
              }
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {newRole === "Student" && (
            <div className="form-group">
              <label>Student ID</label>

              <input
                value={newUserStudentId}
                onChange={(e) =>
                  setNewUserStudentId(
                    e.target.value
                  )
                }
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>User Type</label>

            <select
              value={newUserType}
              onChange={(e) =>
                setNewUserType(e.target.value)
              }
            >
              <option value="Student">
                Student
              </option>

              <option value="Staff">
                Staff
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>

            <input
              value={newUserDepartment}
              onChange={(e) =>
                setNewUserDepartment(
                  e.target.value
                )
              }
            />
          </div>

          <div className="form-full">
            <button
              className="primary-btn"
              type="submit"
            >
              Create User
            </button>
          </div>
        </form>

        {controllerMessage && (
          <div className="alert alert-info">
            {controllerMessage}
          </div>
        )}
      </div>

      <div className="content-card">
        <h3>Registered Users</h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
                <th>User Type</th>
                <th>Department</th>
                <th>Access</th>
              </tr>
            </thead>

            <tbody>
              {controllerUsers.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>

                  <td>{item.email}</td>

                  <td>{item.studentId || "-"}</td>

                  <td>{item.role}</td>

                  <td>{item.userType}</td>

                  <td>{item.department || "-"}</td>

                  <td>
                    <button
                      className={
                        item.isActive
                          ? "danger-btn"
                          : "success-btn"
                      }
                      onClick={() =>
                        changeUserAccess(
                          item._id,
                          !item.isActive
                        )
                      }
                    >
                      {item.isActive
                        ? "Block"
                        : "Allow"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerStudentId, setRegisterStudentId] =
    useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] =
    useState("");
  const [registerRole, setRegisterRole] =
    useState("Student");
  const [registerUserType, setRegisterUserType] =
    useState("Student");
  const [registerDepartment, setRegisterDepartment] =
    useState("");
  const [registerMessage, setRegisterMessage] =
    useState("");

  const [applications, setApplications] = useState([]);
  const [myApplications, setMyApplications] = useState(
    []
  );
  const [myExamApplications, setMyExamApplications] =
    useState([]);
  const [
    myRegistrationApplications,
    setMyRegistrationApplications,
  ] = useState([]);
  const [myDocumentRequests, setMyDocumentRequests] =
    useState([]);

  const [showRegister, setShowRegister] = useState(false);  

  /* DEPARTMENT */

  const [departmentRequests, setDepartmentRequests] =
    useState([]);
  const [departmentLoading, setDepartmentLoading] =
    useState(false);

  const [admitCardFiles, setAdmitCardFiles] = useState(
    {}
  );
  const [uploadingAdmitCardId, setUploadingAdmitCardId] =
    useState(null);

  const [applicationType, setApplicationType] =
    useState("");
  const [reason, setReason] = useState("");

  const [applicationDocument, setApplicationDocument] =
  useState(null);

  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageSubject, setMessageSubject] = useState("");

  const [applicationMessage, setApplicationMessage] =
    useState("");

  /* ADMIT CARD */

  const [
    selectedExamApplication,
    setSelectedExamApplication,
  ] = useState("");

  /* CONTROLLER */

  const [controllerUsers, setControllerUsers] =
    useState([]);
  const [registrationAllowed, setRegistrationAllowed] =
    useState(true);

  const [newRole, setNewRole] = useState("Admin");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] =
    useState("");
  const [newUserPassword, setNewUserPassword] =
    useState("");
  const [newUserStudentId, setNewUserStudentId] =
    useState("");
  const [newUserType, setNewUserType] =
    useState("Staff");
  const [newUserDepartment, setNewUserDepartment] =
    useState("");
  const [controllerMessage, setControllerMessage] =
    useState("");

  const [loading, setLoading] = useState(false);

  /* =========================================================
     AUTH HELPERS
  ========================================================= */

  function getToken() {
    return localStorage.getItem("smartCampusToken");
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();

    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem("smartCampusToken");
      localStorage.removeItem("smartCampusUser");

      setUser(null);
      setApplications([]);
      setMyApplications([]);
      setMyExamApplications([]);
      setMyRegistrationApplications([]);
      setMyDocumentRequests([]);
      setDepartmentRequests([]);

      throw new Error(
        "Session expired. Please login again."
      );
    }

    return response;
  }

  const bannerImages = [
  "/rcit-campus.jpg",
  "/banner2.jpg",
  "/banner3.jpg",
  "/banner4.jpg",
  "/banner5.jpg",
];

const [slide, setSlide] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setSlide((prev) => (prev + 1) % bannerImages.length);
  }, 3500);
  return () => clearInterval(timer);
}, []);

  /* =========================================================
     LOGIN
  ========================================================= */

  async function handleLogin(e) {
    e.preventDefault();

    setLoginMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(
          data.message || "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "smartCampusToken",
        data.token
      );

      localStorage.setItem(
        "smartCampusUser",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      setLoginEmail("");
      setLoginPassword("");
      setLoginMessage("");

      setPage("dashboard");
    } catch (error) {
      console.error(error);

      setLoginMessage(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     REGISTER
  ========================================================= */

  async function handleRegister(e) {
    e.preventDefault();

    setRegisterMessage("");
    setLoading(true);

    try {
      const body = {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole,
        userType: registerUserType,
        department: registerDepartment,
      };

      if (registerRole === "Student") {
        body.studentId = registerStudentId;
      }

      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterMessage(
          data.message || "Registration failed"
        );
        return;
      }

      setRegisterMessage(
        "Registration successful! Ab login karo."
      );

      setRegisterName("");
      setRegisterStudentId("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterRole("Student");
      setRegisterUserType("Student");
      setRegisterDepartment("");
    } catch (error) {
      console.error(error);

      setRegisterMessage(
        "Server se connect nahi ho pa raha."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem("smartCampusToken");
    localStorage.removeItem("smartCampusUser");

    setUser(null);
    setApplications([]);
    setMyApplications([]);
    setMyExamApplications([]);
    setMyRegistrationApplications([]);
    setMyDocumentRequests([]);
    setDepartmentRequests([]);

    setPage("dashboard");
  }

  /* =========================================================
   STUDENT APPLICATION
 ========================================================= */

 async function handleApplicationSubmit(e) {
  e.preventDefault();

  if (!user) {
    setApplicationMessage("Please login first.");
    return;
  }

  setApplicationMessage("");

  if (
    applicationType === "Admit Card Request" &&
    !selectedExamApplication
  ) {
    setApplicationMessage(
      "Please select the approved exam form for Admit Card Request."
    );
    return;
  }

  /* =========================================================
     MESSAGE / REPORT RECIPIENT
  ========================================================= */

  if (
    applicationType === "Message / Report" &&
    !messageRecipient
  ) {
    setApplicationMessage(
      "Please select who you want to send the message/report to."
    );
    return;
  }

  try {
    const recipientRoleMap = {
      "Fees Request": "Admin",

      "TR Request": "ExaminationController",

      "Principal Signature": "Principal",
      "Tabulator Signature": "Tabulator",
      "Bonafide": "Principal",
      "Other Document": "Principal",

      "Leave Request": "HOD",

      "Library Card": "Library",
      "Library No Dues": "Library",

      "Examination Inquiry":
        "ExaminationController",

      "Examination Report":
        "ExaminationController",

      "Exam Form": "Department",
      "Registration Form": "Department",
      "Admit Card Request": "Department",

      "Mess No Dues": "MessCanteen",

      "Bus Reservation": "Transport",
    };

    let recipientRole =
      recipientRoleMap[applicationType] || "Admin";

    /* =========================================================
   MESSAGE / REPORT
   ========================================================= */

   if (applicationType === "Message / Report") {
   recipientRole = messageRecipient;
   }

/* =========================================================
   FORM DATA
========================================================= */

const formData = new FormData();

formData.append(
  "applicationType",
  applicationType
);

formData.append(
  "reason",
  reason
);

formData.append(
  "recipientRole",
  recipientRole
);

/* =========================================================
   ADMIT CARD REQUEST
========================================================= */

if (applicationType === "Admit Card Request") {
  formData.append(
    "examApplication",
    selectedExamApplication
  );
}

/* =========================================================
   PRINCIPAL SIGNATURE DOCUMENT
========================================================= */


if (
  (
    applicationType === "Principal Signature" ||
    applicationType === "Tabulator Signature"
  ) &&
  applicationDocument
) {
  formData.append(
    "document",
    applicationDocument
  );
}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

const response = await apiFetch(
  "/applications",
  {
    method: "POST",
    body: formData,
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
setReason("");
setSelectedExamApplication("");
setApplicationDocument(null);
setMessageRecipient("");
setMessageSubject("");

await loadAllStudentApplications();

} catch (error) {
  console.error(error);

  setApplicationMessage(
    error.message ||
      "Server se connect nahi ho pa raha."
  );
}
}

  /* =========================================================
     LOAD MY APPLICATIONS
  ========================================================= */

  async function loadMyApplications() {
    if (!user?.studentId) return;

    try {
      const response = await apiFetch(
        `/applications/student/${user.studentId}`
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setMyApplications(data);
      } else {
        setMyApplications([]);
      }
    } catch (error) {
      console.error(
        "My applications:",
        error
      );
      setMyApplications([]);
    }
  }

  /* =========================================================
     LOAD EXAM APPLICATIONS
  ========================================================= */

  async function loadMyExamApplications() {
    try {
      const response = await apiFetch(
        "/exam-applications/my"
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setMyExamApplications(data);
      } else {
        setMyExamApplications([]);
      }
    } catch (error) {
      console.error(
        "My exam applications:",
        error
      );
      setMyExamApplications([]);
    }
  }

  /* =========================================================
     LOAD REGISTRATION APPLICATIONS
  ========================================================= */

  async function loadMyRegistrationApplications() {
    try {
      const response = await apiFetch(
        "/registration-applications/my"
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setMyRegistrationApplications(data);
      } else {
        setMyRegistrationApplications([]);
      }
    } catch (error) {
      console.error(
        "My registration applications:",
        error
      );

      setMyRegistrationApplications([]);
    }
  }

  /* =========================================================
     LOAD DOCUMENT REQUESTS
  ========================================================= */

  async function loadMyDocumentRequests() {
    try {
      const response = await apiFetch(
        "/document-requests/my"
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setMyDocumentRequests(data);
      } else {
        setMyDocumentRequests([]);
      }
    } catch (error) {
      console.error(
        "My document requests:",
        error
      );

      setMyDocumentRequests([]);
    }
  }

  /* =========================================================
     LOAD ALL STUDENT SERVICES
  ========================================================= */

  async function loadAllStudentApplications() {
    await Promise.all([
      loadMyApplications(),
      loadMyExamApplications(),
      loadMyRegistrationApplications(),
      loadMyDocumentRequests(),
    ]);
  }

  /* =========================================================
     LOAD APPLICATIONS
  ========================================================= */

  async function loadApplications() {
    try {
      const response = await apiFetch(
        "/applications"
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setApplications(data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error(
        "Applications:",
        error
      );
      setApplications([]);
    }
  }

  /* =========================================================
     UPDATE APPLICATION
  ========================================================= */

  async function updateApplicationStatus(
    id,
    status
  ) {
    try {
      const endpoint =
        status === "Approved"
          ? `/applications/${id}/approve`
          : `/applications/${id}/reject`;

      const response = await apiFetch(
        endpoint,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remarks: `${status} by ${user.role}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Status update failed."
        );
        return;
      }

      await loadApplications();
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     DELETE APPLICATION
  ========================================================= */

  async function deleteApplication(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    try {
      const response = await apiFetch(
        `/applications/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Delete failed."
        );
        return;
      }

      await loadApplications();
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     CONTROLLER USERS
  ========================================================= */

  async function loadControllerUsers() {
    try {
      const response = await apiFetch(
        "/controller/users"
      );

      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        setControllerUsers(data);
      } else {
        setControllerUsers([]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* =========================================================
     REGISTRATION SETTING
  ========================================================= */

  async function loadRegistrationStatus() {
    try {
      const response = await apiFetch(
        "/controller/registration-status"
      );

      const data = await response.json();

      if (response.ok) {
        setRegistrationAllowed(
          data.registrationAllowed
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleRegistration() {
    try {
      const newValue =
        !registrationAllowed;

      const response = await apiFetch(
        "/controller/registration-status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            registrationAllowed: newValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Registration setting update failed."
        );
        return;
      }

      setRegistrationAllowed(
        data.registrationAllowed
      );
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     CREATE ROLE USER
  ========================================================= */

  async function createRoleUser(e) {
    e.preventDefault();

    setControllerMessage("");

    try {
      const body = {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newRole,
        userType: newUserType,
        department: newUserDepartment,
      };

      if (newRole === "Student") {
        body.studentId =
          newUserStudentId;
      }

      const response = await apiFetch(
        "/controller/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setControllerMessage(
          data.message ||
            "User creation failed."
        );
        return;
      }

      setControllerMessage(
        "User created successfully."
      );

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserStudentId("");
      setNewUserDepartment("");

      await loadControllerUsers();
    } catch (error) {
      setControllerMessage(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     USER ACCESS
  ========================================================= */

  async function changeUserAccess(
    id,
    isActive
  ) {
    try {
      const response = await apiFetch(
        `/controller/users/${id}/access`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Access update failed."
        );
        return;
      }

      await loadControllerUsers();
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     DEPARTMENT WORKFLOW
  ========================================================= */

  async function loadDepartmentApplications() {
    if (user?.role !== "Department") return;

    setDepartmentLoading(true);

    try {
      const [
        applicationsResponse,
        examResponse,
        registrationResponse,
      ] = await Promise.all([
        apiFetch("/applications"),
        apiFetch("/exam-applications"),
        apiFetch(
          "/registration-applications"
        ),
      ]);

      const applicationsData =
        await applicationsResponse.json();

      const examData =
        await examResponse.json();

      const registrationData =
        await registrationResponse.json();

      const generalRequests =
        applicationsResponse.ok &&
        Array.isArray(applicationsData)
          ? applicationsData
              .filter(
                (item) =>
                  item.recipientRole ===
                  "Department"
              )
              .map((item) => ({
                ...item,
                workflowType: "general",
                displayType:
                  item.applicationType ||
                  "Application",
                displayReason:
                  item.applicationType ===
                    "Admit Card Request" &&
                  item.examApplication
                    ? `${
                        item.examApplication
                          .examName ||
                        "Exam"
                      } - Semester ${
                        item.examApplication
                          .semester || "-"
                      } - ${
                        item.examApplication
                          .session || "-"
                      }`
                    : item.reason || "-",
              }))
          : [];

      const examRequests =
        examResponse.ok &&
        Array.isArray(examData)
          ? examData.map((item) => ({
              ...item,
              workflowType: "exam",
              displayType:
                "Exam Form",
              displayReason:
                item.examName ||
                `Semester ${
                  item.semester || "-"
                }`,
            }))
          : [];

      const registrationRequests =
        registrationResponse.ok &&
        Array.isArray(
          registrationData
        )
          ? registrationData.map(
              (item) => ({
                ...item,
                workflowType:
                  "registration",
                displayType:
                  "Registration Form",
                displayReason:
                  item.details ||
                  `${
                    item.course || ""
                  } - Semester ${
                    item.semester ||
                    ""
                  }`.trim() ||
                  "Online Registration Form",
              })
            )
          : [];

      const combined = [
        ...generalRequests,
        ...examRequests,
        ...registrationRequests,
      ].sort(
        (a, b) =>
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      );

      setDepartmentRequests(
        combined
      );
    } catch (error) {
      console.error(
        "Department applications:",
        error
      );

      setDepartmentRequests([]);
    } finally {
      setDepartmentLoading(false);
    }
  }

  /* =========================================================
     DEPARTMENT STATUS
  ========================================================= */

  async function updateDepartmentRequest(
    item,
    status
  ) {
    try {
      let response;

      if (
        item.workflowType ===
        "exam"
      ) {
        response = await apiFetch(
          `/exam-applications/${item._id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status,
              departmentRemark:
                `${status} by Department`,
            }),
          }
        );
      } else if (
        item.workflowType ===
        "registration"
      ) {
        response = await apiFetch(
          `/registration-applications/${item._id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status,
              departmentRemark:
                `${status} by Department`,
            }),
          }
        );
      } else {
        const endpoint =
          status === "Approved"
            ? `/applications/${item._id}/approve`
            : `/applications/${item._id}/reject`;

        response = await apiFetch(
          endpoint,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              remarks:
                `${status} by Department`,
            }),
          }
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Status update failed."
        );
        return;
      }

      await loadDepartmentApplications();

      await loadApplications();

      alert(
        status === "Approved"
          ? "Application approved successfully."
          : "Application rejected successfully."
      );
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     SELECT ADMIT CARD
  ========================================================= */

  function handleAdmitCardFileChange(
    applicationId,
    file
  ) {
    if (!file) {
      setAdmitCardFiles(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[
            applicationId
          ];

          return updated;
        }
      );

      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Only PDF, JPG or PNG admit card is allowed."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Admit card file size must be maximum 5MB."
      );

      return;
    }

    setAdmitCardFiles(
      (previous) => ({
        ...previous,
        [applicationId]:
          file,
      })
    );
  }

  /* =========================================================
     SEND ADMIT CARD
  ========================================================= */

  async function sendAdmitCard(
    application
  ) {
    const file =
      admitCardFiles[
        application._id
      ];

    if (!file) {
      alert(
        "Please select an admit card file first."
      );
      return;
    }

    if (
      application.status !==
      "Approved"
    ) {
      alert(
        "Admit card can only be sent after the exam form is approved."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Send admit card to ${application.studentName}?`
      );

    if (!confirmed) return;

    setUploadingAdmitCardId(
      application._id
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "admitCard",
        file
      );

      const response =
        await apiFetch(
          `/exam-applications/${application._id}/admit-card`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Admit card upload failed."
        );
        return;
      }

      alert(
        "Admit card sent to the student successfully!"
      );

      setAdmitCardFiles(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[
            application._id
          ];

          return updated;
        }
      );

      await loadDepartmentApplications();
    } catch (error) {
      alert(
        error.message ||
          "Server se connect nahi ho pa raha."
      );
    } finally {
      setUploadingAdmitCardId(
        null
      );
    }
  }

  /* =========================================================
     VIEW / DOWNLOAD ADMIT CARD
  ========================================================= */

  async function viewAdmitCard(
    examApplicationId,
    fileName = "admit-card"
  ) {
    try {
      const response =
        await apiFetch(
          `/exam-applications/${examApplicationId}/admit-card`
        );

      if (!response.ok) {
        let message =
          "Admit card open nahi ho pa raha.";

        try {
          const data =
            await response.json();

          message =
            data.message ||
            message;
        } catch {
          // Ignore JSON parsing error.
        }

        alert(message);
        return;
      }

      const blob =
        await response.blob();

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const newWindow =
        window.open(
          blobUrl,
          "_blank"
        );

      if (!newWindow) {
        const link =
          document.createElement(
            "a"
          );

        link.href = blobUrl;

        link.download =
          fileName ||
          "admit-card";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 60000);
    } catch (error) {
      console.error(
        "View admit card:",
        error
      );

      alert(
        error.message ||
          "Admit card open nahi ho pa raha."
      );
    }
  }

  /* =========================================================
     INITIAL LOGIN
  ========================================================= */

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "smartCampusUser"
      );

    const token =
      localStorage.getItem(
        "smartCampusToken"
      );

    if (
      savedUser &&
      token
    ) {
      try {
        setUser(
          JSON.parse(
            savedUser
          )
        );
      } catch {
        localStorage.removeItem(
          "smartCampusUser"
        );

        localStorage.removeItem(
          "smartCampusToken"
        );
      }
    }
  }, []);

  /* =========================================================
     LOAD DATA AFTER LOGIN
  ========================================================= */

  useEffect(() => {
    if (!user) return;

    if (
      user.role ===
      "Student"
    ) {
      loadAllStudentApplications();
    }

    if (
      user.role === "Admin" ||
      user.role === "AppController" ||
      user.role === "Principal" ||
      user.role === "HOD" ||
      user.role === "Library" ||
      user.role ===
        "ExaminationController" ||
      user.role === "Tabulator" ||
      user.role ===
        "MessCanteen" ||
      user.role ===
        "Transport" ||
      user.role ===
        "Department"
    ) {
      loadApplications();
    }

    if (
      user.role ===
      "AppController"
    ) {
      loadControllerUsers();
      loadRegistrationStatus();
    }

    if (
      user.role ===
      "Department"
    ) {
      loadDepartmentApplications();
    }
  }, [user]);

  /* =========================================================
     REFRESH STUDENT STATUS
  ========================================================= */

  useEffect(() => {
    if (
      user?.role ===
        "Student" &&
      page ===
        "my-applications"
    ) {
      loadAllStudentApplications();
    }
  }, [page, user]);

  /* =========================================================
     REFRESH DEPARTMENT
  ========================================================= */

  useEffect(() => {
    if (
      user?.role ===
        "Department" &&
      page ===
        "department-workflow"
    ) {
      loadDepartmentApplications();
    }
  }, [page, user]);

  
/* =========================================================
   LOGIN / REGISTER PAGE
========================================================= */

if (!user) {
  return (
    
<div className="auth-page">

  {/* UNIVERSITY HEADER */}
  <header className="university-header">
    <div className="university-brand">
      <img
        src="/rcu-logo.png"
        alt="RCU University Logo"
        className="university-logo"
      />

      <div className="university-title">
        <h1>RAMCHANDRA CHANDRAVANSI UNIVERSITY</h1>
        <p>Nawadihkala, Bishrampur, Palamu, Jharkhand</p>
      </div>
    </div>

    {/* MOVING COLLEGE NAMES */}
    <div className="college-marquee">
      <div className="college-marquee-track">
        <div className="college-marquee-group">
          <span>Ramchandra Chandravansi Institute of Technology</span>
          <span>Sohari Chandravansi Nursing School</span>
          <span>Laxmi Chandravansi Medical College and Hospital</span>
          <span>Ramchandra Chandravansi College of Physical Education</span>
          <span>Sahadev Chandravansi B.Ed. College</span>
          <span>Shiveshar Chandravansi Degree College</span>
          <span>Tetri Chandravansi College of Education</span>
          <span>Tetri Chandravansi Pharmacy College</span>
          <span>Bhola Chandravansi College of Science</span>
          <span>Ramchandra Chandravansi Polytechnic Institute</span>
          <span>Laxmi Chandravansi Homoeopathic Medical College</span>
          <span>Lakshmi Chandravansi Degree Mahila College</span>
        </div>

        <div className="college-marquee-group" aria-hidden="true">
          <span>Ramchandra Chandravansi Institute of Technology</span>
          <span>Sohari Chandravansi Nursing School</span>
          <span>Laxmi Chandravansi Medical College and Hospital</span>
          <span>Ramchandra Chandravansi College of Physical Education</span>
          <span>Sahadev Chandravansi B.Ed. College</span>
          <span>Shiveshar Chandravansi Degree College</span>
          <span>Tetri Chandravansi College of Education</span>
          <span>Tetri Chandravansi Pharmacy College</span>
          <span>Bhola Chandravansi College of Science</span>
          <span>Ramchandra Chandravansi Polytechnic Institute</span>
          <span>Laxmi Chandravansi Homoeopathic Medical College</span>
          <span>Lakshmi Chandravansi Degree Mahila College</span>
        </div>
      </div>
    </div>
  </header>

  {/* YOUR EXISTING AUTH CARD STARTS HERE */}

  
  <div className="auth-main">

  {/* LEFT IMAGE - TOP TO BOTTOM */}
  <div className="auth-side-image left-image">
    <img
      src="/1.png"
      alt="SmartCampus University"
    />
  </div>

  {/* CENTER LOGIN / REGISTER FORM */}
  <div className="auth-card">

        <h1>🎓 SmartCampus</h1>

        <p>
          College Management &amp; Application System
        </p>

        {!showRegister ? (
          <>
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">
              Login to access your SmartCampus account.
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) =>
                    setLoginEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) =>
                    setLoginPassword(e.target.value)
                  }
                  required
                />
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {loginMessage && (
              <div className="alert alert-error">
                {loginMessage}
              </div>
            )}

            <div className="auth-switch">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
              >
                Create a new account
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Create Your Account</h2>
            <p className="auth-subtitle">
              Register to get started with SmartCampus.
            </p>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={registerName}
                  onChange={(e) =>
                    setRegisterName(e.target.value)
                  }
                  required
                />
              </div>

              {registerRole === "Student" && (
                <div className="form-group">
                  <label>Student ID / Roll Number</label>
                  <input
                    type="text"
                    placeholder="Enter your Student ID"
                    value={registerStudentId}
                    onChange={(e) =>
                      setRegisterStudentId(e.target.value)
                    }
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={registerEmail}
                  onChange={(e) =>
                    setRegisterEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(e) =>
                    setRegisterPassword(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Role</label>
                <select
                  value={registerRole}
                  onChange={(e) =>
                    setRegisterRole(e.target.value)
                  }
                >
                  <option value="Student">Student</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>User Type</label>
                <select
                  value={registerUserType}
                  onChange={(e) =>
                    setRegisterUserType(e.target.value)
                  }
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  placeholder="CSE / ECE / etc."
                  value={registerDepartment}
                  onChange={(e) =>
                    setRegisterDepartment(e.target.value)
                  }
                />
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>

            {registerMessage && (
              <div className="alert alert-info">
                {registerMessage}
              </div>
            )}

            <div className="auth-switch">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setShowRegister(false)}
              >
                Login
              </button>
            </div>
          </>
        )}
        
      </div>

        {/* RIGHT IMAGE - BOTTOM TO TOP */}
  <div className="auth-side-image right-image">
    <img
      src="/login-right.jpg"
      alt="SmartCampus Campus"
    />
  </div>

</div>

      {/* SMARTCAMPUS FOOTER */}
      <footer className="auth-footer">
        <div className="auth-footer-content">
          <div className="auth-footer-brand">
            <h3>SmartCampus</h3>
            <p>
              Ramchandra Chandravansi Institute of Technology
            </p>
            <p className="auth-footer-tagline">
              One Campus. One Platform. Smarter Education.
            </p>
          </div>

          <div className="auth-footer-links">
            <h4>Quick Links</h4>
            <span>Student Services</span>
            <span>Academic Information</span>
            <span>Digital Campus</span>
          </div>

          <div className="auth-footer-contact">
            <h4>Campus Portal</h4>
            <p>Learning • Services • Connectivity</p>
            <p>Built for a smarter campus experience.</p>
          </div>
        </div>

        <div className="auth-footer-bottom">
          <p>
            © {new Date().getFullYear()} SmartCampus. All rights reserved.
          </p>
          <p>Ramchandra Chandravansi University</p>
        </div>
      </footer>
    </div>
  );
}



  /* =========================================================
     DASHBOARD DATA
  ========================================================= */

  const totalApplications =
    applications.length;

  const pendingApplications =
    applications.filter(
      (item) =>
        item.status ===
        "Pending"
    ).length;

  const approvedApplications =
    applications.filter(
      (item) =>
        item.status ===
        "Approved"
    ).length;

  const rejectedApplications =
    applications.filter(
      (item) =>
        item.status ===
        "Rejected"
    ).length;

  /* =========================================================
     ALL STUDENT APPLICATIONS
  ========================================================= */

  function getAllStudentApplications() {
    return [
      ...myApplications.map(
        (item) => ({
          id: `application-${item._id}`,

          type:
            item.applicationType,

          reason:
            item.applicationType ===
              "Admit Card Request" &&
            item.examApplication
              ? `${
                  item.examApplication
                    .examName ||
                  "Exam"
                } - Semester ${
                  item.examApplication
                    .semester || "-"
                } - ${
                  item.examApplication
                    .session || "-"
                }`
              : item.reason || "-",

          recipient:
            item.recipientRole || "-",

          status:
            item.status,

          createdAt:
            item.createdAt,

          examApplicationId:
            item.examApplication?._id ||
            null,

          admitCard:
            item.examApplication
              ?.admitCard ||
            null,

          signedDocument:
            item.signedDocument || null,
        })
      ),

      ...myExamApplications.map(
        (item) => ({
          id: `exam-${item._id}`,

          type: "Exam Form",

          reason:
            item.examName ||
            "Online Exam Form",

          recipient:
            "Department",

          status:
            item.status,

          createdAt:
            item.createdAt,

          examApplicationId:
            item._id,

          admitCard:
            item.admitCard ||
            null,
        })
      ),

      ...myRegistrationApplications.map(
        (item) => ({
          id: `registration-${item._id}`,

          type:
            "Registration Form",

          reason:
            item.details ||
            `${
              item.course || ""
            } - Semester ${
              item.semester || ""
            }`.trim() ||
            "Online Registration Form",

          recipient:
            "Department",

          status:
            item.status,

          createdAt:
            item.createdAt,
        })
      ),

      ...myDocumentRequests.map(
        (item) => ({
          id: `document-${item._id}`,

          type:
            `${
              item.requestType ||
              "Document"
            } Request`,

          reason:
            item.reason ||
            "Document request",

          recipient:
            item.recipientRole ||
            "-",

          status:
            item.status,

          createdAt:
            item.createdAt,
        })
      ),
    ].sort(
      (a, b) =>
        new Date(
          b.createdAt || 0
        ) -
        new Date(
          a.createdAt || 0
        )
    );
  }

  /* =========================================================
     MAIN DASHBOARD
  ========================================================= */

  return (
    <div className="app">
      <div className="dashboard">
        <header className="topbar">
          <div className="brand">
            🎓SmartCampus
          </div>

          <div className="user-info">
            <span>{user.name}</span>

            <span className="user-role">
              {user.role}
            </span>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-layout">
          {/* SIDEBAR */}

          <aside className="sidebar">
            <div className="sidebar-title">
             🏡 Dashboard
            </div>

            <button
              className={
                page ===
                "dashboard"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage("dashboard")
              }
            >
              Dashboard
            </button>

            {/* STUDENT */}

            {user.role ===
              "Student" && (
              <>
                <div className="sidebar-title">
                  Student
                </div>

                <button
  className={page === "combined-tr" ? "active" : ""}
  onClick={() => setPage("combined-tr")}
>
 📣 Notices & Documents
</button>

                <button
                  className={
                    page ===
                    "request"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage("request")
                  }
                >
                 📝 Request Application
                </button>

                <button
                  className={
                    page ===
                    "my-applications"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      "my-applications"
                    )
                  }
                >
                 📄 My Applications
                </button>

                <button
  className={page === "tr-download" ? "active" : ""}
  onClick={() => setPage("tr-download")}
>
 ⬇️ Download My TR
</button>




              </>
            )}

            
            {/* TABULATOR */}

            {user.role === "Tabulator" && (
              <>
                <div className="sidebar-title">
                  Tabulator
                </div>

                <button
                  className={
                    page === "tr-upload"
                      ? "active"
                      : ""
                  }
                  onClick={() => setPage("tr-upload")}
                >
                  📤 TR Upload
                </button>
              </>
            )}


            {/* APP CONTROLLER */}

            {user.role ===
              "AppController" && (
              <>
                <div className="sidebar-title">
                  Controller
                </div>

                <button
                  className={
                    page ===
                    "controller"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      "controller"
                    )
                  }
                >
                  🕒 User & Access Control
                </button>
              </>
            )}

            {/* DEPARTMENT */}

            {user.role ===
              "Department" && (
              <>
                <div className="sidebar-title">
                  Department
                </div>

                <button
                  className={
                    page ===
                    "department-workflow"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      "department-workflow"
                    )
                  }
                >
                  Department Workflow
                </button>

                <button
                  className={
                    page ===
                    "applications"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      "applications"
                    )
                  }
                >
                  Applications
                </button>
              </>
            )}

            {/* OTHER STAFF */}

            {user.role !==
              "Student" &&
              user.role !==
                "AppController" &&
              user.role !==
                "Department" && (
                <>
                  <div className="sidebar-title">
                    Applications
                  </div>

                  <button
                    className={
                      page ===
                      "applications"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPage(
                        "applications"
                      )
                    }
                  >
                    Applications
                  </button>
                </>
              )}

            {/* PDF SIGNATURES */}
            {[
              "AppController",
              "Principal",
              "ExaminationController",
              "Tabulator",
            ].includes(user.role) && (
              <>
                <div className="sidebar-title">
                  Documents
                </div>
                <button
                  className={page === "pdf-signatures" ? "active" : ""}
                  onClick={() => {
  console.log("PDF Signatures button clicked");
  console.log("User role:", user.role);
  setPage("pdf-signatures");
}}
                >
                  PDF Signatures
                </button>
              </>
            )}
          </aside>

          {/* MAIN */}

          <main className="main-content">
            
            {/* DASHBOARD */}

            {page ==="dashboard" && (
              <>
                
<div className="welcome-banner">
  {bannerImages.map((src, i) => (
    <img
      key={src}
      className={i === slide ? "banner-img active" : "banner-img"}
      src={src}
      alt="RCIT campus"
    />
  ))}

  <div className="banner-overlay"></div>

  <div className="welcome-text">
    <p className="hello">Welcome back!</p>
    <h2>{user.name}</h2>
    <p>Your SmartCampus dashboard is ready.</p>
    <p className="meta">Role: {user.role}</p>
  </div>
</div>


{/* DASHBOARD STATISTICS */}
<div className="dashboard-stats-container">
  <div className="dashboard-stats-heading">
    <div>
      <h2>Campus Overview</h2>
      <p>Explore your campus at a glance</p>
    </div>
  </div>

  <div className="dashboard-stats-grid">
    <div className="dashboard-stat-card students-stat">
      <div className="dashboard-stat-icon">🎓</div>
      <p>Total Students</p>
      <h3>7,400+</h3>
      <span>Registered students</span>
    </div>

    <div className="dashboard-stat-card applications-stat">
      <div className="dashboard-stat-icon">📄</div>
      <p>Applications (This Month)</p>
      <h3>50+</h3>
      <span>Submitted this month</span>
    </div>

    <div className="dashboard-stat-card colleges-stat">
      <div className="dashboard-stat-icon">🏛️</div>
      <p>Total Colleges</p>
      <h3>12</h3>
      <span>Colleges in the university group</span>
    </div>

    <div className="dashboard-stat-card courses-stat">
      <div className="dashboard-stat-icon">📚</div>
      <p>Total Courses</p>
      <h3>58</h3>
      <span>Available courses</span>
    </div>
  </div>
  
  {/* LIVE CALENDAR & WEATHER */}
<CampusCalendarWeather />

</div>



                {user.role ===
                "Student" ? (
                  <>
                    {(() => {
                      const allStudentApplications =
                        getAllStudentApplications();

                      const pendingCount =
                        allStudentApplications.filter(
                          (item) =>
                            item.status ===
                            "Pending"
                        ).length;

                      const approvedCount =
                        allStudentApplications.filter(
                          (item) =>
                            item.status ===
                            "Approved"
                        ).length;

                      const rejectedCount =
                        allStudentApplications.filter(
                          (item) =>
                            item.status ===
                            "Rejected"
                        ).length;

                        
                      return (
                        <div className="cards-grid">
                          <div className="stat-card">
                            <h3>
                              My Applications
                            </h3>

                            <strong>
                              {
                                allStudentApplications.length
                              }
                            </strong>
                          </div>

                          <div className="stat-card">
                            <h3>
                              Pending
                            </h3>

                            <strong>
                              {
                                pendingCount
                              }
                            </strong>
                          </div>

                          <div className="stat-card">
                            <h3>
                              Approved
                            </h3>

                            <strong>
                              {
                                approvedCount
                              }
                            </strong>
                          </div>

                          <div className="stat-card">
                            <h3>
                              Rejected
                            </h3>

                            <strong>
                              {
                                rejectedCount
                              }
                            </strong>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="role-grid">
                      <div
                        className="role-card"
                        onClick={() =>
                          setPage(
                            "services"
                          )
                        }
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >
                        <h3>
                          Student Services
                        </h3>

                        <p>
                          Access online
                          applications,
                          exam services,
                          registration
                          forms and
                          document
                          requests.
                        </p>
                      </div>
                    </div>
                  </>
                ) : user.role ===
                  "Department" ? (
                  <>
                    <div className="cards-grid">
                      <div className="stat-card">
                        <h3>
                          Department Requests
                        </h3>

                        <strong>
                          {
                            departmentRequests.length
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Pending
                        </h3>

                        <strong>
                          {
                            departmentRequests.filter(
                              (item) =>
                                item.status ===
                                "Pending"
                            ).length
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Approved
                        </h3>

                        <strong>
                          {
                            departmentRequests.filter(
                              (item) =>
                                item.status ===
                                "Approved"
                            ).length
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Rejected
                        </h3>

                        <strong>
                          {
                            departmentRequests.filter(
                              (item) =>
                                item.status ===
                                "Rejected"
                            ).length
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="content-card">
                      <h3>
                        Department Panel
                      </h3>

                      <p>
                        Exam forms,
                        registration
                        forms and
                        Department
                        applications
                        can be reviewed
                        from Department
                        Workflow.
                      </p>

                      <button
                        className="primary-btn"
                        onClick={() =>
                          setPage(
                            "department-workflow"
                          )
                        }
                      >
                        Open Department
                        Workflow
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cards-grid">
                      <div className="stat-card">
                        <h3>
                          Total Applications
                        </h3>

                        <strong>
                          {
                            totalApplications
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Pending
                        </h3>

                        <strong>
                          {
                            pendingApplications
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Approved
                        </h3>

                        <strong>
                          {
                            approvedApplications
                          }
                        </strong>
                      </div>

                      <div className="stat-card">
                        <h3>
                          Rejected
                        </h3>

                        <strong>
                          {
                            rejectedApplications
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="content-card">
                      <h3>
                        {user.role} Panel
                      </h3>

                      <p>
                        Applications
                        assigned to your
                        role can be
                        managed from
                        the Applications
                        section.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {page === "tr-download" && user.role === "Student" && (
  <TRDownloadPanel token={localStorage.getItem("smartCampusToken")} />
)}

{page === "combined-tr" && user.role === "Student" && (
  <CombinedTRPanel
    token={localStorage.getItem("smartCampusToken")}
  />
)}

              {page === "tr-upload" && user.role === "Tabulator" && (
  <TRUploadPanel token={localStorage.getItem("smartCampusToken")} />
)}

            {/* STUDENT REQUEST */}

{page === "request" &&
  user.role ===
    "Student" && (
    <StudentRequestPage
      myExamApplications={
        myExamApplications
      }
      applicationType={
        applicationType
      }
      setApplicationType={
        setApplicationType
      }
      selectedExamApplication={
        selectedExamApplication
      }
      setSelectedExamApplication={
        setSelectedExamApplication
      }
      reason={reason}
      setReason={setReason}
      applicationDocument={applicationDocument}
setApplicationDocument={setApplicationDocument}
      handleApplicationSubmit={
        handleApplicationSubmit
      }
      applicationMessage={
        applicationMessage
      }
      setApplicationMessage={
        setApplicationMessage
      }

      /* MESSAGE / REPORT */
      messageRecipient={
        messageRecipient
      }
      setMessageRecipient={
        setMessageRecipient
      }
    />
  )}

{/* MY APPLICATIONS */}

{page ===
  "my-applications" &&
  user.role ===
    "Student" && (
    <MyApplicationsPage
      getAllStudentApplications={
        getAllStudentApplications
      }
      viewAdmitCard={
        viewAdmitCard
      }
    />
  )}

{/* PRINCIPAL APPLICATIONS */}

{page === "principal-applications" &&
  user.role === "Principal" && (
    <ApplicationTable
      applications={applications}
      user={user}
      updateApplicationStatus={updateApplicationStatus}
      deleteApplication={deleteApplication}
    />
  )}

            {/* STUDENT SERVICES */}

            {page === "services" &&
              user.role ===
                "Student" && (
                <StudentServices
                  user={user}
                  setPage={setPage}
                />
              )}

            {/* CONTROLLER */}

            {page === "controller" &&
              user.role ===
                "AppController" && (
                <ControllerPage
                  registrationAllowed={
                    registrationAllowed
                  }
                  toggleRegistration={
                    toggleRegistration
                  }
                  newUserName={
                    newUserName
                  }
                  setNewUserName={
                    setNewUserName
                  }
                  newUserEmail={
                    newUserEmail
                  }
                  setNewUserEmail={
                    setNewUserEmail
                  }
                  newUserPassword={
                    newUserPassword
                  }
                  setNewUserPassword={
                    setNewUserPassword
                  }
                  newRole={newRole}
                  setNewRole={
                    setNewRole
                  }
                  newUserStudentId={
                    newUserStudentId
                  }
                  setNewUserStudentId={
                    setNewUserStudentId
                  }
                  newUserType={
                    newUserType
                  }
                  setNewUserType={
                    setNewUserType
                  }
                  newUserDepartment={
                    newUserDepartment
                  }
                  setNewUserDepartment={
                    setNewUserDepartment
                  }
                  createRoleUser={
                    createRoleUser
                  }
                  controllerMessage={
                    controllerMessage
                  }
                  controllerUsers={
                    controllerUsers
                  }
                  changeUserAccess={
                    changeUserAccess
                  }
                />
              )}

            {/* DEPARTMENT WORKFLOW */}

            {page ===
              "department-workflow" &&
              user.role ===
                "Department" && (
                <DepartmentWorkflowPage
                  departmentRequests={
                    departmentRequests
                  }
                  departmentLoading={
                    departmentLoading
                  }
                  loadDepartmentApplications={
                    loadDepartmentApplications
                  }
                  updateDepartmentRequest={
                    updateDepartmentRequest
                  }
                  admitCardFiles={
                    admitCardFiles
                  }
                  handleAdmitCardFileChange={
                    handleAdmitCardFileChange
                  }
                  sendAdmitCard={
                    sendAdmitCard
                  }
                  uploadingAdmitCardId={
                    uploadingAdmitCardId
                  }
                  viewAdmitCard={
                    viewAdmitCard
                  }
                />
              )}

            {/* PDF SIGNATURES */}
            {page === "pdf-signatures" && [
              "AppController",
              "Principal",
              "ExaminationController",
              "Tabulator",
            ].includes(user.role) && (
              <PdfSignaturePanel
                applications={applications}
                user={user}
                apiFetch={apiFetch}
                onRefresh={loadApplications}
              />
            )}

            {/* APPLICATIONS */}

            {page ===
              "applications" &&
              user.role !==
                "Student" &&
              user.role !==
                "AppController" && (
                <>
                  <div className="page-title">
                    <h2>
                      Application Management
                    </h2>

                    <p>
                      Review and process
                      applications assigned
                      to {user.role}.
                    </p>
                  </div>

                  <ApplicationTable
                    applications={
                      applications
                    }
                    user={user}
                    updateApplicationStatus={
                      updateApplicationStatus
                    }
                    deleteApplication={
                      deleteApplication
                    }
                  />
                </>
              )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;