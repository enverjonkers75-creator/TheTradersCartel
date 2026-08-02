import { removeBackground } from "@imgly/background-removal-node";
import { readFile, writeFile } from "fs/promises";

const inputPath = "attached_assets/WhatsApp_Image_2026-02-09_at_14.26.06_1770640748127.jpeg";
const outputPath = "client/src/assets/imaad-portrait.png";

async function main() {
  console.log("Reading input image...");
  const inputBuffer = await readFile(inputPath);
  const blob = new Blob([inputBuffer], { type: "image/jpeg" });

  console.log("Removing background (this may take a minute)...");
  const resultBlob = await removeBackground(blob, {
    output: { format: "image/png" }
  });

  console.log("Saving result...");
  const arrayBuffer = await resultBlob.arrayBuffer();
  await writeFile(outputPath, Buffer.from(arrayBuffer));
  console.log(`Done! Saved to ${outputPath}`);
}

main().catch(console.error);
