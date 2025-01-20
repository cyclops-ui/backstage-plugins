import React, {useState} from 'react';
import {useTheme} from '@material-ui/core';
import {
  Header,
  Page,
  Content,
} from '@backstage/core-components';
import {configApiRef, useApi, useRouteRef, useRouteRefParams} from "@backstage/core-plugin-api";
import {moduleApiRef} from "../../api";
import {cyclopsModuleRouteRef, rootRouteRef} from "../../routes";
import {ModuleResourceDetails, EditModuleComponent} from "@cyclopsui/cyclops-ui/dist"

export const ModuleComponent = () => {
  const [showModuleDetails, setShowModuleDetails] = useState(true)

  const rootRef = useRouteRef(rootRouteRef)

  const params = useRouteRefParams(cyclopsModuleRouteRef);
  const theme = useTheme();

  const moduleApiClient = useApi(moduleApiRef);

  const config = useApi(configApiRef);

  return (
    <Page themeId="tool">
      <Header title={"Cyclops module"}>
      </Header>
        <Content>
            <div>
                {showModuleDetails ? (
                    <ModuleResourceDetails
                        name={params.moduleName}
                        themePalette={theme.palette.type}
                        streamingDisabled={config.getOptionalBoolean("cyclops.streamingDisabled") || false}
                        fetchModule={(...args) => {
                            return moduleApiClient.getModule(...args)
                        }}
                        fetchModuleRawManifest={(...args) => {
                            return moduleApiClient.getModuleRawManifest(...args)
                        }}
                        fetchModuleRenderedManifest={(...args) => {
                            return moduleApiClient.getModuleRenderedManifest(...args)
                        }}
                        reconcileModule={(...args) => {
                            return moduleApiClient.reconcileModule(...args)
                        }}
                        deleteModule={(...args) => {
                            return moduleApiClient.deleteModule(...args)
                        }}
                        onDeleteModuleSuccess={() => {
                            window.location.href = rootRef();
                        }}
                        fetchModuleResources={(...args) => {
                            return moduleApiClient.getModuleResources(...args)
                        }}
                        fetchResource={(group, version, kind, name, namespace) => {
                            return () => {
                                return moduleApiClient.getModuleResource(group, version, kind, name, namespace)
                            };
                        }}
                        resourceStreamImplementation={(...args) => {
                            moduleApiClient.moduleResourceStream()(...args)
                        }}
                        fetchResourceManifest={(...args) => moduleApiClient.fetchResourceManifest(...args)}
                        restartResource={(...args) => {
                            return moduleApiClient.restartResource(...args)
                        }}
                        deleteResource={(...args) => {
                            return moduleApiClient.deleteResource(...args)
                        }}
                        getPodLogs={(...args) => {
                            return moduleApiClient.getPodLogs(...args)
                        }}
                        streamPodLogs={(...args) => {
                            moduleApiClient.streamPodLogs(...args)
                        }}
                        onEditModule={() => {
                            setShowModuleDetails(false)
                        }}
                    />
                ) : (
                    <div>
                        <EditModuleComponent
                            moduleName={params.moduleName}
                            themePalette={theme.palette.type}
                            themeColor="#ff8803"
                            fetchModule={(...args) => {
                                return moduleApiClient.getModule(...args)
                            }}
                            getTemplate={(...args) => {
                                return moduleApiClient.getTemplate(...args)
                            }}
                            updateModule={(...args) => {
                                return moduleApiClient.updateModule(...args)
                            }}
                            onUpdateModuleSuccess={() => {
                                setShowModuleDetails(true)
                            }}
                            getTemplateInitialValues={() => {
                                return Promise.resolve()
                            }}
                            onBackButton={() => {
                                setShowModuleDetails(true)
                            }}
                        />
                    </div>
                )
                }
            </div>
        </Content>
    </Page>
  );
};
