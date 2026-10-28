@echo off
REM =========================================================================================
REM Script bien dich & nap firmware HydroWatch cho NodeMCU ESP8266 (ban CMD)
REM =========================================================================================
REM TAI SAO CAN SCRIPT NAY?
REM   Core ESP8266 (mkbuildoptglobals.py) khong xu ly duoc ky tu tieng Viet co dau trong
REM   duong dan. Bien dich truc tiep tai "D:\IOT\do an\firmware" se loi UnicodeEncodeError.
REM   Script copy sketch sang thu muc tam co duong dan ASCII thuan roi moi bien dich.
REM
REM CACH DUNG
REM   build.bat                 - chi bien dich
REM   build.bat upload COM5     - bien dich roi nap vao COM5
REM   build.bat list            - liet ke cong COM dang co
REM =========================================================================================

setlocal enabledelayedexpansion

set "SKETCH_NAME=water_pressure_node"
set "FQBN=esp8266:esp8266:nodemcuv2"
set "BUILD_ROOT=%TEMP%\hydrowatch_build"
set "SRC_DIR=%~dp0%SKETCH_NAME%"

REM --- Tim arduino-cli ---------------------------------------------------------------
set "CLI="
where arduino-cli >nul 2>&1 && set "CLI=arduino-cli"
if not defined CLI (
  if exist "C:\Program Files\Arduino CLI\arduino-cli.exe" (
    set "CLI=C:\Program Files\Arduino CLI\arduino-cli.exe"
  )
)
if not defined CLI (
  echo [LOI] Khong tim thay arduino-cli.
  echo       Cai bang: winget install ArduinoSA.CLI
  exit /b 127
)

REM --- Lenh phu: liet ke cong --------------------------------------------------------
if /i "%~1"=="list" (
  "%CLI%" board list
  exit /b %ERRORLEVEL%
)

if not exist "%SRC_DIR%\%SKETCH_NAME%.ino" (
  echo [LOI] Khong thay "%SRC_DIR%\%SKETCH_NAME%.ino"
  exit /b 1
)

REM --- Copy sang duong dan ASCII thuan -----------------------------------------------
echo [1/2] Copy sketch sang duong dan ASCII: %BUILD_ROOT%
if exist "%BUILD_ROOT%" rmdir /s /q "%BUILD_ROOT%"
mkdir "%BUILD_ROOT%" >nul 2>&1
xcopy "%SRC_DIR%" "%BUILD_ROOT%\%SKETCH_NAME%\" /e /i /q >nul

REM --- Bien dich ----------------------------------------------------------------------
echo [2/2] Bien dich (FQBN: %FQBN%)
pushd "%BUILD_ROOT%"
"%CLI%" compile --fqbn %FQBN% %SKETCH_NAME%
set "COMPILE_RC=%ERRORLEVEL%"
popd

if not "%COMPILE_RC%"=="0" (
  echo.
  echo [THAT BAI] Bien dich loi, ma thoat %COMPILE_RC%
  exit /b %COMPILE_RC%
)

echo.
echo [OK] Bien dich thanh cong.

REM --- Nap (tuy chon) -----------------------------------------------------------------
if /i "%~1"=="upload" (
  if "%~2"=="" (
    echo [LOI] Thieu cong COM. Vi du: build.bat upload COM5
    echo       Xem cong dang co: build.bat list
    exit /b 2
  )
  echo.
  echo [3/3] Nap vao %~2
  pushd "%BUILD_ROOT%"
  "%CLI%" upload -p %~2 --fqbn %FQBN% %SKETCH_NAME%
  set "UPLOAD_RC=!ERRORLEVEL!"
  popd
  if not "!UPLOAD_RC!"=="0" exit /b !UPLOAD_RC!
  echo [OK] Nap xong.
)

endlocal
