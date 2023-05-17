import { peer, otherPeer  } from './meeting.js';

//const fmin = require('./fmin');

//const LeastSquares = require("least-squares");

export var history = "";
export function setHistory(newValue) {
    history = newValue;
}

const maxPointForBezierCurve = 50;

const CHECK_STEPS = 5;

const MAX_BERR = 3;
const MAX_MERR = 1;

var pen_size = 2;
var pen_color = "0x000000";
var eraser_size = 10;
var text_size = 14;
var text_color = "0x000000";

var writing_on_board = false;

export var canvasElements;

var textStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: text_size,
    fill: text_color,
});

var p_text = new PIXI.Text("Hello, world!", textStyle);

var last_mouse_button = 0;

const penSizeInput = document.getElementById("pen-size");

// listen for changes to the pen size input
penSizeInput.addEventListener("input", () => {
  // get the new pen size value
  pen_size = parseInt(penSizeInput.value);
  
});

const eraserSizeInput = document.getElementById("eraser-size");

// listen for changes to the pen size input
eraserSizeInput.addEventListener("input", () => {
  // get the new pen size value
  eraser_size = parseInt(eraserSizeInput.value);
  
});

// get the pen color select element
const penColorSelect = document.getElementById("pen-color");

// listen for changes to the pen color select
penColorSelect.addEventListener("change", () => {
  // get the new pen color value
  pen_color = parseInt(penColorSelect.value);
  
});



// get references to the pen-size input and the "Sample Text" element
const textSizeInput = document.getElementById("text-size");
const sampleTextPointer = document.getElementById("sample-text");
const textColorSelect = document.getElementById("text-color");

// add an event listener to the pen-size input
textSizeInput.addEventListener("input", () => {
  // update the text of the "Sample Text" element
  sampleTextPointer.textContent = "Sample Text";
  
  // update the font size of the "Sample Text" element based on the value of the pen-size input
  const fontSize = `calc(${textSizeInput.value}px + (16px - ${textSizeInput.min}px) * (${textSizeInput.value} / (${textSizeInput.max} - ${textSizeInput.min})))`;
  sampleTextPointer.style.fontSize = fontSize;

  if(writing_on_board){
    const mess = currentPenType +
        "|" +
        currentZIndex +
        "|" +
        text_size +
        "|" +
        text_color +
        "|" +
        p_text.text +
        "|" +
        p_text.x +
        "|" +
        p_text.y;
    otherPeer.send(
        mess
    );
    history += mess + "\n";
    writing_on_board = false;
  }

    text_size = textSizeInput.value;

});

textColorSelect.addEventListener("change", () => {
    // get the selected option value
    const fontColor = textColorSelect.value;
    
    // update the color of the "Sample Text" element
    sampleTextPointer.style.color = fontColor;

    if(writing_on_board){
        const mess = currentPenType +
            "|" +
            currentZIndex +
            "|" +
            text_size +
            "|" +
            text_color +
            "|" +
            p_text.text +
            "|" +
            p_text.x +
            "|" +
            p_text.y;

        otherPeer.send(
            mess
        );

        history += mess + "\n";

        writing_on_board = false;
      }

    text_color = fontColor;

  });

//Whiteboard Initialization
const app = new PIXI.Application({
    antialias: true,
    background: "#ffffff",
    width: window.innerWidth * 0.4,
    height: window.innerHeight * 0.5,
});

/*
window.addEventListener("resize", () => {
    app.resize(window.width * 2, window.height * 2);
});*/

export const stage = new PIXI.Container();
stage.scale.set(1);

app.stage.addChild(stage);

const container = document.querySelector(".white-board");

container.appendChild(app.view);

// Get the canvas element
const canvas = app.view;

// Add a 'wheel' event listener to the canvas
canvas.addEventListener('wheel', onCanvasScroll);

const SCALE_CONST = 0.1;

var canvas_scale = 1.0;
var canvas_translation = {x: 0.0, y: 0.0};


function transformPoint(x,y){

    var newX = (x + canvas_translation.x) / canvas_scale;
    var newY = (y + canvas_translation.y) / canvas_scale;


    return {x: newX, y: newY};
}

const fileInput = document.getElementById('file-input');

