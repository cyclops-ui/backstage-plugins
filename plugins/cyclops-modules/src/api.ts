import {createApiRef, DiscoveryApi, FetchApi} from '@backstage/core-plugin-api';
import {EventStreamContentType, fetchEventSource} from "@microsoft/fetch-event-source";

export interface Module {
    name: string;
    namespace: string;
    targetNamespace: string;
}

export interface ModuleApi {
    getModule: (moduleName: string) => Promise<any>;
    getTemplate: (repo: string, path: string, version: string, sourceType: string) => Promise<any>;
    updateModule: (moduleName: string, templateRef: any, values: any) => Promise<any>;
    reconcileModule: (moduleName: string) => Promise<boolean>;
    getModuleRawManifest: (moduleName: string) => Promise<string>;
    getModuleRenderedManifest: (moduleName: string) => Promise<string>;
    deleteModule: (moduleName: string) => Promise<boolean>;
    getPodLogs: (namespace: string, podName: string, container: string) => Promise<string[]>;
    streamPodLogs: (namespace: string,
                      name: string,
                      container: string,
                      setLog: (log: string, isReset?: boolean) => void,
                      setError: (err: Error, isReset?: boolean) => void,
                      signalController: AbortController) => void
    getModuleResources: (moduleName: string) => Promise<any[]>;
    getModuleResource: (group: string, version: string, kind: string, namespace: string, name: string) => Promise<any>;
    fetchResourceManifest: (group: string, version: string, kind: string, namespace: string, name: string, includeManagedFields: boolean) => Promise<string>;
    restartResource: (group: string, version: string, kind: string, namespace: string, name: string) => Promise<any>;
    deleteResource: (group: string, version: string, kind: string, namespace: string, name: string) => Promise<any>;
    moduleResourceStream: () => (path: string, setResource: (any: any) => void) => void;
}

export const moduleApiRef = createApiRef<ModuleApi>({
    id: 'plugin.cyclops-api.module',
});

enum ResponseType {
    Json = 'json',
    Text = 'text',
    Void = 'void',
}

class FetchError extends Error {
    response: { data: { message: string; description: string } };

    constructor(message: string, description: string) {
        super(message);
        this.name = 'FetchError';
        this.response = {
            data: {
                message,
                description,
            },
        };
        Object.setPrototypeOf(this, FetchError.prototype);
    }
}

export class ModuleApiClient implements ModuleApi {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;

    constructor({discoveryApi, fetchApi}: {discoveryApi: DiscoveryApi, fetchApi: FetchApi}) {
        this.discoveryApi = discoveryApi;
        this.fetchApi = fetchApi;
    }

    private async fetch<T = any>(input: string, responseType: ResponseType = ResponseType.Json, init?: RequestInit): Promise<T> {
        try {
            const proxyUri = `${await this.discoveryApi.getBaseUrl('proxy')}/cyclops`;
            const resp = await this.fetchApi.fetch(`${proxyUri}${input}`, init);

            if (!resp.ok) {
                const errorData = await resp.json();
                const message = errorData?.message || 'Unknown error occurred';
                const description = errorData?.description || '';

                throw new FetchError(message, description);
            }

            if (responseType === ResponseType.Json) {
                return await resp.json() as T;
            } else if (responseType === ResponseType.Text) {
                return await resp.text() as T;
            } else if (responseType === ResponseType.Void) {
                return null as any;
            }

            throw new Error(`Unsupported response type: ${responseType}`);
        } catch (error) {
            throw error;
        }
    }

    async getModule(moduleName: string): Promise<any> {
        return await this.fetch<any>(`/modules/${moduleName}`)
    }

    async getTemplate(repo: string, path: string, version: string, sourceType: string): Promise<any> {
        return await this.fetch<any>(`/templates?repo=${repo}&path=${path}&commit=${version}&sourceType=${sourceType}`)
    }

    async updateModule(moduleName: string, templateRef: any, values: any): Promise<any> {
        return await this.fetch<any>(`/modules/update`, ResponseType.Void, {
            method: "POST",
            body: JSON.stringify({
                name: moduleName,
                template: templateRef,
                values: values,
            }),
        })
    }

    async reconcileModule(moduleName: string): Promise<any> {
        return await this.fetch(`/modules/${moduleName}/reconcile`, ResponseType.Void, {method: "POST"});
    }

    async getModuleRawManifest(moduleName: string): Promise<string> {
        return await this.fetch<string>(`/modules/${moduleName}/raw`, ResponseType.Text);
    }

    async getModuleRenderedManifest(moduleName: string): Promise<string> {
        return await this.fetch<string>(`/modules/${moduleName}/currentManifest`, ResponseType.Text);
    }

    async deleteModule(moduleName: string): Promise<any> {
      return await this.fetch(
          `/modules/${moduleName}`,
          ResponseType.Void,
          {method: 'DELETE'}
      );
    }

