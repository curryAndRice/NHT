@echo off
start chrome --new-window "http://localhost:5173"
start chrome --new-window "http://localhost:5173/admin"
npm run dev
