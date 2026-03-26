import { Request, Response } from "express";
import {Prisma, PrismaClient} from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma = new PrismaClient();

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const user = await prisma.user.findUnique({
      where: { cognitoId },
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res
        .status(500)
        .json({ message: `Error retrieving user: ${error.message}` });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cognitoId, name, email, phoneNumber } = req.body;

    // Validate required fields
    if (cognitoId && (typeof cognitoId !== 'string' || cognitoId.trim() === '')) {
      res.status(400).json({ message: 'Invalid cognitoId: must be a non-empty string if provided' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'Missing or invalid required field: name must be a non-empty string' });
      return;
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: 'Missing or invalid required field: email must be a valid email address' });
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber: phoneNumber || null,
      },
    });

    res.status(201).json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      // Unique constraint violation (e.g., duplicate cognitoId)
      res.status(409).json({ message: `User with cognitoId ${req.body.cognitoId} already exists` });
      return;
    }
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    const updateUser = await prisma.user.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updateUser);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating user: ${error.message}` });
  }
};



