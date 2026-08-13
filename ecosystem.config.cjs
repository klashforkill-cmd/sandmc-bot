module.exports = {
  apps: [
    {
      name: 'sandmc-bot',
      script: 'index.js',
      watch: false,
      autorestart: true,       // يعيد التشغيل تلقائياً عند الانهيار
      max_restarts: 999,        // عدد غير محدود من إعادات التشغيل
      restart_delay: 5000,      // انتظر 5 ثوانٍ قبل إعادة التشغيل
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
