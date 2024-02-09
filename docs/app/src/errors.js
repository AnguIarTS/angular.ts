

angular.module('errors', ['ngSanitize'])

.filter('errorLink', ['$sanitize', function($sanitize) {
  let LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>]/g,
      MAILTO_REGEXP = /^mailto:/,
      STACK_TRACE_REGEXP = /:\d+:\d+$/;

  let truncate = function(text, nchars) {
    if (text.length > nchars) {
      return text.substr(0, nchars - 3) + '...';
    }
    return text;
  };

  return function(text, target) {
    if (!text) return text;

    let targetHtml = target ? ' target="' + target + '"' : '';

    return $sanitize(text.replace(LINKY_URL_REGEXP, function(url) {
      if (STACK_TRACE_REGEXP.test(url)) {
        return url;
      }

      // if we did not match ftp/http/mailto then assume mailto
      if (!/^((ftp|https?):\/\/|mailto:)/.test(url)) url = 'mailto:' + url;

      return '<a' + targetHtml + ' href="' + url + '">' +
                truncate(url.replace(MAILTO_REGEXP, ''), 60) +
              '</a>';
    }));
  };
}])


.directive('errorDisplay', ['$location', 'errorLinkFilter', function($location, errorLinkFilter) {
  let encodeAngleBrackets = function(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  let interpolate = function(formatString) {
    let formatArgs = arguments;
    return formatString.replace(/\{\d+\}/g, function(match) {
      // Drop the braces and use the unary plus to convert to an integer.
      // The index will be off by one because of the formatString.
      let index = +match.slice(1, -1);
      if (index + 1 >= formatArgs.length) {
        return match;
      }
      return formatArgs[index + 1];
    });
  };

  return {
    link: function(scope, element, attrs) {
      let search = $location.search(),
        formatArgs = [attrs.errorDisplay],
        formattedText,
        i;

      for (i = 0; angular.isDefined(search['p' + i]); i++) {
        formatArgs.push(search['p' + i]);
      }

      formattedText = encodeAngleBrackets(interpolate.apply(null, formatArgs));
      element.html(errorLinkFilter(formattedText, '_blank'));
    }
  };
}]);
