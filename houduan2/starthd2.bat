@echo off
title Hakimi Service
cd /d "C:\Users\admin\Desktop\houduan2\node_bridge"
start /b node bridge.js > hakimi.log 2>&1
exit