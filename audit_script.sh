#!/bin/bash
BASE_URL="http://localhost:3000"
LOG_FILE="api_test_results.md"

echo "# 🧪 E-comus API Professional Audit Cache" > $LOG_FILE
echo "Generated at: $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

test_endpoint() {
  local method=$1
  local path=$2
  local body=$3
  local token=$4
  local title=$5

  echo "### $title" >> $LOG_FILE
  echo "**Endpoint**: \`$method $path\`" >> $LOG_FILE
  
  local auth_header=""
  if [ ! -z "$token" ]; then
    auth_header="-H 'Authorization: Bearer $token'"
  fi

  local response
  if [ "$method" == "POST" ] || [ "$method" == "PATCH" ]; then
    response=$(curl -s -X $method "$BASE_URL$path" -H "Content-Type: application/json" $auth_header -d "$body")
  else
    response=$(curl -s -X $method "$BASE_URL$path" $auth_header)
  fi

  echo "**Response**:" >> $LOG_FILE
  echo "\`\`\`json" >> $LOG_FILE
  echo "$response" | jq . 2>/dev/null || echo "$response" >> $LOG_FILE
  echo "\`\`\`" >> $LOG_FILE
  echo "---" >> $LOG_FILE
}

echo "## Cluster 1: Public Interface" >> $LOG_FILE
test_endpoint "GET" "/health" "" "" "Health Check"
test_endpoint "GET" "/api/categories" "" "" "List Categories"
test_endpoint "GET" "/api/public/products?limit=1" "" "" "Fetch Single Product"

echo "## Cluster 2: Identity & Admin Actions" >> $LOG_FILE
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/users/login" -H "Content-Type: application/json" -d '{"email": "admin@admin.com", "password": "admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.token' 2>/dev/null)

if [ "$ADMIN_TOKEN" != "null" ]; then
  test_endpoint "POST" "/api/categories" '{"name": "AUDIT_GADGETS", "description": "System verified"}' "$ADMIN_TOKEN" "Create Category (Admin)"
else
  echo "> [!ERROR] Admin login failed for audit." >> $LOG_FILE
fi

echo "## Cluster 3: User Flow" >> $LOG_FILE
USER_EMAIL="tester_audit_$(date +%s)@example.com"
REG=$(curl -s -X POST "$BASE_URL/api/auth/users/register" -H "Content-Type: application/json" -d "{\"email\": \"$USER_EMAIL\", \"password\": \"password123\"}")
LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/users/login" -H "Content-Type: application/json" -d "{\"email\": \"$USER_EMAIL\", \"password\": \"password123\"}")
USER_TOKEN=$(echo $LOGIN | jq -r '.data.token' 2>/dev/null)

if [ "$USER_TOKEN" != "null" ]; then
  test_endpoint "GET" "/api/auth/users/me" "" "$USER_TOKEN" "Access Profile (User)"
  test_endpoint "POST" "/api/auth/orders/buy" '{"productId": "any", "quantity": 9999}' "$USER_TOKEN" "Direct Buy (Stock Failure Check)"
else
  echo "> [!ERROR] User registration/login failed for audit." >> $LOG_FILE
fi

echo "🚀 Audit script execution complete."
