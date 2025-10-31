import path from 'path'

export default {
  plugins: [],
  test: {
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@generated': path.resolve(__dirname, './generated')
    },
  },
}