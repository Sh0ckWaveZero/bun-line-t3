---
name: docker-optimize
description: Optimize Docker images to reduce size while maintaining full functionality
---

# Docker Image Optimization

Optimize Docker images by reducing size through aggressive cleanup of unnecessary files while maintaining full production functionality.

## When to use

- Docker images are larger than expected (>500MB)
- Need to reduce image size for faster deployments
- Want to minimize storage costs
- Working with Bun, Node.js, or Alpine-based images

## Key Optimizations

### 1. Multi-stage Build Cleanup
- Remove test files, documentation, examples from node_modules
- Delete source maps, TypeScript definitions, LICENSE files
- Clean up empty directories after removal

### 2. Build Stage Optimizations
- Use `--no-optional` flag for package installs
- Remove build tools after native module compilation
- Cache mount cleanup after installs

### 3. Runtime Stage Optimizations
- Remove unnecessary fonts, locales, and timezone data
- Aggressive cleanup of cache directories
- Source map removal from dist/ folders

### 4. .dockerignore Enhancements
- Exclude test files, storybook, development configs
- Remove CI/CD files from build context
- Skip development-specific documentation

## Expected Results

Typical size reduction: **15-25%** (100-200MB for most Node.js/Bun apps)

- Before: ~850MB
- After: ~659MB
- Reduction: ~191MB (22%)

## Safety Guarantees

✅ **Production code remains intact**
- All JavaScript/TypeScript production bundles preserved
- Native modules and dependencies functional
- Application features unchanged

✅ **No runtime impact**
- Test files never used in production
- Documentation not required at runtime
- Source maps only for debugging

## Limitations

- Largest dependencies (canvas, chart.js, etc.) dominate image size
- Further reduction requires feature removal or microservices architecture
- Some optimizations depend on specific package manager (Bun shown)

## Post-Optimization Testing

Always verify:
1. Container starts successfully
2. Health checks pass
3. All application features work
4. No "module not found" errors
