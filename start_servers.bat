@echo off
:: START BACKEND
start "Zeeklect-Backend" /D "d:\backup\FreeCourseApp\ai-learning-platform\backend" cmd /k "npm run dev"
:: START FRONTEND
start "Zeeklect-Frontend" /D "d:\backup\FreeCourseApp\ai-learning-platform\frontend" cmd /k "npm run dev"
echo Servers are starting in new windows...
