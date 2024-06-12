import { existsSync } from 'fs';
import { dirname, join, parse } from 'path';

export function concat(...arrs: any[]): any[] {
  return arrs.reduce((acc: [], a) => {
    if (a) return acc.concat(a);

    return acc;
  }, []);
}

/** Paths used by preprocessors to resolve @imports */
export function getIncludePaths(fromFilename?: string, base: string[] = []) {
  if (fromFilename == null) return [];

  return [
    ...new Set([...base, 'node_modules', process.cwd(), dirname(fromFilename)]),
  ];
}

const depCheckCache: Record<string, boolean> = {};

/**
 * Checks if a package is installed.
 *
 * @export
 * @param {string} dep
 * @returns boolean
 */
export async function hasDepInstalled(dep: string) {
  if (depCheckCache[dep] != null) {
    return depCheckCache[dep];
  }

  let result = false;

  try {
    await import(dep);

    result = true;
  } catch (e) {
    result = false;
  }

  return (depCheckCache[dep] = result);
}

export function isValidLocalPath(path: string) {
  return path.startsWith('.');
}

// finds a existing path up the tree
export function findUp({ what, from }: { what: string; from: string }) {
  const { root, dir } = parse(from);
  let cur = dir;

  try {
    while (cur !== root) {
      const possiblePath = join(cur, what);

      if (existsSync(possiblePath)) {
        return possiblePath;
      }

      cur = dirname(cur);
    }
  } catch (e) {
    console.error(e);
  }

  return null;
}

// set deep property in object
export function setProp(obj: any, keyList: string[], value: any) {
  let i = 0;

  for (; i < keyList.length - 1; i++) {
    const key = keyList[i];

    if (typeof obj[key] !== 'object') {
      obj[key] = {};
    }

    obj = obj[key];
  }

  obj[keyList[i]] = value;
}
