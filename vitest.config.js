import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            include: ['js/**/*.js'],
            // Exclure les modules UI/orchestration (testés via E2E)
            exclude: [
                'js/main.js',
                'js/firestore.js',
                'js/app.js',
                'js/render.js',
                'js/modal.js',
            ],
        },
    },
});
