// Angular imports
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, Output, EventEmitter, HostListener } from '@angular/core';
//import { Http, Response } from "@angular/http"
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ComponentSidepanelComponent } from 'src/app/module-blueprint/components/side-bar/side-panel/side-panel.component';

// Engine imports
import { CameraService, IObsOverlayChanged } from 'src/app/module-blueprint/services/camera-service';
import { Vector2 } from 'src/app/module-blueprint/common/vector2';
import { SpriteInfo } from 'src/app/module-blueprint/drawing/sprite-info';
import { ImageSource } from 'src/app/module-blueprint/drawing/image-source';
import { OniTemplate } from 'src/app/module-blueprint/common/blueprint/io/oni/oni-template';
import { OniItem } from 'src/app/module-blueprint/common/oni-item';
import { OniBuilding } from 'src/app/module-blueprint/common/blueprint/io/oni/oni-building';
import { SpriteModifier } from 'src/app/module-blueprint/drawing/sprite-modifier';


// PrimeNg imports
import { TileInfo } from '../../common/tile-info';
import { Blueprint } from '../../common/blueprint/blueprint';
import { ZIndex, Overlay } from '../../common/overlay-type';
import { ToolType } from '../../common/tools/tool';
import { ComponentSideSelectionToolComponent } from '../side-bar/selection-tool/selection-tool.component';
import { DrawPixi } from '../../drawing/draw-pixi';
import * as JSZip from 'jszip';
import { BSpriteInfo } from '../../common/bexport/b-sprite-info';
import { BlueprintItem } from '../../common/blueprint/blueprint-item';
import { TechnicalRepack } from '../../common/technical-repack';
import { BlueprintService } from '../../services/blueprint-service';
import { ToolService } from '../../services/tool-service';


@Component({
  selector: 'app-component-canvas',
  templateUrl: './component-canvas.component.html',
  styleUrls: ['./component-canvas.component.css']
})
export class ComponentCanvasComponent implements OnInit, OnDestroy, IObsOverlayChanged  {

  width: number;
  height: number;

  debug: any;


  @ViewChild('blueprintCanvas', {static: true}) 
  canvasRef: ElementRef;

  @Output() onTileInfoChange = new EventEmitter<TileInfo>();

  drawPixi: DrawPixi;
  technicalRepack: TechnicalRepack;

  public get blueprint() { return this.blueprintService.blueprint; }
  constructor(
    private ngZone: NgZone,
    private blueprintService: BlueprintService,
    private cameraService: CameraService,
    private toolService: ToolService) {
    
    this.drawPixi = new DrawPixi();
    this.technicalRepack = new TechnicalRepack();
  }

  private running: boolean;
  ngOnInit() {
    // Start the rendering loop
    this.running = true;
    this.ngZone.runOutsideAngular(() => this.drawPixi.Init(this.canvasRef, this));

    //this.drawAbstraction.Init(this.canvasRef, this)
  }

  ngOnDestroy() {
    this.running = false;
  }

  public loadNewBlueprint(blueprint: Blueprint)
  {
    // First destroy the old blueprint
    if (this.blueprint != null) this.blueprint.destroy();

    // TODO make sure nothing creates a "real  blueprint" before this
    this.blueprint.importFromCloud(blueprint);
    this.cameraService.overlay = Overlay.Base; 

    let rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.cameraService.resetZoom(new Vector2(
      rect.width - rect.left,
      rect.height - rect.top
    ));
  }



  getCursorPosition(event): Vector2 {
    let rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return new Vector2(event.clientX - rect.left, event.clientY - rect.top);
  }

  getCurrentTile(event): Vector2
  {
    let returnValue = this.cameraService.getTileCoords(this.getCursorPosition(event));
    
    returnValue.x = Math.floor(returnValue.x);
    returnValue.y = Math.ceil(returnValue.y);

    return returnValue;
  }

  mouseWheel(event: any)
  {
    this.cameraService.zoom(event.delta, this.getCursorPosition(event));
  }

  mouseUp(event: any)
  {
    if (event.button == 0) 
    {
      this.storePreviousTileFloat = null;
    }
  }

