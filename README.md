# 🏢 Enterprise Customer Trust Portal for Real Estate

A production-grade, stateful full-stack transparency platform designed to build unshakable buyer confidence, eliminate repetitive support inquires by up to 75%, and provide unified real-time tracking for property locations, document review steppers, installment ledgers, and construction updates.

This platform couples a **React 19 + Tailwind v4 + Lucide** frontend with a **Node.js + Express** backend, backed by an atomic, relational JSON persistence engine and a **Gemini 3.5 AI Compliance Counselor** that answers complex legal and financial questions using live user datasets.

---

## 🗺️ System Architecture

The platform is designed following the classic **model-view-controller (MVC)** separation of concerns combined with recursive **Context Grounding** for our AI services:

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT-SIDE BROWSER                                 |
|                                                                                   |
|  +------------------------+  +--------------------------+  +-------------------+  |
|  |     OVERVIEW HUB       |  |     DOCUMENT TRACKER     |  |   COMPLIANCE AI   |  |
|  |  Plot metrics & bills  |  |  Milestone Review Steps  |  | Grounded Advisor  |  |
|  +-----------+------------+  +------------+-------------+  +---------+---------+  |
|              |                            |                          |            |
+--------------|----------------------------|--------------------------|------------+
               | Secure API Calls           | Uploads File             | Chat Query
               v                            v                          v
+--------------|----------------------------|--------------------------|------------+
|              |                            |                          |            |
|  +-----------v------------+  +------------v-------------+  +---------v---------+  |
|  |       Auth Filter      |  |     Validation Audits    |  | Context Grounder  |  |
|  |   JWT token verify     |  |   Status History Logs    |  |  Gemini 3.5 API   |  |
|  +-----------+------------+  +------------+-------------+  +---------+---------+  |
|              |                            |                          |            |
|              +--------------------+-------+--------------------------+            |
|                                   | (Transactional CRUD)                          |
|                                   v                                               |
|                      +--------------------------+                                 |
|                      |  Stateful Schemas Store  |                                 |
|                      |   data/db_store.json    |                                 |
|                      +--------------------------+                                 |
|                                                                                   |
|                               SERVER-SIDE EXPRESS HOST                             |
+-----------------------------------------------------------------------------------+
```

1. **Authentication Gatekeeper**: Filters incoming authorization headers, validating JWT claims.
2. **Relational Schemas Store**: A thread-safe, mock SQL transaction layer simulating atomic writes to keep records stateful between hot restarts.
3. **Gemini Grounding Engine**: Before dispatching prompts to **gemini-3.5-flash**, the route controller aggregates the caller's plot indices, active billing registers, and documentation statuses into the model's system metadata, preventing hallucinations and restricting access boundaries.

---

## 🗄️ Database Design (PostgreSQL / Prisma ORM)

Below is the production-grade entity structure declared inside `prisma/schema.prisma`. All relations map logically to represent real-world construction allocations.

### Entity Relationship Mapping

```
 [User] 1 -------- * [PropertyAllocation] 1 -------- * [Payment] 1 -------- * [Invoice]
   1                      1
   |                      |
   * [Document]           * [Property] 1 -------- * [MediaProgress (Engineer Photo)]
   1
   |
   * [DocumentStatusHistory] (Audit Audit Trail)
```

### Prisma Schema Definitions
```prisma
model User {
  id              String             @id @default(uuid())
  email           String             @unique
  passwordHash    String
  name            String
  phone           String?
  role            Role               @default(CUSTOMER)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  isDeleted       Boolean            @default(false)
  
  allocations     PropertyAllocation[]
  documents       Document[]
  notifications   Notification[]
}

model Property {
  id                 String               @id @default(uuid())
  plotNumber         String               @unique
  plotSize           String               
  location           String
  googleMapsUrl      String?
  projectPhase       String               
  amenities          String[]             
  constructionStatus Int                  
  brochureUrl        String?
  legalClearance     Boolean              @default(true)
  createdAt          DateTime             @default(now())

  allocations        PropertyAllocation[]
  media              Media[]
}

model PropertyAllocation {
  id            String    @id @default(uuid())
  userId        String
  propertyId    String
  allocatedAt   DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
  property      Property  @relation(fields: [propertyId], references: [id])
  payments      Payment[]
}

