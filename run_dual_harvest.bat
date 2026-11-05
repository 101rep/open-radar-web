@echo off
chcp 65001 > nul

set SLOT=%1
if "%SLOT%"=="" set SLOT=morning

echo ========================================================
echo  [오픈레이더] 신규 매장 듀얼 자동 수집 및 배포 [%SLOT%]
echo  실행 시각: %date% %time%
echo ========================================================

cd /d "C:\Users\ktaeh\open-radar-web"

python scripts\harvest_dual.py --slot %SLOT%
if %ERRORLEVEL% neq 0 (
    echo [오류] 수집 스크립트 실행 실패
    exit /b %ERRORLEVEL%
)

git add live_businesses.json
git diff --staged --quiet
if %ERRORLEVEL% equ 0 (
    echo [안내] 새로 추가된 변경 사항이 없습니다.
) else (
    git commit -m "chore(dual-sync): %SLOT% live stores sync [%date% %time%]"
    git push origin main
    echo [성공] 깃허브 클라우드 배포 완료! 전국의 모든 앱 사용자에게 최신 매장이 자동 동기화됩니다.
)

echo ========================================================
echo  [완료] 오픈레이더 듀얼 수집 및 배포가 완료되었습니다.
echo ========================================================
