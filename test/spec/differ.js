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


  describe('scenarios', function() {


    it('should diff collaboration pools / lanes', function(done) {

      var aDiagram = readFileSync('test/fixtures/collaboration/before.bpmn', 'utf-8');
      var bDiagram = readFileSync('test/fixtures/collaboration/after.bpmn', 'utf-8');


      // when
      testDiff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.have.keys([ 'Participant_2' ]);
        expect(results._removed).to.have.keys([ 'Participant_1', 'Lane_1' ]);
        expect(results._layoutChanged).to.have.keys([ '_Participant_2', 'Lane_2' ]);
        expect(results._changed).to.have.keys([ 'Lane_2' ]);

        done();
      });
    });


    it('should diff extension elements', function(done) {

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


    it('should diff pizza collaboration StartEvent move', function(done) {

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


    it('should diff pizza collaboration', function(done) {

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

        expect(results._changed).to.have.keys([ '_6-127' ]);

        done();
      });
    });


    it('should diff data-objects', function(done) {

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
        expect(results._changed).to.be.empty;

        done();
      });
    });


    it('should diff sub-processes', function(done) {

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
          'Task_B',
          'SubProcess_3'
        ]);

        expect(results._layoutChanged).to.have.keys([
          // sub-process collapsed state changed
          'SubProcess_5'
        ]);

        expect(results._changed).to.have.keys([
          // Task removed
          'SubProcess_1'
        ]);

        done();
      });
    });


    it('should diff signavio-collapsed', function(done) {

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

    it('should throw an error when trying to diff two complete different processes', function(done) {
      const diagramA = readFileSync('test/fixtures/different-processes/process1.bpmn', 'utf-8');
      const diagramB = readFileSync('test/fixtures/different-processes/process2.bpmn', 'utf-8');

      const expectedErrorMessage = 'The two diagrams are incomparable';

      const diffFunction = function(err, diagA, diagB) {
        if (err) {
          return done(err);
        }

        const handler = new SimpleChangeHandler();

        /*
         * Diff the given diagrams and expect the Diff function to throw the
         * expected Error
        */
        const expectedErrorMessage = /.*?two.*?diagrams.*?are.*?incomparable/i;
        const differ = new Differ();

        expect(function() {
          differ.diff(diagA, diagB, handler);
        }).to.throw(Error, expectedErrorMessage);

        done();
      };

      importDiagrams(diagramA, diagramB, diffFunction);
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
