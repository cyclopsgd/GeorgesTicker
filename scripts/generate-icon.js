const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [16, 32, 48, 64, 128, 256, 512];
const buildDir = path.join(__dirname, '..', 'build');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient blue
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4F46E5');  // Indigo
  gradient.addColorStop(1, '#7C3AED');  // Purple

  // Rounded rectangle background
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw checkmark
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Checkmark path
  const startX = size * 0.2;
  const startY = size * 0.5;
  const midX = size * 0.4;
  const midY = size * 0.7;
  const endX = size * 0.8;
  const endY = size * 0.3;

  ctx.moveTo(startX, startY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

// Create ICO file manually (ICO format structure)
function createIco(pngBuffers) {
  // ICO header: 6 bytes
  // Image directory entries: 16 bytes each
  // Image data: PNG data for each image

  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;

  // Calculate total size
  let totalSize = headerSize + dirSize;
  const imageOffsets = [];

  for (const buf of pngBuffers) {
    imageOffsets.push(totalSize);
    totalSize += buf.length;
  }

  const icoBuffer = Buffer.alloc(totalSize);
  let offset = 0;

  // ICO Header
  icoBuffer.writeUInt16LE(0, offset); offset += 2;      // Reserved
  icoBuffer.writeUInt16LE(1, offset); offset += 2;      // Image type: 1 = ICO
  icoBuffer.writeUInt16LE(numImages, offset); offset += 2; // Number of images

  // Image directory entries
  const imageSizes = [16, 32, 48, 256]; // Standard ICO sizes
  for (let i = 0; i < numImages; i++) {
    const size = imageSizes[i] || 256;
    const width = size >= 256 ? 0 : size;  // 0 means 256
    const height = size >= 256 ? 0 : size;

    icoBuffer.writeUInt8(width, offset); offset += 1;           // Width
    icoBuffer.writeUInt8(height, offset); offset += 1;          // Height
    icoBuffer.writeUInt8(0, offset); offset += 1;               // Color palette
    icoBuffer.writeUInt8(0, offset); offset += 1;               // Reserved
    icoBuffer.writeUInt16LE(1, offset); offset += 2;            // Color planes
    icoBuffer.writeUInt16LE(32, offset); offset += 2;           // Bits per pixel
    icoBuffer.writeUInt32LE(pngBuffers[i].length, offset); offset += 4; // Image size
    icoBuffer.writeUInt32LE(imageOffsets[i], offset); offset += 4;      // Image offset
  }

  // Image data
  for (const buf of pngBuffers) {
    buf.copy(icoBuffer, offset);
    offset += buf.length;
  }

  return icoBuffer;
}

async function main() {
  console.log('Generating app icons...');

  // Generate PNGs for different sizes
  for (const size of sizes) {
    const buffer = generateIcon(size);
    const pngPath = path.join(buildDir, `icon-${size}.png`);
    fs.writeFileSync(pngPath, buffer);
    console.log(`Generated ${pngPath}`);
  }

  // Generate main icon.png (256x256) - used by electron-builder
  const mainIconBuffer = generateIcon(256);
  fs.writeFileSync(path.join(buildDir, 'icon.png'), mainIconBuffer);
  console.log('Generated icon.png');

  // Generate ICO file with multiple sizes
  try {
    const icoPngs = [
      fs.readFileSync(path.join(buildDir, 'icon-16.png')),
      fs.readFileSync(path.join(buildDir, 'icon-32.png')),
      fs.readFileSync(path.join(buildDir, 'icon-48.png')),
      fs.readFileSync(path.join(buildDir, 'icon-256.png')),
    ];

    const icoBuffer = createIco(icoPngs);
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
    console.log('Generated icon.ico');
  } catch (err) {
    console.error('Error generating ICO:', err);
  }

  console.log('Icon generation complete!');
}

main().catch(console.error);
