

describe('hidden thingy', () => {
  it('should pass', () => {

    loadFixture('input-hidden');
    expect(element(by.css('input')).getAttribute('value')).toEqual('');

    element(by.css('button')).click();
    expect(element(by.css('input')).getAttribute('value')).toEqual('{{ 7 * 6 }}');

    loadFixture('sample');
    browser.driver.executeScript('history.back()');
    const expectedValue = browser.params.browser === 'safari' ? '{{ 7 * 6 }}' : '';
    expect(element(by.css('input')).getAttribute('value')).toEqual(expectedValue);
  });

  it('should prevent browser autofill on browser.refresh', () => {

    loadFixture('back2dom');
    expect(element(by.css('#input1')).getAttribute('value')).toEqual('');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('');

    element(by.css('textarea')).sendKeys('{{ internalFn() }}');

    expect(element(by.css('#input1')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('body')).getAttribute('class')).toBe('');

    browser.refresh();
    expect(element(by.css('body')).getAttribute('class')).toBe('');
  });

  it('should prevent browser autofill on location.reload', () => {

    loadFixture('back2dom');
    expect(element(by.css('#input1')).getAttribute('value')).toEqual('');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('');

    element(by.css('textarea')).sendKeys('{{ internalFn() }}');

    expect(element(by.css('#input1')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('body')).getAttribute('class')).toBe('');

    browser.driver.executeScript('location.reload()');
    expect(element(by.css('body')).getAttribute('class')).toBe('');
  });

  it('should prevent browser autofill on history.back', () => {

    loadFixture('back2dom');
    expect(element(by.css('#input1')).getAttribute('value')).toEqual('');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('');

    element(by.css('textarea')).sendKeys('{{ internalFn() }}');

    expect(element(by.css('#input1')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('body')).getAttribute('class')).toBe('');

    loadFixture('sample');

    browser.driver.executeScript('history.back()');
    expect(element(by.css('body')).getAttribute('class')).toBe('');
  });

  it('should prevent browser autofill on history.forward', () => {

    loadFixture('sample');
    loadFixture('back2dom');
    expect(element(by.css('#input1')).getAttribute('value')).toEqual('');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('');

    element(by.css('textarea')).sendKeys('{{ internalFn() }}');

    expect(element(by.css('#input1')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('#input2')).getAttribute('value')).toEqual('{{ internalFn() }}');
    expect(element(by.css('body')).getAttribute('class')).toBe('');

    browser.driver.executeScript('history.back()');
    browser.driver.executeScript('history.forward()');
    expect(element(by.css('body')).getAttribute('class')).toBe('');
  });
});
