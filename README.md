# Cyclops Backstage plugins

---

This repository holds Cyclops backstage plugins. These plugins serve for an easier integration with Backstage for a more full developer platform experience.

Official Cyclops Backstage plugins stored in this repository are:

- Module plugin - integrates into the Backstage catalog so you can view and edit your Kubernetes application through Backstage

All the plugins and how to configure them are documented in more detail below.

## Module plugin

Shows Cyclops module data as part of the Backstage catalog. This plugin allows you to add the page for Module details and edit your Modules through a new tab in your Component details page.

You can view Kubernetes resources deployed for a Module (check status, list logs) as well as perform actions like reconciling Modules or restarting workloads.

If you click the `Edit` button, you will be able to see the UI for editing that specific Module.

Module plugin communicates with an existing Cyclops backend instance running in your cluster. All requests going from your Backstage app to the Cyclops backend are proxied through the Backstage backend, so all of the requests are authenticated.

The Module plugin will fetch the Module called the same as the component. In this case, the component is called `example-website`, and the Cyclops plugin will fetch a Module called `example-website`. With future improvements, we plan to enable mapping between Component names and Cyclops Modules via annotations so that the names of the components and Modules don't have to be the same, allowing for more flexibility.

Steps for setting up the plugin on your Backstage app:

1. Have a running Cyclops instance:
    - If you don't have a running instance, you can install one by following [this two-command tutorial](https://cyclops-ui.com/docs/installation/install/manifest/)
    - Make sure that Cyclops backend (`cyclops-ctrl` pod) is running and is reachable. If you installed with the commands above, your Cyclops instance would be reachable from within the same Kubernetes cluster on `http://cyclops-ctrl.cyclops:8080`
2. Add the plugin to your Backstage instance, you need to add to `packages/app`:

    ```bash
    yarn --cwd packages/app add @cyclopsui/backstage-plugin-cyclops-modules
    ```

3. Add proxy configuration to your Backstage configuration in `app-config.yaml`

    ```yaml
    proxy:
      endpoints:
        '/cyclops':
          target: 'http://cyclops-ctrl.cyclops:8080'
          changeOrigin: true
    ```

4. Add Module plugin component to your catalog. Go to file `packages/app/src/components/catalog/EntityPage.tsx` and import Cyclops component:

    ```tsx
    import {ModuleDetailsComponent} from "@cyclopsui/backstage-plugin-cyclops-modules";
    ```

   Now you just need to add the Cyclops component to the entity. For example, if you want to add Cyclops tab for a Website component, find `websiteEntityPage` and the Cyclops tab by pasting the code below:

    ```tsx
    <EntityLayout.Route path={"/cyclops"} title={"Cyclops"}>
    	<ModuleDetailsComponent/>
    </EntityLayout.Route>
    ```


Your Backstage catalog can now view and edit deployed Modules in your cluster.

This plugin can't deploy new Modules and can only give you an overview of existing ones.