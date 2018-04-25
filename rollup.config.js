import hypothetical from 'rollup-plugin-hypothetical';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'lib/index.js',
    output: {
      name: 'BpmnJsDiffer',
      file: 'dist/bpmn-js-differ.umd.js',
      format: 'umd'
    },
    plugins: pgl()
  },
  {
    input: 'lib/index.js',
    output: {
      name: 'BpmnJsDiffer',
      file: 'dist/bpmn-js-differ.umd.min.js',
      format: 'umd'
    },
    plugins: pgl([
      uglify()
    ])
  },
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