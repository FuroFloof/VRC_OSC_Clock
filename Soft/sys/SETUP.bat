@echo off
REM -----------------------------------------------------------------------------
REM  ----- SETUP -----
REM  Would you like to start this application with Windows?
REM -----------------------------------------------------------------------------

cd /d "%~dp0"

echo ------------------------------------------------------------
echo   ClockOSC - first-run configuration
echo ------------------------------------------------------------

:ask_boot
choice /M " Start ClockOSC automatically when Windows starts?"
if errorlevel 2 (
    REM User chose "No"
    if exist S_O_B del /f /q S_O_B >nul 2>&1
) else (
    REM User chose "Yes"
    echo.>S_O_B
)

choice /M " Start ClockOSC automatically when VRChat starts?"
if errorlevel 2 (
    REM User chose "No"
    if exist S_O_VRC del /f /q S_O_VRC >nul 2>&1
) else (
    REM User chose "Yes"
    echo.>S_O_VRC
)


REM Additional questions (e.g. Start with VRChat) could be inserted here.

REM Mark setup as complete so the Node app proceeds
echo.>SETUP_DONE

echo.
echo Setup complete!
pause >nul
exit /b 0
