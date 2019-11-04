import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { OniItem } from '../../common/oni-item';
import {SelectItem} from 'primeng/api';
import { TemplateItem } from '../../common/template/template-item';
import { ComposingElement } from '../../common/composing-element';
import { Template } from '../../common/template/template';
import { Tool, ToolType } from '../../common/tools/tool';
import { TileInfo } from '../../common/tile-info';
import { TemplateItemWire } from '../../common/template/template-item-wire';
import { Camera } from '../../common/camera';
import { Vector2 } from '../../common/vector2';
import { DrawHelpers } from '../../drawing/draw-helpers';
import { ToolRequest } from '../../common/tool-request';
import { DrawPixi } from '../../drawing/draw-pixi';
import { DrawAbstraction } from '../../drawing/draw-abstraction';
import { BuildMenuCategory, BuildMenuItem } from '../../common/bexport/b-build-order';



@Component({
  selector: 'app-component-side-build-tool',
  templateUrl: './component-side-build-tool.component.html',
  styleUrls: ['./component-side-build-tool.component.css']
})
export class ComponentSideBuildToolComponent implements OnInit, Tool {

  categories: SelectItem[];
  items: SelectItem[];

  // This is used by the accordeon
  activeIndex=0;

  currentCategory: BuildMenuCategory;
  currentItem: OniItem;

  templateItemToBuild: TemplateItem;

  @Output() onAskChangeTool = new EventEmitter<ToolRequest>();

  constructor() 
  {

    this.categories = []
    this.items = [];

  }

  ngOnInit() {
    let allCategories = {label:BuildMenuCategory.allCategories.categoryName, value:BuildMenuCategory.allCategories}
    this.categories.push(allCategories);
    this.currentCategory = BuildMenuCategory.allCategories;
  }

  oniItemsLoaded()
  {
    for (let buildCategory of BuildMenuCategory.buildMenuCategories)
    this.categories.push({label:buildCategory.categoryName, value:buildCategory});

    this.currentCategory = BuildMenuCategory.allCategories;
    this.currentItem = OniItem.getOniItem('Tile');
    this.changeCategory();
  }

  updateItemList()
  {
    this.items = [];

    for (let buildMenuItem of BuildMenuItem.buildMenuItems)
    {
      if (this.currentCategory == BuildMenuCategory.allCategories || this.currentCategory.category == buildMenuItem.category)
      {
        let oniItem = OniItem.getOniItem(buildMenuItem.buildingId);
        this.items.push({label:oniItem.id, value:oniItem});
      }
    }
  }

  changeCategory()
  {
    this.updateItemList();
    if (this.items.length >= 1) this.currentItem = this.items[0].value;
    this.changeItem();
  }

  changeItem()
  {
    if (this.templateItemToBuild != null) this.templateItemToBuild.destroy();

    // Create the templateItem which will be shared by this component and the canvas tool
    this.templateItemToBuild = Template.createInstance(this.currentItem.id);
    this.templateItemToBuild.temperature = 300;
    this.templateItemToBuild.element = ComposingElement.getElement('Void');

    this.changeItem_(this.templateItemToBuild);

    // TODO o to change orientation
  }

  setOriginal(templateItem: TemplateItem)
  {
    // TODO in setTemplateItem
    //this.currentCategory = templateItem.oniItem.category;
    this.currentItem = templateItem.oniItem;

    
    this.templateItemToBuild = templateItem;
  }


  changeItem_(item: TemplateItem)
  {
    

    this.templateItemToBuild = item;
    // TODO should the position go into cleanup
    this.templateItemToBuild.position = Vector2.Zero;
    this.templateItemToBuild.alpha = 1;
    this.templateItemToBuild.cleanUp();
    // TODO fixme
    //this.templateItemToBuild.prepareSpriteInfoModifier(blueprint);
    this.templateItemToBuild.prepareBoundingBox();
  }




  


  private canBuild(blueprint: Template, tile: Vector2): boolean
  {
    // TODO we should loop the tiles of the templateItemToBuild according to it's bounding box
    let alreadyPresent = false;
    for (let templateItem of blueprint.getTemplateItemsAt(tile)) 
      if (templateItem.id == this.templateItemToBuild.id) 
        alreadyPresent = true;

    return !alreadyPresent;
  }



  private connectAToB(a: TemplateItemWire, b: TemplateItemWire)
  {
    let bitMask = 0;
    if (a.position.x == b.position.x + 1 && a.position.y == b.position.y) bitMask = 1;
    else if (a.position.x == b.position.x - 1 && a.position.y == b.position.y) bitMask = 2;
    else if (a.position.x == b.position.x && a.position.y == b.position.y - 1) bitMask = 4;
    else if (a.position.x == b.position.x && a.position.y == b.position.y + 1) bitMask = 8;

    a.connections = a.connections | bitMask;
  }

  build(blueprint: Template)
  {
    // TODO the canbuild should not need the position
    if (!this.canBuild(blueprint, this.templateItemToBuild.position)) return;

    let newItem = this.templateItemToBuild.clone();
    newItem.prepareBoundingBox();
    blueprint.addTemplateItem(newItem);
    blueprint.refreshOverlayInfo()
  }


