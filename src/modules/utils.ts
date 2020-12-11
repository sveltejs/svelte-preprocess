import { dirname } from 'path';

export async function importAny(...modules: string[]) {
  try {
    const mod = await modules.reduce(
      (acc, moduleName) => acc.catch(() => import(moduleName)),
      Promise.reject(),
    );

    return mod;
  } catch (e) {
    throw new Error(`Cannot find any of modules: ${modules}\n\n${e}`);
  }
}

export function concat(...arrs: any[]): any[] {
  return arrs.reduce((acc: [], a) => {
    if (a) {
      return acc.concat(a);
    }

    return acc;
  }, []);
}

/** Paths used by preprocessors to resolve @imports */
export function getIncludePaths(fromFilename: string, base: string[] = []) {
  return [
    ...new Set([...base, 'node_modules', process.cwd(), dirname(fromFilename)]),
  ];
}

const cachedResult: Record<string, boolean> = {};

/**
 * Checks if a package is installed.
 *
 * @export
 * @param {string} dep
 * @returns boolean
 */
export function hasDepInstalled(dep: string) {
  if (cachedResult[dep] != null) {
    return cachedResult[dep];
  }

  let result = false;

  try {
    require(dep);

    result = true;
  } catch (e) {
    result = false;
  }

  return (cachedResult[dep] = result);
}

const REMOTE_SRC_PATTERN = /^(https?:)?\/\//;

export function isValidLocalPath(path: string) {
  return (
    path.match(REMOTE_SRC_PATTERN) == null &&
    // only literal strings allowed
    !path.startsWith('{') &&
    !path.endsWith('}')
  );
}
