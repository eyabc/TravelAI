

# 🛠️ Redis Lua Script로 번역 캐시 최적화

본 문서는 TravelAI의 번역 캐시 조회/저장 동작을 Redis Lua Script를 통해 원자적으로 처리하는 예제를 설명합니다.

---

## 🎯 목적

- 캐시 조회 & 저장을 **원자적**으로 수행
- 중복 API 호출 방지
- TTL 설정 및 존재 여부 검사를 1회 I/O로 처리

---

## 📦 Lua 스크립트 예제

```lua
-- translate_cache.lua
local key = KEYS[1]
local ttl = tonumber(ARGV[1])
local value = ARGV[2]

if redis.call("EXISTS", key) == 1 then
  return redis.call("GET", key)
else
  redis.call("SETEX", key, ttl, value)
  return value
end
```

---

## 🚀 호출 예시 (ioredis)

```ts
const luaScript = fs.readFileSync('./translate_cache.lua', 'utf8');
const result = await redis.eval(luaScript, 1, cacheKey, 604800, JSON.stringify(result));
```

---

## 🔄 사용 흐름

1. 캐시 키 존재 여부 확인 (`EXISTS`)
2. 있으면 기존 번역 결과 반환
3. 없으면 새 번역 결과 저장 (`SETEX`)
4. 결과 반환

---

## 🧪 테스트 포인트

- TTL 설정이 정확히 적용되는지 (`EXPIRE`)
- 중복 요청 시 외부 번역 API 호출이 생략되는지
- 캐시된 응답이 정확히 반환되는지

---

## 💡 확장 아이디어

- 결과를 JSON으로 받아 `translatedText`, `provider`, `timestamp` 포함
- 응답 크기에 따라 GZIP 압축 후 저장
- Prometheus로 Lua hit/miss 지표 수집
