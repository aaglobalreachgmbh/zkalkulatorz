import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            'npm:decimal.js': 'decimal.js',
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: path.resolve(__dirname, './vitest.setup.ts'),
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
})
