#!/usr/bin/env node

/**
 * Cache Infrastructure Smoke Test
 * Run this to verify Redis cache is working correctly
 * 
 * Usage: node scripts/test-cache.js
 */

import { getCacheValue, setCacheValue, deleteCacheValue, clearCachePattern, getOrSet, isRedisReady, getRedisStatus } from '../src/utils/cache.js';
import { redis } from '../src/config/redis.js';
import { logger } from '../src/config/logger.js';

const TESTS = [];

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

// Test suite
test('Redis connection', async () => {
  // Wait for Redis to be ready (async connect)
  let ready = false;
  for (let i = 0; i < 20; i++) {
    const status = getRedisStatus();
    if (status === 'ready') {
      ready = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready, `Redis should be ready within 2s`);
  logger.info('✅ Redis is ready');
});

test('Set and get cache value', async () => {
  const key = 'test:smoke:1';
  const value = { id: 123, name: 'Test Service' };
  
  const setResult = await setCacheValue(key, value, 10);
  assert(setResult === true, 'setCacheValue should return true');
  
  const cached = await getCacheValue(key);
  assert(cached !== null, 'getCacheValue should return cached value');
  assert(cached.id === value.id, 'Cached value should match');
  
  await deleteCacheValue(key);
  logger.info('✅ Set/get/delete cache works');
});

test('Cache TTL and expiration', async () => {
  const key = 'test:smoke:ttl';
  const value = { ttl: 'test' };
  
  await setCacheValue(key, value, 1); // 1 second TTL
  let cached = await getCacheValue(key);
  assert(cached !== null, 'Value should be cached immediately');
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  cached = await getCacheValue(key);
  assert(cached === null, 'Value should have expired');
  
  logger.info('✅ TTL and expiration works');
});

test('Delete cache values', async () => {
  const keys = ['test:smoke:del1', 'test:smoke:del2', 'test:smoke:del3'];
  
  // Set multiple values
  for (const key of keys) {
    await setCacheValue(key, { key }, 60);
  }
  
  // Verify they exist
  for (const key of keys) {
    const cached = await getCacheValue(key);
    assert(cached !== null, `Value should exist for ${key}`);
  }
  
  // Delete all
  await deleteCacheValue(keys);
  
  // Verify they're gone
  for (const key of keys) {
    const cached = await getCacheValue(key);
    assert(cached === null, `Value should be deleted for ${key}`);
  }
  
  logger.info('✅ Delete multiple keys works');
});

test('Clear cache pattern', async () => {
  // Set values with pattern
  await setCacheValue('test:pattern:1', { v: 1 }, 60);
  await setCacheValue('test:pattern:2', { v: 2 }, 60);
  await setCacheValue('test:pattern:3', { v: 3 }, 60);
  await setCacheValue('test:other:1', { v: 'other' }, 60);
  
  // Clear pattern
  await clearCachePattern('test:pattern:*');
  
  // Verify pattern keys are gone but other remains
  const p1 = await getCacheValue('test:pattern:1');
  const p2 = await getCacheValue('test:pattern:2');
  const other = await getCacheValue('test:other:1');
  
  assert(p1 === null, 'Pattern key 1 should be deleted');
  assert(p2 === null, 'Pattern key 2 should be deleted');
  assert(other !== null, 'Other key should remain');
  
  // Cleanup
  await deleteCacheValue(['test:other:1']);
  
  logger.info('✅ Clear cache pattern works');
});

test('getOrSet pattern', async () => {
  const key = 'test:getOrSet:1';
  let callCount = 0;
  
  const getter = async () => {
    callCount++;
    return { id: 1, name: 'Fresh' };
  };
  
  // First call - should fetch fresh
  const result1 = await getOrSet(key, getter, 10);
  assert(callCount === 1, 'Getter should be called once');
  assert(result1.name === 'Fresh', 'Should return fresh value');
  
  // Second call - should get from cache
  const result2 = await getOrSet(key, getter, 10);
  assert(callCount === 1, 'Getter should not be called again');
  assert(result2.name === 'Fresh', 'Should return cached value');
  
  await deleteCacheValue(key);
  logger.info('✅ getOrSet pattern works');
});

test('Handle Redis errors gracefully', async () => {
  // Test should not throw even if something fails
  try {
    const value = await getCacheValue('any:key');
    logger.info('✅ Cache operations don\'t throw on errors');
  } catch (err) {
    throw new Error('Cache should handle errors gracefully');
  }
});

// Run all tests
async function runTests() {
  logger.info(`Starting ${TESTS.length} cache tests...\n`);
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, fn } of TESTS) {
    try {
      await fn();
      passed++;
    } catch (err) {
      logger.error(`${name}: ${err.message}`);
      failed++;
    }
  }
  
  logger.info(`\n✅ ${passed} passed, ❌ ${failed} failed`);
  
  await redis.quit();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  logger.fatal({ err }, 'Test suite failed');
  process.exit(1);
});
