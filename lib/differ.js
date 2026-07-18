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

export default function Differ() { }

const COLLECTION_ELEMENT_IDENTIFIERS = {
  'zeebe:ExecutionListener': [ 'eventType', 'type' ],
  'zeebe:Header': [ 'key' ],
  'zeebe:Input': [ 'target' ],
  'zeebe:LinkedResource': [ 'linkName', 'resourceId' ],
  'zeebe:Output': [ 'source' ],
  'zeebe:Property': [ 'name' ],
  'zeebe:TaskListener': [ 'eventType', 'type' ],
  'zeebe:UserTaskForm': [ 'id' ]
};

const UNIQUE_ELEMENT_TYPES = new Set([
  'bpmn:ExtensionElements',
  'bpmn:MultiInstanceLoopCharacteristics',
  'bpmn:StandardLoopCharacteristics'
]);

function isZeebeElement(element) {
  return /^zeebe:/.test(element.$type);
}

function getZeebeObjectHash(element) {
  const identifiers = COLLECTION_ELEMENT_IDENTIFIERS[element.$type];

  if (!identifiers) {
    return element.$type;
  }

  return [
    element.$type,
    ...identifiers.map(function(identifier) {
      return element[identifier] || '';
    })
  ].join('#');
}

Differ.prototype.createDiff = function(a, b) {

  // create a configured instance, match objects by name
  var diffpatcher = new DiffPatcher({
    objectHash: function(obj) {
      let hash;

      if (isZeebeElement(obj)) {
        hash = getZeebeObjectHash(obj);
      } else if (UNIQUE_ELEMENT_TYPES.has(obj.$type)) {
        hash = obj.$type;
      } else {
        hash = obj.id || JSON.stringify(obj);
      }

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