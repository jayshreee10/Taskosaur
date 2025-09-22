require('dotenv').config();
const path = require('path');

const baseDir = path.join(__dirname);

const deploymentEnvSuffix = process.env.APP_ENV ? `-${process.env.APP_ENV}` : "";

module.exports = {
  apps: [
    {
      name: `taskosaur${deploymentEnvSuffix}`,
      script: `${baseDir}/run-server.sh`,
      args: `-H ${process.env.APP_HOST} -p ${process.env.APP_PORT}`,
      exec_mode: 'fork'
    }
  ],
};
