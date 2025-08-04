@echo off
echo =================================
echo Git Add, Commit, and Push Script
echo =================================
echo.

REM Check if we're in a git repository
git status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Not a git repository or git is not installed
    pause
    exit /b 1
)

REM Show current status
echo Current git status:
git status --short
echo.

REM Check if there are any changes to commit
git diff-index --quiet HEAD --
if %ERRORLEVEL% equ 0 (
    echo No changes to commit.
    pause
    exit /b 0
)

REM Add all changes
echo Adding all changes...
git add .
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to add changes
    pause
    exit /b 1
)

 

REM Commit changes
echo Committing changes...
git commit -m "Initial commit"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to commit changes
    pause
    exit /b 1
)

REM Push to remote
echo Pushing to remote repository...
git push
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to push to remote repository
    echo You may need to set up a remote repository or check your credentials
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS: All changes have been committed and pushed!
echo.
pause
