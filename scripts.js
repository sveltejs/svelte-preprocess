const fs = require('fs');

/**
 * Cross-platform way to do `rm -rf` on a dir
 * @param {string} path
 */
function rimraf(path) {
  (fs.rmSync || fs.rmdirSync)(path, { recursive: true, force: true });
}

switch (process.argv[2]) {
  case 'rmrf':
    rimraf(process.argv[3]);
    break;
  default:
    console.error('no valid script command given');
    break;
}
