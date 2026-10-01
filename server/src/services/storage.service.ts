import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../middlewares/AppError.js";
import {
  getDownloadUrlExpiresInSeconds,
  getUploadUrlExpiresInSeconds,
} from "../config/storage.js";

type B2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: B2Config | null = null;

const getB2Config = (): B2Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const accessKeyId = process.env.B2_APPLICATION_KEY_ID?.trim();
  const secretAccessKey = process.env.B2_APPLICATION_KEY?.trim();
  const bucketName = process.env.B2_BUCKET_NAME?.trim();
  const region = process.env.B2_REGION?.trim();
  const endpoint = process.env.B2_ENDPOINT?.trim();

  if (!accessKeyId || !secretAccessKey || !bucketName || !region || !endpoint) {
    throw new AppError("File storage is not configured", 503);
  }

  cachedConfig = {
    accessKeyId,
    secretAccessKey,
    bucketName,
    region,
    endpoint,
  };

  return cachedConfig;
};

const getS3Client = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getB2Config();

  // Backblaze B2 S3-compatible API (reuse AWS SDK).
  // Avoid forcePathStyle + flexible checksums that commonly break B2 signatures.
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  return cachedClient;
};

export const createPresignedUploadUrl = async (input: {
  storageKey: string;
  mimeType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; expiresIn: number }> => {
  const config = getB2Config();
  const client = getS3Client();
  const expiresIn = getUploadUrlExpiresInSeconds();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: input.storageKey,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl, expiresIn };
};

export const createPresignedDownloadUrl = async (input: {
  storageKey: string;
  fileName: string;
}): Promise<{ downloadUrl: string; expiresIn: number }> => {
  const config = getB2Config();
  const client = getS3Client();
  const expiresIn = getDownloadUrlExpiresInSeconds();

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: input.storageKey,
    ResponseContentDisposition: `inline; filename="${input.fileName.replace(/"/g, "")}"`,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn });

  return { downloadUrl, expiresIn };
};

export const objectExists = async (storageKey: string): Promise<boolean> => {
  const config = getB2Config();
  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      }),
    );
    return true;
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "$metadata" in error &&
      typeof (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode === "number"
        ? (error as { $metadata: { httpStatusCode: number } }).$metadata
            .httpStatusCode
        : undefined;

    if (status === 404) {
      return false;
    }

    throw new AppError("Unable to verify uploaded file in storage", 502);
  }
};

export const deleteObject = async (storageKey: string): Promise<void> => {
  const config = getB2Config();
  const client = getS3Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      }),
    );
  } catch {
    throw new AppError("Unable to delete file from storage", 502);
  }
};
