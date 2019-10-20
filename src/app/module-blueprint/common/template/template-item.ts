import { Vector2 } from "../vector2";
import { OniItem, AuthorizedOrientations } from "../oni-item";
import { OniBuilding } from "../../oni-import/oni-building";
import { ImageSource } from "../../drawing/image-source";
import { SpriteInfo } from "../../drawing/sprite-info";
import { SpriteModifier } from "../../drawing/sprite-modifier";
import { Camera } from "../camera";
import { ConnectionType, ConnectionHelper } from "../utility-connection";
import { OverlayType } from "../overlay-type";
import { DrawHelpers } from "../../drawing/draw-helpers";
import { ComposingElement } from "../composing-element";
import { Template } from "./template";
import { TemplateItemCloneable } from "./template-item-cloneable";
import { OniCell } from "../../oni-import/oni-cell";
import { Container } from 'pixi.js';
import { DrawPixi } from '../../drawing/draw-pixi';
declare var PIXI: any;
//import { Texture, BaseTexture, Rectangle } from "pixi.js";

export class TemplateItem implements TemplateItemCloneable<TemplateItem>
{
  public static vacuumItem = new TemplateItem();
  static defaultRotation = 0;
  static defaultScale = Vector2.One;

  public id: string;
  public element: ComposingElement;
  public temperature: number;
  public backColor: string;
  public frontColor: string;

  position: Vector2;
  orientation: AuthorizedOrientations;
  rotation: number;
  scale: Vector2;
  get oniItem() { return OniItem.getOniItem(this.id); };

  topLeft: Vector2;
  bottomRight: Vector2;

  // Drawing stuff
  public realSpriteModifierId: string;
  realSpriteInfo: SpriteInfo;
  realSpriteModifier: SpriteModifier;

  depth: number;
  alpha: number;
  correctOverlay: boolean;

  innerYaml: any;

  // TODO remove
  rotationOrientation: string;

  constructor(id: string = 'Vacuum')
  {
      this.id = id;
  }

  getName(): string
  {
      return this.id;
  }

  getDebug1(): string
  {
    //return '';
    let debug:any = {};
    debug.imageId = this.oniItem.imageId;
    return JSON.stringify(debug);
  }

  getDebug2(): string
  {
    //return '';
    let debug:any = {};
    debug.defaultOverlay = this.oniItem.defaultOverlay.toString();
      //debug.framebboxMin = this.realSpriteModifier.framebboxMin;
    return JSON.stringify(debug);
  }

  getDebug3(): string
  {
    return '';
    let debug:any = {};
    //if (this.realSpriteModifier != null && this.realSpriteModifier.getLastPart() != null)
    //  debug.scale = this.realSpriteModifier.getLastPart().scale;
      //debug.framebboxMax = this.realSpriteModifier.framebboxMax;
    return JSON.stringify(debug);
  }

  getDebug4(): string
  {
    return '';
    let debug:any = {};
    if (this.realSpriteModifier != null)
      //debug.framebboxMin = this.realSpriteModifier.framebboxMin;
      //debug.framebboxMax = this.realSpriteModifier.framebboxMax;
    return JSON.stringify(debug);
  }

  getDebug5(): string
  {

    return '';
    let debug:any = {};
    if (this.realSpriteModifier != null)
      //debug.framebboxMax = this.realSpriteModifier.framebboxMax;
      //debug.framebboxMax = this.realSpriteModifier.framebboxMax;
    return JSON.stringify(debug);
  }

  public importOniBuilding(building: OniBuilding)
  {
      this.position = new Vector2(
          building.location_x == null ? 0 : building.location_x,
          building.location_y == null ? 0 : building.location_y
      );
      
      switch (building.rotationOrientation)
      {
        case 'R90':
          this.changeOrientation(AuthorizedOrientations.R90);
          break;
        case 'R180':
          this.changeOrientation(AuthorizedOrientations.R180);
          break;
        case 'R270':
          this.changeOrientation(AuthorizedOrientations.R270);
          break;
        case 'FlipH':
          this.changeOrientation(AuthorizedOrientations.FlipH);
          break;
        case 'FlipV':
          this.changeOrientation(AuthorizedOrientations.FlipV);
          break;
      }

      // TODO remove
      this.rotationOrientation = building.rotationOrientation;

      this.element = ComposingElement.getElement(building.element);
      this.temperature = Math.floor(building.temperature);
      this.backColor = this.oniItem.defaultColor;

      this.cleanUp();
      this.prepareBoundingBox();

      this.innerYaml = building;
  }

