

describe('$$rAFScheduler', () => {

  beforeEach(module('ngAnimate'));

  it('should accept an array of tasks and run the first task immediately',
    inject(($$rAFScheduler) => {

    const taskSpy = jasmine.createSpy();
    const tasks = [taskSpy];
    $$rAFScheduler([tasks]);
    expect(taskSpy).toHaveBeenCalled();
  }));

  it('should run tasks based on how many RAFs have run in comparison to the task index',
    inject(($$rAFScheduler, $$rAF) => {

    let i; const tasks = [];

    for (i = 0; i < 5; i++) {
      tasks.push([jasmine.createSpy()]);
    }

    $$rAFScheduler(tasks);

    for (i = 1; i < 5; i++) {
      const taskSpy = tasks[i][0];
      expect(taskSpy).not.toHaveBeenCalled();
      $$rAF.flush();
      expect(taskSpy).toHaveBeenCalled();
    }
  }));

  it('should space out subarrays by a RAF and run the internals in parallel',
    inject(($$rAFScheduler, $$rAF) => {

    const spies = {
      a: jasmine.createSpy(),
      b: jasmine.createSpy(),
      c: jasmine.createSpy(),

      x: jasmine.createSpy(),
      y: jasmine.createSpy(),
      z: jasmine.createSpy()
    };

    const items = [[spies.a, spies.x],
                 [spies.b, spies.y],
                 [spies.c, spies.z]];

    expect(spies.a).not.toHaveBeenCalled();
    expect(spies.x).not.toHaveBeenCalled();

    $$rAFScheduler(items);

    expect(spies.a).toHaveBeenCalled();
    expect(spies.x).toHaveBeenCalled();


    expect(spies.b).not.toHaveBeenCalled();
    expect(spies.y).not.toHaveBeenCalled();

    $$rAF.flush();

    expect(spies.b).toHaveBeenCalled();
    expect(spies.y).toHaveBeenCalled();


    expect(spies.c).not.toHaveBeenCalled();
    expect(spies.z).not.toHaveBeenCalled();

    $$rAF.flush();

    expect(spies.c).toHaveBeenCalled();
    expect(spies.z).toHaveBeenCalled();
  }));

  describe('.waitUntilQuiet', () => {

    it('should run the `last` provided function when a RAF fully passes',
      inject(($$rAFScheduler, $$rAF) => {

      const q1 = jasmine.createSpy();
      $$rAFScheduler.waitUntilQuiet(q1);

      expect(q1).not.toHaveBeenCalled();

      const q2 = jasmine.createSpy();
      $$rAFScheduler.waitUntilQuiet(q2);

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();

      const q3 = jasmine.createSpy();
      $$rAFScheduler.waitUntilQuiet(q3);

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();
      expect(q3).not.toHaveBeenCalled();

      $$rAF.flush();

      expect(q1).not.toHaveBeenCalled();
      expect(q2).not.toHaveBeenCalled();
      expect(q3).toHaveBeenCalled();
    }));

    it('should always execute itself before the next RAF task tick occurs', () => {
      module(provideLog);
      inject(($$rAFScheduler, $$rAF, log) => {
        const quietFn = log.fn('quiet');
        const tasks = [
          [log.fn('task1')],
          [log.fn('task2')],
          [log.fn('task3')],
          [log.fn('task4')]
        ];

        $$rAFScheduler(tasks);
        expect(log).toEqual(['task1']);

        $$rAFScheduler.waitUntilQuiet(quietFn);
        expect(log).toEqual(['task1']);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2']);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2', 'task3']);

        $$rAFScheduler.waitUntilQuiet(quietFn);

        $$rAF.flush();

        expect(log).toEqual(['task1', 'quiet', 'task2', 'task3', 'quiet', 'task4']);
      });
    });
  });

});
