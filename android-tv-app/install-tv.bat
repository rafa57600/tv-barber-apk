@echo off
setlocal

if "%~1"=="" (
  echo Usage: install-tv.bat ^<TV_IP^>
  echo Example: install-tv.bat 192.168.1.50
  exit /b 1
)

set TV_IP=%~1
set APK_PATH=app\build\outputs\apk\release\app-release.apk

if not exist "%APK_PATH%" (
  echo Release APK not found: %APK_PATH%
  echo Build first with: gradlew.bat clean :app:assembleRelease
  exit /b 1
)

adb connect %TV_IP%:5555
adb install -r "%APK_PATH%"
adb shell monkey -p com.barbershop.tv -c android.intent.category.LEANBACK_LAUNCHER 1

echo Done.
