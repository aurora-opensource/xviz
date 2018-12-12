import fs from 'fs';
import sharp from 'sharp';

function getResizeDimension(width, height, maxWidth, maxHeight) {
  const ratio = width / height;

  let resizeWidth = null;
  let resizeHeight = null;

  if (maxHeight > 0 && maxWidth > 0) {
    resizeWidth = Math.min(maxWidth, maxHeight * ratio);
    resizeHeight = Math.min(maxHeight, maxWidth / ratio);
  } else if (maxHeight > 0) {
    resizeWidth = maxHeight * ratio;
    resizeHeight = maxHeight;
  } else if (maxWidth > 0) {
    resizeWidth = maxWidth;
    resizeHeight = maxWidth / ratio;
  } else {
    resizeWidth = width;
    resizeHeight = height;
  }

  return {
    resizeWidth: Math.floor(resizeWidth),
    resizeHeight: Math.floor(resizeHeight)
  };
}

// preserve aspect ratio
export async function resizeImage(filePath, maxWidth, maxHeight) {
  const metadata = await getImageMetadata(filePath);
  const {width, height} = metadata;

  let imageData = null;
  const {resizeWidth, resizeHeight} = getResizeDimension(width, height, maxWidth, maxHeight);

  if (resizeWidth === width && resizeHeight === height) {
    imageData = fs.readFileSync(filePath);
  } else {
    imageData = await sharp(filePath)
      .resize(resizeWidth, resizeHeight)
      .max()
      .toBuffer()
      .then(data => data);
  }

  return {
    width: resizeWidth,
    height: resizeHeight,
    data: imageData
  };
}

export async function getImageMetadata(filePath) {
  return await sharp(filePath).metadata();
}
