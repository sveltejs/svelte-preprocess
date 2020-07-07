const cachedResult: Record<string, boolean> = {};

export async function hasDepInstalled(dep: string) {
  if (cachedResult[dep] != null) {
    return cachedResult[dep];
  }

  let result = false;

  try {
    await import(dep);

    result = true;
  } catch (e) {
    console.log(e);
    result = false;
  }

  return (cachedResult[dep] = result);
}
