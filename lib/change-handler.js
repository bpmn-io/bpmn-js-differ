'use strict';


function isTracked(element) {
  return element.$instanceOf('bpmn:FlowElement') ||
         element.$instanceOf('bpmn:MessageFlow') ||
         element.$instanceOf('bpmn:Participant') ||
         element.$instanceOf('bpmn:Lane');
}

function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}

module.exports = ChangeHandler;


ChangeHandler.prototype.removed = function(model, property, element, idx) {
  if (isTracked(element)) {
    this._removed[element.id] = element;
  }
};

ChangeHandler.prototype.changed = function(model, property, newValue, oldValue) {

  if (model.$instanceOf('bpmndi:BPMNEdge') || model.$instanceOf('bpmndi:BPMNShape')) {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }

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
  }
};

ChangeHandler.prototype.moved = function(model, property, oldIndex, newIndex) { };
