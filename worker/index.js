const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  url: `redis://${keys.redisHost}:${keys.redisPort}`,
});

const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

(async () => {
  await redisClient.connect();
  await sub.connect();

  await sub.subscribe('insert', async (message) => {
    const result = fib(parseInt(message));
    await redisClient.hSet('values', message, result);
  });
})();
