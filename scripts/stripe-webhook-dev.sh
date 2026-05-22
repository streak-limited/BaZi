#!/usr/bin/env bash
# Forward Stripe test events to local Next.js webhook handler.
set -euo pipefail
PORT="${PORT:-3000}"
URL="http://localhost:${PORT}/api/stripe/webhook"
echo "→ Forwarding checkout.session.completed to ${URL}"
echo "→ Copy the signing secret (whsec_…) into .env.local:"
echo "     STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
exec stripe listen --forward-to "${URL}" --events checkout.session.completed