model Document {
  id            String               @id @default(uuid())
  userId        String
  name          String               
  type          String               
  fileUrl       String
  status        DocumentStatus       @default(UPLOADED)
  remarks       String?
  uploadedAt    DateTime             @default(now())

  user          User                 @relation(fields: [userId], references: [id])
  statusHistory DocumentStatusHistory[]
}
```

---

## 🛣️ API Endpoint Architecture

| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers new customer/admin profiles, hashing keys with bcryptjs | Public |
| **POST** | `/api/auth/login` | Authenticates certificates and dispenses Signed JWT access tokens | Public |
| **GET** | `/api/auth/me` | Validates active authorization header and serves credentials profile | Customer / Admin |
| **GET** | `/api/properties` | Customers review their active property. Admins receive all registered plots | Customer / Admin |
| **POST** | `/api/properties` | Registers a new structural land layout | Admin Only |
| **PUT** | `/api/properties/:id` | Revises active milestones and adjusts completion progress gauges | Admin Only |
| **GET** | `/api/documents` | Inspects uploaded draft deeds, tax certifications, and soil reviews | Customer / Admin |
| **POST** | `/api/documents/upload` | Simulated uploading that hooks static storage references on database | Customer / Admin |
| **PATCH** | `/api/documents/:id/status` | Logs document state progress and alerts users | Admin Only |
| **GET** | `/api/payments` | Serves balance schedules, due milestones, and unpaid items | Customer / Admin |
| **POST** | `/api/payments/:id/pay` | Processes booking balances statefully and stamps invoice receipts | Customer / Admin |
| **POST** | `/api/ai/chat` | Leverages Gemini 3.5 to consult users on legal and financial metrics | Customer |

---

## 📂 Enterprise Folder Hierarchy

```
├── data/
│   └── db_store.json            # Reliable JSON Relational Persistence store
├── prisma/
│   └── schema.prisma            # Production Database Blueprints
├── src/
│   ├── components/
│   │   ├── AIExplanationAssistant.tsx  # Grounded Gemini chat widget interface
│   │   ├── ConstructionGallery.tsx     # Lightboxed photo timeline logs
│   │   └── AdminPortal.tsx             # Interactive administrator update cockpit
│   ├── types.ts                 # Clean global domain models
│   ├── App.tsx                  # Client router & navigation root
│   ├── index.css                # Global CSS imports including Tailwind
│   └── main.tsx                 # Core rendering engine
├── .env.example                 # Config setup instruction variables
├── metadata.json                # Declared app coordinates and API scopes
├── server.ts                    # Stateful Master Gateway Server (Express + Vite)
├── tsconfig.json                # TypeScript builder configurations
└── vite.config.ts               # Vite asset pack bundle coordinates
```

---

## 🔒 Security Compliance Matrix

1. **Role-Based Authorization Filters**: Every sensitive route executes an `authenticateToken` validator. Operations like altering validation review statuses or scheduling payments are locked behind an admin privilege checker.
2. **Cryptographic Key Security**: Sensitive passwords are never stored in plain sight. They undergo salted, one-way encryption passes utilizing **bcryptjs**.
3. **Sealed API Architecture**: The **GEMINI_API_KEY** remains anchored in our backend env workspace. The client communicates solely via proxied `/api/ai/chat` routes, preventing key leak exposures in browser sources.
4. **Rate and Payload Protections**: Body parsers limit incoming base64 document elements to `50MB` to prevent memory exhaustion, while cross-origin boundaries block unauthorized scraper domains.

---

## ⚙️ Setting Up & Running Locally

Ensure Node.js v18+ is installed on your local computer.

### 1. File Installs
```bash
npm install
```

### 2. Configure Local Keys
Create a local `.env` inside the workspace root:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
```
*(Get a key instantly at https://ai.google.dev/)*

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to **http://localhost:3000** to preview the layout securely.

### 4. Build for Production
To bundle assets and transpile the Express gateway:
```bash
npm run build
npm start
```

---

## 🏆 Demonstrating Core Transparency Features (Interactive Demo Steps!)

To make testing painless, the login gate incorporates instant pre-fill buttons:

*   **Audit Document reviews on the fly**:
    1. Click **Admin Eleanor** and sign in.
    2. Go to **Document Vault Reviews** tab. Notice John Doe has a document `Government Property Registration Receipt` labeled `UNDER_REVIEW`.
    3. Click **Approve** and supply audit remarks in the browser pop-up.
    4. Sign out. Click **Customer Doe** and sign in. Go to the dashboard. You'll observe the file status has shifted statefully.
*   **Release Payment Milestones**:
    1. Sign in as **Customer Doe**.
    2. Go to the **Payment Ledger Milestones** tab. You'll see his Installment #3 marked as `OVERDUE`.
    3. Click the **Settle Due** button. The installment shifts instantly to **PAID**, outstanding totals adjust, and an official download receipt code `INV-...` is generated.
*   **Ground-Correct Chat Explanations**:
    1. Click the **Consult Gemini AI** tab.
    2. Submit: *"Why is my registered copy draft pending?"* or *"How much is my remaining balance?"*
    3. The model reviews your active database records statefully, detailing the EXACT figures and remarks stored on the server!