var have_file = false;
var current_image;
var image_texture;

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    current_image = reader.result;
    console.log(current_image);
    /*image_texture = PIXI.Texture.from(reader.result);
    
    const sprite = new PIXI.Sprite(texture);
    stage.addChild(sprite);*/
    have_file = true;
  };
  reader.readAsDataURL(file);
});

// Define the 'onCanvasScroll' function
function onCanvasScroll(event) {
    // Get the scroll direction
    const delta = Math.sign(event.deltaY) * SCALE_CONST;

    // Do something with the scroll direction
    console.log(app.view.width);

    var middlePoint = transformPoint(app.view.width / 2, app.view.height / 2);
    console.log(stage.position);
    console.log(canvas_scale);

    const prev_scale = canvas_scale;

    stage.scale.set(stage.scale.x * (1 - delta));
    canvas_scale = stage.scale.x;

    const translation = {x: middlePoint.x * (canvas_scale - prev_scale), y: middlePoint.y * (canvas_scale - prev_scale)}

    canvas_translation = {x: canvas_translation.x + translation.x, y: canvas_translation.y + translation.y};
    stage.position.set(-canvas_translation.x, -canvas_translation.y);


    /*var newMiddlePoint = transformPoint(0,0);

    var temp_dist = {x: middlePoint.x - newMiddlePoint.x, y: middlePoint.y - newMiddlePoint.y};

    stage.position.set(stage.position.x + (temp_dist.x / canvas_scale), stage.position.y + (temp_dist.y / canvas_scale));

    canvas_translation = {x: canvas_translation.x + (temp_dist.x / canvas_scale), y: canvas_translation.y + (temp_dist.y / canvas_scale)};*/

}


/*const whiteboard = new PIXI.Graphics();
whiteboard.beginFill(0xffffff);
whiteboard.drawRect(0, 0, 800, 600);
whiteboard.endFill();
stage.addChild(whiteboard);*/

var sprite = new PIXI.Graphics();

let initPointer = null;

let isMouseButtonDown = false;

const putDistance = 1;
var curDistance = 1;

var mousePosRef;

/* End of whiteboard Initialization */


/// nexttt
let currentInteractiveTool = 0;

const changeInteractiveTool = (tool) => {
    
    const prevToolButtons = document.querySelector(`#tools-${currentInteractiveTool}`);
    prevToolButtons.classList.add('hidden');

    const currToolButtons = document.querySelector(`#tools-${tool}`);
    currToolButtons.classList.remove('hidden');

    const prevTools = document.querySelector(`#interactive-${currentInteractiveTool}`);
    prevTools.classList.add('hidden');

    const currTools = document.querySelector(`#interactive-${tool}`);
    currTools.classList.remove('hidden');
    
    currentInteractiveTool = tool;

    // Get the previously selected button and remove its selected status
    const prevButton = document.querySelector('.selected-interactive-button');
    prevButton.classList.remove('selected-interactive-button');

    // Get the currently selected button and add its selected status
    const currButton = document.querySelector(`#interactive-button-${tool}`);
    currButton.classList.add('selected-interactive-button');

    writing_on_board = false;

};

window.changeInteractiveTool = changeInteractiveTool;

// Whiteboard Part

var save_count = 0;

const saveWhiteboard = () => {

    const element = document.createElement('a');
  
    // Set the text content and file name
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(history));
    element.setAttribute('download', "save_" + save_count + ".wb");

    // Hide the anchor element
    element.style.display = 'none';
    
    // Append the anchor element to the document
    document.body.appendChild(element);
    
    // Programmatically click the anchor element
    element.click();
    
    // Remove the anchor element from the document
    document.body.removeChild(element);

    save_count++;
}

window.saveWhiteboard = saveWhiteboard;

export let currentZIndex = 0;
export function setCurrentZIndex(newValue) {
    currentZIndex = newValue;
}
let currentPenType = 0;

const changePenType = (type) => {
    
    const prevTools = document.querySelector(`#button-${currentPenType}-tools`);
    prevTools.classList.add('hidden');

    const currTools = document.querySelector(`#button-${type}-tools`);
    currTools.classList.remove('hidden');
    
    currentPenType = type;
    currentZIndex++;

    // Get the previously selected button and remove its selected status
    const prevButton = document.querySelector('.selected-button');
    prevButton.classList.remove('selected-button');

    // Get the currently selected button and add its selected status
    const currButton = document.querySelector(`#tool-button-${type}`);
    currButton.classList.add('selected-button');

    writing_on_board = false;

    console.log(currentPenType);
    console.log(currentZIndex);
};

