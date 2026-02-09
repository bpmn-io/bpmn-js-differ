# bpmn-js-differ

[![CI](https://github.com/bpmn-io/bpmn-js-differ/actions/workflows/CI.yml/badge.svg)](https://github.com/bpmn-io/bpmn-js-differ/actions/workflows/CI.yml)

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

Load a diagram definition:

```javascript
import { BpmnModdle } from 'bpmn-moddle';

async function loadModel(diagramXML) {

  const bpmnModdle = new BpmnModdle();

  const { rootElement: definitionsA } = await bpmnModdle.fromXML(diagramXML),

  return rootElement;
}

const definitionsA = await loadModel(aXML);

// ...
// go ahead and use the model
```

## Visual Diffing

Use [bpmn-js](https://github.com/bpmn-io/bpmn-js) along with [element coloring](https://github.com/bpmn-io/bpmn-js-examples/tree/master/colors) to build your [visual diff tool](https://demo.bpmn.io/diff) on top of this utility.


## License

MIT
