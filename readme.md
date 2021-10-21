I don't have time to make this readme ... hear me out



download the exe file from release page and run it first time
it will download adb and set it self up

then you go to your android subsystem for windows settings
enable developer mode then you run it with argument `-d`
like so `apkas.exe -d`
it will connect to the android via adb

then all you have to do is, open a apk file with this app..
you click on it, run as, and then give it the path to this app(apkas.exe file)



it install the apk whenever you click on any apk file, it's gonna be that easy


notes:
- be carefull it will install as soon as you click on the file .. no prompt (it might change in a future update)

- you might need to set  subsystem resources to continuous, because it might not be able to connect to the android if it's not turned on

- you can change connected device by changing it in the config.json file, you can also set a path to the adb.exe file

- it will downlaod ~100mb of data from the internet if it can't find the adb.exe file and not present in the config.json file
