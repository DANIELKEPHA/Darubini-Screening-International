import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./middleware/authMiddleware";
import contactRoutes from "./routes/contactRoutes";
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import chatRoutes from "./routes/chatRoutes";
import emailRoutes from "./routes/emailRoutes";
import blogRoutes from "./routes/blogRoutes";
import clientExpenseRoutes from "./routes/clientExpenseRoutes";
import operationalExpenseRoutes from "./routes/operationalExpenseRoutes";
import auditLogRoutes from "./routes/auditLogRoutes";
import proofFileRoutes from "./routes/proofFileRoutes";
import { setupSocketServer } from "./sockets/socketServer";
import supplierRoutes from "./routes/supplierRoutes";
import accountsRoutes from "./routes/accountsRoutes";
import staffRoutes from "./routes/staffRoutes";
import transactions from "./routes/transactions";
import payments from "./routes/payments";
import bankAccounts from "./routes/bankAccounts";
import cashAccountRoutes from "./routes/cashAccountRoutes";
import authorsRoutes from "./routes/authorsRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import qrCodeRoutes from "./routes/qrCodeRoutes";
import appSettingsRoutes from "./routes/appSettingsRoutes";
import clientRoutes from "./routes/clientRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import stickyNotesRoutes from "./routes/stickyNotesRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import leavePoliciesRoutes from "./routes/leavePoliciesRoutes";
import currencyRoutes from "./routes/currencyRoutes";

const app = express();
const httpServer = createServer(app);
const io = setupSocketServer(httpServer);
const prisma = new PrismaClient();

async function testDB() {
  try {
    await prisma.$connect();

    const result = await prisma.$queryRawUnsafe(
        "SELECT current_database(), inet_server_addr();"
    );

    console.log("✅ Connected to PostgreSQL!");
    console.log("📊 DB Info:", result);

  } catch (error) {
    console.error("❌ Failed to connect to DB", error);
  }
}

testDB();

console.log("🛢️ DB URL:", process.env.DATABASE_URL);

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("This is home route");
});

// Routes
app.use("/users", authMiddleware(["admin"]), userRoutes);
app.use("/contacts", contactRoutes);
app.use("/admin", adminRoutes);
app.use("/email", emailRoutes);
app.use("/chat", authMiddleware(["accounts", "staff", "admin"], true), chatRoutes(io));
app.use("/blogs", blogRoutes);
app.use("/client-expenses", clientExpenseRoutes);
app.use("/operational-expenses", operationalExpenseRoutes);
app.use("/audit-logs", auditLogRoutes);
app.use("/accounts", accountsRoutes);
app.use("/staff", staffRoutes);
app.use("/proof-files", proofFileRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/banks-accounts", bankAccounts);
app.use("/cash-accounts", cashAccountRoutes);
app.use("/transactions", transactions);
app.use("/payments", payments);
app.use("/authors", authorsRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/leaves", leaveRoutes);
app.use("/leave-policies", leavePoliciesRoutes);
app.use("/qr-code", qrCodeRoutes);
app.use("/currencies", currencyRoutes);
app.use("/settings", appSettingsRoutes);
app.use("/clients", clientRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/stickynotes", stickyNotesRoutes);

httpServer.listen(Number(process.env.PORT) || 3002, "0.0.0.0", () => {
  console.log(`Server + WebSocket running on port ${process.env.PORT || 3001}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing Prisma client...");
  await prisma.$disconnect();
  process.exit(0);
});