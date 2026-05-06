#!/bin/bash
set -e
B=http://localhost:4000

# truncate log so OTP grep is fresh
: > /tmp/quickhire.log
sleep 0.3

# USER login
curl -s -X POST $B/api/auth/send-otp -H 'content-type: application/json' -d '{"mobile":"9333333333","role":"user"}' >/dev/null
sleep 0.4
OTP=$(grep -aoE "OTP is [0-9]+" /tmp/quickhire.log | tail -1 | awk '{print $3}')
echo "user OTP=$OTP"
USER_TOKEN=$(curl -s -X POST $B/api/auth/verify-otp -H 'content-type: application/json' -d "{\"mobile\":\"9333333333\",\"otp\":\"$OTP\",\"fcmToken\":\"\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['token'])")
echo "USER_TOKEN_LEN=${#USER_TOKEN}"

# ADMIN login
: > /tmp/quickhire.log
curl -s -X POST $B/api/auth/send-otp -H 'content-type: application/json' -d '{"mobile":"9000000000","role":"admin"}' >/dev/null
sleep 0.4
AOTP=$(grep -aoE "OTP is [0-9]+" /tmp/quickhire.log | tail -1 | awk '{print $3}')
echo "admin OTP=$AOTP"
ADMIN_TOKEN=$(curl -s -X POST $B/api/auth/verify-otp -H 'content-type: application/json' -d "{\"mobile\":\"9000000000\",\"otp\":\"$AOTP\",\"role\":\"admin\",\"fcmToken\":\"\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['token'])")
echo "ADMIN_TOKEN_LEN=${#ADMIN_TOKEN}"

SVC=$(curl -s $B/api/services -H "authorization: Bearer $USER_TOKEN" | python3 -c "import json,sys;print(json.load(sys.stdin)['data'][0]['_id'])")
echo "serviceId=$SVC"

echo "=== pricing ==="
curl -s -X POST $B/api/jobs/pricing -H "authorization: Bearer $USER_TOKEN" -H 'content-type: application/json' -d "{\"serviceId\":\"$SVC\",\"duration\":4}" | python3 -m json.tool

echo "=== create booking ==="
START=$(date -u -v+2d '+%Y-%m-%dT09:00:00.000Z')
END=$(date -u -v+2d '+%Y-%m-%dT13:00:00.000Z')
BR=$(curl -s -X POST $B/api/bookings -H "authorization: Bearer $USER_TOKEN" -H 'content-type: application/json' -H 'idempotency-key: e2e-2' -d "{\"serviceId\":\"$SVC\",\"startTime\":\"$START\",\"endTime\":\"$END\",\"duration\":4,\"requirements\":\"admin flow test\"}")
BID=$(echo "$BR" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['_id'])")
echo "bookingId=$BID"

echo "=== admin dashboard ==="
curl -s $B/api/admin/dashboard -H "authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

echo "=== admin confirm ==="
curl -s -X POST $B/api/admin/bookings/$BID/confirm -H "authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool

echo "=== admin assign-pm ==="
PM_ID=$(mongosh quickhire --quiet --eval 'db.users.findOne({role:"pm"})._id.toString()')
echo "pm_id=$PM_ID"
curl -s -X POST $B/api/admin/bookings/$BID/assign-pm -H "authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' -d "{\"pmId\":\"$PM_ID\"}" | python3 -m json.tool

echo "=== final booking state ==="
curl -s "$B/api/bookings/$BID" -H "authorization: Bearer $USER_TOKEN" | python3 -m json.tool

echo "=== timeline ==="
curl -s "$B/api/bookingHistories/getBookingHistory?bookingId=$BID&serviceId=$SVC" -H "authorization: Bearer $USER_TOKEN" | python3 -m json.tool

echo "=== ticket create ==="
TR=$(curl -s -X POST $B/api/tickets/ticket -H "authorization: Bearer $USER_TOKEN" -H 'content-type: application/json' -d '{"subject":"Test ticket","description":"Need help"}')
echo "$TR" | python3 -m json.tool
TID=$(echo "$TR" | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['_id'])")

echo "=== ticket message ==="
curl -s -X POST $B/api/tickets/$TID/message -H "authorization: Bearer $USER_TOKEN" -H 'content-type: application/json' -d '{"msg":"Hi please help"}' | python3 -m json.tool

echo "=== chat upload-url ==="
curl -s -X POST $B/api/chat/upload-url -H "authorization: Bearer $USER_TOKEN" -H 'content-type: application/json' -d '{"mime":"image/png","size":1024,"name":"test.png"}' | python3 -m json.tool

echo "=== ALL OK ==="
