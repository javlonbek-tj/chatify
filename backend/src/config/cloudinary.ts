import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ENV } from './env';

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<UploadResult> {
  const isImage = mimeType.startsWith('image/');
  const folder = isImage ? 'chatify/images' : 'chatify/files';
  const resourceType = isImage ? 'image' : 'raw';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));

        resolve({
          url: result.secure_url,
          name: originalName,
          size: result.bytes,
          mimeType,
        });
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}