  mouseDown(event: any)
  {
  
  }

  mouseOut(event: any) {
    this.toolService.mouseOut();
  }

  mouseClick(event: any)
  {
    if (event.button == 0) this.toolService.leftClick(this.getCurrentTile(event));
    else if (event.button == 2) this.toolService.rightClick(this.getCurrentTile(event));
  }

  storePreviousTileFloat: Vector2;
  mouseDrag(event: any)
  {
    let previousTileFloat = Vector2.clone(this.storePreviousTileFloat);
    let currentTileFloat = this.cameraService.getTileCoords(this.getCursorPosition(event));

    if (event.dragButton[2])
    {
      //console.log('camera drag');
      this.cameraService.cameraOffset.x += event.dragX / this.cameraService.currentZoom;
      this.cameraService.cameraOffset.y += event.dragY / this.cameraService.currentZoom;
    }
    else if (event.dragButton[0])
    {
      this.toolService.drag(previousTileFloat, currentTileFloat);

      let previousTile = previousTileFloat == null ? null : new Vector2(Math.floor(previousTileFloat.x), Math.ceil(previousTileFloat.y));
      let currentTile = new Vector2(Math.floor(currentTileFloat.x), Math.ceil(currentTileFloat.y));

      /*
      if (previousTileFloat != null && !previousTile.equals(currentTile))
      {
        console.log("********************************");
        console.log("Start drag from " + JSON.stringify(previousTileFloat) + ' to ' + JSON.stringify(currentTileFloat));

        do
        {
          
          let distanceToCurrent: Vector2 = new Vector2(currentTileFloat.x - previousTileFloat.x, currentTileFloat.y - previousTileFloat.y);
          
          
          let nextGrid: Vector2;
          nextGrid.x = currentTileFloat.x > previousTileFloat.x ? previousTile.x + 1 : previousTile.x - 1;
          nextGrid.y = currentTileFloat.y > previousTileFloat.y ? previousTile.y + 1 : previousTile.y - 1;

          let distanceToNextGrid = new Vector2(nextGrid.x - previousTileFloat.x, nextGrid.y - previousTileFloat.y);

          if (distanceToCurrent.x < distanceToNextGrid.x)
          {
            previousTileFloat
          }

          //nextGrid.x = previousTileFloat.x == previousTile.x ? previousTile.x
        }
        while (!currentTileFloat.equals(previousTileFloat))

      }
      */
      //if (previousTile != null)
      //  this.currentTool.changeTileDrag(this.blueprint, previousTile, currentTile);
      
    }

    this.storePreviousTileFloat = Vector2.clone(currentTileFloat);
  }

  mouseStopDrag(event: any)
  {
    this.storePreviousTileFloat = null;
    this.toolService.dragStop();
  }

  previousTileUnderMouse: Vector2;
  mouseMove(event: any)
  {
    
    let currentTileUnderMouse = this.getCurrentTile(event);

    if (this.previousTileUnderMouse == null || !this.previousTileUnderMouse.equals(currentTileUnderMouse))
      this.toolService.hover(currentTileUnderMouse);

    this.previousTileUnderMouse = currentTileUnderMouse;
    
  }


  keyPress(event: any)
  {
    console.log(event);
  }

  overlayChanged(newOverlay: Overlay) {
    this.prepareOverlayInfo();
  }

  prepareOverlayInfo()
  {
    if (this.blueprint != null) this.blueprint.prepareOverlayInfo(this.cameraService.overlay);
  }

  /*
   * 
   * Sprite repackaging 
   *
  */
  fetchIcons()
  {
    for (let k of ImageSource.keys) ImageSource.getBaseTexture(k);
    for (let k of SpriteInfo.keys) SpriteInfo.getSpriteInfo(k).getTexture();
  }

