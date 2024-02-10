

describe('$$animateAsyncRun', () => {
  it('should fire the callback only when one or more RAFs have passed',
    inject(($$animateAsyncRun, $$rAF) => {

    const trigger = $$animateAsyncRun();
    let called = false;
    trigger(() => {
      called = true;
    });

    expect(called).toBe(false);
    $$rAF.flush();
    expect(called).toBe(true);
  }));

  it('should immediately fire the callback if a RAF has passed since construction',
    inject(($$animateAsyncRun, $$rAF) => {

    const trigger = $$animateAsyncRun();
    $$rAF.flush();

    let called = false;
    trigger(() => {
      called = true;
    });
    expect(called).toBe(true);
  }));
});

describe('$$AnimateRunner', () => {
  they('should trigger the host $prop function',
    ['end', 'cancel', 'pause', 'resume'], (method) => {

    inject(($$AnimateRunner) => {
      const host = {};
      const spy = host[method] = jasmine.createSpy();
      const runner = new $$AnimateRunner(host);
      runner[method]();
      expect(spy).toHaveBeenCalled();
    });
  });

  they('should trigger the inner runner\'s host $prop function',
    ['end', 'cancel', 'pause', 'resume'], (method) => {

    inject(($$AnimateRunner) => {
      const host = {};
      const spy = host[method] = jasmine.createSpy();
      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner(host);
      runner1.setHost(runner2);
      runner1[method]();
      expect(spy).toHaveBeenCalled();
    });
  });

  it('should resolve the done function only if one RAF has passed',
    inject(($$AnimateRunner, $$rAF) => {

    const runner = new $$AnimateRunner();
    const spy = jasmine.createSpy();
    runner.done(spy);
    runner.complete(true);
    expect(spy).not.toHaveBeenCalled();
    $$rAF.flush();
    expect(spy).toHaveBeenCalled();
  }));

  it('should resolve with the status provided in the completion function',
    inject(($$AnimateRunner, $$rAF) => {

    const runner = new $$AnimateRunner();
    let capturedValue;
    runner.done((val) => {
      capturedValue = val;
    });
    runner.complete('special value');
    $$rAF.flush();
    expect(capturedValue).toBe('special value');
  }));

  they('should immediately resolve each combined runner in a bottom-up order when $prop is called',
    ['end', 'cancel'], (method) => {

    inject(($$AnimateRunner) => {
      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      runner1.setHost(runner2);

      let status1; let status2; let signature = '';
      runner1.done((status) => {
        signature += '1';
        status1 = status;
      });

      runner2.done((status) => {
        signature += '2';
        status2 = status;
      });

      runner1[method]();

      const expectedStatus = method === 'end';
      expect(status1).toBe(expectedStatus);
      expect(status2).toBe(expectedStatus);
      expect(signature).toBe('21');
    });
  });

  they('should resolve/reject using a newly created promise when .then() is used upon $prop',
    ['end', 'cancel'], (method) => {

    inject(($$AnimateRunner, $rootScope) => {
      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      runner1.setHost(runner2);

      let status1;
      runner1.then(
        () => { status1 = 'pass'; },
        () => { status1 = 'fail'; });

      let status2;
      runner2.then(
        () => { status2 = 'pass'; },
        () => { status2 = 'fail'; });

      runner1[method]();

      const expectedStatus = method === 'end' ? 'pass' : 'fail';

      expect(status1).toBeUndefined();
      expect(status2).toBeUndefined();

      $rootScope.$digest();
      expect(status1).toBe(expectedStatus);
      expect(status2).toBe(expectedStatus);
    });
  });

  it('should expose/create the contained promise when getPromise() is called',
    inject(($$AnimateRunner, $rootScope) => {

    const runner = new $$AnimateRunner();
    expect(isPromiseLike(runner.getPromise())).toBeTruthy();
  }));

  it('should expose the `catch` promise function to handle the rejected state',
    inject(($$AnimateRunner, $rootScope) => {

    const runner = new $$AnimateRunner();
    let animationFailed = false;
    runner.catch(() => {
      animationFailed = true;
    });
    runner.cancel();
    $rootScope.$digest();
    expect(animationFailed).toBe(true);
  }));

  it('should use timeouts to trigger async operations when the document is hidden', () => {
    let hidden = true;

    module(($provide) => {

      $provide.value('$$isDocumentHidden', () => hidden);
    });

    inject(($$AnimateRunner, $rootScope, $$rAF, $timeout) => {
      let spy = jasmine.createSpy();
      let runner = new $$AnimateRunner();
      runner.done(spy);
      runner.complete(true);
      expect(spy).not.toHaveBeenCalled();
      $$rAF.flush();
      expect(spy).not.toHaveBeenCalled();
      $timeout.flush();
      expect(spy).toHaveBeenCalled();

      hidden = false;

      spy = jasmine.createSpy();
      runner = new $$AnimateRunner();
      runner.done(spy);
      runner.complete(true);
      expect(spy).not.toHaveBeenCalled();
      $$rAF.flush();
      expect(spy).toHaveBeenCalled();
      expect(() => {
        $timeout.flush();
      }).toThrow();
    });
  });

  they('should expose the `finally` promise function to handle the final state when $prop',
    { 'rejected': 'cancel', 'resolved': 'end' }, (method) => {
    inject(($$AnimateRunner, $rootScope) => {
        const runner = new $$AnimateRunner();
        let animationComplete = false;
        runner.finally(() => {
          animationComplete = true;
        }).catch(noop);
        runner[method]();
        $rootScope.$digest();
        expect(animationComplete).toBe(true);
    });
  });

  describe('.all()', () => {
    it('should resolve when all runners have naturally resolved',
      inject(($$rAF, $$AnimateRunner) => {

      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      const runner3 = new $$AnimateRunner();

      let status;
      $$AnimateRunner.all([runner1, runner2, runner3], (response) => {
        status = response;
      });

      runner1.complete(true);
      runner2.complete(true);
      runner3.complete(true);

      expect(status).toBeUndefined();

      $$rAF.flush();

      expect(status).toBe(true);
    }));

    they('should immediately resolve if and when all runners have been $prop',
      { ended: 'end', cancelled: 'cancel' }, (method) => {

      inject(($$AnimateRunner) => {
        const runner1 = new $$AnimateRunner();
        const runner2 = new $$AnimateRunner();
        const runner3 = new $$AnimateRunner();

        const expectedStatus = method === 'end';

        let status;
        $$AnimateRunner.all([runner1, runner2, runner3], (response) => {
          status = response;
        });

        runner1[method]();
        runner2[method]();
        runner3[method]();

        expect(status).toBe(expectedStatus);
      });
    });

    it('should return a status of `false` if one or more runners was cancelled',
      inject(($$AnimateRunner) => {

      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      const runner3 = new $$AnimateRunner();

      let status;
      $$AnimateRunner.all([runner1, runner2, runner3], (response) => {
        status = response;
      });

      runner1.end();
      runner2.end();
      runner3.cancel();

      expect(status).toBe(false);
    }));
  });

  describe('.chain()', () => {
    it('should evaluate an array of functions in a chain',
      inject(($$rAF, $$AnimateRunner) => {

      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      const runner3 = new $$AnimateRunner();

      const log = [];

      const items = [];
      items.push((fn) => {
        runner1.done(() => {
          log.push(1);
          fn();
        });
      });

      items.push((fn) => {
        runner2.done(() => {
          log.push(2);
          fn();
        });
      });

      items.push((fn) => {
        runner3.done(() => {
          log.push(3);
          fn();
        });
      });

      let status;
      $$AnimateRunner.chain(items, (response) => {
        status = response;
      });

      $$rAF.flush();

      runner2.complete(true);
      expect(log).toEqual([]);
      expect(status).toBeUndefined();

      runner1.complete(true);
      expect(log).toEqual([1,2]);
      expect(status).toBeUndefined();

      runner3.complete(true);
      expect(log).toEqual([1,2,3]);
      expect(status).toBe(true);
    }));

    it('should break the chain when a function evaluates to false',
      inject(($$rAF, $$AnimateRunner) => {

      const runner1 = new $$AnimateRunner();
      const runner2 = new $$AnimateRunner();
      const runner3 = new $$AnimateRunner();
      const runner4 = new $$AnimateRunner();
      const runner5 = new $$AnimateRunner();
      const runner6 = new $$AnimateRunner();

      const log = [];

      const items = [];
      items.push((fn) => { log.push(1); runner1.done(fn); });
      items.push((fn) => { log.push(2); runner2.done(fn); });
      items.push((fn) => { log.push(3); runner3.done(fn); });
      items.push((fn) => { log.push(4); runner4.done(fn); });
      items.push((fn) => { log.push(5); runner5.done(fn); });
      items.push((fn) => { log.push(6); runner6.done(fn); });

      let status;
      $$AnimateRunner.chain(items, (response) => {
        status = response;
      });

      runner1.complete('');
      runner2.complete(null);
      runner3.complete(undefined);
      runner4.complete(0);
      runner5.complete(false);

      runner6.complete(true);

      $$rAF.flush();

      expect(log).toEqual([1,2,3,4,5]);
      expect(status).toBe(false);
    }));
  });
});
