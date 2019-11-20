import { BlueprintItem } from 'src/app/module-blueprint/common/blueprint/blueprint-item'
import { Vector2 } from '../../../vector2';

export interface OniBuilding
{
    id: string;
    location_x: number
    location_y:number
    connections: number;
    rotationOrientation: string;
    element: string;
    temperature: number;

}