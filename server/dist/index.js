"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("./middleware/authMiddleware");
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const emailRoutes_1 = __importDefault(require("./routes/emailRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const clientExpenseRoutes_1 = __importDefault(require("./routes/clientExpenseRoutes"));
const operationalExpenseRoutes_1 = __importDefault(require("./routes/operationalExpenseRoutes"));
const auditLogRoutes_1 = __importDefault(require("./routes/auditLogRoutes"));
const proofFileRoutes_1 = __importDefault(require("./routes/proofFileRoutes"));
const socketServer_1 = require("./sockets/socketServer");
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const accountsRoutes_1 = __importDefault(require("./routes/accountsRoutes"));
const staffRoutes_1 = __importDefault(require("./routes/staffRoutes"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const payments_1 = __importDefault(require("./routes/payments"));
const bankAccounts_1 = __importDefault(require("./routes/bankAccounts"));
const cashAccountRoutes_1 = __importDefault(require("./routes/cashAccountRoutes"));
const authorsRoutes_1 = __importDefault(require("./routes/authorsRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const qrCodeRoutes_1 = __importDefault(require("./routes/qrCodeRoutes"));
const appSettingsRoutes_1 = __importDefault(require("./routes/appSettingsRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const stickyNotesRoutes_1 = __importDefault(require("./routes/stickyNotesRoutes"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = (0, socketServer_1.setupSocketServer)(httpServer);
const prisma = new client_1.PrismaClient();
function testDB() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.$connect();
            const result = yield prisma.$queryRawUnsafe("SELECT current_database(), inet_server_addr();");
            console.log("✅ Connected to PostgreSQL!");
            console.log("📊 DB Info:", result);
        }
        catch (error) {
            console.error("❌ Failed to connect to DB", error);
        }
    });
}
testDB();
console.log("🛢️ DB URL:", process.env.DATABASE_URL);
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use((0, morgan_1.default)("common"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    res.send("This is home route");
});
// Routes
app.use("/users", (0, authMiddleware_1.authMiddleware)(["admin"]), userRoutes_1.default);
app.use("/contacts", contactRoutes_1.default);
app.use("/admin", adminRoutes_1.default);
app.use("/email", emailRoutes_1.default);
app.use("/chat", (0, authMiddleware_1.authMiddleware)(["accounts", "staff", "admin"], true), (0, chatRoutes_1.default)(io));
app.use("/blogs", blogRoutes_1.default);
app.use("/client-expenses", clientExpenseRoutes_1.default);
app.use("/operational-expenses", operationalExpenseRoutes_1.default);
app.use("/audit-logs", auditLogRoutes_1.default);
app.use("/accounts", accountsRoutes_1.default);
app.use("/staff", staffRoutes_1.default);
app.use("/proof-files", proofFileRoutes_1.default);
app.use("/suppliers", supplierRoutes_1.default);
app.use("/banks-accounts", bankAccounts_1.default);
app.use("/cash-accounts", cashAccountRoutes_1.default);
app.use("/transactions", transactions_1.default);
app.use("/payments", payments_1.default);
app.use("/authors", authorsRoutes_1.default);
app.use("/attendance", attendanceRoutes_1.default);
app.use("/qr-code", qrCodeRoutes_1.default);
app.use("/settings", appSettingsRoutes_1.default);
app.use("/clients", clientRoutes_1.default);
app.use("/invoices", invoiceRoutes_1.default);
app.use("/stickynotes", stickyNotesRoutes_1.default);
httpServer.listen(Number(process.env.PORT) || 3002, "0.0.0.0", () => {
    console.log(`Server + WebSocket running on port ${process.env.PORT || 3001}`);
});
// Graceful shutdown
process.on("SIGTERM", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("SIGTERM received. Closing Prisma client...");
    yield prisma.$disconnect();
    process.exit(0);
}));
