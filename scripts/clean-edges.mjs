import sharp from "sharp";
import { readFile, rename } from "fs/promises";
import { removeBackground } from "@imgly/background-removal-node";

const originalPath = "attached_assets/WhatsApp_Image_2026-02-09_at_14.26.06_1770640748127.jpeg";
const outputPath = "client/src/assets/imaad-portrait.png";

const BG_R = 38, BG_G = 38, BG_B = 38;

async function main() {
  console.log("Step 1: Getting background mask...");
  const inputBuffer = await readFile(originalPath);
  const blob = new Blob([inputBuffer], { type: "image/jpeg" });

  const resultBlob = await removeBackground(blob, {
    output: { format: "image/png" }
  });
  const maskBuffer = Buffer.from(await resultBlob.arrayBuffer());

  console.log("Step 2: Extracting alpha channel as mask...");
  const { data: maskData, info: maskInfo } = await sharp(maskBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = maskInfo;

  const alphaChannel = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = maskData[i * 4 + 3];
  }

  console.log("Step 3: Eroding mask gently (1px only)...");
  const eroded = Buffer.alloc(width * height);
  const erodeRadius = 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (alphaChannel[idx] < 128) {
        eroded[idx] = 0;
        continue;
      }
      let minAlpha = 255;
      for (let dy = -erodeRadius; dy <= erodeRadius; dy++) {
        for (let dx = -erodeRadius; dx <= erodeRadius; dx++) {
          if (Math.abs(dy) + Math.abs(dx) > erodeRadius) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            minAlpha = Math.min(minAlpha, alphaChannel[ny * width + nx]);
          } else {
            minAlpha = 0;
          }
        }
      }
      eroded[idx] = minAlpha > 128 ? 255 : 0;
    }
  }

  console.log("Step 4: Compositing with smooth alpha blend...");
  const { data: origData } = await sharp(originalPath)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurRadius = 2;
  const blurred = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += eroded[ny * width + nx];
            count++;
          }
        }
      }
      blurred[y * width + x] = Math.round(sum / count);
    }
  }

  const output = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const alpha = blurred[i] / 255;

      const r = origData[i * 4];
      const g = origData[i * 4 + 1];
      const b = origData[i * 4 + 2];

      output[i * 4]     = Math.round(r * alpha + BG_R * (1 - alpha));
      output[i * 4 + 1] = Math.round(g * alpha + BG_G * (1 - alpha));
      output[i * 4 + 2] = Math.round(b * alpha + BG_B * (1 - alpha));
      output[i * 4 + 3] = 255;
    }
  }

  await sharp(output, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath + ".tmp");

  await rename(outputPath + ".tmp", outputPath);
  console.log("Done! Clean edges with no white outline.");
}

main().catch(console.error);
