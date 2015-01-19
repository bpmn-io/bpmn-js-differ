# bpmn-js-differ

[![Build Status](https://travis-ci.org/bpmn-io/bpmn-js-differ.svg)](https://travis-ci.org/bpmn-io/bpmn-js-differ)

A diffing utility for BPMN 2.0 documents. To be used together with [bpmn-moddle](https://github.com/bpmn-io/bpmn-moddle).


## Usage

Get the project via [npm](http://npmjs.org):

```
npm install --save bpmn-js-differ
```

Use the differ to compare two BPMN 2.0 documents:

```javascript
var Differ = require('bpmn-js-differ');

var oldDefinitions, newDefinitions; // read with bpmn-moddle

var changes = Differ.diff(oldDefinitions, newDefinitions);
```

The differ returns an object with the `_changed`, `_added`, `_remove`, `_layoutChanged` keys containing all differences between the models.

```javascript
console.log(changes._changed);
// {
//   ServiceTask_1: {
//     model: { $type: 'bpmn:ServiceTask', id: 'ServiceTask_1', ... },
//     attrs: { name: { oldValue: '', newValue: 'T' } }
//   }
// }

console.log(changes._removed);
// {
//   SequenceFlow_1: { $type: 'bpmn:SequenceFlow', id: 'SequenceFlow_1' }
// }

console.log(changes._layoutChanged);
// {
//   StartEvent_1: { $type: 'bpmn:StartEvent', id: 'StartEvent_1' }
// }

console.log(changes._added);
// {
//   Participant_1: { $type: 'bpmn:Participant', id: 'Participant_1' }
// }
```

## Reading BPMN 2.0 documents

Get [bpmn-moddle](https://github.com/bpmn-io/bpmn-moddle) via npm:

```
npm install --save bpmn-moddle
```

Load two diagrams:

```javascript
var BpmnModdle = require('bpmn-moddle');

function loadModels(a, b) {

  new BpmnModdle().fromXML(a, function(err, adefs) {

    if (err) {
      return done(err);
    }

    new BpmnModdle().fromXML(b, function(err, bdefs) {
      if (err) {
        return done(err);
      } else {
        return done(null, adefs, bdefs);
      }
    });
  });
}


loadModels(aXML, bXML, function(err, aDefinitions, bDefinitions) {

  // go ahead and use the models
});
```


## License

MIT