  downloadUtility()
  {
    let allWhiteFilter = new PIXI.filters.ColorMatrixFilter();
    // 1 1 1 0 1
    // 1 1 1 0 1
    // 1 1 1 0 1
    // 1 1 1 1 1
    allWhiteFilter.matrix[0] = 1;
    allWhiteFilter.matrix[1] = 1;
    allWhiteFilter.matrix[2] = 1;
    allWhiteFilter.matrix[4] = 1;
    allWhiteFilter.matrix[5] = 1;
    allWhiteFilter.matrix[6] = 1;
    allWhiteFilter.matrix[7] = 1;
    allWhiteFilter.matrix[9] = 1;
    allWhiteFilter.matrix[10] = 1;
    allWhiteFilter.matrix[11] = 1;
    allWhiteFilter.matrix[12] = 1;
    allWhiteFilter.matrix[14] = 1;

    ComponentCanvasComponent.zip = new JSZip();
    ComponentCanvasComponent.nbBlob = 0;
    ComponentCanvasComponent.downloadFile = 'solidUtility.zip';
    ComponentCanvasComponent.nbBlobMax = OniItem.oniItems.filter(o => o.isWire).length;
    
    for (let oniItem of OniItem.oniItems)
    {
      // TODO bridge here also
      if (!oniItem.isWire) continue;

      let baseTexture = ImageSource.getBaseTexture(oniItem.imageId);
      
      let texture = new PIXI.Texture(baseTexture);
      
      let brt = new PIXI.BaseRenderTexture({width: texture.width, height: texture.height});
      let rt = new PIXI.RenderTexture(brt);

      let sprite = PIXI.Sprite.from(texture);
      sprite.filters = [allWhiteFilter];

      this.drawPixi.pixiApp.renderer.render(sprite, rt);

      this.drawPixi.pixiApp.renderer.extract.canvas(rt).toBlob((b) => 
      {
        this.addBlob(b, oniItem.imageId + '_solid.png');
      }, 'image/png');
    }
  }

