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

const app = express();
const httpServer = createServer(app);
const io = setupSocketServer(httpServer);
const prisma = new PrismaClient();

async function testDB() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL!");
  } catch (error) {
    console.error("❌ Failed to connect to DB", error);
  }
}
testDB();

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
app.use("/users", authMiddleware(["user", "admin"]), userRoutes);
app.use("/contacts", contactRoutes);
app.use("/admin", adminRoutes);
app.use("/email", emailRoutes);
app.use("/chat", authMiddleware(["user", "accounts", "staff", "admin"], true), chatRoutes(io));
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
app.use("/qr-code", qrCodeRoutes);
app.use("/settings", appSettingsRoutes);
app.use("/clients", clientRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/stickynotes", stickyNotesRoutes);

httpServer.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () => {
  console.log(`Server + WebSocket running on port ${process.env.PORT || 3001}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing Prisma client...");
  await prisma.$disconnect();
  process.exit(0);
});