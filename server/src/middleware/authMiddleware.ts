import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";

interface DecodedToken extends JwtPayload {
  sub: string;
  "custom:role"?: string;
}

interface AuthUser {
  id: string;
  role: UserRole;
}

type UserRole = "admin" | "accounts" | "staff";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

let jwksCache: { [kid: string]: string } | null = null;

async function getPem(kid: string): Promise<string> {
  if (!process.env.COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_AWS_REGION) {
    throw new Error("Missing COGNITO_USER_POOL_ID or NEXT_PUBLIC_AWS_REGION environment variables");
  }

  if (!jwksCache) {
    const jwksUrl = `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
    try {
      const response = await axios.get(jwksUrl);
      jwksCache = {};
      response.data.keys.forEach((jwk: any) => {
        jwksCache![jwk.kid] = jwkToPem(jwk);
      });
    } catch (error) {
      throw new Error(`Failed to fetch JWKS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const pem = jwksCache[kid];
  if (!pem) {
    throw new Error(`No matching JWK for kid: ${kid}`);
  }
  return pem;
}

export const authMiddleware = (allowedRoles: UserRole[], allowUnauthenticated = false) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

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
      const decodedHeader = jwt.decode(token, { complete: true }) as { header: { kid: string } } | null;
      if (!decodedHeader?.header?.kid) {
        throw new Error("Invalid token: Missing key ID (kid)");
      }

      // Verify token with JWKS
      const pem = await getPem(decodedHeader.header.kid);
      const decoded = jwt.verify(token, pem, { algorithms: ["RS256"] }) as DecodedToken;

      if (!decoded["custom:role"]) {
        throw new Error("Invalid token: Missing custom:role attribute");
      }

      const userRole = decoded["custom:role"].toLowerCase() as UserRole;
      const validRoles: UserRole[] = ["admin", "accounts", "staff"];
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
    } catch (err) {
      console.error("authMiddleware: Failed to verify token:", err);
      if (allowUnauthenticated) {
        req.user = undefined;
        console.log("authMiddleware: Invalid token, proceeding as unauthenticated");
        return next();
      }
      res.status(401).json({ message: `Unauthorized: Invalid token - ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  };
};