  repackTextures(database: any)
  {
    let uiSprites: BSpriteInfo[] = database.uiSprites;
    let newSpriteInfos: BSpriteInfo[] = [];


    let packSize = new Vector2(1024, 1024);
    let bleedSize: number = 10;
    let repackIndex = -1;
    let currentUv = Vector2.clone(Vector2.Zero);
    let currentLineHeight = 0;
    let baseString = 'repack_';
    let currentTextureName = baseString + repackIndex;
    let renderTextures: PIXI.RenderTexture[] = [];
    let newRenderTarget: boolean = true;
    for (let k of SpriteInfo.keys)
    {
      let spriteInfo = SpriteInfo.getSpriteInfo(k);
      
      // First copy the sprite info into the BSpriteInfo.
      // We need to start from the start info because some of them are generated (tiles)
      let newSpriteInfo = new BSpriteInfo();
      newSpriteInfo.name = spriteInfo.spriteInfoId;
      newSpriteInfo.uvMin = Vector2.clone(spriteInfo.uvMin);
      newSpriteInfo.uvSize = Vector2.clone(spriteInfo.uvSize);
      newSpriteInfo.realSize = Vector2.clone(spriteInfo.realSize);
      newSpriteInfo.pivot = Vector2.clone(spriteInfo.pivot);
      newSpriteInfo.isIcon = spriteInfo.isIcon;

      // If the sprite does not enter at all in our pack, log it and move on
      if (newSpriteInfo.uvSize.x > packSize.x || newSpriteInfo.uvSize.y > packSize.y)
      {
        console.log(newSpriteInfo.name + ' does not fit');
        console.log(newSpriteInfo);

        continue;
      }

      
      newSpriteInfos.push(newSpriteInfo);

      let fitHeight = (currentUv.y + newSpriteInfo.uvSize.y) <= packSize.y;
      let fitWidth = (currentUv.x + newSpriteInfo.uvSize.x) <= packSize.x;

      
      // If there is no vertical space, we start a new texture
      if (!fitHeight) newRenderTarget = true;

      // If there is no horizontal space, we start a new line
      if (!fitWidth)
      {
        // Add one pixel vertically to account for mipmapping
        currentUv.x = 0;
        currentUv.y += Math.ceil(currentLineHeight) + bleedSize;
        currentLineHeight = 0;

        // And now we have to check for height again
        fitHeight = (currentUv.y + newSpriteInfo.uvSize.y) <= packSize.y;
        if (!fitHeight) newRenderTarget = true;
      }

      if (newRenderTarget)
      {
        newRenderTarget = false;
        currentUv = Vector2.zero();
        repackIndex++;
        currentTextureName = baseString + repackIndex;

        // Create new renderTarget if currentUv = 0
        // Save the previous renderTarget
        let brt = new PIXI.BaseRenderTexture({width: packSize.x, height: packSize.y});
        let rt = new PIXI.RenderTexture(brt);
        //console.log(rt);
        renderTextures.push(rt);
        //console.log(renderTextures);
        //console.log('creating render target ' + currentTextureName)
        //console.log(renderTextures.length)
      }
      

      // Change the textureName to the repacked texture
      newSpriteInfo.textureName = currentTextureName;

      // Change the uvMin in the newSpriteInfo
      newSpriteInfo.uvMin = Vector2.clone(currentUv);

      // Add the sprite width +1 to account for mipmaps
      currentUv.x += Math.ceil(newSpriteInfo.uvSize.x) + bleedSize;
      
      // Update the current line height, if it is taller than the other sprites in this line
      if (newSpriteInfo.uvSize.y > currentLineHeight) currentLineHeight = newSpriteInfo.uvSize.y;

      // Draw the sprite to the renderTarget
      let sprite = PIXI.Sprite.from(SpriteInfo.getSpriteInfo(newSpriteInfo.name).getTexture());

      sprite.x = newSpriteInfo.uvMin.x;
      sprite.y = newSpriteInfo.uvMin.y;
      //console.log('drawing ' + newSpriteInfo.name + ' on render target ' + repackIndex);
      //console.log(newSpriteInfo.uvMin);
      this.drawPixi.pixiApp.renderer.render(sprite, renderTextures[repackIndex], false);
    }

    database.uiSprites = newSpriteInfos;

    ComponentCanvasComponent.zip = new JSZip();
    ComponentCanvasComponent.nbBlob = 0;
    ComponentCanvasComponent.downloadFile = 'repackedTextureAndDatabase.zip';
    ComponentCanvasComponent.nbBlobMax = renderTextures.length;

    ComponentCanvasComponent.zip.file('database_repacked.json', JSON.stringify(database, null, 2));

    for (let indexRt = 0; indexRt < renderTextures.length; indexRt++)
    {
      let rt = renderTextures[indexRt];

      this.drawPixi.pixiApp.renderer.extract.canvas(rt).toBlob((b) => 
      {
        this.addBlob(b, baseString + indexRt + '.png');
      }, 'image/png');
    }
  }
  
  downloadIcons()
  {
    
    ComponentCanvasComponent.zip = new JSZip();
    ComponentCanvasComponent.nbBlob = 0;
    ComponentCanvasComponent.downloadFile = 'icons.zip';
    ComponentCanvasComponent.nbBlobMax = SpriteInfo.keys.filter(s => SpriteInfo.getSpriteInfo(s).isIcon).length;
    
    for (let k of SpriteInfo.keys.filter(s => SpriteInfo.getSpriteInfo(s).isIcon))
    {
      let uiSpriteInfo = SpriteInfo.getSpriteInfo(k);
      let texture = uiSpriteInfo.getTexture();
      let uiSPrite = PIXI.Sprite.from(texture);

      this.drawPixi.pixiApp.renderer.extract.canvas(uiSPrite).toBlob((b) => 
      {
        this.addBlob(b, k + '.png');
      }, 'image/png');
    }
  }

  private static downloadFile: string;
  private static nbBlobMax: number;
  private static nbBlob: number;
  private static zip: JSZip;
  addBlob(blob: Blob, filename: string)
  {

    ComponentCanvasComponent.nbBlob++;
    ComponentCanvasComponent.zip.file(filename, blob);

    if (ComponentCanvasComponent.nbBlob == ComponentCanvasComponent.nbBlobMax)
    {
      console.log('last blob arrived!');
      ComponentCanvasComponent.zip.generateAsync({type:"blob"}).then(function (blob) { 
        let a = document.createElement('a');
        document.body.append(a);
        a.download = ComponentCanvasComponent.downloadFile;
        a.href = URL.createObjectURL(blob);
        a.click();
        a.remove();                     
      }); 
    }
  }

