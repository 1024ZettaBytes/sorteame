import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for S3-compatible services like MinIO/Railway
});

const bucket = process.env.S3_BUCKET!;

export async function uploadToS3(key: string, body: Buffer | ArrayBuffer, contentType: string) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body instanceof ArrayBuffer ? Buffer.from(body) : body,
      ContentType: contentType,
    })
  );
}

export async function getFromS3(key: string) {
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  return res;
}

export async function deleteFromS3(key: string) {
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

export function getImageKey(raffleId: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "jpg";
  const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `raffles/${raffleId}/${uniqueSuffix}.${ext}`;
}
