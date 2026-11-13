@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title AI Fitness Coach
set "FITNESS_NODE="
if exist ".local\node-path.txt" for /f "usebackq delims=" %%N in (".local\node-path.txt") do if exist "%%N" set "FITNESS_NODE=%%N"
if defined FITNESS_NODE goto run
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined FITNESS_NODE set "FITNESS_NODE=%%N"
if defined FITNESS_NODE goto run
if exist "%ProgramFiles%\nodejs\node.exe" set "FITNESS_NODE=%ProgramFiles%\nodejs\node.exe"
if defined FITNESS_NODE goto run
for /d %%D in ("%ProgramFiles%\WindowsApps\OpenAI.CodexPrimaryRuntime*") do if exist "%%D\dependencies\node\bin\node.exe" set "FITNESS_NODE=%%D\dependencies\node\bin\node.exe"
if defined FITNESS_NODE goto run
echo 找不到 Node.js，請安裝 Node.js 22.12 以上版本後再試。
pause
exit /b 1
:run
"%FITNESS_NODE%" scripts\start-local.mjs
if errorlevel 1 pause
endlocal
