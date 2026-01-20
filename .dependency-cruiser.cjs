module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            severity: 'error',
            comment: 'This dependency is part of a circular relationship. You might want to revise ' +
                'your solution (i.e. use some design patterns, separate concerns or move the code).',
            from: {},
            to: {
                circular: true
            }
        },
        {
            name: 'no-orphans',
            severity: 'warn',
            from: {
                orphan: true,
                pathNot: ['^node_modules', '\\.d\\.ts$', 'test', 'spec', 'vite-env.d.ts', 'next-env.d.ts', '.config.js', '.setup.ts']
            },
            to: {}
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules',
            dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg']
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: './tsconfig.json'
        }
    }
};
