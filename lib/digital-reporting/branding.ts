import { createHash } from "node:crypto";
import sharp from "sharp";
export type ClientLogo = {
  pngBase64: string;
  sha256: string;
  filename: string;
};
export const maxLogoUploadBytes = 2 * 1024 * 1024;
/** Uploaded pixels only: no URL fetching, SVG execution or external image references. */
export async function normalizeClientLogo(
  bytes: Buffer,
  filename: string,
): Promise<ClientLogo> {
  if (!bytes.length || bytes.length > maxLogoUploadBytes)
    throw new Error("Choose a logo smaller than 2 MB.");
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WEBP";
  if (!png && !jpeg && !webp)
    throw new Error("Use a PNG, JPG or WebP image for the customer logo.");
  const image = sharp(bytes, { limitInputPixels: 4_000_000, animated: false });
  const metadata = await image.metadata();
  if (
    !["png", "jpeg", "webp"].includes(metadata.format ?? "") ||
    !metadata.width ||
    !metadata.height
  )
    throw new Error("The logo could not be read.");
  let normalized = await image
    .rotate()
    .resize({
      width: 1000,
      height: 500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  for (const [width, height] of [
    [800, 400],
    [600, 300],
    [400, 200],
  ]) {
    if (normalized.length <= 350000) break;
    normalized = await sharp(normalized)
      .resize({ width, height, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  }
  if (normalized.length > 350000)
    throw new Error(
      "This logo is too large after processing. Choose a simpler or smaller logo.",
    );
  return {
    pngBase64: normalized.toString("base64"),
    sha256: createHash("sha256").update(normalized).digest("hex"),
    filename:
      filename.replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 150) ||
      "customer-logo.png",
  };
}
