@echo off
chcp 65001 > nul
echo ========================================================
echo  [오픈레이더] 신규 매장 자동 수집 및 클라우드 배포 실행기
echo ========================================================
echo.

cd /d "C:\Users\ktaeh\open-radar-web"

echo 1. 최신 인허가 데이터 수집 및 중복 정제 중...
python scripts\harvest_stores.py
if %ERRORLEVEL% neq 0 (
    echo [오류] 데이터 수집 스크립트 실행 실패
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. GitHub Cloud 실시간 배포 중...
git add live_businesses.json
git diff --staged --quiet
if %ERRORLEVEL% equ 0 (
    echo [안내] 새롭게 추가된 신규 매장이 없습니다.
) else (
    git commit -m "chore(auto): daily live stores update [%date%]"
    git push origin main
    echo [완료] 전국의 모든 오픈레이더 앱에 신규 매장이 자동 반영되었습니다!
)

echo.
echo ========================================================
echo  수집 및 배포 완료! 창을 닫으셔도 됩니다.
echo ========================================================
timeout /t 5 > nul
