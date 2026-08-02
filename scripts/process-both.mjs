import sharp from "sharp";
import { readFile } from "fs/promises";
import { removeBackground } from "@imgly/background-removal-node";

const originalPath = "attached_assets/WhatsApp_Image_2026-02-09_at_15.11.17_1770642744401.jpeg";
const greyOutput = "client/src/assets/imaad-portrait.png";
const blackOutput = "client/src/assets/imaad-hero.png";

async function main() {
  console.log("Step 1: Removing background...");
  const inputBuffer = await readFile(originalPath);
  const blob = new Blob([inputBuffer], { type: "image/jpeg" });

  const resultBlob = await removeBackground(blob, {
    output: { format: "image/png" }
  });
  const maskBuffer = Buffer.from(await resultBlob.arrayBuffer());

  console.log("Step 2: Extracting alpha channel...");
  const { data: maskData, info: maskInfo } = await sharp(maskBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = maskInfo;

  const alphaChannel = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = maskData[i * 4 + 3];
  }

  console.log("Step 3: Loading original image data...");
  const { data: origData } = await sharp(originalPath)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log("Step 4: Blurring alpha for smooth edges...");
  const blurRadius = 2;
  const blurred = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += alphaChannel[ny * width + nx];
            count++;
          }
        }
      }
      blurred[y * width + x] = Math.round(sum / count);
    }
  }

  async function composite(bgR, bgG, bgB, outputPath) {
    const output = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const alpha = blurred[i] / 255;
        output[i * 4]     = Math.round(origData[i * 4] * alpha + bgR * (1 - alpha));
        output[i * 4 + 1] = Math.round(origData[i * 4 + 1] * alpha + bgG * (1 - alpha));
        output[i * 4 + 2] = Math.round(origData[i * 4 + 2] * alpha + bgB * (1 - alpha));
        output[i * 4 + 3] = 255;
      }
    }
    await sharp(output, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(outputPath);
    console.log(`  Saved: ${outputPath}`);
  }

  console.log("Step 5: Creating grey background version (About section)...");
  await composite(38, 38, 38, greyOutput);

  console.log("Step 6: Creating black background version (Hero section)...");
  await composite(0, 0, 0, blackOutput);

  console.log("Done!");
}

main().catch(console.error);
