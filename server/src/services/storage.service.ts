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

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: R2Config | null = null;

const getR2Config = (): R2Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    throw new AppError("File storage is not configured", 503);
  }

  cachedConfig = {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  };

  return cachedConfig;
};

const getS3Client = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getR2Config();

  cachedClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
};

export const createPresignedUploadUrl = async (input: {
  storageKey: string;
  mimeType: string;
  fileSize: number;
}): Promise<{ uploadUrl: string; expiresIn: number }> => {
  const config = getR2Config();
  const client = getS3Client();
  const expiresIn = getUploadUrlExpiresInSeconds();

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: input.storageKey,
    ContentType: input.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return { uploadUrl, expiresIn };
};

export const createPresignedDownloadUrl = async (input: {
  storageKey: string;
  fileName: string;
}): Promise<{ downloadUrl: string; expiresIn: number }> => {
  const config = getR2Config();
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
  const config = getR2Config();
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
  const config = getR2Config();
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
