import nodeResolve from '@rollup/plugin-node-resolve';

import pkg from './package.json';

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    external: [ 'min-dash' ],
    plugins: pgl()
  }
];


function pgl(plugins = []) {

  return [
    nodeResolve(),
    ...plugins
  ];
}