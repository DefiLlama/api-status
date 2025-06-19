// we do this to force a reload of module each time we import it
export async function reImport(moduleName) {
  return (await import(moduleName + '?refresh=' + Date.now())).default
}