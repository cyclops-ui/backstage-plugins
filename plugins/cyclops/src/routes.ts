import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'cyclops',
});

export const cyclopsModuleRouteRef = createRouteRef({
  id: 'cyclops/module',
  params: ['moduleName']
});
