@echo off
REM ============================================================
REM   Ocean Research Mission  -  Museum Kiosk Launcher
REM ------------------------------------------------------------
REM   Opens the experience in Chrome with background audio
REM   ALLOWED on every page (no need to click the speaker
REM   button after each page change), and in fullscreen kiosk
REM   mode with no browser toolbars.
REM
REM   BEFORE RUNNING: make sure your Live Server is running so
REM   the site is reachable at http://127.0.0.1:5500
REM   (In VS Code: right-click index.html -> "Open with Live Server")
REM
REM   TO EXIT kiosk/fullscreen: press  Alt + F4
REM ============================================================

start "" chrome --autoplay-policy=no-user-gesture-required --kiosk "http://127.0.0.1:5500/pages/index.html"
