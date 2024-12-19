import {
    createPlugin,
    createApiFactory,
    discoveryApiRef,
    fetchApiRef, createComponentExtension,
} from '@backstage/core-plugin-api';

import { moduleApiRef, ModuleApiClient } from './api';

export const cyclopsModulesPlugin = createPlugin({
    id: 'cyclops-modules',
    apis: [
        createApiFactory({
            api: moduleApiRef,
            deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
            factory: ({ discoveryApi, fetchApi }) => new ModuleApiClient({ discoveryApi, fetchApi }),
        }),
    ],
});

export const ModuleDetailsComponent = cyclopsModulesPlugin.provide(
    createComponentExtension({
        name: 'ModuleDetailsComponent',
        component: {
            lazy: () =>
                import('./components/CyclopsModuleComponent').then(m => m.CyclopsModuleComponent),
        },
    }),
);
