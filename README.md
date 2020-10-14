# bpmn-js-differ

[![Build Status](https://travis-ci.com/bpmn-io/bpmn-js-differ.svg?branch=master)](https://travis-ci.com/bpmn-io/bpmn-js-differ)

A semantic diffing utility for BPMN 2.0 files. To be used together with [bpmn-moddle](https://github.com/bpmn-io/bpmn-moddle).


## Usage

Get the project via [npm](http://npmjs.org):

```
npm install --save bpmn-js-differ
```

Use the differ to compare two BPMN 2.0 documents:

```javascript
import { diff } from 'bpmn-js-differ';

var oldDefinitions, newDefinitions; // read with bpmn-moddle

var changes = diff(oldDefinitions, newDefinitions);
```

The diff returns an object with the `_changed`, `_added`, `_removed`, `_layoutChanged` keys containing all differences between the models.

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
import BpmnModdle from 'bpmn-moddle';

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
NB: Diagram loading has changed as of version 7.0.0 of bpmn-moddle. The method `fromXML` now returns a promise and no longer uses the callback structure.
Thus, you can do the following to load a diagram that can then be supplied to `diff` as one of its argument:

```javascript
import BpmnModdle from 'bpmn-moddle';

async function loadModel(diagramXML){
    try {
        var loadedResult = await new BpmnModdle().fromXML(diagramXML);
        return loadedResult.rootElement;
    } catch(err){
        console.log('something went wrong!');
    }
}
```

## Visual Diffing

Use [bpmn-js](https://github.com/bpmn-io/bpmn-js) along with [element coloring](https://github.com/bpmn-io/bpmn-js-examples/tree/master/colors) to build your [visual diff tool](https://demo.bpmn.io/diff) on top of this utility.


## License

MIT
