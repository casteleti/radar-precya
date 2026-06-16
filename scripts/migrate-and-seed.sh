#!/bin/sh
# Roda migration e seed dentro do container na VPS
# Uso: ./scripts/migrate-and-seed.sh <nome-do-container> [email-do-seed]
#
# Exemplo:
#   ./scripts/migrate-and-seed.sh radar-precya-app-1
#   ./scripts/migrate-and-seed.sh radar-precya-app-1 ricardo@daksa.com.br

CONTAINER=${1:?Informe o nome do container: ./migrate-and-seed.sh <container>}
SEED_EMAIL=${2:-"ricardo@daksa.com.br"}

echo "📦 Container : $CONTAINER"
echo "📧 Seed email: $SEED_EMAIL"
echo ""

echo "🔄 Rodando migrations..."
docker exec "$CONTAINER" npx prisma migrate deploy
echo ""

echo "🌱 Rodando seed..."
docker exec -e SEED_EMAIL="$SEED_EMAIL" "$CONTAINER" npx ts-node prisma/seed.ts
