require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { PDFDocument } = require("pdf-lib");

const connectDB = require("./config/db");

const User = require("./models/User");
const Student = require("./models/Student");
const Application = require("./models/Application");
const RegistrationSetting = require("./models/RegistrationSetting");
const ExamApplication = require("./models/ExamApplication");
const RegistrationApplication = require("./models/RegistrationApplication");
const DocumentRequest = require("./models/DocumentRequest");
const BusReservation = require("./models/BusReservation");
const PrincipalSignature = require("./models/PrincipalSignature");
const TRRecord = require("./models/TRRecord");
const { parse } = require("csv-parse/sync");
const crypto = require("crypto");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================================================
// UPLOAD DIRECTORIES
// ==================================================

const uploadDirectories = {
  exam: path.join(
    __dirname,
    "uploads",
    "exam-receipts"
  ),

  registration: path.join(
    __dirname,
    "uploads",
    "registration-documents"
  ),

  other: path.join(
    __dirname,
    "uploads",
    "other-documents"
  ),

  admitCard: path.join(
    __dirname,
    "uploads",
    "admit-cards"
  ),

  principalSignature: path.join(
    __dirname,
    "uploads",
    "principal-signature"
  ),

    officerSignatures: path.join(
    __dirname,
    "uploads",
    "officer-signatures"
  ),

  signedDocuments: path.join(
  __dirname,
  "uploads",
  "signed-documents"
),
};

Object.values(uploadDirectories).forEach(
  (directory) => {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, {
        recursive: true,
      });
    }
  }
);



const TR_UPLOAD_DIR = path.join(__dirname, "private-trs");
const TR_TEMP_DIR = path.join(TR_UPLOAD_DIR, "temp");

fs.mkdirSync(TR_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(TR_TEMP_DIR, { recursive: true });

const trUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, TR_TEMP_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 52,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed =
      file.fieldname === "mapping"
        ? [".csv", ".xlsx"]
        : [".pdf"];

    if (allowed.includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Only PDF files and a CSV mapping file are allowed."));
  },
});



// ==================================================
// MAKE UPLOADED FILES ACCESSIBLE
// ==================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ==================================================
// MULTER STORAGE
// ==================================================

function createStorage(directory) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, directory);
    },

    filename: (req, file, cb) => {
      const extension = path.extname(
        file.originalname
      );

      const safeName = path
        .basename(
          file.originalname,
          extension
        )
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "_"
        );

      const uniqueName =
        `${Date.now()}-${safeName}${extension}`;

      cb(null, uniqueName);
    },
  });
}

// ==================================================
// FILE FILTER
// ==================================================

function fileFilter(req, file, cb) {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and PDF files are allowed."
      )
    );
  }
}

// ==================================================
// MULTER UPLOADS
// ==================================================

const examUpload = multer({
  storage: createStorage(
    uploadDirectories.exam
  ),

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const registrationUpload = multer({
  storage: createStorage(
    uploadDirectories.registration
  ),

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const documentUpload = multer({
  storage: createStorage(
    uploadDirectories.other
  ),

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const admitCardUpload = multer({
  storage: createStorage(
    uploadDirectories.admitCard
  ),

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==================================================
// JWT
// ==================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "smartcampus-development-secret-change-this-later";

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
}

// ==================================================
// AUTH MIDDLEWARE
// ==================================================

async function authenticate(
  req,
  res,
  next
) {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been disabled",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (
      !req.user ||
      !roles.includes(req.user.role)
    ) {
      return res.status(403).json({
        message:
          "You do not have permission for this action",
      });
    }

    next();
  };
}

// ==================================================
// BASIC ROUTES
// ==================================================

app.get("/", (req, res) => {
  res.send(
    "Welcome to SmartCampus Backend!"
  );
});

app.get("/services", (req, res) => {
  res.send("SmartCampus Services");
});

// ==================================================
// REGISTRATION SETTINGS HELPER
// ==================================================

async function getRegistrationSetting() {
  let setting =
    await RegistrationSetting.findOne();

  if (!setting) {
    setting =
      await RegistrationSetting.create({
        registrationAllowed: true,
      });
  }

  return setting;
}

// ==================================================
// REGISTER
// ==================================================

app.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        studentId,
        role,
        userType,
        department,
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email and password are required.",
        });
      }

      const setting =
        await getRegistrationSetting();

      if (
        !setting.registrationAllowed
      ) {
        return res.status(403).json({
          message:
            "Registration is currently closed by App Controller.",
        });
      }

      const requestedRole =
        role || "Student";

      if (
        !["Student", "Admin"].includes(
          requestedRole
        )
      ) {
        return res.status(403).json({
          message:
            "This role cannot be created through public registration.",
        });
      }

      if (
        requestedRole === "Student" &&
        !studentId
      ) {
        return res.status(400).json({
          message:
            "Student ID is required for Student registration.",
        });
      }

      const existingUser =
        await User.findOne({
          email: email.toLowerCase(),
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "Email is already registered.",
        });
      }

      if (
        requestedRole === "Student" &&
        studentId
      ) {
        const existingStudent =
          await User.findOne({
            studentId,
          });

        if (existingStudent) {
          return res.status(409).json({
            message:
              "Student ID is already registered.",
          });
        }
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user = new User({
        name,

        email:
          email.toLowerCase(),

        password:
          hashedPassword,

        studentId:
          requestedRole ===
          "Student"
            ? studentId
            : "",

        userType:
          requestedRole ===
          "Student"
            ? "Student"
            : userType || "Staff",

        role: requestedRole,

        department:
          department || "",
      });

      await user.save();

      res.status(201).json({
        message:
          "Registration successful!",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studentId:
            user.studentId,
          role: user.role,
          userType:
            user.userType,
          department:
            user.department,
        },
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Registration failed",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// LOGIN
// ==================================================

app.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const user =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message:
            "Your account has been disabled by App Controller.",
        });
      }

      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          message:
            "Invalid password",
        });
      }

      const token =
        createToken(user);

      res.json({
        message:
          "Login successful!",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studentId:
            user.studentId,
          role: user.role,
          userType:
            user.userType,
          department:
            user.department,
        },
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to login",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// CURRENT USER
// ==================================================

app.get(
  "/me",
  authenticate,
  async (req, res) => {
    res.json({
      user: req.user,
    });
  }
);

// ==================================================
// APP CONTROLLER
// ==================================================

app.get(
  "/controller/users",
  authenticate,
  allowRoles(
    "AppController"
  ),
  async (req, res) => {
    try {
      const users =
        await User.find()
          .select("-password")
          .sort({
            createdAt: -1,
          });

      res.json(users);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch users",
        error:
          error.message,
      });
    }
  }
);

