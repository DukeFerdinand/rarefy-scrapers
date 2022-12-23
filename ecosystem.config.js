
// Pull the deploy key from the environment variables
require('dotenv').config({
  path: './.env.deploy'
})

module.exports = {
  apps : [{
    script: 'dist/index.js',
    watch: '.',
    env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        WORKER_COUNT_PER_JOB:3,

        // populate these in the .env.deploy file
        DATABASE_URL: process.env.DATABASE_URL,
        LOGGER_API_KEY: process.env.LOGGER_API_KEY,
        LOGGER_API_ID: process.env.LOGGER_API_ID,
        REDIS_URL: process.env.REDIS_URL,
    }
  }],

  deploy : {
    production : {
      user : process.env.SSH_USER,
      host : process.env.SSH_HOST,
      ref  : 'origin/main',
      repo : process.env.GIT_REPO,
      path : process.env.DESTINATION,
      'pre-deploy-local': '',
      'post-deploy' :
          '/root/.nvm/versions/node/v18.12.1/bin/npm install '+
          '&& /root/.nvm/versions/node/v18.12.1/bin/npx prisma generate '+
          '&& npm run build '+
          '&& pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'ls ' + process.env.DESTINATION
    }
  }
};
