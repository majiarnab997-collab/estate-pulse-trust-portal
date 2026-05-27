/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;
const JWT_SECRET = "customer_trust_portal_super_secret_key_2026";

// Create Express instance
const app = express();
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ==========================================
// STATEFUL IN-MEMORY DATABASE & PERSISTENCE
// ==========================================
// Since Neon/PostgreSQL requires external connection strings which may be absent in client sandboxes,
// we build a reliable, fully persistent JSON-backed Database Engine in memory that compiles instantly and works flawlessly.
class DatabaseEngine {
  private fileDir = path.join(process.cwd(), "data");
  private filePath = path.join(process.cwd(), "data", "db_store.json");

  public users: any[] = [];
  public properties: any[] = [];
  public allocations: any[] = [];
  public documents: any[] = [];
  public statusHistory: any[] = [];
  public payments: any[] = [];
  public invoices: any[] = [];
  public media: any[] = [];
  public notifications: any[] = [];
  public adminLogs: any[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (!fs.existsSync(this.fileDir)) {
        fs.mkdirSync(this.fileDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        this.users = parsed.users || [];
        this.properties = parsed.properties || [];
        this.allocations = parsed.allocations || [];
        this.documents = parsed.documents || [];
        this.statusHistory = parsed.statusHistory || [];
        this.payments = parsed.payments || [];
        this.invoices = parsed.invoices || [];
        this.media = parsed.media || [];
        this.notifications = parsed.notifications || [];
        this.adminLogs = parsed.adminLogs || [];
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.error("Failed to load persistent schema store. Booting empty.", err);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      const dataToSave = {
        users: this.users,
        properties: this.properties,
        allocations: this.allocations,
        documents: this.documents,
        statusHistory: this.statusHistory,
        payments: this.payments,
        invoices: this.invoices,
        media: this.media,
        notifications: this.notifications,
        adminLogs: this.adminLogs,
      };
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist data update:", err);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    
    // Hash passwords for standard demo users
    const adminPass = bcrypt.hashSync("admin123", salt);
    const johnPass = bcrypt.hashSync("john123", salt);
    const sarahPass = bcrypt.hashSync("sarah123", salt);

    this.users = [
      {
        id: "usr-admin-1",
        email: "admin@elitehomes.com",
        passwordHash: adminPass,
        name: "Eleanor Vance",
        phone: "+1 (800) 555-0199",
        role: "ADMIN",
        createdAt: new Date("2026-01-01T08:00:00Z").toISOString(),
      },
      {
        id: "usr-cust-john",
        email: "john.doe@gmail.com",
        passwordHash: johnPass,
        name: "John Doe",
        phone: "+1 (415) 555-2671",
        role: "CUSTOMER",
        createdAt: new Date("2026-02-15T10:30:00Z").toISOString(),
      },
      {
        id: "usr-cust-sarah",
        email: "sarah.smith@gmail.com",
        passwordHash: sarahPass,
        name: "Sarah Smith",
        phone: "+1 (206) 555-8942",
        role: "CUSTOMER",
        createdAt: new Date("2026-03-10T14:20:00Z").toISOString(),
      }
    ];

    this.properties = [
      {
        id: "prop-bangalore-452",
        plotNumber: "Plot #452",
        plotSize: "2,400 sq.ft. (60x40 Grand Villa Lot)",
        location: "Elite Meadows, Phase II, Sarjapur, Bangalore",
        googleMapsUrl: "https://maps.google.com/?q=Sarjapur,Bangalore",
        projectPhase: "Phase II - Brickwork & Plastering Stage",
        amenities: [
          "Private Clubhouse & Gymnasium",
          "Acre-wide Central Park & Water Body",
          "Eco-friendly Rainwater Harvesting System",
          "24/7 Smart Surveillance & Security",
          "Underground Smart Cabling Grid"
        ],
        constructionStatus: 65, // 65% complete
        brochureUrl: "https://elitehomes.com/brochure/meadows_phase2.pdf",
        legalClearance: true,
        createdAt: new Date("2026-01-10T09:00:00Z").toISOString(),
      },
      {
        id: "prop-hyderabad-108",
        plotNumber: "Plot #108",
        plotSize: "1,200 sq.ft. (40x30 Executive Lot)",
        location: "Royal Retreat Phase I, Gachibowli, Hyderabad",
        googleMapsUrl: "https://maps.google.com/?q=Gachibowli,Hyderabad",
        projectPhase: "Phase I - Foundation & Excavation Stage",
        amenities: [
          "Community Swimming Pool",
          "Children's Play Zone & Amphitheater",
          "Paved Tree-Lined Walkways",
          "Automated Smart Gate Controls",
          "Solar Street Lighting System"
        ],
        constructionStatus: 30, // 30% complete
        brochureUrl: "https://elitehomes.com/brochure/royal_retreat.pdf",
        legalClearance: true,
        createdAt: new Date("2026-02-01T09:00:00Z").toISOString(),
      }
    ];

    this.allocations = [
      {
        id: "alloc-john",
        userId: "usr-cust-john",
        propertyId: "prop-bangalore-452",
        allocatedAt: new Date("2026-02-18T11:00:00Z").toISOString(),
      },
      {
        id: "alloc-sarah",
        userId: "usr-cust-sarah",
        propertyId: "prop-hyderabad-108",
        allocatedAt: new Date("2026-03-12T15:00:00Z").toISOString(),
      }
    ];

    this.documents = [
      {
        id: "doc-sale-deed-john",
        userId: "usr-cust-john",
        name: "Sale Deed Agreement (Draft)",
        type: "PDF Document",
        fileUrl: "https://elitehomes.com/vault/docs/john_sale_deed_signed.pdf",
        status: "APPROVED",
        remarks: "Legally approved by chief counsel. Official physical copy ready for registration.",
        uploadedAt: new Date("2026-02-20T14:00:00Z").toISOString(),
        updatedAt: new Date("2026-02-25T16:30:00Z").toISOString(),
      },
      {
        id: "doc-soil-report-john",
        userId: "usr-cust-john",
        name: "Geotechnical Soil Bearing Capacity Report",
        type: "Engineering Analysis Data",
        fileUrl: "https://elitehomes.com/vault/docs/meadows_soil_report_zoneB.pdf",
        status: "APPROVED",
        remarks: "Soil load bearing index confirmed safe for multi-tier premium villa structure.",
        uploadedAt: new Date("2026-02-22T09:12:00Z").toISOString(),
        updatedAt: new Date("2026-02-23T11:00:00Z").toISOString(),
      },
      {
        id: "doc-legal-clearance-john",
        userId: "usr-cust-john",
        name: "Legal Title Clearance Certificate",
        type: "Legal Clearance",
        fileUrl: "https://elitehomes.com/vault/docs/john_title_clearance.pdf",
        status: "APPROVED",
        remarks: "All local municipality land audits clear. No external litigation matches detected.",
        uploadedAt: new Date("2026-02-25T11:30:00Z").toISOString(),
        updatedAt: new Date("2026-02-27T10:00:00Z").toISOString(),
      },
      {
        id: "doc-reg-john",
        userId: "usr-cust-john",
        name: "Government Property Registration Receipt",
        type: "Scan / Land Certificate",
        fileUrl: "https://elitehomes.com/vault/docs/john_prop_reg_copy.pdf",
        status: "UNDER_REVIEW",
        remarks: "Submitted to sub-registrar portal on May 12. Stamp certificate generation underway.",
        uploadedAt: new Date("2026-05-12T09:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-12T09:00:00Z").toISOString(),
      },
      {
        id: "doc-tax-john",
        userId: "usr-cust-john",
        name: "Municipal Non-Agricultural Tax Audited Clearance",
        type: "Tax Documents",
        fileUrl: "https://elitehomes.com/vault/docs/john_tax_receipt.pdf",
        status: "UPLOADED",
        remarks: "Awaiting legal expert assignment for compliance verification.",
        uploadedAt: new Date("2026-05-25T14:40:00Z").toISOString(),
        updatedAt: new Date("2026-05-25T14:40:00Z").toISOString(),
      },
      {
        id: "doc-sale-deed-sarah",
        userId: "usr-cust-sarah",
        name: "Sale Deed Agreement (Draft)",
        type: "PDF Document",
        fileUrl: "https://elitehomes.com/vault/docs/sarah_sale_deed.pdf",
        status: "VERIFIED",
        remarks: "Initial notary verification complete. Ready for applicant review.",
        uploadedAt: new Date("2026-03-15T11:00:00Z").toISOString(),
        updatedAt: new Date("2026-03-20T10:00:00Z").toISOString(),
      }
    ];

    this.statusHistory = [
      {
        id: "hist-1",
        documentId: "doc-sale-deed-john",
        status: "UPLOADED",
        changedBy: "usr-cust-john",
        remarks: "Initial signoff submitted.",
        changedAt: new Date("2026-02-20T14:00:00Z").toISOString(),
      },
      {
        id: "hist-2",
        documentId: "doc-sale-deed-john",
        status: "UNDER_REVIEW",
        changedBy: "usr-admin-1",
        remarks: "Assigned to property legal counselor for contract layout validation.",
        changedAt: new Date("2026-02-23T10:00:00Z").toISOString(),
      },
      {
        id: "hist-3",
        documentId: "doc-sale-deed-john",
        status: "APPROVED",
        changedBy: "usr-admin-1",
        remarks: "Contract finalized and approved.",
        changedAt: new Date("2026-02-25T16:30:00Z").toISOString(),
      }
    ];

    this.payments = [
      // John's Meadow Layout Plan
      {
        id: "pay-john-1",
        propertyAllocationId: "alloc-john",
        installmentNumber: 1,
        amountDue: 1500000, // INR 1,500,000 (Booking deposit)
        amountPaid: 1500000,
        dueDate: new Date("2026-02-28T00:00:00Z").toISOString(),
        paidAt: new Date("2026-02-25T11:45:00Z").toISOString(),
        status: "PAID",
        createdAt: new Date("2026-02-18T11:00:00Z").toISOString(),
      },
      {
        id: "pay-john-2",
        propertyAllocationId: "alloc-john",
        installmentNumber: 2,
        amountDue: 2500000, // INR 2,500,000 (Plinth level foundation milestone)
        amountPaid: 2500000,
        dueDate: new Date("2026-04-15T00:00:00Z").toISOString(),
        paidAt: new Date("2026-04-12T16:20:00Z").toISOString(),
        status: "PAID",
        createdAt: new Date("2026-02-18T11:00:00Z").toISOString(),
      },
      {
        id: "pay-john-3",
        propertyAllocationId: "alloc-john",
        installmentNumber: 3,
        amountDue: 2000000, // INR 2,000,000 (Concrete pillar casting milestone)
        amountPaid: 1000000, // partially paid
        dueDate: new Date("2026-05-20T00:00:00Z").toISOString(),
        paidAt: new Date("2026-05-18T10:00:00Z").toISOString(),
        status: "OVERDUE", // or overdue due to residual amount
        createdAt: new Date("2026-02-18T11:00:00Z").toISOString(),
      },
      {
        id: "pay-john-4",
        propertyAllocationId: "alloc-john",
        installmentNumber: 4,
        amountDue: 1500000, // INR 1,500,000 (Finishing and electrical slab integration)
        amountPaid: 0,
        dueDate: new Date("2026-08-30T00:00:00Z").toISOString(),
        status: "PENDING",
        createdAt: new Date("2026-02-18T11:00:00Z").toISOString(),
      },
      // Sarah's Royal Retreat
      {
        id: "pay-sarah-1",
        propertyAllocationId: "alloc-sarah",
        installmentNumber: 1,
        amountDue: 1200000,
        amountPaid: 1200000,
        dueDate: new Date("2026-03-20T00:00:00Z").toISOString(),
        paidAt: new Date("2026-03-18T14:00:00Z").toISOString(),
        status: "PAID",
        createdAt: new Date("2026-03-12T15:00:00Z").toISOString(),
      },
      {
        id: "pay-sarah-2",
        propertyAllocationId: "alloc-sarah",
        installmentNumber: 2,
        amountDue: 2000000,
        amountPaid: 0,
        dueDate: new Date("2026-06-30T00:00:00Z").toISOString(),
        status: "PENDING",
        createdAt: new Date("2026-03-12T15:00:00Z").toISOString(),
      }
    ];

    this.invoices = [
      {
        id: "inv-1",
        paymentId: "pay-john-1",
        invoiceNum: "EHP-MEAD-26-4521",
        pdfUrl: "https://elitehomes.com/vault/invoices/inv_john_first_deposit.pdf",
        issuedAt: new Date("2026-02-25T12:00:00Z").toISOString(),
      },
      {
        id: "inv-2",
        paymentId: "pay-john-2",
        invoiceNum: "EHP-MEAD-26-4522",
        pdfUrl: "https://elitehomes.com/vault/invoices/inv_john_foundation_phase.pdf",
        issuedAt: new Date("2026-04-12T17:00:00Z").toISOString(),
      }
    ];

    this.media = [
      // John's plots
      {
        id: "med-1",
        propertyId: "prop-bangalore-452",
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
        title: "Foundation Footing Structural Pour Complete",
        caption: "High tensile steel reinforcers aligned. Grade M25 concrete curing process monitoring online.",
        uploadedAt: new Date("2026-03-05T10:00:00Z").toISOString(),
      },
      {
        id: "med-2",
        propertyId: "prop-bangalore-452",
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
        title: "Ground Floor Pillar Cast & Demodeling Stage",
        caption: "Main load points poured and sealed. Structural integrity audits scored higher than base margins.",
        uploadedAt: new Date("2026-04-15T15:30:00Z").toISOString(),
      },
      {
        id: "med-3",
        propertyId: "prop-bangalore-452",
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=800",
        title: "Brickwork Skeleton & Electrical Layout Integration",
        caption: "First level partition bricks laid. Conduits for underground optical fibers integrated.",
        uploadedAt: new Date("2026-05-10T11:00:00Z").toISOString(),
      },
      {
        id: "med-4",
        propertyId: "prop-bangalore-452",
        type: "VIDEO",
        url: "https://www.w3schools.com/html/mov_bbb.mp4", // generic accessible sample
        title: "Elite Meadows Aerial Site Drone Walkthrough",
        caption: "Panoramic footage showcasing ongoing road asphalt additions, storm drains, and security boundary grids.",
        uploadedAt: new Date("2026-05-24T17:20:00Z").toISOString(),
      },
      // Sarah's Plot
      {
        id: "med-5",
        propertyId: "prop-hyderabad-108",
        type: "IMAGE",
        url: "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?auto=format&fit=crop&q=80&w=800",
        title: "Heavy Excavator Site Grading Operations",
        caption: "Soil load testing and site clearing is ongoing on-schedule.",
        uploadedAt: new Date("2026-03-25T14:00:00Z").toISOString(),
      }
    ];

    this.notifications = [
      {
        id: "not-john-1",
        userId: "usr-cust-john",
        title: "Title Deed Signed Officially",
        message: "Your draft Sale Deed Agreement has been cleared by the chief legal compliance audit counselor. Physical copies can be signed at the Bangalore main registry.",
        isRead: false,
        createdAt: new Date("2026-02-25T16:35:00Z").toISOString(),
      },
      {
        id: "not-john-2",
        userId: "usr-cust-john",
        title: "Construction Phase III Commenced",
        message: "Masonry partition works and mechanical plumbing alignments are active for your grand villa at Plot #452.",
        isRead: false,
        createdAt: new Date("2026-05-10T11:30:00Z").toISOString(),
      }
    ];

    this.adminLogs = [
      {
        id: "log-1",
        adminId: "usr-admin-1",
        action: "INITIAL_DATABASE_SEED",
        details: "Established primary developer, admin, customer allocations blueprints and legal verification timelines.",
        createdAt: new Date("2026-05-27T13:30:00Z").toISOString(),
      }
    ];

    this.save();
  }
}

const db = new DatabaseEngine();

// ==========================================
// SECURITY & DECORATOR MIDDLEWARES
// ==========================================

// Authenticate user middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required. Please log in." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Session expired or invalid token. Please log in again." });
    }
    req.user = decoded;
    next();
  });
}

