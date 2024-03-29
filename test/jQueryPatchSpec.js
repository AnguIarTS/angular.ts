/* global $: false */


if (window.jQuery) {

  describe('jQuery patch', () => {

    let doc = null;
    let divSpy = null;
    let spy1 = null;
    let spy2 = null;

    beforeEach(() => {
      divSpy = jasmine.createSpy('div.$destroy');
      spy1 = jasmine.createSpy('span1.$destroy');
      spy2 = jasmine.createSpy('span2.$destroy');
      doc = $('<div><span class=first>abc</span><span class=second>xyz</span></div>');
      doc.find('span.first').on('$destroy', spy1);
      doc.find('span.second').on('$destroy', spy2);
    });

    afterEach(() => {
      expect(divSpy).not.toHaveBeenCalled();

      expect(spy1).toHaveBeenCalled();
      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledTimes(1);
    });

    describe('$destroy event', () => {

      it('should fire on remove()', () => {
        doc.find('span').remove();
      });

      it('should fire on replaceWith()', () => {
        doc.find('span').replaceWith('<b>bla</b>');
      });

      it('should fire on replaceAll()', () => {
        $('<b>bla</b>').replaceAll(doc.find('span'));
      });

      it('should fire on empty()', () => {
        doc.empty();
      });

      it('should fire on html(param)', () => {
        doc.html('abc');
      });

      it('should fire on html(\'\')', () => {
        doc.html('');
      });
    });
  });

  describe('jQuery patch eagerness', () => {

    let doc = null;
    let divSpy = null;
    let spy1 = null;
    let spy2 = null;

    beforeEach(() => {
      divSpy = jasmine.createSpy('div.$destroy');
      spy1 = jasmine.createSpy('span1.$destroy');
      spy2 = jasmine.createSpy('span2.$destroy');
      doc = $('<div><span class=first>abc</span><span class=second>xyz</span></div>');
      doc.find('span.first').on('$destroy', spy1);
      doc.find('span.second').on('$destroy', spy2);
    });

    afterEach(() => {
      expect(divSpy).not.toHaveBeenCalled();
      expect(spy1).not.toHaveBeenCalled();
    });

    describe('$destroy event is not invoked in too many cases', () => {

      it('should fire only on matched elements on remove(selector)', () => {
        doc.find('span').remove('.second');
        expect(spy2).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalledTimes(1);
      });

      it('should not fire on html()', () => {
        doc.html();
        expect(spy2).not.toHaveBeenCalled();
      });
    });
  });
}
