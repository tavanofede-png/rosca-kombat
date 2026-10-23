@echo off
cd /d "%~dp0"
node scripts/play-pc.mjs
if errorlevel 1 pause
