import { BlueprintService } from '../../services/blueprint-service';
import { BlueprintItem } from '../blueprint/blueprint-item';
import { Vector2 } from '../vector2';
import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ITool, IChangeTool, ToolType } from './tool';
import { DrawPixi } from '../../drawing/draw-pixi';
import { CameraService } from '../../services/camera-service';
import { BlueprintItemWire } from '../blueprint/blueprint-item-wire';
import { Blueprint } from '../blueprint/blueprint';
import { DrawHelpers } from '../../drawing/draw-helpers';

@Injectable()
export class BuildTool implements ITool
{

  templateItemToBuild: BlueprintItem;
  private observers: IObsBuildItemChanged[];

  parent: IChangeTool;

  constructor(private blueprintService: BlueprintService, private cameraService: CameraService) 
  {
    this.observers = [];
  }

  subscribeBuildItemChanged(observer: IObsBuildItemChanged)
  {
    this.observers.push(observer);
  }

  destroy()
  {
    if (this.templateItemToBuild != null) {
      this.templateItemToBuild.destroy();
      this.templateItemToBuild = null;
    }
  }

  private canBuild(): boolean
  {
    // TODO we should loop the tiles of the templateItemToBuild according to it's bounding box
    let alreadyPresent = false;
    for (let templateItem of this.blueprintService.blueprint.getTemplateItemsAt(this.templateItemToBuild.position)) 
      if (templateItem.id == this.templateItemToBuild.id) 
        alreadyPresent = true;

    return !alreadyPresent;
  }

  build()
  {
    if (!this.canBuild()) return;

    let newItem = this.templateItemToBuild.clone();
    newItem.prepareBoundingBox();
    newItem.prepareSpriteInfoModifier(this.blueprintService.blueprint);
    this.blueprintService.blueprint.addTemplateItem(newItem);
    this.blueprintService.blueprint.refreshOverlayInfo()
  }

  private connectAToB(a: BlueprintItemWire, b: BlueprintItemWire)
  {
    let bitMask = 0;
    if (a.position.x == b.position.x + 1 && a.position.y == b.position.y) bitMask = 1;
    else if (a.position.x == b.position.x - 1 && a.position.y == b.position.y) bitMask = 2;
    else if (a.position.x == b.position.x && a.position.y == b.position.y - 1) bitMask = 4;
    else if (a.position.x == b.position.x && a.position.y == b.position.y + 1) bitMask = 8;

    a.connections = a.connections | bitMask;
  }

  changeItem(item: BlueprintItem)
  {
    if (this.templateItemToBuild != null) this.templateItemToBuild.destroy();

    this.cameraService.setOverlayForItem(item.oniItem);

    this.templateItemToBuild = item;
    this.templateItemToBuild.setInvisible();
    this.templateItemToBuild.alpha = 1;
    this.templateItemToBuild.cleanUp();
    
    this.templateItemToBuild.prepareBoundingBox();
    this.templateItemToBuild.prepareSpriteInfoModifier(this.blueprintService.blueprint);
    this.observers.map((observer) => observer.itemChanged(item) );
  }

  buildAndConnect(tileStart: Vector2, tileStop: Vector2) {
    this.templateItemToBuild.position = Vector2.clone(tileStop);
    this.build();
    
    if (this.templateItemToBuild.oniItem.isWire)
    {
      let itemsPrevious = this.blueprintService.blueprint.getTemplateItemsAt(tileStart).filter(i => i.id == this.templateItemToBuild.id);
      let itemsCurrent = this.blueprintService.blueprint.getTemplateItemsAt(tileStop).filter(i => i.id == this.templateItemToBuild.id);

      if (itemsPrevious != null && itemsPrevious.length > 0 && itemsCurrent != null && itemsCurrent.length > 0)
      {
        let itemPrevious = itemsPrevious[0] as BlueprintItemWire;
        let itemCurrent = itemsCurrent[0] as BlueprintItemWire;

        this.connectAToB(itemPrevious, itemCurrent);
        this.connectAToB(itemCurrent, itemPrevious);
        itemPrevious.prepareSpriteInfoModifier(this.blueprintService.blueprint);
        itemCurrent.prepareSpriteInfoModifier(this.blueprintService.blueprint);
      }
    }
  }
  
  // Tool interface :
  switchFrom() {
    this.templateItemToBuild.destroy();
  }

  switchTo() {
  }

  mouseOut() {
    if (this.templateItemToBuild != null) this.templateItemToBuild.setInvisible();
  }

  leftClick(tile: Vector2)
  {
    this.templateItemToBuild.position = tile;
    this.build();

    // Test
    //let tileStart = new Vector2(-50.5, -50.5);
    //let tileStop = new Vector2(50.5, 100.5);
    //this.drag(tileStart, tileStop);
  }

  rightClick(tile: Vector2) {
    this.parent.changeTool(ToolType.select);
  }

  hover(tile: Vector2) {
    this.templateItemToBuild.position = Vector2.clone(tile);
    this.templateItemToBuild.prepareBoundingBox();
    this.templateItemToBuild.prepareSpriteInfoModifier(this.blueprintService.blueprint);

    if (this.canBuild()) this.templateItemToBuild.drawPart.tint = DrawHelpers.whiteColor;
    else this.templateItemToBuild.drawPart.tint = 0xD40000;
  }