// Admin only gatekeeper
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrative status required to access this resource." });
  }
  next();
}

// Log administrative actions to admin logs
function logAdminAction(adminId: string, action: string, details: string) {
  const newLog = {
    id: `log-${Date.now()}`,
    adminId,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  db.adminLogs.unshift(newLog);
  db.save();
}

// Trigger in-app customer notification
function triggerNotification(userId: string, title: string, message: string) {
  const newNotif = {
    id: `not-${Date.now()}`,
    userId,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(newNotif);
  db.save();
}

// ==========================================
// REST REVOLVING ENDPOINTS API (MVC PATTERN)
// ==========================================

// --- AUTHENTICATION ---

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, phone, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = db.users.find((u) => u.email === normalizedEmail);
  if (exists) {
    return res.status(400).json({ error: "A user with this email address already exists." });
  }

  const assignedRole = role === "ADMIN" ? "ADMIN" : "CUSTOMER";
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr-${Date.now()}`,
    email: normalizedEmail,
    passwordHash,
    name,
    phone: phone || "",
    role: assignedRole,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.save();

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const { passwordHash: _, ...authenticatedUser } = newUser;
  res.status(201).json({
    message: "Registration successful",
    token,
    user: authenticatedUser,
  });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter both email and password." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: "Invalid email credentials or account does not exist." });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Incorrect password. Please verify and try again." });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const { passwordHash: _, ...authenticatedUser } = user;
  res.json({
    message: "Welcome back!",
    token,
    user: authenticatedUser,
  });
});

// GET /api/auth/me
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User identity profile not found." });
  }
  const { passwordHash: _, ...userProfile } = user;
  res.json({ user: userProfile });
});


// --- PROPERTIES ---

// GET /api/properties
app.get("/api/properties", authenticateToken, (req: any, res) => {
  if (req.user.role === "ADMIN") {
    // Return all properties
    return res.json(db.properties);
  } else {
    // Return properties allocated specifically to this customer
    const userAllocations = db.allocations.filter((a) => a.userId === req.user.id);
    const propertyIds = userAllocations.map((a) => a.propertyId);
    const allocatedProperties = db.properties.filter((p) => propertyIds.includes(p.id));
    return res.json(allocatedProperties);
  }
});

// GET /api/properties/:id
app.get("/api/properties/:id", authenticateToken, (req: any, res) => {
  const propertyId = req.params.id;
  const property = db.properties.find((p) => p.id === propertyId);

  if (!property) {
    return res.status(404).json({ error: "Property detail not found in directory." });
  }

  // If customer, verify they have allocation
  if (req.user.role !== "ADMIN") {
    const allocated = db.allocations.some((a) => a.userId === req.user.id && a.propertyId === propertyId);
    if (!allocated) {
      return res.status(403).json({ error: "Access denied. You are not allocated to this property." });
    }
  }

  res.json(property);
});

// POST /api/properties (Admin only)
app.post("/api/properties", authenticateToken, requireAdmin, (req: any, res) => {
  const { plotNumber, plotSize, location, googleMapsUrl, projectPhase, amenities, constructionStatus, brochureUrl } = req.body;

  if (!plotNumber || !plotSize || !location || !projectPhase) {
    return res.status(400).json({ error: "Required fields: Plot Number, Plot Size, Location, and Project Phase." });
  }

  const exists = db.properties.some((p) => p.plotNumber === plotNumber);
  if (exists) {
    return res.status(400).json({ error: `Property plot code ${plotNumber} is already registered.` });
  }

  const newProperty = {
    id: `prop-${Date.now()}`,
    plotNumber,
    plotSize,
    location,
    googleMapsUrl: googleMapsUrl || "",
    projectPhase,
    amenities: amenities || [],
    constructionStatus: Number(constructionStatus) || 0,
    brochureUrl: brochureUrl || "",
    legalClearance: true,
    createdAt: new Date().toISOString(),
  };

  db.properties.unshift(newProperty);
  db.save();

  logAdminAction(req.user.id, "CREATE_PROPERTY", `Added new plot allocation profile: ${plotNumber}`);

  res.status(201).json(newProperty);
});

// PUT /api/properties/:id (Admin only)
app.put("/api/properties/:id", authenticateToken, requireAdmin, (req: any, res) => {
  const propertyId = req.params.id;
  const propertyIndex = db.properties.findIndex((p) => p.id === propertyId);

  if (propertyIndex === -1) {
    return res.status(404).json({ error: "Property registry item not found." });
  }

  const updatedProperty = {
    ...db.properties[propertyIndex],
    ...req.body,
    constructionStatus: Number(req.body.constructionStatus) !== undefined ? Number(req.body.constructionStatus) : db.properties[propertyIndex].constructionStatus,
    updatedAt: new Date().toISOString(),
  };

  db.properties[propertyIndex] = updatedProperty;
  db.save();

  // Notify any allocated customers
  const affectedAllocations = db.allocations.filter((a) => a.propertyId === propertyId);
  affectedAllocations.forEach((alloc) => {
    triggerNotification(
      alloc.userId,
      "Property Details Updated",
      `The construction/legal phase of your allocated ${updatedProperty.plotNumber} was updated to ${updatedProperty.constructionStatus}%: ${updatedProperty.projectPhase}`
    );
  });

  logAdminAction(req.user.id, "UPDATE_PROPERTY", `Modified details for plot code: ${updatedProperty.plotNumber}`);

  res.json(updatedProperty);
});


// --- DOCUMENTS ---

// GET /api/documents
app.get("/api/documents", authenticateToken, (req: any, res) => {
  if (req.user.role === "ADMIN") {
    // Return all documents including customer name mapping
    const enrichedDocs = db.documents.map((doc) => {
      const owner = db.users.find((u) => u.id === doc.userId);
      return {
        ...doc,
        username: owner ? owner.name : "Unknown User",
        userEmail: owner ? owner.email : "",
      };
    });
    return res.json(enrichedDocs);
  } else {
    // Return documents assigned specifically to current customer
    const userDocs = db.documents.filter((doc) => doc.userId === req.user.id);
    return res.json(userDocs);
  }
});

// POST /api/documents/upload
app.post("/api/documents/upload", authenticateToken, (req: any, res) => {
  const { name, type, fileUrl, base64Data, remarks, targetUserId } = req.body;

  if (!name || (!fileUrl && !base64Data)) {
    return res.status(400).json({ error: "Document title name and file are mandatory." });
  }

  // Admin can upload on behalf of any customer, normal customers only upload for themselves
  let uploaderUserId = req.user.id;
  if (req.user.role === "ADMIN" && targetUserId) {
    uploaderUserId = targetUserId;
  }

  // Set local mock receipt url if uploaded via base64
  const finalFileUrl = fileUrl || `https://elitehomes.com/vault/uploads/${Date.now()}_doc_ref.pdf`;

  const newDoc = {
    id: `doc-${Date.now()}`,
    userId: uploaderUserId,
    name,
    type: type || "PDF Document",
    fileUrl: finalFileUrl,
    status: "UPLOADED",
    remarks: remarks || "Uploaded via digital web portal",
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.documents.unshift(newDoc);

  // Add initial history audit trail
  const newHist = {
    id: `hist-${Date.now()}`,
    documentId: newDoc.id,
    status: "UPLOADED" as const,
    changedBy: req.user.name,
    remarks: "Document uploaded successfully",
    changedAt: new Date().toISOString(),
  };
  db.statusHistory.push(newHist);
  db.save();

  if (req.user.role === "ADMIN") {
    triggerNotification(
      uploaderUserId,
      "Official Document Posted",
      `The administrative board added a new official document to your file vault: "${name}"`
    );
    logAdminAction(req.user.id, "UPLOAD_ADMIN_DOCUMENT", `Posted document "${name}" for User ID ${uploaderUserId}`);
  } else {
    // Notify administrators via logs / status trackers
    triggerNotification(
      uploaderUserId,
      "Document Submitted Successfully",
      `Your document "${name}" was uploaded successfully and is now placed in queue for validation review.`
    );
  }

  res.status(201).json(newDoc);
});

// PATCH /api/documents/:id/status (Admin approval workflow)
app.patch("/api/documents/:id/status", authenticateToken, requireAdmin, (req: any, res) => {
  const docId = req.params.id;
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ error: "A valid validation review status is required." });
  }

  const docIndex = db.documents.findIndex((d) => d.id === docId);
  if (docIndex === -1) {
    return res.status(404).json({ error: "Document profile not found." });
  }

  const oldDoc = db.documents[docIndex];
  const updatedDoc = {
    ...oldDoc,
    status,
    remarks: remarks || `Status modified to ${status}`,
    updatedAt: new Date().toISOString(),
  };

  db.documents[docIndex] = updatedDoc;

  // Record audit step history
  const newHist = {
    id: `hist-${Date.now()}`,
    documentId: docId,
    status,
    changedBy: req.user.name,
    remarks: remarks || `Review status logged as: ${status}`,
    changedAt: new Date().toISOString(),
  };
  db.statusHistory.push(newHist);
  db.save();

  // Alert customer
  triggerNotification(
    oldDoc.userId,
    "Document Status Update",
    `The compliance verification audit status of your file "${oldDoc.name}" has been updated to [${status}].`
  );

  logAdminAction(req.user.id, "AUDIT_DOCUMENT", `Updated document "${oldDoc.name}" status to "${status}"`);

  res.json(updatedDoc);
});

