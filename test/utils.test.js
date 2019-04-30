const {requireAny} = require('../src/utils')

describe('utils - requireAny', () => {
  it('should throw error when none exist', () => {
    expect(() => {
      requireAny('_1', '_2')
    }).toThrow('_1,_2');
  })

  it('should not throw error when any exist', () => {
    expect(requireAny('_1', 'node-sass', '_2')).toBe(require('node-sass'));
  })
})