  drag(tileStart: Vector2, tileStop: Vector2) {
    
    if (tileStart == null || tileStop == null) return;
    
    let tileStartInt = DrawHelpers.getIntegerTile(tileStart);
    let tileStopInt = DrawHelpers.getIntegerTile(tileStop);

    // Only drag if we are changing tiles
    if (!tileStartInt.equals(tileStopInt)) this.dragStepByStep(tileStart, tileStop);
    
  }

  dragStepByStep(tileStart: Vector2, tileStop: Vector2) {
    
    

    //console.log('start')
    //console.log(tileStart);
    //console.log(tileStop);

    // This is the unit taxicab vector representing the general direction of movement
    let delta = new Vector2(
      DrawHelpers.getFloorTile(tileStop).x - DrawHelpers.getFloorTile(tileStart).x,
      DrawHelpers.getFloorTile(tileStop).y - DrawHelpers.getFloorTile(tileStart).y
    );

    delta = new Vector2(
      delta.x == 0 ? 0 : 1 * (delta.x / Math.abs(delta.x)),
      delta.y == 0 ? 0 : 1 * (delta.y / Math.abs(delta.y))
    )
    
    // Special cases : if tileStart or tileStop is an integer, we run into problems, so let's change that
    if (tileStart.x == Math.floor(tileStart.x)) tileStart.x -= delta.x * 0.005;
    if (tileStop.x == Math.floor(tileStop.x)) tileStop.x += delta.x * 0.005;
    if (tileStart.y == Math.floor(tileStart.y)) tileStart.y -= delta.y * 0.005;
    if (tileStop.y == Math.floor(tileStop.y)) tileStop.y += delta.y * 0.005;

    // Current tile is the float tile that will 
    let currentTile = Vector2.clone(tileStart);

    //console.log('delta');
    //console.log(delta);

    // We will either stop advancing when we reach the goal, or when too many loops are through
    let advance = true;
    let i = 0;
    
    // The algorithm requires floor for both x and y
    // However for blueprint, it's floor(x) and ceil(y)
    let startTile = DrawHelpers.getIntegerTile(tileStart);
    //console.log(startTile);

    while (advance) {
      //console.log(DrawHelpers.getIntegerTile(currentTile));

      //console.log('currentTile before');
      //console.log(currentTile);

      // nextTile is currentTile advanced by delta
      // and then floored of ceilingedto be closest to currentTile
      let nextTile = new Vector2(currentTile.x + delta.x, currentTile.y + delta.y);
      if (delta.x > 0) nextTile.x = Math.floor(nextTile.x);
      else if (delta.x < 0) nextTile.x = Math.ceil(nextTile.x);
      if (delta.y > 0) nextTile.y = Math.floor(nextTile.y);
      else if (delta.y < 0) nextTile.y = Math.ceil(nextTile.y);

      
      //console.log('nextTile');
      //console.log(nextTile);

      // d is the distance vector between the final target and currentTile
      let d = new Vector2(
        tileStop.x - currentTile.x,
        tileStop.y - currentTile.y
      );

      // dp is the distance between the next Target and current Tile
      let dp = new Vector2(
        nextTile.x - currentTile.x,
        nextTile.y - currentTile.y
      );

      let dLengthSquared = d.lengthSquared;

      //console.log('d')
      //console.log(d);
      //console.log('dp')
      //console.log(dp)

      let distX: number = 999;
      if (delta.x != 0) distX = (new Vector2(dp.x, d.y * (dp.x / d.x))).lengthSquared;

      let distY: number = 999;
      if (delta.y != 0) distY = (new Vector2(d.x * (dp.y / d.y), dp.y)).lengthSquared;

      //console.log('dist')
      //console.log(new Vector2(distX, distY))

      let newTile: Vector2;
      if (Math.abs(distX - distY) < 0.0000005 && distX < dLengthSquared) {
        //console.log('build');
        //console.log('equal')

        newTile = new Vector2(startTile.x + delta.x, startTile.y);
        this.buildAndConnect(startTile, newTile);
        startTile.x += delta.x;
        //console.log(startTile);

        newTile = new Vector2(startTile.x, startTile.y + delta.y);
        this.buildAndConnect(startTile, newTile);
        startTile.y += delta.y;
        //console.log(startTile);
        
        currentTile.x += dp.x;
        currentTile.y += d.y * (dp.x / d.x);
      }
      else if (distX <= distY && distX < dLengthSquared) {
        //console.log('build');
        currentTile.x += dp.x;
        currentTile.y += d.y * (dp.x / d.x);

        newTile = new Vector2(startTile.x + delta.x, startTile.y);
        this.buildAndConnect(startTile, newTile);
        startTile.x += delta.x;
        //console.log(startTile);
      }
      else if (distY < distX && distY < dLengthSquared) {
        //console.log('build');
        currentTile.x += d.x * (dp.y / d.y);
        currentTile.y += dp.y;

        newTile = new Vector2(startTile.x, startTile.y + delta.y);
        this.buildAndConnect(startTile, newTile);
        startTile.y += delta.y;
        //console.log(startTile);
      }
      else {
        //console.log('stop')
        advance = false;
      } 

      i++;
      if (i > 999) throw new Error("The tile dragger was too long");
      
    }
    
  }
  
  dragStop() {
  }

  draw(drawPixi: DrawPixi, camera: CameraService) {
    this.templateItemToBuild.drawPixi(camera, drawPixi);
    // TODO utility behind object
  }
}

export interface IObsBuildItemChanged
{
  itemChanged(templateItem: BlueprintItem);
}