app.get(
  "/controller/registration-status",
  authenticate,
  allowRoles(
    "AppController"
  ),
  async (req, res) => {
    try {
      const setting =
        await getRegistrationSetting();

      res.json(setting);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch registration status",
        error:
          error.message,
      });
    }
  }
);

app.put(
  "/controller/registration-status",
  authenticate,
  allowRoles(
    "AppController"
  ),
  async (req, res) => {
    try {
      const {
        registrationAllowed,
      } = req.body;

      if (
        typeof registrationAllowed !==
        "boolean"
      ) {
        return res.status(400).json({
          message:
            "registrationAllowed must be true or false.",
        });
      }

      let setting =
        await getRegistrationSetting();

      setting.registrationAllowed =
        registrationAllowed;

      setting.updatedBy =
        req.user._id;

      await setting.save();

      res.json({
        message:
          registrationAllowed
            ? "Registration is now allowed."
            : "Registration is now blocked.",

        setting,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update registration status",
        error:
          error.message,
      });
    }
  }
);

app.post(
  "/controller/users",
  authenticate,
  allowRoles(
    "AppController"
  ),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        userType,
        studentId,
        department,
      } = req.body;

      const allowedRoles = [
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

      if (
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          message:
            "Invalid role.",
        });
      }

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email and password are required.",
        });
      }

      const existingUser =
        await User.findOne({
          email:
            email.toLowerCase(),
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "Email is already registered.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user = new User({
        name,

        email:
          email.toLowerCase(),

        password:
          hashedPassword,

        studentId:
          studentId || "",

        userType:
          userType || "Staff",

        role,

        department:
          department || "",
      });

      await user.save();

      res.status(201).json({
        message:
          "User created successfully!",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studentId:
            user.studentId,
          role: user.role,
          userType:
            user.userType,
          department:
            user.department,
          isActive:
            user.isActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to create user",
        error:
          error.message,
      });
    }
  }
);

