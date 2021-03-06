// SelBench name-space
var selbench = { name: "SelBench" };

// I don't want to redeclare the variable when the user-extension is generated
// I don't want the scripts to blow up when the firefox extension is used.
// This is an alias on the global scope that references the global scope.
globalContext = this;

(function($$){
	
  /* Starting with FF4 lots of objects are in an XPCNativeWrapper,
   * and we need the underlying object for == and for..in operations.
   */
  $$.unwrapObject = function(obj) {
    if (typeof(obj) === "undefined" || obj == null)
      return obj;
    if (obj.wrappedJSObject)
      return obj.wrappedJSObject;
    return obj;
  };

}(selbench));
