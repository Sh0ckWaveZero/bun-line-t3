#!/bin/bash
# Bundle Optimization Helper Script
# Usage: ./scripts/optimize-bundle.sh [phase]

set -e

PHASE=${1:-"analyze"}

echo "🚀 Bundle Optimization Tool"
echo "============================"
echo ""

case "$PHASE" in
  "analyze")
    echo "📈 Running production build for bundle analysis..."
    bun run build

    echo ""
    echo "📦 Largest client bundles:"
    find dist/client/assets -type f \( -name "*.js" -o -name "*.css" \) -exec du -h {} + | sort -hr | head -10
    ;;

  "measure")
    echo "📏 Measuring current bundle sizes..."
    echo ""

    bun run build > build-output.txt 2>&1

    echo ""
    echo "📊 Bundle Size Summary:"
    echo "======================="
    find dist/client/assets -type f \( -name "*.js" -o -name "*.css" \) -exec du -h {} + | sort -hr | head -20

    echo ""
    echo "💾 Full output saved to: build-output.txt"
    ;;

  "fonts")
    echo "🔤 Optimizing font loading..."
    echo ""
    echo "ℹ️  Manual step required:"
    echo "   1. Edit src/routes/__root.tsx or the relevant provider/layout file"
    echo "   2. Update Prompt font configuration:"
    echo ""
    echo "   weight: ['300', '400', '600'], // Reduced from 9 weights"
    echo "   style: ['normal'], // Removed italic"
    echo ""
    echo "   3. Test the application to ensure UI looks correct"
    echo "   4. Run: bun run build to verify size reduction"
    ;;

  "charts")
    echo "📊 Setting up Chart.js optimization..."
    echo ""
    echo "ℹ️  Creating optimized chart configuration..."

    # Create optimized chart registration file
    cat > src/lib/chart-registration.ts << 'EOF'
/**
 * Optimized Chart.js registration
 * Tree-shakeable imports for smaller bundle size
 */
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register only the components we use
ChartJS.register(
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

export { ChartJS };
EOF

    echo "✅ Created src/lib/chart-registration.ts"
    echo ""
    echo "ℹ️  Next steps:"
    echo "   1. Import from this file instead of 'chart.js' directly"
    echo "   2. Update chart components to use dynamic imports"
    echo "   3. Run: bun run build to verify reduction"
    ;;

  "packages")
    echo "📦 Reviewing package-level chunking for Vite/TanStack Start..."
    echo ""
    echo "ℹ️  Manual step required:"
    echo "   Review heavy packages for route-level lazy loading:"
    echo ""
    echo "   - chart.js / react-chartjs-2"
    echo "   - d3"
    echo "   - heavy route-only utilities"
    echo "   - large Thai name generator datasets"
    ;;

  "test")
    echo "🧪 Running optimization test suite..."
    echo ""

    # Measure before
    echo "1️⃣ Building current version..."
    bun run build > /tmp/before-build.txt 2>&1
    BEFORE_SIZE=$(find dist/client/assets -type f -name "*.js" -exec du -ch {} + | tail -1 | awk '{print $1}')

    echo "   Current size: $BEFORE_SIZE"
    echo ""
    echo "2️⃣ Apply optimizations and rebuild to compare"
    echo "   Run: ./scripts/optimize-bundle.sh measure"
    echo "   to see detailed breakdown"
    ;;

  "all")
    echo "🔥 Running full optimization workflow..."
    echo ""

    echo "Step 1: Installing dependencies..."
    bun add -D @next/bundle-analyzer

    echo ""
    echo "Step 2: Measuring baseline..."
    bun run build > baseline-build.txt 2>&1

    echo ""
    echo "Step 3: Creating optimization files..."
    $0 charts

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📝 Next manual steps:"
    echo "   1. Optimize fonts: $0 fonts"
    echo "   2. Update package imports: $0 packages"
    echo "   3. Rebuild and compare: $0 test"
    ;;

  *)
    echo "❌ Unknown phase: $PHASE"
    echo ""
    echo "Available phases:"
    echo "  analyze  - Install and run bundle analyzer"
    echo "  measure  - Measure current bundle sizes"
    echo "  fonts    - Instructions for font optimization"
    echo "  charts   - Set up Chart.js optimization"
    echo "  packages - Instructions for package optimization"
    echo "  test     - Test optimization impact"
    echo "  all      - Run complete optimization workflow"
    echo ""
    echo "Usage: $0 [phase]"
    exit 1
    ;;
esac

echo ""
echo "✨ Done!"
