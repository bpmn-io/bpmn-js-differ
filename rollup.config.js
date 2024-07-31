import nodeResolve from '@rollup/plugin-node-resolve';

import pkg from './package.json';

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg['exports']['.'].node, format: 'cjs' },
      { file: pkg['exports']['.'].import, format: 'es' }
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