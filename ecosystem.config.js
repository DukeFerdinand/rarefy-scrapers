
// Pull the deploy key from the environment variables
require('dotenv').config({
  path: './.env.deploy'
})

const sharedConfig  = {
    user : process.env.SSH_USER,
    host: process.env.SSH_HOST,
    ref  : 'origin/main',
    repo : process.env.GIT_REPO,
    path : process.env.DESTINATION,
}

module.exports = {
  apps : [
      {
          name: 'crawlers',
          script: 'dist/entrypoints/main.js',
          watch: '.',
          env_production: {
              NODE_ENV: 'production',
              WORKER_COUNT_PER_JOB:3,

              // populate these in the .env.deploy file
              DATABASE_URL: process.env.DATABASE_URL,
              LOGGER_API_KEY: process.env.LOGGER_API_KEY,
              LOGGER_API_ID: process.env.LOGGER_API_ID,
              REDIS_URL: process.env.REDIS_URL,
          }
      }
  ],

  deploy : {
      production : {
          ...sharedConfig,
          'pre-deploy': 'nvm install 18 && nvm use 18 && npm install -g pm2',
          'post-deploy':
              'npm install '+
              '&& npx prisma generate '+
              '&& npm run build '+
              '&& pm2 reload ecosystem.config.js --env production --name scraper',
        // copy .env file to the server before starting pm2
          'pre-deploy-local': '' +
              `ssh ${sharedConfig.user + '@' + sharedConfig.host} \'mkdir -p /var/www/rarefy-scrapers/current' && ` +
                'scp -r .env.deploy ' + sharedConfig.user + '@' + sharedConfig.host + ':' + process.env.DESTINATION + '.env.deploy',
      },
  }
};
