

describe('animations', () => {

  beforeEach(module('ngAnimate'));
  beforeEach(module('ngAnimateMock'));

  let element; let applyAnimationClasses;

  beforeEach(module(() => function($$jqLite) {
      applyAnimationClasses = applyAnimationClassesFactory($$jqLite);
    }));

  afterEach(inject(() => {
    dealoc(element);
  }));


  it('should allow animations if the application is bootstrapped on the document node', () => {
    let capturedAnimation;

    module(($provide) => {
      $provide.factory('$rootElement', ($document) => $document);
      $provide.factory('$$animation', ($$AnimateRunner) => function() {
          capturedAnimation = arguments;
          return new $$AnimateRunner();
        });
    });

    inject(($animate, $rootScope, $document) => {
      $animate.enabled(true);

      element = jqLite('<div></div>');

      $animate.enter(element, jqLite($document[0].body));
      $rootScope.$digest();

      expect(capturedAnimation).toBeTruthy();
    });
  });

  describe('during bootstrap', () => {
    it('should be enabled only after the first digest is fired and the postDigest queue is empty',
      inject(($animate, $rootScope) => {

      let capturedEnabledState;
      $rootScope.$$postDigest(() => {
        capturedEnabledState = $animate.enabled();
      });

      expect($animate.enabled()).toBe(false);
      $rootScope.$digest();

      expect(capturedEnabledState).toBe(false);
      expect($animate.enabled()).toBe(true);
    }));

    it('should be disabled until all pending template requests have been downloaded', () => {
      const mockTemplateRequest = {
        totalPendingRequests: 2
      };

      module(($provide) => {
        $provide.value('$templateRequest', mockTemplateRequest);
      });
      inject(($animate, $rootScope) => {
        expect($animate.enabled()).toBe(false);

        $rootScope.$digest();
        expect($animate.enabled()).toBe(false);

        mockTemplateRequest.totalPendingRequests = 0;
        $rootScope.$digest();
        expect($animate.enabled()).toBe(true);
      });
    });

    it('should stay disabled if set to be disabled even after all templates have been fully downloaded', () => {
      const mockTemplateRequest = {
        totalPendingRequests: 2
      };

      module(($provide) => {
        $provide.value('$templateRequest', mockTemplateRequest);
      });
      inject(($animate, $rootScope) => {
        $animate.enabled(false);
        expect($animate.enabled()).toBe(false);

        $rootScope.$digest();
        expect($animate.enabled()).toBe(false);

        mockTemplateRequest.totalPendingRequests = 0;
        $rootScope.$digest();
        expect($animate.enabled()).toBe(false);
      });
    });
  });

  describe('$animate', () => {
    let parent;
    let parent2;
    let options;
    let capturedAnimation;
    let capturedAnimationHistory;
    let overriddenAnimationRunner;
    let defaultFakeAnimationRunner;

    beforeEach(module(($provide) => {
      overriddenAnimationRunner = null;
      capturedAnimation = null;
      capturedAnimationHistory = [];

      options = {};
      $provide.value('$$animation', function() {
        capturedAnimationHistory.push(capturedAnimation = arguments);
        return overriddenAnimationRunner || defaultFakeAnimationRunner;
      });

      return function($rootElement, $q, $animate, $$AnimateRunner, $document) {
        defaultFakeAnimationRunner = new $$AnimateRunner();
        $animate.enabled(true);

        element = jqLite('<div class="element">element</div>');
        parent = jqLite('<div class="parent1">parent</div>');
        parent2 = jqLite('<div class="parent2">parent</div>');

        $rootElement.append(parent);
        $rootElement.append(parent2);
        jqLite($document[0].body).append($rootElement);
      };
    }));

    it('should not alter the provided options input in any way throughout the animation', inject(($animate, $rootScope) => {
      const initialOptions = {
        from: { height: '50px' },
        to: { width: '50px' },
        addClass: 'one',
        removeClass: 'two',
        domOperation: undefined
      };

      const copiedOptions = copy(initialOptions);
      expect(copiedOptions).toEqual(initialOptions);

      const runner = $animate.enter(element, parent, null, copiedOptions);
      expect(copiedOptions).toEqual(initialOptions);

      $rootScope.$digest();
      expect(copiedOptions).toEqual(initialOptions);
    }));

    it('should skip animations entirely if the document is hidden', () => {
      let hidden = true;

      module(($provide) => {
        $provide.value('$$isDocumentHidden', () => hidden);
      });

      inject(($animate, $rootScope) => {
        $animate.enter(element, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
        expect(element[0].parentNode).toEqual(parent[0]);

        hidden = false;

        $animate.leave(element);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      });
    });

    it('should animate only the specified CSS className matched within $animateProvider.classNameFilter for div', () => {
      module(($animateProvider) => {
        $animateProvider.classNameFilter(/only-allow-this-animation/);
      });
      inject(($animate, $rootScope) => {
        expect(element).not.toHaveClass('only-allow-this-animation');

        $animate.enter(element, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        element.addClass('only-allow-this-animation');

        $animate.leave(element, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      });
    });

    it('should animate only the specified CSS className matched within $animateProvider.classNameFilter for svg', () => {
      module(($animateProvider) => {
        $animateProvider.classNameFilter(/only-allow-this-animation-svg/);
      });
      inject(($animate, $rootScope, $compile) => {
        const svgElement = $compile('<svg class="element"></svg>')($rootScope);
        expect(svgElement).not.toHaveClass('only-allow-this-animation-svg');

        $animate.enter(svgElement, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        svgElement.attr('class', 'element only-allow-this-animation-svg');

        $animate.leave(svgElement, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      });
    });

    they('should not apply the provided options.$prop value unless it\'s a string or string-based array', ['addClass', 'removeClass'], (prop) => {
      inject(($animate, $rootScope) => {
        let startingCssClasses = element.attr('class') || '';

        const options1 = {};
        options1[prop] = function() {};
        $animate.enter(element, parent, null, options1);

        expect(element.attr('class')).toEqual(startingCssClasses);

        $rootScope.$digest();

        const options2 = {};
        options2[prop] = true;
        $animate.leave(element, options2);

        expect(element.attr('class')).toEqual(startingCssClasses);

        $rootScope.$digest();

        capturedAnimation = null;

        const options3 = {};
        if (prop === 'removeClass') {
          element.addClass('fatias');
          startingCssClasses = element.attr('class');
        }

        options3[prop] = ['fatias'];
        $animate.enter(element, parent, null, options3);

        $rootScope.$digest();

        expect(element.attr('class')).not.toEqual(startingCssClasses);
      });
    });

    it('should throw a minErr if a regex value is used which partially contains or fully matches the `ng-animate` CSS class',
      module(($animateProvider) => {
        expect(setFilter(/ng-animate/)).toThrowMinErr('$animate', 'nongcls');
        expect(setFilter(/first ng-animate last/)).toThrowMinErr('$animate', 'nongcls');
        expect(setFilter(/first ng-animate ng-animate-special last/)).toThrowMinErr('$animate', 'nongcls');
        expect(setFilter(/(ng-animate)/)).toThrowMinErr('$animate', 'nongcls');
        expect(setFilter(/(foo|ng-animate|bar)/)).toThrowMinErr('$animate', 'nongcls');
        expect(setFilter(/(foo|)ng-animate(|bar)/)).toThrowMinErr('$animate', 'nongcls');

        expect(setFilter(/ng-animater/)).not.toThrow();
        expect(setFilter(/my-ng-animate/)).not.toThrow();
        expect(setFilter(/first ng-animater last/)).not.toThrow();
        expect(setFilter(/first my-ng-animate last/)).not.toThrow();

        function setFilter(regex) {
          return function() {
            $animateProvider.classNameFilter(regex);
          };
        }
      })
    );

    it('should clear the `classNameFilter` if a disallowed RegExp is passed',
      module(($animateProvider) => {
        const validRegex = /no-ng-animate/;
        const invalidRegex = /no ng-animate/;

        $animateProvider.classNameFilter(validRegex);
        expect($animateProvider.classNameFilter()).toEqual(validRegex);

        // eslint-disable-next-line no-empty
        try { $animateProvider.classNameFilter(invalidRegex); } catch (err) {}
        expect($animateProvider.classNameFilter()).toBeNull();
      })
    );

    it('should complete the leave DOM operation in case the classNameFilter fails', () => {
      module(($animateProvider) => {
        $animateProvider.classNameFilter(/memorable-animation/);
      });
      inject(($animate, $rootScope) => {
        expect(element).not.toHaveClass('memorable-animation');

        parent.append(element);
        $animate.leave(element);
        $rootScope.$digest();

        expect(capturedAnimation).toBeNull();
        expect(element[0].parentNode).toBeFalsy();
      });
    });

    it('should not try to match the `classNameFilter` RegExp if animations are globally disabled',
      () => {
        const regex = /foo/;
        const regexTestSpy = spyOn(regex, 'test').and.callThrough();

        module(($animateProvider) => {
          $animateProvider.classNameFilter(regex);
        });

        inject(($animate) => {
          $animate.addClass(element, 'foo');
          expect(regexTestSpy).toHaveBeenCalled();

          regexTestSpy.calls.reset();
          $animate.enabled(false);
          $animate.addClass(element, 'bar');
          expect(regexTestSpy).not.toHaveBeenCalled();

          regexTestSpy.calls.reset();
          $animate.enabled(true);
          $animate.addClass(element, 'baz');
          expect(regexTestSpy).toHaveBeenCalled();
        });
      }
    );

    describe('customFilter()', () => {
      it('should be `null` by default', module(($animateProvider) => {
        expect($animateProvider.customFilter()).toBeNull();
      }));

      it('should clear the `customFilter` if no function is passed',
        module(($animateProvider) => {
          $animateProvider.customFilter(() => {});
          expect($animateProvider.customFilter()).toEqual(jasmine.any(Function));

          $animateProvider.customFilter(null);
          expect($animateProvider.customFilter()).toBeNull();

          $animateProvider.customFilter(() => {});
          expect($animateProvider.customFilter()).toEqual(jasmine.any(Function));

          $animateProvider.customFilter({});
          expect($animateProvider.customFilter()).toBeNull();
        })
      );

      it('should only perform animations for which the function returns a truthy value',
        () => {
          let animationsAllowed = false;

          module(($animateProvider) => {
            $animateProvider.customFilter(() => animationsAllowed);
          });

          inject(($animate, $rootScope) => {
            $animate.enter(element, parent);
            $rootScope.$digest();
            expect(capturedAnimation).toBeNull();

            $animate.leave(element, parent);
            $rootScope.$digest();
            expect(capturedAnimation).toBeNull();

            animationsAllowed = true;

            $animate.enter(element, parent);
            $rootScope.$digest();
            expect(capturedAnimation).not.toBeNull();

            capturedAnimation = null;

            $animate.leave(element, parent);
            $rootScope.$digest();
            expect(capturedAnimation).not.toBeNull();
          });
        }
      );

      it('should only perform animations for which the function returns a truthy value (SVG)',
        () => {
          let animationsAllowed = false;

          module(($animateProvider) => {
            $animateProvider.customFilter(() => animationsAllowed);
          });

          inject(($animate, $compile, $rootScope) => {
            const svgElement = $compile('<svg class="element"></svg>')($rootScope);

            $animate.enter(svgElement, parent);
            $rootScope.$digest();
            expect(capturedAnimation).toBeNull();

            $animate.leave(svgElement, parent);
            $rootScope.$digest();
            expect(capturedAnimation).toBeNull();

            animationsAllowed = true;

            $animate.enter(svgElement, parent);
            $rootScope.$digest();
            expect(capturedAnimation).not.toBeNull();

            capturedAnimation = null;

            $animate.leave(svgElement, parent);
            $rootScope.$digest();
            expect(capturedAnimation).not.toBeNull();
          });
        }
      );

      it('should pass the DOM element, event name and options to the filter function', () => {
        const filterFn = jasmine.createSpy('filterFn');
        const options = {};

        module(($animateProvider) => {
          $animateProvider.customFilter(filterFn);
        });

        inject(($animate, $rootScope) => {
          $animate.enter(element, parent, null, options);
          expect(filterFn).toHaveBeenCalledOnceWith(element[0], 'enter', options);

          filterFn.calls.reset();

          $animate.leave(element);
          expect(filterFn).toHaveBeenCalledOnceWith(element[0], 'leave', jasmine.any(Object));
        });
      });

      it('should complete the DOM operation even if filtered out', () => {
        module(($animateProvider) => {
          $animateProvider.customFilter(() => false);
        });

        inject(($animate, $rootScope) => {
          expect(element.parent()[0]).toBeUndefined();

          $animate.enter(element, parent);
          $rootScope.$digest();

          expect(capturedAnimation).toBeNull();
          expect(element.parent()[0]).toBe(parent[0]);

          $animate.leave(element);
          $rootScope.$digest();

          expect(capturedAnimation).toBeNull();
          expect(element.parent()[0]).toBeUndefined();
        });
      });

      it('should not execute the function if animations are globally disabled', () => {
        const customFilterSpy = jasmine.createSpy('customFilterFn');

        module(($animateProvider) => {
          $animateProvider.customFilter(customFilterSpy);
        });

        inject(($animate) => {
          $animate.addClass(element, 'foo');
          expect(customFilterSpy).toHaveBeenCalled();

          customFilterSpy.calls.reset();
          $animate.enabled(false);
          $animate.addClass(element, 'bar');
          expect(customFilterSpy).not.toHaveBeenCalled();

          customFilterSpy.calls.reset();
          $animate.enabled(true);
          $animate.addClass(element, 'baz');
          expect(customFilterSpy).toHaveBeenCalled();
        });
      });
    });

    describe('enabled()', () => {
      it('should work for all animations', inject(($animate) => {

        expect($animate.enabled()).toBe(true);

        expect($animate.enabled(0)).toBe(false);
        expect($animate.enabled()).toBe(false);

        expect($animate.enabled(1)).toBe(true);
        expect($animate.enabled()).toBe(true);
      }));

      it('should fully disable all animations in the application if false',
        inject(($animate, $rootScope) => {

        $animate.enabled(false);

        $animate.enter(element, parent);

        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should disable all animations on the given element',
        inject(($animate, $rootScope) => {

        parent.append(element);

        $animate.enabled(element, false);
        expect($animate.enabled(element)).toBeFalsy();

        $animate.addClass(element, 'red');
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.enabled(element, true);
        expect($animate.enabled(element)).toBeTruthy();

        $animate.addClass(element, 'blue');
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      }));

      it('should disable all animations for a given element\'s children',
        inject(($animate, $rootScope) => {

        $animate.enabled(parent, false);

        $animate.enter(element, parent);
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.enabled(parent, true);

        $animate.enter(element, parent);
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      }));

      it('should run animations on an element and its children if explicitly enabled, even if animations are disabled on the parent',
        inject(($animate, $rootScope) => {

        const child = jqLite('<div></div>');
        element.append(child);
        parent.append(element);

        $animate.enabled(parent, false);

        $animate.addClass(element, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.addClass(child, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.enabled(element, true);

        $animate.addClass(element, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
        capturedAnimation = null;

        $animate.addClass(child, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      }));

      it('should remove the element from the `disabledElementsLookup` map on `$destroy`',
        inject(($animate, $rootScope) => {

        const setSpy = spyOn(Map.prototype, 'set').and.callThrough();
        const deleteSpy = spyOn(Map.prototype, 'delete').and.callThrough();

        parent.append(element);

        $animate.enabled(element, false);
        $animate.enabled(element, true);
        $animate.enabled(element, false);
        expect(setSpy).toHaveBeenCalledWith(element[0], jasmine.any(Boolean));
        expect(deleteSpy).not.toHaveBeenCalledWith(element[0]);
        expect($animate.enabled(element)).toBe(false);

        // No clean-up on `detach` (no `$destroy` event).
        element.detach();
        expect(deleteSpy).not.toHaveBeenCalledWith(element[0]);
        expect($animate.enabled(element)).toBe(false);

        // Clean-up on `remove` (causes `$destroy` event).
        element.remove();
        expect(deleteSpy).toHaveBeenCalledOnceWith(element[0]);
        expect($animate.enabled(element)).toBe(true);

        deleteSpy.calls.reset();

        element.triggerHandler('$destroy');
        expect(deleteSpy).not.toHaveBeenCalledWith(element[0]);

        $animate.enabled(element, true);
        element.triggerHandler('$destroy');
        expect(deleteSpy).toHaveBeenCalledOnceWith(element[0]);
      }));
    });

    it('should strip all comment nodes from the animation and not issue an animation if not real elements are found',
      inject(($rootScope, $compile) => {

      // since the ng-if results to false then only comments will be fed into the animation
      element = $compile(
        '<div><div class="animated" ng-if="false" ng-repeat="item in items"></div></div>'
      )($rootScope);

      parent.append(element);

      $rootScope.items = [1,2,3,4,5];
      $rootScope.$digest();

      expect(capturedAnimation).toBeNull();
    }));

    it('should not attempt to perform an animation on a text node element',
      inject(($rootScope, $animate) => {

      element.html('hello there');
      const textNode = jqLite(element[0].firstChild);

      $animate.addClass(textNode, 'some-class');
      $rootScope.$digest();

      expect(capturedAnimation).toBeNull();
    }));

    it('should not attempt to perform an animation on an empty jqLite collection',
      inject(($rootScope, $animate) => {

        element.html('');
        const emptyNode = jqLite(element[0].firstChild);

        $animate.addClass(emptyNode, 'some-class');
        $rootScope.$digest();

        expect(capturedAnimation).toBeNull();
      })
    );

    it('should perform the leave domOperation if a text node is used',
      inject(($rootScope, $animate) => {

      element.html('hello there');
      const textNode = jqLite(element[0].firstChild);
      const {parentNode} = textNode[0];

      $animate.leave(textNode);
      $rootScope.$digest();
      expect(capturedAnimation).toBeNull();
      expect(textNode[0].parentNode).not.toBe(parentNode);
    }));

    it('should perform the leave domOperation if a comment node is used',
      inject(($rootScope, $animate, $document) => {

      const doc = $document[0];

      element.html('hello there');
      const commentNode = jqLite(doc.createComment('test comment'));
      const parentNode = element[0];
      parentNode.appendChild(commentNode[0]);

      $animate.leave(commentNode);
      $rootScope.$digest();
      expect(capturedAnimation).toBeNull();
      expect(commentNode[0].parentNode).not.toBe(parentNode);
    }));

    it('enter() should animate a transcluded clone with `templateUrl`', () => {
      module(($compileProvider) => {
        $compileProvider.directive('foo', () => ({templateUrl: 'foo.html'}));
      });

      inject(($animate, $compile, $rootScope, $templateCache) => {
        parent.append(jqLite('<foo ng-if="showFoo"></foo>'));
        $templateCache.put('foo.html', '<div>FOO</div>');
        $compile(parent)($rootScope);

        expect(capturedAnimation).toBeNull();

        $rootScope.$apply('showFoo = true');

        expect(parent.text()).toBe('parentFOO');
        expect(capturedAnimation[0].html()).toBe('<div>FOO</div>');
        expect(capturedAnimation[1]).toBe('enter');
      });
    });

    it('enter() should issue an enter animation and fire the DOM operation right away before the animation kicks off', inject(($animate, $rootScope) => {
      expect(parent.children().length).toBe(0);

      options.foo = 'bar';
      $animate.enter(element, parent, null, options);

      expect(parent.children().length).toBe(1);

      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('enter');
      expect(capturedAnimation[2].foo).toEqual(options.foo);
    }));

    it('move() should issue an enter animation and fire the DOM operation right away before the animation kicks off', inject(($animate, $rootScope) => {
      parent.append(element);

      expect(parent.children().length).toBe(1);
      expect(parent2.children().length).toBe(0);

      options.foo = 'bar';
      $animate.move(element, parent2, null, options);

      expect(parent.children().length).toBe(0);
      expect(parent2.children().length).toBe(1);

      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('move');
      expect(capturedAnimation[2].foo).toEqual(options.foo);
    }));

    they('$prop() should insert the element adjacent to the after element if provided',
      ['enter', 'move'], (event) => {

      inject(($animate, $rootScope) => {
        parent.append(element);
        assertCompareNodes(parent2.next(), element, true);
        $animate[event](element, null, parent2, options);
        assertCompareNodes(parent2.next(), element);
        $rootScope.$digest();
        expect(capturedAnimation[1]).toBe(event);
      });
    });

    they('$prop() should append to the parent incase the after element is destroyed before the DOM operation is issued',
      ['enter', 'move'], (event) => {
      inject(($animate, $rootScope) => {
        parent2.remove();
        $animate[event](element, parent, parent2, options);
        expect(parent2.next()).not.toEqual(element);
        $rootScope.$digest();
        expect(capturedAnimation[1]).toBe(event);
      });
    });

    it('leave() should issue a leave animation with the correct DOM operation', inject(($animate, $rootScope) => {
      parent.append(element);
      options.foo = 'bar';
      $animate.leave(element, options);
      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('leave');
      expect(capturedAnimation[2].foo).toEqual(options.foo);

      expect(element.parent().length).toBe(1);
      capturedAnimation[2].domOperation();
      expect(element.parent().length).toBe(0);
    }));

    it('should remove all element and comment nodes during leave animation',
      inject(($compile, $rootScope, $animate, $$AnimateRunner) => {

      element = $compile(
        '<div>' +
        '  <div class="animated" ng-repeat-start="item in items">start</div>' +
        '  <div ng-repeat-end>end</div>' +
        '</div>'
      )($rootScope);

      parent.append(element);

      $rootScope.items = [1,2,3,4,5];
      $rootScope.$digest();

      // all the start/end repeat anchors + their adjacent comments
      expect(element[0].childNodes.length).toBe(22);

      const runner = new $$AnimateRunner();
      overriddenAnimationRunner = runner;

      $rootScope.items.length = 0;
      $rootScope.$digest();
      runner.end();
      $animate.flush();

      // we're left with a text node and a comment node
      expect(element[0].childNodes.length).toBeLessThan(3);
    }));


    it('addClass() should issue an addClass animation with the correct DOM operation', inject(($animate, $rootScope) => {
      parent.append(element);
      options.foo = 'bar';
      $animate.addClass(element, 'red', options);
      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('addClass');
      expect(capturedAnimation[2].foo).toEqual(options.foo);

      expect(element).not.toHaveClass('red');
      applyAnimationClasses(element, capturedAnimation[2]);
      expect(element).toHaveClass('red');
    }));


    it('removeClass() should issue a removeClass animation with the correct DOM operation', inject(($animate, $rootScope) => {
      parent.append(element);
      element.addClass('blue');

      options.foo = 'bar';
      $animate.removeClass(element, 'blue', options);
      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('removeClass');
      expect(capturedAnimation[2].foo).toEqual(options.foo);

      expect(element).toHaveClass('blue');
      applyAnimationClasses(element, capturedAnimation[2]);
      expect(element).not.toHaveClass('blue');
    }));

    it('setClass() should issue a setClass animation with the correct DOM operation', inject(($animate, $rootScope) => {
      parent.append(element);
      element.addClass('green');

      options.foo = 'bar';
      $animate.setClass(element, 'yellow', 'green', options);
      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(element);
      expect(capturedAnimation[1]).toBe('setClass');
      expect(capturedAnimation[2].foo).toEqual(options.foo);

      expect(element).not.toHaveClass('yellow');
      expect(element).toHaveClass('green');
      applyAnimationClasses(element, capturedAnimation[2]);
      expect(element).toHaveClass('yellow');
      expect(element).not.toHaveClass('green');
    }));

    they('$prop() should operate using a native DOM element',
      ['enter', 'move', 'leave', 'addClass', 'removeClass', 'setClass', 'animate'], (event) => {

      inject(($animate, $rootScope, $document) => {
        const element = $document[0].createElement('div');
        element.setAttribute('id', 'crazy-man');
        if (event !== 'enter' && event !== 'move') {
          parent.append(element);
        }

        switch (event) {
          case 'enter':
          case 'move':
            $animate[event](element, parent, parent2, options);
            break;

          case 'addClass':
            $animate.addClass(element, 'klass', options);
            break;

          case 'removeClass':
            element.className = 'klass';
            $animate.removeClass(element, 'klass', options);
            break;

          case 'setClass':
            element.className = 'two';
            $animate.setClass(element, 'one', 'two', options);
            break;

          case 'leave':
            $animate.leave(element, options);
            break;

          case 'animate':
            const toStyles = { color: 'red' };
            $animate.animate(element, {}, toStyles, 'klass', options);
            break;
        }

        $rootScope.$digest();
        expect(capturedAnimation[0].attr('id')).toEqual(element.getAttribute('id'));
      });
    });

    describe('addClass / removeClass', () => {
      it('should not perform an animation if there are no valid CSS classes to add',
        inject(($animate, $rootScope) => {

        parent.append(element);

        $animate.removeClass(element, 'something-to-remove');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        element.addClass('something-to-add');

        $animate.addClass(element, 'something-to-add');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));
    });

    describe('animate()', () => {
      they('should not perform an animation if $prop is provided as a `to` style',
        { '{}': {},
          'null': null,
          'false': false,
          '""': '',
          '[]': [] }, (toStyle) => {

        inject(($animate, $rootScope) => {
          parent.append(element);
          $animate.animate(element, null, toStyle);
          $rootScope.$digest();
          expect(capturedAnimation).toBeNull();
        });
      });

      it('should not perform an animation if only from styles are provided',
        inject(($animate, $rootScope) => {

        const fromStyle = { color: 'pink' };
        parent.append(element);
        $animate.animate(element, fromStyle);
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should perform an animation if only from styles are provided as well as any valid classes',
        inject(($animate, $rootScope) => {

        parent.append(element);

        let fromStyle = { color: 'red' };
        let options = { removeClass: 'goop' };
        $animate.animate(element, fromStyle, null, null, options);
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        fromStyle = { color: 'blue' };
        options = { addClass: 'goop' };
        $animate.animate(element, fromStyle, null, null, options);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
      }));
    });


    describe('$animate.cancel()', () => {

      it('should cancel enter()', inject(($animate, $rootScope) => {
        expect(parent.children().length).toBe(0);

        options.foo = 'bar';
        const spy = jasmine.createSpy('cancelCatch');

        const runner = $animate.enter(element, parent, null, options);

        runner.catch(spy);

        expect(parent.children().length).toBe(1);

        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('enter');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        $animate.cancel(runner);
        // Since enter() immediately adds the element, we can only check if the
        // element is still at the position
        expect(parent.children().length).toBe(1);

        $rootScope.$digest();

        // Catch handler is called after digest
        expect(spy).toHaveBeenCalled();
      }));


      it('should cancel move()', inject(($animate, $rootScope) => {
        parent.append(element);

        expect(parent.children().length).toBe(1);
        expect(parent2.children().length).toBe(0);

        options.foo = 'bar';
        const spy = jasmine.createSpy('cancelCatch');

        const runner = $animate.move(element, parent2, null, options);
        runner.catch(spy);

        expect(parent.children().length).toBe(0);
        expect(parent2.children().length).toBe(1);

        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('move');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        $animate.cancel(runner);
        // Since moves() immediately moves the element, we can only check if the
        // element is still at the correct position
        expect(parent.children().length).toBe(0);
        expect(parent2.children().length).toBe(1);

        $rootScope.$digest();

        // Catch handler is called after digest
        expect(spy).toHaveBeenCalled();
      }));


      it('cancel leave()', inject(($animate, $rootScope) => {
        parent.append(element);
        options.foo = 'bar';
        const spy = jasmine.createSpy('cancelCatch');

        const runner = $animate.leave(element, options);

        runner.catch(spy);
        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('leave');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        expect(element.parent().length).toBe(1);

        $animate.cancel(runner);
        // Animation concludes immediately
        expect(element.parent().length).toBe(0);
        expect(spy).not.toHaveBeenCalled();

        $rootScope.$digest();
        // Catch handler is called after digest
        expect(spy).toHaveBeenCalled();
      }));

      it('should cancel addClass()', inject(($animate, $rootScope) => {
        parent.append(element);
        options.foo = 'bar';
        const runner = $animate.addClass(element, 'red', options);
        const spy = jasmine.createSpy('cancelCatch');

        runner.catch(spy);
        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('addClass');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        $animate.cancel(runner);
        expect(element).toHaveClass('red');
        expect(spy).not.toHaveBeenCalled();

        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      }));


      it('should cancel setClass()', inject(($animate, $rootScope) => {
        parent.append(element);
        element.addClass('red');
        options.foo = 'bar';

        const runner = $animate.setClass(element, 'blue', 'red', options);
        const spy = jasmine.createSpy('cancelCatch');

        runner.catch(spy);
        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('setClass');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        $animate.cancel(runner);
        expect(element).toHaveClass('blue');
        expect(element).not.toHaveClass('red');
        expect(spy).not.toHaveBeenCalled();

        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      }));


      it('should cancel removeClass()', inject(($animate, $rootScope) => {
        parent.append(element);
        element.addClass('red blue');

        options.foo = 'bar';
        const runner = $animate.removeClass(element, 'red', options);
        const spy = jasmine.createSpy('cancelCatch');

        runner.catch(spy);
        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('removeClass');
        expect(capturedAnimation[2].foo).toEqual(options.foo);

        $animate.cancel(runner);
        expect(element).not.toHaveClass('red');
        expect(element).toHaveClass('blue');

        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      }));


      it('should cancel animate()',
        inject(($animate, $rootScope) => {

        parent.append(element);

        const fromStyle = { color: 'blue' };
        const options = { addClass: 'red' };

        const runner = $animate.animate(element, fromStyle, null, null, options);
        const spy = jasmine.createSpy('cancelCatch');

        runner.catch(spy);
        $rootScope.$digest();

        expect(capturedAnimation).toBeTruthy();

        $animate.cancel(runner);
        expect(element).toHaveClass('red');

        $rootScope.$digest();
        expect(spy).toHaveBeenCalled();
      }));
    });


    describe('parent animations', () => {
      they('should not cancel a pre-digest parent class-based animation if a child $prop animation is set to run',
        ['structural', 'class-based'], (animationType) => {

        inject(($rootScope, $animate) => {
          parent.append(element);
          const child = jqLite('<div></div>');

          if (animationType === 'structural') {
            $animate.enter(child, element);
          } else {
            element.append(child);
            $animate.addClass(child, 'test');
          }

          $animate.addClass(parent, 'abc');
          expect(capturedAnimationHistory.length).toBe(0);
          $rootScope.$digest();
          expect(capturedAnimationHistory.length).toBe(2);
        });
      });

      they('should not cancel a post-digest parent class-based animation if a child $prop animation is set to run',
        ['structural', 'class-based'], (animationType) => {

        inject(($rootScope, $animate) => {
          parent.append(element);
          const child = jqLite('<div></div>');

          $animate.addClass(parent, 'abc');
          $rootScope.$digest();

          if (animationType === 'structural') {
            $animate.enter(child, element);
          } else {
            element.append(child);
            $animate.addClass(child, 'test');
          }

          expect(capturedAnimationHistory.length).toBe(1);

          $rootScope.$digest();

          expect(capturedAnimationHistory.length).toBe(2);
        });
      });

      they('should not cancel a post-digest $prop child animation if a class-based parent animation is set to run',
        ['structural', 'class-based'], (animationType) => {

        inject(($rootScope, $animate) => {
          parent.append(element);

          const child = jqLite('<div></div>');
          if (animationType === 'structural') {
            $animate.enter(child, element);
          } else {
            element.append(child);
            $animate.addClass(child, 'test');
          }

          $rootScope.$digest();

          $animate.addClass(parent, 'abc');

          expect(capturedAnimationHistory.length).toBe(1);
          $rootScope.$digest();

          expect(capturedAnimationHistory.length).toBe(2);
        });
      });
    });

    it('should NOT clobber all data on an element when animation is finished',
      inject(($animate, $rootScope) => {

      element.data('foo', 'bar');

      $animate.removeClass(element, 'ng-hide');
      $rootScope.$digest();
      $animate.addClass(element, 'ng-hide');
      $rootScope.$digest();

      expect(element.data('foo')).toEqual('bar');
    }));

    describe('child animations', () => {
      it('should skip animations if the element is not attached to the $rootElement',
        inject(($compile, $rootScope, $animate) => {

        $animate.enabled(true);

        const elm1 = $compile('<div class="animated"></div>')($rootScope);

        expect(capturedAnimation).toBeNull();
        $animate.addClass(elm1, 'klass2');
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should skip animations if the element is attached to the $rootElement, but not apart of the body',
        inject(($compile, $rootScope, $animate, $rootElement) => {

        $animate.enabled(true);

        const elm1 = $compile('<div class="animated"></div>')($rootScope);

        const newParent = $compile('<div></div>')($rootScope);
        newParent.append($rootElement);
        $rootElement.append(elm1);

        expect(capturedAnimation).toBeNull();
        $animate.addClass(elm1, 'klass2');
        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should skip the animation if the element is removed from the DOM before the post digest kicks in',
        inject(($animate, $rootScope) => {

        $animate.enter(element, parent);
        expect(capturedAnimation).toBeNull();

        element.remove();
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should be blocked when there is an ongoing structural parent animation occurring',
        inject(($rootScope, $rootElement, $animate) => {

        parent.append(element);

        expect(capturedAnimation).toBeNull();
        $animate.move(parent, parent2);
        $rootScope.$digest();

        // yes the animation is going on
        expect(capturedAnimation[0]).toBe(parent);
        capturedAnimation = null;

        $animate.addClass(element, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('should disable all child animations for atleast one turn when a structural animation is issued',
        inject(($animate, $rootScope, $compile, $document, $rootElement, $$AnimateRunner) => {

        element = $compile(
          '<div><div class="if-animation" ng-if="items.length">' +
          '  <div class="repeat-animation" ng-repeat="item in items">' +
          '    {{ item }}' +
          '  </div>' +
          '</div></div>'
        )($rootScope);

        jqLite($document[0].body).append($rootElement);
        $rootElement.append(element);

        const runner = new $$AnimateRunner();
        overriddenAnimationRunner = runner;

        $rootScope.items = [1];
        $rootScope.$digest();

        expect(capturedAnimation[0]).toHaveClass('if-animation');
        expect(capturedAnimationHistory.length).toBe(1);
        expect(element[0].querySelectorAll('.repeat-animation').length).toBe(1);

        $rootScope.items = [1, 2];
        $rootScope.$digest();

        expect(capturedAnimation[0]).toHaveClass('if-animation');
        expect(capturedAnimationHistory.length).toBe(1);
        expect(element[0].querySelectorAll('.repeat-animation').length).toBe(2);

        runner.end();
        $animate.flush();

        $rootScope.items = [1, 2, 3];
        $rootScope.$digest();

        expect(capturedAnimation[0]).toHaveClass('repeat-animation');
        expect(capturedAnimationHistory.length).toBe(2);
        expect(element[0].querySelectorAll('.repeat-animation').length).toBe(3);
      }));

      it('should not be blocked when there is an ongoing class-based parent animation occurring',
        inject(($rootScope, $rootElement, $animate) => {

        parent.append(element);

        expect(capturedAnimation).toBeNull();
        $animate.addClass(parent, 'rogers');
        $rootScope.$digest();

        // yes the animation is going on
        expect(capturedAnimation[0]).toBe(parent);
        capturedAnimation = null;

        $animate.addClass(element, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation[0]).toBe(element);
      }));

      describe('when a parent structural animation is triggered:', () => {

        it('should skip all pre-digest queued child animations',
          inject(($rootScope, $rootElement, $animate) => {

          parent.append(element);

          $animate.addClass(element, 'rumlow');
          $animate.move(parent, null, parent2);

          expect(capturedAnimation).toBeNull();
          expect(capturedAnimationHistory.length).toBe(0);
          $rootScope.$digest();

          expect(capturedAnimation[0]).toBe(parent);
          expect(capturedAnimationHistory.length).toBe(1);
        }));

        it('should end all ongoing post-digest child animations',
          inject(($rootScope, $rootElement, $animate) => {

          parent.append(element);

          $animate.addClass(element, 'rumlow');
          let isCancelled = false;
          overriddenAnimationRunner = extend(defaultFakeAnimationRunner, {
            end() {
              isCancelled = true;
            }
          });

          $rootScope.$digest();
          expect(capturedAnimation[0]).toBe(element);
          expect(isCancelled).toBe(false);

          // restore the default
          overriddenAnimationRunner = defaultFakeAnimationRunner;
          $animate.move(parent, null, parent2);
          $rootScope.$digest();
          expect(capturedAnimation[0]).toBe(parent);

          expect(isCancelled).toBe(true);
        }));

        it('should ignore children that have animation data-attributes but no animation data',
          inject(($rootScope, $rootElement, $animate) => {

          parent.append(element);

          $animate.addClass(element, 'rumlow');

          $rootScope.$digest();
          expect(capturedAnimation[0]).toBe(element);

          // If an element is cloned during an animation, the clone has the data-attributes indicating
          // an animation
          const clone = element.clone();
          parent.append(clone);

          $animate.move(parent, null, parent2);
          $rootScope.$digest();
          expect(capturedAnimation[0]).toBe(parent);
        }));
      });

      it('should not end any child animations if a parent class-based animation is issued',
        inject(($rootScope, $rootElement, $animate) => {

        parent.append(element);

        const element2 = jqLite('<div>element2</div>');
        $animate.enter(element2, parent);

        let isCancelled = false;
        overriddenAnimationRunner = extend(defaultFakeAnimationRunner, {
          end() {
            isCancelled = true;
          }
        });

        $rootScope.$digest();
        expect(capturedAnimation[0]).toBe(element2);
        expect(isCancelled).toBe(false);

        // restore the default
        overriddenAnimationRunner = defaultFakeAnimationRunner;
        $animate.addClass(parent, 'peter');
        $rootScope.$digest();
        expect(capturedAnimation[0]).toBe(parent);

        expect(isCancelled).toBe(false);
      }));

      it('should allow follow-up class-based animations to run in parallel on the same element',
        inject(($rootScope, $animate) => {

        parent.append(element);

        let runner1done = false;
        const runner1 = $animate.addClass(element, 'red');
        runner1.done(() => {
          runner1done = true;
        });

        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
        expect(runner1done).toBeFalsy();

        capturedAnimation = null;

        // make sure it's a different runner
        overriddenAnimationRunner = extend(defaultFakeAnimationRunner, {
          end() {
            // this code will still end the animation, just not at any deeper level
          }
        });

        let runner2done = false;
        const runner2 = $animate.addClass(element, 'blue');
        runner2.done(() => {
          runner2done = true;
        });

        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
        expect(runner2done).toBeFalsy();

        expect(runner1done).toBeFalsy();

        runner2.end();

        expect(runner2done).toBeTruthy();
        expect(runner1done).toBeFalsy();
      }));

      it('should remove the animation block on child animations once the parent animation is complete',
        inject(($rootScope, $rootElement, $animate, $$AnimateRunner) => {

        const runner = new $$AnimateRunner();
        overriddenAnimationRunner = runner;
        parent.append(element);

        $animate.enter(parent, null, parent2);
        $rootScope.$digest();
        expect(capturedAnimationHistory.length).toBe(1);

        $animate.addClass(element, 'tony');
        $rootScope.$digest();
        expect(capturedAnimationHistory.length).toBe(1);

        runner.end();
        $animate.flush();

        $animate.addClass(element, 'stark');
        $rootScope.$digest();
        expect(capturedAnimationHistory.length).toBe(2);
      }));
    });

    describe('cancellations', () => {
      it('should cancel the previous animation if a follow-up structural animation takes over',
        inject(($animate, $rootScope) => {

        let enterComplete = false;
        overriddenAnimationRunner = extend(defaultFakeAnimationRunner, {
          end() {
            enterComplete = true;
          }
        });

        parent.append(element);
        $animate.move(element, parent2);

        $rootScope.$digest();
        expect(enterComplete).toBe(false);

        $animate.leave(element);
        $rootScope.$digest();
        expect(enterComplete).toBe(true);
      }));

      it('should cancel the previous structural animation if a follow-up structural animation takes over before the postDigest',
        inject(($animate) => {

        const enterDone = jasmine.createSpy('enter animation done');
        $animate.enter(element, parent).done(enterDone);
        expect(enterDone).not.toHaveBeenCalled();

        $animate.leave(element);
        $animate.flush();
        expect(enterDone).toHaveBeenCalled();
      }));

      it('should cancel the previously running addClass animation if a follow-up removeClass animation is using the same class value',
        inject(($animate, $rootScope) => {

        parent.append(element);
        const runner = $animate.addClass(element, 'active-class');
        $rootScope.$digest();

        const doneHandler = jasmine.createSpy('addClass done');
        runner.done(doneHandler);

        expect(doneHandler).not.toHaveBeenCalled();

        $animate.removeClass(element, 'active-class');
        $rootScope.$digest();

        // true = rejected
        expect(doneHandler).toHaveBeenCalledWith(true);
      }));

      it('should cancel the previously running removeClass animation if a follow-up addClass animation is using the same class value',
        inject(($animate, $rootScope) => {

        element.addClass('active-class');
        parent.append(element);
        const runner = $animate.removeClass(element, 'active-class');
        $rootScope.$digest();

        const doneHandler = jasmine.createSpy('addClass done');
        runner.done(doneHandler);

        expect(doneHandler).not.toHaveBeenCalled();

        $animate.addClass(element, 'active-class');
        $rootScope.$digest();

        // true = rejected
        expect(doneHandler).toHaveBeenCalledWith(true);
      }));

      it('should merge a follow-up animation that does not add classes into the previous animation (pre-digest)',
        inject(($animate, $rootScope) => {

        $animate.enter(element, parent);
        $animate.animate(element, {height: 0}, {height: '100px'});

        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();
        expect(capturedAnimation[1]).toBe('enter'); // make sure the enter animation is present

        // fake the style setting (because $$animation is mocked)
        applyAnimationStyles(element, capturedAnimation[2]);
        expect(element.css('height')).toContain('100px');
      }));

      it('should immediately skip the class-based animation if there is an active structural animation',
        inject(($animate, $rootScope) => {

        $animate.enter(element, parent);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        capturedAnimation = null;
        $animate.addClass(element, 'red');
        expect(element).toHaveClass('red');
      }));

      it('should join the class-based animation into the structural animation if the structural animation is pre-digest',
        inject(($animate, $rootScope) => {

        $animate.enter(element, parent);
        expect(capturedAnimation).toBeNull();

        $animate.addClass(element, 'red');
        expect(element).not.toHaveClass('red');

        expect(capturedAnimation).toBeNull();
        $rootScope.$digest();

        expect(capturedAnimation[1]).toBe('enter');
        expect(capturedAnimation[2].addClass).toBe('red');
      }));

      it('should issue a new runner instance if a previous structural animation was cancelled',
        inject(($animate, $rootScope) => {

        parent.append(element);

        const runner1 = $animate.move(element, parent2);
        $rootScope.$digest();

        const runner2 = $animate.leave(element);
        $rootScope.$digest();

        expect(runner1).not.toBe(runner2);
      }));

      it('should properly cancel out animations when the same class is added/removed within the same digest',
        inject(($animate, $rootScope) => {

        parent.append(element);
        $animate.addClass(element, 'red');
        $animate.removeClass(element, 'red');
        $rootScope.$digest();

        expect(capturedAnimation).toBeNull();

        $animate.addClass(element, 'blue');
        $rootScope.$digest();

        expect(capturedAnimation[2].addClass).toBe('blue');
      }));

      it('should NOT cancel a previously joined addClass+structural animation if a follow-up ' +
        'removeClass animation is using the same class value (pre-digest)',
        inject(($animate, $rootScope) => {

        const runner = $animate.enter(element, parent);
        $animate.addClass(element, 'active-class');

        const doneHandler = jasmine.createSpy('enter done');
        runner.done(doneHandler);

        expect(doneHandler).not.toHaveBeenCalled();

        $animate.removeClass(element, 'active-class');
        $rootScope.$digest();

        expect(capturedAnimation[1]).toBe('enter');
        expect(capturedAnimation[2].addClass).toBe(null);
        expect(capturedAnimation[2].removeClass).toBe(null);

        expect(doneHandler).not.toHaveBeenCalled();
      }));

    });

    describe('should merge', () => {
      it('multiple class-based animations together into one before the digest passes', inject(($animate, $rootScope) => {
        parent.append(element);
        element.addClass('green');

        $animate.addClass(element, 'red');
        $animate.addClass(element, 'blue');
        $animate.removeClass(element, 'green');

        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('setClass');

        options = capturedAnimation[2];
        expect(options.addClass).toEqual('red blue');
        expect(options.removeClass).toEqual('green');

        expect(element).not.toHaveClass('red');
        expect(element).not.toHaveClass('blue');
        expect(element).toHaveClass('green');

        applyAnimationClasses(element, capturedAnimation[2]);

        expect(element).toHaveClass('red');
        expect(element).toHaveClass('blue');
        expect(element).not.toHaveClass('green');
      }));

      it('multiple class-based animations together into a single structural event before the digest passes', inject(($animate, $rootScope) => {
        element.addClass('green');

        expect(element.parent().length).toBe(0);
        $animate.enter(element, parent);
        expect(element.parent().length).toBe(1);

        $animate.addClass(element, 'red');
        $animate.removeClass(element, 'green');

        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('enter');

        options = capturedAnimation[2];
        expect(options.addClass).toEqual('red');
        expect(options.removeClass).toEqual('green');

        expect(element).not.toHaveClass('red');
        expect(element).toHaveClass('green');

        applyAnimationClasses(element, capturedAnimation[2]);

        expect(element).toHaveClass('red');
        expect(element).not.toHaveClass('green');
      }));

      it('should automatically cancel out class-based animations if the element already contains or doesn\'t contain the applied classes',
        inject(($animate, $rootScope) => {

        parent.append(element);
        element.addClass('one three');

        $animate.addClass(element, 'one');
        $animate.addClass(element, 'two');
        $animate.removeClass(element, 'three');
        $animate.removeClass(element, 'four');

        $rootScope.$digest();

        options = capturedAnimation[2];
        expect(options.addClass).toEqual('two');
        expect(options.removeClass).toEqual('three');
      }));

      it('and skip the animation entirely if no class-based animations remain and if there is no structural animation applied',
        inject(($animate, $rootScope) => {

        parent.append(element);
        element.addClass('one three');

        $animate.addClass(element, 'one');
        $animate.removeClass(element, 'four');

        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();
      }));

      it('but not skip the animation if it is a structural animation and if there are no classes to be animated',
        inject(($animate, $rootScope) => {

        element.addClass('one three');

        $animate.addClass(element, 'one');
        $animate.removeClass(element, 'four');
        $animate.enter(element, parent);

        $rootScope.$digest();

        expect(capturedAnimation[1]).toBe('enter');
      }));

      it('class-based animations, however it should also cancel former structural animations in the process',
        inject(($animate, $rootScope) => {

        element.addClass('green lime');

        $animate.enter(element, parent);
        $animate.addClass(element, 'red');
        $animate.removeClass(element, 'green');

        $animate.leave(element);
        $animate.addClass(element, 'pink');
        $animate.removeClass(element, 'lime');

        expect(element).toHaveClass('red');
        expect(element).not.toHaveClass('green');
        expect(element).not.toHaveClass('pink');
        expect(element).toHaveClass('lime');

        $rootScope.$digest();

        expect(capturedAnimation[0]).toBe(element);
        expect(capturedAnimation[1]).toBe('leave');

        // $$hashKey causes comparison issues
        expect(element.parent()[0]).toBe(parent[0]);

        options = capturedAnimation[2];
        expect(options.addClass).toEqual('pink');
        expect(options.removeClass).toEqual('lime');
      }));

      it('should retain the instance to the very first runner object when multiple element-level animations are issued',
        inject(($animate, $rootScope) => {

        element.addClass('green');

        const r1 = $animate.enter(element, parent);
        const r2 = $animate.addClass(element, 'red');
        const r3 = $animate.removeClass(element, 'green');

        expect(r1).toBe(r2);
        expect(r2).toBe(r3);
      }));

      it('should not skip or miss the animations when animations are executed sequential',
        inject(($animate, $rootScope, $rootElement) => {

        element = jqLite('<div></div>');

        $rootElement.append(element);

        $animate.addClass(element, 'rclass');
        $animate.removeClass(element, 'rclass');
        $animate.addClass(element, 'rclass');
        $animate.removeClass(element, 'rclass');

        $rootScope.$digest();
        expect(element).not.toHaveClass('rclass');
      }));
    });
  });

  they('should allow an animation to run on the $prop element', ['$rootElement', 'body'], (name) => {
    let capturedAnimation;

    module(($provide) => {
      $provide.factory('$rootElement', ($document) => jqLite($document[0].querySelector('html')));
      $provide.factory('$$animation', ($$AnimateRunner) => function(element, method, options) {
          capturedAnimation = arguments;
          return new $$AnimateRunner();
        });
    });
    inject(($animate, $rootScope, $document, $rootElement) => {
      $animate.enabled(true);

      const body = jqLite($document[0].body);
      const targetElement = name === 'body' ? body : $rootElement;

      $animate.addClass(targetElement, 'red');
      $rootScope.$digest();

      expect(capturedAnimation[0]).toBe(targetElement);
      expect(capturedAnimation[1]).toBe('addClass');
    });
  });

  describe('[ng-animate-children]', () => {
    let parent; let element; let child; let capturedAnimation; let captureLog;
    beforeEach(module(($provide) => {
      capturedAnimation = null;
      captureLog = [];
      $provide.factory('$$animation', ($$AnimateRunner) => function(element, method, options) {
          options.domOperation();
          captureLog.push(capturedAnimation = arguments);
          return new $$AnimateRunner();
        });
      return function($rootElement, $document, $animate) {
        jqLite($document[0].body).append($rootElement);
        parent  = jqLite('<div class="parent"></div>');
        element = jqLite('<div class="element"></div>');
        child   = jqLite('<div class="child"></div>');
        $animate.enabled(true);
      };
    }));

    it('should allow child animations to run when the attribute is used',
      inject(($animate, $rootScope, $rootElement, $compile) => {

      $animate.enter(parent, $rootElement);
      $animate.enter(element, parent);
      $animate.enter(child, element);
      $rootScope.$digest();
      expect(captureLog.length).toBe(1);

      captureLog = [];

      parent.attr('ng-animate-children', '');
      $compile(parent)($rootScope);
      $rootScope.$digest();

      $animate.enter(parent, $rootElement);
      $rootScope.$digest();
      expect(captureLog.length).toBe(1);

      $animate.enter(element, parent);
      $animate.enter(child, element);
      $rootScope.$digest();
      expect(captureLog.length).toBe(3);
    }));

    it('should fully disallow all parallel child animations from running if `off` is used',
      inject(($animate, $rootScope, $rootElement, $compile) => {

      $rootElement.append(parent);
      parent.append(element);
      element.append(child);

      parent.attr('ng-animate-children', 'off');
      element.attr('ng-animate-children', 'on');

      $compile(parent)($rootScope);
      $compile(element)($rootScope);
      $rootScope.$digest();

      $animate.leave(parent);
      $animate.leave(element);
      $animate.leave(child);
      $rootScope.$digest();

      expect(captureLog.length).toBe(1);

      dealoc(element);
      dealoc(child);
    }));

    it('should watch to see if the ng-animate-children attribute changes',
      inject(($animate, $rootScope, $rootElement, $compile) => {

      $rootElement.append(parent);
      $rootScope.val = 'on';
      parent.attr('ng-animate-children', '{{ val }}');
      $compile(parent)($rootScope);
      $rootScope.$digest();

      $animate.enter(parent, $rootElement);
      $animate.enter(element, parent);
      $animate.enter(child, element);
      $rootScope.$digest();
      expect(captureLog.length).toBe(3);

      captureLog = [];

      $rootScope.val = 'off';
      $rootScope.$digest();

      $animate.leave(parent);
      $animate.leave(element);
      $animate.leave(child);
      $rootScope.$digest();

      expect(captureLog.length).toBe(1);

      dealoc(element);
      dealoc(child);
    }));

    it('should respect the value if the directive is on an element with ngIf',
      inject(($rootScope, $rootElement, $compile) => {

      parent.attr('ng-animate-children', 'true');
      parent.attr('ng-if', 'true');
      element.attr('ng-if', 'true');

      $rootElement.append(parent);
      parent.append(element);

      $compile(parent)($rootScope);
      $rootScope.$digest();

      expect(captureLog.length).toBe(2);
    }));
  });

  describe('.pin()', () => {
    let capturedAnimation;

    beforeEach(module(($provide) => {
      capturedAnimation = null;
      $provide.factory('$$animation', ($$AnimateRunner) => function() {
          capturedAnimation = arguments;
          return new $$AnimateRunner();
        });

      return function($animate) {
        $animate.enabled(true);
      };
    }));

    it('should throw if the arguments are not elements',
      inject(($animate, $rootElement) => {

      const element = jqLite('<div></div>');

      expect(() => {
        $animate.pin(element);
      }).toThrowMinErr('ng', 'areq', 'Argument \'parentElement\' is not an element');

      expect(() => {
        $animate.pin(null, $rootElement);
      }).toThrowMinErr('ng', 'areq', 'Argument \'element\' is not an element');

      dealoc(element);
    }));


    they('should animate an element inside a pinned element that is the $prop element',
      ['same', 'parent', 'grandparent'],
      (elementRelation) => {
        inject(($animate, $document, $rootElement, $rootScope) => {

        let pinElement; let animateElement;

        const innerParent = jqLite('<div></div>');
        jqLite($document[0].body).append(innerParent);
        innerParent.append($rootElement);

        switch (elementRelation) {
          case 'same':
            pinElement = jqLite('<div id="animate"></div>');
            break;
          case 'parent':
            pinElement = jqLite('<div><div id="animate"></div></div>');
            break;
          case 'grandparent':
            pinElement = jqLite('<div><div><div id="animate"></div></div></div>');
            break;
        }

        jqLite($document[0].body).append(pinElement);
        animateElement = jqLite($document[0].getElementById('animate'));

        $animate.addClass(animateElement, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        // Pin the element to the app root to enable animations
        $animate.pin(pinElement, $rootElement);

        $animate.addClass(animateElement, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        dealoc(pinElement);
      });
    });

    they('should not animate an element when the pinned ($prop) element, is pinned to an element that is not a child of the $rootElement',
      ['same', 'parent', 'grandparent'],
      (elementRelation) => {
        inject(($animate, $document, $rootElement, $rootScope) => {

        let pinElement; let animateElement; const pinTargetElement = jqLite('<div></div>');

        const innerParent = jqLite('<div></div>');
        jqLite($document[0].body).append(innerParent);
        innerParent.append($rootElement);

        switch (elementRelation) {
          case 'same':
            pinElement = jqLite('<div id="animate"></div>');
            break;
          case 'parent':
            pinElement = jqLite('<div><div id="animate"></div></div>');
            break;
          case 'grandparent':
            pinElement = jqLite('<div><div><div id="animate"></div></div></div>');
            break;
        }

        // Append both the pin element and the pinTargetElement outside the app root
        jqLite($document[0].body).append(pinElement);
        jqLite($document[0].body).append(pinTargetElement);

        animateElement = jqLite($document[0].getElementById('animate'));

        $animate.addClass(animateElement, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.pin(pinElement, pinTargetElement);

        $animate.addClass(animateElement, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        dealoc(pinElement);
      });
    });

    they('should adhere to the disabled state of the hosted parent when the $prop element is pinned',
      ['same', 'parent', 'grandparent'],
      (elementRelation) => {
        inject(($animate, $document, $rootElement, $rootScope) => {

        let pinElement; let animateElement; const pinHostElement = jqLite('<div></div>');

        const innerParent = jqLite('<div></div>');
        jqLite($document[0].body).append(innerParent);
        innerParent.append($rootElement);

        switch (elementRelation) {
          case 'same':
            pinElement = jqLite('<div id="animate"></div>');
            break;
          case 'parent':
            pinElement = jqLite('<div><div id="animate"></div></div>');
            break;
          case 'grandparent':
            pinElement = jqLite('<div><div><div id="animate"></div></div></div>');
            break;
        }

        $rootElement.append(pinHostElement);
        jqLite($document[0].body).append(pinElement);
        animateElement = jqLite($document[0].getElementById('animate'));

        $animate.pin(pinElement, pinHostElement);
        $animate.enabled(pinHostElement, false);

        $animate.addClass(animateElement, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeNull();

        $animate.enabled(pinHostElement, true);

        $animate.addClass(animateElement, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        dealoc(pinElement);
      });
    });
  });

  describe('callbacks', () => {
    const captureLog = [];
    let capturedAnimation = [];
    let runner;
    let body;
    beforeEach(module(($provide) => {
      runner = null;
      capturedAnimation = null;
      $provide.factory('$$animation', ($$AnimateRunner) => function() {
          captureLog.push(capturedAnimation = arguments);
          runner = new $$AnimateRunner();
          return runner;
        });

      return function($document, $rootElement, $animate) {
        if ($document !== $rootElement) {
          jqLite($document[0].body).append($rootElement);
        }
        $animate.enabled(true);
      };
    }));

    it('should trigger a callback for an enter animation',
      inject(($animate, $rootScope, $rootElement, $document) => {

      let callbackTriggered = false;
      $animate.on('enter', jqLite($document[0].body), () => {
        callbackTriggered = true;
      });

      element = jqLite('<div></div>');
      $animate.enter(element, $rootElement);
      $rootScope.$digest();

      $animate.flush();

      expect(callbackTriggered).toBe(true);
    }));

    it('should fire the callback with the signature of (element, phase, data)',
      inject(($animate, $rootScope, $rootElement, $document) => {

      let capturedElement;
      let capturedPhase;
      let capturedData;
      $animate.on('enter', jqLite($document[0].body),
        (element, phase, data) => {

        capturedElement = element;
        capturedPhase = phase;
        capturedData = data;
      });

      element = jqLite('<div></div>');
      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(capturedElement).toBe(element);
      expect(isString(capturedPhase)).toBe(true);
      expect(isObject(capturedData)).toBe(true);
    }));

    it('should not fire a callback if the element is outside of the given container',
      inject(($animate, $rootScope, $rootElement) => {

      let callbackTriggered = false;
      const innerContainer = jqLite('<div></div>');
      $rootElement.append(innerContainer);

      $animate.on('enter', innerContainer,
        (element, phase, data) => {

        callbackTriggered = true;
      });

      element = jqLite('<div></div>');
      $animate.enter(element, $rootElement);
      $rootScope.$digest();

      expect(callbackTriggered).toBe(false);
    }));

    it('should fire a callback if the element is the given container',
      inject(($animate, $rootScope, $rootElement) => {

      element = jqLite('<div></div>');

      let callbackTriggered = false;
      $animate.on('enter', element,
        (element, phase, data) => {

        callbackTriggered = true;
      });

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(callbackTriggered).toBe(true);
    }));

    it('should remove all the event-based event listeners when $animate.off(event) is called',
      inject(($animate, $rootScope, $rootElement, $document) => {

      element = jqLite('<div></div>');

      let count = 0;
      $animate.on('enter', element, counter);
      $animate.on('enter', jqLite($document[0].body), counter);

      function counter(element, phase) {
        count++;
      }

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(2);

      $animate.off('enter');

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(2);
    }));

    it('should remove the container-based event listeners when $animate.off(event, container) is called',
      inject(($animate, $rootScope, $rootElement, $document) => {

      element = jqLite('<div></div>');

      let count = 0;
      $animate.on('enter', element, counter);
      $animate.on('enter', jqLite($document[0].body), counter);

      function counter(element, phase) {
        if (phase === 'start') {
          count++;
        }
      }

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(2);

      $animate.off('enter', jqLite($document[0].body));

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(3);
    }));

    it('should remove the callback-based event listener when $animate.off(event, container, callback) is called',
      inject(($animate, $rootScope, $rootElement) => {

      element = jqLite('<div></div>');

      let count = 0;
      $animate.on('enter', element, counter1);
      $animate.on('enter', element, counter2);

      function counter1(element, phase) {
        if (phase === 'start') {
          count++;
        }
      }

      function counter2(element, phase) {
        if (phase === 'start') {
          count++;
        }
      }

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(2);

      $animate.off('enter', element, counter2);

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(count).toBe(3);
    }));

    it('should remove all event listeners for an element when $animate.off(element) is called',
      inject(($animate, $rootScope, $rootElement, $document, $$rAF) => {

      element = jqLite('<div></div>');
      const otherElement = jqLite('<div></div>');
      $rootElement.append(otherElement);

      let count = 0;
      let runner;
      $animate.on('enter', element, counter);
      $animate.on('leave', element, counter);
      $animate.on('addClass', element, counter);
      $animate.on('addClass', otherElement, counter);

      function counter(element, phase) {
        count++;
      }

      runner = $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();
      runner.end();

      runner = $animate.addClass(element, 'blue');
      $rootScope.$digest();
      $animate.flush();

      runner.end();
      $$rAF.flush();

      expect(count).toBe(4);

      $animate.off(element);

      runner = $animate.enter(element, $rootElement);
      $animate.flush();
      expect(capturedAnimation[1]).toBe('enter');
      runner.end();

      runner = $animate.addClass(element, 'red');
      $animate.flush();
      expect(capturedAnimation[1]).toBe('addClass');
      runner.end();

      runner = $animate.leave(element);
      $animate.flush();
      expect(capturedAnimation[1]).toBe('leave');
      runner.end();

      // Try to flush all remaining callbacks
      expect(() => {
        $$rAF.flush();
      }).toThrowError('No rAF callbacks present');

      expect(count).toBe(4);

      // Check that other elements' event listeners are not affected
      $animate.addClass(otherElement, 'green');
      $animate.flush();
      expect(count).toBe(5);
    }));

    it('should not get affected by custom, enumerable properties on `Object.prototype`',
      inject(($animate) => {
        // eslint-disable-next-line no-extend-native
        Object.prototype.foo = 'ENUMARABLE_AND_NOT_AN_ARRAY';

        element = jqLite('<div></div>');
        expect(() => { $animate.off(element); }).not.toThrow();

        delete Object.prototype.foo;
      })
    );

    it('should fire a `start` callback when the animation starts with the matching element',
      inject(($animate, $rootScope, $rootElement, $document) => {

      element = jqLite('<div></div>');

      let capturedState;
      let capturedElement;
      $animate.on('enter', jqLite($document[0].body), (element, phase) => {
        capturedState = phase;
        capturedElement = element;
      });

      $animate.enter(element, $rootElement);
      $rootScope.$digest();
      $animate.flush();

      expect(capturedState).toBe('start');
      expect(capturedElement).toBe(element);
    }));

    it('should fire a `close` callback when the animation ends with the matching element',
      inject(($animate, $rootScope, $rootElement, $document) => {

      element = jqLite('<div></div>');

      let capturedState;
      let capturedElement;
      $animate.on('enter', jqLite($document[0].body), (element, phase) => {
        capturedState = phase;
        capturedElement = element;
      });

      const runner = $animate.enter(element, $rootElement);
      $rootScope.$digest();
      runner.end();
      $animate.flush();

      expect(capturedState).toBe('close');
      expect(capturedElement).toBe(element);
    }));


    they('should remove all event listeners when the element is removed via $prop',
      ['leave()', 'remove()'], (method) => {
      inject(($animate, $rootScope, $rootElement, $$rAF) => {

        element = jqLite('<div></div>');

        let count = 0;
        const enterSpy = jasmine.createSpy();
        const addClassSpy = jasmine.createSpy();
        let runner;

        $animate.on('enter', element, enterSpy);
        $animate.on('addClass', element[0], addClassSpy);

        function counter(element, phase) {
          if (phase === 'start') {
            count++;
          }
        }

        runner = $animate.enter(element, $rootElement);
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        $animate.flush();
        expect(enterSpy.calls.count()).toBe(1);
        expect(enterSpy.calls.mostRecent().args[1]).toBe('start');

        runner.end(); // Otherwise the class animation won't run because enter is still in progress
        $$rAF.flush();
        expect(enterSpy.calls.count()).toBe(2);
        expect(enterSpy.calls.mostRecent().args[1]).toBe('close');

        enterSpy.calls.reset();
        capturedAnimation = null;

        runner = $animate.addClass(element, 'blue');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        $animate.flush();
        expect(addClassSpy.calls.count()).toBe(1);
        expect(addClassSpy.calls.mostRecent().args[1]).toBe('start');

        runner.end();
        $$rAF.flush();
        expect(addClassSpy.calls.count()).toBe(2);
        expect(addClassSpy.calls.mostRecent().args[1]).toBe('close');

        addClassSpy.calls.reset();
        capturedAnimation = null;

        if (method === 'leave()') {
          runner = $animate.leave(element);
          $animate.flush();
          runner.end();
        } else if (method === 'remove()') {
          element.remove();
        }

        runner = $animate.enter(element, $rootElement);
        $rootScope.$digest();

        $animate.flush();
        expect(enterSpy.calls.count()).toBe(0);

        runner.end(); // Otherwise the class animation won't run because enter is still in progress
        expect(() => {
          $$rAF.flush();
        }).toThrowError('No rAF callbacks present'); // Try to flush any callbacks
        expect(enterSpy.calls.count()).toBe(0);

        capturedAnimation = null;

        $animate.addClass(element, 'red');
        $rootScope.$digest();
        expect(capturedAnimation).toBeTruthy();

        $animate.flush();
        expect(addClassSpy.calls.count()).toBe(0);

        runner.end();
        expect(() => {
          $$rAF.flush();
        }).toThrowError('No rAF callbacks present'); // Try to flush any callbacks
        expect(addClassSpy.calls.count()).toBe(0);
        expect(enterSpy.calls.count()).toBe(0);
      });
    });

    it('should always detect registered callbacks after one postDigest has fired',
      inject(($animate, $rootScope, $rootElement) => {

      element = jqLite('<div></div>');

      const spy = jasmine.createSpy();
      registerCallback();

      const runner = $animate.enter(element, $rootElement);
      registerCallback();

      $rootScope.$digest();
      registerCallback();

      expect(spy).not.toHaveBeenCalled();
      $animate.flush();

      // this is not 3 since the 3rd callback
      // was added after the first callback
      // was fired
      expect(spy).toHaveBeenCalledTimes(2);

      spy.calls.reset();
      runner.end();

      $animate.flush();

      // now we expect all three callbacks
      // to fire when the animation ends since
      // the callback detection happens again
      expect(spy).toHaveBeenCalledTimes(3);

      function registerCallback() {
        $animate.on('enter', element, spy);
      }
    }));

    it('should use RAF if there are detected callbacks within the hierarchy of the element being animated',
      inject(($animate, $rootScope, $rootElement, $$rAF) => {

      let runner;

      element = jqLite('<div></div>');
      runner = $animate.enter(element, $rootElement);
      $rootScope.$digest();
      runner.end();

      assertRAFsUsed(false);

      const spy = jasmine.createSpy();
      $animate.on('leave', element, spy);

      runner = $animate.leave(element, $rootElement);
      $rootScope.$digest();
      runner.end();

      assertRAFsUsed(true);

      function assertRAFsUsed(bool) {
        expect($$rAF.queue.length)[bool ? 'toBeGreaterThan' : 'toBe'](0);
      }
    }));

    describe('for leave', () => {

      it('should remove the element even if another animation is called afterwards',
        inject(($animate, $rootScope, $rootElement) => {

        const outerContainer = jqLite('<div></div>');
        element = jqLite('<div></div>');
        outerContainer.append(element);
        $rootElement.append(outerContainer);

        const runner = $animate.leave(element, $rootElement);
        $animate.removeClass(element,'rclass');
        $rootScope.$digest();
        runner.end();
        $animate.flush();

        const isElementRemoved = !outerContainer[0].contains(element[0]);
        expect(isElementRemoved).toBe(true);
      }));

      they('should trigger callbacks when the listener is on the $prop element', ['same', 'parent'],
        (elementRelation) => {
          inject(($animate, $rootScope, $$rAF, $rootElement, $document) => {
            let listenerElement; const callbackSpy = jasmine.createSpy();

            element = jqLite('<div></div>');
            listenerElement = elementRelation === 'same' ? element : jqLite($document[0].body);
            $animate.on('leave', listenerElement, callbackSpy);
            $rootElement.append(element);
            const runner = $animate.leave(element, $rootElement);
            $rootScope.$digest();

            $$rAF.flush();

            expect(callbackSpy.calls.count()).toBe(1);
            expect(callbackSpy.calls.mostRecent().args[1]).toBe('start');
            callbackSpy.calls.reset();

            runner.end();
            $$rAF.flush();

            expect(callbackSpy.calls.count()).toBe(1);
            expect(callbackSpy.calls.mostRecent().args[1]).toBe('close');
          });
        }
      );

      it('should trigger callbacks for a leave animation',
        inject(($animate, $rootScope, $$rAF, $rootElement, $document) => {

        const callbackSpy = jasmine.createSpy();
        $animate.on('leave', jqLite($document[0].body), callbackSpy);

        element = jqLite('<div></div>');
        $rootElement.append(element);
        $animate.leave(element, $rootElement);
        $rootScope.$digest();

        $$rAF.flush();

        expect(callbackSpy).toHaveBeenCalled();
        expect(callbackSpy.calls.count()).toBe(1);
      }));

      it('should trigger a callback for an leave animation (same element)',
        inject(($animate, $rootScope, $$rAF, $rootElement, $document) => {

        const callbackSpy = jasmine.createSpy();

        element = jqLite('<div></div>');
        $animate.on('leave', element, callbackSpy);
        $rootElement.append(element);
        const runner = $animate.leave(element, $rootElement);
        $rootScope.$digest();

        $$rAF.flush();

        expect(callbackSpy.calls.count()).toBe(1);
        expect(callbackSpy.calls.mostRecent().args[1]).toBe('start');
        callbackSpy.calls.reset();

        runner.end();
        $$rAF.flush();

        expect(callbackSpy.calls.count()).toBe(1);
        expect(callbackSpy.calls.mostRecent().args[1]).toBe('close');
      }));

      it('should not fire a callback if the element is outside of the given container',
        inject(($animate, $rootScope, $$rAF, $rootElement) => {

        let callbackTriggered = false;
        const innerContainer = jqLite('<div></div>');
        $rootElement.append(innerContainer);

        $animate.on('leave', innerContainer,
          (element, phase, data) => {
          callbackTriggered = true;
        });

        element = jqLite('<div></div>');
        $rootElement.append(element);
        $animate.leave(element, $rootElement);
        $rootScope.$digest();

        expect(callbackTriggered).toBe(false);
      }));

      it('should fire a `start` callback when the animation starts',
        inject(($animate, $rootScope, $$rAF, $rootElement, $document) => {

        element = jqLite('<div></div>');

        let capturedState;
        let capturedElement;
        $animate.on('leave', jqLite($document[0].body), (element, phase) => {
          capturedState = phase;
          capturedElement = element;
        });

        $rootElement.append(element);
        $animate.leave(element, $rootElement);
        $rootScope.$digest();
        $$rAF.flush();

        expect(capturedState).toBe('start');
        expect(capturedElement).toBe(element);
      }));

      it('should fire a `close` callback when the animation ends',
        inject(($animate, $rootScope, $$rAF, $rootElement, $document) => {

        element = jqLite('<div></div>');

        let capturedState;
        let capturedElement;
        $animate.on('leave', jqLite($document[0].body), (element, phase) => {
          capturedState = phase;
          capturedElement = element;
        });

        $rootElement.append(element);
        const runner = $animate.leave(element, $rootElement);
        $rootScope.$digest();
        runner.end();
        $$rAF.flush();

        expect(capturedState).toBe('close');
        expect(capturedElement).toBe(element);
      }));

      it('should remove all event listeners after all callbacks for the "leave:close" phase have been called',
        inject(($animate, $rootScope, $rootElement, $$rAF) => {

        const leaveSpy = jasmine.createSpy();
        const addClassSpy = jasmine.createSpy();

        element = jqLite('<div></div>');
        $animate.on('leave', element, leaveSpy);
        $animate.on('addClass', element, addClassSpy);
        $rootElement.append(element);
        const runner = $animate.leave(element, $rootElement);
        $animate.flush();

        runner.end();
        $$rAF.flush();

        expect(leaveSpy.calls.mostRecent().args[1]).toBe('close');

        $animate.addClass(element, 'blue');

        $animate.flush();
        runner.end();
        expect(() => {
          $$rAF.flush();
        }).toThrowError('No rAF callbacks present');

        expect(addClassSpy.calls.count()).toBe(0);
      }));

    });

    describe('event data', () => {

      it('should be included for enter',
        inject(($animate, $rootScope, $rootElement, $document) => {
          let eventData;

          $animate.on('enter', jqLite($document[0].body), (element, phase, data) => {
            eventData = data;
          });

          element = jqLite('<div></div>');
          $animate.enter(element, $rootElement, null, {
            addClass: 'red blue',
            removeClass: 'yellow green',
            from: {opacity: 0},
            to: {opacity: 1}
          });
          $rootScope.$digest();

          $animate.flush();

          expect(eventData).toEqual({
            addClass: 'red blue',
            removeClass: null,
            from: {opacity: 0},
            to: {opacity: 1}
          });
      }));


      it('should be included for leave',
        inject(($animate, $rootScope, $rootElement, $document) => {
          let eventData;

          $animate.on('leave', jqLite($document[0].body), (element, phase, data) => {
            eventData = data;
          });

          const outerContainer = jqLite('<div></div>');
          element = jqLite('<div></div>');
          outerContainer.append(element);
          $rootElement.append(outerContainer);

          $animate.leave(element, {
            addClass: 'red blue',
            removeClass: 'yellow green',
            from: {opacity: 0},
            to: {opacity: 1}
          });

          $animate.flush();

          expect(eventData).toEqual({
            addClass: 'red blue',
            removeClass: null,
            from: {opacity: 0},
            to: {opacity: 1}
          });
        })
      );


      it('should be included for move',
        inject(($animate, $rootScope, $rootElement, $document) => {
          let eventData;

          $animate.on('move', jqLite($document[0].body), (element, phase, data) => {
            eventData = data;
          });

          const parent = jqLite('<div></div>');
          const parent2 = jqLite('<div></div>');
          element = jqLite('<div></div>');
          parent.append(element);
          $rootElement.append(parent);
          $rootElement.append(parent2);

          $animate.move(element, parent2, null, {
            addClass: 'red blue',
            removeClass: 'yellow green',
            from: {opacity: 0},
            to: {opacity: 1}
          });

          $animate.flush();

          expect(eventData).toEqual({
            addClass: 'red blue',
            removeClass: null,
            from: {opacity: 0},
            to: {opacity: 1}
          });
        })
      );


      it('should be included for addClass', inject(($animate, $rootElement) => {
        let eventData;

        element = jqLite('<div class="purple"></div>');
        $animate.on('addClass', element, (element, phase, data) => {
          eventData = data;
        });

        $rootElement.append(element);
        $animate.addClass(element, 'red blue', {
          from: {opacity: 0},
          to: {opacity: 1}
        });
        $animate.flush();

        expect(eventData).toEqual({
          addClass: 'red blue',
          removeClass: null,
          from: {opacity: 0},
          to: {opacity: 1}
        });
      }));


      it('should be included for removeClass', inject(($animate, $rootElement) => {
        let eventData;

        element = jqLite('<div class="red blue purple"></div>');
        $animate.on('removeClass', element, (element, phase, data) => {
          eventData = data;
        });

        $rootElement.append(element);
        $animate.removeClass(element, 'red blue', {
          from: {opacity: 0},
          to: {opacity: 1}
        });
        $animate.flush();

        expect(eventData).toEqual({
          removeClass: 'red blue',
          addClass: null,
          from: {opacity: 0},
          to: {opacity: 1}
        });
      }));


      it('should be included for setClass', inject(($animate, $rootElement) => {
        let eventData;

        element = jqLite('<div class="yellow green purple"></div>');

        $animate.on('setClass', element, (element, phase, data) => {

          eventData = data;
        });

        $rootElement.append(element);
        $animate.setClass(element, 'red blue', 'yellow green', {
          from: {opacity: 0},
          to: {opacity: 1}
        });
        $animate.flush();

        expect(eventData).toEqual({
          addClass: 'red blue',
          removeClass: 'yellow green',
          from: {opacity: 0},
          to: {opacity: 1}
        });
      }));

      it('should be included for animate', inject(($animate, $rootElement) => {
        // The event for animate changes to 'setClass' if both addClass and removeClass
        // are definded, because the operations are merged. However, it is still 'animate'
        // and not 'addClass' if only 'addClass' is defined.
        // Ideally, we would make this consistent, but it's a BC
        let eventData; let eventName;

        element = jqLite('<div class="yellow green purple"></div>');

        $animate.on('setClass', element, (element, phase, data) => {
          eventData = data;
          eventName = 'setClass';
        });

        $animate.on('animate', element, (element, phase, data) => {
          eventData = data;
          eventName = 'animate';
        });

        $rootElement.append(element);
        let runner = $animate.animate(element, {opacity: 0}, {opacity: 1}, null, {
          addClass: 'red blue',
          removeClass: 'yellow green'
        });
        $animate.flush();
        runner.end();

        expect(eventName).toBe('setClass');
        expect(eventData).toEqual({
          addClass: 'red blue',
          removeClass: 'yellow green',
          from: {opacity: 0},
          to: {opacity: 1}
        });

        eventData = eventName = null;
        runner = $animate.animate(element, {opacity: 0}, {opacity: 1}, null, {
          addClass: 'yellow green'
        });

        $animate.flush();
        runner.end();

        expect(eventName).toBe('animate');
        expect(eventData).toEqual({
          addClass: 'yellow green',
          removeClass: null,
          from: {opacity: 0},
          to: {opacity: 1}
        });

        eventData = eventName = null;
        runner = $animate.animate(element, {opacity: 0}, {opacity: 1}, null, {
          removeClass: 'yellow green'
        });

        $animate.flush();
        runner.end();

        expect(eventName).toBe('animate');
        expect(eventData).toEqual({
          addClass: null,
          removeClass: 'yellow green',
          from: {opacity: 0},
          to: {opacity: 1}
        });
      }));
    });

    they('should trigger a callback for a $prop animation if the listener is on the document',
      ['enter', 'leave'], ($event) => {
        module(($provide) => {
          $provide.factory('$rootElement', ($document) => 
            // Since we listen on document, $document must be the $rootElement for animations to work
             $document
          );
        });

        inject(($animate, $rootScope, $document) => {

          let callbackTriggered = false;

          $animate.on($event, $document[0], () => {
            callbackTriggered = true;
          });

          const container = jqLite('<div></div>');
          jqLite($document[0].body).append(container);
          element = jqLite('<div></div>');

          if ($event === 'leave') {
            container.append(element);
          }

          $animate[$event](element, container);
          $rootScope.$digest();

          $animate.flush();

          expect(callbackTriggered).toBe(true);
        });
    });

    describe('when animations are skipped, disabled, or invalid', () => {

      let overriddenAnimationRunner;
      let capturedAnimation;
      let capturedAnimationHistory;
      let defaultFakeAnimationRunner;
      let parent;
      let parent2;

      beforeEach(module(($provide) => {
        overriddenAnimationRunner = null;
        capturedAnimation = null;
        capturedAnimationHistory = [];

        $provide.value('$$animation', function() {
          capturedAnimationHistory.push(capturedAnimation = arguments);
          return overriddenAnimationRunner || defaultFakeAnimationRunner;
        });

        return function($rootElement, $q, $animate, $$AnimateRunner, $document) {
          defaultFakeAnimationRunner = new $$AnimateRunner();

          element = jqLite('<div class="element">element</div>');
          parent = jqLite('<div class="parent1">parent</div>');
          parent2 = jqLite('<div class="parent2">parent</div>');

          $rootElement.append(parent);
          $rootElement.append(parent2);
        };
      }));


      it('should trigger all callbacks if a follow-up structural animation takes over a running animation',
        inject(($animate, $rootScope) => {

        parent.append(element);
        const moveSpy = jasmine.createSpy();
        const leaveSpy = jasmine.createSpy();

        $animate.on('move', parent2, moveSpy);
        $animate.on('leave', parent2, leaveSpy);

        $animate.move(element, parent2);

        $rootScope.$digest();
        $animate.flush();

        expect(moveSpy.calls.count()).toBe(1);
        expect(moveSpy.calls.mostRecent().args[1]).toBe('start');

        $animate.leave(element);
        $rootScope.$digest();
        $animate.flush();

        expect(moveSpy.calls.count()).toBe(2);
        expect(moveSpy.calls.mostRecent().args[1]).toBe('close');

        expect(leaveSpy.calls.count()).toBe(2);
        expect(leaveSpy.calls.argsFor(0)[1]).toBe('start');
        expect(leaveSpy.calls.argsFor(1)[1]).toBe('close');
      }));


      it('should not trigger callbacks for the previous structural animation if a follow-up structural animation takes over before the postDigest',
        inject(($animate, $rootScope) => {

        const enterDone = jasmine.createSpy('enter animation done');

        const enterSpy = jasmine.createSpy();
        const leaveSpy = jasmine.createSpy();

        $animate.on('enter', parent, enterSpy);
        $animate.on('leave', parent, leaveSpy);

        $animate.enter(element, parent).done(enterDone);
        expect(enterDone).not.toHaveBeenCalled();

        const runner = $animate.leave(element);
        $animate.flush();
        expect(enterDone).toHaveBeenCalled();

        expect(enterSpy).not.toHaveBeenCalled();
        expect(leaveSpy.calls.count()).toBe(1);
        expect(leaveSpy.calls.mostRecent().args[1]).toBe('start');

        leaveSpy.calls.reset();
        runner.end();
        $animate.flush();

        expect(enterSpy).not.toHaveBeenCalled();
        expect(leaveSpy.calls.count()).toBe(1);
        expect(leaveSpy.calls.mostRecent().args[1]).toBe('close');
      }));


      it('should not trigger the callback if animations are disabled on the element',
        inject(($animate, $rootScope, $rootElement, $document) => {

        const callbackTriggered = false;
        const spy = jasmine.createSpy('enter');
        $animate.on('enter', jqLite($document[0].body), spy);

        element = jqLite('<div></div>');
        $animate.enabled(element, false);
        const runner = $animate.enter(element, $rootElement);
        $rootScope.$digest();

        $animate.flush(); // Flushes the animation frames for the callbacks

        expect(spy).not.toHaveBeenCalled();
      }));


      it('should not trigger the callbacks if the animation is skipped because there are no class-based animations and no structural animation',
        inject(($animate, $rootScope) => {

        parent.append(element);
        const classSpy = jasmine.createSpy('classChange');
        $animate.on('addClass', element, classSpy);
        $animate.on('removeClass', element, classSpy);
        element.addClass('one three');

        $animate.addClass(element, 'one');
        $animate.removeClass(element, 'four');

        $rootScope.$digest();
        $animate.flush();
        expect(classSpy).not.toHaveBeenCalled();
      }));


      describe('because the document is hidden', () => {
        const hidden = true;

        beforeEach(() => {
          module(($provide) => {
            $provide.value('$$isDocumentHidden', () => hidden);
          });
        });

        it('should trigger callbacks for an enter animation',
          inject(($animate, $rootScope, $rootElement, $document) => {

          const spy = jasmine.createSpy();
          $animate.on('enter', jqLite($document[0].body), spy);

          element = jqLite('<div></div>');
          const runner = $animate.enter(element, $rootElement);
          $rootScope.$digest();

          $animate.flush(); // Flushes the animation frames for the callbacks

          expect(spy.calls.count()).toBe(2);
          expect(spy.calls.argsFor(0)[1]).toBe('start');
          expect(spy.calls.argsFor(1)[1]).toBe('close');
        }));
      });


    });

  });
});
