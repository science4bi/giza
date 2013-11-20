var Bubbler = require('../lib/bubbler/bubbler');
var should = require('should');
var bub;

var TYPE = 'TYPE';
var OBJ = {obj: 'myObj'};
var MOCK_STORE = {getType: function(){return TYPE;}, get: function(){return OBJ;}};

describe('Bubbler', function(){
  beforeEach(function(){
    bub = new Bubbler(MOCK_STORE);
  }),
  it('properly subscribes and emits on a particular node.', function(done){
    var obj = {a:1};
    bub.subscribe('/abc/def', function(data, source){
      source.should.eql({path: '/abc/def', obj: OBJ, type: TYPE});
      should(data).equal(obj);
      done();
    }, {bubble: false});
    bub.emit('/abc/def', obj);
  }),
  it('replaces trailing slash on subscribe', function(done){
    var obj = {a:1};
    bub.subscribe('/abc/def/', function(data, source){
      should(data).equal(obj);
      done();
    }, {bubble: false});
    bub.emit('/abc/def', obj);
  }),
  it('replaces trailing slash on emit', function(done){
    var obj = {a:1};
    bub.subscribe('/abc/def', function(){
      done();
    }, {bubble: false});
    bub.emit('/abc/def/', obj);
  }),
  it('bubbles events upwards.', function(done){
    var obj = {a:1};
    bub.subscribe('/abc', function(){
      done();
    });
    bub.emit('/abc/def/', obj);
  }),
  it('doesn\'t fire on an excluded type, bubbled event.', function(done){
    var timeout = setTimeout(done, 100);

    bub.subscribe('/abc', function(){
      clearTimeout(timeout);
      done(new Error("Didn't properly exclude bubbled event."));  
    }, {types: ['type1', 'type2']});
    bub.emit('/abc/def');
  }),
  it('does fire on an included type, bubbled event.', function(done){
    bub.subscribe('/abc', function(){
      done();
    }, {types: ['type1', TYPE]});
    bub.emit('/abc/def');
  }),
  it('doesn\'t fire on an excluded type, targeted event.', function(done){
    var timeout = setTimeout(done, 100);

    bub.subscribe('/abc', function(){
      clearTimeout(timeout);
      done(new Error("Didn't properly exclude targeted event."));  
    }, {types: ['type1', 'type2']});
    bub.emit('/abc');   
  }),
  it('does fire on an included type, targeted event.', function(done){
    bub.subscribe('/abc', function(){
      done();
    }, {types: ['type1', TYPE]});
    bub.emit('/abc');
  }),
  it('skips bubbled events if not subscribed', function(done){
    var timeout = setTimeout(done, 100);

    var obj = {a:1};
    bub.subscribe('/abc', function(data){
      clearTimeout(timeout);
      done(new Error("Bubbled event when it shouldn't have."));
    }, {bubble: false});
    bub.emit('/abc/def/', obj);
  }),
  it('bubbles events to root.', function(done){
    var obj = {a:1};
    bub.subscribe('/', function(data, source){
      source.should.eql({path: '/abc/def', obj: OBJ, type: TYPE});
      should(data).equal(obj);
      done();
    }, {bubble: true});
    bub.emit('/abc/def', obj);
  }),
  it('pub/subs 100k targeted events in less than 200ms', function(done){
    // this.timeout doesn't seem to be working. Implement our own.
    var timeout = setTimeout(done, 200, new Error("Took too long."));

    var counter = 0;
    var obj = {a:1};
    bub.subscribe('/abc', function(){
      counter++;
    }, {bubble: false});

    var iterations = 100000;

    for (var i = 0; i < iterations; i++){
      bub.emit('/abc', obj);
    }

    // We made it in time. Clear the timeout
    setTimeout(function(){
      clearTimeout(timeout);
    }, 5);

    // Keep v8 from ever outsmarting this test and skipping over the loop.
    counter.should.equal(iterations);
    done();
  })
  it('pub/subs 100k (5-lvl) bubbled events in less than 500ms', function(done){
    // this.timeout doesn't seem to be working. Implement our own.
    var timeout = setTimeout(done, 500, new Error("Took too long."));

    var counter = 0;
    var obj = {a:1};
    bub.subscribe('/', function(){
      counter++;
    }, {bubble: true});

    var iterations = 100000;

    for (var i = 0; i < iterations; i++){
      bub.emit('/abc/def/ghi/jkl', obj);
    }

    // We made it in time. Clear the timeout
    setTimeout(function(){
      clearTimeout(timeout);
    }, 5);

    // Keep v8 from ever outsmarting this test and skipping over the loop.
    counter.should.equal(iterations);
    done();
  })
  it('clears subscriptions', function(){
    bub.subscribe('/abc', function(){ });
    bub.$eventBus.listeners('/abc').length.should.equal(1);
    bub.clearSubscriptions('/abc');
    bub.$eventBus.listeners('/abc').length.should.equal(0);
  }),
  it('Passed emitted arguments through', function(done){
    var obj = {a:1};
    bub.subscribe('/abc', function(){
      arguments[0].should.equal('event');
      arguments[1].should.eql({path: '/abc/def', obj: OBJ, type: TYPE});
      arguments[2].should.equal(obj);
      arguments[3].should.equal(15);
      done();
    });
    bub.emit('/abc/def', 'event', obj, 15);    
  })
});
