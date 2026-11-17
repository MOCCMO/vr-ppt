#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  python3 serve.py
else
  print '这台电脑尚未安装 Python 3。可将课件交给网站管理员发布后，通过网址打开。'
  read -r '?按回车关闭窗口。'
fi