window.changePenType = changePenType;

const getMousePos = (event) => {
    const pos = { x: 0, y: 0 };
    if (container) {
        // Get the position and size of the component on the page.
        const holderOffset = app.view.getBoundingClientRect();
        pos.x = event.pageX - holderOffset.x;
        pos.y = event.pageY - holderOffset.y;
    }
    return pos;
};

var currentPoints = [];
var currentSprites = [];
let pointCount = 0;
let curve;

export function setCanvasElements(newValue) {
    canvasElements = newValue;
}

const onMouseMove = (e) => {
    if (!isMouseButtonDown) {
        return;
    }

    // clearSpriteRef(annoRef)
    if (initPointer == null) return;

    const curMousePosRef = getMousePos(e);
    curDistance = Math.sqrt((curMousePosRef.x - mousePosRef.x) * (curMousePosRef.x - mousePosRef.x) + (curMousePosRef.y - mousePosRef.y) * (curMousePosRef.y - mousePosRef.y));

    /*if(last_mouse_button == 1){
        const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
        const angleDelta = curMousePosRef.x - initPointer.x;
        const rotationAngle = angleDelta * 0.01;

        //stage.pivot.set(canvasCenter.x, canvasCenter.y);
        stage.rotation += rotationAngle;

        initPointer = curMousePosRef;

        return;
    }*/

    if(last_mouse_button == 2){

        let translationOffset = { x: 0, y: 0 };
        translationOffset.x += curMousePosRef.x - initPointer.x;
        translationOffset.y += curMousePosRef.y - initPointer.y;

        

        stage.position.set(stage.position.x + translationOffset.x, stage.position.y + translationOffset.y);


        console.log(canvas_translation);
        canvas_translation.x = -stage.position.x;
        canvas_translation.y = -stage.position.y;

        initPointer = curMousePosRef;

        return;
    }


    /// Drawing
    

    while (putDistance <= curDistance) {
        sprite = new PIXI.Graphics();

        if (currentPenType === 0) {
            sprite.lineStyle(pen_size, pen_color, 1);
        } else if (currentPenType === 1) {
            sprite.lineStyle(eraser_size, 0xffffff, 1);
        }
        
        var temp_translated_pos = transformPoint(initPointer.x, initPointer.y);

        sprite.moveTo(temp_translated_pos.x, temp_translated_pos.y);
        sprite.zIndex = currentZIndex;

        //Translate Towards a point
        const translate_direction = {
            x: curMousePosRef.x - mousePosRef.x,
            y: curMousePosRef.y - mousePosRef.y,
        }

        const translate_length = Math.sqrt(translate_direction.x * translate_direction.x + translate_direction.y * translate_direction.y);

        const translate_unitDirection = {
            x: translate_direction.x / translate_length,
            y: translate_direction.y / translate_length,
          };

        const translate_displacement = {
            x: translate_unitDirection.x * putDistance,
            y: translate_unitDirection.y * putDistance,
          };

        mousePosRef = { x: mousePosRef.x + translate_displacement.x,
                        y: mousePosRef.y + translate_displacement.y,}

        //********************** */
        

        currentPoints.push(initPointer);
        pointCount += 1;

        //Change to look each time after a number of points are placed
        if(pointCount % CHECK_STEPS == 0){
            //map to bezier curve
            curve = findBestFitCurve(currentPoints);
            /*
            console.log("berr" + (curve[0].bErr + curve[1].bErr));
            console.log("merr" + (curve[0].mErr + curve[1].mErr));*/
            var curve_sprite = new PIXI.Graphics();
            if (currentPenType === 0) {
                curve_sprite.lineStyle(pen_size, pen_color, 1);
            } else if (currentPenType === 1) {
                curve_sprite.lineStyle(eraser_size, 0xffffff, 1);
            }
            //curve_sprite.lineStyle(4, 0x000000, 0.5);

            if(curve[0].bErr + curve[1].bErr > MAX_BERR || curve[0].mErr + curve[1].mErr > MAX_MERR){

                const control0 = transformPoint(currentPoints[0].x, currentPoints[0].y);
                const control1 = transformPoint(curve[0].b, curve[1].b);
                const control2 = transformPoint(curve[0].m, curve[1].m);
                const control3 = transformPoint(currentPoints[currentPoints.length - 1].x,  currentPoints[currentPoints.length - 1].y);


                curve_sprite.moveTo(control0.x, control0.y);
                curve_sprite.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, control3.x,  control3.y);

                stage.addChild(curve_sprite);
                //-------------------
                //Send curve info
                if (currentPenType === 0) {
                    const mess = currentPenType +
                        "|" +
                        currentZIndex +
                        "|" +
                        control0.x +
                        "|" +
                        control0.y +
                        "|" +
                        control1.x +
                        "|" +
                        control1.y +
                        "|" +
                        control2.x +
                        "|" +
                        control2.y +
                        "|" +
                        control3.x +
                        "|" +
                        control3.y +
                        "|" +
                        pen_size +
                        "|" +
                        pen_color;
                    otherPeer.send(
                        mess
                    );
                    history += mess + "\n";
                } else if (currentPenType === 1) {
                    const mess = currentPenType +
                        "|" +
                        currentZIndex +
                        "|" +
                        control0.x +
                        "|" +
                        control0.y +
                        "|" +
                        control1.x +
                        "|" +
                        control1.y +
                        "|" +
                        control2.x +
                        "|" +
                        control2.y +
                        "|" +
                        control3.x +
                        "|" +
                        control3.y +
                        "|" +
                        eraser_size;

                    otherPeer.send(
                        mess
                    );

                    history += mess + "\n";
                }
                
                //delete previous drawing
                currentSprites.forEach(element => {
                    stage.removeChild(element);
                });
    
                currentPoints = [initPointer];
                currentSprites = [];
                pointCount = 1;
            }
            
        }
        //*************************************** */

        initPointer = mousePosRef;

        var temp_mousePosRef = transformPoint(mousePosRef.x, mousePosRef.y);

        sprite.lineTo(temp_mousePosRef.x, temp_mousePosRef.y);

        stage.addChild(sprite);
        currentSprites.push(sprite);

        curDistance = Math.sqrt((curMousePosRef.x - mousePosRef.x) * (curMousePosRef.x - mousePosRef.x) + (curMousePosRef.y - mousePosRef.y) * (curMousePosRef.y - mousePosRef.y));
    }
    /// Drawing End
};

