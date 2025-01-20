import {
    createApiFactory,
    createPlugin,
    createRoutableExtension, discoveryApiRef, fetchApiRef,
} from '@backstage/core-plugin-api';

import {cyclopsModuleRouteRef, rootRouteRef} from './routes';
import {ModuleApiClient, moduleApiRef} from "./api";

export const cyclopsPlugin = createPlugin({
    id: 'cyclops',
      routes: {
        root: rootRouteRef,
      },
    apis: [
        createApiFactory({
            api: moduleApiRef,
            deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
            factory: ({ discoveryApi, fetchApi }) => new ModuleApiClient({ discoveryApi, fetchApi }),
        }),
    ],
});

export const CyclopsPage = cyclopsPlugin.provide(
  createRoutableExtension({
    name: 'CyclopsPage',
    component: () =>
      import('./components/CyclopsComponent').then(m => m.CyclopsComponent),
    mountPoint: rootRouteRef,
  }),
);

export const CyclopsModulePage = cyclopsPlugin.provide(
    createRoutableExtension({
        name: 'CyclopsModulePage',
        component: () =>
            import('./components/ModuleComponent').then(m => m.ModuleComponent),
        mountPoint: cyclopsModuleRouteRef,
    }),
);
