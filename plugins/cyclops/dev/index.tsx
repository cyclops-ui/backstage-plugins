import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { cyclopsPlugin, CyclopsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(cyclopsPlugin)
  .addPage({
    element: <CyclopsPage />,
    title: 'Root Page',
    path: '/cyclops',
  })
  .render();
