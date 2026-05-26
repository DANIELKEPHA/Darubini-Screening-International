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
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const jwk_to_pem_1 = __importDefault(require("jwk-to-pem"));
let jwksCache = null;
function getPem(kid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_AWS_REGION) {
            throw new Error("Missing COGNITO_USER_POOL_ID or NEXT_PUBLIC_AWS_REGION environment variables");
        }
        if (!jwksCache) {
            const jwksUrl = `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
            try {
                const response = yield axios_1.default.get(jwksUrl);
                jwksCache = {};
                response.data.keys.forEach((jwk) => {
                    jwksCache[jwk.kid] = (0, jwk_to_pem_1.default)(jwk);
                });
            }
            catch (error) {
                throw new Error(`Failed to fetch JWKS: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        const pem = jwksCache[kid];
        if (!pem) {
            throw new Error(`No matching JWK for kid: ${kid}`);
        }
        return pem;
    });
}
const authMiddleware = (allowedRoles, allowUnauthenticated = false) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const authHeader = req.headers.authorization;
        const token = (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer ")) ? authHeader.split(" ")[1] : null;
        console.log(`authMiddleware: token=${token ? "present" : "missing"}, path=${req.path}, allowedRoles=${allowedRoles}`);
        if (!token) {
            if (allowUnauthenticated) {
                req.user = undefined;
                console.log("authMiddleware: No token, proceeding as unauthenticated");
                return next();
            }
            console.log("authMiddleware: No token, rejecting");
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        try {
            if (!process.env.COGNITO_USER_POOL_ID || !process.env.COGNITO_CLIENT_ID) {
                console.error("authMiddleware: Missing COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID");
                res.status(500).json({ message: "Server configuration error: Missing required environment variables" });
                return;
            }
            // Decode token to get kid
            const decodedHeader = jsonwebtoken_1.default.decode(token, { complete: true });
            if (!((_a = decodedHeader === null || decodedHeader === void 0 ? void 0 : decodedHeader.header) === null || _a === void 0 ? void 0 : _a.kid)) {
                throw new Error("Invalid token: Missing key ID (kid)");
            }
            // Verify token with JWKS
            const pem = yield getPem(decodedHeader.header.kid);
            const decoded = jsonwebtoken_1.default.verify(token, pem, { algorithms: ["RS256"] });
            if (!decoded["custom:role"]) {
                throw new Error("Invalid token: Missing custom:role attribute");
            }
            const userRole = decoded["custom:role"].toLowerCase();
            const validRoles = ["admin", "accounts", "staff"];
            if (!validRoles.includes(userRole)) {
                throw new Error(`Invalid user role: ${userRole}`);
            }
            req.user = {
                id: decoded.sub,
                role: userRole,
            };
            console.log("authMiddleware: req.user set to", req.user);
            if (!allowedRoles.includes(userRole)) {
                console.log(`authMiddleware: Role ${userRole} not in allowedRoles [${allowedRoles.join(", ")}]`);
                res.status(403).json({ message: `Access Denied: Role ${userRole} not authorized for this resource` });
                return;
            }
            next();
        }
        catch (err) {
            console.error("authMiddleware: Failed to verify token:", err);
            if (allowUnauthenticated) {
                req.user = undefined;
                console.log("authMiddleware: Invalid token, proceeding as unauthenticated");
                return next();
            }
            res.status(401).json({ message: `Unauthorized: Invalid token - ${err instanceof Error ? err.message : "Unknown error"}` });
        }
    });
};
exports.authMiddleware = authMiddleware;
