import {
  forEach,
  reduce,
  isArray
} from 'min-dash';

import {
  DiffPatcher
} from 'diffpatch';

import ChangeHandler from './change-handler.js';

import {
  moddleFilter,
  moddleDiffFilter
} from './filters.js';

import { is, isAny } from './util.js';

export default function Differ() { }

const UNIQUE_ELEMENTS = [
  'bpmn:ExtensionElements',
  'bpmn:MultiInstanceLoopCharacteristics',
  'bpmn:StandardLoopCharacteristics',
  'zeebe:AssignmentDefinition',
  'zeebe:CalledDecision',
  'zeebe:CalledElement',
  'zeebe:ExecutionListeners',
  'zeebe:FormDefinition',
  'zeebe:IoMapping',
  'zeebe:LoopCharacteristics',
  'zeebe:Properties',
  'zeebe:Subscription',
  'zeebe:TaskDefinition',
  'zeebe:TaskListeners',
  'zeebe:TaskHeaders',
  'zeebe:UserTask'
];

Differ.prototype.createDiff = function(a, b) {

  // create a configured instance, match objects by name
  var diffpatcher = new DiffPatcher({
    objectHash: function(obj) {
      console.log('get object hash for', obj.$type, obj);

      let hash;

      if (isAny(obj, UNIQUE_ELEMENTS)) {
        hash = obj.$type;
      } else if (is(obj, 'zeebe:Input')) {

        // we consider the target as unique identifier which will fail if multiple inputs target the same variable
        hash = obj.$type + '#' + obj.target;
      } else if (is(obj, 'zeebe:Output')) {

        // we consider the source as unique identifier which will fail if multiple outputs source the same variable
        hash = obj.$type + '#' + obj.source;
      } else if (is(obj, 'zeebe:ExecutionListener')) {

        // we consider the type as unique identifier which will fail if multiple execution listeners have the same type
        hash = obj.$type + '#' + obj.type;
      } else {
        hash = obj.id || JSON.stringify(obj);
      }

      console.log('object hash', hash);

      return hash;
    },
    propertyFilter: function(name, context) {
      return name !== '$instanceOf';
    }
  });

  // tag <moddle> elements as appropriate
  diffpatcher.processor.pipe('diff').after('trivial', moddleFilter);

  // handle moddle elements
  diffpatcher.processor.pipe('diff').after('objects', moddleDiffFilter);

  return diffpatcher.diff(a, b);
};


Differ.prototype.diff = function(a, b, handler) {

  handler = handler || new ChangeHandler();

  function walk(diff, model) {

    forEach(diff, function(d, key) {

      if (d._t !== 'a' && isArray(d)) {

        // take into account that collection properties are lazily
        // initialized; this means that adding to an empty collection
        // looks like setting an undefined variable to []
        //
        // ensure we detect this case and change it to an array diff
        if (isArray(d[0])) {

          d = reduce(d[0], function(newDelta, element, idx) {
            var prefix = d.length === 3 ? '_' : '';

            newDelta[prefix + idx] = [ element ];

            return newDelta;
          }, { _t: 'a' });
        }

      }


      // is array
      if (d._t === 'a') {

        forEach(d, function(val, idx) {

          if (idx === '_t') {
            return;
          }

          var removed = /^_/.test(idx),
              added = !removed && isArray(val),
              moved = removed && val[0] === '';

          idx = parseInt(removed ? idx.slice(1) : idx, 10);

          if (added || (removed && !moved)) {
            handler[removed ? 'removed' : 'added'](model, key, val[0], idx);
          } else if (moved) {
            handler.moved(model, key, val[1], val[2]);
          } else {
            walk(val, model[key][idx]);
          }
        });
      } else {
        if (isArray(d)) {
          handler.changed(model, key, d[0], d[1]);
        } else {
          handler.changed(model, key);
          walk(d, model[key]);
        }
      }
    });
  }

  var diff = this.createDiff(a, b);

  walk(diff, b, handler);

  return handler;
};