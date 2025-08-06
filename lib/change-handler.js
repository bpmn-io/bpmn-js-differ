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

function getTrackedProcessVisual(processElement) {

  const definitions = processElement.$parent;

  const collaboration = definitions.rootElements.find(function(el) {
    return is(el, 'bpmn:Collaboration');
  });

  // We track the process, too.
  if (!collaboration) {
    return {
      element: processElement,
      property: ''
    };
  }

  const participant = collaboration.participants.find(function(el) {
    return el.processRef === processElement;
  });

  return participant && {
    element: participant,
    property: 'processRef.'
  };
}

function isZeebeDetail(element) {
  return isAny(element, [
    'zeebe:IoMapping',
    'zeebe:Input',
    'zeebe:Output',
    'zeebe:ExecutionListener'
  ]);
}

function isSemanticElement(element) {
  return isAny(element, [
    'bpmn:Process',
    'bpmn:Participant',
    'bpmn:Collaboration',
    'bpmn:FlowElement',
    'bpmn:SequenceFlow',
    'bpmn:MessageFlow',
    'bpmn:Lane',
    'bpmn:DataAssociation'
  ]);
}

function getParentFlowElement(element) {
  if (isAny(element, [ 'bpmn:FlowElement', 'bpmn:Process' ])) {
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

ChangeHandler.prototype._isTracked = function(element) {

  // A bpmn:FlowElement without visual representation.
  if (is(element, 'bpmn:DataObject')) {
    return false;
  }

  // Track the referencing bpmn:Participant instead of
  // bpmn:Process in collaboration diagrams.
  if (is(element, 'bpmn:Process')) {
    return getTrackedProcessVisual(element);
  }

  if (isZeebeDetail(element)) {
    return {
      element: element,
      property: ''
    };
  }

  const tracked = isAny(element, [
    'bpmn:Participant',
    'bpmn:Collaboration',
    'bpmn:FlowElement',
    'bpmn:SequenceFlow',
    'bpmn:MessageFlow',
    'bpmn:Lane',
    'bpmn:DataAssociation'
  ]);

  if (tracked) {
    return {
      element: element,
      property: ''
    };
  }
};

/**
 * Compute a change ID for the given element. The ID should be unique per element.
 *
 * @param {any} element
 *
 * @return {string} change ID
 */
ChangeHandler.prototype._computeChangeId = function(element) {
  return element.id;
};

ChangeHandler.prototype._getChangeTarget = function(element) {
  const tracked = this._isTracked(element);

  if (tracked && (!isZeebeDetail(element) || this._isTracked !== ChangeHandler.prototype._isTracked)) {
    return tracked;
  }

  const parentFlowElement = getParentFlowElement(element);

  return parentFlowElement && this._isTracked(parentFlowElement);
};

ChangeHandler.prototype.removed = function(parentElement, propertyName, element, index) {
  const tracked = this._isTracked(element);

  if (tracked && (!isZeebeDetail(element) || this._isTracked !== ChangeHandler.prototype._isTracked)) {
    const id = this._computeChangeId(tracked.element);

    if (!this._removed[id]) {
      this._removed[id] = element;
    }
  } else if (this._getChangeTarget(parentElement)) {
    this.changed(parentElement, propertyName, element, null, index);
  } else if (isDi(parentElement) && propertyName === 'waypoint') {
    this._layoutChanged[this._computeChangeId(parentElement.bpmnElement)] = parentElement.bpmnElement;
  }
};

ChangeHandler.prototype.changed = function(element, propertyName, valueA, valueB, index) {
  if (isDi(element)) {
    this._layoutChanged[this._computeChangeId(element.bpmnElement)] = element.bpmnElement;
    return;
  }

  const target = this._getChangeTarget(element);

  if (!target || (valueA === undefined && valueB === undefined)) {
    return;
  }

  const id = this._computeChangeId(target.element);
  let changed = this._changed[id];

  if (!changed) {
    changed = this._changed[id] = {
      model: target.element,
      attrs: {}
    };
  }

  if (isSemanticElement(element) || (target.element === element && !target.property)) {
    const property = (target.property || '') + propertyName;
    const key = index === undefined ? property : `${property}[${index}]`;

    changed.attrs[key] = {
      oldValue: valueB,
      newValue: valueA
    };
    return;
  }

  const parentFlowElement = getParentFlowElement(element);
  let path = getPath(element, parentFlowElement);

  if (!path) {
    return;
  }

  if (target.property) {
    path = [ target.property.replace(/\.$/, ''), ...path ];
  }

  path = [ ...path, propertyName ];

  if (index !== undefined) {
    path.push(index);
  }

  const change = changed.attrs[ pathStringify(path) ] = {
    oldValue: valueA,
    newValue: valueB,
    element: element,
    path: path
  };

  if (index !== undefined) {
    change.index = index;
  }
};

ChangeHandler.prototype.added = function(parentElement, propertyName, element, index) {
  const tracked = this._isTracked(element);

  if (tracked && (!isZeebeDetail(element) || this._isTracked !== ChangeHandler.prototype._isTracked)) {
    const id = this._computeChangeId(tracked.element);

    if (!this._added[id]) {
      this._added[id] = element;
    }
  } else if (this._getChangeTarget(parentElement)) {
    if (isSemanticElement(parentElement)) {
      this.changed(parentElement, propertyName, element, null, index);
    } else {
      this.changed(parentElement, propertyName, null, element, index);
    }
  } else if (isDi(parentElement) && propertyName === 'waypoint') {
    this._layoutChanged[this._computeChangeId(parentElement.bpmnElement)] = parentElement.bpmnElement;
  }
};

ChangeHandler.prototype.moved = function(parentElement, propertyName, oldIndex, newIndex) {

  // noop
};

function getPath(moddleElement, parentModdleElement) {
  if (!moddleElement) {
    return null;
  }

  if (moddleElement === parentModdleElement) {
    return [];
  }

  let path = [];
  let parent;

  do {
    parent = moddleElement.$parent;

    if (!parent) {
      if (moddleElement.$instanceOf('bpmn:Definitions')) {
        break;
      }

      return null;
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
  for (const property of Object.values(parentModdleElement.$descriptor.propertiesByName)) {
    if (property.isMany) {
      if (parentModdleElement.get(property.name).includes(moddleElement)) {
        return [
          property.name,
          parentModdleElement.get(property.name).indexOf(moddleElement)
        ];
      }
    } else if (parentModdleElement.get(property.name) === moddleElement) {
      return [ property.name ];
    }
  }

  return [];
}

function pathStringify(path, separator = '.') {
  return path.reduce(function(result, segment) {
    if (Number.isInteger(segment)) {
      return `${result}[${segment}]`;
    }

    return result ? `${result}${separator}${segment}` : segment;
  }, '');
}
