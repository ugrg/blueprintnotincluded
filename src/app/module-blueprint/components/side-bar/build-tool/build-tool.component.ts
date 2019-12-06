import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { OniItem } from '../../../common/oni-item';
import {SelectItem} from 'primeng/api';
import { BlueprintItem } from '../../../common/blueprint/blueprint-item';
import { Blueprint } from '../../../common/blueprint/blueprint';
import { ToolType } from '../../../common/tools/tool';
import { TileInfo } from '../../../common/tile-info';
import { BlueprintItemWire } from '../../../common/blueprint/blueprint-item-wire';
import { CameraService } from '../../../services/camera-service';
import { Vector2 } from '../../../common/vector2';
import { DrawHelpers } from '../../../drawing/draw-helpers';
import { DrawPixi } from '../../../drawing/draw-pixi';
import { BuildMenuCategory, BuildMenuItem } from '../../../common/bexport/b-build-order';
import { ToolService, IObsToolChanged } from 'src/app/module-blueprint/services/tool-service';
import { IObsTemplateItemChanged } from 'src/app/module-blueprint/common/tools/select-tool';
import { IObsBuildItemChanged } from 'src/app/module-blueprint/common/tools/build-tool';
import { BlueprintHelpers } from 'src/app/module-blueprint/common/blueprint/blueprint-helpers';
import { Dropdown } from 'primeng/dropdown';
import { OverlayPanel } from 'primeng/overlaypanel';
import { BuildableElement } from 'src/app/module-blueprint/common/bexport/b-element';



@Component({
  selector: 'app-build-tool',
  templateUrl: './build-tool.component.html',
  styleUrls: ['./build-tool.component.css']
})
export class ComponentSideBuildToolComponent implements OnInit, IObsBuildItemChanged, IObsToolChanged {

  items: OniItem[][];

  get buildMenuCategories() { return BuildMenuCategory.buildMenuCategories; }

  currentCategory: BuildMenuCategory;
  currentItem: OniItem;

  @ViewChild('categoryPanel', {static: true}) categoryPanel: OverlayPanel;
  @ViewChild('itemPanel', {static: true}) itemPanel: OverlayPanel;
  @ViewChild('itemPanelTarget', {static: true}) itemPanelTarget: ElementRef;

  constructor(public toolService: ToolService) 
  {
    this.toolService.buildTool.subscribeBuildItemChanged(this);
    this.toolService.subscribeToolChanged(this);
  }

  // TODO the template for the dropdowns fixes the width, whereas the template for the list fixes the height

  ngOnInit() {
  }

  databaseLoaded: boolean = false;
  oniItemsLoaded()
  {
    this.currentItem = OniItem.getOniItem('Tile');
    this.databaseLoaded = true;
  }

  showCategories(event: any) {
    this.categoryPanel.toggle(event);
    this.itemPanel.hide();
  }

  showItems(event: any, buildMenuCategory: BuildMenuCategory) {

    

    this.items = [];
    
    let lineIndex = 0;
    let itemIndex = 0;

    for (let buildMenuItem of BuildMenuItem.buildMenuItems)
      if (buildMenuCategory.category == buildMenuItem.category) {
        let oniItem = OniItem.getOniItem(buildMenuItem.buildingId);
        if (this.items[lineIndex] == null) this.items.push([]);

        this.items[lineIndex].push(oniItem);
        itemIndex++;

        if (itemIndex > 6) {
          itemIndex = 0;
          lineIndex++;
        }
      }

    if (this.currentCategory == buildMenuCategory) this.itemPanel.toggle(event);
    else this.itemPanel.show(event);

    this.currentCategory = buildMenuCategory;
  }

  chooseItem(item: OniItem) {
    this.itemPanel.hide();
    this.currentItem = item;
    this.uiItemChanged();
  }

  changeElement(element: BuildableElement) {
    this.toolService.buildTool.templateItemToBuild.element = element.id;
  }

  uiItemChanged()
  {
    this.toolService.buildTool.changeItem(BlueprintHelpers.createInstance(this.currentItem.id));
  }

  onFocus() {
    //this.focusTarget.nativeElement.focus();
  }

  // IObsBuildItemChanged
  itemChanged(templateItem: BlueprintItem) {
    this.currentItem = templateItem.oniItem;
  }

  // IObsToolChanged
  toolChanged(toolType: ToolType) {
    // If the build tool was just selected,
    // We simulate a click to recreate the build tool template item
    if (toolType == ToolType.build) this.uiItemChanged();
  }

  setOriginal(templateItem: BlueprintItem)
  {
    // TODO in setTemplateItem
    //this.currentCategory = templateItem.oniItem.category;
    this.currentItem = templateItem.oniItem;

    
  }







  











  /************************
  ** Tool interface      **
  ************************/
  toolType = ToolType.build;
  
  setTemplateItem(templateItem: BlueprintItem) 
  {
    /*
    // TODO fixme
    if (templateItem != null) this.changeItem_(templateItem.cloneForBuilding());
    else
    {
      this.changeItem();
    }
    */
  }

  leftMouseDown(blueprint: Blueprint, tile: Vector2) 
  {
    //this.build(blueprint);
  }

  leftMouseUp(blueprint: Blueprint, tile: Vector2) 
  {
    // TODO tentative placement, build on leftMouseUp
  }

  changeTileDrag(blueprint: Blueprint, previousTileDrag: Vector2, currentTileDrag: Vector2)
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

  unitChangeTileDrag(blueprint: Blueprint, previousTileDrag: Vector2, currentTileDrag: Vector2)
  {
    //this.templateItemToBuild.position = currentTileDrag;
    //this.build(blueprint);

    /*
    if (this.templateItemToBuild.oniItem.isWire)
    {
      let itemsPrevious = blueprint.getTemplateItemsAt(previousTileDrag).filter(i => i.id == this.templateItemToBuild.id);
      let itemsCurrent = blueprint.getTemplateItemsAt(currentTileDrag).filter(i => i.id == this.templateItemToBuild.id);

      if (itemsPrevious != null && itemsPrevious.length > 0 && itemsCurrent != null && itemsCurrent.length > 0)
      {
        let itemPrevious = itemsPrevious[0] as TemplateItemWire;
        let itemCurrent = itemsCurrent[0] as TemplateItemWire;

        //this.connectAToB(itemPrevious, itemCurrent);
        //this.connectAToB(itemCurrent, itemPrevious);
        itemPrevious.prepareSpriteInfoModifier(blueprint);
        itemCurrent.prepareSpriteInfoModifier(blueprint);
      }
      */
    
  }

}

