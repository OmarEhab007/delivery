#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
TS=$(date +%s)

ADMIN_EMAIL=${ADMIN_EMAIL:-admin@deliveryapp.com}
ADMIN_PASS=${ADMIN_PASS:-admin123456}

MERCHANT_EMAIL="merchant_${TS}@example.com"
MERCHANT_PASS="pass1234"
TRUCK_EMAIL="truckowner_${TS}@example.com"
TRUCK_PASS="pass1234"

require_success() {
  local label="$1"
  local resp="$2"
  if ! RESP="$resp" python3 - <<'PY'
import json,os,sys
try:
    data=json.loads(os.environ['RESP'])
except Exception:
    print('Non-JSON response')
    sys.exit(1)
status=data.get('status')
success=data.get('success')
if status in ('success', 'ok') or success is True:
    sys.exit(0)
print(data)
sys.exit(1)
PY
  then
    echo "Step failed: ${label}"
    echo "${resp}"
    exit 1
  fi
}

health=$(curl -sS "$BASE_URL/health")
require_success "health" "$health"

# Admin login
admin_login=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
require_success "admin_login" "$admin_login"
admin_token=$(RESP="$admin_login" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('accessToken',''))
PY
)

# Register merchant and truck owner (approval flow)
merchant_reg=$(curl -sS -X POST "$BASE_URL/api/auth/register/merchant" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Merchant ${TS}\",\"email\":\"$MERCHANT_EMAIL\",\"password\":\"$MERCHANT_PASS\",\"phone\":\"1234567890\",\"role\":\"Merchant\"}")
require_success "merchant_register" "$merchant_reg"
merchant_req=$(RESP="$merchant_reg" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('data',{}).get('requestId',''))
PY
)

truck_reg=$(curl -sS -X POST "$BASE_URL/api/auth/register/truckOwner" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Truck Owner ${TS}\",\"email\":\"$TRUCK_EMAIL\",\"password\":\"$TRUCK_PASS\",\"phone\":\"1234567890\",\"role\":\"TruckOwner\",\"companyName\":\"TO Co\",\"companyAddress\":\"789 Owner Rd\"}")
require_success "truck_owner_register" "$truck_reg"
truck_req=$(RESP="$truck_reg" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('data',{}).get('requestId',''))
PY
)

# Approve requests
approve_merchant=$(curl -sS -X PATCH -H "Authorization: Bearer $admin_token" \
  "$BASE_URL/api/admin/registration-requests/$merchant_req/approve")
require_success "approve_merchant" "$approve_merchant"

approve_truck=$(curl -sS -X PATCH -H "Authorization: Bearer $admin_token" \
  "$BASE_URL/api/admin/registration-requests/$truck_req/approve")
require_success "approve_truck_owner" "$approve_truck"

# Login merchant and truck owner
merchant_login=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$MERCHANT_EMAIL\",\"password\":\"$MERCHANT_PASS\"}")
require_success "merchant_login" "$merchant_login"
merchant_token=$(RESP="$merchant_login" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('accessToken',''))
PY
)

truck_login=$(curl -sS -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$TRUCK_EMAIL\",\"password\":\"$TRUCK_PASS\"}")
require_success "truck_owner_login" "$truck_login"
truck_token=$(RESP="$truck_login" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('accessToken',''))
PY
)

# Create shipment as merchant (bearer auth should not require CSRF)
shipment_create=$(curl -sS -X POST "$BASE_URL/api/shipments" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $merchant_token" \
  -d '{"origin":{"address":"123 Origin St","city":"Cairo","country":"EG"},"destination":{"address":"456 Dest Ave","city":"Alexandria","country":"EG"},"cargoDetails":{"description":"Pallets","weight":12.5},"pricingType":"BIDDING"}')
require_success "shipment_create" "$shipment_create"
shipment_id=$(RESP="$shipment_create" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('data',{}).get('shipment',{}).get('_id',''))
PY
)

# Approve shipment as admin
shipment_approve=$(curl -sS -X PATCH -H "Authorization: Bearer $admin_token" \
  "$BASE_URL/api/admin/shipments/$shipment_id/approve")
require_success "shipment_approve" "$shipment_approve"

# Truck owner available shipments
available=$(curl -sS -H "Authorization: Bearer $truck_token" \
  "$BASE_URL/api/truck-owner/shipments/available")
require_success "truck_owner_available_shipments" "$available"

count=$(RESP="$available" python3 - <<'PY'
import json,os
print(json.loads(os.environ['RESP']).get('data',{}).get('count'))
PY
)

if [[ -z "$count" || "$count" == "0" ]]; then
  echo "No available shipments returned"
  exit 1
fi

echo "Smoke test passed"
