const withSass = require('@zeit/next-sass')
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin")
module.exports = withSass({
  webpack(config, options) {
    if (config.mode === 'production') {
      if (Array.isArray(config.optimization.minimizer)) {
        config.optimization.minimizer.push(new OptimizeCSSAssetsPlugin({}))
      }
    }
    return config
  },
  poweredByHeader: false
})
