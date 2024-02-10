

describe('$$cookieWriter', () => {
  let $$cookieWriter; let document;

  function deleteAllCookies() {
    const cookies = document.cookie.split(';');
    const path = window.location.pathname;

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      const parts = path.split('/');
      while (parts.length) {
        document.cookie = `${name  }=;path=${  parts.join('/') || '/'  };expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        parts.pop();
      }
    }
  }

  beforeEach(() => {
    document = window.document;
    deleteAllCookies();
    expect(document.cookie).toEqual('');

    module('ngCookies');
    inject((_$$cookieWriter_) => {
      $$cookieWriter = _$$cookieWriter_;
    });
  });


  afterEach(() => {
    deleteAllCookies();
    expect(document.cookie).toEqual('');
  });


  describe('remove via $$cookieWriter(cookieName, undefined)', () => {

    it('should remove a cookie when it is present', () => {
      document.cookie = 'foo=bar;path=/';

      $$cookieWriter('foo', undefined);

      expect(document.cookie).toEqual('');
    });


    it('should do nothing when an nonexisting cookie is being removed', () => {
      $$cookieWriter('doesntexist', undefined);
      expect(document.cookie).toEqual('');
    });
  });


  describe('put via $$cookieWriter(cookieName, string)', () => {

    it('should create and store a cookie', () => {
      $$cookieWriter('cookieName', 'cookie=Value');
      expect(document.cookie).toMatch(/cookieName=cookie%3DValue;? ?/);
    });


    it('should overwrite an existing unsynced cookie', () => {
      document.cookie = 'cookie=new;path=/';

      const oldVal = $$cookieWriter('cookie', 'newer');

      expect(document.cookie).toEqual('cookie=newer');
      expect(oldVal).not.toBeDefined();
    });

    it('should encode both name and value', () => {
      $$cookieWriter('cookie1=', 'val;ue');
      $$cookieWriter('cookie2=bar;baz', 'val=ue');

      const rawCookies = document.cookie.split('; '); // order is not guaranteed, so we need to parse
      expect(rawCookies.length).toEqual(2);
      expect(rawCookies).toContain('cookie1%3D=val%3Bue');
      expect(rawCookies).toContain('cookie2%3Dbar%3Bbaz=val%3Due');
    });

    it('should log warnings when 4kb per cookie storage limit is reached', inject(function($log) {
      let i; let longVal = ''; let cookieStr;

      for (i = 0; i < 4083; i++) {
        longVal += 'x';
      }

      cookieStr = document.cookie;
      $$cookieWriter('x', longVal); // total size 4093-4096, so it should go through
      expect(document.cookie).not.toEqual(cookieStr);
      expect(document.cookie).toEqual(`x=${  longVal}`);
      expect($log.warn.logs).toEqual([]);

      $$cookieWriter('x', `${longVal  }xxxx`); // total size 4097-4099, a warning should be logged
      expect($log.warn.logs).toEqual(
        [['Cookie \'x\' possibly not set or overflowed because it was too large (4097 > 4096 ' +
           'bytes)!']]);

      // force browser to dropped a cookie and make sure that the cache is not out of sync
      $$cookieWriter('x', 'shortVal');
      expect(document.cookie).toEqual('x=shortVal'); // needed to prime the cache
      cookieStr = document.cookie;
      $$cookieWriter('x', longVal + longVal + longVal); // should be too long for all browsers

      if (document.cookie !== cookieStr) {
        this.fail(new Error('browser didn\'t drop long cookie when it was expected. make the ' +
            'cookie in this test longer'));
      }

      expect(document.cookie).toEqual('x=shortVal');
      $log.reset();
    }));
  });

  describe('put via $$cookieWriter(cookieName, string), if no <base href> ', () => {
    beforeEach(inject(($browser) => {
      $browser.$$baseHref = undefined;
    }));

    it('should default path in cookie to "" (empty string)', () => {
      $$cookieWriter('cookie', 'bender');
      // This only fails in Safari and IE when cookiePath returns undefined
      // Where it now succeeds since baseHref return '' instead of undefined
      expect(document.cookie).toEqual('cookie=bender');
    });
  });
});

describe('cookie options', () => {
  let fakeDocument; let $$cookieWriter;
  const {isUndefined} = angular;

  function getLastCookieAssignment(key) {
    return fakeDocument[0].cookie
              .split(';')
              .reduce((prev, value) => {
                const pair = value.split('=', 2);
                if (pair[0] === key) {
                  if (isUndefined(prev)) {
                    return isUndefined(pair[1]) ? true : pair[1];
                  } 
                    throw new Error('duplicate key in cookie string');
                  
                } else {
                  return prev;
                }
              }, undefined);
  }

  beforeEach(() => {
    fakeDocument = [{cookie: ''}];
    module('ngCookies', {$document: fakeDocument});
    inject(($browser) => {
      $browser.$$baseHref = '/a/b';
    });
    inject((_$$cookieWriter_) => {
      $$cookieWriter = _$$cookieWriter_;
    });
  });

  it('should use baseHref as default path', () => {
    $$cookieWriter('name', 'value');
    expect(getLastCookieAssignment('path')).toBe('/a/b');
  });

  it('should accept path option', () => {
    $$cookieWriter('name', 'value', {path: '/c/d'});
    expect(getLastCookieAssignment('path')).toBe('/c/d');
  });

  it('should accept domain option', () => {
    $$cookieWriter('name', 'value', {domain: '.example.com'});
    expect(getLastCookieAssignment('domain')).toBe('.example.com');
  });

  it('should accept secure option', () => {
    $$cookieWriter('name', 'value', {secure: true});
    expect(getLastCookieAssignment('secure')).toBe(true);
  });

  it('should accept samesite option when value is lax', () => {
    $$cookieWriter('name', 'value', {samesite: 'lax'});
    expect(getLastCookieAssignment('samesite')).toBe('lax');
  });

  it('should accept samesite option when value is strict', () => {
    $$cookieWriter('name', 'value', {samesite: 'strict'});
    expect(getLastCookieAssignment('samesite')).toBe('strict');
  });

  it('should accept expires option on set', () => {
    $$cookieWriter('name', 'value', {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Fri, 19 Dec 2014 00:00:00 (UTC|GMT)$/);
  });

  it('should always use epoch time as expire time on remove', () => {
    $$cookieWriter('name', undefined, {expires: 'Fri, 19 Dec 2014 00:00:00 GMT'});
    expect(getLastCookieAssignment('expires')).toMatch(/^Thu, 0?1 Jan 1970 00:00:00 (UTC|GMT)$/);
  });

  it('should accept date object as expires option', () => {
    $$cookieWriter('name', 'value', {expires: new Date(Date.UTC(1981, 11, 27))});
    expect(getLastCookieAssignment('expires')).toMatch(/^Sun, 27 Dec 1981 00:00:00 (UTC|GMT)$/);
  });

});