// GET /api/documents/:id/history (Track Timeline history)
app.get("/api/documents/:id/history", authenticateToken, (req: any, res) => {
  const docId = req.params.id;
  const history = db.statusHistory.filter((h) => h.documentId === docId);
  res.json(history);
});


// --- PAYMENT MANAGEMENT ---

// GET /api/payments
app.get("/api/payments", authenticateToken, (req: any, res) => {
  if (req.user.role === "ADMIN") {
    const enrichedPayments = db.payments.map((p) => {
      const alloc = db.allocations.find((a) => a.id === p.propertyAllocationId);
      const user = alloc ? db.users.find((u) => u.id === alloc.userId) : null;
      const prop = alloc ? db.properties.find((pr) => pr.id === alloc.propertyId) : null;
      return {
        ...p,
        customerName: user ? user.name : "Unknown",
        customerEmail: user ? user.email : "",
        plotNumber: prop ? prop.plotNumber : "N/A",
      };
    });
    return res.json(enrichedPayments);
  } else {
    // Customer checks their allocations
    const userAllocations = db.allocations.filter((a) => a.userId === req.user.id);
    const allocIds = userAllocations.map((a) => a.id);
    const userPayments = db.payments.filter((p) => allocIds.includes(p.propertyAllocationId));
    
    // Attach plot info for convenience
    const enriched = userPayments.map((p) => {
      const allocation = userAllocations.find((a) => a.id === p.propertyAllocationId);
      const prop = allocation ? db.properties.find((pr) => pr.id === allocation.propertyId) : null;
      return {
        ...p,
        plotNumber: prop ? prop.plotNumber : "N/A",
      };
    });

    return res.json(enriched);
  }
});

