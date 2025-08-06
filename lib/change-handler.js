/* eslint no-cond-assign: 0 */

import {
  is,
  isAny
} from './util.js';

function isDi(element) {
  return isAny(element, [
    'bpmndi:BPMNEdge',
    'bpmndi:BPMNShape'
  ]);
}

const DEBUG = true;

function getTrackedProcessVisual(processElement) {

  var definitions = processElement.$parent;

  var collaboration = definitions.rootElements.find(function(el) {
    return is(el, 'bpmn:Collaboration');
  });

  // we track the process, too
  if (!collaboration) {
    return {
      element: processElement
    };
  }

  var participant = collaboration.participants.find(function(el) {
    return el.processRef === processElement;
  });

  return participant && {
    element: participant,
    property: participant.processRef
  };
}

function isTrackedElement(element) {

  // a bpmn:FlowElement without visual representation
  if (is(element, 'bpmn:DataObject')) {
    return false;
  }

  // track referencing bpmn:Participant instead of
  // bpmn:Process in collaboration diagrams
  if (is(element, 'bpmn:Process')) {
    return getTrackedProcessVisual(element);
  }

  if (isAny(element, [
    'zeebe:IoMapping',
    'zeebe:Input',
    'zeebe:Output',
    'zeebe:ExecutionListener',
  ])) {
    return {
      element
    };
  }

  if (isAny(element, [
    'bpmn:Participant',
    'bpmn:Collaboration',
    'bpmn:FlowElement',
    'bpmn:SequenceFlow',
    'bpmn:MessageFlow',
    'bpmn:Participant',
    'bpmn:Lane',
    'bpmn:DataAssociation'
  ])) {
    return {
      element
    };
  }
}

function getParentFlowElement(element) {
  if (isAny(element, ['bpmn:FlowElement', 'bpmn:Process'])) {
    return element;
  }

  if (!element.$parent) {
    return null;
  }

  return getParentFlowElement(element.$parent);
}

export default function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}

ChangeHandler.prototype.changed = function(element, propertyName, oldValue, newValue, index) {

  DEBUG && console.log('[changed] element:', printModdleElement(element), 'property name:', propertyName, 'newValue:', newValue, 'oldValue:', oldValue);

  let tracked = isTrackedElement(element);

  if (isDi(element)) {
    this._layoutChanged[element.bpmnElement.id] = element.bpmnElement;
  } else if (tracked) {
    const parentFlowElement = getParentFlowElement(element);

    let changed = this._changed[parentFlowElement.id];

    if (!changed) {
      changed = this._changed[parentFlowElement.id] = { element: parentFlowElement, properties: {} };
    }

    if (oldValue !== undefined || newValue !== undefined) {
      if (parentFlowElement !== element) {
        let path = getPath(element, parentFlowElement);

        path = [ ...path, propertyName ];
        
        if (index !== undefined) {
          path.push(index);
        }

        changed.properties[ pathStringify(path) ] = {
          oldValue,
          newValue,
          element,
          path
        };

        if (index !== undefined) {
          changed.properties[ pathStringify(path) ].index = index;
        }
      } else {
        changed.properties[propertyName] = { oldValue, newValue, path: [propertyName] };
      }
    }
  } else {
    DEBUG && console.log('ignoring change because not tracked', element, propertyName, newValue, oldValue);
  }
};

ChangeHandler.prototype.added = function(parentElement, propertyName, element, index) {

  DEBUG && console.log('[added] parent element:', printModdleElement(parentElement), 'property name:', propertyName, 'element:', printModdleElement(element), 'index:', index);

  const parentFlowElement = getParentFlowElement(element);

  const tracked = isTrackedElement(element);

  if (tracked && parentFlowElement === element) {
    if (!this._added[tracked.element.id]) {
      this._added[tracked.element.id] = tracked.element;
    }
  } else if (tracked && parentFlowElement !== element) {
    this.changed(parentElement, propertyName, null, element, index);
  } else if (isDi(parentElement) && propertyName === 'waypoint') {
    this._layoutChanged[parentElement.bpmnElement.id] = parentElement.bpmnElement;
  }
};

ChangeHandler.prototype.removed = function(parentElement, propertyName, element, index) {

  DEBUG && console.log('[removed] parent element:', printModdleElement(parentElement), 'property name:', propertyName, 'element:', printModdleElement(element), 'index:', index);

  const tracked = isTrackedElement(element);

  const parentFlowElement = getParentFlowElement(element);

  if (tracked && parentFlowElement === element) {
    if (!this._removed[tracked.element.id]) {
      this._removed[tracked.element.id] = tracked.element;
    }
  } else if (tracked && parentFlowElement !== element) {
    this.changed(parentElement, propertyName, element, null, index);
  } else if (isDi(parentElement) && propertyName === 'waypoint') {
    this._layoutChanged[parentElement.bpmnElement.id] = parentElement.bpmnElement;
  }
};

ChangeHandler.prototype.moved = function(parentElement, propertyName, oldIndex, newIndex) {

  DEBUG && console.log('[moved] parent element:', printModdleElement(parentElement), 'property name:', propertyName, 'oldIndex:', oldIndex, 'newIndex:', newIndex);

  // noop
};

function getPath(moddleElement, parentModdleElement) {
  if (!moddleElement) {
    return null;
  }

  if (moddleElement === parentModdleElement) {
    return [];
  }

  let path = [],
      parent;

  do {
    parent = moddleElement.$parent;

    if (!parent) {
      if (moddleElement.$instanceOf('bpmn:Definitions')) {
        break;
      } else {
        return null;
      }
    }

    path = [ ...getPropertyName(moddleElement, parent), ...path ];

    moddleElement = parent;

    if (parentModdleElement && moddleElement === parentModdleElement) {
      break;
    }
  } while (parent);

  return path;
}

function getPropertyName(moddleElement, parentModdleElement) {
  for (let property of Object.values(parentModdleElement.$descriptor.propertiesByName)) {
    if (property.isMany) {
      if (parentModdleElement.get(property.name).includes(moddleElement)) {
        return [
          property.name,
          parentModdleElement.get(property.name).indexOf(moddleElement)
        ];
      }
    } else {
      if (parentModdleElement.get(property.name) === moddleElement) {
        return [ property.name ];
      }
    }
  }

  return [];
}

function pathStringify(path, separator = '.') {
  if (path === null || path === undefined) {
    return null;
  }

  return path.join(separator);
}

function printModdleElement(model) {
  if (model.id) {
    return `${model.$type}#${model.id}`;
  }

  return model.$type;
}

function isFlowElement(element) {
  return isAny(element, [
    'bpmn:FlowElement',
    'bpmn:Process',
    'bpmn:Collaboration',
    'bpmn:Participant',
    'bpmn:Lane',
    'bpmn:DataAssociation'
  ]);
}