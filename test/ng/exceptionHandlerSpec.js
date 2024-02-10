

describe('$exceptionHandler', () => {
  /* global $ExceptionHandlerProvider:false */
  it('should log errors with single argument', () => {
    module(($provide) => {
      $provide.provider('$exceptionHandler', $ExceptionHandlerProvider);
    });
    inject(($log, $exceptionHandler) => {
      $exceptionHandler('myError');
      expect($log.error.logs.shift()).toEqual(['myError']);
    });
  });


  it('should log errors with multiple arguments', () => {
    module(($provide) => {
      $provide.provider('$exceptionHandler', $ExceptionHandlerProvider);
    });
    inject(($log, $exceptionHandler) => {
      $exceptionHandler('myError', 'comment');
      expect($log.error.logs.shift()).toEqual(['myError', 'comment']);
    });
  });
});
