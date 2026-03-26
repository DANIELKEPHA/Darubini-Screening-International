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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = exports.s3Client = void 0;
// src/lib/s3.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
exports.s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const uploadToS3 = (file, fileName, mimeType) => __awaiter(void 0, void 0, void 0, function* () {
    const key = `proof-files/${(0, uuid_1.v4)()}-${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: mimeType,
        // REMOVED: ACL: ObjectCannedACL.public_read → This causes the error!
        // Modern S3 buckets disable ACLs by default (recommended & secure)
    });
    yield exports.s3Client.send(command);
    // Direct S3 URL — works fine if your bucket allows public reads OR you're behind auth
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
    // Alternative (more accurate): use region in URL
    // const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    return { key, url };
});
exports.uploadToS3 = uploadToS3;
