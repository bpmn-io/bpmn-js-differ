import {
  expect
} from 'chai';

import {
  readFileSync
} from 'fs';

import BpmnModdle from 'bpmn-moddle';

import zeebe from 'zeebe-bpmn-moddle/resources/zeebe.json' with { type: 'json' };

import {
  Differ,
  diff
} from 'bpmn-js-differ';

import SimpleChangeHandler from '../../lib/change-handler.js';


describe('diffing', function() {

  this.timeout(50000);

  describe('diff', function() {

    it('should discover add', async function() {

      var aDiagram = readFileSync('test/fixtures/add/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/add/after.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.have.keys([ 'EndEvent_1', 'SequenceFlow_2' ]);
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});
      });

    });


    describe('should discover flow changed', function() {

      it('after reconnect', async function() {

        var aDiagram = readFileSync('test/fixtures/incoming-outgoing/reconnect.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/incoming-outgoing/reconnect.after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          // then
          expect(results._added, 'added').to.be.eql({});
          expect(results._removed, 'removed').to.eql({});
          expect(results._layoutChanged, 'layout changed').to.have.keys([ 'SEQUENCE_FLOW', 'MESSAGE_FLOW' ]);
          expect(results._changed, 'changed').to.have.keys([ 'SEQUENCE_FLOW', 'MESSAGE_FLOW' ]);

          expect(results._changed['SEQUENCE_FLOW'].attrs).to.deep.eql({
            targetRef: { oldValue: '#ref:TASK_2', newValue: '#ref:TASK_1' }
          });
        });

      });


      it('after task insert', async function() {

        var aDiagram = readFileSync('test/fixtures/incoming-outgoing/add-task.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/incoming-outgoing/add-task.after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          // then
          expect(results._added, 'added').to.have.keys([ 'TASK', 'FLOW_2' ]);
          expect(results._removed, 'removed').to.eql({});
          expect(results._layoutChanged, 'layout changed').to.have.keys([ 'FLOW_1' ]);
          expect(results._changed, 'changed').to.have.keys([ 'FLOW_1' ]);
        });

      });

    });


    it('should discover remove', async function() {

      var aDiagram = readFileSync('test/fixtures/remove/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/remove/after.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});
      });

    });


    describe('should discover change', function() {

      it('property', async function() {

        var aDiagram = readFileSync('test/fixtures/change/before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/change/after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          // then
          expect(results._added).to.eql({});
          expect(results._removed).to.eql({});
          expect(results._layoutChanged).to.eql({});
          expect(results._changed).to.have.keys([ 'Task_1' ]);

          expect(results._changed['Task_1'].attrs).to.deep.eql({
            name: { oldValue: undefined, newValue: 'TASK' }
          });
        });

      });


      it('$type', async function() {

        var aDiagram = readFileSync('test/fixtures/change/type-change.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/change/type-change.after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

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

    });


    it('should discover layout-change', async function() {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});
      });

    });

  });


  describe('api', function() {

    it('should diff with default handler', async function() {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      importDiagrams(aDiagram, bDiagram, function(aDefinitions, bDefinitions) {

        // when
        var results = new Differ().diff(aDefinitions, bDefinitions);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});
      });

    });


    it('should diff via static diff', async function() {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      await importDiagrams(aDiagram, bDiagram, function(aDefinitions, bDefinitions) {

        // when
        var results = diff(aDefinitions, bDefinitions);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});
      });

    });

  });


  describe('should diff scenario', function() {


    it('collaboration pools / lanes', async function() {

      var aDiagram = readFileSync('test/fixtures/collaboration/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/collaboration/after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.have.keys([ 'Participant_2' ]);
        expect(results._removed).to.have.keys([ 'Participant_1', 'Lane_1', 'Task_1' ]);
        expect(results._layoutChanged).to.have.keys([ '_Participant_2', 'Lane_2' ]);
        expect(results._changed).to.have.keys([ 'Lane_2' ]);
      });
    });


    it('lanes create', async function() {

      var aDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'Participant_03hz6qm' ]);

        var changed = results._changed['Participant_03hz6qm'];

        expect(changed.attrs).to.have.keys([ 'processRef.laneSets[0]' ]);

        var changedLaneSets = changed.attrs['processRef.laneSets[0]'];

        expect(changedLaneSets.oldValue).not.to.exist;
        expect(changedLaneSets.newValue).to.exist;
      });
    });


    it('lanes remove', async function() {

      var aDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'Participant_03hz6qm' ]);
      });
    });


    it('collaboration message flow', async function() {

      var aDiagram = readFileSync('test/fixtures/collaboration/message-flow-before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/collaboration/message-flow-after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.have.keys([
          'Participant_1w6hx42',
          'MessageFlow_1ofxm38'
        ]);
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.be.empty;
      });

    });


    describe('extension elements', function() {

      it('c7', async function() {

        var aDiagram = readFileSync('test/fixtures/extension-elements/c7.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/extension-elements/c7.after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          // then
          expect(results._added).to.be.empty;
          expect(results._removed).to.be.empty;
          expect(results._layoutChanged).to.be.empty;
          expect(results._changed).to.have.keys([ 'usertask' ]);
        });
      });


      it('signavio', async function() {

        var aDiagram = readFileSync('test/fixtures/extension-elements/signavio.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/extension-elements/signavio.after.bpmn', 'utf-8');


        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          // then
          expect(results._added).to.be.empty;
          expect(results._removed).to.be.empty;
          expect(results._layoutChanged).to.be.empty;
          expect(results._changed).to.have.keys([ 'Process_1' ]);
        });
      });


      it.only('zeebe', async function() {

        var aDiagram = readFileSync('test/fixtures/extension-elements/zeebe/input.before.bpmn', 'utf-8');
        var bDiagram = readFileSync('test/fixtures/extension-elements/zeebe/input.after.bpmn', 'utf-8');

        // when
        await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

          console.log(JSON.stringify(results, null, 2));
        });
      });

    });


    it('pizza collaboration StartEvent move', async function() {

      var aDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-old.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-new.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ '_6-61' ]);
        expect(results._changed).to.eql({});
      });
    });


    it('pizza collaboration', async function() {

      var aDiagram = readFileSync('test/fixtures/pizza-collaboration/old.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/pizza-collaboration/new.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

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
    });


    it('data-objects', async function() {

      var aDiagram = readFileSync('test/fixtures/data-objects/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/data-objects/after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

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
    });


    it('event definition', async function() {

      var aDiagram = readFileSync('test/fixtures/event-definition/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/event-definition/after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.be.empty;

        expect(results._removed).to.be.empty;

        expect(results._layoutChanged).to.be.empty;

        expect(results._changed).to.have.keys([
          'IntermediateThrowEvent_0mn39ym'
        ]);

        var changed = results._changed['IntermediateThrowEvent_0mn39ym'];

        expect(changed.attrs).to.have.keys([
          'eventDefinitions[0]'
        ]);
      });
    });


    it('sub-processes', async function() {

      var aDiagram = readFileSync('test/fixtures/sub-processes/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/sub-processes/after.bpmn', 'utf-8');


      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

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
    });


    it('signavio-collapsed', async function() {

      var aDiagram = readFileSync('test/fixtures/signavio-collapsed/before.collapsed.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/signavio-collapsed/after.expanded.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

        // then
        expect(results._added).to.be.empty;

        expect(results._removed).to.be.empty;

        expect(results._layoutChanged).to.have.keys([

          // sub-process collapsed state changed
          'SubProcess_1'
        ]);

        expect(results._changed).to.be.empty;
      });
    });


    it('different collaborations', async function() {

      const aDiagram = readFileSync('test/fixtures/different-collaboration/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/different-collaboration/after.bpmn', 'utf-8');

      // when
      await testDiff(aDiagram, bDiagram, function(results, aDefinitions, bDefinitions) {

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

  });

});


// helpers //////////////////

async function importDiagrams(a, b, done) {

  const [
    { rootElement: aDefs },
    { rootElement: bDefs }
  ] = await Promise.all([
    new BpmnModdle({ zeebe }).fromXML(a),
    new BpmnModdle({ zeebe }).fromXML(b),
  ]);

  return done(aDefs, bDefs);
}


function testDiff(a, b, done) {

  return importDiagrams(a, b, function(adefs, bdefs) {

    // given
    var handler = new SimpleChangeHandler();

    // when
    new Differ().diff(adefs, bdefs, handler);

    return done(handler, adefs, bdefs);
  });

}
