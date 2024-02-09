

exports.generateCode = generateCode;
exports.generateFunction = generateFunction;

function generateCode(validRanges) {
  let code = '/******************************************************\n' +
             ' *         Generated file, do not modify              *\n' +
             ' *                                                    *\n' +
             ' *****************************************************/\n' +
             '"use strict";\n';
  let keys = Object.keys(validRanges);
  for (let i in keys) {
    code += generateFunction(validRanges[keys[i]], keys[i]);
  }
  return code;
}


function generateFunction(positiveElements, functionName) {
  let result = [];
  result.push('function ', functionName, '(cp) {\n');
  positiveElements.forEach(function(range) {
    if (range[0] === range[1]) {
      result.push('  if (cp === 0x', range[0], ')');
    } else {
      result.push('  if (0x', range[0], ' <= cp && cp <= 0x', range[1], ')');
    }
    result.push(' return true;\n');
  });
  result.push('  return false;\n}\n');
  return result.join('');
}

