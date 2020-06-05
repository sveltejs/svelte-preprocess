export function concat(...arrs: any[]): any[] {
  return arrs.reduce((acc: [], a) => {
    if (a) {
      return acc.concat(a);
    }

    return acc;
  }, []);
}