  public importOniCell(cell: OniCell)
  {
    this.position = new Vector2(
      cell.location_x == null ? 0 : cell.location_x,
      cell.location_y == null ? 0 : cell.location_y
    );

    this.element = ComposingElement.getElement(cell.element);
    this.temperature = Math.floor(cell.temperature);
    
    this.cleanUp();
    this.prepareBoundingBox();
  }

  private updateRotationScale()
  {
    switch (this.orientation)
    {
      case AuthorizedOrientations.None:
        this.rotation = 0;
        this.scale = Vector2.One;
        break;
      case AuthorizedOrientations.R90:
        this.rotation = 90;
        this.scale = Vector2.One;
        break;
      case AuthorizedOrientations.R180:
        this.rotation = 180;
        this.scale = Vector2.One;
        break;
      case AuthorizedOrientations.R270:
        this.rotation = 270;
        this.scale = Vector2.One;
        break;
      case AuthorizedOrientations.FlipH:
        this.rotation = 0;
        this.scale = new Vector2(-1, 1);
        break;
      case AuthorizedOrientations.FlipV:
        this.rotation = 0;
        this.scale = new Vector2(1, -1);
        break;
    }

  }

    public importFromCloud(original: TemplateItem)
    {
      this.position = Vector2.clone(original.position);
      this.rotation = original.rotation;
      this.scale = original.scale;
      if (original.element != null) this.element = ComposingElement.getElement(original.element.elementId);
      
      // TODO default temperature
      this.temperature = original.temperature;
      this.backColor = original.backColor;
      this.changeOrientation(original.orientation);

      this.cleanUp();
      this.prepareBoundingBox();
    }

    // TODO setter instead
    changeOrientation(newOrientation: AuthorizedOrientations)
    {
      this.orientation = newOrientation;
      this.updateRotationScale();
    }

    public cleanUp()
    {
      if (this.rotation == null) this.rotation = TemplateItem.defaultRotation;
      if (this.scale == null) this.scale = TemplateItem.defaultScale;
      if (this.backColor == null) this.backColor = this.oniItem.defaultColor;
      if (this.backColor == null) this.backColor = OniItem.defaultColor;
      if (this.frontColor == null) this.frontColor = DrawHelpers.whiteColor;
      if (this.element == null) this.element = ComposingElement.unknownElement;

      if (this.orientation == null) this.changeOrientation(AuthorizedOrientations.None);
      

    }
  
  public clone(): TemplateItem
  {
    let returnValue = new TemplateItem(this.id);

    returnValue.copyFromForExport(this);
    returnValue.cleanUp();

    return returnValue;
  }

  public cloneForExport(): TemplateItem
  {
    let returnValue = new TemplateItem(this.id);

    returnValue.copyFromForExport(this);
    returnValue.deleteDefaultForExport()

    return returnValue;
  }

  public cloneForBuilding(): TemplateItem
  {
    let returnValue = new TemplateItem(this.id);

    returnValue.copyFromForExport(this);
    returnValue.cleanUp();

    return returnValue;
  }

  public copyFromForExport(original: TemplateItem)
  {
    this.element = original.element;
    this.temperature = original.temperature;
    this.backColor = original.backColor;
    this.position = original.position;
    this.changeOrientation(original.orientation);
  }

  public deleteDefaultForExport()
  {
    let defaultColor = this.oniItem.defaultColor;
    if (defaultColor == null) defaultColor = OniItem.defaultColor;

    if (defaultColor == this.backColor) this.backColor = undefined;
    if (AuthorizedOrientations.None == this.orientation) this.orientation = undefined;

    // We already export the orientation
    this.rotation = undefined;
    this.scale = undefined
  }

