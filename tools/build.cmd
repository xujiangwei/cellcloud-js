@echo off

rem Author Jiangwei Xu
rem Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)
rem Cell Cloud Javascript Project Build Script

echo Cell Cloud Javascript Project Build Script
echo ------------------------------------------
echo Start ...
echo.

cd ..\

del bin\*.js

mkdir bin

rem megre files
for /f %%i in (build\filelist) do type %%i >> bin\nucleus.js

rem compress --nomunge
java -jar build\yuicompressor-2.4.8.jar -v --type js --charset utf-8 -o bin\nucleus-min.js bin\nucleus.js

rem console
java -jar build\yuicompressor-2.4.8.jar -v --type js --charset utf-8 -o bin\console-min.js src\extras\Console.js
java -jar build\yuicompressor-2.4.8.jar -v --type css --charset utf-8 -o bin\console-min.css src\extras\Console.css

echo.
echo ... End
echo Press any key to quit.
pause > nul