  /************************
  ** Tool interface      **
  ************************/
  toolType = ToolType.build;
  
  setTemplateItem(templateItem: TemplateItem) 
  {
    // TODO fixme
    if (templateItem != null) this.changeItem_(templateItem.cloneForBuilding());
    else
    {
      this.changeItem();
    }
  }

  leftMouseDown(blueprint: Template, tile: Vector2) 
  {
    this.templateItemToBuild.position = tile;
    this.build(blueprint);
  }

  leftMouseUp(blueprint: Template, tile: Vector2) 
  {
    // TODO tentative placement, build on leftMouseUp
  }

  leftClick(blueprint: Template, tile: Vector2)
  {
    this.templateItemToBuild.position = tile;
    this.build(blueprint);
  }

  rightClick(blueprint: Template, tile: Vector2)
  {
    this.onAskChangeTool.emit({toolType:ToolType.select, templateItem:null});
  }

  changeTile(blueprint: Template, previousTile: Vector2, currentTile: Vector2)
  {
    this.templateItemToBuild.position = currentTile;

    if (this.canBuild(blueprint, currentTile)) this.templateItemToBuild.drawPart.tint = DrawHelpers.whiteColor;
    else this.templateItemToBuild.drawPart.tint = 0xD40000;
  }

  changeTileDrag(blueprint: Template, previousTileDrag: Vector2, currentTileDrag: Vector2)
  {
    //console.log("Start drag from " + JSON.stringify(previousTileDrag) + ' to ' + JSON.stringify(currentTileDrag));
    /*
    console.log("********************************");
    console.log("Start drag from " + JSON.stringify(previousTileDrag) + ' to ' + JSON.stringify(currentTileDrag));
    let diffDrag = new Vector2(currentTileDrag.x - previousTileDrag.x, currentTileDrag.y - previousTileDrag.y);
    let diffDragLength = Math.sqrt(diffDrag.x * diffDrag.x + diffDrag.y * diffDrag.y);
    let diffDragUnit = new Vector2(diffDrag.x / diffDragLength, diffDrag.y / diffDragLength);

    let tileDragFloat = Vector2.clone(previousTileDrag);
    let dragOld: Vector2;
    let dragNew: Vector2;
    do
    {
      let tileDragFloatOld = Vector2.clone(tileDragFloat);
      dragOld = new Vector2(Math.floor(tileDragFloat.x), Math.floor(tileDragFloat.y))
      tileDragFloat.x += diffDragUnit.x;
      tileDragFloat.y += diffDragUnit.y;
      dragNew = new Vector2(Math.floor(tileDragFloat.x), Math.floor(tileDragFloat.y))

      this.unitChangeTileDrag(blueprint, dragOld, dragNew);
      console.log(JSON.stringify(tileDragFloatOld) + ' to ' + JSON.stringify(tileDragFloat))
    }
    while (!dragNew.equals(currentTileDrag))

    console.log("Stop drag");
    console.log("********************************");
*/


    this.unitChangeTileDrag(blueprint, previousTileDrag, currentTileDrag);
  }

  unitChangeTileDrag(blueprint: Template, previousTileDrag: Vector2, currentTileDrag: Vector2)
  {
    this.templateItemToBuild.position = currentTileDrag;
    this.build(blueprint);

    if (this.templateItemToBuild.oniItem.isWire)
    {
      let itemsPrevious = blueprint.getTemplateItemsAt(previousTileDrag).filter(i => i.id == this.templateItemToBuild.id);
      let itemsCurrent = blueprint.getTemplateItemsAt(currentTileDrag).filter(i => i.id == this.templateItemToBuild.id);

      if (itemsPrevious != null && itemsPrevious.length > 0 && itemsCurrent != null && itemsCurrent.length > 0)
      {
        let itemPrevious = itemsPrevious[0] as TemplateItemWire;
        let itemCurrent = itemsCurrent[0] as TemplateItemWire;

        this.connectAToB(itemPrevious, itemCurrent);
        this.connectAToB(itemCurrent, itemPrevious);
        itemPrevious.prepareSpriteInfoModifier(blueprint);
        itemCurrent.prepareSpriteInfoModifier(blueprint);
      }
    }
  }

  prepareSpriteInfoModifier(blueprint: Template)
  {
    this.templateItemToBuild.prepareSpriteInfoModifier(blueprint);
    this.templateItemToBuild.prepareBoundingBox();
  }

  drawPixi(drawPixi: DrawPixi, camera: Camera)
  {
    this.templateItemToBuild.drawPixi(camera, drawPixi);

    // Utility
    this.templateItemToBuild.drawPixi(camera, drawPixi);
  }

  draw(drawAbstraction: DrawAbstraction, camera: Camera) {
    drawAbstraction.drawBuild(this.templateItemToBuild, camera);
  }

  destroyTool() {
    if (this.templateItemToBuild != null) this.templateItemToBuild.destroy();
  }
}