container.oncontextmenu = function(e) { e.preventDefault(); e.stopPropagation(); }



const onMouseDown = (e) => {
    mousePosRef = getMousePos(e);
    initPointer = mousePosRef;
    isMouseButtonDown = true;

    if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        last_mouse_button = 1;
        return;
    } 

    if (e.button === 2){
        console.log("2");
        last_mouse_button = 2;
        return;
    }


    last_mouse_button = 0;

    if(currentPenType != 2 && writing_on_board){
        writing_on_board = false;
        const mess = currentPenType +
            "|" +
            currentZIndex +
            "|" +
            text_size +
            "|" +
            text_color +
            "|" +
            p_text.text +
            "|" +
            p_text.x +
            "|" +
            p_text.y;
        otherPeer.send(
            mess
        );
        history += mess + "\n";
    }

    sprite = new PIXI.Graphics();
    if (currentPenType === 0) {
        sprite.lineStyle(parseInt(pen_size), parseInt(pen_color), 1);
    } else if (currentPenType === 1) {
        sprite.lineStyle(eraser_size, 0xffffff, 1);
    } else if (currentPenType === 2){ // Typing
        if(writing_on_board == true){
            const mess = currentPenType +
                "|" +
                currentZIndex +
                "|" +
                text_size +
                "|" +
                text_color +
                "|" +
                p_text.text +
                "|" +
                p_text.x +
                "|" +
                p_text.y;
            otherPeer.send(
                mess
            );
            history += mess + "\n";
        }
        console.log("Typing");
        const mouseX = e.clientX - app.renderer.view.offsetLeft;
        const mouseY = e.clientY - app.renderer.view.offsetTop;
        console.log(text_size + " " + text_size.type);
        textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: parseInt(text_size),
            fill: text_color,
        });
        p_text = new PIXI.Text("", textStyle);
        p_text.zIndex = currentZIndex;

        var space_pos = transformPoint(mouseX, mouseY);

        p_text.x = space_pos.x;
        p_text.y = space_pos.y;
        //text.moveTo(initPointer.x, initPointer.y);

        //p_text.moveTo(p_text.x + canvas_translation.x, p_text.y + canvas_translation.y);

        stage.addChild(p_text);
        writing_on_board = true;
    } else if(currentPenType === 3){
        if(have_file){

            have_file = false;

            image_texture = PIXI.Texture.from(current_image);
    
            const sprite = new PIXI.Sprite(image_texture);

            const relativePos = transformPoint(mousePosRef.x, mousePosRef.y);

            sprite.x = relativePos.x;
            sprite.y = relativePos.y;
            
            stage.addChild(sprite);


            const mess = currentPenType +
                "|" +
                currentZIndex +
                "|" + 
                current_image +
                "|" +
                relativePos.x +
                "|" +
                relativePos.y;

            otherPeer.send(
                mess
            );

            history += mess + "\n";


        }
    }
    //sprite.moveTo(initPointer.x, initPointer.y);
    //sprite.lineTo(mousePosRef.x, mousePosRef.y);

    //stage.addChild(sprite);

    

    //console.log(mousePosRef);
};


