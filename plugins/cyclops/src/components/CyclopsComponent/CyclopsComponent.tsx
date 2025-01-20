import React, {useEffect, useState} from 'react';
import {Button, Grid, useTheme} from '@material-ui/core';
import {Content, Header, Link, Page, Table, TableColumn,} from '@backstage/core-components';
import {useApi, useRouteRef} from "@backstage/core-plugin-api";
import {moduleApiRef} from "../../api";
import {cyclopsModuleRouteRef, rootRouteRef} from "../../routes";
import {makeStyles} from "@material-ui/core/styles";
import CheckCircleTwoTone from '@material-ui/icons/CheckCircleTwoTone';
import CancelTwoTone from '@material-ui/icons/CancelTwoTone';
import AccessTimeTwoTone from '@material-ui/icons/AccessTimeTwoTone';
import {CreateModuleComponent} from '@cyclopsui/cyclops-ui/dist'
import LaunchIcon from "@material-ui/icons/Launch";

const useStyles = makeStyles({
    avatar: {
        height: 32,
        width: 32,
        borderRadius: '50%',
    },
});

export const CyclopsComponent = () => {
    const classes = useStyles();

    const [showModuleList, setShowModuleList] = useState(true)
    const [modules, setModules] = useState<any>([])
    const [loadingModules, setLoadingModules] = useState(true)

    const moduleApiClient = useApi(moduleApiRef);
    const theme = useTheme();

    useEffect(() => {
        moduleApiClient.listModules().then((res) => {
            setModules(res)
        }).catch((e) => {
            console.error("error fetching modules", e)
        }).finally(() => {
            setLoadingModules(false)
        })
    }, []);

    const getModuleDetails = useRouteRef(cyclopsModuleRouteRef);
    const getModules = useRouteRef(rootRouteRef);

    function defaultTemplateReferenceView(templateRef: any) {
        let refView = templateRef.repo;

        if (templateRef.path && templateRef.path !== "") {
            refView += "/" + templateRef.path;
        }

        if (templateRef.version && templateRef.version !== "") {
            refView += " @ " + templateRef.version;
        }

        if (templateRef.resolvedVersion && templateRef.resolvedVersion !== "") {
            refView += " - " + templateRef.resolvedVersion.substring(0, 7);
        }

        return (
            <div>
              <span aria-level={3} style={{color: "#1677ff", height: "22px"}}>
                {refView}
              </span>
            </div>
        );
    }

    function githubTemplateReferenceView(templateRef: any) {
        let refView = templateRef.repo;
        let commitLink =
            templateRef.repo +
            `/tree/` +
            templateRef.resolvedVersion +
            `/` +
            templateRef.path;

        if (templateRef.path && templateRef.path !== "") {
            refView += "/" + templateRef.path;
        }

        if (templateRef.version && templateRef.version !== "") {
            refView += " @ " + templateRef.version;
        }

        if (templateRef.resolvedVersion && templateRef.resolvedVersion !== "") {
            refView += " - " + templateRef.resolvedVersion.substring(0, 7);
        }

        return (
            <div style={{display: 'flex', alignItems: 'center'}}>
                <Link aria-level={3} to={commitLink}>
                    {templateRef.repo}
                </Link>
            </div>
        );
    }

    function moduleTemplateReferenceView(templateRef: any) {
        if (templateRef.repo.startsWith("https://github.com")) {
            return githubTemplateReferenceView(templateRef);
        }

        return defaultTemplateReferenceView(templateRef);
    }

    const columns: TableColumn[] = [
        {title: '', field: 'iconURL', width: "5%"},
        {
            title: "Name",
            field: "rawName",
            render: (rowData: any) => rowData.name,
            width: "15%",
        },
        {title: 'Namespace', field: 'namespace', width: "15%"},
        {
            title: 'Template',
            field: "template",
            width: "30%",
            sorting: false,
        },
        {
            title: 'Status',
            field: 'rawStatus',
            width: "15%",
            render: (rowData: any) => rowData.status,
        },
    ];

    const data = modules.map((module: {
        iconURL: string | undefined;
        name: any;
        namespace: any;
        status: any;
        template: any
    }) => {
        // default to unhealthy
        let statusIcon = <CancelTwoTone style={{color: "red"}}/>;
        let statusColor = "red";

        if (module.status === "healthy") {
            statusIcon = <CheckCircleTwoTone style={{color: "#52c41a"}}/>
            statusColor = "#46a617"
        }
        if (module.status === "progressing") {
            statusIcon = <AccessTimeTwoTone style={{color: "#ffcc00"}}/>
            statusColor = "#cca406"
        }

        return {
            iconURL: (
                <img
                    alt=""
                    className={classes.avatar}
                    src={module.iconURL}
                />
            ),
            rawName: module.name,
            name: (
                <Link style={{display: 'flex', alignItems: 'center'}} target={"_blank"}
                      to={getModuleDetails({moduleName: module.name})}>
                    <LaunchIcon fontSize={"small"}/>
                    <div style={{paddingLeft: "8px"}}>
                        {module.name}
                    </div>
                </Link>
            ),
            namespace: module.namespace,
            template: moduleTemplateReferenceView(module.template),
            status: (
                <div style={{display: 'flex', alignItems: 'center'}}>
                    {statusIcon} <span style={{paddingLeft: "12px", color: statusColor}}>{module.status}</span>
                </div>
            ),
            rawStatus: module.status,
        };
    });

    return (
        <Page themeId="tool">
            <Header title="Cyclops modules" subtitle="List of deployed Cyclops modules">
            </Header>
            <Content>
                {showModuleList ?
                    <Grid container spacing={3} direction="column">
                        <Grid item>
                            <Grid container justifyContent="space-between" alignItems="center">
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            setShowModuleList(false);
                                        }}
                                    >
                                        Add Module
                                    </Button>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Table
                                // title="Cyclops modules"
                                options={{search: true, paging: true}}
                                columns={columns}
                                data={data}
                                isLoading={loadingModules}
                                filters={[{
                                    column: "Status",
                                    type: "multiple-select"
                                }]}
                            />
                        </Grid>
                    </Grid>
                    : <Grid container spacing={3} direction="column">
                        <div style={{padding: "16px", paddingTop: "0px"}}>
                            <CreateModuleComponent
                                themePalette={theme.palette.type}
                                getTemplateStore={(...args) => {
                                    return moduleApiClient.getTemplateStore(...args)
                                }}
                                getNamespaces={(...args) => {
                                    return moduleApiClient.listNamespaces(...args)
                                }}
                                getTemplate={(...args) => {
                                    return moduleApiClient.getTemplate(...args)
                                }}
                                getTemplateInitialValues={(...args) => {
                                    return moduleApiClient.getTemplateInitialValues(...args)
                                }}
                                submitModule={(...args) => {
                                    return moduleApiClient.createModule(...args)
                                }}
                                onSubmitModuleSuccess={(moduleName) => {
                                    window.location.href = getModuleDetails({moduleName: moduleName});
                                }}
                                onBackButton={() => {
                                    window.location.href = getModules();
                                }}
                            />
                        </div>
                    </Grid>}
            </Content>
        </Page>
    );
};
