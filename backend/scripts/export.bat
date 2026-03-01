@echo off
setlocal EnableDelayedExpansion

:: Get the table name from the arguments
set "TABLE_NAME="
:parse_args
if "%~1"=="" goto check_table
if /i "%~1"=="--table" (
    set "TABLE_NAME=%~2"
    shift
    shift
    goto parse_args
)
:: Handle --table=name format
echo %~1 | findstr /b /c:"--table=" >nul
if not errorlevel 1 (
    for /f "tokens=2 delims==" %%a in ("%~1") do set "TABLE_NAME=%%a"
    shift
    goto parse_args
)
shift
goto parse_args

:check_table
if "!TABLE_NAME!"=="" (
    echo [ERROR] Please provide a table name using --table=name
    echo Example: npm run export -- --table=production_requests
    exit /b 1
)

:: Generate timestamp
set yyyy=%DATE:~-4%
set mm=%DATE:~4,2%
set dd=%DATE:~7,2%

set hour=%TIME:~0,2%
if "%hour:~0,1%" == " " set hour=0%hour:~1,1%
set min=%TIME:~3,2%
set sec=%TIME:~6,2%

set "TIMESTAMP=%yyyy%-%mm%-%dd%_%hour%-%min%-%sec%"
set "FILENAME=!TABLE_NAME!_export_!TIMESTAMP!.csv"

echo Exporting table '!TABLE_NAME!' to !FILENAME!...

:: Execute the Docker command
docker compose exec -T db psql -U user -d mydatabase -c "\copy !TABLE_NAME! TO STDOUT WITH CSV HEADER" > "!FILENAME!"

if !ERRORLEVEL! EQU 0 (
    echo [SUCCESS] Exported to: !FILENAME!
) else (
    echo [FAILED] Make sure the table '!TABLE_NAME!' exists and the database container is running.
)

endlocal
