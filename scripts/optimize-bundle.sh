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
    echo "📊 Installing bundle analyzer..."
    bun add -D @next/bundle-analyzer

    echo ""
    echo "📈 Running bundle analysis..."
    ANALYZE=true bun run build

    echo ""
    echo "✅ Analysis complete! Check .next/analyze/ for reports"
    echo "   - Open client.html in your browser for client bundle"
    echo "   - Open server.html in your browser for server bundle"
    ;;

  "measure")
    echo "📏 Measuring current bundle sizes..."
    echo ""

    # Build without Turbopack for accurate measurements
    bun run tailwind:build
    next build 2>&1 | tee build-output.txt

    echo ""
    echo "📊 Bundle Size Summary:"
    echo "======================="
    grep -E "First Load JS|Route" build-output.txt | head -20

    echo ""
    echo "💾 Full output saved to: build-output.txt"
    ;;

  "fonts")
    echo "🔤 Optimizing font loading..."
    echo ""
    echo "ℹ️  Manual step required:"
    echo "   1. Edit src/app/layout.tsx"
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
    echo "📦 Optimizing package imports in next.config.mjs..."
    echo ""
    echo "ℹ️  Manual step required:"
    echo "   Add these packages to optimizePackageImports:"
    echo ""
    echo "   optimizePackageImports: ["
    echo "     'date-fns',"
    echo "     'date-fns-tz',"
    echo "     'zod',"
    echo "     'lucide-react',"
    echo "     'chart.js',"
    echo "     'react-chartjs-2',"
    echo "   ],"
    ;;

  "test")
    echo "🧪 Running optimization test suite..."
    echo ""

    # Measure before
    echo "1️⃣ Building current version..."
    bun run build > /tmp/before-build.txt 2>&1
    BEFORE_SIZE=$(grep "First Load JS" /tmp/before-build.txt | head -1 | grep -oE "[0-9.]+ [kM]B" | head -1)

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
