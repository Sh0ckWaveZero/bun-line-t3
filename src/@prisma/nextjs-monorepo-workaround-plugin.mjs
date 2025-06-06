import path from 'path';
import { promises as fs } from 'fs';

// when client is bundled this gets its output path
// regex works both on escaped and non-escaped code
const prismaDirRegex =
  /\\?"?output\\?"?:\s*{(?:\\n?|\s)*\\?"?value\\?"?:(?:\\n?|\s)*\\?"(.*?)\\?",(?:\\n?|\s)*\\?"?fromEnvVar\\?"?/g
// @ts-expect-error - Parameter type is not strictly typed in this context
async function getPrismaDir(from) {
  // if we can find schema.prisma in the path, we are done
  if (await fs.stat(path.join(from, 'schema.prisma')).catch(() => false)) {
    return from
  }

  // otherwise we need to find the generated prisma client
  return path.dirname(require.resolve('.prisma/client', { paths: [from] }))
}
// @ts-expect-error - Parameter type is not strictly typed in this context
// get all required prisma files (schema + engine)
async function getPrismaFiles(from) {
  const prismaDir = await getPrismaDir(from)
  const filterRegex = /schema\.prisma|engine/
  const prismaFiles = await fs.readdir(prismaDir)

  return prismaFiles.filter((file) => file.match(filterRegex))
}

export class PrismaPlugin {
  constructor(options = {}) {
    this.options = options
  }

  /**
   * @param {any} compiler
   */
  apply(compiler) {
    const { webpack } = compiler
    const { Compilation, sources } = webpack

    let schemaCount = 0
    const fromDestPrismaMap = {} // { [from]: dest }
    // @ts-expect-error - Webpack types are not available in this context
    // read bundles to find which prisma files to copy (for all users)
    compiler.hooks.compilation.tap('PrismaPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'PrismaPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        // @ts-expect-error - Assets parameter type is not strictly typed
        async (assets) => {
          const jsAssetNames = Object.keys(assets).filter((k) => k.endsWith('.js'))
          const jsAsyncActions = jsAssetNames.map(async (assetName) => {
            // prepare paths
            const outputDir = compiler.outputPath
            const assetPath = path.resolve(outputDir, assetName)
            const assetDir = path.dirname(assetPath)

            // get sources
            const oldSourceAsset = compilation.getAsset(assetName)
            const oldSourceContents = oldSourceAsset.source.source() + ''

            // update sources
            for (const match of oldSourceContents.matchAll(prismaDirRegex)) {
              const prismaDir = await getPrismaDir(match[1])
              const prismaFiles = await getPrismaFiles(match[1])

              prismaFiles.forEach((f) => {
                const from = path.join(prismaDir, f)
                // @ts-expect-error - Dynamic property access on object
                // if we have multiple schema.prisma files, we need to rename them
                if (f === 'schema.prisma' && fromDestPrismaMap[from] === undefined) {
                  f += ++schemaCount
                }
                // @ts-expect-error - Dynamic property access on object
                // if we already have renamed it, we need to get its "renamed" name
                if (f.includes('schema.prisma') && fromDestPrismaMap[from] !== undefined) {
                  // @ts-expect-error - Dynamic property access on object
                  f = path.basename(fromDestPrismaMap[from])
                }

                if (f.includes('schema.prisma')) {
                  // update "schema.prisma" to "schema.prisma{number}" in the sources
                  const newSourceString = oldSourceContents.replace(/schema\.prisma/g, f)
                  const newRawSource = new sources.RawSource(newSourceString)
                  compilation.updateAsset(assetName, newRawSource)
                }
                // @ts-expect-error - Dynamic property assignment on object
                // update copy map
                fromDestPrismaMap[from] = path.join(assetDir, f)
              })
            }
          })

          await Promise.all(jsAsyncActions)
        },
      )
    })
    // @ts-expect-error - Webpack types are not available in this context
    // update nft.json files to include prisma files (only for next.js)
    compiler.hooks.compilation.tap('PrismaPlugin', (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: 'PrismaPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
        },
        // @ts-expect-error - Assets parameter type is not strictly typed
        async (assets) => {
          const nftAssetNames = Object.keys(assets).filter((k) => k.endsWith('.nft.json'))
          const nftAsyncActions = nftAssetNames.map((assetName) => {
            // prepare paths
            const outputDir = compiler.outputPath
            const assetPath = path.resolve(outputDir, assetName)
            const assetDir = path.dirname(assetPath)

            // get sources
            const oldSourceAsset = compilation.getAsset(assetName)
            const oldSourceContents = oldSourceAsset.source.source() + ''
            const ntfLoadedAsJson = JSON.parse(oldSourceContents)

            // update sources
            Object.entries(fromDestPrismaMap).forEach(([, dest]) => {
              ntfLoadedAsJson.files.push(path.relative(assetDir, dest))
            })

            // persist sources
            const newSourceString = JSON.stringify(ntfLoadedAsJson)
            const newRawSource = new sources.RawSource(newSourceString)
            compilation.updateAsset(assetName, newRawSource)
          })

          await Promise.all(nftAsyncActions)
        },
      )
    })

    // copy prisma files to output as the final step (for all users)
    compiler.hooks.done.tapPromise('PrismaPlugin', async () => {
      const asyncActions = Object.entries(fromDestPrismaMap).map(async ([from, dest]) => {
        // only copy if file doesn't exist, necessary for watch mode
        if ((await fs.access(dest).catch(() => false)) === false) {
          return fs.copyFile(from, dest)
        }
      })

      await Promise.all(asyncActions)
    })
  }
}