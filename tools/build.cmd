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
for /f %%i in (tools\filelist_win) do type %%i >> bin\nucleus.js

rem compress --nomunge
java -jar tools\yuicompressor-2.4.8.jar -v --type js --charset utf-8 -o bin\nucleus-min.js bin\nucleus.js

echo.
echo ... End
echo Press any key to quit.
pause > nul