    public prepareBoundingBox()
    {
      let realSize = this.oniItem.size;
      if (Vector2.Zero.equals(realSize)) realSize = Vector2.One;

      let originalTopLeft = new Vector2(
        this.position.x + this.oniItem.tileOffset.x,
        this.position.y + this.oniItem.tileOffset.y + realSize.y - 1
      );
      let orignialBottomRight = new Vector2(
        originalTopLeft.x + realSize.x - 1,
        originalTopLeft.y - realSize.y + 1
      );


      let rotatedTopLeft = DrawHelpers.rotateVector2(originalTopLeft, this.position, this.rotation);
      let rotatedBottomRight = DrawHelpers.rotateVector2(orignialBottomRight, this.position, this.rotation);
      let flippedTopLeft =  DrawHelpers.scaleVector2(rotatedTopLeft, this.position, this.scale);
      let flippedBottomRight = DrawHelpers.scaleVector2(rotatedBottomRight, this.position, this.scale);

      

      this.topLeft = new Vector2(
        flippedTopLeft.x < flippedBottomRight.x ? flippedTopLeft.x : flippedBottomRight.x,
        flippedTopLeft.y > flippedBottomRight.y ? flippedTopLeft.y : flippedBottomRight.y,
      );
      this.bottomRight = new Vector2(
        flippedTopLeft.x > flippedBottomRight.x ? flippedTopLeft.x : flippedBottomRight.x,
        flippedTopLeft.y < flippedBottomRight.y ? flippedTopLeft.y : flippedBottomRight.y,
      );
    }

    public prepareSpriteInfoModifier(blueprint: Template)
    {
        // If there is no spriteInfoId, we use the item id to prevent collision between image sizes
        //this.realSpriteInfoId =  this.oniItem.spriteInfoId == null ? this.oniItem.id : this.oniItem.spriteInfoId;
        // TODO The export should tell us :
        // * the main place id, and left / right / up / down
        // * the id for the ui icon
        this.realSpriteModifierId = this.oniItem.spriteModifierId + 'place';
    }

    public prepareOverlayInfo(currentOverlay: OverlayType)
    {
      // Special case : we show the buildings in element mode
      // TODO general case for elements
      if (currentOverlay == OverlayType.Gas) currentOverlay = OverlayType.Building;

      if (currentOverlay == this.oniItem.defaultOverlay)
      {
          this.alpha = 1;
          this.depth = 10;
          this.correctOverlay = true;
      }
      else
      {
          this.alpha = 0.3;
          this.depth = 0;
          this.correctOverlay = false;
      }
    }

    // Pixi stuff
    sprite: PIXI.Sprite;
    utilitySprites: PIXI.Sprite[];
    container: PIXI.Container;
    public drawPixi(camera: Camera, drawPixi: DrawPixi)
    {
      this.drawPixiUtility(camera, drawPixi);

      this.realSpriteModifier = SpriteModifier.getSpriteModifer(this.realSpriteModifierId);
      this.realSpriteInfo = SpriteInfo.getSpriteInfo(this.realSpriteModifier.spriteInfoName);
      
      if (this.sprite == null)
      {
        this.container = new Container();
        drawPixi.pixiApp.stage.addChild(this.container);
        let texture = this.realSpriteInfo.getTexture();

        if (texture != null) 
        {
          // TODO sprite should change if modifier changes
          // TODO Invert pivoTY in export
          this.sprite = PIXI.Sprite.from(texture);
          this.sprite.anchor.set(this.realSpriteInfo.pivot.x, 1-this.realSpriteInfo.pivot.y);
          this.container.addChild(this.sprite);
        }
      }

      if (this.sprite != null)
      {
        // TODO simplify math here
        let position = this.position;

        let positionCorrected = new Vector2(
          ( position.x + camera.cameraOffset.x + 0.5) * camera.currentZoom,
          (-position.y + camera.cameraOffset.y + 0.5) * camera.currentZoom
        );

        // If the texture has not loaded, draw a debug rectangle
        if (!this.sprite.texture.baseTexture.valid) this.drawPixiDebug(camera, drawPixi, positionCorrected);

        this.sprite.texture = this.realSpriteInfo.getTexture();
        this.sprite.anchor.set(this.realSpriteInfo.pivot.x, 1-this.realSpriteInfo.pivot.y);

        let realSize = new Vector2(this.oniItem.size.x * 1, this.oniItem.size.y * 1);

        
            
        let sizeCorrected = new Vector2(
          camera.currentZoom / 100 * this.realSpriteInfo.realSize.x,
          camera.currentZoom / 100 * this.realSpriteInfo.realSize.y
        );

        this.container.x = positionCorrected.x;
        this.container.y = positionCorrected.y;
        
        this.container.scale.x = this.scale.x;
        this.container.scale.y = this.scale.y;
        this.container.angle = this.rotation;
        

        let tileOffset: Vector2 = new Vector2(
          this.oniItem.size.x % 2 == 0 ? 50 : 0,
          -50
        );
        this.sprite.x = 0 + (this.realSpriteModifier.translation.x + tileOffset.x) * camera.currentZoom / 100;
        this.sprite.y = 0 - (this.realSpriteModifier.translation.y + tileOffset.y) * camera.currentZoom / 100;
        


        this.sprite.scale.x = this.realSpriteModifier.scale.x;
        this.sprite.scale.y = this.realSpriteModifier.scale.y;
        // TODO invert rotation in export
        this.sprite.angle = -this.realSpriteModifier.rotation;
        this.sprite.width = sizeCorrected.x;
        this.sprite.height = sizeCorrected.y;

      }

      
    }

