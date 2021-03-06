/*jslint
indent:2,
maxerr:500,
plusplus:true
 */
/*globals
globalContext:true,
HtmlRunnerTestLoop:true,
Selenium:true,
htmlTestRunner:true
 */
globalContext = this;
globalContext.onServer = globalContext.onServer || true;
globalContext.serverPatchApplied = globalContext.serverPatchApplied || false;

(function () {
function seleniumResetInterceptor() {
  var old_reset;
  old_reset = Selenium.prototype.reset;

  Selenium.prototype.reset = function () {
    function map_list(list, for_func, if_func) {
      var i,
        x,
        mapped_list = [];
      for (i = 0; i < list.length; ++i) {
        x = list[i];
        // AJS: putaquiupariu
        if (undefined === if_func || if_func(i, x)) {
          mapped_list.push(for_func(i, x));
        }
      }
      return mapped_list;
    }

    /*jslint unparam:true */
    function importCommands(i, x) {
      var b = x.getCommand();
      if (x.hasOwnProperty('trElement')) {
        b.type = "command";
      } else {
        b.type = "comment";
      }
      return b;
    }
    /*jslint unparam:false */

    old_reset.call(this);
    // if htmlTestRunner is defined...
    if (!(htmlTestRunner === undefined || htmlTestRunner === null)) {
      //TODO: map commands to real types instead of faking it
      htmlTestRunner.currentTest.commands = map_list(htmlTestRunner.currentTest.htmlTestCase.getCommandRows(), importCommands);
      // AJS: initializes private testCase (closure) to point to htmlTestRunner.currentTest (public testCase is not available under Core).
      globalContext.testCase = htmlTestRunner.currentTest;
      // the debugContext isn't there, but redirecting to the testCase seems to work.
      globalContext.testCase.debugContext = globalContext.testCase;
      var currentDebugIndex = globalContext.testCase.debugIndex;
      Object.defineProperties(globalContext.testCase, {
        "_secret_nextCommandRowIndex" : {
          configurable : false,
          enumerable : false,
          writable : true,
          value : undefined
        },
        "debugIndex" : {
          get : function () { return this._secret_nextCommandRowIndex; },
          set : function (x) { this._secret_nextCommandRowIndex = x; },
          configurable : false,
          enumerable : true
        },
        "nextCommandRowIndex" : {
          get : function () { return this._secret_nextCommandRowIndex; },
          set : function (x) { this._secret_nextCommandRowIndex = x; },
          configurable : false,
          enumerable : true
        }
      });
      globalContext.testCase.debugIndex = currentDebugIndex;
    }
  };
}

function patchServerEnvironment() {

  if (globalContext.scriptServerPatchApplied !== true) {
    globalContext.testCase = {};
    HtmlRunnerTestLoop.prototype.old_initialize = HtmlRunnerTestLoop.prototype.initialize;
    HtmlRunnerTestLoop.prototype.initialize = function (htmlTestCase, metrics, seleniumCommandFactory) {
      this.old_initialize(htmlTestCase, metrics, seleniumCommandFactory);
      this.commands = [];
    };
  }
  seleniumResetInterceptor();
  globalContext.serverPatchApplied = true;
}

// There's an option to use user-extensions.js in the IDE
// but it runs the tests against the webdriver backed selenium
// which is a different API than the one that tests are written against...
if ((globalContext.onServer === true) && (globalContext.serverPatchApplied === false)) {
  patchServerEnvironment();
}
}());// SelBench name-space
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
// selbench name-space
(function($$){

  /* LOG wrapper for Selblocks-specific behavior
   */
  function Logger()
  {
    this.error = function (msg) { this.logit("error", msg); };
    this.warn  = function (msg) { this.logit("warn", msg); };
    this.info  = function (msg) { this.logit("info", msg); };
    this.debug = function (msg) { this.logit("debug", msg); };
    this.trace = function (msg) { this.logit("debug", msg); }; // selenium doesn't have trace level

    this.logit = function (logLevel, msg) {
      LOG[logLevel]("[" + $$.name + "] " + msg);  // call the Selenium logger
    };

    // ==================== Stack Tracer ====================

    this.genStackTrace = function(err)
    {
      var e = err || new Error();
      var stackTrace = [];
      if (!e.stack)
        stackTrace.push("No stack trace, (Firefox only)");
      else {
        var funcCallPattern = /^\s*[A-Za-z0-9\-_\$]+\(/;
        var lines = e.stack.split("\n");
        for (var i=0; i < lines.length; i++) {
          if (lines[i].match(funcCallPattern))
            stackTrace.push(lines[i]);
        }
        if (!err)
          stackTrace.shift(); // remove the call to genStackTrace() itself
      }
      return stackTrace;
    };

    this.logStackTrace = function(err)
    {
      var t = this.genStackTrace(err);
      if (!err)
        t.shift(); // remove the call to logStackTrace() itself
      this.warn("__Stack Trace__");
      for (var i = 0; i < t.length; i++) {
        this.warn("@@ " + t[i]);
      }
    };

    // describe the calling function
    this.descCaller = function()
    {
      var t = this.genStackTrace(new Error());
      if (t.length == 0) return "no client function";
      t.shift(); // remove the call to descCaller() itself
      if (t.length == 0) return "no caller function";
      t.shift(); // remove the call to client function
      if (t.length == 0) return "undefined caller function";
      return "caller: " + t[0];
    };
  }

  $$.LOG = new Logger();

}(selbench));
// selbocks name-space
(function($$){

  /* Function interception
  */
  $$.fn = {};
  $$.fn.interceptStack = [];

  // replace the specified function, saving the original function on a stack
  $$.fn.interceptPush = function(targetObj, targetFnName, _fn, frameAttrs) {
    var frame = {
       targetObj: targetObj
      ,targetFnName: targetFnName
      ,savedFn: targetObj[targetFnName]
      ,attrs: frameAttrs
    };
    $$.fn.interceptStack.push(frame);
    targetObj[targetFnName] = _fn;
  };
  // restore the most recent function replacement
  $$.fn.interceptPop = function() {
    var frame = $$.fn.interceptStack.pop();
    frame.targetObj[frame.targetFnName] = frame.savedFn;
  };

  // replace the specified function, but then restore the original function as soon as it is call
  $$.fn.interceptOnce = function(targetObj, targetFnName, _fn) {
    $$.fn.interceptPush(targetObj, targetFnName, function(){
      $$.fn.interceptPop(); // un-intercept
      _fn.call(this);
    });
  };

}(selbench));
// selbench name-space
(function($$){

  /* This function replaces native Selenium command handling a command following expectError.
   * This alters command completion such that:
   *   If the command throws the given error message, then the script continues.
   *   if it succeeds or throws a different error, then the script stops with an error.
   */
  $$.expectedError = null;
  $$.handleAsExpectError = function()
  {
// $$.LOG.warn("cmd: " + this.currentCommand.command);
    try {
      selenium.browserbot.runScheduledPollers();
      this._executeCurrentCommand();
      // the command has not thrown an error
      if ($$.expectedError == null)
        this.continueTestWhenConditionIsTrue();
      else {
        // command succeeded, but an error was expected
        $$.LOG.error("Expected the error: " + $$.expectedError);
        $$.LOG.error("But command succeeded");
        $$.expectedError = null;
        this._handleCommandError(new Error("Error due to command success"));
        //throw new Error(msg);
        this.testComplete();
      }
    } catch (e) {
      var isHandled = false;
      if ($$.expectedError == null)
        isHandled = this._handleCommandError(e);
      else {
        try {
          if (isErrorMatch(e)) {
            // was an expected error
            $$.LOG.debug("Expected error confirmed: " + e.message);
           //TODO: mark the current command as passed
            isHandled = true;
          }
          else {
            // was an unexpected error
            $$.LOG.error("Expected the error: " + $$.expectedError);
            $$.LOG.error(e.message);
            this._handleCommandError(new Error(e.message));
          }
        }
        finally {
          $$.expectedError = null;
        }
      }
      if (!isHandled) {
           this.testComplete();
      } else {
           this.continueTest();
      }
    }

    //- error message matcher
    function isErrorMatch(e) {
      var errMsg = e.message;
      if ($$.expectedError instanceof RegExp) {
        return (errMsg.match($$.expectedError));
      }
      return (errMsg.indexOf($$.expectedError) != -1);
    }
  };

}(selbench));
/**
 * SelBench 1.1
 *
 * Utilities for testing, validating, and benchmarking Selenium IDE tests and extensions
 *
 * Add this file to Selenium: Options -> Options... "Selenium Core extensions"
 *   (not "Selenium IDE extensions", because we are accessing the Selenium object)
 *
 * Features
 *  - Commands: log/alert, expectError, emit/assertEmitted/resetEmitted, startTimer/timerElapsed, deleteVar/deleteVars
 *  - The emit commands provide a way to validate sequencing and accumulated state.
 *  - The expectError command facilitates negative testing by handling command failure as success.
 *  - The alert command is equivalent to getEval|alert()
 *  - The timer commands provide interval timing of scripts.
 *  - $w() and $d() are shorthand references to the window and document objects.
 *
 * Wishlist:
 *  - Timer formatting options
 *
 */

function $w() { return selenium.browserbot.getCurrentWindow(); }
function $d() { return selenium.browserbot.getDocument(); }

// selbench name-space
(function($$){
  if(typeof storedVarsGlobal !== 'object') {
      // intentional global
      storedVarsGlobal = storedVars;
  }
  if(typeof storedVarsLocal !== 'object') {
      // intentional global
      storedVarsLocal = storedVars;
  }
    
  function evalWithVars(expr) {
    return eval("with (storedVars) {" + expr + "}");
  }

  // ================================================================================
  // tail intercept Selenium.reset()

  (function () {
   // called when Selenium IDE opens / on Dev Tools [Reload] button / upon first command execution
    var orig_reset = Selenium.prototype.reset;
    Selenium.prototype.reset = function() {
      orig_reset.call(this);
      // called before each: execute a single command / run a testcase / run each testcase in a testsuite
      $$.LOG.debug("In SelBench tail intercept :: selenium.reset()");
      try {
        compileSelbenchCommands();
      }
      catch (err) {
        throw new Error("In " + err.fileName + " @" + err.lineNumber + ": " + err);
      }
      storedVarsGlobal.emitted = "";
    };
  })();

  function compileSelbenchCommands()
  {
    // scan for any Selbench commands ending in AndWait
    for (var i = 0; i < testCase.commands.length; i++)
    {
      if (testCase.commands[i].type == "command")
      {
        var curCmd = testCase.commands[i].command;
        var stemLength = curCmd.indexOf("AndWait");
        if (stemLength == -1)
          stemLength = curCmd.length;

        switch (curCmd.substring(0, stemLength)) {
          case "emit": case "assertEmitted": case "resetEmitted":
          case "timer": case "timerElapsed":
          case "alert":
            if (curCmd.indexOf("AndWait") != -1)
              notifyFatal(fmtCmdRef(i) + ", AndWait suffix is not valid for SelBench commands");
        }
      }
    }
  }

  // ================================================================================
  // emit execution tracing

  // ================================================================================
  Selenium.prototype.doExpectError = function(target) {
    $$.expectedError = eval(target);
    if(globalContext.onServer === true) {
      $$.fn.interceptOnce(HtmlRunnerTestLoop.prototype, "resume", $$.handleAsExpectError);
    } else {
      $$.fn.interceptOnce(editor.selDebugger.runner.IDETestLoop.prototype, "resume", $$.handleAsExpectError);
    }
  };

  // ================================================================================

  // appends the given string to current emitted state, (a ~ is inserted between each append)
  Selenium.prototype.doEmit = function(target)
  {
    if (storedVarsGlobal.emitted)
      storedVarsGlobal.emitted += "~";
    storedVarsGlobal.emitted += evalWithVars(target);
  };
  // verifies that the accumulated emit state matches the given string
  // if an array is specified, then matches for a ~ between each element
  Selenium.prototype.doAssertEmitted = function(target, value)
  {
    var expectedValue = eval(target);
    if (expectedValue instanceof Array) {
      expectedValue = expectedValue.join("~");
    }
    if (expectedValue != storedVarsGlobal.emitted) {
      var errmsg = " expected: " + expectedValue + "\nbut found: " + storedVarsGlobal.emitted;
      alert(errmsg);
      throw new Error(errmsg);
    }
  };
  // clears the accumulated emitted state
  Selenium.prototype.doResetEmitted = function()
  {
    storedVarsGlobal.emitted = "";
  };

  // ================================================================================
  // utility commands

  // log the evaluated expression
  Selenium.prototype.doLog = function(expr, level) {
    if (!level)
      level = "info";
    if (!$$.LOG[level])
      throw new Error("'" + level + "' is not a valid logging level");
    $$.LOG[level](evalWithVars(expr));
  };

  // display alert message with the evaluated expression
  Selenium.prototype.doAlert = function(expr) {
    alert(evalWithVars(expr));
  };
  
  // remove selenium variable
  function deleteVar(name) {
    delete storedVarsLocal[name];
    delete storedVarsGlobal[name]
  };
  Selenium.prototype.doDeleteVar = deleteVar;

  // remove selenium variable
  Selenium.prototype.doDeleteVars = function(namesSpec) {
    var names = namesSpec.split(",");
    for (var i = 0; i < names.length; i++) {
      deleteVar(names[i].trim());
    }
  };


  // ========= error handling =========

  function notifyFatal(msg) {
    $$.LOG.error("SelBench error " + msg);
    throw new Error(msg);
  }

  function fmtCmdRef(idx) { return ("@" + (idx+1) + ": " + fmtCommand(testCase.commands[idx])); }
  function fmtCommand(cmd) {
    var c = cmd.command;
    if (cmd.target) c += "|" + cmd.target;
    if (cmd.value)  c += "|" + cmd.value;
    return '[' + c + ']';
  }

  // ================================================================================
  // Timers

  var timers = {};

  Selenium.prototype.doStartTimer = function(name, description) {
    timers[name] = new Timer(description);
  };

  Selenium.prototype.doTimerElapsed = function(name, script)
  {
    if (script) {
      storedVarsGlobal._elapsed = timers[name].elapsed();
      eval(script);
    }
    else
      $$.LOG.info(timers[name].elapsed());
  };

  function Timer(desc, logLevel) {
    var msStart = +new Date();
    this.elapsed = function() {
      var msElapsed = +new Date() - msStart;
      var msg = formatDuration(msElapsed) + " elapsed: " + (desc || "");
      if (logLevel) $$.LOG[logLevel](msg);
      return msg;
    };
  }

  var SEC  = 1;
  var MIN  = 60 * SEC;
  var HOUR = 60 * MIN;
  var DAY  = 24 * HOUR;

  function formatDuration(millis)
  {
    var sec = millis / 1000;
    var fmt = "";

    if (sec > DAY) {
      fmt = (sec / DAY).toFixed() + " day ";
      sec %= DAY;
    }
    if (sec > (1.5 * HOUR) || fmt.length > 0) {
      fmt += (sec / HOUR).toFixed() + " hour ";
      sec %= HOUR;
    }
    if (sec > (1.5 * MIN) || fmt.length > 0) {
      fmt += (sec / MIN).toFixed() + " min ";
      sec %= MIN;
    }
    /*
    breakDown(1.0, DAY,  "day");
    breakDown(1.5, HOUR, "hour");
    breakDown(1.5, MIN,  "min");
    //-
    function breakDown(threshold, unit, unitName) {
      if (sec > (threshold * unit) || fmt.length > 0) {
        fmt += (sec / unit).toFixed() + " " + unitName + " ";
        sec %= unit;
      }
    }
    */

    return fmt + sec.toFixed(3) + " sec";
  }

}(selbench));
