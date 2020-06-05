let cachedResult: boolean;

export async function hasPostCssInstalled() {
  if (cachedResult != null) {
    return cachedResult;
  }

  let result = false;

  try {
    await import('postcss');
    result = true;
  } catch (e) {
    result = false;
  }

  return (cachedResult = result);
}
