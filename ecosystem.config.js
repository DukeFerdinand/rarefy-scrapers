
// Pull the deploy key from the environment variables
require('dotenv').config({
  path: './.env.deploy'
})

const sharedConfig  = {
    user : process.env.SSH_USER,
    ref  : 'origin/main',
    repo : process.env.GIT_REPO,
    path : process.env.DESTINATION,
}

module.exports = {
  apps : [
      {
          name: 'scraper',
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
      },
      {
          name: 'image_processor',
          script: 'dist/index.js',
          watch: '.',
          env_production: {
              NODE_ENV: 'production',
              PORT: 3000,
              WORKER_COUNT_PER_JOB: 4,

              // populate these in the .env.deploy file
              DATABASE_URL: process.env.DATABASE_URL,
              LOGGER_API_KEY: process.env.LOGGER_API_KEY,
              LOGGER_API_ID: process.env.LOGGER_API_ID,
              REDIS_URL: process.env.REDIS_URL,
          }
      }
  ],

  deploy : {
      scraper_production : {
          ...sharedConfig,
          host: process.env.SSH_HOST_SCRAPER,
          'pre-deploy': 'nvm install 18 && nvm use 18',
          'post-deploy':
              'npm install '+
              '&& npx prisma generate '+
              '&& npm run build '+
              '&& pm2 reload ecosystem.config.js --env production --name scraper',
        // copy .env file to the server before starting pm2
          'pre-deploy-local': '' +
              `ssh ${process.env.SSH_USER + '@' + process.env.SSH_HOST_SCRAPER} \'mkdir -p /var/www/rarefy-scrapers/current' && ` +
                'scp -r .env.deploy ' + process.env.SSH_USER + '@' + process.env.SSH_HOST_SCRAPER + ':' + process.env.DESTINATION + '.env.deploy',
      },
      processor_production: {
          ...sharedConfig,
          host: process.env.SSH_HOST_PROCESSOR,
          'pre-deploy': 'nvm install 18 && nvm use 18',
          'post-deploy' :
              'npm install '+
              '&& npx prisma generate ' +
              '&& npm run build ' +
              '&& pm2 reload ecosystem.config.js --env production --name image_processor',
          // copy .env file to the server before starting pm2
          'pre-deploy-local': '' +
              `ssh ${process.env.SSH_USER + '@' + process.env.SSH_HOST_PROCESSOR} \'mkdir -p /var/www/rarefy-scrapers/current' && ` +
              'scp -r .env.deploy ' + process.env.SSH_USER + '@' + process.env.SSH_HOST_PROCESSOR + ':' + process.env.DESTINATION + '/current/.env.deploy',
      }
  }
};
