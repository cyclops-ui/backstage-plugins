import React, {useState} from 'react';
import {
  Content,
} from '@backstage/core-components';
import {ModuleResourceDetails, EditModuleComponent} from "@cyclopsui/cyclops-ui/dist"
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {useTheme} from "@material-ui/core"

import {moduleApiRef} from "../../api";

export const CyclopsModuleComponent = () => {
    const [showModuleDetails, setShowModuleDetails] = useState(true)
    
    const moduleApiClient = useApi(moduleApiRef);
    const entity = useEntity();
    const config = useApi(configApiRef);
    const theme = useTheme();

    return (
        <Content noPadding>
            <div>
                {showModuleDetails ? (
                    <ModuleResourceDetails
                        name={entity.entity.metadata.name}
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
                        <button onClick={() => setShowModuleDetails(true)}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#ff8803",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            Go Back
                        </button>
                        <EditModuleComponent
                            moduleName={entity.entity.metadata.name}
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
                        />
                    </div>
                )
                }
            </div>
        </Content>
        // </Page>
    )
};