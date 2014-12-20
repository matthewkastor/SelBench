@echo off

SET extensionsDir=%~dp0..\selbench-fx-xpi\chrome\content\extensions
SET userExtensionDir=%~dp0..\user extension

SET copylist="%userExtensionDir%\scripts\config.js"+"%extensionsDir%\name-space.js"+"%extensionsDir%\logger.js"+"%extensionsDir%\function-intercepting.js"+"%extensionsDir%\selenium-executionloop-handleAsExpectError.js"+"%extensionsDir%\selbench.js"

copy %copylist% /B "%userExtensionDir%\user-extensions.js" /B


