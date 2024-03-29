

describe('Binder', () => {

  let element;

  function childNode(element, index) {
    return jqLite(element[0].childNodes[index]);
  }

  beforeEach(function() {
    this.compileToHtml = function(content) {
      let html;
      inject(($rootScope, $compile) => {
        content = jqLite(content);
        $compile(content)($rootScope);
        html = sortedHtml(content);
      });
      return html;
    };
  });

  afterEach(function() {
    dealoc(element);
    dealoc(this.element);
  });

  it('BindUpdate', inject(($rootScope, $compile) => {
    $compile('<div ng-init="a=123"/>')($rootScope);
    $rootScope.$digest();
    expect($rootScope.a).toBe(123);
  }));

  it('ExecuteInitialization', inject(($rootScope, $compile) => {
    $compile('<div ng-init="a=123">')($rootScope);
    expect($rootScope.a).toBe(123);
  }));

  it('ExecuteInitializationStatements', inject(($rootScope, $compile) => {
    $compile('<div ng-init="a=123;b=345">')($rootScope);
    expect($rootScope.a).toBe(123);
    expect($rootScope.b).toBe(345);
  }));

  it('ApplyTextBindings', inject(($rootScope, $compile) => {
    element = $compile('<div ng-bind="model.a">x</div>')($rootScope);
    $rootScope.model = {a:123};
    $rootScope.$apply();
    expect(element.text()).toBe('123');
  }));

  it('InputTypeButtonActionExecutesInScope', inject(($rootScope, $compile) => {
    let savedCalled = false;
    element = $compile(
      '<input type="button" ng-click="person.save()" value="Apply">')($rootScope);
    $rootScope.person = {};
    $rootScope.person.save = function() {
      savedCalled = true;
    };
    browserTrigger(element, 'click');
    expect(savedCalled).toBe(true);
  }));

  it('InputTypeButtonActionExecutesInScope2', inject(($rootScope, $compile) => {
    let log = '';
    element = $compile('<input type="image" ng-click="action()">')($rootScope);
    $rootScope.action = function() {
      log += 'click;';
    };
    expect(log).toEqual('');
    browserTrigger(element, 'click');
    expect(log).toEqual('click;');
  }));

  it('ButtonElementActionExecutesInScope', inject(($rootScope, $compile) => {
    let savedCalled = false;
    element = $compile('<button ng-click="person.save()">Apply</button>')($rootScope);
    $rootScope.person = {};
    $rootScope.person.save = function() {
      savedCalled = true;
    };
    browserTrigger(element, 'click');
    expect(savedCalled).toBe(true);
  }));

  it('RepeaterUpdateBindings', inject(($rootScope, $compile) => {
    const form = $compile(
      '<ul>' +
        '<LI ng-repeat="item in model.items" ng-bind="item.a"></LI>' +
      '</ul>')($rootScope);
    const items = [{a: 'A'}, {a: 'B'}];
    $rootScope.model = {items};

    $rootScope.$apply();
    expect(sortedHtml(form)).toBe(
        '<ul>' +
          '<!-- ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">A</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">B</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
        '</ul>');

    items.unshift({a: 'C'});
    $rootScope.$apply();
    expect(sortedHtml(form)).toBe(
        '<ul>' +
          '<!-- ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">C</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">A</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">B</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
        '</ul>');

    items.shift();
    $rootScope.$apply();
    expect(sortedHtml(form)).toBe(
        '<ul>' +
          '<!-- ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">A</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
          '<li ng-bind="item.a" ng-repeat="item in model.items">B</li>' +
          '<!-- end ngRepeat: item in model.items -->' +
        '</ul>');

    items.shift();
    items.shift();
    $rootScope.$apply();
  }));

  it('RepeaterContentDoesNotBind', inject(($rootScope, $compile) => {
    element = $compile(
      '<ul>' +
        '<LI ng-repeat="item in model.items"><span ng-bind="item.a"></span></li>' +
      '</ul>')($rootScope);
    $rootScope.model = {items: [{a: 'A'}]};
    $rootScope.$apply();
    expect(sortedHtml(element)).toBe(
        '<ul>' +
          '<!-- ngRepeat: item in model.items -->' +
          '<li ng-repeat="item in model.items"><span ng-bind="item.a">A</span></li>' +
          '<!-- end ngRepeat: item in model.items -->' +
        '</ul>');
  }));

  it('DoNotOverwriteCustomAction', function() {
    const html = this.compileToHtml('<input type="submit" value="Save" action="foo();">');
    expect(html.indexOf('action="foo();"')).toBeGreaterThan(0);
  });

  it('ItShouldRemoveExtraChildrenWhenIteratingOverHash', inject(($rootScope, $compile) => {
    element = $compile('<div><div ng-repeat="i in items">{{i}}</div></div>')($rootScope);
    const items = {};
    $rootScope.items = items;

    $rootScope.$apply();
    expect(element[0].childNodes.length).toEqual(1);

    items.name = 'misko';
    $rootScope.$apply();
    expect(element[0].childNodes.length).toEqual(3);

    delete items.name;
    $rootScope.$apply();
    expect(element[0].childNodes.length).toEqual(1);
  }));

  it('IfAttrBindingThrowsErrorDecorateTheAttribute', () => {
    module(($exceptionHandlerProvider) => {
      $exceptionHandlerProvider.mode('log');
    });
    inject(($rootScope, $exceptionHandler, $compile) => {
      $compile('<div attr="before {{error.throw()}} after"></div>', null, true)($rootScope);
      const errorLogs = $exceptionHandler.errors;
      let count = 0;

      $rootScope.error = {
        'throw': function() {throw new Error(`ErrorMsg${  ++count}`);}
      };
      $rootScope.$apply();
      expect(errorLogs.length).not.toEqual(0);
      expect(errorLogs.shift()).toMatch(/ErrorMsg1/);
      errorLogs.length = 0;

      $rootScope.error.throw =  function() { return 'X';};
      $rootScope.$apply();
      expect(errorLogs.length).toMatch('0');
    });
  });

  it('NestedRepeater', inject(($rootScope, $compile) => {
    element = $compile(
      '<div>' +
        '<div ng-repeat="m in model" name="{{m.name}}">' +
           '<ul name="{{i}}" ng-repeat="i in m.item"></ul>' +
        '</div>' +
      '</div>')($rootScope);

    $rootScope.model = [{name:'a', item:['a1', 'a2']}, {name:'b', item:['b1', 'b2']}];
    $rootScope.$apply();

    expect(sortedHtml(element)).toBe(
        '<div>' +
          '<!-- ngRepeat: m in model -->' +
          '<div name="a" ng-repeat="m in model">' +
            '<!-- ngRepeat: i in m.item -->' +
            '<ul name="a1" ng-repeat="i in m.item"></ul>' +
            '<!-- end ngRepeat: i in m.item -->' +
            '<ul name="a2" ng-repeat="i in m.item"></ul>' +
            '<!-- end ngRepeat: i in m.item -->' +
          '</div>' +
          '<!-- end ngRepeat: m in model -->' +
          '<div name="b" ng-repeat="m in model">' +
            '<!-- ngRepeat: i in m.item -->' +
            '<ul name="b1" ng-repeat="i in m.item"></ul>' +
            '<!-- end ngRepeat: i in m.item -->' +
            '<ul name="b2" ng-repeat="i in m.item"></ul>' +
            '<!-- end ngRepeat: i in m.item -->' +
          '</div>' +
          '<!-- end ngRepeat: m in model -->' +
        '</div>');
  }));

  it('HideBindingExpression', inject(($rootScope, $compile) => {
    element = $compile('<div ng-hide="hidden === 3"/>')($rootScope);

    $rootScope.hidden = 3;
    $rootScope.$apply();

    assertHidden(element);

    $rootScope.hidden = 2;
    $rootScope.$apply();

    assertVisible(element);
  }));

  it('HideBinding', inject(($rootScope, $compile) => {
    element = $compile('<div ng-hide="hidden"/>')($rootScope);

    $rootScope.hidden = 'true';
    $rootScope.$apply();

    assertHidden(element);

    $rootScope.hidden = 'false';
    $rootScope.$apply();

    assertHidden(element);

    $rootScope.hidden = 0;
    $rootScope.$apply();

    assertVisible(element);

    $rootScope.hidden = false;
    $rootScope.$apply();

    assertVisible(element);

    $rootScope.hidden = '';
    $rootScope.$apply();

    assertVisible(element);
  }));

  it('ShowBinding', inject(($rootScope, $compile) => {
    element = $compile('<div ng-show="show"/>')($rootScope);

    $rootScope.show = 'true';
    $rootScope.$apply();

    assertVisible(element);

    $rootScope.show = 'false';
    $rootScope.$apply();

    assertVisible(element);

    $rootScope.show = false;
    $rootScope.$apply();

    assertHidden(element);

    $rootScope.show = false;
    $rootScope.$apply();

    assertHidden(element);

    $rootScope.show = '';
    $rootScope.$apply();

    assertHidden(element);
  }));


  it('BindClass', inject(($rootScope, $compile) => {
    element = $compile('<div ng-class="clazz"/>')($rootScope);

    $rootScope.clazz = 'testClass';
    $rootScope.$apply();

    expect(sortedHtml(element)).toBe('<div class="testClass" ng-class="clazz"></div>');

    $rootScope.clazz = ['a', 'b'];
    $rootScope.$apply();

    expect(sortedHtml(element)).toBe('<div class="a b" ng-class="clazz"></div>');
  }));

  it('BindClassEvenOdd', inject(($rootScope, $compile) => {
    element = $compile(
      '<div>' +
        '<div ng-repeat="i in [0,1]" ng-class-even="\'e\'" ng-class-odd="\'o\'"></div>' +
      '</div>')($rootScope);
    $rootScope.$apply();

    const d1 = jqLite(element[0].childNodes[1]);
    const d2 = jqLite(element[0].childNodes[3]);
    expect(d1.hasClass('o')).toBeTruthy();
    expect(d2.hasClass('e')).toBeTruthy();
    expect(sortedHtml(element)).toBe(
       '<div>' +
        '<!-- ngRepeat: i in [0,1] -->' +
        '<div class="o" ng-class-even="\'e\'" ng-class-odd="\'o\'" ng-repeat="i in [0,1]"></div>' +
        '<!-- end ngRepeat: i in [0,1] -->' +
        '<div class="e" ng-class-even="\'e\'" ng-class-odd="\'o\'" ng-repeat="i in [0,1]"></div>' +
        '<!-- end ngRepeat: i in [0,1] -->' +
        '</div>');
  }));

  it('BindStyle', inject(($rootScope, $compile) => {
    element = $compile('<div ng-style="style"/>')($rootScope);

    $rootScope.$eval('style={height: "10px"}');
    $rootScope.$apply();

    expect(element.css('height')).toBe('10px');

    $rootScope.$eval('style={}');
    $rootScope.$apply();
  }));

  it('ActionOnAHrefThrowsError', () => {
    module(($exceptionHandlerProvider) => {
      $exceptionHandlerProvider.mode('log');
    });
    inject(($rootScope, $exceptionHandler, $compile) => {
      const input = $compile('<a ng-click="action()">Add Phone</a>')($rootScope);
      $rootScope.action = function() {
        throw new Error('MyError');
      };
      browserTrigger(input, 'click');
      expect($exceptionHandler.errors[0]).toMatch(/MyError/);
    });
  });

  it('ShouldIgnoreVbNonBindable', inject(($rootScope, $compile) => {
    element = $compile(
      '<div>{{a}}' +
        '<div ng-non-bindable>{{a}}</div>' +
        '<div ng-non-bindable=\'\'>{{b}}</div>' +
        '<div ng-non-bindable=\'true\'>{{c}}</div>' +
      '</div>')($rootScope);
    $rootScope.a = 123;
    $rootScope.$apply();
    expect(element.text()).toBe('123{{a}}{{b}}{{c}}');
  }));

  it('ShouldTemplateBindPreElements', inject(($rootScope, $compile) => {
    element = $compile('<pre>Hello {{name}}!</pre>')($rootScope);
    $rootScope.name = 'World';
    $rootScope.$apply();

    expect(sortedHtml(element)).toBe('<pre>Hello World!</pre>');
  }));

  it('FillInOptionValueWhenMissing', inject(($rootScope, $compile) => {
    element = $compile(
        '<select ng-model="foo">' +
          '<option selected="true">{{a}}</option>' +
          '<option value="">{{b}}</option>' +
          '<option>C</option>' +
        '</select>')($rootScope);
    $rootScope.a = 'A';
    $rootScope.b = 'B';
    $rootScope.$apply();
    const optionA = childNode(element, 0);
    const optionB = childNode(element, 1);
    const optionC = childNode(element, 2);

    expect(optionA.attr('value')).toEqual('A');
    expect(optionA.text()).toEqual('A');

    expect(optionB.attr('value')).toEqual('');
    expect(optionB.text()).toEqual('B');

    expect(optionC.attr('value')).toEqual('C');
    expect(optionC.text()).toEqual('C');
  }));

  it('ItShouldSelectTheCorrectRadioBox', inject(($rootScope, $compile, $rootElement, $document) => {
    element = $compile(
      '<div>' +
        '<input type="radio" ng-model="sex" value="female">' +
        '<input type="radio" ng-model="sex" value="male">' +
      '</div>')($rootScope);

    // Append the app to the document so that "click" on a radio/checkbox triggers "change"
    // Support: Chrome, Safari 8, 9
    jqLite($document[0].body).append($rootElement.append(element));

    const female = jqLite(element[0].childNodes[0]);
    const male = jqLite(element[0].childNodes[1]);

    browserTrigger(female);
    expect($rootScope.sex).toBe('female');
    expect(female[0].checked).toBe(true);
    expect(male[0].checked).toBe(false);
    expect(female.val()).toBe('female');

    browserTrigger(male);
    expect($rootScope.sex).toBe('male');
    expect(female[0].checked).toBe(false);
    expect(male[0].checked).toBe(true);
    expect(male.val()).toBe('male');
  }));

  it('ItShouldRepeatOnHashes', inject(($rootScope, $compile) => {
    element = $compile(
      '<ul>' +
        '<li ng-repeat="(k,v) in {a:0,b:1}" ng-bind="k + v"></li>' +
      '</ul>')($rootScope);
    $rootScope.$apply();
    expect(sortedHtml(element)).toBe(
        '<ul>' +
          '<!-- ngRepeat: (k,v) in {a:0,b:1} -->' +
          '<li ng-bind="k + v" ng-repeat="(k,v) in {a:0,b:1}">a0</li>' +
          '<!-- end ngRepeat: (k,v) in {a:0,b:1} -->' +
          '<li ng-bind="k + v" ng-repeat="(k,v) in {a:0,b:1}">b1</li>' +
          '<!-- end ngRepeat: (k,v) in {a:0,b:1} -->' +
        '</ul>');
  }));

  it('ItShouldFireChangeListenersBeforeUpdate', inject(($rootScope, $compile) => {
    element = $compile('<div ng-bind="name"></div>')($rootScope);
    $rootScope.name = '';
    $rootScope.$watch('watched', () => {
      $rootScope.name = 123;
    });
    $rootScope.watched = 'change';
    $rootScope.$apply();
    expect($rootScope.name).toBe(123);
    expect(sortedHtml(element)).toBe('<div ng-bind="name">123</div>');
  }));

  it('ItShouldHandleMultilineBindings', inject(($rootScope, $compile) => {
    element = $compile('<div>{{\n 1 \n + \n 2 \n}}</div>')($rootScope);
    $rootScope.$apply();
    expect(element.text()).toBe('3');
  }));

});
