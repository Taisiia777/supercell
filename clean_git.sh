#!/bin/bash
# Сохраняем основной .git
find . -path "./.git" -prune -o -name ".git" -type d -print | while read git_dir; do
    echo "Удаление $git_dir"
    rm -rf "$git_dir"
done
