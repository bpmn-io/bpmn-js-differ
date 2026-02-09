import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

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
  {
    languageOptions: {
      ecmaVersion: 2025
    },
    files: files.test
  }
];