function isDi(element) {
  return (
    element.$instanceOf('bpmndi:BPMNEdge') ||
    element.$instanceOf('bpmndi:BPMNShape')
  );
}

function isTracked(element) {
  return (
    !element.$instanceOf('bpmn:DataObject')
  ) && (
    element.$instanceOf('bpmn:FlowElement') ||
    element.$instanceOf('bpmn:SequenceFlow') ||
    element.$instanceOf('bpmn:MessageFlow') ||
    element.$instanceOf('bpmn:Participant') ||
    element.$instanceOf('bpmn:Lane') ||
    element.$instanceOf('bpmn:DataAssociation')
  );
}

export default function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}


ChangeHandler.prototype.removed = function(model, property, element, idx) {
  if (isTracked(element)) {
    this._removed[element.id] = element;
  } else

  if (isDi(model) && property === 'waypoint') {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }
};

ChangeHandler.prototype.changed = function(model, property, newValue, oldValue) {

  if (isDi(model)) {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  } else

  if (isTracked(model)) {
    var changed = this._changed[model.id];

    if (!changed) {
      changed = this._changed[model.id] = { model: model, attrs: { } };
    }

    if (oldValue !== undefined || newValue !== undefined) {
      changed.attrs[property] = { oldValue: oldValue, newValue: newValue };
    }
  }
};

ChangeHandler.prototype.added = function(model, property, element, idx) {
  if (isTracked(element)) {
    this._added[element.id] = element;
  } else

  if (isDi(model) && property === 'waypoint') {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }
};

ChangeHandler.prototype.moved = function(model, property, oldIndex, newIndex) {
  // noop
};
