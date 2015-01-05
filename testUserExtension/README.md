#Running Tests

When running the tests, the user-extensions.js file is rebuilt.

```
C:\projects
    \---selenium
        +---selbench
        |   \---SelBench
        |       +---build
        |       +---selbench-fx-xpi
        |       |   \---chrome
        |       |       +---content
        |       |       |   \---extensions
        |       |       \---skin
        |       +---selbenchTests
        |       +---testUserExtension
        |       \---user extension
        |           \---scripts
        +---server
                chromedriver.exe
                IEDriverServer.exe
                selenium-server-standalone-2.43.1.jar
```

Setup your project directory as shown above, then run
 `C:\projects\selenium\selbench\SelBench\testUserExtension\runTestsOnServer.cmd`
 to launch the automatic tests.
 
As soon as the automatic tests complete, the results should open in your
 browser. The server should restart in debug mode and the page to the test suite
 should open automatically. In order to work in debug mode your browser will
 have to be configured to use the selenium server as it's proxy. By default the
 host is `localhost` and the port is `4444`. It's best to use a separate profile
 for running tests, especially if you want to use the web to look things up while
 you debug. The selenium server can proxy https, but you have to accept the
 hacked certificate from "cybervillains" in order to do it. Just make a separate
 profile in firefox and you'll be fine. Don't do it in IE, the cert will take
 effect for everyone, all the time, and you'll have to remember to remove the
 cert when you're done so you don't get hacked and sold for parts.
 
See also: http://selenium.googlecode.com/git-history/rc-0.9.2/website/tutorial.html