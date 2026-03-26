// src/lib/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const uploadToS3 = async (
    file: Buffer,
    fileName: string,
    mimeType: string
): Promise<{ key: string; url: string }> => {
    const key = `proof-files/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: file,
        ContentType: mimeType,
        // REMOVED: ACL: ObjectCannedACL.public_read → This causes the error!
        // Modern S3 buckets disable ACLs by default (recommended & secure)
    });

    await s3Client.send(command);

    // Direct S3 URL — works fine if your bucket allows public reads OR you're behind auth
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
    // Alternative (more accurate): use region in URL
    // const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

    return { key, url };
};