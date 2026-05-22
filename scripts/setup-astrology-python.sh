#!/usr/bin/env bash
# Creates a venv OUTSIDE the Next.js project tree (avoids Turbopack symlink errors).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="${BAZI_ASTROLOGY_VENV:-$(dirname "$ROOT")/.venv-bazi-astrology}"

echo "Creating astrology venv at: $VENV"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$ROOT/requirements.txt"

ENV_FILE="$ROOT/.env.local"
PYTHON_LINE="ASTROLOGY_PYTHON=$VENV/bin/python"
if [[ -f "$ENV_FILE" ]] && grep -q '^ASTROLOGY_PYTHON=' "$ENV_FILE"; then
  echo "ASTROLOGY_PYTHON already set in .env.local"
else
  echo "" >> "$ENV_FILE"
  echo "# Astrology (pyswisseph) — added by scripts/setup-astrology-python.sh" >> "$ENV_FILE"
  echo "$PYTHON_LINE" >> "$ENV_FILE"
  echo "Appended to .env.local: $PYTHON_LINE"
fi

echo "Done. Test:"
echo "  $VENV/bin/python -c \"import swisseph; print('ok', swisseph.__version__)\""
echo "Restart: npm run dev"