const onMouseUp = (e) => {
    isMouseButtonDown = false;

    if(pointCount > 0){
        //map to bezier curve
        curve = findBestFitCurve(currentPoints);
        /*
        console.log("berr" + (curve[0].bErr + curve[1].bErr));
        console.log("merr" + (curve[0].mErr + curve[1].mErr));*/
        var curve_sprite = new PIXI.Graphics();
        if (currentPenType === 0) {
            curve_sprite.lineStyle(pen_size, pen_color, 1);
        } else if (currentPenType === 1) {
            curve_sprite.lineStyle(eraser_size, 0xffffff, 1);
        }
        //curve_sprite.lineStyle(4, 0x000000, 0.5);

        const control0 = transformPoint(currentPoints[0].x, currentPoints[0].y);
        const control1 = transformPoint(curve[0].b, curve[1].b);
        const control2 = transformPoint(curve[0].m, curve[1].m);
        const control3 = transformPoint(currentPoints[currentPoints.length - 1].x,  currentPoints[currentPoints.length - 1].y);

        curve_sprite.moveTo(control0.x, control0.y);
        curve_sprite.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, control3.x,  control3.y);

        stage.addChild(curve_sprite);
        //-------------------
        //Send curve info
        if (currentPenType === 0) {
            const mess = currentPenType +
                "|" +
                currentZIndex +
                "|" +
                control0.x +
                "|" +
                control0.y +
                "|" +
                control1.x +
                "|" +
                control1.y +
                "|" +
                control2.x +
                "|" +
                control2.y +
                "|" +
                control3.x +
                "|" +
                control3.y +
                "|" +
                pen_size +
                "|" +
                pen_color;
            otherPeer.send(
                mess
            );
            history += mess + "\n";
        } else if (currentPenType === 1) {
            const mess = currentPenType +
                "|" +
                currentZIndex +
                "|" +
                control0.x +
                "|" +
                control0.y +
                "|" +
                control1.x +
                "|" +
                control1.y +
                "|" +
                control2.x +
                "|" +
                control2.y +
                "|" +
                control3.x +
                "|" +
                control3.y +
                "|" +
                eraser_size;

            otherPeer.send(
                mess
            );

            history += mess + "\n";
        }
        
        //delete previous drawing
        currentSprites.forEach(element => {
            stage.removeChild(element);
        });

        pointCount = 0;
        currentPoints = [];
        currentSprites = [];
    }
};
     
