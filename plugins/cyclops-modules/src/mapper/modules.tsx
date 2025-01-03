import { Entity } from '@backstage/catalog-model';
import {MODULE_NAME_OVERRIDE_ANNOTATION} from "./annotations";

export function mapModuleName(entity: Entity): string {
    const annotations = entity.metadata.annotations;
    const override = annotations?.[MODULE_NAME_OVERRIDE_ANNOTATION];

    if (override && override.length > 0) {
        return override;
    }

    return entity.metadata.name;
}
