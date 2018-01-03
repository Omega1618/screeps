_.extremumBy = function(arr, pluck, extremum) {
  var out = arr.reduce(function(best, next) {
    var pair = [ pluck(next), next ];
    if (!best) {
       return pair;
    } else if (extremum.apply(null, [ best[0], pair[0] ]) == best[0]) {
       return best;
    } else {
       return pair;
    }
  },null);
  if (out) return out[1];
  return null;
};

_.minBy = function(arr, fn) { return _.extremumBy(arr, fn, Math.min); };

_.maxBy = function(arr, fn) { return _.extremumBy(arr, fn, Math.max); };