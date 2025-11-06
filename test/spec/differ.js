import {
  expect
} from 'chai';

import {
  readFileSync
} from 'fs';

import BpmnModdle from 'bpmn-moddle';

import {
  Differ,
  diff,
  ChangeHandler
} from 'bpmn-js-differ';

import ZeebeModdlePackage from 'zeebe-bpmn-moddle/resources/zeebe.json' with { type: 'json' };

import { is } from '../../lib/util.js';


describe('diffing', function() {

  describe('diff', function() {

    it('should discover add', async function() {

      const aDiagram = readFileSync('test/fixtures/add/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/add/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([ 'EndEvent_1', 'SequenceFlow_2' ]);
      expect(results._removed).to.eql({});
      expect(results._layoutChanged).to.eql({});
      expect(results._changed).to.eql({});
    });


    describe('should discover flow changed', function() {

      it('after reconnect', async function() {

        const aDiagram = readFileSync('test/fixtures/incoming-outgoing/reconnect.before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/incoming-outgoing/reconnect.after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added, 'added').to.be.eql({});
        expect(results._removed, 'removed').to.eql({});
        expect(results._layoutChanged, 'layout changed').to.have.keys([ 'SEQUENCE_FLOW', 'MESSAGE_FLOW' ]);
        expect(results._changed, 'changed').to.have.keys([ 'SEQUENCE_FLOW', 'MESSAGE_FLOW' ]);

        expect(results._changed['SEQUENCE_FLOW'].attrs).to.deep.eql({
          targetRef: { oldValue: '#ref:TASK_2', newValue: '#ref:TASK_1' }
        });
      });


      it('after task insert', async function() {

        const aDiagram = readFileSync('test/fixtures/incoming-outgoing/add-task.before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/incoming-outgoing/add-task.after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added, 'added').to.have.keys([ 'TASK', 'FLOW_2' ]);
        expect(results._removed, 'removed').to.eql({});
        expect(results._layoutChanged, 'layout changed').to.have.keys([ 'FLOW_1' ]);
        expect(results._changed, 'changed').to.have.keys([ 'FLOW_1' ]);
      });

    });


    it('should discover remove', async function() {

      const aDiagram = readFileSync('test/fixtures/remove/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/remove/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.eql({});
      expect(results._removed).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
      expect(results._layoutChanged).to.eql({});
      expect(results._changed).to.eql({});
    });


    describe('should discover change', function() {

      it('property', async function() {

        const aDiagram = readFileSync('test/fixtures/change/before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/change/after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.have.keys([ 'Task_1' ]);

        expect(results._changed['Task_1'].attrs).to.deep.eql({
          name: { oldValue: undefined, newValue: 'TASK' }
        });
      });


      it('$type', async function() {

        const aDiagram = readFileSync('test/fixtures/change/type-change.before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/change/type-change.after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.have.keys([ 'TASK' ]);

        expect(results._changed['TASK'].attrs).to.deep.eql({
          $type: { oldValue: 'bpmn:ServiceTask', newValue: 'bpmn:Task' }
        });
      });

    });


    it('should discover layout-change', async function() {

      const aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.eql({});
      expect(results._removed).to.eql({});
      expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
      expect(results._changed).to.eql({});
    });

  });


  describe('api', function() {

    it('should diagramDiff with default handler', async function() {

      const aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      const { aDefinitions, bDefinitions } = await importDiagrams(aDiagram, bDiagram);

      // when
      const results = new Differ().diff(aDefinitions, bDefinitions);

      // then
      expect(results._added).to.eql({});
      expect(results._removed).to.eql({});
      expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
      expect(results._changed).to.eql({});
    });


    it('should diagramDiff via static diagramDiff', async function() {

      const aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      const { aDefinitions, bDefinitions } = await importDiagrams(aDiagram, bDiagram);

      // when
      const results = diff(aDefinitions, bDefinitions);

      // then
      expect(results._added).to.eql({});
      expect(results._removed).to.eql({});
      expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
      expect(results._changed).to.eql({});
    });

  });


  describe('should diagramDiff scenario', function() {

    it('collaboration pools / lanes', async function() {

      const aDiagram = readFileSync('test/fixtures/collaboration/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/collaboration/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([ 'Participant_2' ]);
      expect(results._removed).to.have.keys([ 'Participant_1', 'Lane_1', 'Task_1' ]);
      expect(results._layoutChanged).to.have.keys([ '_Participant_2', 'Lane_2' ]);
      expect(results._changed).to.have.keys([ 'Lane_2' ]);
    });


    it('lanes create', async function() {

      const aDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.be.empty;
      expect(results._removed).to.be.empty;
      expect(results._layoutChanged).to.be.empty;
      expect(results._changed).to.have.keys([ 'Participant_03hz6qm' ]);

      const changed = results._changed['Participant_03hz6qm'];

      expect(changed.attrs).to.have.keys([ 'processRef.laneSets[0]' ]);

      const changedLaneSets = changed.attrs['processRef.laneSets[0]'];

      expect(changedLaneSets.oldValue).not.to.exist;
      expect(changedLaneSets.newValue).to.exist;
    });


    it('lanes remove', async function() {

      const aDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.be.empty;
      expect(results._removed).to.be.empty;
      expect(results._layoutChanged).to.be.empty;
      expect(results._changed).to.have.keys([ 'Participant_03hz6qm' ]);
    });


    it('collaboration message flow', async function() {

      const aDiagram = readFileSync('test/fixtures/collaboration/message-flow-before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/collaboration/message-flow-after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.be.empty;
      expect(results._removed).to.have.keys([
        'Participant_1w6hx42',
        'MessageFlow_1ofxm38'
      ]);
      expect(results._layoutChanged).to.be.empty;
      expect(results._changed).to.be.empty;
    });


    describe('extension elements', function() {

      it('c7', async function() {

        const aDiagram = readFileSync('test/fixtures/extension-elements/c7.before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/extension-elements/c7.after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'usertask' ]);
      });


      it('signavio', async function() {

        const aDiagram = readFileSync('test/fixtures/extension-elements/signavio.before.bpmn', 'utf-8');
        const bDiagram = readFileSync('test/fixtures/extension-elements/signavio.after.bpmn', 'utf-8');

        // when
        const { results } = await diagramDiff(aDiagram, bDiagram);

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'Process_1' ]);
      });

    });


    it('pizza collaboration StartEvent move', async function() {

      const aDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-old.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-new.bpmn', 'utf-8');


      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.eql({});
      expect(results._removed).to.eql({});
      expect(results._layoutChanged).to.have.keys([ '_6-61' ]);
      expect(results._changed).to.eql({});
    });


    it('pizza collaboration', async function() {

      const aDiagram = readFileSync('test/fixtures/pizza-collaboration/old.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/pizza-collaboration/new.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([
        'ManualTask_1',
        'ExclusiveGateway_1'
      ]);

      expect(results._removed).to.have.keys([
        '_6-674', '_6-691', '_6-746', '_6-748', '_6-74', '_6-125', '_6-178', '_6-642'
      ]);

      expect(results._layoutChanged).to.have.keys([
        '_6-61'
      ]);

      expect(results._changed).to.have.keys([
        '_6-127',
        '_6-219'
      ]);
    });


    it('data-objects', async function() {

      const aDiagram = readFileSync('test/fixtures/data-objects/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/data-objects/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([
        'DataObjectReference_E',
        'DataOutputAssociation_2',
        'DataOutputAssociation_3',
        'DataStoreReference_D'
      ]);

      expect(results._removed).to.have.keys([
        'DataInputAssociation_4',
        'DataOutputAssociation_5',
        'DataStoreReference_C'
      ]);

      expect(results._layoutChanged).to.have.keys([

        // waypoints changed
        'DataInputAssociation_1'
      ]);

      // TODO(nikku): detect bpmn:DataObjectReference#dataObject change
      expect(results._changed).to.have.keys([
        'Process_1'
      ]);
    });


    it('event definition', async function() {

      const aDiagram = readFileSync('test/fixtures/event-definition/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/event-definition/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.be.empty;

      expect(results._removed).to.be.empty;

      expect(results._layoutChanged).to.be.empty;

      expect(results._changed).to.have.keys([
        'IntermediateThrowEvent_0mn39ym'
      ]);

      const changed = results._changed['IntermediateThrowEvent_0mn39ym'];

      expect(changed.attrs).to.have.keys([
        'eventDefinitions[0]'
      ]);
    });


    it('sub-processes', async function() {

      const aDiagram = readFileSync('test/fixtures/sub-processes/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/sub-processes/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([
        'Task_F',
        'SubProcess_4'
      ]);

      expect(results._removed).to.have.keys([
        'Task_A',
        'Task_B',
        'SubProcess_3'
      ]);

      expect(results._layoutChanged).to.have.keys([

        // sub-process collapsed state changed
        'SubProcess_5'
      ]);

      expect(results._changed).to.be.empty;
    });


    it('signavio-collapsed', async function() {

      const aDiagram = readFileSync('test/fixtures/signavio-collapsed/before.collapsed.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/signavio-collapsed/after.expanded.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.be.empty;
      expect(results._removed).to.be.empty;
      expect(results._layoutChanged).to.have.keys([

        // sub-process collapsed state changed
        'SubProcess_1'
      ]);
      expect(results._changed).to.be.empty;
    });


    it('different collaborations', async function() {

      const aDiagram = readFileSync('test/fixtures/different-collaboration/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/different-collaboration/after.bpmn', 'utf-8');

      // when
      const { results } = await diagramDiff(aDiagram, bDiagram);

      // then
      expect(results._added).to.have.keys([
        'Collaboration_108r8n7',
        'Participant_1sdnyht'
      ]);

      expect(results._removed).to.have.keys([
        'Collaboration_1cidyxu',
        'Participant_0px403d'
      ]);

      expect(results._layoutChanged).to.be.empty;

      expect(results._changed).to.be.empty;
    });

  });


  describe('extension', function() {

    it('should customize ChangeHandler to track nested properties', async function() {

      const aDiagram = readFileSync('test/fixtures/custom/data-object/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/custom/data-object/after.bpmn', 'utf-8');

      // given
      class CustomChangeHandler extends ChangeHandler {

        _isTracked(element) {

          // track bpmn:DataObject elements (base implementation ignores)
          if (is(element, 'bpmn:DataObject')) {
            return {
              element: element,
              property: ''
            };
          }

          return super._isTracked(element);
        }
      }

      const { aDefinitions, bDefinitions } = await importDiagrams(aDiagram, bDiagram);

      // given
      const changeHandler = new CustomChangeHandler();

      // when
      const changed = new Differ().diff(aDefinitions, bDefinitions, changeHandler);

      // then
      expect(changed._added).to.have.keys('DATA_OBJECT_3');
      expect(changed._removed).to.have.keys('DATA_OBJECT_2');
      expect(changed._changed).to.have.keys('DATA_OBJECT_1', 'DATA_OBJECT_REFERENCE_2');
      expect(changed._layoutChanged).to.eql({});
    });


    it('should customize ChangeHandler to track <camunda> changes', async function() {

      const aDiagram = readFileSync('test/fixtures/custom/camunda/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/custom/camunda/after.bpmn', 'utf-8');

      // given
      class CustomChangeHandler extends ChangeHandler {

        constructor() {
          super();

          this._id = 0;
          this._ids = new Map();
        }

        _computeChangeId(element) {

          const existingId = this._ids.get(element);

          if (existingId) {
            return existingId;
          }

          const newId = super._computeChangeId(element) || '_' + (this._id++);

          this._ids.set(element, newId);

          return newId;
        }

        _isTracked(element) {

          if (is(element, 'Element')) {
            return {
              element: element,
              property: ''
            };
          }

          return super._isTracked(element);
        }
      }

      const { aDefinitions, bDefinitions } = await importDiagrams(aDiagram, bDiagram, {
        moddleExtensions: {
          zeebe: ZeebeModdlePackage
        }
      });

      // given
      const changeHandler = new CustomChangeHandler();

      // when
      const changed = new Differ().diff(aDefinitions, bDefinitions, changeHandler);

      // then
      expect(changed._added).to.have.keys('_0', '_1');
      expect(changed._removed).to.have.keys('_2', '_3');
      expect(changed._changed).to.have.keys('SERVICE_TASK');
      expect(changed._layoutChanged).to.eql({});
    });

  });

});


// helpers //////////////////

async function importDiagrams(a, b, options = {}) {

  const [
    { rootElement: aDefinitions },
    { rootElement: bDefinitions }
  ] = await Promise.all([
    new BpmnModdle(options.moddleExtensions).fromXML(a),
    new BpmnModdle(options.moddleExtensions).fromXML(b)
  ]);

  return {
    aDefinitions,
    bDefinitions
  };
}


async function diagramDiff(a, b) {

  // given
  const {
    aDefinitions,
    bDefinitions
  } = await importDiagrams(a, b);

  const handler = new ChangeHandler();

  // when
  const results = new Differ().diff(aDefinitions, bDefinitions, handler);

  return {
    results,
    aDefinitions,
    bDefinitions
  };
}