    private drawPixiUtility(camera: Camera, drawPixi: DrawPixi)
    {
      if (this.utilitySprites == null) this.utilitySprites = [];
      

      for (let connexionIndex=0; connexionIndex < this.oniItem.utilityConnections.length; connexionIndex++)
      {
        let connection = this.oniItem.utilityConnections[connexionIndex];

        // Pass to the next connection if this one should not be displayed on this overlay
        if (camera.overlay != ConnectionHelper.getConnectionOverlay(connection.type)) 
        {
          // First we disable the sprites if they are created, then we move on the the next connection
          if (this.utilitySprites[connexionIndex] != null) this.utilitySprites[connexionIndex].visible = false;
          continue;
        }
        else if (this.utilitySprites[connexionIndex] != null) this.utilitySprites[connexionIndex].visible = true;

        let connectionPosition = DrawHelpers.rotateVector2(connection.offset, Vector2.Zero, this.rotation);
        connectionPosition = DrawHelpers.scaleVector2(connectionPosition, Vector2.Zero, this.scale);


        let drawPos = new Vector2(
            (this.position.x + connectionPosition.x + camera.cameraOffset.x + 0.25) * camera.currentZoom,
            (-this.position.y - connectionPosition.y + camera.cameraOffset.y + 0.25) * camera.currentZoom
        );
        let drawSize = new Vector2(
            0.5 * camera.currentZoom,
            0.5 * camera.currentZoom
        );

        if (this.utilitySprites[connexionIndex] == null) 
        {
          let connectionSprite = ConnectionHelper.getConnectionSprite(connection);
          let connectionSpriteInfo = SpriteInfo.getSpriteInfo(connectionSprite.spriteInfoId);
          if (connectionSpriteInfo != null)
          {
            let connectionTexture = connectionSpriteInfo.getTexture();
            if (connectionTexture != null)
            {
              this.utilitySprites[connexionIndex] = PIXI.Sprite.from(connectionTexture);
              this.utilitySprites[connexionIndex].tint = connectionSprite.color;
              drawPixi.pixiApp.stage.addChild(this.utilitySprites[connexionIndex]);
            }
          }
        }

        // TODO correct sizes pour incons
        // TODO debug Rectangle in front
        // TODO debug rectangle only when not loaded
        // TODO debug rectanlge correct color
        if (this.utilitySprites[connexionIndex] != null)
        {
          this.utilitySprites[connexionIndex].x = drawPos.x;
          this.utilitySprites[connexionIndex].y = drawPos.y;
          this.utilitySprites[connexionIndex].width = drawSize.x;
          this.utilitySprites[connexionIndex].height = drawSize.y;
        }


        //drawPixi.FillRect(0xFFFF00, drawPos.x, drawPos.y, drawSize.x, drawSize.y)

      }
    }

    private drawPixiDebug(camera: Camera, drawPixi: DrawPixi, positionCorrected: Vector2)
    {
      // TODO maybe draw the debug rectangle on the build tool also?
      drawPixi.drawDebugRectangle(camera, this.topLeft, this.bottomRight, this.oniItem.debugColor);
      
      drawPixi.graphics.lineStyle(2, 0x000000, 1);
      drawPixi.graphics.moveTo(positionCorrected.x - 5, positionCorrected.y);
      drawPixi.graphics.lineTo(positionCorrected.x + 5, positionCorrected.y);
      drawPixi.graphics.moveTo(positionCorrected.x, positionCorrected.y - 5);
      drawPixi.graphics.lineTo(positionCorrected.x, positionCorrected.y + 5);
    }

    public destroy()
    {

      // Destroy the main sprite
      if (this.container != null) this.container.destroy({baseTexture: false, texture: false, children: true});
      
      // And the utility sprites
      if (this.utilitySprites != null)
        for (let s of this.utilitySprites)
          if (s != null)
            s.destroy();
    }

}