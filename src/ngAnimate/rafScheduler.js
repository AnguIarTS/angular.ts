export const $$rAFSchedulerFactory = [
  "$$rAF",
  function ($$rAF) {
    let queue, cancelFn;

    function scheduler(tasks) {
      // we make a copy since RAFScheduler mutates the state
      // of the passed in array variable and this would be difficult
      // to track down on the outside code
      queue = queue.concat(tasks);
      nextTick();
    }

    queue = scheduler.queue = [];

    /* waitUntilQuiet does two things:
     * 1. It will run the FINAL `fn` value only when an uncanceled RAF has passed through
     * 2. It will delay the next wave of tasks from running until the quiet `fn` has run.
     *
     * The motivation here is that animation code can request more time from the scheduler
     * before the next wave runs. This allows for certain DOM properties such as classes to
     * be resolved in time for the next animation to run.
     */
    scheduler.waitUntilQuiet = function (fn) {
      if (cancelFn) cancelFn();

      cancelFn = $$rAF(function () {
        cancelFn = null;
        fn();
        nextTick();
      });
    };

    return scheduler;

    function nextTick() {
      if (!queue.length) return;

      let items = queue.shift();
      for (const element of items) {
        element();
      }

      if (!cancelFn) {
        $$rAF(function () {
          if (!cancelFn) nextTick();
        });
      }
    }
  },
];
