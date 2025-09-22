#!/bin/bash
CWD=`CPWD=$(pwd);cd $(dirname \$0);pwd;cd \$CPWD`
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd $CWD/dist
nvm use
npm install
npm run start:prod -- $@