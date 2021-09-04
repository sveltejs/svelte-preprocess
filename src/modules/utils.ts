import { existsSync } from 'fs';
import { dirname, join, parse } from 'path';

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
export async function hasDepInstalled(dep: string) {
  if (cachedResult[dep] != null) {
    return cachedResult[dep];
  }

  let result = false;

  try {
    await import(dep);

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

// finds a existing path up the tree
export function findUp({ what, from }) {
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
export function setProp(obj, keyList, val) {
  let i = 0;

  for (; i < keyList.length - 1; i++) {
    const key = keyList[i];

    if (typeof obj[key] !== 'object') {
      obj[key] = {};
    }

    obj = obj[key];
  }

  obj[keyList[i]] = val;
}

export const javascriptReservedKeywords = new Set([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);