app.put(
  "/controller/users/:id/access",
  authenticate,
  allowRoles(
    "AppController"
  ),
  async (req, res) => {
    try {
      const {
        isActive,
      } = req.body;

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      user.isActive =
        Boolean(isActive);

      await user.save();

      res.json({
        message:
          user.isActive
            ? "User access enabled."
            : "User access disabled.",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive:
            user.isActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update user access",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENTS
// ==================================================

app.post(
  "/students",
  authenticate,
  allowRoles(
    "Admin",
    "AppController"
  ),
  async (req, res) => {
    try {
      const {
        name,
        studentId,
      } = req.body;

      if (
        !name ||
        !studentId
      ) {
        return res.status(400).json({
          message:
            "Name and Student ID are required.",
        });
      }

      const existingStudent =
        await Student.findOne({
          studentId,
        });

      if (existingStudent) {
        return res.status(409).json({
          message:
            "Student ID already exists.",
        });
      }

      const student =
        new Student({
          name,
          studentId,
        });

      const savedStudent =
        await student.save();

      res.status(201).json({
        message:
          "Student saved successfully!",

        student:
          savedStudent,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to save student",
        error:
          error.message,
      });
    }
  }
);

app.get(
  "/students",
  authenticate,
  allowRoles(
    "Admin",
    "AppController"
  ),
  async (req, res) => {
    try {
      const students =
        await Student.find()
          .sort({
            createdAt: -1,
          });

      res.json(students);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch students",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// GENERAL APPLICATIONS
// ==================================================

function getRecipientRole(
  applicationType,
  requestedRecipientRole = ""
) {
  const routing = {
    "TR Request":
      "ExaminationController",

    "Principal Signature":
      "Principal",

    "Tabulator Signature": "Tabulator",  
    Bonafide:
      "Principal",

    "Other Document":
      "Principal",

    "Leave Request":
      "HOD",

    "Library Card":
      "Library",

    "Library No Dues":
      "Library",

    "Examination Inquiry":
      "ExaminationController",

    "Examination Report":
      "ExaminationController",

    "Exam Form":
      "Department",

    "Registration Form":
      "Department",

    "Admit Card Request":
      "Department",

    "Mess No Dues":
      "MessCanteen",

    "Bus Reservation":
      "Transport",

    "Fees Request":
      "Admin",
  };

  /* ==================================================
     MESSAGE / REPORT
     Student can select the authority
  ================================================== */

  if (
    applicationType ===
    "Message / Report"
  ) {
    const allowedRecipients = [
      "Admin",
      "Principal",
      "HOD",
      "ExaminationController",
      "Library",
      "Department",
      "MessCanteen",
      "Transport",
    ];

    if (
      !allowedRecipients.includes(
        requestedRecipientRole
      )
    ) {
      return null;
    }

    return requestedRecipientRole;
  }

  return (
    routing[applicationType] ||
    null
  );
}

// ==================================================
// SUBMIT GENERAL APPLICATION
// ==================================================

app.post(
  "/applications",
authenticate,
allowRoles(
  "Student",
  "Staff"
),
documentUpload.single("document"),
async (req, res) => {
    try {
      const {
  applicationType,
  reason,
  examApplication,
  recipientRole: requestedRecipientRole,
} = req.body;

      if (
        !applicationType ||
        !reason
      ) {
        return res.status(400).json({
          message:
            "Application Type and Reason are required.",
        });
      }

      const recipientRole =
  getRecipientRole(
    applicationType,
    requestedRecipientRole
  );

      if (!recipientRole) {
        return res.status(400).json({
          message:
            "Invalid application type.",
        });
      }

      // ==================================================
      // ADMIT CARD REQUEST VALIDATION
      // ==================================================

      let linkedExamApplication =
        null;

      if (
        applicationType ===
        "Admit Card Request"
      ) {
        if (!examApplication) {
          return res.status(400).json({
            message:
              "Please select an approved Exam Form for the Admit Card Request.",
          });
        }

        if (
          !mongoose.Types.ObjectId.isValid(
            examApplication
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid Exam Form selected.",
          });
        }

        linkedExamApplication =
          await ExamApplication.findById(
            examApplication
          );

        if (!linkedExamApplication) {
          return res.status(404).json({
            message:
              "Selected Exam Form was not found.",
          });
        }

        // Student can only link
        // his/her own exam form.
        if (
          linkedExamApplication.student.toString() !==
          req.user._id.toString()
        ) {
          return res.status(403).json({
            message:
              "You can only request an admit card for your own Exam Form.",
          });
        }

        // Admit card request is allowed
        // only after Department approves
        // the Exam Form.
        if (
          linkedExamApplication.status !==
          "Approved"
        ) {
          return res.status(400).json({
            message:
              "Admit Card Request can only be submitted after the Exam Form is approved by the Department.",
          });
        }

        // Prevent duplicate active
        // Admit Card Requests.
        const existingRequest =
          await Application.findOne({
            studentId:
              req.user.studentId ||
              "",
            applicationType:
              "Admit Card Request",
            examApplication:
              linkedExamApplication._id,
            status: {
              $in: [
                "Pending",
                "Approved",
              ],
            },
          });

        if (existingRequest) {
          return res.status(409).json({
            message:
              "An Admit Card Request already exists for this Exam Form.",
          });
        }
      }

      const application =
        new Application({
          studentName:
            req.user.name,

          studentId:
            req.user.studentId ||
            "",

          applicationType,

          reason,

          document: req.file
  ? {
      fileName: req.file.originalname,
      filePath: `/uploads/other-documents/${req.file.filename}`,
      fileType: req.file.mimetype,
    }
  : {
      fileName: "",
      filePath: "",
      fileType: "",
    },

          examApplication:
            linkedExamApplication
              ? linkedExamApplication._id
              : null,

          recipientRole,
        });

      const savedApplication =
        await application.save();

      const populatedApplication =
        await Application.findById(
          savedApplication._id
        ).populate(
          "examApplication"
        );

      res.status(201).json({
        message:
          "Application submitted successfully!",

        application:
          populatedApplication,
      });
    } catch (error) {
      console.error(
        "Submit application error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to submit application",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// PDF SIGNATURE ROUTES
// ==================================================

const officerSignatureUpload = multer({
  storage: createStorage(
    uploadDirectories.officerSignatures
  ),
  fileFilter: (req, file, cb) => {
    if (
      ["image/png", "image/jpeg", "image/jpg"].includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error("Signature must be a PNG or JPG image."));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// Set the roles required to sign a particular application.
app.put(
  "/applications/:id/required-signers",
  authenticate,
  async (req, res) => {
    try {
      const application = await Application.findById(
        req.params.id
      );

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      if (
        req.user.role !== "AppController" &&
        req.user.role !== application.recipientRole
      ) {
        return res.status(403).json({
          message: "You cannot configure signers for this application.",
        });
      }

      const allowedSigners = [
        "Tabulator",
        "ExaminationController",
        "Principal",
      ];

      const { requiredSigners } = req.body;

      if (
        !Array.isArray(requiredSigners) ||
        requiredSigners.some(
          (role) => !allowedSigners.includes(role)
        )
      ) {
        return res.status(400).json({
          message: "Please provide valid signer roles.",
        });
      }

      application.requiredSigners = [
        ...new Set(requiredSigners),
      ];

      await application.save();

      res.json({
        message: "Required signers updated successfully.",
        requiredSigners: application.requiredSigners,
      });
    } catch (error) {
      res.status(500).json({
        message: "Could not update required signers.",
        error: error.message,
      });
    }
  }
);

// Upload signature and embed it in the PDF.
app.post(
  "/applications/:id/sign",
  authenticate,
  officerSignatureUpload.single("signature"),
  async (req, res) => {
    try {
      const signerRoles = [
        "Tabulator",
        "ExaminationController",
        "Principal",
      ];

      if (!signerRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: "Your role is not allowed to sign PDFs.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a PNG or JPG signature.",
        });
      }

      const application = await Application.findById(
        req.params.id
      );

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      if (
        !(application.requiredSigners || []).includes(
          req.user.role
        )
      ) {
        return res.status(403).json({
          message: "Your role is not selected as a required signer.",
        });
      }

      if (
        (application.signatures || []).some(
          (item) => item.role === req.user.role
        )
      ) {
        return res.status(409).json({
          message: "Your role has already signed this document.",
        });
      }

      const sourceFilePath =
        application.signedDocument?.filePath ||
        application.document?.filePath;

      if (
        !sourceFilePath ||
        !/\.pdf$/i.test(sourceFilePath)
      ) {
        return res.status(400).json({
          message: "This application does not have a PDF to sign.",
        });
      }

      const relativeSource = sourceFilePath.replace(/^\/+/, "");
      const absoluteSource = path.resolve(
        __dirname,
        relativeSource
      );
      const uploadsRoot =
        path.resolve(__dirname, "uploads") + path.sep;

      if (
        !absoluteSource.startsWith(uploadsRoot) ||
        !fs.existsSync(absoluteSource)
      ) {
        return res.status(404).json({
          message: "Source PDF was not found.",
        });
      }

      const pageNumber = Number(req.body.page || 1);
      const x = Number(req.body.x ?? 10);
      const y = Number(req.body.y ?? 75);
      const width = Number(req.body.width ?? 20);
      const height = Number(req.body.height ?? 8);

      if (
        !Number.isInteger(pageNumber) ||
        pageNumber < 1 ||
        ![x, y, width, height].every(Number.isFinite) ||
        x < 0 || y < 0 ||
        width <= 0 || height <= 0 ||
        x + width > 100 ||
        y + height > 100
      ) {
        return res.status(400).json({
          message: "Invalid page or signature placement values.",
        });
      }

      // Use the latest signed PDF to preserve earlier signatures.
      const pdfBytes = fs.readFileSync(absoluteSource);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      if (pageNumber > pages.length) {
        return res.status(400).json({
          message: "Selected page does not exist.",
        });
      }

      const page = pages[pageNumber - 1];
      const pageSize = page.getSize();

      const imageBytes = fs.readFileSync(req.file.path);
      const signatureImage =
        req.file.mimetype === "image/png"
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

      const drawWidth = pageSize.width * width / 100;
      const drawHeight = pageSize.height * height / 100;

      page.drawImage(signatureImage, {
        x: pageSize.width * x / 100,
        y: pageSize.height -
          (pageSize.height * y / 100) -
          drawHeight,
        width: drawWidth,
        height: drawHeight,
      });

      const outputName =
        `signed-${application._id}-${Date.now()}.pdf`;

      const outputPath = path.join(
        uploadDirectories.signedDocuments,
        outputName
      );

      const outputBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, outputBytes);

      application.signatures.push({
        role: req.user.role,
        signedBy: req.user._id,
        signaturePath:
          `/uploads/officer-signatures/${path.basename(req.file.path)}`,
        page: pageNumber,
        x,
        y,
        width,
        height,
        signedAt: new Date(),
      });

      application.signedDocument = {
        fileName: outputName,
        filePath: `/uploads/signed-documents/${outputName}`,
        fileType: "application/pdf",
      };

      await application.save();

      res.json({
        message: "Signature embedded in PDF successfully.",
        signedDocument: application.signedDocument,
        signatures: application.signatures,
      });
    } catch (error) {
      console.error("PDF signing error:", error);

      res.status(500).json({
        message: "Could not sign this PDF.",
        error: error.message,
      });
    }
  }
);

// ==================================================
// GET APPLICATIONS
// ==================================================


app.get(
  "/applications",
  authenticate,
  async (req, res) => {
    try {
      let applications;

      const populateOptions = {
        path: "examApplication",
        select:
          "student studentName studentId examFormNumber examName session semester course status admitCard",
      };

      if (
        req.user.role ===
        "AppController"
      ) {
        applications =
          await Application.find()
            .populate(
              populateOptions
            )
            .sort({
              createdAt: -1,
            });
      } else if (
        req.user.role ===
        "Admin"
      ) {
        applications =
          await Application.find({
            recipientRole:
              "Admin",
          })
            .populate(
              populateOptions
            )
            .sort({
              createdAt: -1,
            });
      } else {
        applications =
          await Application.find({
            recipientRole:
              req.user.role,
          })
            .populate(
              populateOptions
            )
            .sort({
              createdAt: -1,
            });
      }

      res.json(applications);
    } catch (error) {
      console.error(
        "Fetch applications error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT'S OWN APPLICATIONS
// ==================================================

app.get(
  "/applications/student/:studentId",
  authenticate,
  async (req, res) => {
    try {
      if (
        req.user.role ===
          "Student" &&
        req.user.studentId !==
          req.params.studentId
      ) {
        return res.status(403).json({
          message:
            "You can only view your own applications.",
        });
      }

      const applications =
        await Application.find({
          studentId:
            req.params.studentId,
        })
          .populate({
            path: "examApplication",
            select:
              "student studentName studentId examFormNumber examName session semester course status admitCard",
          })
          .sort({
            createdAt: -1,
          });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch student applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// OLD ENDPOINT
// ==================================================

app.get(
  "/applications/:studentId",
  authenticate,
  async (req, res) => {
    try {
      if (
        req.user.role ===
          "Student" &&
        req.user.studentId !==
          req.params.studentId
      ) {
        return res.status(403).json({
          message:
            "You can only view your own applications.",
        });
      }

      const applications =
        await Application.find({
          studentId:
            req.params.studentId,
        })
          .populate({
            path: "examApplication",
            select:
              "student studentName studentId examFormNumber examName session semester course status admitCard",
          })
          .sort({
            createdAt: -1,
          });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch student applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// APPROVE APPLICATION
// ==================================================

app.put(
  "/applications/:id/approve",
  authenticate,
  async (req, res) => {
    try {
      const application =
        await Application.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      if (
        req.user.role !==
        application.recipientRole
      ) {
        return res.status(403).json({
          message:
            "You cannot approve this application.",
        });
      }

      application.status =
        "Approved";

      application.remarks =
        req.body.remarks || "";

      application.processedBy =
        req.user._id;

      await application.save();

      const updatedApplication =
        await Application.findById(
          application._id
        ).populate(
          "examApplication"
        );

      res.json({
        message:
          "Application approved successfully!",

        application:
          updatedApplication,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to approve application",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// REJECT APPLICATION
// ==================================================

app.put(
  "/applications/:id/reject",
  authenticate,
  async (req, res) => {
    try {
      const application =
        await Application.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      if (
        req.user.role !==
        application.recipientRole
      ) {
        return res.status(403).json({
          message:
            "You cannot reject this application.",
        });
      }

      application.status =
        "Rejected";

      application.remarks =
        req.body.remarks || "";

      application.processedBy =
        req.user._id;

      await application.save();

      const updatedApplication =
        await Application.findById(
          application._id
        ).populate(
          "examApplication"
        );

      res.json({
        message:
          "Application rejected successfully!",

        application:
          updatedApplication,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to reject application",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DELETE APPLICATION
// ==================================================

app.delete(
  "/applications/:id",
  authenticate,
  allowRoles(
    "Admin",
    "AppController"
  ),
  async (req, res) => {
    try {
      const application =
        await Application.findByIdAndDelete(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      res.json({
        message:
          "Application deleted successfully!",
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to delete application",
        error:
          error.message,
      });
    }
  }
);



app.post(
  "/api/tr/upload",
  authenticate,
  (req, res, next) => {
    if (req.user.role !== "Tabulator") {
      return res.status(403).json({
        message: "Only the Tabulator can upload TR records.",
      });
    }
    next();
  },
  trUpload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "individualPdfs", maxCount: 51 },
    { name: "mapping", maxCount: 1 },
  ]),
  async (req, res) => {
    const tempFiles = Object.values(req.files || {})
      .flat()
      .map((file) => file.path);

    try {
      const { session, sourceType } = req.body;
      const mappingFile = req.files?.mapping?.[0];

      if (!session?.trim() || !["combined", "individual"].includes(sourceType)) {
        return res.status(400).json({
          message: "Session and a valid sourceType are required.",
        });
      }

      if (!mappingFile) {
        return res.status(400).json({
          message: "Please upload a CSV mapping file.",
        });
      }

      if (sourceType === "combined" && !req.files?.pdf?.[0]) {
        return res.status(400).json({
          message: "Please upload the combined PDF.",
        });
      }

      if (
        sourceType === "individual" &&
        !req.files?.individualPdfs?.length
      ) {
        return res.status(400).json({
          message: "Please upload individual PDFs.",
        });
      }

      
const ext = path.extname(mappingFile.originalname).toLowerCase();
let rows;

if (ext === ".xlsx") {
  const XLSX = require("xlsx");

  const workbook = XLSX.readFile(mappingFile.path, {
    cellText: true,
    raw: false,
  });

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  rows = XLSX.utils.sheet_to_json(firstSheet, {
    defval: "",
    raw: false,
  });
} else if (ext === ".csv") {
  const csvText = fs.readFileSync(mappingFile.path, "utf8");

  rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });
} else {
  return res.status(400).json({
    message: "Please upload a CSV or XLSX mapping file.",
  });
}


      const requiredColumns = [
        "Session",
        "RegistrationNumber",
        "RollNumber",
      ];

      if (
        !rows.length ||
        requiredColumns.some((column) => !(column in rows[0]))
      ) {
        return res.status(400).json({
          message: "CSV must include Session, RegistrationNumber and RollNumber columns.",
        });
      }

      const uploadedIndividualPdfs = req.files?.individualPdfs || [];
      const individualByName = new Map(
        uploadedIndividualPdfs.map((file) => [
          path.basename(file.originalname).toLowerCase(),
          file,
        ])
      );

      if (sourceType === "individual" && !("FileName" in rows[0])) {
        return res.status(400).json({
          message: "Individual PDF CSV must also include the FileName column.",
        });
      }

      if (
        sourceType === "combined" &&
        rows.some(
          (row) =>
            !Number.isInteger(Number(row.PageStart)) ||
            !Number.isInteger(Number(row.PageEnd)) ||
            Number(row.PageStart) < 1 ||
            Number(row.PageEnd) < Number(row.PageStart)
        )
      ) {
        return res.status(400).json({
          message: "Combined PDF CSV needs valid PageStart and PageEnd values.",
        });
      }

      const prepared = [];
      const seen = new Set();

      for (const row of rows) {
        const rowSession = String(row.Session || "").trim();
        const registrationNumber = String(row.RegistrationNumber || "").trim();
        const rollNumber = String(row.RollNumber || "").trim();

        if (
          !rowSession ||
          !registrationNumber ||
          !rollNumber ||
          rowSession !== session.trim()
        ) {
          throw new Error("Each CSV row must match the selected session and contain both student numbers.");
        }

        const key = `${rowSession}|${registrationNumber}|${rollNumber}`;
        if (seen.has(key)) {
          throw new Error(`Duplicate student record in CSV: ${registrationNumber}`);
        }
        seen.add(key);

        let storedFilePath;
        let storedFileName;

        if (sourceType === "individual") {
          const fileName = path.basename(String(row.FileName || ""));
          const file = individualByName.get(fileName.toLowerCase());

          if (!file) {
            throw new Error(`Uploaded PDF not found for ${registrationNumber}: ${fileName}`);
          }

          storedFileName = `${crypto.randomUUID()}.pdf`;
          storedFilePath = path.join(TR_UPLOAD_DIR, storedFileName);
          prepared.push({
            source: file.path,
            destination: storedFilePath,
          });
        } else {
          storedFileName = `${crypto.randomUUID()}.pdf`;
          storedFilePath = path.join(TR_UPLOAD_DIR, storedFileName);
          prepared.push({
            source: req.files.pdf[0].path,
            destination: storedFilePath,
            combined: true,
          });
        }

        prepared.push({
          record: {
            session: rowSession,
            registrationNumber,
            rollNumber,
            fileName: storedFileName,
            filePath: storedFilePath,
            uploadedBy: req.user._id,
            sourceType,
            sourceFileName:
              sourceType === "individual"
                ? String(row.FileName || "")
                : req.files.pdf[0].originalname,
          },
          pageStart: Number(row.PageStart),
          pageEnd: Number(row.PageEnd),
        });
      }

      if (sourceType === "combined") {
        const combinedFile = req.files.pdf[0];
        const pdfBytes = fs.readFileSync(combinedFile.path);
        const { PDFDocument } = require("pdf-lib");
        const sourcePdf = await PDFDocument.load(pdfBytes);
        const totalPages = sourcePdf.getPageCount();

        for (const item of prepared.filter((item) => item.record)) {
          if (
            item.pageStart < 1 ||
            item.pageEnd > totalPages
          ) {
            throw new Error(`Invalid page range for ${item.record.registrationNumber}.`);
          }

          const studentPdf = await PDFDocument.create();
          const pageIndices = Array.from(
            { length: item.pageEnd - item.pageStart + 1 },
            (_, index) => item.pageStart - 1 + index
          );
          const copiedPages = await studentPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => studentPdf.addPage(page));

          fs.writeFileSync(
            prepared.find(
              (candidate) => candidate.destination === item.record.filePath
            ).destination,
            await studentPdf.save()
          );
        }
      }

      if (sourceType === "individual") {
        for (const item of prepared.filter((entry) => entry.record)) {
          const source = prepared.find(
            (candidate) => candidate.source === uploadedIndividualPdfs.find(
              (file) => path.basename(file.originalname).toLowerCase() ===
                item.record.sourceFileName.toLowerCase()
            )?.path
          );

          if (!source || !fs.existsSync(source.source)) {
            throw new Error(`PDF file missing for ${item.record.registrationNumber}.`);
          }

          fs.copyFileSync(source.source, item.record.filePath);
        }
      }

      const records = prepared
        .filter((item) => item.record)
        .map((item) => item.record);

      // Refuse duplicate student/session records instead of silently overwriting them.
      await TRRecord.insertMany(records, { ordered: true });

      res.status(201).json({
        message: "TR records uploaded successfully.",
        count: records.length,
      });
    } catch (error) {
      console.error("TR upload error:", error);

      res.status(400).json({
        message: error.code === 11000
          ? "A TR record already exists for one of these students and sessions."
          : error.message || "TR upload failed.",
      });
    } finally {
      for (const filePath of tempFiles) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  }
);


// ==================================================
// EXAM FORM
// ==================================================

app.post(
  "/exam-applications",
  authenticate,
  allowRoles("Student"),
  examUpload.single(
    "feeReceipt"
  ),
  async (req, res) => {
    try {
      const {
        examFormNumber,
        examName,
        session,
        semester,
        course,
        dateOfBirth,
        fatherName,
        motherName,
        address,
        pinCode,
        collegeName,
        universityRegistrationNo,
        collegeRollNo,
        subjects,
        examFee,
        transactionId,
      } = req.body;

      if (
        !examName ||
        !session ||
        !semester ||
        !course ||
        !examFee ||
        !req.file
      ) {
        return res.status(400).json({
          message:
            "Exam details, exam fee and fee receipt are required.",
        });
      }

      let parsedSubjects =
        [];

      try {
        parsedSubjects =
          typeof subjects ===
          "string"
            ? JSON.parse(subjects)
            : subjects || [];
      } catch {
        return res.status(400).json({
          message:
            "Subjects data is invalid.",
        });
      }

      const application =
        new ExamApplication({
          student:
            req.user._id,

          studentName:
            req.user.name,

          studentId:
            req.user.studentId,

          examFormNumber:
            examFormNumber || "",

          examName,

          session,

          semester,

          course,

          dateOfBirth:
            dateOfBirth || "",

          fatherName:
            fatherName || "",

          motherName:
            motherName || "",

          address:
            address || "",

          pinCode:
            pinCode || "",

          collegeName:
            collegeName || "",

          universityRegistrationNo:
            universityRegistrationNo ||
            "",

          collegeRollNo:
            collegeRollNo || "",

          subjects:
            parsedSubjects,

          examFee:
            Number(examFee),

          transactionId:
            transactionId || "",

          feeReceipt: {
            fileName:
              req.file.originalname,

            filePath:
              `/uploads/exam-receipts/${req.file.filename}`,

            fileType:
              req.file.mimetype,
          },
        });

      const savedApplication =
        await application.save();

      res.status(201).json({
        message:
          "Exam form submitted successfully!",

        application:
          savedApplication,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit exam form",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT'S EXAM FORMS
// ==================================================

app.get(
  "/exam-applications/my",
  authenticate,
  allowRoles("Student"),
  async (req, res) => {
    try {
      const applications =
        await ExamApplication.find({
          student:
            req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch exam applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DEPARTMENT GETS EXAM FORMS
// ==================================================

app.get(
  "/exam-applications",
  authenticate,
  allowRoles(
    "Department",
    "AppController"
  ),
  async (req, res) => {
    try {
      const applications =
        await ExamApplication.find()
          .populate(
            "student",
            "-password"
          )
          .sort({
            createdAt: -1,
          });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch exam applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DEPARTMENT APPROVES / REJECTS EXAM FORM
// ==================================================

app.put(
  "/exam-applications/:id/status",
  authenticate,
  allowRoles("Department"),
  async (req, res) => {
    try {
      const {
        status,
        departmentRemark,
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected.",
        });
      }

      const application =
        await ExamApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Exam application not found",
        });
      }

      application.status =
        status;

      application.departmentRemark =
        departmentRemark || "";

      if (status === "Approved") {
        application.approvedBy =
          req.user._id;
      } else {
        application.approvedBy =
          null;
      }

      await application.save();

      res.json({
        message:
          "Exam application updated successfully!",

        application,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update exam application",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DEPARTMENT SENDS ADMIT CARD
// ==================================================

app.post(
  "/exam-applications/:id/admit-card",
  authenticate,
  allowRoles("Department"),
  admitCardUpload.single(
    "admitCard"
  ),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select an admit card file.",
        });
      }

      const application =
        await ExamApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Exam application not found.",
        });
      }

      if (
        application.status !==
        "Approved"
      ) {
        return res.status(400).json({
          message:
            "Admit card can only be uploaded after the exam form is approved.",
        });
      }

      if (
        application.admitCard &&
        application.admitCard.filePath
      ) {
        const oldRelativePath =
          application.admitCard.filePath.replace(
            "/uploads/",
            ""
          );

        const oldFilePath =
          path.join(
            __dirname,
            "uploads",
            oldRelativePath
          );

        if (
          fs.existsSync(
            oldFilePath
          )
        ) {
          fs.unlinkSync(
            oldFilePath
          );
        }
      }

      application.admitCard = {
        fileName:
          req.file.originalname,

        filePath:
          `/uploads/admit-cards/${req.file.filename}`,

        fileType:
          req.file.mimetype,

        uploadedAt:
          new Date(),
      };

      application.admitCardUploadedBy =
        req.user._id;

      await application.save();

      res.json({
        message:
          "Admit card sent to the student successfully!",

        application,
      });
    } catch (error) {
      console.error(
        "Admit card upload error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to upload admit card",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT VIEW / DOWNLOAD ADMIT CARD
// ==================================================

app.get(
  "/exam-applications/:id/admit-card",
  authenticate,
  allowRoles(
    "Student",
    "Department"
  ),
  async (req, res) => {
    try {
      const application =
        await ExamApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Exam application not found.",
        });
      }

      // Student can only access
      // his/her own exam application.
      if (
        req.user.role ===
          "Student" &&
        application.student.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You can only access your own admit card.",
        });
      }

      if (
        !application.admitCard ||
        !application.admitCard.filePath
      ) {
        return res.status(404).json({
          message:
            "Admit card has not been uploaded yet.",
        });
      }

      const relativePath =
        application.admitCard.filePath.replace(
          "/uploads/",
          ""
        );

      const filePath =
        path.join(
          __dirname,
          "uploads",
          relativePath
        );

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        return res.status(404).json({
          message:
            "Admit card file not found on server.",
        });
      }

      res.sendFile(
        filePath
      );
    } catch (error) {
      console.error(
        "Admit card access error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to access admit card",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// REGISTRATION FORM
// ==================================================

app.post(
  "/registration-applications",
  authenticate,
  allowRoles("Student"),
  registrationUpload.array(
    "documents",
    5
  ),
  async (req, res) => {
    try {
      const {
        session,
        semester,
        course,
        registrationNumber,
        details,
      } = req.body;

      if (
        !session ||
        !semester ||
        !course
      ) {
        return res.status(400).json({
          message:
            "Session, semester and course are required.",
        });
      }

      const documents =
        (req.files || []).map(
          (file) => ({
            fileName:
              file.originalname,

            filePath:
              `/uploads/registration-documents/${file.filename}`,

            fileType:
              file.mimetype,
          })
        );

      const application =
        new RegistrationApplication({
          student:
            req.user._id,

          studentName:
            req.user.name,

          studentId:
            req.user.studentId,

          session,

          semester,

          course,

          registrationNumber:
            registrationNumber ||
            "",

          details:
            details || "",

          documents,
        });

      const savedApplication =
        await application.save();

      res.status(201).json({
        message:
          "Registration form submitted successfully!",

        application:
          savedApplication,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit registration form",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT REGISTRATION FORMS
// ==================================================

app.get(
  "/registration-applications/my",
  authenticate,
  allowRoles("Student"),
  async (req, res) => {
    try {
      const applications =
        await RegistrationApplication.find({
          student:
            req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch registration applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DEPARTMENT REGISTRATION FORMS
// ==================================================

app.get(
  "/registration-applications",
  authenticate,
  allowRoles(
    "Department",
    "AppController"
  ),
  async (req, res) => {
    try {
      const applications =
        await RegistrationApplication.find()
          .populate(
            "student",
            "-password"
          )
          .sort({
            createdAt: -1,
          });

      res.json(applications);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch registration applications",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DEPARTMENT REGISTRATION STATUS
// ==================================================

app.put(
  "/registration-applications/:id/status",
  authenticate,
  allowRoles("Department"),
  async (req, res) => {
    try {
      const {
        status,
        departmentRemark,
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected.",
        });
      }

      const application =
        await RegistrationApplication.findById(
          req.params.id
        );

      if (!application) {
        return res.status(404).json({
          message:
            "Registration application not found",
        });
      }

      application.status =
        status;

      application.departmentRemark =
        departmentRemark || "";

      if (status === "Approved") {
        application.approvedBy =
          req.user._id;
      } else {
        application.approvedBy =
          null;
      }

      await application.save();

      res.json({
        message:
          "Registration application updated successfully!",

        application,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update registration application",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// PRINCIPAL SIGNATURE
// ==================================================

const principalSignatureUpload = multer({
  storage: createStorage(
    uploadDirectories.principalSignature
  ),

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Principal signature must be PNG, JPG or JPEG."
        )
      );
    }
  },

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

app.post(
  "/principal/signature",
  authenticate,
  allowRoles("Principal"),
  principalSignatureUpload.single(
    "signature"
  ),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload the Principal signature.",
        });
      }

      const existingSignature =
        await PrincipalSignature.findOne({
          principal: req.user._id,
        });

      if (existingSignature) {
        existingSignature.fileName =
          req.file.originalname;

        existingSignature.filePath =
          `/uploads/principal-signature/${req.file.filename}`;

        existingSignature.fileType =
          req.file.mimetype;

        existingSignature.uploadedAt =
          new Date();

        await existingSignature.save();

        return res.json({
          message:
            "Principal signature updated successfully.",

          signature:
            existingSignature,
        });
      }

      const signature =
        new PrincipalSignature({
          principal:
            req.user._id,

          fileName:
            req.file.originalname,

          filePath:
            `/uploads/principal-signature/${req.file.filename}`,

          fileType:
            req.file.mimetype,
        });

      const savedSignature =
        await signature.save();

      res.status(201).json({
        message:
          "Principal signature uploaded successfully.",

        signature:
          savedSignature,
      });
    } catch (error) {
      console.error(
        "Principal signature upload error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to upload Principal signature.",

        error:
          error.message,
      });
    }
  }
);

// ==================================================
// DOCUMENT REQUESTS
// ==================================================

function getDocumentRecipient(
  requestType
) {
  const routing = {
    TR: "Principal",

    Bonafide:
      "Principal",

    "No Dues":
      "Principal",

    "Other Document":
      "Principal",
  };

  return (
    routing[requestType] ||
    null
  );
}

app.post(
  "/document-requests",
  authenticate,
  allowRoles("Student"),
  documentUpload.single(
    "document"
  ),
  async (req, res) => {
    try {
      const {
        requestType,
        reason,
      } = req.body;

      if (
        !requestType ||
        !reason
      ) {
        return res.status(400).json({
          message:
            "Request type and reason are required.",
        });
      }

      const recipientRole =
        getDocumentRecipient(
          requestType
        );

      if (!recipientRole) {
        return res.status(400).json({
          message:
            "Invalid document request type.",
        });
      }

      const document =
        req.file
          ? {
              fileName:
                req.file.originalname,

              filePath:
                `/uploads/other-documents/${req.file.filename}`,

              fileType:
                req.file.mimetype,
            }
          : {};

      const request =
        new DocumentRequest({
          student:
            req.user._id,

          studentName:
            req.user.name,

          studentId:
            req.user.studentId,

          requestType,

          recipientRole,

          reason,

          document,
        });

      const savedRequest =
        await request.save();

      res.status(201).json({
        message:
          "Document request submitted successfully!",

        request:
          savedRequest,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit document request",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT DOCUMENT REQUESTS
// ==================================================

app.get(
  "/document-requests/my",
  authenticate,
  allowRoles("Student"),
  async (req, res) => {
    try {
      const requests =
        await DocumentRequest.find({
          student:
            req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch document requests",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// OFFICE DOCUMENT REQUESTS
// ==================================================

app.get(
  "/document-requests",
  authenticate,
  async (req, res) => {
    try {
      let filter = {};

      if (
        req.user.role ===
        "AppController"
      ) {
        filter = {};
      } else {
        filter.recipientRole =
          req.user.role;
      }

      const requests =
        await DocumentRequest.find(
          filter
        ).sort({
          createdAt: -1,
        });

      res.json(requests);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch document requests",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// PROCESS DOCUMENT REQUEST
// ==================================================

app.put(
  "/document-requests/:id/status",
  authenticate,
  async (req, res) => {
    try {
      const {
        status,
        remarks,
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected.",
        });
      }

      const request =
        await DocumentRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          message:
            "Document request not found",
        });
      }

      if (
        req.user.role !==
        request.recipientRole
      ) {
        return res.status(403).json({
          message:
            "You cannot process this request.",
        });
      }

      request.status =
        status;

      request.remarks =
        remarks || "";

      request.processedBy =
        req.user._id;

      await request.save();

      res.json({
        message:
          "Document request updated successfully!",

        request,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update document request",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// BUS RESERVATION
// ==================================================

app.post(
  "/bus-reservations",
  authenticate,
  allowRoles(
    "Student",
    "Transport"
  ),
  async (req, res) => {
    try {
      const {
        travelDate,
        from,
        to,
        passengers,
        reason,
      } = req.body;

      if (
        !travelDate ||
        !from ||
        !to ||
        !passengers ||
        !reason
      ) {
        return res.status(400).json({
          message:
            "Travel date, from, to, passengers and reason are required.",
        });
      }

      const reservation =
        new BusReservation({
          requester:
            req.user._id,

          requesterName:
            req.user.name,

          requesterType:
            req.user.userType ||
            "Student",

          studentId:
            req.user.studentId ||
            "",

          department:
            req.user.department ||
            "",

          travelDate,

          from,

          to,

          passengers:
            Number(passengers),

          reason,
        });

      const savedReservation =
        await reservation.save();

      res.status(201).json({
        message:
          "Bus reservation request submitted successfully!",

        reservation:
          savedReservation,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to submit bus reservation",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// STUDENT BUS RESERVATIONS
// ==================================================

app.get(
  "/bus-reservations/my",
  authenticate,
  allowRoles("Student"),
  async (req, res) => {
    try {
      const reservations =
        await BusReservation.find({
          requester:
            req.user._id,
        }).sort({
          createdAt: -1,
        });

      res.json(reservations);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch bus reservations",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// TRANSPORT GETS BUS RESERVATIONS
// ==================================================

app.get(
  "/bus-reservations",
  authenticate,
  allowRoles(
    "Transport",
    "AppController"
  ),
  async (req, res) => {
    try {
      const reservations =
        await BusReservation.find()
          .populate(
            "requester",
            "-password"
          )
          .sort({
            createdAt: -1,
          });

      res.json(reservations);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch bus reservations",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// TRANSPORT UPDATES RESERVATION
// ==================================================

app.put(
  "/bus-reservations/:id/status",
  authenticate,
  allowRoles("Transport"),
  async (req, res) => {
    try {
      const {
        status,
        remarks,
      } = req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Status must be Approved or Rejected.",
        });
      }

      const reservation =
        await BusReservation.findById(
          req.params.id
        );

      if (!reservation) {
        return res.status(404).json({
          message:
            "Bus reservation not found",
        });
      }

      reservation.status =
        status;

      reservation.remarks =
        remarks || "";

      reservation.processedBy =
        req.user._id;

      await reservation.save();

      res.json({
        message:
          "Bus reservation updated successfully!",

        reservation,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update bus reservation",
        error:
          error.message,
      });
    }
  }
);

// ==================================================
// ERROR HANDLER
// ==================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(error);

    if (
      error instanceof
      multer.MulterError
    ) {
      return res.status(400).json({
        message:
          "File upload error",
        error:
          error.message,
      });
    }

    if (
      error.message &&
      error.message.includes(
        "Only JPG, JPEG, PNG and PDF"
      )
    ) {
      return res.status(400).json({
        message:
          error.message,
      });
    }

    res.status(500).json({
      message:
        "Something went wrong on the server.",

      error:
        error.message,
    });
  }
);


app.post(
  "/api/tr/download",
  authenticate,
  allowRoles("Student"),
  async (req, res) => {
    try {
      const { session, registrationNumber, rollNumber } = req.body;

      if (
        !session?.trim() ||
        !registrationNumber?.trim() ||
        !rollNumber?.trim()
      ) {
        return res.status(400).json({
          message: "Session, Registration Number and Roll Number are required.",
        });
      }

      // Student ID is the student's registered roll number.
      if (
        String(req.user.studentId || "").trim().toLowerCase() !==
        String(rollNumber).trim().toLowerCase()
      ) {
        return res.status(403).json({
          message: "You can only download your own TR.",
        });
      }

      const TRRecord = require("./models/TRRecord");

      const record = await TRRecord.findOne({
        session: session.trim(),
        registrationNumber: registrationNumber.trim(),
        rollNumber: rollNumber.trim(),
        isActive: true,
      }).select("+filePath");

      if (!record || !fs.existsSync(record.filePath)) {
        return res.status(404).json({
          message: "TR not found. Please check your details.",
        });
      }

      return res.download(
        record.filePath,
        `TR-${record.rollNumber}.pdf`
      );
    } catch (error) {
      console.error("TR download error:", error);
      return res.status(500).json({
        message: "Unable to download TR right now.",
      });
    }
  }
);

// ==================================================
// UPLOAD COMBINED TR PDF
// ==================================================

app.post(
  "/api/tr/combined-upload",
  authenticate,
  async (req, res, next) => {
    if (req.user.role !== "Tabulator") {
      return res.status(403).json({
        message: "Only Tabulator can upload the combined TR PDF.",
      });
    }
    next();
  },
  trUpload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Please select a PDF file.",
        });
      }

      const session = String(req.body.session || "").trim();

      if (!session) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: "Please enter the session.",
        });
      }

      const manifestPath = path.join(
        TR_UPLOAD_DIR,
        "combined-tr.json"
      );

      const existing = fs.existsSync(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
        : [];

      const updated = existing.filter(
        (item) => item.session !== session
      );

      updated.push({
        session,
        fileName: req.file.originalname,
        filePath: req.file.path,
        uploadedAt: new Date().toISOString(),
      });

      fs.writeFileSync(
        manifestPath,
        JSON.stringify(updated, null, 2)
      );

      return res.json({
        message: "Combined TR PDF uploaded successfully.",
      });
    } catch (error) {
      console.error("Combined TR upload error:", error);
      return res.status(500).json({
        message: "Failed to upload the combined TR PDF.",
      });
    }
  }
);

// ==================================================
// LIST COMBINED TR SESSIONS
// ==================================================

app.get(
  "/api/tr/combined-list",
  authenticate,
  async (req, res) => {
    try {
      const manifestPath = path.join(
        TR_UPLOAD_DIR,
        "combined-tr.json"
      );

      if (!fs.existsSync(manifestPath)) {
        return res.json([]);
      }

      const records = JSON.parse(
        fs.readFileSync(manifestPath, "utf8")
      );

      return res.json(
        records.map((item) => ({
          session: item.session,
          fileName: item.fileName,
          uploadedAt: item.uploadedAt,
        }))
      );
    } catch (error) {
      console.error("Combined TR list error:", error);
      return res.status(500).json({
        message: "Failed to load combined TR records.",
      });
    }
  }
);


// ==================================================
// DOWNLOAD COMBINED TR PDF
// ==================================================

app.get(
  "/api/tr/combined-download/:session",
  authenticate,
  async (req, res) => {
    try {
      const manifestPath = path.join(
        TR_UPLOAD_DIR,
        "combined-tr.json"
      );

      if (!fs.existsSync(manifestPath)) {
        return res.status(404).json({
          message: "No combined TR PDF is available.",
        });
      }

      const records = JSON.parse(
        fs.readFileSync(manifestPath, "utf8")
      );

      const record = records.find(
        (item) =>
          item.session === req.params.session
      );

      if (!record || !fs.existsSync(record.filePath)) {
        return res.status(404).json({
          message: "Combined TR PDF not found.",
        });
      }

      return res.download(
        record.filePath,
        `Combined-TR-${record.session}.pdf`
      );
    } catch (error) {
      console.error("Combined TR download error:", error);
      return res.status(500).json({
        message: "Failed to download combined TR PDF.",
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SmartCampus server is running on port ${PORT}`);
});
