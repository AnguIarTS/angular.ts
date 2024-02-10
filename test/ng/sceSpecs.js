

/* eslint-disable no-script-url */

describe('SCE', () => {

  describe('when disabled', () => {
    beforeEach(() => {
      module(($sceProvider) => {
        $sceProvider.enabled(false);
      });
    });

    it('should provide the getter for enabled', inject(($sce) => {
      expect($sce.isEnabled()).toBe(false);
    }));

    it('should not wrap/unwrap any value or throw exception on non-string values', inject(($sce) => {
      const originalValue = { foo: 'bar' };
      expect($sce.trustAs($sce.JS, originalValue)).toBe(originalValue);
      expect($sce.getTrusted($sce.JS, originalValue)).toBe(originalValue);
    }));
  });

  describe('when enabled', () => {
    it('should wrap string values with TrustedValueHolder', inject(($sce) => {
      const originalValue = 'original_value';
      let wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.HTML, wrappedValue)).toBe('original_value');
      expect(() => { $sce.getTrusted($sce.CSS, wrappedValue); }).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      wrappedValue = $sce.trustAs($sce.CSS, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.CSS, wrappedValue)).toBe('original_value');
      expect(() => { $sce.getTrusted($sce.HTML, wrappedValue); }).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      wrappedValue = $sce.trustAs($sce.URL, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.URL, wrappedValue)).toBe('original_value');
      wrappedValue = $sce.trustAs($sce.JS, originalValue);
      expect(typeof wrappedValue).toBe('object');
      expect($sce.getTrusted($sce.JS, wrappedValue)).toBe('original_value');
    }));

    it('should NOT wrap non-string values', inject(($sce) => {
      expect(() => { $sce.trustAsCss(123); }).toThrowMinErr(
          '$sce', 'itype', 'Attempted to trust a non-string value in a content requiring a string: ' +
          'Context: css');
    }));

    it('should NOT wrap unknown contexts', inject(($sce) => {
      expect(() => { $sce.trustAs('unknown1', '123'); }).toThrowMinErr(
          '$sce', 'icontext', 'Attempted to trust a value in invalid context. Context: unknown1; Value: 123');
    }));

    it('should NOT wrap undefined context', inject(($sce) => {
      expect(() => { $sce.trustAs(undefined, '123'); }).toThrowMinErr(
          '$sce', 'icontext', 'Attempted to trust a value in invalid context. Context: undefined; Value: 123');
    }));

    it('should wrap undefined into undefined', inject(($sce) => {
      expect($sce.trustAsHtml(undefined)).toBeUndefined();
    }));

    it('should unwrap undefined into undefined', inject(($sce) => {
      expect($sce.getTrusted($sce.HTML, undefined)).toBeUndefined();
    }));

    it('should wrap null into null', inject(($sce) => {
      expect($sce.trustAsHtml(null)).toBe(null);
    }));

    it('should unwrap null into null', inject(($sce) => {
      expect($sce.getTrusted($sce.HTML, null)).toBe(null);
    }));

    it('should wrap "" into ""', inject(($sce) => {
      expect($sce.trustAsHtml('')).toBe('');
    }));

    it('should unwrap "" into ""', inject(($sce) => {
      expect($sce.getTrusted($sce.HTML, '')).toBe('');
    }));

    it('should unwrap values and return the original', inject(($sce) => {
      const originalValue = 'originalValue';
      const wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect($sce.getTrusted($sce.HTML, wrappedValue)).toBe(originalValue);
    }));

    it('should NOT unwrap values when the type is different', inject(($sce) => {
      const originalValue = 'originalValue';
      const wrappedValue = $sce.trustAs($sce.HTML, originalValue);
      expect(() => { $sce.getTrusted($sce.CSS, wrappedValue); }).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT unwrap values that had not been wrapped', inject(($sce) => {
      function TrustedValueHolder(trustedValue) {
        this.$unwrapTrustedValue = function() {
          return trustedValue;
        };
      }
      const wrappedValue = new TrustedValueHolder('originalValue');
      expect(() => $sce.getTrusted($sce.HTML, wrappedValue)).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should implement toString on trusted values', inject(($sce) => {
      const originalValue = '123';
          const wrappedValue = $sce.trustAsHtml(originalValue);
      expect($sce.getTrustedHtml(wrappedValue)).toBe(originalValue);
      expect(wrappedValue.toString()).toBe(originalValue.toString());
    }));
  });


  describe('replace $sceDelegate', () => {
    it('should override the default $sce.trustAs/valueOf/etc.', () => {
      module(($provide) => {
        $provide.value('$sceDelegate', {
          trustAs(type, value) { return `wrapped:${    value}`; },
          getTrusted(type, value) { return `unwrapped:${  value}`; },
          valueOf(value) { return `valueOf:${  value}`; }
        });
      });

      inject(($sce) => {
        expect($sce.trustAsJs('value')).toBe('wrapped:value');
        expect($sce.valueOf('value')).toBe('valueOf:value');
        expect($sce.getTrustedJs('value')).toBe('unwrapped:value');
        expect($sce.parseAsJs('name')({name: 'chirayu'})).toBe('unwrapped:chirayu');
      });
    });
  });


  describe('$sce.parseAs', () => {
    it('should parse constant literals as trusted', inject(($sce) => {
      expect($sce.parseAsJs('1')()).toBe(1);
      expect($sce.parseAsJs('1', $sce.ANY)()).toBe(1);
      expect($sce.parseAsJs('1', $sce.HTML)()).toBe(1);
      expect($sce.parseAsJs('1', 'UNDEFINED')()).toBe(1);
      expect($sce.parseAsJs('true')()).toBe(true);
      expect($sce.parseAsJs('false')()).toBe(false);
      expect($sce.parseAsJs('null')()).toBe(null);
      expect($sce.parseAsJs('undefined')()).toBeUndefined();
      expect($sce.parseAsJs('"string"')()).toBe('string');
    }));

    it('should be possible to do one-time binding on a non-concatenable context', () => {
      module(provideLog);
      inject(($sce, $rootScope, log) => {
        $rootScope.$watch($sce.parseAsHtml('::foo'), (value) => {
          log(`${value  }`);
        });

        $rootScope.$digest();
        expect(log).toEqual('undefined'); // initial listener call
        log.reset();

        $rootScope.foo = $sce.trustAs($sce.HTML, 'trustedValue');
        expect($rootScope.$$watchers.length).toBe(1);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toBe(0);
        expect(log).toEqual('trustedValue');
        log.reset();

        $rootScope.foo = $sce.trustAs($sce.HTML, 'anotherTrustedValue');
        $rootScope.$digest();
        expect(log).toEqual(''); // watcher no longer active
      });
    });

    it('should be possible to do one-time binding on a concatenable context', () => {
      module(provideLog);
      inject(($sce, $rootScope, log) => {
        $rootScope.$watch($sce.parseAsUrl('::foo'), (value) => {
          log(`${value  }`);
        });

        $rootScope.$digest();
        expect(log).toEqual('undefined'); // initial listener call
        log.reset();

        $rootScope.foo = $sce.trustAs($sce.URL, 'trustedValue');
        expect($rootScope.$$watchers.length).toBe(1);
        $rootScope.$digest();

        expect($rootScope.$$watchers.length).toBe(0);
        expect(log).toEqual('trustedValue');
        log.reset();

        $rootScope.foo = $sce.trustAs($sce.URL, 'anotherTrustedValue');
        $rootScope.$digest();
        expect(log).toEqual(''); // watcher no longer active
      });
    });

    it('should NOT parse constant non-literals', inject(($sce) => {
      // Until there's a real world use case for this, we're disallowing
      // constant non-literals.  See $SceParseProvider.
      const exprFn = $sce.parseAsJs('1+1');
      expect(exprFn).toThrow();
    }));

    it('should NOT return untrusted values from expression function', inject(($sce) => {
      const exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(() => exprFn({}, {'foo': true})).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should NOT return trusted values of the wrong type from expression function', inject(($sce) => {
      const exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(() => exprFn({}, {'foo': $sce.trustAs($sce.JS, '123')})).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

    it('should return trusted values from expression function', inject(($sce) => {
      const exprFn = $sce.parseAs($sce.HTML, 'foo');
      expect(exprFn({}, {'foo': $sce.trustAs($sce.HTML, 'trustedValue')})).toBe('trustedValue');
    }));

    it('should support shorthand methods', inject(($sce) => {
      // Test shorthand parse methods.
      expect($sce.parseAsHtml('1')()).toBe(1);
      // Test short trustAs methods.
      expect($sce.trustAsAny).toBeUndefined();
      expect(() => {
        // mismatched types.
        $sce.parseAsCss('foo')({}, {'foo': $sce.trustAsHtml('1')});
      }).toThrowMinErr(
          '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
    }));

  });

  describe('$sceDelegate resource url policies', () => {
    function runTest(cfg, testFn) {
      return function() {
        module(($sceDelegateProvider) => {
          if (isDefined(cfg.trustedUrls)) {
            $sceDelegateProvider.trustedResourceUrlList(cfg.trustedUrls);
          }
          if (isDefined(cfg.bannedUrls)) {
            $sceDelegateProvider.bannedResourceUrlList(cfg.bannedUrls);
          }
        });
        inject(testFn);
      };
    }

    it('should default to "self" which allows relative urls', runTest({}, ($sce, $document) => {
      expect($sce.getTrustedResourceUrl('foo/bar')).toEqual('foo/bar');
    }));

    it('should reject everything when trusted resource URL list is empty', runTest(
      {
        trustedUrls: [],
        bannedUrls: []
      }, ($sce) => {
        expect(() => { $sce.getTrustedResourceUrl('#'); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: #');
      }
    ));

    it('should match against normalized urls', runTest(
      {
        trustedUrls: [/^foo$/],
        bannedUrls: []
      }, ($sce) => {
        expect(() => { $sce.getTrustedResourceUrl('foo'); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
      }
    ));

    it('should not accept unknown matcher type', () => {
      expect(() => {
        runTest({trustedUrls: [{}]}, null)();
      }).toThrowMinErr('$injector', 'modulerr', new RegExp(
          /Failed to instantiate module function ?\(\$sceDelegateProvider\) due to:\n/.source +
          /[^[]*\[\$sce:imatcher] Matchers may only be "self", string patterns or RegExp objects/.source));
    });

    describe('adjustMatcher', () => {
      /* global adjustMatcher: false */
      it('should rewrite regex into regex and add ^ & $ on either end', () => {
        expect(adjustMatcher(/a.*b/).exec('a.b')).not.toBeNull();
        expect(adjustMatcher(/a.*b/).exec('-a.b-')).toBeNull();
        // Adding ^ & $ onto a regex that already had them should also work.
        expect(adjustMatcher(/^a.*b$/).exec('a.b')).not.toBeNull();
        expect(adjustMatcher(/^a.*b$/).exec('-a.b-')).toBeNull();
      });

      it('should should match * and **', () => {
        expect(adjustMatcher('*://*.example.com/**').exec('http://www.example.com/path')).not.toBeNull();
      });
    });

    describe('regex matcher', () => {
      it('should support custom regex', runTest(
        {
          trustedUrls: [/^http:\/\/example\.com\/.*/],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
          // must match entire regex
          expect(() => { $sce.getTrustedResourceUrl('https://example.com/foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: https://example.com/foo');
          // https doesn't match (mismatched protocol.)
          expect(() => { $sce.getTrustedResourceUrl('https://example.com/foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: https://example.com/foo');
        }
      ));

      it('should match entire regex', runTest(
        {
          trustedUrls: [/https?:\/\/example\.com\/foo/],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
          expect($sce.getTrustedResourceUrl('https://example.com/foo')).toEqual('https://example.com/foo');
          expect(() => { $sce.getTrustedResourceUrl('http://example.com/fo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/fo');
          // Suffix not allowed even though original regex does not contain an ending $.
          expect(() => { $sce.getTrustedResourceUrl('http://example.com/foo2'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/foo2');
          // Prefix not allowed even though original regex does not contain a leading ^.
          expect(() => { $sce.getTrustedResourceUrl('xhttp://example.com/foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: xhttp://example.com/foo');
        }
      ));
    });

    describe('string matchers', () => {
      it('should support strings as matchers', runTest(
        {
          trustedUrls: ['http://example.com/foo'],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
          // "." is not a special character like in a regex.
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo');
          // You can match a prefix.
          expect(() => { $sce.getTrustedResourceUrl('http://example.com/foo2'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/foo2');
          // You can match a suffix.
          expect(() => { $sce.getTrustedResourceUrl('xhttp://example.com/foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: xhttp://example.com/foo');
        }
      ));

      it('should support the * wildcard', runTest(
        {
          trustedUrls: ['http://example.com/foo*'],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
          // The * wildcard should match extra characters.
          expect($sce.getTrustedResourceUrl('http://example.com/foo-bar')).toEqual('http://example.com/foo-bar');
          // The * wildcard does not match ':'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo:bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo:bar');
          // The * wildcard does not match '/'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo/bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo/bar');
          // The * wildcard does not match '.'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo.bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo.bar');
          // The * wildcard does not match '?'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo?bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo?bar');
          // The * wildcard does not match '&'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo&bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo&bar');
          // The * wildcard does not match ';'
          expect(() => { $sce.getTrustedResourceUrl('http://example-com/foo;bar'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example-com/foo;bar');
        }
      ));

      it('should support the ** wildcard', runTest(
        {
          trustedUrls: ['http://example.com/foo**'],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('http://example.com/foo')).toEqual('http://example.com/foo');
          // The ** wildcard should match extra characters.
          expect($sce.getTrustedResourceUrl('http://example.com/foo-bar')).toEqual('http://example.com/foo-bar');
          // The ** wildcard accepts the ':/.?&' characters.
          expect($sce.getTrustedResourceUrl('http://example.com/foo:1/2.3?4&5-6')).toEqual('http://example.com/foo:1/2.3?4&5-6');
        }
      ));

      it('should not accept *** in the string', () => {
        expect(() => {
          runTest({trustedUrls: ['http://***']}, null)();
        }).toThrowMinErr('$injector', 'modulerr', new RegExp(
             /Failed to instantiate module function ?\(\$sceDelegateProvider\) due to:\n/.source +
             /[^[]*\[\$sce:iwcard] Illegal sequence \*\*\* in string matcher\. {2}String: http:\/\/\*\*\*/.source));
      });
    });

    describe('"self" matcher', () => {
      it('should support the special string "self" in trusted resource URL list', runTest(
        {
          trustedUrls: ['self'],
          bannedUrls: []
        }, ($sce) => {
          expect($sce.getTrustedResourceUrl('foo')).toEqual('foo');
        }
      ));

      it('should support the special string "self" in baneed resource URL list', runTest(
        {
          trustedUrls: [/.*/],
          bannedUrls: ['self']
        }, ($sce) => {
          expect(() => { $sce.getTrustedResourceUrl('foo'); }).toThrowMinErr(
            '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
        }
      ));

      describe('when the document base URL has changed', () => {
        let baseElem;
        const cfg = {trustedUrls: ['self'], bannedUrls: []};

        beforeEach(() => {
          baseElem = window.document.createElement('BASE');
          baseElem.setAttribute('href', `${window.location.protocol  }//foo.example.com/path/`);
          window.document.head.appendChild(baseElem);
        });

        afterEach(() => {
          window.document.head.removeChild(baseElem);
        });


        it('should allow relative URLs', runTest(cfg, ($sce) => {
          expect($sce.getTrustedResourceUrl('foo')).toEqual('foo');
        }));

        it('should allow absolute URLs', runTest(cfg, ($sce) => {
          expect($sce.getTrustedResourceUrl('//foo.example.com/bar'))
              .toEqual('//foo.example.com/bar');
        }));

        it('should still block some URLs', runTest(cfg, ($sce) => {
          expect(() => {
            $sce.getTrustedResourceUrl('//bad.example.com');
          }).toThrowMinErr('$sce', 'insecurl',
              'Blocked loading resource from url not allowed by $sceDelegate policy.  ' +
              'URL: //bad.example.com');
        }));
      });
    });

    it('should have the banned resource URL list override the trusted resource URL list', runTest(
      {
        trustedUrls: ['self'],
        bannedUrls: ['self']
      }, ($sce) => {
        expect(() => { $sce.getTrustedResourceUrl('foo'); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: foo');
      }
    ));

    it('should support multiple items in both lists', runTest(
      {
        trustedUrls: [/^http:\/\/example.com\/1$/, /^http:\/\/example.com\/2$/, /^http:\/\/example.com\/3$/, 'self'],
        bannedUrls: [/^http:\/\/example.com\/3$/, /.*\/open_redirect/]
      }, ($sce) => {
        expect($sce.getTrustedResourceUrl('same_domain')).toEqual('same_domain');
        expect($sce.getTrustedResourceUrl('http://example.com/1')).toEqual('http://example.com/1');
        expect($sce.getTrustedResourceUrl('http://example.com/2')).toEqual('http://example.com/2');
        expect(() => { $sce.getTrustedResourceUrl('http://example.com/3'); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: http://example.com/3');
        expect(() => { $sce.getTrustedResourceUrl('open_redirect'); }).toThrowMinErr(
          '$sce', 'insecurl', 'Blocked loading resource from url not allowed by $sceDelegate policy.  URL: open_redirect');
      }
    ));
  });

  describe('URL-context sanitization', () => {
    it('should sanitize values that are not found in the trusted resource URL list', inject(($sce) => {
      expect($sce.getTrustedMediaUrl('javascript:foo')).toEqual('unsafe:javascript:foo');
      expect($sce.getTrustedUrl('javascript:foo')).toEqual('unsafe:javascript:foo');
    }));

    it('should not sanitize values that are found in the trusted resource URL list', inject(($sce) => {
      expect($sce.getTrustedMediaUrl('http://example.com')).toEqual('http://example.com');
      expect($sce.getTrustedUrl('http://example.com')).toEqual('http://example.com');
    }));

    it('should not sanitize trusted values', inject(($sce) => {
      expect($sce.getTrustedMediaUrl($sce.trustAsMediaUrl('javascript:foo'))).toEqual('javascript:foo');
      expect($sce.getTrustedMediaUrl($sce.trustAsUrl('javascript:foo'))).toEqual('javascript:foo');
      expect($sce.getTrustedMediaUrl($sce.trustAsResourceUrl('javascript:foo'))).toEqual('javascript:foo');

      expect($sce.getTrustedUrl($sce.trustAsMediaUrl('javascript:foo'))).toEqual('unsafe:javascript:foo');
      expect($sce.getTrustedUrl($sce.trustAsUrl('javascript:foo'))).toEqual('javascript:foo');
      expect($sce.getTrustedUrl($sce.trustAsResourceUrl('javascript:foo'))).toEqual('javascript:foo');
    }));

    it('should use the $$sanitizeUri', () => {
      const $$sanitizeUri = jasmine.createSpy('$$sanitizeUri').and.returnValue('someSanitizedUrl');
      module(($provide) => {
        $provide.value('$$sanitizeUri', $$sanitizeUri);
      });
      inject(($sce) => {
        expect($sce.getTrustedMediaUrl('someUrl')).toEqual('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledOnceWith('someUrl', true);

        $$sanitizeUri.calls.reset();

        expect($sce.getTrustedUrl('someUrl')).toEqual('someSanitizedUrl');
        expect($$sanitizeUri).toHaveBeenCalledOnceWith('someUrl', false);
      });
    });
  });

  describe('sanitizing html', () => {
    describe('when $sanitize is NOT available', () => {
      it('should throw an exception for getTrusted(string) values', inject(($sce) => {
        expect(() => { $sce.getTrustedHtml('<b></b>'); }).toThrowMinErr(
            '$sce', 'unsafe', 'Attempting to use an unsafe value in a safe context.');
      }));
    });

    describe('when $sanitize is available', () => {
      beforeEach(() => { module('ngSanitize'); });

      it('should sanitize html using $sanitize', inject(($sce) => {
        expect($sce.getTrustedHtml('a<xxx><B>b</B></xxx>c')).toBe('a<b>b</b>c');
      }));

    });
  });
});
