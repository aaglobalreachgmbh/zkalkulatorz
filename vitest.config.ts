import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()] as any,
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'npm:decimal.js@10.4.3': 'decimal.js',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: path.resolve(__dirname, './src/vitest.setup.ts'),
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
})
