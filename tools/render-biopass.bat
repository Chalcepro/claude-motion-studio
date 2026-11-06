@echo off
title Briz BioPass render - leave this open
cd /d "%USERPROFILE%\Documents\github\claude-motion-studio"
set "LOG=%USERPROFILE%\Documents\Briz motion\biopass-render.log"
python tools\assemble_biopass.py > "%LOG%" 2>&1
if errorlevel 1 (echo FAILED>>"%LOG%" & exit /b 1)