    async getModuleResources(moduleName: string): Promise<any[]> {
      return await this.fetch<any[]>(`/modules/${moduleName}/resources`);
    }

    async getModuleResource(group: string, version: string, kind: string, namespace: string, name: string): Promise<any> {
        return await this.fetch<any>(`/resources?group=${group}&version=${version}&kind=${kind}&name=${name}&namespace=${namespace}`);
    }

    async fetchResourceManifest(group: string, version: string, kind: string, namespace: string, name: string, includeManagedFields: boolean): Promise<string> {
        return await this.fetch<string>(`/manifest?group=${group}&version=${version}&kind=${kind}&name=${name}&namespace=${namespace}&includeManagedFields=${includeManagedFields}`, ResponseType.Text);
    }

    async restartResource(group: string, version: string, kind: string, namespace: string, name: string): Promise<any> {
        return await this.fetch(`/resources/restart?group=${group}&version=${version}&kind=${kind}&name=${name}&namespace=${namespace}`, ResponseType.Void, {method: "POST"});
    }

    async deleteResource(group: string, version: string, kind: string, namespace: string, name: string): Promise<any> {
        return await this.fetch(`/resources`,
            ResponseType.Void,
            {
                method: "DELETE",
                body: JSON.stringify({
                    group: group,
                    version: version,
                    kind: kind,
                    name: name,
                    namespace: namespace,
                }),
            }
        );
    }

    async getPodLogs(namespace: string, podName: string, container: string): Promise<any[]> {
        return await this.fetch<any[]>(`/resources/pods/${namespace}/${podName}/${container}/logs`)
    }

    moduleResourceStream(): (path: string, setResource: (any: any) => void) => void {
        const proxyUriPromise = this.discoveryApi.getBaseUrl('proxy').then(baseUrl => `${baseUrl}/cyclops`);

        return (path: string, setResource: (any: any) => void) => {
            proxyUriPromise.then((proxyUri: string) => {
                class RetriableError extends Error {}
                class FatalError extends Error {}

                const ctrl = new AbortController();
                const maxRetries = 5;
                let retryCounter = 1;

                fetchEventSource(`${proxyUri}${path}`, {
                    method: "GET",
                    fetch: this.fetchApi.fetch,
                    signal: ctrl.signal,
                    onmessage(ev) {
                        setResource(JSON.parse(ev.data));
                    },
                    async onopen(response) {
                        if (
                            response.ok &&
                            response.headers.get("content-type") === EventStreamContentType
                        ) {
                            return;
                        } else if (
                            response.status >= 400 &&
                            response.status < 500 &&
                            response.status !== 429
                        ) {
                            throw new FatalError();
                        } else {
                            throw new RetriableError();
                        }
                    },
                    onclose() {
                        throw new RetriableError();
                    },
                    onerror: (err) => {
                        if (err instanceof FatalError) {
                            throw err;
                        }

                        if (retryCounter === maxRetries) {
                            throw err;
                        }

                        retryCounter++;
                        return 5000;
                    },
                }).catch((r) => { console.error(r) });
            }).catch((e) => {
                console.error(e)
            })
        }
    }

    streamPodLogs(): (namespace: string,
                      name: string,
                      container: string,
                      setLog: (log: string, isReset?: boolean) => void,
                      setError: (err: Error, isReset?: boolean) => void,
                      signalController: AbortController) => void {
        const proxyUriPromise = this.discoveryApi.getBaseUrl('proxy').then(baseUrl => `${baseUrl}/cyclops`);

        return (namespace: string,
                name: string,
                container: string,
                setLog: (log: string, isReset?: boolean) => void,
                setError: (err: Error, isReset?: boolean) => void,
                signalController: AbortController) => {
            proxyUriPromise.then((proxyUri: string) => {
                class RetriableError extends Error {}
                class FatalError extends Error {}


                const maxRetries = 5;
                let retryCounter = 1;

                fetchEventSource(`${proxyUri}/resources/pods/${namespace}/${name}/${container}/logs/stream`, {
                    method: "GET",
                    fetch: this.fetchApi.fetch,
                    signal: signalController.signal,
                    onmessage(ev) {
                        setLog(ev.data)
                    },
                    async onopen(response) {
                        if (
                            response.ok &&
                            response.headers.get("content-type") === EventStreamContentType
                        ) {
                            return;
                        } else if (
                            response.status >= 400 &&
                            response.status < 500 &&
                            response.status !== 429
                        ) {
                            throw new FatalError();
                        } else {
                            throw new RetriableError();
                        }
                    },
                    onclose() {
                        throw new RetriableError();
                    },
                    onerror: (err) => {
                        if (err instanceof FatalError) {
                            throw err;
                        }

                        if (retryCounter === maxRetries) {
                            throw err;
                        }

                        retryCounter++;
                        return 5000;
                    },
                    openWhenHidden: true,
                }).catch((r) => setError(r));
            }).catch((e) => {
                console.error(e)
            })
        }
    }
}
