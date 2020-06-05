import { dirname } from 'path';

/** Paths used by preprocessors to resolve @imports */
export function getIncludePaths(fromFilename: string, base: string[] = []) {
  return [
    ...new Set([...base, 'node_modules', process.cwd(), dirname(fromFilename)]),
  ];
}