  drawAll()
  {
    //console.log(this.running);
    //console.log('tick');
    // Check that we're still running.
    if (!this.running) {
      return;
    }


    // Whole page dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    //console.log('tick');
    // TODO ugly
    //if (this.canvasRef == null) return;

    this.canvasRef.nativeElement.width = window.innerWidth - 301;
    this.canvasRef.nativeElement.height = window.innerHeight;

    
    this.cameraService.updateZoom();
    this.cameraService.updateSinWave(this.drawPixi.pixiApp.ticker.elapsedMS);

    //console.log('tick');
    //this.drawAbstraction.Init(this.canvasRef, this);

    //let ctx: CanvasRenderingContext2D = this.canvasRef.nativeElement.getContext('2d');

    this.drawPixi.clearGraphics();
    this.drawPixi.FillRect(0x007AD9, 0, 0, this.width, this.height);
    
    let alphaOrig: number = 0.4;
    let alpha: number = alphaOrig;
    let realLineSpacing: number = this.cameraService.currentZoom;

    let zoomFadeMax: number = 35;
    let zoomFadeMin: number = 25;
    if (this.cameraService.currentZoom < zoomFadeMax)
      alpha *= (this.cameraService.currentZoom - zoomFadeMin) / (zoomFadeMax - zoomFadeMin);
    if (this.cameraService.currentZoom < zoomFadeMin)
      alpha = 0;


    //while (realLineSpacing < 30)
    //  realLineSpacing *= 5;

    let colOrig: number = this.cameraService.cameraOffset.x * this.cameraService.currentZoom % (realLineSpacing * 5) - realLineSpacing * 4;
    let mod = 0;
    for (let col = colOrig; col < this.width + realLineSpacing * 4; col += realLineSpacing)
    {
      let realAlpha = (mod % 5) == 0 ? alphaOrig + 0.3 : alpha;
      let color = 'rgba(255,255,255, '+realAlpha+')';
      if (realAlpha > 0) this.drawPixi.drawBlueprintLine(color, realAlpha, new Vector2(col, 0), new Vector2(col, this.height), 1);
      mod++;
    }

    let lineOrig = this.cameraService.cameraOffset.y * this.cameraService.currentZoom % (realLineSpacing * 5) - realLineSpacing * 4
    mod = 0;
    for (let line = lineOrig; line < this.height + realLineSpacing * 4; line += realLineSpacing)
    {
      let realAlpha = (mod % 5) == 0 ? alphaOrig + 0.3 : alpha;
      let color = 'rgba(255,255,255, '+realAlpha+')';
      if (realAlpha > 0) this.drawPixi.drawBlueprintLine(color, realAlpha, new Vector2(0, line), new Vector2(this.width, line), 1);
      mod++;
    }

    if (this.blueprint != null)
    {
      for (var templateItem of this.blueprint.blueprintItems)
      {
        templateItem.prepareSpriteInfoModifier(this.blueprint);
        this.drawPixi.drawTemplateItem(templateItem, this.cameraService);
        //templateItem.draw(ctx, this.camera);
      }
      
      this.toolService.draw(this.drawPixi, this.cameraService);
    }

    // Schedule next
    //requestAnimationFrame(() => this.drawAll());
  }
  
  drawBlueprintLine(ctx: CanvasRenderingContext2D, xStart: number, yStart: number, xEnd: number, yEnd: number, lineWidth: number, alpha: number)
  {
    let offset: number = (lineWidth % 2) / 2;

    ctx.beginPath();
    ctx.moveTo(Math.floor(xStart) + offset, Math.floor(yStart) + offset);
    ctx.strokeStyle = "rgba(255,255,255, "+alpha+")";
    ctx.lineWidth = lineWidth;
    ctx.lineTo(Math.floor(xEnd) + offset, Math.floor(yEnd) + offset);
    ctx.stroke();
  }

}
