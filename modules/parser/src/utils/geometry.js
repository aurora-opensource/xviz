// returns the centroid position for an array of points
export function getCentroid(polygon) {
  let sx = 0;
  let sy = 0;
  let sz = 0;

  let len = polygon.length;
  if (len === 1) {
    return polygon[0];
  }

  if (polygon[0] === polygon[len - 1]) {
    // the last vertex is the same as the first, ignore
    len -= 1;
  }

  for (let i = 0; i < len; i++) {
    const point = polygon[i];
    sx += point[0];
    sy += point[1];
    sz += point[2] || 0;
  }

  return [sx / len, sy / len, sz / len];
}
