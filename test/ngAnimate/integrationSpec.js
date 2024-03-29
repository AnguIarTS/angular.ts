

describe('ngAnimate integration tests', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  let element; let html; let ss;
  beforeEach(module(() => function($rootElement, $document, $animate) {
      $animate.enabled(true);

      ss = createMockStyleSheet($document);

      const body = jqLite($document[0].body);
      html = function(element) {
        body.append($rootElement);
        $rootElement.append(element);
      };
    }));

  afterEach(() => {
    dealoc(element);
    ss.destroy();
  });


 it('should cancel a running and started removeClass animation when a follow-up addClass animation adds the same class',
    inject(($animate, $rootScope, $$rAF, $document, $rootElement) => {

    jqLite($document[0].body).append($rootElement);
    element = jqLite('<div></div>');
    $rootElement.append(element);

    element.addClass('active-class');

    const runner = $animate.removeClass(element, 'active-class');
    $rootScope.$digest();

    const doneHandler = jasmine.createSpy('addClass done');
    runner.done(doneHandler);

    $$rAF.flush(); // Trigger the actual animation

    expect(doneHandler).not.toHaveBeenCalled();

    $animate.addClass(element, 'active-class');
    $rootScope.$digest();

    // Cancelling the removeClass animation triggers the done callback
    expect(doneHandler).toHaveBeenCalled();
  }));

  it('should remove a class that is currently being added by a running animation when another class is added in before in the same digest',
    inject(($animate, $rootScope, $$rAF, $document, $rootElement) => {

    jqLite($document[0].body).append($rootElement);
    element = jqLite('<div></div>');
    $rootElement.append(element);

    const runner = $animate.addClass(element, 'red');

    $rootScope.$digest();

    $animate.addClass(element, 'blue');
    $animate.removeClass(element, 'red');
    $rootScope.$digest();

    $$rAF.flush();

    expect(element).not.toHaveClass('red');
    expect(element).toHaveClass('blue');
  }));


  it('should add a class that is currently being removed by a running animation when another class is removed before in the same digest',
    inject(($animate, $rootScope, $$rAF, $document, $rootElement) => {

    jqLite($document[0].body).append($rootElement);
    element = jqLite('<div></div>');
    $rootElement.append(element);
    element.addClass('red blue');

    const runner = $animate.removeClass(element, 'red');

    $rootScope.$digest();

    $animate.removeClass(element, 'blue');
    $animate.addClass(element, 'red');
    $rootScope.$digest();

    $$rAF.flush();

    expect(element).not.toHaveClass('blue');
    expect(element).toHaveClass('red');
  }));


  describe('CSS animations', () => {
    if (!browserSupportsCssAnimations()) return;

    it('should only create a single copy of the provided animation options',
      inject(($rootScope, $rootElement, $animate) => {

      ss.addRule('.animate-me', 'transition:2s linear all;');

      const element = jqLite('<div class="animate-me"></div>');
      html(element);

      const myOptions = {to: { 'color': 'red' }};

      const spy = spyOn(window, 'copy');
      expect(spy).not.toHaveBeenCalled();

      const animation = $animate.leave(element, myOptions);
      $rootScope.$digest();
      $animate.flush();

      expect(spy).toHaveBeenCalledOnce();
      dealoc(element);
    }));

    they('should render an $prop animation',
      ['enter', 'leave', 'move', 'addClass', 'removeClass', 'setClass'], (event) => {

      inject(($animate, $compile, $rootScope, $rootElement) => {
        element = jqLite('<div class="animate-me"></div>');
        $compile(element)($rootScope);

        const className = 'klass';
        let addClass; let removeClass;
        const parent = jqLite('<div></div>');
        html(parent);

        let setupClass; let activeClass;
        let args;
        let classRuleSuffix = '';

        switch (event) {
          case 'enter':
          case 'move':
            setupClass = `ng-${  event}`;
            activeClass = `ng-${  event  }-active`;
            args = [element, parent];
            break;

          case 'leave':
            parent.append(element);
            setupClass = `ng-${  event}`;
            activeClass = `ng-${  event  }-active`;
            args = [element];
            break;

          case 'addClass':
            parent.append(element);
            classRuleSuffix = '.add';
            setupClass = `${className  }-add`;
            activeClass = `${className  }-add-active`;
            addClass = className;
            args = [element, className];
            break;

          case 'removeClass':
            parent.append(element);
            setupClass = `${className  }-remove`;
            activeClass = `${className  }-remove-active`;
            element.addClass(className);
            args = [element, className];
            break;

          case 'setClass':
            parent.append(element);
            addClass = className;
            removeClass = 'removing-class';
            setupClass = `${addClass  }-add ${  removeClass  }-remove`;
            activeClass = `${addClass  }-add-active ${  removeClass  }-remove-active`;
            element.addClass(removeClass);
            args = [element, addClass, removeClass];
            break;
        }

        ss.addRule('.animate-me', 'transition:2s linear all;');

        const runner = $animate[event].apply($animate, args);
        $rootScope.$digest();

        let animationCompleted = false;
        runner.then(() => {
          animationCompleted = true;
        });

        expect(element).toHaveClass(setupClass);
        $animate.flush();
        expect(element).toHaveClass(activeClass);

        browserTrigger(element, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
        $animate.flush();

        expect(element).not.toHaveClass(setupClass);
        expect(element).not.toHaveClass(activeClass);

        $rootScope.$digest();

        expect(animationCompleted).toBe(true);
      });
    });

    it('should not throw an error if the element is orphaned before the CSS animation starts',
      inject(($rootScope, $rootElement, $animate) => {

      ss.addRule('.animate-me', 'transition:2s linear all;');

      const parent = jqLite('<div></div>');
      html(parent);

      const element = jqLite('<div class="animate-me">DOING</div>');
      parent.append(element);

      $animate.addClass(parent, 'on');
      $animate.addClass(element, 'on');
      $rootScope.$digest();

      // this will run the first class-based animation
      $animate.flush();

      element.remove();

      expect(() => {
        $animate.flush();
      }).not.toThrow();

      dealoc(element);
    }));

    it('should include the added/removed classes in lieu of the enter animation',
      inject(($animate, $compile, $rootScope, $rootElement, $document) => {

      ss.addRule('.animate-me.ng-enter.on', 'transition:2s linear all;');

      element = jqLite('<div><div ng-if="exp" ng-class="{on:exp2}" class="animate-me"></div></div>');

      $rootElement.append(element);
      jqLite($document[0].body).append($rootElement);

      $compile(element)($rootScope);

      $rootScope.exp = true;
      $rootScope.$digest();
      $animate.flush();

      let child = element.find('div');

      expect(child).not.toHaveClass('on');
      expect(child).not.toHaveClass('ng-enter');

      $rootScope.exp = false;
      $rootScope.$digest();

      $rootScope.exp = true;
      $rootScope.exp2 = true;
      $rootScope.$digest();

      child = element.find('div');

      expect(child).toHaveClass('on');
      expect(child).toHaveClass('ng-enter');

      $animate.flush();

      expect(child).toHaveClass('ng-enter-active');

      browserTrigger(child, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(child).not.toHaveClass('ng-enter-active');
      expect(child).not.toHaveClass('ng-enter');
    }));

    it('should animate ng-class and a structural animation in parallel on the same element',
      inject(($animate, $compile, $rootScope, $rootElement, $document) => {

      ss.addRule('.animate-me.ng-enter', 'transition:2s linear all;');
      ss.addRule('.animate-me.expand', 'transition:5s linear all; font-size:200px;');

      element = jqLite('<div><div ng-if="exp" ng-class="{expand:exp2}" class="animate-me"></div></div>');

      $rootElement.append(element);
      jqLite($document[0].body).append($rootElement);

      $compile(element)($rootScope);

      $rootScope.exp = true;
      $rootScope.exp2 = true;
      $rootScope.$digest();

      const child = element.find('div');

      expect(child).toHaveClass('ng-enter');
      expect(child).toHaveClass('expand-add');
      expect(child).toHaveClass('expand');

      $animate.flush();

      expect(child).toHaveClass('ng-enter-active');
      expect(child).toHaveClass('expand-add-active');

      browserTrigger(child, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(child).not.toHaveClass('ng-enter-active');
      expect(child).not.toHaveClass('ng-enter');
      expect(child).not.toHaveClass('expand-add-active');
      expect(child).not.toHaveClass('expand-add');
    }));

    it('should issue a RAF for each element animation on all DOM levels', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document, $$rAF) => {
        ss.addRule('.ng-enter', 'transition:2s linear all;');

        element = jqLite(
          '<div ng-class="{parent:exp}">' +
            '<div ng-class="{parent2:exp}">' +
               '<div ng-repeat="item in items" ng-class="{fade:exp}">' +
                  '{{ item }}' +
               '</div>' +
            '</div>' +
          '</div>'
        );

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.$digest();

        const outer = element;
        const inner = element.find('div');

        $rootScope.exp = true;
        $rootScope.items = [1,2,3,4,5,6,7,8,9,10];

        $rootScope.$digest();
        expect(outer).not.toHaveClass('parent');
        expect(inner).not.toHaveClass('parent2');

        assertTotalRepeats(0);

        $$rAF.flush();
        expect(outer).toHaveClass('parent');

        assertTotalRepeats(0);

        $$rAF.flush();
        expect(inner).toHaveClass('parent2');

        assertTotalRepeats(10);

        function assertTotalRepeats(total) {
          expect(inner[0].querySelectorAll('div.ng-enter').length).toBe(total);
        }
      });
    });


    it('should add the preparation class for an enter animation before a parent class-based animation is applied', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document) => {
        element = jqLite(
          '<div ng-class="{parent:exp}">' +
            '<div ng-if="exp">' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition:2s linear all;');
        ss.addRule('.parent-add', 'transition:5s linear all;');

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.exp = true;
        $rootScope.$digest();

        const parent = element;
        const child = element.find('div');

        expect(parent).not.toHaveClass('parent');
        expect(parent).toHaveClass('parent-add');
        expect(child).not.toHaveClass('ng-enter');
        expect(child).toHaveClass('ng-enter-prepare');

        $animate.flush();
        expect(parent).toHaveClass('parent parent-add parent-add-active');
        expect(child).toHaveClass('ng-enter ng-enter-active');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });


    it('should avoid adding the ng-enter-prepare method to a parent structural animation that contains child animations', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document, $$rAF) => {
        element = jqLite(
          '<div ng-animate-children="true">' +
            '<div ng-if="parent" class="parent">' +
              '<div ng-if="child" class="child">' +
                '<div ng-class="{something:true}"></div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition:2s linear all;');

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.parent = true;
        $rootScope.child = true;
        $rootScope.$digest();

        const parent = jqLite(element[0].querySelector('.parent'));
        const child = jqLite(element[0].querySelector('.child'));

        expect(parent).not.toHaveClass('ng-enter-prepare');
        expect(child).toHaveClass('ng-enter-prepare');

        $$rAF.flush();

        expect(parent).not.toHaveClass('ng-enter-prepare');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });

    it('should add the preparation class for an enter animation before a parent class-based animation is applied', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document) => {
        element = jqLite(
          '<div ng-class="{parent:exp}">' +
            '<div ng-if="exp">' +
            '</div>' +
          '</div>'
        );

        ss.addRule('.ng-enter', 'transition:2s linear all;');
        ss.addRule('.parent-add', 'transition:5s linear all;');

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.exp = true;
        $rootScope.$digest();

        const parent = element;
        const child = element.find('div');

        expect(parent).not.toHaveClass('parent');
        expect(parent).toHaveClass('parent-add');
        expect(child).not.toHaveClass('ng-enter');
        expect(child).toHaveClass('ng-enter-prepare');

        $animate.flush();
        expect(parent).toHaveClass('parent parent-add parent-add-active');
        expect(child).toHaveClass('ng-enter ng-enter-active');
        expect(child).not.toHaveClass('ng-enter-prepare');
      });
    });


    it('should remove the prepare classes when different structural animations happen in the same digest', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document, $$animateCache) => {
        element = jqLite(
           // Class animation on parent element is neeeded so the child elements get the prepare class
          '<div id="outer" ng-class="{blue: cond}" ng-switch="cond">' +
            '<div id="default" ng-switch-default></div>' +
            '<div id="truthy" ng-switch-when="true"></div>' +
          '</div>'
        );

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.cond = false;
        $rootScope.$digest();

        $rootScope.cond = true;
        $rootScope.$digest();

        const parent = element;
        const truthySwitch = jqLite(parent[0].querySelector('#truthy'));
        const defaultSwitch = jqLite(parent[0].querySelector('#default'));

        expect(parent).not.toHaveClass('blue');
        expect(parent).toHaveClass('blue-add');
        expect(truthySwitch).toHaveClass('ng-enter-prepare');
        expect(defaultSwitch).toHaveClass('ng-leave-prepare');

        $animate.flush();

        expect(parent).toHaveClass('blue');
        expect(parent).not.toHaveClass('blue-add');
        expect(truthySwitch).not.toHaveClass('ng-enter-prepare');
        expect(defaultSwitch).not.toHaveClass('ng-leave-prepare');
      });
    });

    it('should respect the element node for caching when animations with the same type happen in the same digest', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document, $$animateCache) => {
        ss.addRule('.animate.ng-enter', 'transition:2s linear all;');

        element = jqLite(
          '<div>' +
            '<div>' +
              '<div id="noanimate" ng-if="cond"></div>' +
            '</div>' +
            '<div>' +
              '<div id="animate" class="animate" ng-if="cond"></div>' +
            '</div>' +
          '</div>'
        );

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);

        $compile(element)($rootScope);
        $rootScope.cond = true;
        $rootScope.$digest();

        const parent = element;
        const noanimate = jqLite(parent[0].querySelector('#noanimate'));
        const animate = jqLite(parent[0].querySelector('#animate'));

        expect(noanimate).not.toHaveClass('ng-enter');
        expect(animate).toHaveClass('ng-enter');

        $animate.closeAndFlush();

        expect(noanimate).not.toHaveClass('ng-enter');
        expect(animate).not.toHaveClass('ng-enter');
      });
    });


    it('should pack level elements into their own RAF flush', () => {
      module('ngAnimateMock');
      inject(($animate, $compile, $rootScope, $rootElement, $document) => {
        ss.addRule('.inner', 'transition:2s linear all;');

        element = jqLite(
          '<div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}">' +
               '<div class="inner" ng-if="exp"></div>' +
            '</div>' +
            '<div class="outer" ng-class="{on:exp}"></div>' +
          '</div>'
        );

        $rootElement.append(element);
        jqLite($document[0].body).append($rootElement);
        $compile(element)($rootScope);
        $rootScope.$digest();

        assertGroupHasClass(query('outer'), 'on', true);
        expect(query('inner').length).toBe(0);

        $rootScope.exp = true;
        $rootScope.$digest();

        assertGroupHasClass(query('outer'), 'on', true);
        assertGroupHasClass(query('inner'), 'ng-enter', true);

        $animate.flush();

        assertGroupHasClass(query('outer'), 'on');
        assertGroupHasClass(query('inner'), 'ng-enter');

        function query(className) {
          return element[0].querySelectorAll(`.${  className}`);
        }

        function assertGroupHasClass(elms, className, not) {
          for (let i = 0; i < elms.length; i++) {
            const assert = expect(jqLite(elms[i]));
            (not ? assert.not : assert).toHaveClass(className);
          }
        }
      });
    });

    it('should trigger callbacks at the start and end of an animation',
      inject(($rootScope, $rootElement, $animate, $compile) => {

      ss.addRule('.animate-me', 'transition:2s linear all;');

      const parent = jqLite('<div><div ng-if="exp" class="animate-me"></div></div>');
      element = parent.find('div');
      html(parent);

      $compile(parent)($rootScope);
      $rootScope.$digest();

      const spy = jasmine.createSpy();
      $animate.on('enter', parent, spy);

      $rootScope.exp = true;
      $rootScope.$digest();

      element = parent.find('div');

      $animate.flush();

      expect(spy).toHaveBeenCalledTimes(1);

      browserTrigger(element, 'transitionend', { timeStamp: Date.now(), elapsedTime: 2 });
      $animate.flush();

      expect(spy).toHaveBeenCalledTimes(2);

      dealoc(element);
    }));


    it('should remove a class when the same class is currently being added by a joined class-based animation',
      inject(($animate, $animateCss, $rootScope, $document, $rootElement, $$rAF) => {

      ss.addRule('.hide', 'opacity: 0');
      ss.addRule('.hide-add, .hide-remove', 'transition: 1s linear all');

      jqLite($document[0].body).append($rootElement);
      element = jqLite('<div></div>');
      $rootElement.append(element);

      // These animations will be joined together
      $animate.addClass(element, 'red');
      $animate.addClass(element, 'hide');
      $rootScope.$digest();

      expect(element).toHaveClass('red-add');
      expect(element).toHaveClass('hide-add');

      // When a digest has passed, but no $rAF has been issued yet, .hide hasn't been added to
      // the element yet
      $animate.removeClass(element, 'hide');
      $rootScope.$digest();
      $$rAF.flush();

      expect(element).not.toHaveClass('hide-add hide-add-active');
      expect(element).toHaveClass('hide-remove hide-remove-active');

      // End the animation process
      browserTrigger(element, 'transitionend',
        { timeStamp: Date.now() + 1000, elapsedTime: 2 });
      $animate.flush();

      expect(element).not.toHaveClass('hide-add-active red-add-active');
      expect(element).toHaveClass('red');
      expect(element).not.toHaveClass('hide');
    }));

    it('should handle ng-if & ng-class with a class that is removed before its add animation has concluded', () => {
      inject(($animate, $rootScope, $compile, $timeout, $$rAF) => {

        ss.addRule('.animate-me', 'transition: all 0.5s;');

        element = jqLite('<section><div ng-if="true" class="animate-me" ng-class="{' +
          'red: red,' +
          'blue: blue' +
          '}"></div></section>');

        html(element);
        $rootScope.blue = true;
        $rootScope.red = true;
        $compile(element)($rootScope);
        $rootScope.$digest();

        const child = element.find('div');

        // Trigger class removal before the add animation has been concluded
        $rootScope.blue = false;
        $animate.closeAndFlush();

        expect(child).toHaveClass('red');
        expect(child).not.toHaveClass('blue');
      });
    });

    it('should not apply ngAnimate CSS preparation classes when a css animation definition has duration = 0', () => {
      function fill(max) {
        const arr = [];
        for (let i = 0; i < max; i++) {
          arr.push(i);
        }
        return arr;
      }

      inject(($animate, $rootScope, $compile, $timeout, $$rAF, $$jqLite) => {
        ss.addRule('.animate-me', 'transition: all 0.5s;');

        const classAddSpy = spyOn($$jqLite, 'addClass').and.callThrough();
        const classRemoveSpy = spyOn($$jqLite, 'removeClass').and.callThrough();

        element = jqLite(
          '<div>' +
            '<div ng-repeat="item in items"></div>' +
          '</div> '
        );

        html(element);
        $compile(element)($rootScope);

        $rootScope.items = fill(100);
        $rootScope.$digest();

        expect(classAddSpy.calls.count()).toBe(2);
        expect(classRemoveSpy.calls.count()).toBe(2);

        expect(classAddSpy.calls.argsFor(0)[1]).toBe('ng-animate');
        expect(classAddSpy.calls.argsFor(1)[1]).toBe('ng-enter');
        expect(classRemoveSpy.calls.argsFor(0)[1]).toBe('ng-enter');
        expect(classRemoveSpy.calls.argsFor(1)[1]).toBe('ng-animate');

        expect(element.children().length).toBe(100);
      });
    });
  });

  describe('JS animations', () => {
    they('should render an $prop animation',
      ['enter', 'leave', 'move', 'addClass', 'removeClass', 'setClass'], (event) => {

      let endAnimation;
      let animateCompleteCallbackFired = true;

      module(($animateProvider) => {
        $animateProvider.register('.animate-me', () => {
          const animateFactory = {};
          animateFactory[event] = function(element, addClass, removeClass, done) {
            endAnimation = arguments[arguments.length - 2]; // the done method is the 2nd last one
            return function(status) {
              animateCompleteCallbackFired = status === false;
            };
          };
          return animateFactory;
        });
      });

      inject(($animate, $compile, $rootScope, $rootElement) => {
        element = jqLite('<div class="animate-me"></div>');
        $compile(element)($rootScope);

        const className = 'klass';
        let addClass; let removeClass;
        const parent = jqLite('<div></div>');
        html(parent);

        let args;
        switch (event) {
          case 'enter':
          case 'move':
            args = [element, parent];
            break;

          case 'leave':
            parent.append(element);
            args = [element];
            break;

          case 'addClass':
            parent.append(element);
            args = [element, className];
            break;

          case 'removeClass':
            parent.append(element);
            element.addClass(className);
            args = [element, className];
            break;

          case 'setClass':
            parent.append(element);
            addClass = className;
            removeClass = 'removing-class';
            element.addClass(removeClass);
            args = [element, addClass, removeClass];
            break;
        }

        const runner = $animate[event].apply($animate, args);
        let animationCompleted = false;
        runner.then(() => {
          animationCompleted = true;
        });

        $rootScope.$digest();

        expect(isFunction(endAnimation)).toBe(true);

        endAnimation();
        $animate.flush();
        expect(animateCompleteCallbackFired).toBe(true);

        $rootScope.$digest();
        expect(animationCompleted).toBe(true);
      });
    });

    they('should not wait for a parent\'s classes to resolve if a $prop is animation used for children',
      ['beforeAddClass', 'beforeRemoveClass', 'beforeSetClass'], (phase) => {

      let capturedChildClasses;
      let endParentAnimationFn;

      module(($animateProvider) => {
        $animateProvider.register('.parent-man', () => {
          const animateFactory = {};
          animateFactory[phase] = function(element, addClass, removeClass, done) {
            // this will wait until things are over
            endParentAnimationFn = done;
          };
          return animateFactory;
        });

        $animateProvider.register('.child-man', () => ({
            enter(element, done) {
              capturedChildClasses = element.parent().attr('class');
              done();
            }
          }));
      });

      inject(($animate, $compile, $rootScope, $rootElement) => {
        element = jqLite('<div class="parent-man"></div>');
        const child = jqLite('<div class="child-man"></div>');

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element);
        switch (phase) {
          case 'beforeAddClass':
            $animate.addClass(element, 'cool');
            break;

          case 'beforeSetClass':
            $animate.setClass(element, 'cool');
            break;

          case 'beforeRemoveClass':
            element.addClass('cool');
            $animate.removeClass(element, 'cool');
            break;
        }

        $rootScope.$digest();
        $animate.flush();

        expect(endParentAnimationFn).toBeTruthy();

        // the spaces are used so that ` cool ` can be matched instead
        // of just a substring like `cool-add`.
        const safeClassMatchString = ` ${  capturedChildClasses  } `;
        if (phase === 'beforeRemoveClass') {
          expect(safeClassMatchString).toContain(' cool ');
        } else {
          expect(safeClassMatchString).not.toContain(' cool ');
        }
      });
    });

    they('should have the parent\'s classes already applied in time for the children if $prop is used',
      ['addClass', 'removeClass', 'setClass'], (phase) => {

      let capturedChildClasses;
      let endParentAnimationFn;

      module(($animateProvider) => {
        $animateProvider.register('.parent-man', () => {
          const animateFactory = {};
          animateFactory[phase] = function(element, addClass, removeClass, done) {
            // this will wait until things are over
            endParentAnimationFn = done;
          };
          return animateFactory;
        });

        $animateProvider.register('.child-man', () => ({
            enter(element, done) {
              capturedChildClasses = element.parent().attr('class');
              done();
            }
          }));
      });

      inject(($animate, $compile, $rootScope, $rootElement) => {
        element = jqLite('<div class="parent-man"></div>');
        const child = jqLite('<div class="child-man"></div>');

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element);
        switch (phase) {
          case 'addClass':
            $animate.addClass(element, 'cool');
            break;

          case 'setClass':
            $animate.setClass(element, 'cool');
            break;

          case 'removeClass':
            element.addClass('cool');
            $animate.removeClass(element, 'cool');
            break;
        }

        $rootScope.$digest();
        $animate.flush();

        expect(endParentAnimationFn).toBeTruthy();

        // the spaces are used so that ` cool ` can be matched instead
        // of just a substring like `cool-add`.
        const safeClassMatchString = ` ${  capturedChildClasses  } `;
        if (phase === 'removeClass') {
          expect(safeClassMatchString).not.toContain(' cool ');
        } else {
          expect(safeClassMatchString).toContain(' cool ');
        }
      });
    });

    it('should not alter the provided options values in anyway throughout the animation', () => {
      const animationSpy = jasmine.createSpy();
      module(($animateProvider) => {
        $animateProvider.register('.this-animation', () => ({
            enter(element, done) {
              animationSpy();
              done();
            }
          }));
      });

      inject(($animate, $rootScope, $compile) => {
        element = jqLite('<div class="parent-man"></div>');
        const child = jqLite('<div class="child-man one"></div>');

        const initialOptions = {
          from: { height: '50px' },
          to: { width: '100px' },
          addClass: 'one',
          removeClass: 'two',
          domOperation: undefined
        };

        const copiedOptions = copy(initialOptions);
        expect(copiedOptions).toEqual(initialOptions);

        html(element);
        $compile(element)($rootScope);

        $animate.enter(child, element, null, copiedOptions);
        $rootScope.$digest();
        expect(copiedOptions).toEqual(initialOptions);

        $animate.flush();
        expect(copiedOptions).toEqual(initialOptions);

        expect(child).toHaveClass('one');
        expect(child).not.toHaveClass('two');

        expect(child.attr('style')).toContain('100px');
        expect(child.attr('style')).toContain('50px');
      });
    });


    it('should execute the enter animation on a <form> with ngIf that has an ' +
      '<input type="email" required>', () => {

      const animationSpy = jasmine.createSpy();

      module(($animateProvider) => {
        $animateProvider.register('.animate-me', () => ({
            enter(element, done) {
              animationSpy();
              done();
            }
          }));
      });

      inject(($animate, $rootScope, $compile) => {

        element = jqLite(
          '<div>' +
            '<form class="animate-me" ng-if="show">' +
              '<input ng-model="myModel" type="email" required />' +
            '</form>' +
          '</div>');

        html(element);

        $compile(element)($rootScope);

        $rootScope.show = true;
        $rootScope.$digest();

        $animate.flush();
        expect(animationSpy).toHaveBeenCalled();
      });
    });
  });
});
