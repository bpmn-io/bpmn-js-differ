/* eslint no-cond-assign: 0 */

function is(element, type) {
  return element.$instanceOf(type);
}

function isAny(element, types) {
  return types.some(function(t) {
    return is(element, t);
  });
}

function isDi(element) {
  return isAny(element, [
    'bpmndi:BPMNEdge',
    'bpmndi:BPMNShape'
  ]);
}

function getTrackedProcessVisual(processElement) {

  var definitions = processElement.$parent;

  var collaboration = definitions.rootElements.find(function(el) {
    return is(el, 'bpmn:Collaboration');
  });

  // we track the process, too
  if (!collaboration) {
    return {
      element: processElement,
      property: ''
    };
  }

  var participant = collaboration.participants.find(function(el) {
    return el.processRef === processElement;
  });

  return participant && {
    element: participant,
    property: 'processRef.'
  };
}

function isTracked(element) {

  // a bpmn:FlowElement without visual representation
  if (is(element, 'bpmn:DataObject')) {
    return false;
  }

  // track referencing bpmn:Participant instead of
  // bpmn:Process in collaboration diagrams
  if (is(element, 'bpmn:Process')) {
    return getTrackedProcessVisual(element);
  }

  var track = isAny(element, [
    'bpmn:Participant',
    'bpmn:Collaboration',
    'bpmn:FlowElement',
    'bpmn:SequenceFlow',
    'bpmn:MessageFlow',
    'bpmn:Participant',
    'bpmn:Lane',
    'bpmn:DataAssociation'
  ]);

  if (track) {
    return {
      element: element,
      property: ''
    };
  }
}

export default function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}


ChangeHandler.prototype.removed = function(model, property, element, idx) {

  var tracked;

  if (tracked = isTracked(element)) {
    if (!this._removed[tracked.element.id]) {
      this._removed[tracked.element.id] = element;
    }
  } else

  if (tracked = isTracked(model)) {
    this.changed(tracked.element, tracked.property + property + '[' + idx + ']', null, element);
  } else

  if (isDi(model) && property === 'waypoint') {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }
};

ChangeHandler.prototype.changed = function(model, property, newValue, oldValue) {

  var tracked;

  if (isDi(model)) {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  } else

  if (tracked = isTracked(model)) {
    var changed = this._changed[tracked.element.id];

    if (!changed) {
      changed = this._changed[tracked.element.id] = { model: model, attrs: { } };
    }

    if (oldValue !== undefined || newValue !== undefined) {
      changed.attrs[property] = { oldValue: oldValue, newValue: newValue };
    }
  }
};

ChangeHandler.prototype.added = function(model, property, element, idx) {

  var tracked;

  if (tracked = isTracked(element)) {
    if (!this._added[tracked.element.id]) {
      this._added[tracked.element.id] = element;
    }
  } else

  if (tracked = isTracked(model)) {
    this.changed(tracked.element, tracked.property + property + '[' + idx + ']', element, null);
  } else

  if (isDi(model) && property === 'waypoint') {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }
};

ChangeHandler.prototype.moved = function(model, property, oldIndex, newIndex) {
  // noop
};
