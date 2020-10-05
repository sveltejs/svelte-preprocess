import sade from 'sade';

import pkg from '../../package.json';

const prog = sade('svelte-preprocess');

prog.version(pkg.version);

prog.parse(process.argv);
