/* eslint-disable no-unused-vars */
const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
const MAX = 10000;

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();
  // START Challenge #7
  const key = keyGenerator.getRateLimiterKey(name, opts.maxHits);
  const transaction = client.multi();
  const requestTime = timeUtils.getCurrentTimestampMillis();
  const randVal = Math.random()*opts.maxHits*MAX;
  
  // implement sliding window rate limiter as sorted set with
  // score == time of request
  // queue up commands to implement in a transaction
  transaction.zadd(key, requestTime, randVal);
  transaction.zremrangebyscore(key, -Infinity, requestTime - opts.interval*60*1000);
  transaction.zcard(key);
  
  const results = await transaction.execAsync();
  const numHits = parseInt(results[2], 10);
  const capacity = opts.maxHits - numHits;
  if (capacity < 0){
    return -1;
  } else {
    return capacity; 
  }
  // END Challenge #7
};

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
/* eslint-enable */