document.addEventListener("keydown", (event) => {
    if(writing_on_board){
        const alphanumericKey = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(event.key);
        console.log(event.key);
        if(event.key.localeCompare("Enter") === 0){
            //Send Text

            const mess = currentPenType +
                "|" +
                currentZIndex +
                "|" +
                text_size +
                "|" +
                text_color +
                "|" +
                p_text.text +
                "|" +
                p_text.x +
                "|" +
                p_text.y;
            otherPeer.send(
                mess
            );

            history += mess + "\n";

            writing_on_board = false;
        }
        else if(alphanumericKey && event.key.length === 1){
            p_text.text += event.key;
        }else if(event.key.localeCompare(" ") === 0){
            p_text.text += " ";
        }
    }
    
});


  function minimizeLoss(points){
    let P0 = points[0];
    let P3 = points[points.length - 1];
    let X = [];
    let Yx = [];
    let Yy = [];
    let delta = 1 / points.length;
    let t = delta;
    for (let i = 1; i < points.length - 1; i++){
        X.push(t/(1-t));
        Yx.push((points[i].x - (1-t) * (1-t) * (1-t) * P0.x - t * t * t * P3.x)/(3 * (1-t) * (1-t) * t));
        Yy.push((points[i].y - (1-t) * (1-t) * (1-t) * P0.y - t * t * t * P3.y)/(3 * (1-t) * (1-t) * t));
        t+=delta;
    }

    let Xlsq = {};
    let Ylsq = {};

    lsq(X,Yx, true, Xlsq);
    lsq(X, Yy, true, Ylsq);

    return [Xlsq, Ylsq];
  }

  function findBestFitCurve(points) {
    const result = minimizeLoss(points);
    return result;
}

  //End of Bezier Curve Functions

container.addEventListener("mousemove", onMouseMove, 0);

container.addEventListener("mousedown", onMouseDown, 0);

container.addEventListener("mouseup", onMouseUp, 0);


//PDF Share

/*IMPORTANT NOTES!!!!!!!!!!!!!!!!!!!
    Make pdfs fit to page
    Solve not rendering text problem
*/

document.getElementById('pdf-input').addEventListener('change', function() {
    var file = this.files[0];
    var fileReader = new FileReader();
    
    fileReader.onload = function() {
        //Send Other Peer
        console.log(this.result);

      var typedarray = new Uint8Array(this.result);
      otherPeer.send(
        "-1" +
        "|" +
        typedarray
    );
       

      pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
        var pages = Array.from(Array(pdf.numPages).keys());
        return Promise.all(pages.map(function(num) {
          return pdf.getPage(num + 1);
        }));
      }).then(function(pages) {
        
        var iframe = document.getElementById('pdf-iframe');
        canvasElements = pages.map(function(page) {
            var canvas = document.createElement('canvas');
            console.log(iframe);
            var scale = Math.min(iframe.clientWidth / page.getViewport({scale: 1}).width, iframe.clientHeight / page.getViewport({scale: 1}).height);
            var viewport = page.getViewport({scale: scale * 1.3});
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            page.render({canvasContext: canvas.getContext('2d'), viewport: viewport}).promise.then(function() {});
            return canvas;
        });
        
        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write("<html><body></body></html>");
        canvasElements.forEach(function(canvas) {
          doc.body.appendChild(canvas);
        });
        doc.close();
      });
    };
    
    fileReader.readAsArrayBuffer(file);
  });


/** IMPORTANT: This only takes screenshot of first page */
const shotImage = () => {
    // Get the iframe element
    const iframe = document.querySelector('#pdf-iframe');
    
    console.log(canvasElements);

    // Use html2canvas library to create a canvas element from the iframe
    html2canvas(canvasElements[0]).then(function(canvas) {
        // Create an image element from the canvas
        //const img = document.createElement('img');
        current_image = canvas.toDataURL();
        console.log(current_image);
        changePenType(3);
        have_file = true;
        changeInteractiveTool(0);
    });

    /*
    const pdf_iframe = document.getElementById('pdf-iframe');
    const pdfWindow = pdf_iframe.contentWindow;
    const pdf_iframeDocument = pdfWindow.document;
    const pdf_iframeBody = pdf_iframeDocument.body;
  
    const temp_canvas = document.createElement('canvas');
    temp_canvas.width = pdf_iframeBody.offsetWidth;
    temp_canvas.height = pdf_iframeBody.offsetHeight;
  
    const pdf_context = temp_canvas.getContext('2d');
  
    pdf_context.drawImage(pdf_iframeBody, 0, 0);

    const image = PIXI.Sprite.from(temp_canvas);

    stage.addChild(image);*/
}

document.shotImage = shotImage;