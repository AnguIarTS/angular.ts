/** @this */
let $$AnimateCacheProvider = function () {
  let KEY = "$$ngAnimateParentKey";
  let parentCounter = 0;
  let cache = Object.create(null);

  this.$get = [
    function () {
      return {
        cacheKey: function (node, method, addClass, removeClass) {
          let parentNode = node.parentNode;
          let parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
          let parts = [parentID, method, node.getAttribute("class")];
          if (addClass) {
            parts.push(addClass);
          }
          if (removeClass) {
            parts.push(removeClass);
          }
          return parts.join(" ");
        },

        containsCachedAnimationWithoutDuration: function (key) {
          let entry = cache[key];

          // nothing cached, so go ahead and animate
          // otherwise it should be a valid animation
          return (entry && !entry.isValid) || false;
        },

        flush: function () {
          cache = Object.create(null);
        },

        count: function (key) {
          let entry = cache[key];
          return entry ? entry.total : 0;
        },

        get: function (key) {
          let entry = cache[key];
          return entry && entry.value;
        },

        put: function (key, value, isValid) {
          if (!cache[key]) {
            cache[key] = { total: 1, value: value, isValid: isValid };
          } else {
            cache[key].total++;
            cache[key].value = value;
          }
        },
      };
    },
  ];
};
