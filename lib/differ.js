import {
  forEach,
  reduce,
  isArray
} from 'min-dash';

import {
  DiffPatcher
} from 'diffpatch';

import ChangeHandler from './change-handler';


export default function Differ() { }


Differ.prototype.createDiff = function(a, b) {

  // create a configured instance, match objects by name
  var diffpatcher = new DiffPatcher({
    objectHash: function(obj) {
      return obj.id || JSON.stringify(obj);
    },
    propertyFilter: function(name, context) {
      return name !== '$instanceOf';
    }
  });

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
          } else
          if (moved) {
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