import { importAny } from '../src/utils';

describe('utils - importAny', () => {
  it('should throw error when none exist', () => {
    return expect(importAny('_1', '_2')).rejects.toThrowError(
      'Cannot find any of modules: _1,_2'
    );
  });

  it('should not throw error when any exist', async () => {
    expect((await importAny('_1', 'node-sass', '_2')).default).toBe(
      require('node-sass'),
    );
  });
});
