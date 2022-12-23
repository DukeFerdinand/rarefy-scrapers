
// Pull the deploy key from the environment variables
require('dotenv').config({
  path: './.env.deploy'
})

module.exports = {
  apps : [{
    script: 'dist/index.js',
    watch: '.'
  }],

  deploy : {
    production : {
      user : process.env.SSH_USER,
      host : process.env.SSH_HOST,
      ref  : 'origin/main',
      repo : process.env.GIT_REPO,
      path : process.env.DESTINATION,
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
