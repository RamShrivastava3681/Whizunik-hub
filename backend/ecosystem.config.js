module.exports = {
  apps: [
    {
      name: 'whizunik-backend',
      script: 'server/index.cjs',
      cwd: process.cwd(),
      env_production: {
        NODE_ENV: 'production',
        PORT: 80
      },
      env_development: {
        NODE_ENV: 'development', 
        PORT: 80
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};