import hypothetical from 'rollup-plugin-hypothetical';
import nodeResolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' }
    ],
    plugins: pgl()
  }
];


function pgl(plugins = []) {

  return [
    hypothetical({
      allowFallthrough: true,
      files: {
        'chalk': `
          export default null;
        `,
        'diff-match-patch': `
          export default null;
        `
      }
    }),
    nodeResolve(),
    ...plugins
  ];
}