// POST /api/payments/:id/pay (Customer simulates payment gateways)
app.post("/api/payments/:id/pay", authenticateToken, (req: any, res) => {
  const paymentId = req.params.id;
  const paymentIndex = db.payments.findIndex((p) => p.id === paymentId);

  if (paymentIndex === -1) {
    return res.status(404).json({ error: "Payment installment ledger not found." });
  }

  const payment = db.payments[paymentIndex];

  // If customer, check ownership
  if (req.user.role !== "ADMIN") {
    const alloc = db.allocations.find((a) => a.id === payment.propertyAllocationId);
    if (!alloc || alloc.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You cannot pay this invoice." });
    }
  }

  // Simulate payment processing
  const updatedPayment = {
    ...payment,
    amountPaid: payment.amountDue, // full payment
    status: "PAID" as const,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.payments[paymentIndex] = updatedPayment;

  // Issue transaction invoice receipt automatically
  const invNum = `EHP-INV-${Date.now().toString().slice(-6)}`;
  const newInvoice = {
    id: `inv-${Date.now()}`,
    paymentId,
    invoiceNum: invNum,
    pdfUrl: `https://elitehomes.com/vault/invoices/inv_receipt_${invNum}.pdf`,
    issuedAt: new Date().toISOString(),
  };

  db.invoices.push(newInvoice);
  db.save();

  // Retrieve allocation customer payload
  const allocDetail = db.allocations.find((a) => a.id === payment.propertyAllocationId);
  if (allocDetail) {
    triggerNotification(
      allocDetail.userId,
      "Payment Received Successfully",
      `Thank you! Receipt ${invNum} of value INR ${(payment.amountDue).toLocaleString()} was settled successfully for Installment #${payment.installmentNumber}.`
    );
  }

  res.json({
    message: "Transaction cleared successfully",
    payment: updatedPayment,
    invoice: newInvoice,
  });
});

// POST /api/payments (Admin adds payment milestone ledger - Admin only)
app.post("/api/payments", authenticateToken, requireAdmin, (req: any, res) => {
  const { propertyAllocationId, installmentNumber, amountDue, dueDate } = req.body;

  if (!propertyAllocationId || !installmentNumber || !amountDue || !dueDate) {
    return res.status(400).json({ error: "Missing arguments. Allocation, Installment #, Amount, and Due date elements required." });
  }

  const newPayment = {
    id: `pay-${Date.now()}`,
    propertyAllocationId,
    installmentNumber: Number(installmentNumber),
    amountDue: Number(amountDue),
    amountPaid: 0,
    dueDate: new Date(dueDate).toISOString(),
    status: "PENDING" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.payments.push(newPayment);
  db.save();

  const allocation = db.allocations.find((a) => a.id === propertyAllocationId);
  if (allocation) {
    triggerNotification(
      allocation.userId,
      "New Installment Milestone Added",
      `The builder scheduled an Installment Milestone (#${installmentNumber}) totaling INR ${(Number(amountDue)).toLocaleString()} due on ${new Date(dueDate).toLocaleDateString()}.`
    );
  }

  logAdminAction(req.user.id, "ADD_PAYMENT_LEDGER", `Logged payment installment scheduled against Allocation ID ${propertyAllocationId}`);

  res.status(201).json(newPayment);
});

// GET /api/payments/invoices
app.get("/api/payments/invoices", authenticateToken, (req: any, res) => {
  if (req.user.role === "ADMIN") {
    res.json(db.invoices);
  } else {
    // Get allocations first
    const userAllocations = db.allocations.filter((a) => a.userId === req.user.id);
    const allocIds = userAllocations.map((a) => a.id);
    const userPayments = db.payments.filter((p) => allocIds.includes(p.propertyAllocationId));
    const payIds = userPayments.map((p) => p.id);
    const userInvoices = db.invoices.filter((i) => payIds.includes(i.paymentId));
    res.json(userInvoices);
  }
});


// --- PROGRESS GALLERY & MEDIA ---

app.get("/api/media", authenticateToken, (req: any, res) => {
  if (req.user.role === "ADMIN") {
    res.json(db.media);
  } else {
    // Customer fetches corresponding allocation
    const userAllocations = db.allocations.filter((a) => a.userId === req.user.id);
    const propertyIds = userAllocations.map((a) => a.propertyId);
    const matchingMedia = db.media.filter((m) => propertyIds.includes(m.propertyId));
    res.json(matchingMedia);
  }
});

// POST /api/media (Admin adds progress updates)
app.post("/api/media", authenticateToken, requireAdmin, (req: any, res) => {
  const { propertyId, type, url, title, caption } = req.body;

  if (!propertyId || !type || !url || !title) {
    return res.status(400).json({ error: "Missing core parameters: Property ID, type, Media URL, and title designation." });
  }

  const newMedia = {
    id: `med-${Date.now()}`,
    propertyId,
    type,
    url,
    title,
    caption: caption || "",
    uploadedAt: new Date().toISOString(),
  };

  db.media.unshift(newMedia);
  db.save();

  // Notify any allocated customers
  const affectedAllocations = db.allocations.filter((a) => a.propertyId === propertyId);
  affectedAllocations.forEach((alloc) => {
    triggerNotification(
      alloc.userId,
      "New Construction Gallery Update",
      `The construction crew uploaded a new video/photo update for your plot: "${title}"`
    );
  });

  logAdminAction(req.user.id, "ADD_MEDIA_UPDATE", `Added ${type} timeline card: "${title}" for property ${propertyId}`);

  res.status(201).json(newMedia);
});


// --- ADMIN EXTRA CHANNELS (CUSTOMERS LIST / ALLOCATOR) ---

// GET /api/admin/customers (Admin list of client users)
app.get("/api/admin/customers", authenticateToken, requireAdmin, (req, res) => {
  // Aggregate customers list with their corresponding property allocations
  const customerList = db.users.filter((u) => u.role === "CUSTOMER").map((user) => {
    const allocations = db.allocations.filter((a) => a.userId === user.id);
    const propertyDetails = allocations.map((a) => {
      const prop = db.properties.find((p) => p.id === a.propertyId);
      return prop ? { id: prop.id, plotNumber: prop.plotNumber, location: prop.location } : null;
    }).filter(Boolean);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || "No phone added",
      createdAt: user.createdAt,
      allocations: propertyDetails,
    };
  });

  res.json(customerList);
});

// POST /api/admin/allocations (Allocate plot property to customer - ADMIN only)
app.post("/api/admin/allocations", authenticateToken, requireAdmin, (req: any, res) => {
  const { userId, propertyId } = req.body;

  if (!userId || !propertyId) {
    return res.status(400).json({ error: "Required fields: User ID and Property ID." });
  }

  const existingAllocation = db.allocations.find((a) => a.userId === userId && a.propertyId === propertyId);
  if (existingAllocation) {
    return res.status(400).json({ error: "This customer is already allocated to this specific property." });
  }

  const newAllocation = {
    id: `alloc-${Date.now()}`,
    userId,
    propertyId,
    allocatedAt: new Date().toISOString(),
  };

  db.allocations.push(newAllocation);
  db.save();

  const userObj = db.users.find((u) => u.id === userId);
  const propObj = db.properties.find((p) => p.id === propertyId);

  if (userObj && propObj) {
    triggerNotification(
      userId,
      "New Property Allocated",
      `Congratulations! Premium property plot ${propObj.plotNumber} has been officially allocated to your legal portal workspace.`
    );
    logAdminAction(req.user.id, "ALLOCATE_PROPERTY", `Allocated plot "${propObj.plotNumber}" to client customer "${userObj.name}"`);
  }

  res.status(201).json(newAllocation);
});


// --- NOTIFICATIONS ---

app.get("/api/notifications", authenticateToken, (req: any, res) => {
  const filtered = db.notifications.filter((n) => n.userId === req.user.id);
  res.json(filtered);
});

app.post("/api/notifications/:id/read", authenticateToken, (req: any, res) => {
  const notifId = req.params.id;
  const nIndex = db.notifications.findIndex((n) => n.id === notifId && n.userId === req.user.id);

  if (nIndex !== -1) {
    db.notifications[nIndex].isRead = true;
    db.save();
    return res.json({ success: true, notification: db.notifications[nIndex] });
  }

  res.status(404).json({ error: "Notification ledger element not found." });
});

// Admin-only system status/logs
app.get("/api/admin/logs", authenticateToken, requireAdmin, (req, res) => {
  const logs = db.adminLogs.map((log) => {
    const adminUser = db.users.find((u) => u.id === log.adminId);
    return {
      ...log,
      adminName: adminUser ? adminUser.name : "System Operator",
    };
  });
  res.json(logs);
});


// ==========================================
// GEMINI INTELLIGENT COMPLIANCE AI AGENT
// ==========================================

// POST /api/ai/chat
app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
  const { message, previousChatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Prompt message request parameters required." });
  }

  if (!geminiApiKey) {
    return res.status(503).json({
      error: "AI support is currently in offline mode (Gemini API Key was not set). Please provide GEMINI_API_KEY inside Settings > Secrets.",
    });
  }

  try {
    // Aggregate contextual ground data to make the AI extremely knowledgeable about the user's files and plot details
    const currUser = db.users.find((u) => u.id === req.user.id);
    const userAllocations = db.allocations.filter((a) => a.userId === req.user.id);
    const propertyIds = userAllocations.map((a) => a.propertyId);
    const userProperties = db.properties.filter((p) => propertyIds.includes(p.id));
    const userDocs = db.documents.filter((d) => d.userId === req.user.id);
    const allocIds = userAllocations.map((a) => a.id);
    const userPayments = db.payments.filter((p) => allocIds.includes(p.propertyAllocationId));

    // Construct detailed context
    const customerName = currUser ? currUser.name : "Valued Customer";
    const propertiesDetail = userProperties
      .map(
        (p) =>
          `- ${p.plotNumber} situated at "${p.location}". Size is ${p.plotSize}. Phase: "${p.projectPhase}". Construction status: ${p.constructionStatus}% complete. Amenities: ${p.amenities.join(", ")}.`
      )
      .join("\n");

    const documentsDetail = userDocs
      .map((d) => `- File: "${d.name}" (${d.type}), Status: [${d.status}]. Core remarks: "${d.remarks || "No remarks loaded"}".`)
      .join("\n");

    const paymentsDetail = userPayments
      .map(
        (p) =>
          `- Installment Milestone #${p.installmentNumber}: INR ${(p.amountDue).toLocaleString()} (Paid: INR ${(p.amountPaid).toLocaleString()}). Status: [${p.status}]. Due by: ${new Date(
            p.dueDate
          ).toLocaleDateString()}.`
      )
      .join("\n");

    // Formulate core guidelines instruction prompt for safety, customer assurance, and direct transparency
    const systemPrompt = `You are "Elite Homes TrustBot", an expert full-stack virtual compliance counselor and real estate consultant.
Your sole assignment is to answer users' technical, legal, financial, and construction milestones queries dynamically and help REDUCE REPETITIVE CALLS.
Use a professional, warm, transparent, and authoritative developer persona. Avoid any false promises, hype, or clinical developer details.

--- CURRENT SECURE WORKSPACE DETAILS FOR THIS SESSION ---
Authorized Customer name: ${customerName} (User ID: ${req.user.id})

ALLOCATED PROPERTY DETAILS:
${propertiesDetail || "No properties allocated yet. Contact administrator Eleanor Vance."}

DOCUMENTATION & FILE VAULT AUDIT TRAIL:
${documentsDetail || "No files uploaded yet."}

PAYMENT MILESTONE SCHEDULE LIST:
${paymentsDetail || "No installments mapped."}

--- POLICY CONSULTING GUIDELINE DIRECTIVES ---
1. Be fully transparent. If a document's status represents "REJECTED" or "UNDER_REVIEW", explain exactly what that state means (e.g. Under review means a registrar audit is auditing stamp receipts, rejected means a re-upload of higher clarity is required).
2. Answer details about standard real estate terms if asked (e.g., Soil reports evaluate loading weights to guard foundation cracks; Sale Deeds transfer official parcel titles; legal title clearances protect against ancestral lien claims).
3. Always pull figures directly from the structured payment list provided above. Do not hallucinate paid balances.
4. If a user asks about finishing dates or complex revisions, advise them that they can initiate digital re-uploads directly via their dashboard or reach out to Administrator Eleanor Vance at admin@elitehomes.com.
5. Answer in beautiful, readable, bold-nested markdown. Keep the response succinct to avoid scroll exhaustion!`;

    // Initialize generative session with previous history to sustain continuous support conversations
    const systemInstruction = systemPrompt;
    
    // Map previous user-AI messages to structured parts
    const chatParts: any[] = [];
    if (previousChatHistory && Array.isArray(previousChatHistory)) {
      previousChatHistory.forEach((msg: any) => {
        chatParts.push({
          role: msg.sender === "USER" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }
    
    // Append the newly submitted user prompt
    chatParts.push({
      role: "user",
      parts: [{ text: message }],
    });

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatParts,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const textOutput = result.text || "No response received. Please try submitting again.";
    res.json({ text: textOutput });
  } catch (err: any) {
    console.error("Gemini Compliance model failure:", err);
    res.status(500).json({ error: "System failed of processing request: " + err.message });
  }
});


// ==========================================
// VITE AND STATIC ENVIRONMENT SERVING
// ==========================================

// In production, build output is in 'dist/'
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Vite dev server integration
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    app.get("*", (req, res, next) => {
      // Direct asset queries can pass to standard express static channels
      if (req.url.startsWith("/api")) {
        return next();
      }
      next();
    });
  });
}

// Bind to port 3000 and standard 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[EliteHomes Trust Portal Gateway] Live on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
});
