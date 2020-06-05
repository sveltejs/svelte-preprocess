export async function importAny(...modules: string[]) {
  try {
    const mod = await modules.reduce(
      (acc, moduleName) => acc.catch(() => import(moduleName)),
      Promise.reject(),
    );

    return mod;
  } catch (e) {
    throw new Error(`Cannot find any of modules: ${modules}`);
  }
}
