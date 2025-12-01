#!/bin/bash

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 使用 .nvmrc 中指定的 Node.js 版本
nvm use

# 运行开发服务器
npm run dev

