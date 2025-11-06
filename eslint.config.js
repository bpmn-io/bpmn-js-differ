import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

import babelParser from '@babel/eslint-parser';

const files = {
  lib: [
    'lib/**/*.js'
  ],
  test: [
    'test/**/*.js'
  ],
  ignored: [
    'dist'
  ]
};

export default [
  {
    'ignores': files.ignored
  },

  // build + test
  ...bpmnIoPlugin.configs.node.map(config => {

    return {
      ...config,
      ignores: files.lib
    };
  }),

  // lib
  ...bpmnIoPlugin.configs.recommended.map(config => {

    return {
      ...config,
      files: files.lib
    };
  }),

  // test
  ...bpmnIoPlugin.configs.mocha.map(config => {

    return {
      ...config,
      files: files.test
    };
  }),

  // other
  // hook up babel parser
  {
    files: [ '**/*.js', '**/*.mjs' ],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          plugins: [
            '@babel/plugin-syntax-import-attributes'
          ]
        },
      }
    }
  }
];