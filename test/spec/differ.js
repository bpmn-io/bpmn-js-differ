import {
  expect
} from 'chai';

import {
  readFileSync
} from 'fs';

import BpmnModdle from 'bpmn-moddle';

import {
  Differ,
  diff
} from '../../';

import SimpleChangeHandler from '../../lib/change-handler';


describe('diffing', function() {

  describe('diff', function() {

    it('should discover add', function(done) {

      var aDiagram = readFileSync('test/fixtures/add/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/add/after.bpmn', 'utf-8');

      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }


        // then
        expect(results._added).to.have.keys([ 'EndEvent_1', 'SequenceFlow_2' ]);
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});

        done();
      });

    });


    it('should discover remove', function(done) {

      var aDiagram = readFileSync('test/fixtures/remove/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/remove/after.bpmn', 'utf-8');

      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});

        done();
      });

    });


    it('should discover change', function(done) {

      var aDiagram = readFileSync('test/fixtures/change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/change/after.bpmn', 'utf-8');

      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.have.keys([ 'Task_1' ]);

        expect(results._changed['Task_1'].attrs).to.deep.eql({
          name: { oldValue: undefined, newValue: 'TASK' }
        });

        done();
      });

    });


    it('should discover layout-change', function(done) {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});

        done();
      });

    });

  });


  describe('api', function() {

    it('should diff with default handler', function(done) {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      importDiagrams(aDiagram, bDiagram, function(err, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // when
        var results = new Differ().diff(aDefinitions, bDefinitions);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});

        done();
      });

    });


    it('should diff via static diff', function(done) {

      var aDiagram = readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      importDiagrams(aDiagram, bDiagram, function(err, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // when
        var results = diff(aDefinitions, bDefinitions);

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});

        done();
      });

    });

  });


  describe('should diff scenario', function() {


    it('collaboration pools / lanes', function(done) {

      var aDiagram = readFileSync('test/fixtures/collaboration/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/collaboration/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.have.keys([ 'Participant_2' ]);
        expect(results._removed).to.have.keys([ 'Participant_1', 'Lane_1', 'Task_1' ]);
        expect(results._layoutChanged).to.have.keys([ '_Participant_2', 'Lane_2' ]);
        expect(results._changed).to.have.keys([ 'Lane_2' ]);

        done();
      });
    });


    it('lanes create', function(done) {

      var aDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });


    it('lanes remove', function(done) {

      var aDiagram = readFileSync('test/fixtures/lanes/create-laneset-after.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/lanes/create-laneset-before.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'Participant_03hz6qm' ]);

        done();
      });
    });


    it('collaboration message flow', function(done) {

      var aDiagram = readFileSync('test/fixtures/collaboration/message-flow-before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/collaboration/message-flow-after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.have.keys([
          'Participant_1w6hx42',
          'MessageFlow_1ofxm38'
        ]);
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.be.empty;

        done();
      });
    });



    it('extension elements', function(done) {

      var aDiagram = readFileSync('test/fixtures/extension-elements/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/extension-elements/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.be.empty;
        expect(results._removed).to.be.empty;
        expect(results._layoutChanged).to.be.empty;
        expect(results._changed).to.have.keys([ 'usertask' ]);

        done();
      });
    });


    it('pizza collaboration StartEvent move', function(done) {

      var aDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-old.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/pizza-collaboration/start-event-new.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ '_6-61' ]);
        expect(results._changed).to.eql({});

        done();
      });
    });


    it('pizza collaboration', function(done) {

      var aDiagram = readFileSync('test/fixtures/pizza-collaboration/old.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/pizza-collaboration/new.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });


    it('data-objects', function(done) {

      var aDiagram = readFileSync('test/fixtures/data-objects/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/data-objects/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });


    it('event definition', function(done) {

      var aDiagram = readFileSync('test/fixtures/event-definition/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/event-definition/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });


    it('sub-processes', function(done) {

      var aDiagram = readFileSync('test/fixtures/sub-processes/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/sub-processes/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });


    it('signavio-collapsed', function(done) {

      var aDiagram = readFileSync('test/fixtures/signavio-collapsed/before.collapsed.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/signavio-collapsed/after.expanded.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.be.empty;

        expect(results._removed).to.be.empty;

        expect(results._layoutChanged).to.have.keys([
          // sub-process collapsed state changed
          'SubProcess_1'
        ]);

        expect(results._changed).to.be.empty;

        done();
      });
    });


    it('different collaborations', function(done) {

      const aDiagram = readFileSync('test/fixtures/different-collaboration/before.bpmn', 'utf-8');
      const bDiagram = readFileSync('test/fixtures/different-collaboration/after.bpmn', 'utf-8');

      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

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

        done();
      });
    });

  });

});


// helpers //////////////////

function importDiagrams(a, b, done) {

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


function testDiff(a, b, done) {

  importDiagrams(a, b, function(err, adefs, bdefs) {
    if (err) {
      return done(err);
    }

    // given
    var handler = new SimpleChangeHandler();

    // when
    new Differ().diff(adefs, bdefs, handler);

    done(err, handler, adefs, bdefs);
  });

}
