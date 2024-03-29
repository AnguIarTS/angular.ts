

describe('ngMock', () => {

  const {noop} = angular;
  const {extend} = angular;

  describe('TzDate', () => {

    function minutes(min) {
      return min * 60 * 1000;
    }

    it('should look like a Date', () => {
      const date = new angular.mock.TzDate(0,0);
      expect(angular.isDate(date)).toBe(true);
    });

    it('should take millis as constructor argument', () => {
      expect(new angular.mock.TzDate(0, 0).getTime()).toBe(0);
      expect(new angular.mock.TzDate(0, 1283555108000).getTime()).toBe(1283555108000);
    });

    it('should take dateString as constructor argument', () => {
      expect(new angular.mock.TzDate(0, '1970-01-01T00:00:00.000Z').getTime()).toBe(0);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.023Z').getTime()).toBe(1283555108023);
    });


    it('should fake getLocalDateString method', () => {
      const millennium = new Date('2000').getTime();

      // millennium in -3h
      const t0 = new angular.mock.TzDate(-3, millennium);
      expect(t0.toLocaleDateString()).toMatch('2000');

      // millennium in +0h
      const t1 = new angular.mock.TzDate(0, millennium);
      expect(t1.toLocaleDateString()).toMatch('2000');

      // millennium in +3h
      const t2 = new angular.mock.TzDate(3, millennium);
      expect(t2.toLocaleDateString()).toMatch('1999');
    });


    it('should fake toISOString method', () => {
      const date = new angular.mock.TzDate(-1, '2009-10-09T01:02:03.027Z');

      if (new Date().toISOString) {
        expect(date.toISOString()).toEqual('2009-10-09T01:02:03.027Z');
      } else {
        expect(date.toISOString).toBeUndefined();
      }
    });


    it('should fake getHours method', () => {
      // avoid going negative due to #5017, so use Jan 2, 1970 00:00 UTC
      const jan2 = 24 * 60 * 60 * 1000;

      // 0:00 in -3h
      const t0 = new angular.mock.TzDate(-3, jan2);
      expect(t0.getHours()).toBe(3);

      // 0:00 in +0h
      const t1 = new angular.mock.TzDate(0, jan2);
      expect(t1.getHours()).toBe(0);

      // 0:00 in +3h
      const t2 = new angular.mock.TzDate(3, jan2);
      expect(t2.getHours()).toMatch('21');
    });


    it('should fake getMinutes method', () => {
      // 0:15 in -3h
      const t0 = new angular.mock.TzDate(-3, minutes(15));
      expect(t0.getMinutes()).toBe(15);

      // 0:15 in -3.25h
      const t0a = new angular.mock.TzDate(-3.25, minutes(15));
      expect(t0a.getMinutes()).toBe(30);

      // 0 in +0h
      const t1 = new angular.mock.TzDate(0, minutes(0));
      expect(t1.getMinutes()).toBe(0);

      // 0:15 in +0h
      const t1a = new angular.mock.TzDate(0, minutes(15));
      expect(t1a.getMinutes()).toBe(15);

      // 0:15 in +3h
      const t2 = new angular.mock.TzDate(3, minutes(15));
      expect(t2.getMinutes()).toMatch('15');

      // 0:15 in +3.25h
      const t2a = new angular.mock.TzDate(3.25, minutes(15));
      expect(t2a.getMinutes()).toMatch('0');
    });


    it('should fake getSeconds method', () => {
      // 0 in -3h
      const t0 = new angular.mock.TzDate(-3, 0);
      expect(t0.getSeconds()).toBe(0);

      // 0 in +0h
      const t1 = new angular.mock.TzDate(0, 0);
      expect(t1.getSeconds()).toBe(0);

      // 0 in +3h
      const t2 = new angular.mock.TzDate(3, 0);
      expect(t2.getSeconds()).toMatch('0');
    });


    it('should fake getMilliseconds method', () => {
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.003Z').getMilliseconds()).toBe(3);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.023Z').getMilliseconds()).toBe(23);
      expect(new angular.mock.TzDate(0, '2010-09-03T23:05:08.123Z').getMilliseconds()).toBe(123);
    });


    it('should create a date representing new year in Bratislava', () => {
      const newYearInBratislava = new angular.mock.TzDate(-1, '2009-12-31T23:00:00.000Z');
      expect(newYearInBratislava.getTimezoneOffset()).toBe(-60);
      expect(newYearInBratislava.getFullYear()).toBe(2010);
      expect(newYearInBratislava.getMonth()).toBe(0);
      expect(newYearInBratislava.getDate()).toBe(1);
      expect(newYearInBratislava.getHours()).toBe(0);
      expect(newYearInBratislava.getMinutes()).toBe(0);
      expect(newYearInBratislava.getSeconds()).toBe(0);
    });


    it('should delegate all the UTC methods to the original UTC Date object', () => {
      // from when created from string
      const date1 = new angular.mock.TzDate(-1, '2009-12-31T23:00:00.000Z');
      expect(date1.getUTCFullYear()).toBe(2009);
      expect(date1.getUTCMonth()).toBe(11);
      expect(date1.getUTCDate()).toBe(31);
      expect(date1.getUTCHours()).toBe(23);
      expect(date1.getUTCMinutes()).toBe(0);
      expect(date1.getUTCSeconds()).toBe(0);


      // from when created from millis
      const date2 = new angular.mock.TzDate(-1, date1.getTime());
      expect(date2.getUTCFullYear()).toBe(2009);
      expect(date2.getUTCMonth()).toBe(11);
      expect(date2.getUTCDate()).toBe(31);
      expect(date2.getUTCHours()).toBe(23);
      expect(date2.getUTCMinutes()).toBe(0);
      expect(date2.getUTCSeconds()).toBe(0);
    });


    it('should throw error when no third param but toString called', () => {
      expect(() => { new angular.mock.TzDate(0,0).toString(); }).
                           toThrowError('Method \'toString\' is not implemented in the TzDate mock');
    });
  });


  describe('$log', () => {
    angular.forEach([true, false], (debugEnabled) => {
      describe(`debug ${  debugEnabled}`, () => {
        beforeEach(module(($logProvider) => {
          $logProvider.debugEnabled(debugEnabled);
        }));

        afterEach(inject(($log) => {
          $log.reset();
        }));

        it(`should skip debugging output if disabled (${  debugEnabled  })`, inject(($log) => {
            $log.log('fake log');
            $log.info('fake log');
            $log.warn('fake log');
            $log.error('fake log');
            $log.debug('fake log');
            expect($log.log.logs).toContain(['fake log']);
            expect($log.info.logs).toContain(['fake log']);
            expect($log.warn.logs).toContain(['fake log']);
            expect($log.error.logs).toContain(['fake log']);
            if (debugEnabled) {
              expect($log.debug.logs).toContain(['fake log']);
            } else {
              expect($log.debug.logs).toEqual([]);
            }
          }));
      });
    });

    describe('debug enabled (default)', () => {
      let $log;
      beforeEach(inject(['$log', function(log) {
        $log = log;
      }]));

      afterEach(inject(($log) => {
        $log.reset();
      }));

      it('should provide the log method', () => {
        expect(() => { $log.log(''); }).not.toThrow();
      });

      it('should provide the info method', () => {
        expect(() => { $log.info(''); }).not.toThrow();
      });

      it('should provide the warn method', () => {
        expect(() => { $log.warn(''); }).not.toThrow();
      });

      it('should provide the error method', () => {
        expect(() => { $log.error(''); }).not.toThrow();
      });

      it('should provide the debug method', () => {
        expect(() => { $log.debug(''); }).not.toThrow();
      });

      it('should store log messages', () => {
        $log.log('fake log');
        expect($log.log.logs).toContain(['fake log']);
      });

      it('should store info messages', () => {
        $log.info('fake log');
        expect($log.info.logs).toContain(['fake log']);
      });

      it('should store warn messages', () => {
        $log.warn('fake log');
        expect($log.warn.logs).toContain(['fake log']);
      });

      it('should store error messages', () => {
        $log.error('fake log');
        expect($log.error.logs).toContain(['fake log']);
      });

      it('should store debug messages', () => {
        $log.debug('fake log');
        expect($log.debug.logs).toContain(['fake log']);
      });

      it('should assertEmpty', () => {
        try {
          $log.error(new Error('MyError'));
          $log.warn(new Error('MyWarn'));
          $log.info(new Error('MyInfo'));
          $log.log(new Error('MyLog'));
          $log.debug(new Error('MyDebug'));
          $log.assertEmpty();
        } catch (error) {
          const err = error.message || error;
          expect(err).toMatch(/Error: MyError/m);
          expect(err).toMatch(/Error: MyWarn/m);
          expect(err).toMatch(/Error: MyInfo/m);
          expect(err).toMatch(/Error: MyLog/m);
          expect(err).toMatch(/Error: MyDebug/m);
        } finally {
          $log.reset();
        }
      });

      it('should reset state', () => {
        $log.error(new Error('MyError'));
        $log.warn(new Error('MyWarn'));
        $log.info(new Error('MyInfo'));
        $log.log(new Error('MyLog'));
        $log.reset();
        let passed = false;
        try {
          $log.assertEmpty(); // should not throw error!
          passed = true;
        } catch (e) {
          passed = e;
        }
        expect(passed).toBe(true);
      });
    });
  });


  describe('$interval', () => {
    it('should run tasks repeatedly', inject(($interval) => {
      let counter = 0;
      $interval(() => { counter++; }, 1000);

      expect(counter).toBe(0);

      $interval.flush(1000);
      expect(counter).toBe(1);

      $interval.flush(1000);
      expect(counter).toBe(2);

      $interval.flush(2000);
      expect(counter).toBe(4);
    }));


    it('should call $apply after each task is executed', inject(($interval, $rootScope) => {
      const applySpy = spyOn($rootScope, '$apply').and.callThrough();

      $interval(noop, 1000);
      expect(applySpy).not.toHaveBeenCalled();

      $interval.flush(1000);
      expect(applySpy).toHaveBeenCalledOnce();

      applySpy.calls.reset();

      $interval(noop, 1000);
      $interval(noop, 1000);
      $interval.flush(1000);
      expect(applySpy).toHaveBeenCalledTimes(3);
    }));


    it('should NOT call $apply if invokeApply is set to false',
        inject(($interval, $rootScope) => {
      const digestSpy = spyOn($rootScope, '$digest').and.callThrough();

      let counter = 0;
      $interval(() => { counter++; }, 1000, 0, false);

      expect(digestSpy).not.toHaveBeenCalled();
      expect(counter).toBe(0);

      $interval.flush(2000);
      expect(digestSpy).not.toHaveBeenCalled();
      expect(counter).toBe(2);
    }));


    it('should allow you to specify the delay time', inject(($interval) => {
      let counter = 0;
      $interval(() => { counter++; }, 123);

      expect(counter).toBe(0);

      $interval.flush(122);
      expect(counter).toBe(0);

      $interval.flush(1);
      expect(counter).toBe(1);
    }));


    it('should allow you to NOT specify the delay time', inject(($interval) => {
      let counterA = 0;
      let counterB = 0;

      $interval(() => { counterA++; });
      $interval(() => { counterB++; }, 0);

      $interval.flush(100);
      expect(counterA).toBe(100);
      expect(counterB).toBe(100);
      $interval.flush(100);
      expect(counterA).toBe(200);
      expect(counterB).toBe(200);
    }));


    it('should run tasks in correct relative order', inject(($interval) => {
      let counterA = 0;
      let counterB = 0;
      $interval(() => { counterA++; }, 0);
      $interval(() => { counterB++; }, 1000);

      $interval.flush(1000);
      expect(counterA).toBe(1000);
      expect(counterB).toBe(1);
      $interval.flush(999);
      expect(counterA).toBe(1999);
      expect(counterB).toBe(1);
      $interval.flush(1);
      expect(counterA).toBe(2000);
      expect(counterB).toBe(2);
    }));


    it('should NOT trigger zero-delay interval when flush has ran before', inject(($interval) => {
      let counterA = 0;
      let counterB = 0;

      $interval.flush(100);

      $interval(() => { counterA++; });
      $interval(() => { counterB++; }, 0);

      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      $interval.flush(100);

      expect(counterA).toBe(100);
      expect(counterB).toBe(100);
    }));


    it('should trigger zero-delay interval only once on flush zero', inject(($interval) => {
      let counterA = 0;
      let counterB = 0;

      $interval(() => { counterA++; });
      $interval(() => { counterB++; }, 0);

      $interval.flush(0);
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
      $interval.flush(0);
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
    }));


    it('should allow you to specify a number of iterations', inject(($interval) => {
      let counter = 0;
      $interval(() => {counter++;}, 1000, 2);

      $interval.flush(1000);
      expect(counter).toBe(1);
      $interval.flush(1000);
      expect(counter).toBe(2);
      $interval.flush(1000);
      expect(counter).toBe(2);
    }));


    describe('flush', () => {
      it('should move the clock forward by the specified time', inject(($interval) => {
        let counterA = 0;
        let counterB = 0;
        $interval(() => { counterA++; }, 100);
        $interval(() => { counterB++; }, 401);

        $interval.flush(200);
        expect(counterA).toEqual(2);

        $interval.flush(201);
        expect(counterA).toEqual(4);
        expect(counterB).toEqual(1);
      }));
    });


    it('should return a promise which will be updated with the count on each iteration',
        inject(($interval) => {
      const log = [];
          const promise = $interval(() => { log.push('tick'); }, 1000);

      promise.then((value) => { log.push(`promise success: ${  value}`); },
                   (err) => { log.push(`promise error: ${  err}`); },
                   (note) => { log.push(`promise update: ${  note}`); });
      expect(log).toEqual([]);

      $interval.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0']);

      $interval.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0', 'tick', 'promise update: 1']);
    }));


    it('should return a promise which will be resolved after the specified number of iterations',
        inject(($interval) => {
      const log = [];
          const promise = $interval(() => { log.push('tick'); }, 1000, 2);

      promise.then((value) => { log.push(`promise success: ${  value}`); },
                   (err) => { log.push(`promise error: ${  err}`); },
                   (note) => { log.push(`promise update: ${  note}`); });
      expect(log).toEqual([]);

      $interval.flush(1000);
      expect(log).toEqual(['tick', 'promise update: 0']);
      $interval.flush(1000);

      expect(log).toEqual([
        'tick', 'promise update: 0', 'tick', 'promise update: 1', 'promise success: 2'
      ]);

    }));


    describe('exception handling', () => {
      beforeEach(module(($exceptionHandlerProvider) => {
        $exceptionHandlerProvider.mode('log');
      }));


      it('should delegate exception to the $exceptionHandler service', inject(
          ($interval, $exceptionHandler) => {
        $interval(() => { throw 'Test Error'; }, 1000);
        expect($exceptionHandler.errors).toEqual([]);

        $interval.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error']);

        $interval.flush(1000);
        expect($exceptionHandler.errors).toEqual(['Test Error', 'Test Error']);
      }));


      it('should call $apply even if an exception is thrown in callback', inject(
          ($interval, $rootScope) => {
        const applySpy = spyOn($rootScope, '$apply').and.callThrough();

        $interval(() => { throw new Error('Test Error'); }, 1000);
        expect(applySpy).not.toHaveBeenCalled();

        $interval.flush(1000);
        expect(applySpy).toHaveBeenCalled();
      }));


      it('should still update the interval promise when an exception is thrown',
          inject(($interval) => {
        const log = [];
            const promise = $interval(() => { throw new Error('Some Error'); }, 1000);

        promise.then((value) => { log.push(`promise success: ${  value}`); },
                   (err) => { log.push(`promise error: ${  err}`); },
                   (note) => { log.push(`promise update: ${  note}`); });
        $interval.flush(1000);

        expect(log).toEqual(['promise update: 0']);
      }));
    });


    describe('cancel', () => {
      it('should cancel tasks', inject(($interval) => {
        const task1 = jasmine.createSpy('task1', 1000);
            const task2 = jasmine.createSpy('task2', 1000);
            const task3 = jasmine.createSpy('task3', 1000);
            let promise1; let promise3;

        promise1 = $interval(task1, 200);
        $interval(task2, 1000);
        promise3 = $interval(task3, 333);

        $interval.cancel(promise3);
        $interval.cancel(promise1);
        $interval.flush(1000);

        expect(task1).not.toHaveBeenCalled();
        expect(task2).toHaveBeenCalledOnce();
        expect(task3).not.toHaveBeenCalled();
      }));


      it('should cancel the promise', inject(($interval, $rootScope) => {
        const promise = $interval(noop, 1000);
            const log = [];
        promise.then((value) => { log.push(`promise success: ${  value}`); },
                   (err) => { log.push(`promise error: ${  err}`); },
                   (note) => { log.push(`promise update: ${  note}`); });
        expect(log).toEqual([]);

        $interval.flush(1000);
        $interval.cancel(promise);
        $interval.flush(1000);
        $rootScope.$apply(); // For resolving the promise -
                             // necessary since q uses $rootScope.evalAsync.

        expect(log).toEqual(['promise update: 0', 'promise error: canceled']);
      }));


      it('should return true if a task was successfully canceled', inject(($interval) => {
        const task1 = jasmine.createSpy('task1');
            const task2 = jasmine.createSpy('task2');
            let promise1; let promise2;

        promise1 = $interval(task1, 1000, 1);
        $interval.flush(1000);
        promise2 = $interval(task2, 1000, 1);

        expect($interval.cancel(promise1)).toBe(false);
        expect($interval.cancel(promise2)).toBe(true);
      }));


      it('should not throw a runtime exception when given an undefined promise',
          inject(($interval) => {
        const task1 = jasmine.createSpy('task1');
            let promise1;

        promise1 = $interval(task1, 1000, 1);

        expect($interval.cancel()).toBe(false);
      }));
    });
  });


  describe('$browser', () => {
    let browser; let log;
    beforeEach(inject(($browser) => {
      browser = $browser;
      log = '';
    }));

    function logFn(text) {
      return function() {
        log += `${text  };`;
      };
    }

    describe('defer.flush', () => {
      it('should flush', () => {
        browser.defer(logFn('A'));
        browser.defer(logFn('B'), null, 'taskType');
        expect(log).toEqual('');

        browser.defer.flush();
        expect(log).toEqual('A;B;');
      });

      it('should flush delayed', () => {
        browser.defer(logFn('A'));
        browser.defer(logFn('B'), 0, 'taskTypeB');
        browser.defer(logFn('C'), 10, 'taskTypeC');
        browser.defer(logFn('D'), 20);
        expect(log).toEqual('');
        expect(browser.defer.now).toEqual(0);

        browser.defer.flush(0);
        expect(log).toEqual('A;B;');

        browser.defer.flush();
        expect(log).toEqual('A;B;C;D;');
      });

      it('should defer and flush over time', () => {
        browser.defer(logFn('A'), 1);
        browser.defer(logFn('B'), 2, 'taskType');
        browser.defer(logFn('C'), 3);

        browser.defer.flush(0);
        expect(browser.defer.now).toEqual(0);
        expect(log).toEqual('');

        browser.defer.flush(1);
        expect(browser.defer.now).toEqual(1);
        expect(log).toEqual('A;');

        browser.defer.flush(2);
        expect(browser.defer.now).toEqual(3);
        expect(log).toEqual('A;B;C;');
      });

      it('should throw an exception if there is nothing to be flushed', () => {
        expect(() => {browser.defer.flush();}).toThrowError('No deferred tasks to be flushed');
      });

      it('should not throw an exception when passing a specific delay', () => {
        expect(() => {browser.defer.flush(100);}).not.toThrow();
      });

      describe('tasks scheduled during flushing', () => {
        it('should be flushed if they do not exceed the target delay (when no delay specified)',
          () => {
            browser.defer(() => {
              logFn('1')();
              browser.defer(() => {
                logFn('3')();
                browser.defer(logFn('4'), 1);
              }, 2);
            }, 1);
            browser.defer(() => {
              logFn('2')();
              browser.defer(logFn('6'), 4);
            }, 2);
            browser.defer(logFn('5'), 5);

            browser.defer.flush(0);
            expect(browser.defer.now).toEqual(0);
            expect(log).toEqual('');

            browser.defer.flush();
            expect(browser.defer.now).toEqual(5);
            expect(log).toEqual('1;2;3;4;5;');
          }
        );

        it('should be flushed if they do not exceed the specified delay',
          () => {
            browser.defer(() => {
              logFn('1')();
              browser.defer(() => {
                logFn('3')();
                browser.defer(logFn('4'), 1);
              }, 2);
            }, 1);
            browser.defer(() => {
              logFn('2')();
              browser.defer(logFn('6'), 4);
            }, 2);
            browser.defer(logFn('5'), 5);

            browser.defer.flush(0);
            expect(browser.defer.now).toEqual(0);
            expect(log).toEqual('');

            browser.defer.flush(4);
            expect(browser.defer.now).toEqual(4);
            expect(log).toEqual('1;2;3;4;');

            browser.defer.flush(6);
            expect(browser.defer.now).toEqual(10);
            expect(log).toEqual('1;2;3;4;5;6;');
          }
        );
      });
    });

    describe('defer.cancel', () => {
      it('should cancel a pending task', () => {
        const taskId1 = browser.defer(logFn('A'), 100, 'fooType');
        const taskId2 = browser.defer(logFn('B'), 200);

        expect(log).toBe('');
        expect(() => {browser.defer.verifyNoPendingTasks('fooType');}).toThrow();
        expect(() => {browser.defer.verifyNoPendingTasks();}).toThrow();

        browser.defer.cancel(taskId1);
        expect(() => {browser.defer.verifyNoPendingTasks('fooType');}).not.toThrow();
        expect(() => {browser.defer.verifyNoPendingTasks();}).toThrow();

        browser.defer.cancel(taskId2);
        expect(() => {browser.defer.verifyNoPendingTasks('fooType');}).not.toThrow();
        expect(() => {browser.defer.verifyNoPendingTasks();}).not.toThrow();

        browser.defer.flush(1000);
        expect(log).toBe('');
      });
    });

    describe('defer.verifyNoPendingTasks', () => {
      it('should throw if there are pending tasks', () => {
        expect(browser.defer.verifyNoPendingTasks).not.toThrow();

        browser.defer(noop);
        expect(browser.defer.verifyNoPendingTasks).toThrow();
      });

      it('should list the pending tasks (in order) in the error message', () => {
        browser.defer(noop, 100);
        browser.defer(noop, 300, 'fooType');
        browser.defer(noop, 200, 'barType');

        const expectedError =
          'Deferred tasks to flush (3):\n' +
          '  {id: 0, type: $$default$$, time: 100}\n' +
          '  {id: 2, type: barType, time: 200}\n' +
          '  {id: 1, type: fooType, time: 300}';
        expect(browser.defer.verifyNoPendingTasks).toThrowError(expectedError);
      });

      describe('with specific task type', () => {
        it('should throw if there are pending tasks', () => {
          browser.defer(noop, 0, 'fooType');

          expect(() => {browser.defer.verifyNoPendingTasks('barType');}).not.toThrow();
          expect(() => {browser.defer.verifyNoPendingTasks('fooType');}).toThrow();
          expect(() => {browser.defer.verifyNoPendingTasks();}).toThrow();
        });

        it('should list the pending tasks (in order) in the error message', () => {
          browser.defer(noop, 100);
          browser.defer(noop, 300, 'fooType');
          browser.defer(noop, 200, 'barType');
          browser.defer(noop, 400, 'fooType');

          const expectedError =
            'Deferred tasks to flush (2):\n' +
            '  {id: 1, type: fooType, time: 300}\n' +
            '  {id: 3, type: fooType, time: 400}';
          expect(() => {browser.defer.verifyNoPendingTasks('fooType');}).
            toThrowError(expectedError);
        });
      });
    });

    describe('notifyWhenNoOutstandingRequests', () => {
      let callback;
      beforeEach(() => {
        callback = jasmine.createSpy('callback');
      });

      it('should immediately run the callback if no pending tasks', () => {
        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).toHaveBeenCalled();
      });

      it('should run the callback as soon as there are no pending tasks', () => {
        browser.defer(noop, 100);
        browser.defer(noop, 200);

        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).toHaveBeenCalled();
      });

      it('should not run the callback more than once', () => {
        browser.defer(noop, 100);
        browser.notifyWhenNoOutstandingRequests(callback);
        expect(callback).not.toHaveBeenCalled();

        browser.defer.flush(100);
        expect(callback).toHaveBeenCalledOnce();

        browser.defer(noop, 200);
        browser.defer.flush(100);
        expect(callback).toHaveBeenCalledOnce();
      });

      describe('with specific task type', () => {
        it('should immediately run the callback if no pending tasks', () => {
          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).toHaveBeenCalled();
        });

        it('should run the callback as soon as there are no pending tasks', () => {
          browser.defer(noop, 100, 'fooType');
          browser.defer(noop, 200, 'barType');

          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).not.toHaveBeenCalled();

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalled();
        });

        it('should not run the callback more than once', () => {
          browser.defer(noop, 100, 'fooType');
          browser.defer(noop, 200);

          browser.notifyWhenNoOutstandingRequests(callback, 'fooType');
          expect(callback).not.toHaveBeenCalled();

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalledOnce();

          browser.defer.flush(100);
          expect(callback).toHaveBeenCalledOnce();

          browser.defer(noop, 100, 'fooType');
          browser.defer(noop, 200);
          browser.defer.flush();
          expect(callback).toHaveBeenCalledOnce();
        });
      });
    });
  });


  describe('$flushPendingTasks', () => {
    let $flushPendingTasks;
    let browserDeferFlushSpy;

    beforeEach(inject(($browser, _$flushPendingTasks_) => {
      $flushPendingTasks = _$flushPendingTasks_;
      browserDeferFlushSpy = spyOn($browser.defer, 'flush').and.returnValue('flushed');
    }));

    it('should delegate to `$browser.defer.flush()`', () => {
      const result = $flushPendingTasks(42);

      expect(browserDeferFlushSpy).toHaveBeenCalledOnceWith(42);
      expect(result).toBe('flushed');
    });
  });


  describe('$verifyNoPendingTasks', () => {
    let $verifyNoPendingTasks;
    let browserDeferVerifySpy;

    beforeEach(inject(($browser, _$verifyNoPendingTasks_) => {
      $verifyNoPendingTasks = _$verifyNoPendingTasks_;
      browserDeferVerifySpy = spyOn($browser.defer, 'verifyNoPendingTasks').and.returnValue('verified');
    }));

    it('should delegate to `$browser.defer.verifyNoPendingTasks()`', () => {
      const result = $verifyNoPendingTasks('fortyTwo');

      expect(browserDeferVerifySpy).toHaveBeenCalledOnceWith('fortyTwo');
      expect(result).toBe('verified');
    });
  });


  describe('$exceptionHandler', () => {
    it('should rethrow exceptions', inject(($exceptionHandler) => {
      expect(() => { $exceptionHandler('myException'); }).toThrow('myException');
    }));


    it('should log exceptions', () => {
      module(($exceptionHandlerProvider) => {
        $exceptionHandlerProvider.mode('log');
      });
      inject(($exceptionHandler) => {
        $exceptionHandler('MyError');
        expect($exceptionHandler.errors).toEqual(['MyError']);

        $exceptionHandler('MyError', 'comment');
        expect($exceptionHandler.errors[1]).toEqual(['MyError', 'comment']);
      });
    });

    it('should log and rethrow exceptions', () => {
      module(($exceptionHandlerProvider) => {
        $exceptionHandlerProvider.mode('rethrow');
      });
      inject(($exceptionHandler) => {
        expect(() => { $exceptionHandler('MyError'); }).toThrow('MyError');
        expect($exceptionHandler.errors).toEqual(['MyError']);

        expect(() => { $exceptionHandler('MyError', 'comment'); }).toThrow('MyError');
        expect($exceptionHandler.errors[1]).toEqual(['MyError', 'comment']);
      });
    });

    it('should throw on wrong argument', () => {
      module(($exceptionHandlerProvider) => {
        expect(() => {
          $exceptionHandlerProvider.mode('XXX');
        }).toThrowError('Unknown mode \'XXX\', only \'log\'/\'rethrow\' modes are allowed!');
      });

      inject(); // Trigger the tests in `module`
    });
  });


  describe('$timeout', () => {
    it('should expose flush method that will flush the pending queue of tasks', inject(
        ($rootScope, $timeout) => {
      const logger = [];
          const logFn = function(msg) { return function() { logger.push(msg); }; };

      $timeout(logFn('t1'));
      $timeout(logFn('t2'), 200);
      $rootScope.$evalAsync(logFn('rs'));  // Non-timeout tasks are flushed as well.
      $timeout(logFn('t3'));
      expect(logger).toEqual([]);

      $timeout.flush();
      expect(logger).toEqual(['t1', 'rs', 't3', 't2']);
    }));


    it('should throw an exception when not flushed', inject(($rootScope, $timeout) => {
      $timeout(noop, 100);
      $rootScope.$evalAsync(noop);

      const expectedError =
        'Deferred tasks to flush (2):\n' +
        '  {id: 1, type: $evalAsync, time: 0}\n' +
        '  {id: 0, type: $timeout, time: 100}';
      expect($timeout.verifyNoPendingTasks).toThrowError(expectedError);
    }));


    it('should recommend `$verifyNoPendingTasks()` when all pending tasks are not timeouts',
      inject(($rootScope, $timeout) => {
        const extraMessage = 'None of the pending tasks are timeouts. If you only want to verify ' +
            'pending timeouts, use `$verifyNoPendingTasks(\'$timeout\')` instead.';
        let errorMessage;

        $timeout(noop, 100);
        $rootScope.$evalAsync(noop);
        try { $timeout.verifyNoPendingTasks(); } catch (err) { errorMessage = err.message; }

        expect(errorMessage).not.toContain(extraMessage);

        $timeout.flush(100);
        $rootScope.$evalAsync(noop);
        try { $timeout.verifyNoPendingTasks(); } catch (err) { errorMessage = err.message; }

        expect(errorMessage).toContain(extraMessage);
      })
    );


    it('should do nothing when all tasks have been flushed', inject(($rootScope, $timeout) => {
      $timeout(noop, 100);
      $rootScope.$evalAsync(noop);

      $timeout.flush();
      expect($timeout.verifyNoPendingTasks).not.toThrow();
    }));


    it('should check against the delay if provided within timeout', inject(($timeout) => {
      $timeout(noop, 100);
      $timeout.flush(100);
      expect($timeout.verifyNoPendingTasks).not.toThrow();

      $timeout(noop, 1000);
      $timeout.flush(100);
      expect($timeout.verifyNoPendingTasks).toThrow();

      $timeout.flush(900);
      expect($timeout.verifyNoPendingTasks).not.toThrow();
    }));


    it('should assert against the delay value', inject(($timeout) => {
      let count = 0;
      const iterate = function() {
        count++;
      };

      $timeout(iterate, 100);
      $timeout(iterate, 123);
      $timeout.flush(100);
      expect(count).toBe(1);
      $timeout.flush(123);
      expect(count).toBe(2);
    }));


    it('should resolve timeout functions following the timeline', inject(($timeout) => {
      let count1 = 0; let count2 = 0;
      const iterate1 = function() {
        count1++;
        $timeout(iterate1, 100);
      };
      const iterate2 = function() {
        count2++;
        $timeout(iterate2, 150);
      };

      $timeout(iterate1, 100);
      $timeout(iterate2, 150);
      $timeout.flush(150);
      expect(count1).toBe(1);
      expect(count2).toBe(1);
      $timeout.flush(50);
      expect(count1).toBe(2);
      expect(count2).toBe(1);
      $timeout.flush(400);
      expect(count1).toBe(6);
      expect(count2).toBe(4);
    }));
  });


  describe('angular.mock.dump', () => {
    const d = angular.mock.dump;


    it('should serialize primitive types', () => {
      expect(d(undefined)).toEqual('undefined');
      expect(d(1)).toEqual('1');
      expect(d(null)).toEqual('null');
      expect(d('abc')).toEqual('abc');
    });


    it('should serialize element', () => {
      const e = angular.element('<div>abc</div><span>xyz</span>');
      expect(d(e).toLowerCase()).toEqual('<div>abc</div><span>xyz</span>');
      expect(d(e[0]).toLowerCase()).toEqual('<div>abc</div>');
    });

    it('should serialize scope', inject(($rootScope) => {
      $rootScope.obj = {abc:'123'};
      expect(d($rootScope)).toMatch(/Scope\(.*\): \{/);
      expect(d($rootScope)).toMatch(/{"abc":"123"}/);
    }));

    it('should serialize scope that has overridden "hasOwnProperty"', inject(($rootScope, $sniffer) => {
      $rootScope.hasOwnProperty = 'X';
      expect(d($rootScope)).toMatch(/Scope\(.*\): \{/);
      expect(d($rootScope)).toMatch(/hasOwnProperty: "X"/);
    }));
  });


  describe('jasmine module and inject', () => {
    let log;

    beforeEach(() => {
      log = '';
    });

    describe('module', () => {

      describe('object literal format', () => {
        const mock = { log: 'module' };

        beforeEach(() => {
          angular.module('stringRefModule', []).service('stringRef', () => {});

          module({
              'service': mock,
              'other': { some: 'replacement'}
            },
            'stringRefModule',
            ($provide) => { $provide.value('example', 'win'); }
          );
        });

        it('should inject the mocked module', () => {
          inject((service) => {
            expect(service).toEqual(mock);
          });
        });

        it('should support multiple key value pairs', () => {
          inject((service, other) => {
            expect(other.some).toEqual('replacement');
            expect(service).toEqual(mock);
          });
        });

        it('should integrate with string and function', () => {
          inject((service, stringRef, example) => {
            expect(service).toEqual(mock);
            expect(stringRef).toBeDefined();
            expect(example).toEqual('win');
          });
        });

        describe('$inject cleanup', () => {
          function testFn() {

          }

          it('should add $inject when invoking test function', inject(($injector) => {
            $injector.invoke(testFn);
            expect(testFn.$inject).toBeDefined();
          }));

          it('should cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeUndefined();
          });

          it('should add $inject when annotating test function', inject(($injector) => {
            $injector.annotate(testFn);
            expect(testFn.$inject).toBeDefined();
          }));

          it('should cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeUndefined();
          });

          it('should invoke an already annotated function', inject(($injector) => {
            testFn.$inject = [];
            $injector.invoke(testFn);
          }));

          it('should not cleanup $inject after previous test', () => {
            expect(testFn.$inject).toBeDefined();
          });
        });
      });

      describe('in DSL', () => {
        it('should load module', module(() => {
          log += 'module';
        }));

        afterEach(() => {
          inject();
          expect(log).toEqual('module');
        });
      });

      describe('nested calls', () => {
        it('should invoke nested module calls immediately', () => {
          module(($provide) => {
            $provide.constant('someConst', 'blah');
            module((someConst) => {
              log = someConst;
            });
          });
          inject(() => {
            expect(log).toBe('blah');
          });
        });
      });

      describe('inline in test', () => {
        it('should load module', () => {
          module(() => {
            log += 'module';
          });
          inject();
        });

        afterEach(() => {
          expect(log).toEqual('module');
        });
      });
    });

    describe('inject', () => {
      describe('in DSL', () => {
        it('should load module', inject(() => {
          log += 'inject';
        }));

        afterEach(() => {
          expect(log).toEqual('inject');
        });
      });


      describe('inline in test', () => {
        it('should load module', () => {
          inject(() => {
            log += 'inject';
          });
        });

        afterEach(() => {
          expect(log).toEqual('inject');
        });
      });

      describe('module with inject', () => {
        beforeEach(module(() => {
          log += 'module;';
        }));

        it('should inject', inject(() => {
          log += 'inject;';
        }));

        afterEach(() => {
          expect(log).toEqual('module;inject;');
        });
      });

      it('should not change thrown Errors', inject(($sniffer) => {
        expect(() => {
          inject(() => {
            throw new Error('test message');
          });
        }).toThrow(jasmine.objectContaining({message: 'test message'}));
      }));

      it('should not change thrown strings', inject(($sniffer) => {
        expect(() => {
          inject(() => {
            throw 'test message';
          });
        }).toThrow('test message');
      }));

      describe('error stack trace when called outside of spec context', () => {
        // - Chrome, Firefox, Edge give us the stack trace as soon as an Error is created
        // - IE10+, PhantomJS give us the stack trace only once the error is thrown
        // - IE9 does not provide stack traces
        const stackTraceSupported = (function() {
          const error = new Error();
          if (!error.stack) {
            try {
              throw error;
            } catch (e) { /* empty */}
          }

          return !!error.stack;
        })();

        function testCaller() {
          return inject(() => {
            throw new Error();
          });
        }
        const throwErrorFromInjectCallback = testCaller();

        if (stackTraceSupported) {
          describe('on browsers supporting stack traces', () => {
            it('should update thrown Error stack trace with inject call location', () => {
              try {
                throwErrorFromInjectCallback();
              } catch (e) {
                expect(e.stack).toMatch('injectableError');
              }
            });
          });
        } else {
          describe('on browsers not supporting stack traces', () => {
            it('should not add stack trace information to thrown Error', () => {
              try {
                throwErrorFromInjectCallback();
              } catch (e) {
                expect(e.stack).toBeUndefined();
              }
            });
          });
        }
      });

      describe('ErrorAddingDeclarationLocationStack', () => {
        it('should be caught by Jasmine\'s `toThrowError()`', () => {
          function throwErrorAddingDeclarationStack() {
            module(($provide) => {
              $provide.factory('badFactory', () => {
                throw new Error('BadFactoryError');
              });
            });

            inject((badFactory) => {});
          }

          expect(throwErrorAddingDeclarationStack).toThrowError(/BadFactoryError/);
        });
      });
    });
  });


  describe('$httpBackend', () => {
    let hb; let callback;

    beforeEach(inject(($httpBackend) => {
      callback = jasmine.createSpy('callback');
      hb = $httpBackend;
    }));


    it('should provide "expect" methods for each HTTP verb', () => {
      expect(typeof hb.expectGET).toBe('function');
      expect(typeof hb.expectPOST).toBe('function');
      expect(typeof hb.expectPUT).toBe('function');
      expect(typeof hb.expectPATCH).toBe('function');
      expect(typeof hb.expectDELETE).toBe('function');
      expect(typeof hb.expectHEAD).toBe('function');
    });


    it('should provide "when" methods for each HTTP verb', () => {
      expect(typeof hb.whenGET).toBe('function');
      expect(typeof hb.whenPOST).toBe('function');
      expect(typeof hb.whenPUT).toBe('function');
      expect(typeof hb.whenPATCH).toBe('function');
      expect(typeof hb.whenDELETE).toBe('function');
      expect(typeof hb.whenHEAD).toBe('function');
    });


    it('should provide "route" shortcuts for expect and when', () => {
      expect(typeof hb.whenRoute).toBe('function');
      expect(typeof hb.expectRoute).toBe('function');
    });


    it('should respond with first matched definition by default', () => {
      hb.when('GET', '/url1').respond(200, 'content', {});
      hb.when('GET', '/url1').respond(201, 'another', {});

      callback.and.callFake((status, response) => {
        expect(status).toBe(200);
        expect(response).toBe('content');
      });

      hb('GET', '/url1', null, callback);
      expect(callback).not.toHaveBeenCalled();
      hb.flush();
      expect(callback).toHaveBeenCalledOnce();
    });


    describe('matchLatestDefinitionEnabled()', () => {

      it('should be set to false by default', () => {
        expect(hb.matchLatestDefinitionEnabled()).toBe(false);
      });


      it('should allow to change the value', () => {
        hb.matchLatestDefinitionEnabled(true);
        expect(hb.matchLatestDefinitionEnabled()).toBe(true);
      });


      it('should return the httpBackend when used as a setter', () => {
        expect(hb.matchLatestDefinitionEnabled(true)).toBe(hb);
      });


      it('should respond with the first matched definition when false',
        () => {
          hb.matchLatestDefinitionEnabled(false);

          hb.when('GET', '/url1').respond(200, 'content', {});
          hb.when('GET', '/url1').respond(201, 'another', {});

          callback.and.callFake((status, response) => {
            expect(status).toBe(200);
            expect(response).toBe('content');
          });

          hb('GET', '/url1', null, callback);
          expect(callback).not.toHaveBeenCalled();
          hb.flush();
          expect(callback).toHaveBeenCalledOnce();
        }
      );


      it('should respond with latest matched definition when true',
        () => {
          hb.matchLatestDefinitionEnabled(true);

          hb.when('GET', '/url1').respond(200, 'match1', {});
          hb.when('GET', '/url1').respond(200, 'match2', {});
          hb.when('GET', '/url2').respond(204, 'nomatch', {});

          callback.and.callFake((status, response) => {
            expect(status).toBe(200);
            expect(response).toBe('match2');
          });

          hb('GET', '/url1', null, callback);

          // Check if a newly added match is used
          hb.when('GET', '/url1').respond(201, 'match3', {});

          const callback2 = jasmine.createSpy();

          callback2.and.callFake((status, response) => {
            expect(status).toBe(201);
            expect(response).toBe('match3');
          });

          hb('GET', '/url1', null, callback2);
          expect(callback).not.toHaveBeenCalled();
          hb.flush();
          expect(callback).toHaveBeenCalledOnce();
        }
      );
    });


    it('should respond with a copy of the mock data', () => {
      const mockObject = {a: 'b'};

      hb.when('GET', '/url1').respond(200, mockObject, {});

      callback.and.callFake((status, response) => {
        expect(status).toBe(200);
        expect(response).toEqual({a: 'b'});
        expect(response).not.toBe(mockObject);
        response.a = 'c';
      });

      hb('GET', '/url1', null, callback);
      hb.flush();
      expect(callback).toHaveBeenCalledOnce();

      // Fire it again and verify that the returned mock data has not been
      // modified.
      callback.calls.reset();
      hb('GET', '/url1', null, callback);
      hb.flush();
      expect(callback).toHaveBeenCalledOnce();
      expect(mockObject).toEqual({a: 'b'});
    });


    it('should be able to handle Blobs as mock data', () => {
      if (typeof Blob !== 'undefined') {
        // eslint-disable-next-line no-undef
        const mockBlob = new Blob(['{"foo":"bar"}'], {type: 'application/json'});

        hb.when('GET', '/url1').respond(200, mockBlob, {});

        callback.and.callFake((status, response) => {
          expect(response).not.toBe(mockBlob);
          expect(response.size).toBe(13);
          expect(response.type).toBe('application/json');
          expect(response.toString()).toBe('[object Blob]');
        });

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnce();
      }
    });


    it('should throw error when unexpected request', () => {
      hb.when('GET', '/url1').respond(200, 'content');
      expect(() => {
        hb('GET', '/xxx');
      }).toThrowError('Unexpected request: GET /xxx\nNo more request expected');
    });


    it('should throw error when expectation fails', () => {
      expect(() => {
        hb.expectPOST('/some', {foo: 1}).respond({});
        hb('POST', '/some', {foo: 2}, callback);
        hb.flush();
      }).toThrowError(/^Expected POST \/some with different data/);
    });


    it('should throw error when expectation about headers fails', () => {
      expect(() => {
        hb.expectPOST('/some', {foo: 1}, {X: 'val1'}).respond({});
        hb('POST', '/some', {foo: 1}, callback, {X: 'val2'});
        hb.flush();
      }).toThrowError(/^Expected POST \/some with different headers/);
    });


    it('should throw error about data when expectations about both data and headers fail', () => {
      expect(() => {
        hb.expectPOST('/some', {foo: 1}, {X: 'val1'}).respond({});
        hb('POST', '/some', {foo: 2}, callback, {X: 'val2'});
        hb.flush();
      }).toThrowError(/^Expected POST \/some with different data/);
    });


    it('should throw error when response is not defined for a backend definition', () => {
      expect(() => {
        hb.whenGET('/some'); // no .respond(...) !
        hb('GET', '/some', null, callback);
        hb.flush();
      }).toThrowError('No response defined !');
    });


    it('should match headers if specified', () => {
      hb.when('GET', '/url', null, {'X': 'val1'}).respond(201, 'content1');
      hb.when('GET', '/url', null, {'X': 'val2'}).respond(202, 'content2');
      hb.when('GET', '/url').respond(203, 'content3');

      hb('GET', '/url', null, (status, response) => {
        expect(status).toBe(203);
        expect(response).toBe('content3');
      });

      hb('GET', '/url', null, (status, response) => {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      }, {'X': 'val1'});

      hb('GET', '/url', null, (status, response) => {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      }, {'X': 'val2'});

      hb.flush();
    });


    it('should match data if specified', () => {
      hb.when('GET', '/a/b', '{a: true}').respond(201, 'content1');
      hb.when('GET', '/a/b').respond(202, 'content2');

      hb('GET', '/a/b', '{a: true}', (status, response) => {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', null, (status, response) => {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      });

      hb.flush();
    });


    it('should match data object if specified', () => {
      hb.when('GET', '/a/b', {a: 1, b: 2}).respond(201, 'content1');
      hb.when('GET', '/a/b').respond(202, 'content2');

      hb('GET', '/a/b', '{"a":1,"b":2}', (status, response) => {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', '{"b":2,"a":1}', (status, response) => {
        expect(status).toBe(201);
        expect(response).toBe('content1');
      });

      hb('GET', '/a/b', null, (status, response) => {
        expect(status).toBe(202);
        expect(response).toBe('content2');
      });

      hb.flush();
    });


    it('should match only method', () => {
      hb.when('GET').respond(202, 'c');
      callback.and.callFake((status, response) => {
        expect(status).toBe(202);
        expect(response).toBe('c');
      });

      hb('GET', '/some', null, callback, {});
      hb('GET', '/another', null, callback, {'X-Fake': 'Header'});
      hb('GET', '/third', 'some-data', callback, {});
      hb.flush();

      expect(callback).toHaveBeenCalled();
    });


    it('should not error if the url is not provided', () => {
      expect(() => {
        hb.when('GET');

        hb.whenGET();
        hb.whenPOST();
        hb.whenPUT();
        hb.whenPATCH();
        hb.whenDELETE();
        hb.whenHEAD();

        hb.expect('GET');

        hb.expectGET();
        hb.expectPOST();
        hb.expectPUT();
        hb.expectPATCH();
        hb.expectDELETE();
        hb.expectHEAD();
      }).not.toThrow();
    });


    it('should error if the url is undefined', () => {
      expect(() => {
        hb.when('GET', undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenGET(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenDELETE(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenJSONP(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenHEAD(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenPATCH(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenPOST(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.whenPUT(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');


      expect(() => {
        hb.expect('GET', undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectGET(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectDELETE(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectJSONP(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectHEAD(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectPATCH(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectPOST(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');

      expect(() => {
        hb.expectPUT(undefined);
      }).toThrowError('Undefined argument `url`; the argument is provided but not defined');
    });


    it('should preserve the order of requests', () => {
      hb.when('GET', '/url1').respond(200, 'first');
      hb.when('GET', '/url2').respond(201, 'second');

      hb('GET', '/url2', null, callback);
      hb('GET', '/url1', null, callback);

      hb.flush();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback.calls.argsFor(0)).toEqual([201, 'second', '', '', 'complete']);
      expect(callback.calls.argsFor(1)).toEqual([200, 'first', '', '', 'complete']);
    });


    describe('respond()', () => {
      it('should take values', () => {
        hb.expect('GET', '/url1').respond(200, 'first', {'header': 'val'}, 'OK');
        hb('GET', '/url1', undefined, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'first', 'header: val', 'OK', 'complete');
      });

      it('should default status code to 200', () => {
        callback.and.callFake((status, response) => {
          expect(status).toBe(200);
          expect(response).toBe('some-data');
        });

        hb.expect('GET', '/url1').respond('some-data');
        hb.expect('GET', '/url2').respond('some-data', {'X-Header': 'true'});
        hb('GET', '/url1', null, callback);
        hb('GET', '/url2', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });

      it('should default status code to 200 and provide status text', () => {
        hb.expect('GET', '/url1').respond('first', {'header': 'val'}, 'OK');
        hb('GET', '/url1', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'first', 'header: val', 'OK', 'complete');
      });

      it('should default xhrStatus to complete', () => {
        callback.and.callFake((status, response, headers, x, xhrStatus) => {
          expect(xhrStatus).toBe('complete');
        });

        hb.expect('GET', '/url1').respond('some-data');
        hb('GET', '/url1', null, callback);

        hb.flush();
        expect(callback).toHaveBeenCalled();
      });

      it('should take function', () => {
        hb.expect('GET', '/some?q=s').respond((m, u, d, h, p) => [301, `${m + u  };${  d  };a=${  h.a  };q=${  p.q}`, {'Connection': 'keep-alive'}, 'Moved Permanently']);

        hb('GET', '/some?q=s', 'data', callback, {a: 'b'});
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(301, 'GET/some?q=s;data;a=b;q=s', 'Connection: keep-alive', 'Moved Permanently', undefined);
      });

      it('should decode query parameters in respond() function', () => {
        hb.expect('GET', '/url?query=l%E2%80%A2ng%20string%20w%2F%20spec%5Eal%20char%24&id=1234&orderBy=-name')
        .respond((m, u, d, h, p) => [200, `id=${  p.id  };orderBy=${  p.orderBy  };query=${  p.query}`]);

        hb('GET', '/url?query=l%E2%80%A2ng%20string%20w%2F%20spec%5Eal%20char%24&id=1234&orderBy=-name', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'id=1234;orderBy=-name;query=l•ng string w/ spec^al char$', '', '', undefined);
      });

      it('should include regex captures in respond() params when keys provided', () => {
        hb.expect('GET', /\/(.+)\/article\/(.+)/, undefined, undefined, ['id', 'name'])
        .respond((m, u, d, h, p) => [200, `id=${  p.id  };name=${  p.name}`]);

        hb('GET', '/1234/article/cool-angular-article', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalledOnceWith(200, 'id=1234;name=cool-angular-article', '', '', undefined);
      });

      it('should default response headers to ""', () => {
        hb.expect('GET', '/url1').respond(200, 'first');
        hb.expect('GET', '/url2').respond('second');

        hb('GET', '/url1', null, callback);
        hb('GET', '/url2', null, callback);

        hb.flush();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)).toEqual([200, 'first', '', '', 'complete']);
        expect(callback.calls.argsFor(1)).toEqual([200, 'second', '', '', 'complete']);
      });

      it('should be able to override response of expect definition', () => {
        const definition = hb.expect('GET', '/url1');
        definition.respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      it('should be able to override response of when definition', () => {
        const definition = hb.when('GET', '/url1');
        definition.respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      it('should be able to override response of expect definition with chaining', () => {
        const definition = hb.expect('GET', '/url1').respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });

      it('should be able to override response of when definition with chaining', () => {
        const definition = hb.when('GET', '/url1').respond('first');
        definition.respond('second');

        hb('GET', '/url1', null, callback);
        hb.flush();
        expect(callback).toHaveBeenCalledOnceWith(200, 'second', '', '', 'complete');
      });
    });


    describe('expect()', () => {
      it('should require specified order', () => {
        hb.expect('GET', '/url1').respond(200, '');
        hb.expect('GET', '/url2').respond(200, '');

        expect(() => {
          hb('GET', '/url2', null, noop, {});
        }).toThrowError('Unexpected request: GET /url2\nExpected GET /url1');
      });


      it('should have precedence over when()', () => {
        callback.and.callFake((status, response) => {
          expect(status).toBe(300);
          expect(response).toBe('expect');
        });

        hb.when('GET', '/url').respond(200, 'when');
        hb.expect('GET', '/url').respond(300, 'expect');

        hb('GET', '/url', null, callback, {});
        hb.flush();
        expect(callback).toHaveBeenCalledOnce();
      });


      it('should throw exception when only headers differs from expectation', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', undefined, {'Content-Type': 'application/json'});

        expect(() => {
          hb('GET', '/match', null, noop, {});
        }).toThrowError('Expected GET /match with different headers\n' +
                        'EXPECTED: {"Content-Type":"application/json"}\nGOT:      {}');
      });


      it('should throw exception when only data differs from expectation', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', 'some-data');

        expect(() => {
          hb('GET', '/match', 'different', noop, {});
        }).toThrowError('Expected GET /match with different data\n' +
                        'EXPECTED: some-data\nGOT:      different');
      });


      it('should not throw an exception when parsed body is equal to expected body object', () => {
        hb.when('GET').respond(200, '', {});

        hb.expect('GET', '/match', {a: 1, b: 2});
        expect(() => {
          hb('GET', '/match', '{"a":1,"b":2}', noop, {});
        }).not.toThrow();

        hb.expect('GET', '/match', {a: 1, b: 2});
        expect(() => {
          hb('GET', '/match', '{"b":2,"a":1}', noop, {});
        }).not.toThrow();
      });


      it('should throw exception when only parsed body differs from expected body object', () => {
        hb.when('GET').respond(200, '', {});
        hb.expect('GET', '/match', {a: 1, b: 2});

        expect(() => {
          hb('GET', '/match', '{"a":1,"b":3}', noop, {});
        }).toThrowError('Expected GET /match with different data\n' +
                        'EXPECTED: {"a":1,"b":2}\nGOT:      {"a":1,"b":3}');
      });


      it('should use when\'s respond() when no expect() respond is defined', () => {
        callback.and.callFake((status, response) => {
          expect(status).toBe(201);
          expect(response).toBe('data');
        });

        hb.when('GET', '/some').respond(201, 'data');
        hb.expect('GET', '/some');
        hb('GET', '/some', null, callback);
        hb.flush();

        expect(callback).toHaveBeenCalled();
        expect(() => { hb.verifyNoOutstandingExpectation(); }).not.toThrow();
      });
    });


    describe('flush()', () => {
      it('flush() should flush requests fired during callbacks', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, () => {
          hb('GET', '/other', null, callback);
        });

        hb.flush();
        expect(callback).toHaveBeenCalled();
      });


      it('should flush given number of pending requests', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);

        hb.flush(2);
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      it('should flush given number of pending requests beginning at specified request', () => {
        const dontCallMe = jasmine.createSpy('dontCallMe');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, dontCallMe);

        hb.flush(2, 1);
        expect(dontCallMe).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      it('should flush all pending requests beginning at specified request', () => {
        const dontCallMe = jasmine.createSpy('dontCallMe');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, dontCallMe);
        hb('GET', '/some', null, callback);
        hb('GET', '/some', null, callback);

        hb.flush(null, 2);
        expect(dontCallMe).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(2);
      });


      it('should throw exception when flushing more requests than pending', () => {
        hb.when('GET').respond(200, '');
        hb('GET', '/url', null, callback);

        expect(() => {hb.flush(2);}).toThrowError('No more pending request to flush !');
        expect(callback).toHaveBeenCalledOnce();
      });


      it('should throw exception when no request to flush', () => {
        expect(() => {hb.flush();}).toThrowError('No pending request to flush !');

        hb.when('GET').respond(200, '');
        hb('GET', '/some', null, callback);
        expect(() => {hb.flush(null, 1);}).toThrowError('No pending request to flush !');

        hb.flush();
        expect(() => {hb.flush();}).toThrowError('No pending request to flush !');
      });


      it('should throw exception if not all expectations satisfied', () => {
        hb.expect('GET', '/url1').respond();
        hb.expect('GET', '/url2').respond();

        hb('GET', '/url1', null, () => {});
        expect(() => {hb.flush();}).toThrowError('Unsatisfied requests: GET /url2');
      });
    });


    it('should abort requests when timeout promise resolves', () => {
      hb.expect('GET', '/url1').respond(200);

      let canceler; const then = jasmine.createSpy('then').and.callFake((fn) => {
        canceler = fn;
      });

      hb('GET', '/url1', null, callback, null, {then});
      expect(typeof canceler).toBe('function');

      canceler();  // simulate promise resolution

      expect(callback).toHaveBeenCalledWith(-1, undefined, '', undefined, 'abort');
      hb.verifyNoOutstandingExpectation();
      hb.verifyNoOutstandingRequest();
    });


    it('should abort requests when timeout passed as a numeric value', inject(($timeout) => {
      hb.expect('GET', '/url1').respond(200);

      hb('GET', '/url1', null, callback, null, 200);
      $timeout.flush(300);

      expect(callback).toHaveBeenCalledWith(-1, undefined, '', undefined, 'timeout');
      hb.verifyNoOutstandingExpectation();
      hb.verifyNoOutstandingRequest();
    }));


    it('should throw an exception if no response defined', () => {
      hb.when('GET', '/test');
      expect(() => {
        hb('GET', '/test', null, callback);
      }).toThrowError('No response defined !');
    });


    it('should throw an exception if no response for exception and no definition', () => {
      hb.expect('GET', '/url');
      expect(() => {
        hb('GET', '/url', null, callback);
      }).toThrowError('No response defined !');
    });


    it('should respond undefined when JSONP method', () => {
      hb.when('JSONP', '/url1').respond(200);
      hb.expect('JSONP', '/url2').respond(200);

      expect(hb('JSONP', '/url1')).toBeUndefined();
      expect(hb('JSONP', '/url2')).toBeUndefined();
    });


    it('should not have passThrough method', () => {
      expect(hb.passThrough).toBeUndefined();
    });


    describe('verifyExpectations', () => {

      it('should throw exception if not all expectations were satisfied', () => {
        hb.expect('POST', '/u1', 'ddd').respond(201, '', {});
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});

        hb('POST', '/u1', 'ddd', noop, {});

        expect(() => {hb.verifyNoOutstandingExpectation();}).
          toThrowError('Unsatisfied requests: GET /u2, POST /u3');
      });


      it('should do nothing when no expectation', () => {
        hb.when('DELETE', '/some').respond(200, '');

        expect(() => {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });


      it('should do nothing when all expectations satisfied', () => {
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});
        hb.when('DELETE', '/some').respond(200, '');

        hb('GET', '/u2', noop);
        hb('POST', '/u3', noop);

        expect(() => {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });
    });


    describe('verifyRequests', () => {

      it('should throw exception if not all requests were flushed', () => {
        hb.when('GET').respond(200);
        hb('GET', '/some', null, noop, {});

        expect(() => {
          hb.verifyNoOutstandingRequest();
        }).toThrowError('Unflushed requests: 1\n' +
                        '  GET /some');
      });


      it('should verify requests fired asynchronously', inject(($q) => {
        hb.when('GET').respond(200);
        $q.resolve().then(() => {
          hb('GET', '/some', null, noop, {});
        });

        expect(() => {
          hb.verifyNoOutstandingRequest();
        }).toThrowError('Unflushed requests: 1\n' +
                        '  GET /some');
      }));


      it('should describe multiple unflushed requests', () => {
        hb.when('GET').respond(200);
        hb.when('PUT').respond(200);
        hb('GET', '/some', null, noop, {});
        hb('PUT', '/elsewhere', null, noop, {});

        expect(() => {
          hb.verifyNoOutstandingRequest();
        }).toThrowError('Unflushed requests: 2\n' +
                        '  GET /some\n' +
                        '  PUT /elsewhere');
      });
    });


    describe('resetExpectations', () => {

      it('should remove all expectations', () => {
        hb.expect('GET', '/u2').respond(200, '', {});
        hb.expect('POST', '/u3').respond(201, '', {});
        hb.resetExpectations();

        expect(() => {hb.verifyNoOutstandingExpectation();}).not.toThrow();
      });


      it('should remove all pending responses', () => {
        const cancelledClb = jasmine.createSpy('cancelled');

        hb.expect('GET', '/url').respond(200, '');
        hb('GET', '/url', null, cancelledClb);
        hb.resetExpectations();

        hb.expect('GET', '/url').respond(300, '');
        hb('GET', '/url', null, callback, {});
        hb.flush();

        expect(callback).toHaveBeenCalledOnce();
        expect(cancelledClb).not.toHaveBeenCalled();
      });


      it('should not remove definitions', () => {
        const cancelledClb = jasmine.createSpy('cancelled');

        hb.when('GET', '/url').respond(200, 'success');
        hb('GET', '/url', null, cancelledClb);
        hb.resetExpectations();

        hb('GET', '/url', null, callback, {});
        hb.flush();

        expect(callback).toHaveBeenCalledOnce();
        expect(cancelledClb).not.toHaveBeenCalled();
      });
    });


    describe('expect/when shortcuts', () => {
      angular.forEach(['expect', 'when'], (prefix) => {
        angular.forEach(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'JSONP'], (method) => {
          const shortcut = prefix + method;
          it(`should provide ${  shortcut  } shortcut method`, () => {
            hb[shortcut]('/foo').respond('bar');
            hb(method, '/foo', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'bar', '', '', 'complete');
          });
        });
      });
    });


    describe('expectRoute/whenRoute shortcuts', () => {
      angular.forEach(['expectRoute', 'whenRoute'], (routeShortcut) => {
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'JSONP'];
        they(`should provide ${  routeShortcut  } shortcut with $prop method`, methods,
          function() {
            hb[routeShortcut](this, '/route').respond('path');
            hb(this, '/route', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'path', '', '', 'complete');
          }
        );
        they(`should match colon delimited parameters in ${  routeShortcut  } $prop method`, methods,
          function() {
            hb[routeShortcut](this, '/route/:id/path/:s_id').respond('path');
            hb(this, '/route/123/path/456', undefined, callback);
            hb.flush();
            expect(callback).toHaveBeenCalledOnceWith(200, 'path', '', '', 'complete');
          }
        );
        they(`should ignore query params when matching in ${  routeShortcut  } $prop method`, methods,
          (method) => {
            angular.forEach([
              {route: '/route1/:id', url: '/route1/Alpha', expectedParams: {id: 'Alpha'}},
              {route: '/route2/:id', url: '/route2/Bravo/?', expectedParams: {id: 'Bravo'}},
              {route: '/route3/:id', url: '/route3/Charlie?q=str&foo=bar', expectedParams: {id: 'Charlie', q: 'str', foo: 'bar'}},
              {route: '/:x/route4', url: '/Delta/route4?q=str&foo=bar', expectedParams: {x: 'Delta', q: 'str', foo: 'bar'}},
              {route: '/route5/:id*', url: '/route5/Echo/456?q=str&foo=bar', expectedParams: {id: 'Echo/456', q: 'str', foo: 'bar'}},
              {route: '/route6/:id*', url: '/route6/Foxtrot/456/?q=str&foo=bar', expectedParams: {id: 'Foxtrot/456', q: 'str', foo: 'bar'}},
              {route: '/route7/:id*', url: '/route7/Golf/456//?q=str&foo=bar', expectedParams: {id: 'Golf/456', q: 'str', foo: 'bar'}},
              {route: '/:x*/route8', url: '/Hotel/123/456/route8/?q=str&foo=bar', expectedParams: {x: 'Hotel/123/456', q: 'str', foo: 'bar'}},
              {route: '/:x*/route9/:id', url: '/India/456/route9/0?q=str&foo=bar', expectedParams: {x: 'India/456', id: '0', q: 'str', foo: 'bar'}},
              {route: '/route10', url: '/route10?q=Juliet&foo=bar', expectedParams: {q: 'Juliet', foo: 'bar'}},
              {route: '/route11', url: '/route11///?q=Kilo', expectedParams: {q: 'Kilo'}},
              {route: '/route12', url: '/route12///', expectedParams: {}}
            ], (testDataEntry) => {
              callback.calls.reset();
              const paramsSpy = jasmine.createSpy('params');
              hb[routeShortcut](method, testDataEntry.route).respond(
                (method, url, data, headers, params) => {
                  paramsSpy(params);
                  // status, response, headers, statusText, xhrStatus
                  return [200, 'path', { 'x-header': 'foo' }, 'OK', 'complete'];
                }
              );
              hb(method, testDataEntry.url, undefined, callback);
              hb.flush();
              expect(callback).toHaveBeenCalledOnceWith(200, 'path', 'x-header: foo', 'OK', 'complete');
              expect(paramsSpy).toHaveBeenCalledOnceWith(testDataEntry.expectedParams);
            });
          }
        );
      });
    });


    describe('MockHttpExpectation', () => {
      /* global MockHttpExpectation */

      it('should accept url as regexp', () => {
        const exp = new MockHttpExpectation('GET', /^\/x/);

        expect(exp.match('GET', '/x')).toBe(true);
        expect(exp.match('GET', '/xxx/x')).toBe(true);
        expect(exp.match('GET', 'x')).toBe(false);
        expect(exp.match('GET', 'a/x')).toBe(false);
      });

      it('should match url with same query params, but different order', () => {
        const exp = new MockHttpExpectation('GET', 'www.example.com/x/y?a=b&c=d&e=f');

        expect(exp.matchUrl('www.example.com/x/y?e=f&c=d&a=b')).toBe(true);
      });

      it('should accept url as function', () => {
        const urlValidator = function(url) {
          return url !== '/not-accepted';
        };
        const exp = new MockHttpExpectation('POST', urlValidator);

        expect(exp.match('POST', '/url')).toBe(true);
        expect(exp.match('POST', '/not-accepted')).toBe(false);
      });


      it('should accept data as regexp', () => {
        const exp = new MockHttpExpectation('POST', '/url', /\{.*?\}/);

        expect(exp.match('POST', '/url', '{"a": "aa"}')).toBe(true);
        expect(exp.match('POST', '/url', '{"one": "two"}')).toBe(true);
        expect(exp.match('POST', '/url', '{"one"')).toBe(false);
      });


      it('should accept data as function', () => {
        const dataValidator = function(data) {
          const json = angular.fromJson(data);
          return !!json.id && json.status === 'N';
        };
        const exp = new MockHttpExpectation('POST', '/url', dataValidator);

        expect(exp.matchData({})).toBe(false);
        expect(exp.match('POST', '/url', '{"id": "xxx", "status": "N"}')).toBe(true);
        expect(exp.match('POST', '/url', {'id': 'xxx', 'status': 'N'})).toBe(true);
      });


      it('should ignore data only if undefined (not null or false)', () => {
        let exp = new MockHttpExpectation('POST', '/url', null);
        expect(exp.matchData(null)).toBe(true);
        expect(exp.matchData('some-data')).toBe(false);

        exp = new MockHttpExpectation('POST', '/url', undefined);
        expect(exp.matchData(null)).toBe(true);
        expect(exp.matchData('some-data')).toBe(true);
      });


      it('should accept headers as function', () => {
        const exp = new MockHttpExpectation('GET', '/url', undefined, ((h) => h['Content-Type'] === 'application/json'));

        expect(exp.matchHeaders({})).toBe(false);
        expect(exp.matchHeaders({'Content-Type': 'application/json', 'X-Another': 'true'})).toBe(true);
      });
    });
  });


  describe('$rootElement', () => {
    it('should create mock application root', inject(($rootElement) => {
      expect($rootElement.text()).toEqual('');
    }));

    it('should attach the `$injector` to `$rootElement`', inject(($injector, $rootElement) => {
      expect($rootElement.injector()).toBe($injector);
    }));
  });


  describe('$rootScopeDecorator', () => {

    describe('$countChildScopes', () => {

      it('should return 0 when no child scopes', inject(($rootScope) => {
        expect($rootScope.$countChildScopes()).toBe(0);

        const childScope = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(1);
        expect(childScope.$countChildScopes()).toBe(0);

        const grandChildScope = childScope.$new();
        expect(childScope.$countChildScopes()).toBe(1);
        expect(grandChildScope.$countChildScopes()).toBe(0);
      }));


      it('should correctly navigate complex scope tree', inject(($rootScope) => {
        let child;

        $rootScope.$new();
        $rootScope.$new().$new().$new();
        child = $rootScope.$new().$new();
        child.$new();
        child.$new();
        child.$new().$new().$new();

        expect($rootScope.$countChildScopes()).toBe(11);
      }));


      it('should provide the current count even after child destructions', inject(($rootScope) => {
        expect($rootScope.$countChildScopes()).toBe(0);

        const childScope1 = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(1);

        const childScope2 = $rootScope.$new();
        expect($rootScope.$countChildScopes()).toBe(2);

        childScope1.$destroy();
        expect($rootScope.$countChildScopes()).toBe(1);

        childScope2.$destroy();
        expect($rootScope.$countChildScopes()).toBe(0);
      }));


      it('should work with isolate scopes', inject(($rootScope) => {
        /*
                  RS
                  |
                 CIS
                /   \
              GCS   GCIS
         */

        const childIsolateScope = $rootScope.$new(true);
        expect($rootScope.$countChildScopes()).toBe(1);

        const grandChildScope = childIsolateScope.$new();
        expect($rootScope.$countChildScopes()).toBe(2);
        expect(childIsolateScope.$countChildScopes()).toBe(1);

        const grandChildIsolateScope = childIsolateScope.$new(true);
        expect($rootScope.$countChildScopes()).toBe(3);
        expect(childIsolateScope.$countChildScopes()).toBe(2);

        childIsolateScope.$destroy();
        expect($rootScope.$countChildScopes()).toBe(0);
      }));
    });


    describe('$countWatchers', () => {

      it('should return the sum of watchers for the current scope and all of its children', inject(
        ($rootScope) => {

          expect($rootScope.$countWatchers()).toBe(0);

          const childScope = $rootScope.$new();
          expect($rootScope.$countWatchers()).toBe(0);

          childScope.$watch('foo');
          expect($rootScope.$countWatchers()).toBe(1);
          expect(childScope.$countWatchers()).toBe(1);

          $rootScope.$watch('bar');
          childScope.$watch('baz');
          expect($rootScope.$countWatchers()).toBe(3);
          expect(childScope.$countWatchers()).toBe(2);
      }));


      it('should correctly navigate complex scope tree', inject(($rootScope) => {
        let child;

        $rootScope.$watch('foo1');

        $rootScope.$new();
        $rootScope.$new().$new().$new();

        child = $rootScope.$new().$new();
        child.$watch('foo2');
        child.$new();
        child.$new();
        child = child.$new().$new().$new();
        child.$watch('foo3');
        child.$watch('foo4');

        expect($rootScope.$countWatchers()).toBe(4);
      }));


      it('should provide the current count even after child destruction and watch deregistration',
          inject(($rootScope) => {

        const deregisterWatch1 = $rootScope.$watch('exp1');

        const childScope = $rootScope.$new();
        childScope.$watch('exp2');

        expect($rootScope.$countWatchers()).toBe(2);

        childScope.$destroy();
        expect($rootScope.$countWatchers()).toBe(1);

        deregisterWatch1();
        expect($rootScope.$countWatchers()).toBe(0);
      }));


      it('should work with isolate scopes', inject(($rootScope) => {
        /*
                 RS=1
                   |
                CIS=1
                /    \
            GCS=1  GCIS=1
         */

        $rootScope.$watch('exp1');
        expect($rootScope.$countWatchers()).toBe(1);

        const childIsolateScope = $rootScope.$new(true);
        childIsolateScope.$watch('exp2');
        expect($rootScope.$countWatchers()).toBe(2);
        expect(childIsolateScope.$countWatchers()).toBe(1);

        const grandChildScope = childIsolateScope.$new();
        grandChildScope.$watch('exp3');

        const grandChildIsolateScope = childIsolateScope.$new(true);
        grandChildIsolateScope.$watch('exp4');

        expect($rootScope.$countWatchers()).toBe(4);
        expect(childIsolateScope.$countWatchers()).toBe(3);
        expect(grandChildScope.$countWatchers()).toBe(1);
        expect(grandChildIsolateScope.$countWatchers()).toBe(1);

        childIsolateScope.$destroy();
        expect($rootScope.$countWatchers()).toBe(1);
      }));
    });
  });


  describe('$controllerDecorator', () => {

    it('should support creating controller with bindings', () => {
      let called = false;
      const data = [
        { name: 'derp1', id: 0 },
        { name: 'testname', id: 1 },
        { name: 'flurp', id: 2 }
      ];
      module(($controllerProvider) => {
        $controllerProvider.register('testCtrl', function() {
          expect(this.data).toBeUndefined();
          called = true;
        });
      });
      inject(($controller, $rootScope) => {
        const ctrl = $controller('testCtrl', { scope: $rootScope }, { data });
        expect(ctrl.data).toBe(data);
        expect(called).toBe(true);
      });
    });


    it('should support assigning bindings when a value is returned from the constructor',
      () => {
        let called = false;
        const data = [
          { name: 'derp1', id: 0 },
          { name: 'testname', id: 1 },
          { name: 'flurp', id: 2 }
        ];
        module(($controllerProvider) => {
          $controllerProvider.register('testCtrl', function() {
            expect(this.data).toBeUndefined();
            called = true;
            return {};
          });
        });
        inject(($controller, $rootScope) => {
          const ctrl = $controller('testCtrl', { scope: $rootScope }, { data });
          expect(ctrl.data).toBe(data);
          expect(called).toBe(true);
        });
      }
    );


    if (support.classes) {
      it('should support assigning bindings to class-based controller', () => {
        const called = false;
        const data = [
          { name: 'derp1', id: 0 },
          { name: 'testname', id: 1 },
          { name: 'flurp', id: 2 }
        ];
        module(($controllerProvider) => {
          // eslint-disable-next-line no-eval
          const TestCtrl = eval('(class { constructor() { called = true; } })');
          $controllerProvider.register('testCtrl', TestCtrl);
        });
        inject(($controller, $rootScope) => {
          const ctrl = $controller('testCtrl', { scope: $rootScope }, { data });
          expect(ctrl.data).toBe(data);
          expect(called).toBe(true);
        });
      });
    }
  });


  describe('$componentController', () => {
    it('should instantiate a simple controller defined inline in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      module(($compileProvider) => {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        const $scope = {};
        const ctrl = $componentController('test', { $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    it('should instantiate a controller with $$inject annotation defined inline in a component', () => {
      function TestController(x, y, z) {
        this.$scope = x;
        this.a = y;
        this.b = z;
      }
      TestController.$inject = ['$scope', 'a', 'b'];
      module(($compileProvider) => {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        const $scope = {};
        const ctrl = $componentController('test', { $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    it('should instantiate a named controller defined in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      module(($controllerProvider, $compileProvider) => {
        $controllerProvider.register('TestController', TestController);
        $compileProvider.component('test', {
          controller: 'TestController'
        });
      });
      inject(($componentController, $rootScope) => {
        const $scope = {};
        const ctrl = $componentController('test', { $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(extend(new TestController($scope, 'A', 'B'), { x: 'X', y: 'Y' }));
        expect($scope.$ctrl).toBe(ctrl);
      });
    });

    it('should instantiate a named controller with `controller as` syntax defined in a component', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      module(($controllerProvider, $compileProvider) => {
        $controllerProvider.register('TestController', TestController);
        $compileProvider.component('test', {
          controller: 'TestController as testCtrl'
        });
      });
      inject(($componentController, $rootScope) => {
        const $scope = {};
        const ctrl = $componentController('test', { $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        expect(ctrl).toEqual(extend(new TestController($scope, 'A', 'B'), {x: 'X', y: 'Y'}));
        expect($scope.testCtrl).toBe(ctrl);
      });
    });

    it('should instantiate the controller of the restrict:\'E\' component if there are more directives with the same name but not restricted to \'E\'', () => {
      function TestController() {
        this.r = 6779;
      }
      module(($compileProvider) => {
        $compileProvider.directive('test', () => ({ restrict: 'A' }));
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        const ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    it('should instantiate the controller of the restrict:\'E\' component if there are more directives with the same name and restricted to \'E\' but no controller', () => {
      function TestController() {
        this.r = 22926;
      }
      module(($compileProvider) => {
        $compileProvider.directive('test', () => ({ restrict: 'E' }));
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        const ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    it('should instantiate the controller of the directive with controller, controllerAs and restrict:\'E\' if there are more directives', () => {
      function TestController() {
        this.r = 18842;
      }
      module(($compileProvider) => {
        $compileProvider.directive('test', () => ({ }));
        $compileProvider.directive('test', () => ({
            restrict: 'E',
            controller: TestController,
            controllerAs: '$ctrl'
          }));
      });
      inject(($componentController, $rootScope) => {
        const ctrl = $componentController('test', { $scope: {} });
        expect(ctrl).toEqual(new TestController());
      });
    });

    it('should fail if there is no directive with restrict:\'E\' and controller', () => {
      function TestController() {
        this.r = 31145;
      }
      module(($compileProvider) => {
        $compileProvider.directive('test', () => ({
            restrict: 'AC',
            controller: TestController
          }));
        $compileProvider.directive('test', () => ({
            restrict: 'E',
            controller: TestController
          }));
        $compileProvider.directive('test', () => ({
            restrict: 'EA',
            controller: TestController,
            controllerAs: '$ctrl'
          }));
        $compileProvider.directive('test', () => ({ restrict: 'E' }));
      });
      inject(($componentController, $rootScope) => {
        expect(() => {
          $componentController('test', { $scope: {} });
        }).toThrowError('No component found');
      });
    });

    it('should fail if there more than two components with same name', () => {
      function TestController($scope, a, b) {
        this.$scope = $scope;
        this.a = a;
        this.b = b;
      }
      module(($compileProvider) => {
        $compileProvider.directive('test', () => ({
            restrict: 'E',
            controller: TestController,
            controllerAs: '$ctrl'
          }));
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        expect(() => {
          const $scope = {};
          $componentController('test', { $scope, a: 'A', b: 'B' }, { x: 'X', y: 'Y' });
        }).toThrowError('Too many components found');
      });
    });

    it('should create an isolated child of $rootScope, if no `$scope` local is provided', () => {
      function TestController($scope) {
        this.$scope = $scope;
      }
      module(($compileProvider) => {
        $compileProvider.component('test', {
          controller: TestController
        });
      });
      inject(($componentController, $rootScope) => {
        const $ctrl = $componentController('test');
        expect($ctrl.$scope).toBeDefined();
        expect($ctrl.$scope.$parent).toBe($rootScope);
        // check it is isolated
        $rootScope.a = 17;
        expect($ctrl.$scope.a).toBeUndefined();
        $ctrl.$scope.a = 42;
        expect($rootScope.a).toEqual(17);
      });
    });
  });
});


describe('ngMockE2E', () => {

  const {noop} = angular;
  const {extend} = angular;

  describe('$httpBackend', () => {
    let hb; let realHttpBackend; let realHttpBackendBrowser; let $http; let callback;

    beforeEach(() => {
      callback = jasmine.createSpy('callback');
      angular.module('ng').config(($provide) => {
        realHttpBackend = jasmine.createSpy('real $httpBackend');
        $provide.factory('$httpBackend', ['$browser', function($browser) {
          return realHttpBackend.and.callFake(() => { realHttpBackendBrowser = $browser; });
        }]);
      });
      module('ngMockE2E');
      inject(($injector) => {
        hb = $injector.get('$httpBackend');
        $http = $injector.get('$http');
      });
    });


    it('should throw error when unexpected request - without error callback', () => {
      expect(() => {
        $http.get('/some').then(noop);

        hb.verifyNoOutstandingRequest();
      }).toThrowError('Unexpected request: GET /some\nNo more request expected');
    });


    it('should throw error when unexpected request - with error callback', () => {
      expect(() => {
        $http.get('/some').then(noop, noop);

        hb.verifyNoOutstandingRequest();
      }).toThrowError('Unexpected request: GET /some\nNo more request expected');
    });

    it('should throw error when expectation fails - without error callback', () => {
      expect(() => {
        hb.expectPOST('/some', { foo: 1 }).respond({});
        $http.post('/some', { foo: 2 }).then(noop);

        hb.flush();
      }).toThrowError(/^Expected POST \/some with different data/);
    });

    it('should throw error when unexpected request - with error callback', () => {
      expect(() => {
        hb.expectPOST('/some', { foo: 1 }).respond({});
        $http.post('/some', { foo: 2 }).then(noop, noop);

        hb.flush();
      }).toThrowError(/^Expected POST \/some with different data/);
    });


    describe('passThrough()', () => {
      it('should delegate requests to the real backend when passThrough is invoked', () => {
        const eventHandlers = {progress: () => {}};
        const uploadEventHandlers = {progress: () => {}};

        hb.when('GET', /\/passThrough\/.*/).passThrough();
        hb('GET', '/passThrough/23', null, callback, {}, null, true, 'blob', eventHandlers, uploadEventHandlers);

        expect(realHttpBackend).toHaveBeenCalledOnceWith(
            'GET', '/passThrough/23', null, callback, {}, null, true, 'blob', eventHandlers, uploadEventHandlers);
      });

      it('should be able to override a respond definition with passThrough', () => {
        const definition = hb.when('GET', /\/passThrough\/.*/).respond('override me');
        definition.passThrough();
        hb('GET', '/passThrough/23', null, callback, {}, null, true);

        expect(realHttpBackend).toHaveBeenCalledOnceWith(
            'GET', '/passThrough/23', null, callback, {}, null, true, undefined, undefined, undefined);
      });

      it('should be able to override a respond definition with passThrough', inject(($browser) => {
        const definition = hb.when('GET', /\/passThrough\/.*/).passThrough();
        definition.respond('passThrough override');
        hb('GET', '/passThrough/23', null, callback, {}, null, true);
        $browser.defer.flush();

        expect(realHttpBackend).not.toHaveBeenCalled();
        expect(callback).toHaveBeenCalledOnceWith(200, 'passThrough override', '', '', 'complete');
      }));

      it('should pass through to an httpBackend that uses the same $browser service', inject(($browser) => {
        hb.when('GET', /\/passThrough\/.*/).passThrough();
        hb('GET', '/passThrough/23');

        expect(realHttpBackend).toHaveBeenCalledOnce();
        expect(realHttpBackendBrowser).toBe($browser);
      }));
    });


    describe('autoflush', () => {
      it('should flush responses via $browser.defer', inject(($browser) => {
        hb.when('GET', '/foo').respond('bar');
        hb('GET', '/foo', null, callback);

        expect(callback).not.toHaveBeenCalled();
        $browser.defer.flush();
        expect(callback).toHaveBeenCalledOnce();
      }));
    });
  });

  describe('ngAnimateMock', () => {

    beforeEach(module('ngAnimate'));
    beforeEach(module('ngAnimateMock'));

    let ss; let element; let trackedAnimations; let animationLog;

    afterEach(() => {
      if (element) {
        element.remove();
      }
      if (ss) {
        ss.destroy();
      }
    });

    beforeEach(module(($animateProvider) => {
      trackedAnimations = [];
      animationLog = [];

      $animateProvider.register('.animate', () => {
        return {
          leave: logFn('leave'),
          addClass: logFn('addClass')
        };

        function logFn(method) {
          return function(element) {
            animationLog.push(`start ${  method}`);
            trackedAnimations.push(getDoneCallback(arguments));

            return function closingFn(cancel) {
              const lab = cancel ? 'cancel' : 'end';
              animationLog.push(`${lab  } ${  method}`);
            };
          };
        }

        function getDoneCallback(args) {
          for (let i = args.length; i > 0; i--) {
            if (angular.isFunction(args[i])) return args[i];
          }
        }
      });

      return function($animate, $rootElement, $document, $rootScope) {
        ss = createMockStyleSheet($document);

        element = angular.element('<div class="animate"></div>');
        $rootElement.append(element);
        angular.element($document[0].body).append($rootElement);
        $animate.enabled(true);
        $rootScope.$digest();
      };
    }));

    describe('$animate.queue', () => {
      it('should maintain a queue of the executed animations', inject(($animate) => {
        element.removeClass('animate'); // we don't care to test any actual animations
        const options = {};

        $animate.addClass(element, 'on', options);
        const first = $animate.queue[0];
        expect(first.element).toBe(element);
        expect(first.event).toBe('addClass');
        expect(first.options).toBe(options);

        $animate.removeClass(element, 'off', options);
        const second = $animate.queue[1];
        expect(second.element).toBe(element);
        expect(second.event).toBe('removeClass');
        expect(second.options).toBe(options);

        $animate.leave(element, options);
        const third = $animate.queue[2];
        expect(third.element).toBe(element);
        expect(third.event).toBe('leave');
        expect(third.options).toBe(options);
      }));
    });

    describe('$animate.flush()', () => {
      it('should throw an error if there is nothing to animate', inject(($animate) => {
        expect(() => {
          $animate.flush();
        }).toThrowError('No pending animations ready to be closed or flushed');
      }));

      it('should trigger the animation to start',
        inject(($animate) => {

        expect(trackedAnimations.length).toBe(0);
        $animate.leave(element);
        $animate.flush();
        expect(trackedAnimations.length).toBe(1);
      }));

      it('should trigger the animation to end once run and called',
        inject(($animate) => {

        $animate.leave(element);
        $animate.flush();
        expect(element.parent().length).toBe(1);

        trackedAnimations[0]();
        $animate.flush();
        expect(element.parent().length).toBe(0);
      }));

      it('should trigger the animation promise callback to fire once run and closed',
        inject(($animate) => {

        const doneSpy = jasmine.createSpy();
        $animate.leave(element).then(doneSpy);
        $animate.flush();

        trackedAnimations[0]();
        expect(doneSpy).not.toHaveBeenCalled();
        $animate.flush();
        expect(doneSpy).toHaveBeenCalled();
      }));

      it('should trigger a series of CSS animations to trigger and start once run',
        inject(($animate, $rootScope) => {

        if (!browserSupportsCssAnimations()) return;

        ss.addRule('.leave-me.ng-leave', 'transition:1s linear all;');

        let i; let elm; const elms = [];
        for (i = 0; i < 5; i++) {
          elm = angular.element('<div class="leave-me"></div>');
          element.append(elm);
          elms.push(elm);

          $animate.leave(elm);
        }

        $rootScope.$digest();

        for (i = 0; i < 5; i++) {
          elm = elms[i];
          expect(elm.hasClass('ng-leave')).toBe(true);
          expect(elm.hasClass('ng-leave-active')).toBe(false);
        }

        $animate.flush();

        for (i = 0; i < 5; i++) {
          elm = elms[i];
          expect(elm.hasClass('ng-leave')).toBe(true);
          expect(elm.hasClass('ng-leave-active')).toBe(true);
        }
      }));

      it('should trigger parent and child animations to run within the same flush',
        inject(($animate, $rootScope) => {

        const child = angular.element('<div class="animate child"></div>');
        element.append(child);

        expect(trackedAnimations.length).toBe(0);

        $animate.addClass(element, 'go');
        $animate.addClass(child, 'start');
        $animate.flush();

        expect(trackedAnimations.length).toBe(2);
      }));

      it('should trigger animation callbacks when called',
        inject(($animate, $rootScope) => {

        const spy = jasmine.createSpy();
        $animate.on('addClass', element, spy);

        $animate.addClass(element, 'on');
        expect(spy).not.toHaveBeenCalled();

        $animate.flush();
        expect(spy).toHaveBeenCalledTimes(1);

        trackedAnimations[0]();
        $animate.flush();
        expect(spy).toHaveBeenCalledTimes(2);
      }));
    });

    describe('$animate.closeAndFlush()', () => {
      it('should close the currently running $animateCss animations',
        inject(($animateCss, $animate) => {

        if (!browserSupportsCssAnimations()) return;

        const spy = jasmine.createSpy();
        const runner = $animateCss(element, {
          duration: 1,
          to: { color: 'red' }
        }).start();

        runner.then(spy);

        expect(spy).not.toHaveBeenCalled();
        $animate.closeAndFlush();
        expect(spy).toHaveBeenCalled();
      }));

      it('should close the currently running $$animateJs animations',
        inject(($$animateJs, $animate) => {

        const spy = jasmine.createSpy();
        const runner = $$animateJs(element, 'leave', 'animate', {}).start();
        runner.then(spy);

        expect(spy).not.toHaveBeenCalled();
        $animate.closeAndFlush();
        expect(spy).toHaveBeenCalled();
      }));

      it('should run the closing javascript animation function upon flush',
        inject(($$animateJs, $animate) => {

        $$animateJs(element, 'leave', 'animate', {}).start();

        expect(animationLog).toEqual(['start leave']);
        $animate.closeAndFlush();
        expect(animationLog).toEqual(['start leave', 'end leave']);
      }));

      it('should not throw when a regular animation has no javascript animation',
        inject(($animate, $$animation, $rootElement) => {

        if (!browserSupportsCssAnimations()) return;

        const element = angular.element('<div></div>');
        $rootElement.append(element);

        // Make sure the animation has valid $animateCss options
        $$animation(element, null, {
          from: { background: 'red' },
          to: { background: 'blue' },
          duration: 1,
          transitionStyle: 'all 1s'
        });

        expect(() => {
          $animate.closeAndFlush();
        }).not.toThrow();

        dealoc(element);
      }));

      it('should throw an error if there are no animations to close and flush',
        inject(($animate) => {

        expect(() => {
          $animate.closeAndFlush();
        }).toThrowError('No pending animations ready to be closed or flushed');

      }));
    });
  });
});


describe('make sure that we can create an injector outside of tests', () => {
  // since some libraries create custom injectors outside of tests,
  // we want to make sure that this is not breaking the internals of
  // how we manage annotated function cleanup during tests. See #10967
  angular.injector([function($injector) {}]);
});


describe('`afterEach` clean-up', () => {
  describe('`$rootElement`', () => {

    describe('undecorated', () => {
      let prevRootElement;
      let prevCleanDataSpy;


      it('should set up spies for the next test to verify that `$rootElement` was cleaned up',
        () => {
          module(($provide) => {
            $provide.decorator('$rootElement', ($delegate) => {
              prevRootElement = $delegate;

              // Spy on `angular.element.cleanData()`, so the next test can verify
              // that it has been called as necessary
              prevCleanDataSpy = spyOn(angular.element, 'cleanData').and.callThrough();

              return $delegate;
            });
          });

          // Inject the `$rootElement` to ensure it has been created
          inject(($rootElement) => {
            expect($rootElement.injector()).toBeDefined();
          });
        }
      );


      it('should clean up `$rootElement` after each test', () => {
        // One call is made by `testabilityPatch`'s `dealoc()`
        // We want to verify the subsequent call, made by `angular-mocks`
        expect(prevCleanDataSpy).toHaveBeenCalledTimes(2);

        const cleanUpNodes = prevCleanDataSpy.calls.argsFor(1)[0];
        expect(cleanUpNodes.length).toBe(1);
        expect(cleanUpNodes[0]).toBe(prevRootElement[0]);
      });
    });


    describe('decorated', () => {
      let prevOriginalRootElement;
      let prevRootElement;
      let prevCleanDataSpy;


      it('should set up spies for the next text to verify that `$rootElement` was cleaned up',
        () => {
          module(($provide) => {
            $provide.decorator('$rootElement', ($delegate) => {
              prevOriginalRootElement = $delegate;

              // Mock `$rootElement` to be able to verify that the correct object is cleaned up
              prevRootElement = angular.element('<div></div>');

              // Spy on `angular.element.cleanData()`, so the next test can verify
              // that it has been called as necessary
              prevCleanDataSpy = spyOn(angular.element, 'cleanData').and.callThrough();

              return prevRootElement;
            });
          });

          // Inject the `$rootElement` to ensure it has been created
          inject(($rootElement) => {
            expect($rootElement).toBe(prevRootElement);
            expect(prevOriginalRootElement.injector()).toBeDefined();
            expect(prevRootElement.injector()).toBeUndefined();

            // If we don't clean up `prevOriginalRootElement`-related data now, `testabilityPatch` will
            // complain about a memory leak, because it doesn't clean up after the original
            // `$rootElement`
            // This is a false alarm, because `angular-mocks` would have cleaned up in a subsequent
            // `afterEach` block
            prevOriginalRootElement.removeData();
          });
        }
      );


      it('should clean up `$rootElement` (both original and decorated) after each test',
        () => {
          // One call is made by `testabilityPatch`'s `dealoc()`
          // We want to verify the subsequent call, made by `angular-mocks`
          expect(prevCleanDataSpy).toHaveBeenCalledTimes(2);

          const cleanUpNodes = prevCleanDataSpy.calls.argsFor(1)[0];
          expect(cleanUpNodes.length).toBe(2);
          expect(cleanUpNodes[0]).toBe(prevOriginalRootElement[0]);
          expect(cleanUpNodes[1]).toBe(prevRootElement[0]);
        }
      );
    });


    describe('uninstantiated or falsy', () => {
      it('should not break if `$rootElement` was never instantiated', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up `$rootElement`, if `$rootElement` was never injected in the test
        // (and thus never instantiated/created)

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        inject(() => {});
      });


      it('should not break if the decorated `$rootElement` is falsy (e.g. `null`)', () => {
        module({$rootElement: null});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        inject(() => {});
      });
    });
  });


  describe('`$rootScope`', () => {
    describe('undecorated', () => {
      let prevRootScope;
      let prevDestroySpy;


      it('should set up spies for the next test to verify that `$rootScope` was cleaned up',
        inject(($rootScope) => {
          prevRootScope = $rootScope;
          prevDestroySpy = spyOn($rootScope, '$destroy').and.callThrough();
        })
      );


      it('should clean up `$rootScope` after each test', inject(($rootScope) => {
        expect($rootScope).not.toBe(prevRootScope);
        expect(prevDestroySpy).toHaveBeenCalledOnce();
        expect(prevRootScope.$$destroyed).toBe(true);
      }));
    });


    describe('falsy or without `$destroy()` method', () => {
      it('should not break if `$rootScope` is falsy (e.g. `null`)', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up a mocked `$rootScope` set to `null`

        module({$rootScope: null});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        inject(() => {});
      });


      it('should not break if `$rootScope.$destroy` is not a function', () => {
        // Just an empty test to verify that `angular-mocks` doesn't break,
        // when trying to clean up a mocked `$rootScope` without a `$destroy()` method

        module({$rootScope: {}});

        // Ensure the `$injector` is created - if there is no `$injector`, no clean-up takes places
        inject(() => {});
      });
    });
  });
});


describe('sharedInjector', () => {
  // this is of a bit tricky feature to test as we hit angular's own testing
  // mechanisms (e.g around jQuery cache checking), as ngMock augments the very
  // jasmine test runner we're using to test ngMock!
  //
  // with that in mind, we define a stubbed test framework
  // to simulate test cases being run with the ngMock hooks


  // we use the 'module' and 'inject' globals from ngMock

  it('allows me to mutate a single instance of a module (proving it has been shared)', ngMockTest(() => {
    sdescribe('test state is shared', () => {
      angular.module('sharedInjectorTestModuleA', [])
        .factory('testService', () => ({ state: 0 }));

      module.sharedInjector();

      sbeforeAll(module('sharedInjectorTestModuleA'));

      sit('access and mutate', inject((testService) => {
        testService.state += 1;
      }));

      sit('expect mutation to have persisted', inject((testService) => {
        expect(testService.state).toEqual(1);
      }));
    });
  }));


  it('works with standard beforeEach', ngMockTest(() => {
    sdescribe('test state is not shared', () => {
      angular.module('sharedInjectorTestModuleC', [])
        .factory('testService', () => ({ state: 0 }));

      sbeforeEach(module('sharedInjectorTestModuleC'));

      sit('access and mutate', inject((testService) => {
        testService.state += 1;
      }));

      sit('expect mutation not to have persisted', inject((testService) => {
        expect(testService.state).toEqual(0);
      }));
    });
  }));


  it('allows me to stub with shared injector', ngMockTest(() => {
    sdescribe('test state is shared', () => {
      angular.module('sharedInjectorTestModuleD', [])
        .value('testService', 43);

      module.sharedInjector();

      sbeforeAll(module('sharedInjectorTestModuleD', ($provide) => {
        $provide.value('testService', 42);
      }));

      sit('expected access stubbed value', inject((testService) => {
        expect(testService).toEqual(42);
      }));
    });
  }));

  it('doesn\'t interfere with other test describes', ngMockTest(() => {
    angular.module('sharedInjectorTestModuleE', [])
      .factory('testService', () => ({ state: 0 }));

    sdescribe('with stubbed injector', () => {

      module.sharedInjector();

      sbeforeAll(module('sharedInjectorTestModuleE'));

      sit('access and mutate', inject((testService) => {
        expect(testService.state).toEqual(0);
        testService.state += 1;
      }));

      sit('expect mutation to have persisted', inject((testService) => {
        expect(testService.state).toEqual(1);
      }));
    });

    sdescribe('without stubbed injector', () => {
      sbeforeEach(module('sharedInjectorTestModuleE'));

      sit('access and mutate', inject((testService) => {
        expect(testService.state).toEqual(0);
        testService.state += 1;
      }));

      sit('expect original, unmutated value', inject((testService) => {
        expect(testService.state).toEqual(0);
      }));
    });
  }));

  it('prevents nested use of sharedInjector()', function() {
    const test = ngMockTest(() => {
      sdescribe('outer', () => {

        module.sharedInjector();

        sdescribe('inner', () => {

          module.sharedInjector();

          sit('should not get here', () => {
            throw Error('should have thrown before here!');
          });
        });

      });

    });

    assertThrowsErrorMatching(test.bind(this), /already called sharedInjector()/);
  });

  it('warns that shared injector cannot be used unless test frameworks define before/after all hooks', () => {
    assertThrowsErrorMatching(() => {
      module.sharedInjector();
    }, /sharedInjector()/);
  });

  function assertThrowsErrorMatching(fn, re) {
    try {
      fn();
    } catch (e) {
      if (re.test(e.message)) {
        return;
      }
      throw Error(`thrown error '${  e.message  }' did not match:${  re}`);
    }
    throw Error('should have thrown error');
  }

  // run a set of test cases in the sdescribe stub test framework
  function ngMockTest(define) {
    return function() {
      const spec = this;
      module.$$currentSpec(null);

      // configure our stubbed test framework and then hook ngMock into it
      // in much the same way
      module.$$beforeAllHook = sbeforeAll;
      module.$$afterAllHook = safterAll;

      sdescribe.root = sdescribe('root', () => {});

      sdescribe.root.beforeEach.push(module.$$beforeEach);
      sdescribe.root.afterEach.push(module.$$afterEach);

      try {
        define();
        sdescribe.root.run();
      } finally {
        // clear up
        module.$$beforeAllHook = null;
        module.$$afterAllHook = null;
        module.$$currentSpec(spec);
      }
    };
  }

  // stub test framework that follows the pattern of hooks that
  // jasmine/mocha do
  function sdescribe(name, define) {
    const self = { name };
    self.parent = sdescribe.current || sdescribe.root;
    if (self.parent) {
      self.parent.describes.push(self);
    }

    const previous = sdescribe.current;
    sdescribe.current = self;

    self.beforeAll = [];
    self.beforeEach = [];
    self.afterAll = [];
    self.afterEach = [];
    self.define = define;
    self.tests = [];
    self.describes = [];

    self.run = function() {
      const spec = {};
      self.hooks('beforeAll', spec);

      self.tests.forEach((test) => {
        if (self.parent) self.parent.hooks('beforeEach', spec);
        self.hooks('beforeEach', spec);
        test.run.call(spec);
        self.hooks('afterEach', spec);
        if (self.parent) self.parent.hooks('afterEach', spec);
      });

      self.describes.forEach((d) => {
        d.run();
      });

      self.hooks('afterAll', spec);
    };

    self.hooks = function(hook, spec) {
      self[hook].forEach((f) => {
        f.call(spec);
      });
    };

    define();

    sdescribe.current = previous;

    return self;
  }

  function sit(name, fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.tests.push({
      name,
      run: fn
    });
  }

  function sbeforeAll(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.beforeAll.push(fn);
  }

  function safterAll(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.afterAll.push(fn);
  }

  function sbeforeEach(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.beforeEach.push(fn);
  }

  function safterEach(fn) {
    if (typeof fn !== 'function') throw Error('not fn', fn);
    sdescribe.current.afterEach.push(fn);
  }
});
