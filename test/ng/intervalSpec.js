

describe('$interval', function() {
  /* global $IntervalProvider: false */

  beforeEach(module(function($provide) {
    let repeatFns = [],
        nextRepeatId = 0,
        now = 0,
        $window;

    $window = {
      setInterval: function(fn, delay, count) {
        repeatFns.push({
          nextTime:(now + delay),
          delay: delay,
          fn: fn,
          id: nextRepeatId
        });
        repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});

        return nextRepeatId++;
      },

      clearInterval: function(id) {
        let fnIndex;

        angular.forEach(repeatFns, function(fn, index) {
          if (fn.id === id) fnIndex = index;
        });

        if (isDefined(fnIndex)) {
          repeatFns.splice(fnIndex, 1);
          return true;
        }

        return false;
      },

      flush: function(millis) {
        now += millis;
        while (repeatFns.length && repeatFns[0].nextTime <= now) {
          let task = repeatFns[0];
          task.fn();
          task.nextTime += task.delay;
          repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});
        }
        return millis;
      }
    };

    $provide.provider('$interval', $IntervalProvider);
    $provide.value('$window', $window);
  }));

  it('should run tasks repeatedly', inject(function($interval, $window) {
    let counter = 0;
    $interval(function() { counter++; }, 1000);

    expect(counter).toBe(0);

    $window.flush(1000);
    expect(counter).toBe(1);

    $window.flush(1000);

    expect(counter).toBe(2);
  }));

  it('should call $apply after each task is executed',
      inject(function($interval, $rootScope, $window) {
    let applySpy = spyOn($rootScope, '$apply').and.callThrough();

    $interval(noop, 1000);
    expect(applySpy).not.toHaveBeenCalled();

    $window.flush(1000);
    expect(applySpy).toHaveBeenCalledOnce();

    applySpy.calls.reset();

    $interval(noop, 1000);
    $interval(noop, 1000);
    $window.flush(1000);
    expect(applySpy).toHaveBeenCalledTimes(3);
  }));


  it('should NOT call $apply if invokeApply is set to false',
      inject(function($interval, $rootScope, $window) {
    let applySpy = spyOn($rootScope, '$apply').and.callThrough();

    $interval(noop, 1000, 0, false);
    expect(applySpy).not.toHaveBeenCalled();

    $window.flush(2000);
    expect(applySpy).not.toHaveBeenCalled();
  }));


  it('should NOT call $evalAsync or $digest if invokeApply is set to false',
      inject(function($interval, $rootScope, $window, $timeout) {
    let evalAsyncSpy = spyOn($rootScope, '$evalAsync').and.callThrough();
    let digestSpy = spyOn($rootScope, '$digest').and.callThrough();
    let notifySpy = jasmine.createSpy('notify');

    $interval(notifySpy, 1000, 1, false);

    $window.flush(2000);
    $timeout.flush(); // flush $browser.defer() timeout

    expect(notifySpy).toHaveBeenCalledOnce();
    expect(evalAsyncSpy).not.toHaveBeenCalled();
    expect(digestSpy).not.toHaveBeenCalled();
  }));


  it('should not depend on `notify` to trigger the callback call', function() {
    module(function($provide) {
      $provide.decorator('$q', function($delegate) {
        function replacement() {}
        replacement.defer = function() {
          let result = $delegate.defer();
          result.notify = noop;
          return result;
        };
        return replacement;
      });
    });

    inject(function($interval, $window) {
      let counter = 0;
      $interval(function() { counter++; }, 1000);

      expect(counter).toBe(0);

      $window.flush(1000);
      expect(counter).toBe(1);

      $window.flush(1000);

      expect(counter).toBe(2);
    });
  });


  it('should allow you to specify the delay time', inject(function($interval, $window) {
    let counter = 0;
    $interval(function() { counter++; }, 123);

    expect(counter).toBe(0);

    $window.flush(122);
    expect(counter).toBe(0);

    $window.flush(1);
    expect(counter).toBe(1);
  }));


  it('should allow you to specify a number of iterations', inject(function($interval, $window) {
    let counter = 0;
    $interval(function() {counter++;}, 1000, 2);

    $window.flush(1000);
    expect(counter).toBe(1);
    $window.flush(1000);
    expect(counter).toBe(2);
    $window.flush(1000);
    expect(counter).toBe(2);
  }));


  it('should allow you to specify a number of arguments', inject(function($interval, $window) {
    let task1 = jasmine.createSpy('task1'),
        task2 = jasmine.createSpy('task2'),
        task3 = jasmine.createSpy('task3');
    $interval(task1, 1000, 2, true, 'Task1');
    $interval(task2, 1000, 2, true, 'Task2');
    $interval(task3, 1000, 2, true, 'I', 'am', 'a', 'Task3', 'spy');

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');

    task1.calls.reset();
    task2.calls.reset();
    task3.calls.reset();

    $window.flush(1000);
    expect(task1).toHaveBeenCalledWith('Task1');
    expect(task2).toHaveBeenCalledWith('Task2');
    expect(task3).toHaveBeenCalledWith('I', 'am', 'a', 'Task3', 'spy');

  }));


  it('should return a promise which will be updated with the count on each iteration',
      inject(function($interval, $window) {
    let log = [],
        promise = $interval(function() { log.push('tick'); }, 1000);

    promise.then(function(value) { log.push('promise success: ' + value); },
                 function(err) { log.push('promise error: ' + err); },
                 function(note) { log.push('promise update: ' + note); });
    expect(log).toEqual([]);

    $window.flush(1000);
    expect(log).toEqual(['tick', 'promise update: 0']);

    $window.flush(1000);
    expect(log).toEqual(['tick', 'promise update: 0', 'tick', 'promise update: 1']);
  }));


  it('should return a promise which will be resolved after the specified number of iterations',
      inject(function($interval, $window) {
    let log = [],
        promise = $interval(function() { log.push('tick'); }, 1000, 2);

    promise.then(function(value) { log.push('promise success: ' + value); },
                 function(err) { log.push('promise error: ' + err); },
                 function(note) { log.push('promise update: ' + note); });
    expect(log).toEqual([]);

    $window.flush(1000);
    expect(log).toEqual(['tick', 'promise update: 0']);
    $window.flush(1000);

    expect(log).toEqual([
      'tick', 'promise update: 0', 'tick', 'promise update: 1', 'promise success: 2'
    ]);

  }));


  describe('exception handling', function() {
    beforeEach(module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));


    it('should delegate exception to the $exceptionHandler service', inject(
        function($interval, $exceptionHandler, $window) {
      $interval(function() { throw 'Test Error'; }, 1000);
      expect($exceptionHandler.errors).toEqual([]);

      $window.flush(1000);
      expect($exceptionHandler.errors).toEqual(['Test Error']);

      $window.flush(1000);
      expect($exceptionHandler.errors).toEqual(['Test Error', 'Test Error']);
    }));


    it('should call $apply even if an exception is thrown in callback', inject(
        function($interval, $rootScope, $window) {
      let applySpy = spyOn($rootScope, '$apply').and.callThrough();

      $interval(function() { throw 'Test Error'; }, 1000);
      expect(applySpy).not.toHaveBeenCalled();

      $window.flush(1000);
      expect(applySpy).toHaveBeenCalled();
    }));


    it('should still update the interval promise when an exception is thrown',
        inject(function($interval, $window) {
      let log = [],
          promise = $interval(function() { throw 'Some Error'; }, 1000);

      promise.then(function(value) { log.push('promise success: ' + value); },
                 function(err) { log.push('promise error: ' + err); },
                 function(note) { log.push('promise update: ' + note); });
      $window.flush(1000);

      expect(log).toEqual(['promise update: 0']);
    }));
  });


  describe('cancel', function() {
    it('should cancel tasks', inject(function($interval, $window) {
      let task1 = jasmine.createSpy('task1', 1000),
          task2 = jasmine.createSpy('task2', 1000),
          task3 = jasmine.createSpy('task3', 1000),
          promise1, promise3;

      promise1 = $interval(task1, 200);
      $interval(task2, 1000);
      promise3 = $interval(task3, 333);

      $interval.cancel(promise3);
      $interval.cancel(promise1);
      $window.flush(1000);

      expect(task1).not.toHaveBeenCalled();
      expect(task2).toHaveBeenCalledOnce();
      expect(task3).not.toHaveBeenCalled();
    }));


    it('should cancel the promise', inject(function($interval, $rootScope, $window) {
      let promise = $interval(noop, 1000),
          log = [];
      promise.then(function(value) { log.push('promise success: ' + value); },
                 function(err) { log.push('promise error: ' + err); },
                 function(note) { log.push('promise update: ' + note); });
      expect(log).toEqual([]);

      $window.flush(1000);
      $interval.cancel(promise);
      $window.flush(1000);
      $rootScope.$apply(); // For resolving the promise -
                           // necessary since q uses $rootScope.evalAsync.

      expect(log).toEqual(['promise update: 0', 'promise error: canceled']);
    }));


    it('should return true if a task was successfully canceled',
        inject(function($interval, $window) {
      let task1 = jasmine.createSpy('task1'),
          task2 = jasmine.createSpy('task2'),
          promise1, promise2;

      promise1 = $interval(task1, 1000, 1);
      $window.flush(1000);
      promise2 = $interval(task2, 1000, 1);

      expect($interval.cancel(promise1)).toBe(false);
      expect($interval.cancel(promise2)).toBe(true);
    }));


    it('should not throw an error when given an undefined promise', inject(function($interval) {
      expect($interval.cancel()).toBe(false);
    }));


    it('should throw an error when given a non-$interval promise', inject(function($interval) {
      let promise = $interval(noop).then(noop);
      expect(function() { $interval.cancel(promise); }).toThrowMinErr('$interval', 'badprom');
    }));


    it('should not trigger digest when cancelled', inject(function($interval, $rootScope, $browser) {
      let watchSpy = jasmine.createSpy('watchSpy');
      $rootScope.$watch(watchSpy);

      let t = $interval();
      $interval.cancel(t);
      expect(function() {$browser.defer.flush();}).toThrowError('No deferred tasks to be flushed');
      expect(watchSpy).not.toHaveBeenCalled();
    }));
  });

  describe('$window delegation', function() {
    it('should use $window.setInterval instead of the global function', inject(function($interval, $window) {
      let setIntervalSpy = spyOn($window, 'setInterval');

      $interval(noop, 1000);
      expect(setIntervalSpy).toHaveBeenCalled();
    }));

    it('should use $window.clearInterval instead of the global function', inject(function($interval, $window) {
      let clearIntervalSpy = spyOn($window, 'clearInterval');

      $interval(noop, 1000, 1);
      $window.flush(1000);
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.calls.reset();
      $interval.cancel($interval(noop, 1000));
      expect(clearIntervalSpy).toHaveBeenCalled();
    }));
  });
});
