// we do this to force a reload of module each time we import it
export async function reImport(moduleName) {
  return (await import(moduleName + '?refresh=' + Date.now())).default
}

export function hashString(str) {
  if (typeof str !== 'string') str = JSON.stringify(str)
    
  // Simple DJB2 hash function
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
    hash = hash & 0xFFFFFFFF; // Ensure 32bit integer
  }
  return hash.toString(16);

  // About DJB2:
  // DJB2 is a simple and fast non-cryptographic hash function created by Daniel J. Bernstein.
  // It is efficient for short strings and widely used for hash tables.
  // Downsides:
  // - Not suitable for cryptographic purposes (not secure).
  // - Higher risk of collisions compared to more complex hash functions.
  // - Not ideal for very large or highly similar datasets.
}
