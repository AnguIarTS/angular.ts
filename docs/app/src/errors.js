

angular.module('errors', ['ngSanitize'])

.filter('errorLink', ['$sanitize', function($sanitize) {
  const LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/g;
      const MAILTO_REGEXP = /^mailto:/;
      const STACK_TRACE_REGEXP = /:\d+:\d+$/;

  const truncate = function(text, nchars) {
    if (text.length > nchars) {
      return `${text.substr(0, nchars - 3)  }...`;
    }
    return text;
  };

  return function(text, target) {
    if (!text) return text;

    const targetHtml = target ? ` target="${  target  }"` : '';

    return $sanitize(text.replace(LINKY_URL_REGEXP, (url) => {
      if (STACK_TRACE_REGEXP.test(url)) {
        return url;
      }

      // if we did not match ftp/http/mailto then assume mailto
      if (!/^((ftp|https?):\/\/|mailto:)/.test(url)) url = `mailto:${  url}`;

      return `<a${  targetHtml  } href="${  url  }">${ 
                truncate(url.replace(MAILTO_REGEXP, ''), 60) 
              }</a>`;
    }));
  };
}])


.directive('errorDisplay', ['$location', 'errorLinkFilter', function($location, errorLinkFilter) {
  const encodeAngleBrackets = function(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const interpolate = function(formatString) {
    const formatArgs = arguments;
    return formatString.replace(/\{\d+\}/g, (match) => {
      // Drop the braces and use the unary plus to convert to an integer.
      // The index will be off by one because of the formatString.
      const index = +match.slice(1, -1);
      if (index + 1 >= formatArgs.length) {
        return match;
      }
      return formatArgs[index + 1];
    });
  };

  return {
    link(scope, element, attrs) {
      const search = $location.search();
        const formatArgs = [attrs.errorDisplay];
        let formattedText;
        let i;

      for (i = 0; angular.isDefined(search[`p${  i}`]); i++) {
        formatArgs.push(search[`p${  i}`]);
      }

      formattedText = encodeAngleBrackets(interpolate.apply(null, formatArgs));
      element.html(errorLinkFilter(formattedText, '_blank'));
    }
  };
}]);
