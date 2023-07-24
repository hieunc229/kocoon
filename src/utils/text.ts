
export function formatClassName(name: string) {
  return name.replace(/(\/|:)/g, "_").replace(/\*/g, "_any_");
}
