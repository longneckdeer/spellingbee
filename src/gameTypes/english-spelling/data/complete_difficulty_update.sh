#!/bin/bash
# Complete difficulty update and redistribution process

set -e  # Exit on error

echo "========================================================================"
echo "COMPLETE DIFFICULTY UPDATE PROCESS"
echo "========================================================================"

API_KEY="${ANTHROPIC_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY environment variable not set"
    exit 1
fi

cd "$(dirname "$0")"

echo ""
echo "Step 1: Recalculate MOE word difficulties (Taiwan context)"
echo "------------------------------------------------------------------------"
python3 recalculate_moe_difficulty.py

echo ""
echo "Step 2: Assess difficulty for words without CEFR"
echo "------------------------------------------------------------------------"
python3 assess_no_cefr_difficulty.py

echo ""
echo "Step 3: Redistribute words to correct level files"
echo "------------------------------------------------------------------------"
python3 redistribute_by_difficulty.py

echo ""
echo "========================================================================"
echo "✨ COMPLETE! All difficulties updated and words redistributed"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "  1. Review the redistributed files"
echo "  2. Run validation to check ranges"
echo "  3. Deploy to production"
