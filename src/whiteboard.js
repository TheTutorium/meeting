import { peer, conn } from './meeting.js';

//const fmin = require('./fmin');

//const LeastSquares = require("least-squares");

export var history = "";
export function setHistory(newValue) {
    history = newValue;
}

let hoverBorder = null;

export let interactibleObjects = [];

const selectCheck = { upperLeft: false, upperRight: false, lowerRight: false, lowerLeft: false, up: false, right: false, down: false, left: false, on: false };

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

let selectedObject = null;

export var canvasElements;

var textStyle = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: text_size,
    fill: text_color,
});

var p_text = new PIXI.Text("Hello, world!", textStyle);

function sendTextToConn() {
    interactibleObjects.push(p_text);
    console.log(p_text);

    if (cursor_added) {
        removeCursor();
    }

    const mess = "2" +
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
    conn.send(
        mess
    );
    history += mess + "\n";
}

var last_mouse_button = 0;

$('#tool-button-0').dropdown({
    on: 'nothing', // disable opening on hover and left click
    onChange: function(value, text, $selectedItem) {
      // changing the value of pen_size based on the selection
      if (value.charAt(0) != '0')
        pen_size = parseInt(value);
      else
        pen_color = parseInt(value);
    }
  });
$('#tool-button-0').on('contextmenu', function(event) {
    event.preventDefault(); // prevent the browser context menu from opening
    $(this).dropdown('toggle'); // open or close the dropdown
  });

$('#tool-button-1').dropdown({
    on: 'nothing', // disable opening on hover and left click
    onChange: function (value, text, $selectedItem) {
        // changing the value of pen_size based on the selection
        eraser_size = parseInt(value);
    }
});
$('#tool-button-1').on('contextmenu', function(event) {
    event.preventDefault(); // prevent the browser context menu from opening
    $(this).dropdown('toggle'); // open or close the dropdown
  });

$('#tool-button-2').dropdown({
    on: 'nothing', // disable opening on hover and left click
    onChange: function (value, text, $selectedItem) {
        // changing the value of pen_size based on the selection
        if (value.charAt(0) != '0') {
            if (writing_on_board) {
                sendTextToConn();
                writing_on_board = false;
                changeCursor('text-cursor');
            }

            text_size = parseInt(value);
        }
        else {
            if (writing_on_board) {
                sendTextToConn();
                changeCursor('text-cursor');
                writing_on_board = false;
            }

            text_color = parseInt(value);
        }
    }
});
$('#tool-button-2').on('contextmenu', function(event) {
    event.preventDefault(); // prevent the browser context menu from opening
    $(this).dropdown('toggle'); // open or close the dropdown
  });

$('#screen-options-button').dropdown({
    onChange: function (value, text, $selectedItem) {
        // changing the value of pen_size based on the selection

    }
});

// get references to the pen-size input and the "Sample Text" element
const textSizeInput = document.getElementById("text-size");
const sampleTextPointer = document.getElementById("sample-text");
const textColorSelect = document.getElementById("text-color");

// add an event listener to the pen-size input


//Whiteboard Initialization
const app = new PIXI.Application({
    antialias: true,
    background: "#ffffff",
    width: window.innerWidth * 0.5,
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
var canvas_translation = { x: 0.0, y: 0.0 };


function transformPoint(x, y) {

    var newX = (x + canvas_translation.x) / canvas_scale;
    var newY = (y + canvas_translation.y) / canvas_scale;


    return { x: newX, y: newY };
}

function reverseTransformPoint(x, y) {
    var newX = x * canvas_scale - canvas_translation.x;
    var newY = y * canvas_scale - canvas_translation.y;

    return { x: newX, y: newY };
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
        changeCursor("image-add-cursor");
    };
    reader.readAsDataURL(file);
});

// Define the 'onCanvasScroll' function
function onCanvasScroll(event) {
    // Get the scroll direction
    const delta = Math.sign(event.deltaY) * SCALE_CONST;

    // Do something with the scroll direction
    //console.log(app.view.width);

    var middlePoint = transformPoint(app.view.width / 2, app.view.height / 2);
    //console.log(stage.position);
    //console.log(canvas_scale);

    const prev_scale = canvas_scale;

    stage.scale.set(stage.scale.x * (1 - delta));
    canvas_scale = stage.scale.x;

    const translation = { x: middlePoint.x * (canvas_scale - prev_scale), y: middlePoint.y * (canvas_scale - prev_scale) }

    canvas_translation = { x: canvas_translation.x + translation.x, y: canvas_translation.y + translation.y };
    stage.position.set(-canvas_translation.x, -canvas_translation.y);


}

var sprite = new PIXI.Graphics();

let initPointer = null;

let isMouseButtonDown = false;

const putDistance = 1;
var curDistance = 1;

var mousePosRef;

/* End of whiteboard Initialization */


/// nexttt
let currentInteractiveTool = 0;

export const changeInteractiveTool = (tool) => {

    console.log(tool + " prev " + currentInteractiveTool);

    const prevTools = document.querySelector(`#interactive-${currentInteractiveTool}`);
    prevTools.classList.add('hidden');

    const currTools = document.querySelector(`#interactive-${tool}`);
    currTools.classList.remove('hidden');

    currentInteractiveTool = tool;


    if (writing_on_board) {
        sendTextToConn();
        changeCursor('text-cursor');
    }

    writing_on_board = false;

};

const penButton = document.getElementById('tool-button-0');
const eraserButton = document.getElementById('tool-button-1');
const textButton = document.getElementById('tool-button-2');
const uploadImgButton = document.getElementById('tool-button-3');
const selectButton = document.getElementById('tool-button-4');
const resetButton = document.getElementById('reset-button');
const downloadButton = document.getElementById('save-button');
const leftButton = document.getElementById('prev_page');
const pageField = document.getElementById('page_input');
const rightButton = document.getElementById('next_page');
const uploadPdfButton = document.getElementById('upload-pdf');
const edditButton = document.getElementById('pdf-tool-button-0');

const remoteVideoContainer = document.getElementById('video-container1');
const localVideoContainer = document.getElementById('video-container12');
const remoteVideo = document.getElementById('remote-video');
const localVideo = document.getElementById('local-video');

function removeSelect() {
    penButton.classList.remove('selected-button');
    eraserButton.classList.remove('selected-button');
    textButton.classList.remove('selected-button');
    selectButton.classList.remove('selected-button');
    uploadImgButton.classList.remove('selected-button');
}

export const chatView = () => {

    if(currentInteractiveTool == -1){
        return;
    }

    conn.send("-4|-1");
    currentInteractiveTool = -1;

    console.log("in two video");
};

const whiteboardClicked = () => {
    if(currentInteractiveTool == 0){
        return;
    }
        
    conn.send("-4|0");

    changeInteractiveTool(0);
    
    penButton.classList.remove('hidden');
    eraserButton.classList.remove('hidden');
    textButton.classList.remove('hidden');
    selectButton.classList.remove('hidden');
    uploadImgButton.classList.remove('hidden');
    resetButton.classList.remove('hidden');
    downloadButton.classList.remove('hidden');

    leftButton.classList.add('hidden');
    pageField.classList.add('hidden');
    rightButton.classList.add('hidden');
    uploadPdfButton.classList.add('hidden');
    edditButton.classList.add('hidden');
};
const pdfviewClicked = () => {
    if(currentInteractiveTool == 1){
        return;
    }

    conn.send("-4|1");

    changeInteractiveTool(1);

    penButton.classList.add('hidden');
    eraserButton.classList.add('hidden');
    textButton.classList.add('hidden');
    uploadImgButton.classList.add('hidden');
    selectButton.classList.add('hidden');
    resetButton.classList.add('hidden');
    downloadButton.classList.add('hidden');

    leftButton.classList.remove('hidden');
    pageField.classList.remove('hidden');
    rightButton.classList.remove('hidden');
    uploadPdfButton.classList.remove('hidden');
    edditButton.classList.remove('hidden');
};
export const screenShareClicked = () => {
    if(currentInteractiveTool == 2){
        return;
    }

    conn.send("-4|2");
    currentInteractiveTool = 2;

    console.log("in screen share");
};


window.changeInteractiveTool = changeInteractiveTool;
window.whiteboardClicked = whiteboardClicked;
window.pdfviewClicked = pdfviewClicked;


// Whiteboard Part

var save_count = 0;

const saveWhiteboard = () => {
    removeSelect();
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

function changeCursor(newCursor){
    canvas.classList.remove(past_cursor);
    canvas.classList.add(newCursor);
    past_cursor = newCursor;
}

const changePenType = (type) => {
    if(currentPenType != type){
        switch(type){
            case 0:
                removeSelect();
                penButton.classList.add('selected-button');
                changeCursor("pen-cursor");
                break;
            case 1:
                removeSelect();
                eraserButton.classList.add('selected-button');
                changeCursor("eraser-cursor");
                break;
            case 2:
                removeSelect();
                textButton.classList.add('selected-button');
                changeCursor("text-cursor");
                break;
            case 3:
                removeSelect();
                uploadImgButton.classList.add('selected-button');
                changeCursor("image-cursor");
                break;
            case 4:
                removeSelect();
                selectButton.classList.add('selected-button');
                changeCursor("pointer-cursor");
                break;
            default:
                break;
        }
    }

    currentPenType = type;
    currentZIndex++;



    if (writing_on_board) {
        sendTextToConn();
    }

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

const HOVER_RANGE = 3;

function checkCorner(mousePos, corner) {
    const t_corner = reverseTransformPoint(corner.x, corner.y);
    if (Math.abs(mousePos.x - t_corner.x) <= HOVER_RANGE && Math.abs(mousePos.y - t_corner.y) <= HOVER_RANGE) {
        return true;
    }
    return false;
}

function isBetween(number, bound1, bound2) {
    var lowerBound = Math.min(bound1, bound2);
    var upperBound = Math.max(bound1, bound2);
    return number > lowerBound && number < upperBound;
}

function checkEdge(mousePos, corner1, corner2) {
    const t_corner1 = reverseTransformPoint(corner1.x, corner1.y);
    const t_corner2 = reverseTransformPoint(corner2.x, corner2.y);
    if (t_corner1.x == t_corner2.x) {
        if (Math.abs(t_corner1.x - mousePos.x) <= HOVER_RANGE) {
            return isBetween(mousePos.y, t_corner1.y, t_corner2.y);
        } else {
            return false;
        }
    } else if (t_corner1.y == t_corner2.y) {
        if (Math.abs(t_corner1.y - mousePos.y) <= HOVER_RANGE) {
            return isBetween(mousePos.x, t_corner1.x, t_corner2.x);
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function transformSprite(curMousePosRef) {
    console.log(selectedObject);
    console.log(hoverBorder);
    let t_mousePos = transformPoint(curMousePosRef.x, curMousePosRef.y);
    let t_initPos = transformPoint(hover_init_pointer.x, hover_init_pointer.y);
    switch (current_hover) {
        case 0:
            if (selectedObject.width + t_initPos.x - t_mousePos.x > 0) {
                selectedObject.position.x = t_mousePos.x;
                selectedObject.width += t_initPos.x - t_mousePos.x;
                hoverBorder.position.x = selectedObject.position.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            if (selectedObject.height + t_initPos.y - t_mousePos.y > 0) {
                selectedObject.position.y = t_mousePos.y;
                selectedObject.height += t_initPos.y - t_mousePos.y;
                hoverBorder.position.y = selectedObject.position.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 1:
            if (t_initPos.x - t_mousePos.x < selectedObject.width) {
                selectedObject.width -= t_initPos.x - t_mousePos.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            if (selectedObject.height + t_initPos.y - t_mousePos.y > 0) {
                selectedObject.position.y = t_mousePos.y;
                selectedObject.height += t_initPos.y - t_mousePos.y;
                hoverBorder.position.y = selectedObject.position.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 2:
            if (t_initPos.x - t_mousePos.x < selectedObject.width) {
                selectedObject.width -= t_initPos.x - t_mousePos.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            if (t_initPos.y - t_mousePos.y < selectedObject.height) {
                selectedObject.height -= t_initPos.y - t_mousePos.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 3:
            if (selectedObject.width + t_initPos.x - t_mousePos.x > 0) {
                selectedObject.position.x = t_mousePos.x;
                selectedObject.width += t_initPos.x - t_mousePos.x;
                hoverBorder.position.x = selectedObject.position.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            if (t_initPos.y - t_mousePos.y < selectedObject.height) {
                selectedObject.height -= t_initPos.y - t_mousePos.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 4:
            if (selectedObject.height + t_initPos.y - t_mousePos.y > 0) {
                selectedObject.position.y = t_mousePos.y;
                selectedObject.height += t_initPos.y - t_mousePos.y;
                hoverBorder.position.y = selectedObject.position.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 5:
            if (t_initPos.x - t_mousePos.x < selectedObject.width) {
                selectedObject.width -= t_initPos.x - t_mousePos.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            break;
        case 6:
            if (t_initPos.y - t_mousePos.y < selectedObject.height) {
                selectedObject.height -= t_initPos.y - t_mousePos.y;
                hoverBorder.height = selectedObject.height;
                hover_init_pointer.y = curMousePosRef.y;
            }
            break;
        case 7:
            if (selectedObject.width + t_initPos.x - t_mousePos.x > 0) {
                selectedObject.position.x = t_mousePos.x;
                selectedObject.width += t_initPos.x - t_mousePos.x;
                hoverBorder.position.x = selectedObject.position.x;
                hoverBorder.width = selectedObject.width;
                hover_init_pointer.x = curMousePosRef.x;
            }
            break;
        case 8:
            selectedObject.position.x += t_mousePos.x - t_initPos.x;
            selectedObject.position.y += t_mousePos.y - t_initPos.y;
            hoverBorder.position.x = selectedObject.position.x;
            hoverBorder.position.y = selectedObject.position.y;
            hover_init_pointer = curMousePosRef;
            break;
        default:
    }
}



const onMouseMove = (e) => {
    const curMousePosRef = getMousePos(e);

    if (currentPenType == 4 && selectedObject && last_mouse_button == 0) {
        if (isMouseButtonDown) {
            transformSprite(curMousePosRef);
        } else {
            let temp_mouse = transformPoint(curMousePosRef.x, curMousePosRef.y);
            let temp_corners = [{ x: selectedObject.position.x, y: selectedObject.position.y }, { x: selectedObject.position.x + selectedObject.width, y: selectedObject.position.y }, { x: selectedObject.position.x + selectedObject.width, y: selectedObject.position.y + selectedObject.height }, { x: selectedObject.position.x, y: selectedObject.position.y + selectedObject.height }]
            selectCheck.upperLeft = checkCorner(curMousePosRef, temp_corners[0]);
            selectCheck.upperRight = checkCorner(curMousePosRef, temp_corners[1]);
            selectCheck.lowerRight = checkCorner(curMousePosRef, temp_corners[2]);
            selectCheck.lowerLeft = checkCorner(curMousePosRef, temp_corners[3]);
            selectCheck.up = checkEdge(curMousePosRef, temp_corners[0], temp_corners[1]);
            selectCheck.right = checkEdge(curMousePosRef, temp_corners[1], temp_corners[2]);
            selectCheck.down = checkEdge(curMousePosRef, temp_corners[2], temp_corners[3]);
            selectCheck.left = checkEdge(curMousePosRef, temp_corners[3], temp_corners[0]);
            selectCheck.on = SelectCheck(temp_mouse.x, temp_mouse.y, temp_corners[0].x, temp_corners[0].y, temp_corners[2].x, temp_corners[2].y);

        }

        if(selectCheck.upperLeft){
            changeCursor("ul-dr-resize-cursor");
        }else if(selectCheck.upperRight){
            changeCursor("ur-dl-resize-cursor");
        }else if(selectCheck.lowerRight){
            changeCursor("ul-dr-resize-cursor");
        }else if(selectCheck.lowerLeft){
            changeCursor("ur-dl-resize-cursor");
        }else if(selectCheck.up){
            changeCursor("ud-resize-cursor");
        }else if(selectCheck.right){
            changeCursor("lr-resize-cursor");
        }else if(selectCheck.down){
            changeCursor("ud-resize-cursor");
        }else if(selectCheck.left){
            changeCursor("lr-resize-cursor");
        }else if(selectCheck.on){
            changeCursor("move-cursor");
        }else{
            changeCursor("pointer-cursor");
        }

        initPointer = curMousePosRef;

        return;
    }

    if (!isMouseButtonDown) {
        return;
    }

    // clearSpriteRef(annoRef)
    if (initPointer == null) return;


    curDistance = Math.sqrt((curMousePosRef.x - mousePosRef.x) * (curMousePosRef.x - mousePosRef.x) + (curMousePosRef.y - mousePosRef.y) * (curMousePosRef.y - mousePosRef.y));

    if (last_mouse_button == 2) {

        let translationOffset = { x: 0, y: 0 };
        translationOffset.x += curMousePosRef.x - initPointer.x;
        translationOffset.y += curMousePosRef.y - initPointer.y;



        stage.position.set(stage.position.x + translationOffset.x, stage.position.y + translationOffset.y);


        //console.log(canvas_translation);
        canvas_translation.x = -stage.position.x;
        canvas_translation.y = -stage.position.y;

        initPointer = curMousePosRef;

        return;
    }

    if (currentPenType == 4) {

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

        mousePosRef = {
            x: mousePosRef.x + translate_displacement.x,
            y: mousePosRef.y + translate_displacement.y,
        }

        //********************** */


        currentPoints.push(initPointer);
        pointCount += 1;

        //Change to look each time after a number of points are placed
        if (pointCount % CHECK_STEPS == 0) {
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

            if (curve[0].bErr + curve[1].bErr > MAX_BERR || curve[0].mErr + curve[1].mErr > MAX_MERR) {

                const control0 = transformPoint(currentPoints[0].x, currentPoints[0].y);
                const control1 = transformPoint(curve[0].b, curve[1].b);
                const control2 = transformPoint(curve[0].m, curve[1].m);
                const control3 = transformPoint(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);


                curve_sprite.moveTo(control0.x, control0.y);
                curve_sprite.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, control3.x, control3.y);

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
                    conn.send(
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

                    conn.send(
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

container.oncontextmenu = function (e) { e.preventDefault(); e.stopPropagation(); }

let current_selected_object_index = 0;
let beforeGrab;

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

    if (e.button === 2) {
        console.log("2");
        last_mouse_button = 2;
        beforeGrab = past_cursor;
        changeCursor("grab-cursor");
        return;
    }


    last_mouse_button = 0;

    //console.log(currentPenType + " " + writing_on_board);
    if (currentPenType != 2 && writing_on_board) {
        writing_on_board = false;
        sendTextToConn();
    }

    sprite = new PIXI.Graphics();
    if (currentPenType === 0) {
        sprite.lineStyle(parseInt(pen_size), parseInt(pen_color), 1);
    } else if (currentPenType === 1) {
        sprite.lineStyle(eraser_size, 0xffffff, 1);
    } else if (currentPenType === 2) { // Typing
        if (writing_on_board == true) {
            sendTextToConn();
        }
        changeCursor("typing-cursor");

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
    } else if (currentPenType === 3) {
        if (have_file) {

            have_file = false;
            changeCursor("image-cursor");

            image_texture = PIXI.Texture.from(current_image);

            const sprite = new PIXI.Sprite(image_texture);

            interactibleObjects.push(sprite);
            console.log(interactibleObjects);

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

            conn.send(
                mess
            );

            history += mess + "\n";


        }
    } else if (currentPenType == 4) { //Select Tool
        if (hoverSelectedObject()) {
            hover_init_pointer = mousePosRef;
            //console.log(current_hover);
            return;
        }
        console.log("hiiii");

        hover_init_pointer = mousePosRef;

        let space_map = transformPoint(mousePosRef.x, mousePosRef.y);
        stage.removeChild(hoverBorder);
        hoverBorder = null;
        selectedObject = null;
        current_selected_object_index = -1;

        for (let i = interactibleObjects.length - 1; i >= 0; i--) {
            if (SelectCheck(space_map.x, space_map.y, interactibleObjects[i].position.x, interactibleObjects[i].position.y, interactibleObjects[i].position.x + interactibleObjects[i].width, interactibleObjects[i].position.y + interactibleObjects[i].height)) {
                selectedObject = interactibleObjects[i];
                current_selected_object_index = i;
                i = -1;
            }
        }

        if (selectedObject) {
            console.log("returned");

            // Create a Graphics object
            hoverBorder = new PIXI.Graphics();

            // Set the line style and fill color for the rectangle
            hoverBorder.lineStyle(1, 0x0000FF); // Set line style with a thickness of 2 and color black
            //graphics.beginFill(0x000000); // Set fill color to red

            // Draw the rectangle
            hoverBorder.drawRect(0, 0, selectedObject.width, selectedObject.height); // Draw a rectangle at (50, 50) with width 200 and height 100
            hoverBorder.position.x = selectedObject.position.x;
            hoverBorder.position.y = selectedObject.position.y;

            // End the fill and line styles
            //graphics.endFill();

            // Add the graphics object to the stage
            stage.addChild(hoverBorder);
            //selectedObject.tint = 0xff0000;
        }

    }
    //sprite.moveTo(initPointer.x, initPointer.y);
    //sprite.lineTo(mousePosRef.x, mousePosRef.y);

    //stage.addChild(sprite);



    //console.log(mousePosRef);
};

let hover_init_pointer = null;

let current_hover = -1;

function hoverSelectedObject() {
    //console.log(selectCheck);
    if (selectCheck.upperLeft) {
        current_hover = 0;
        return true;
    } else if (selectCheck.upperRight) {
        current_hover = 1;
        return true;
    } else if (selectCheck.lowerRight) {
        current_hover = 2;
        return true;
    } else if (selectCheck.lowerLeft) {
        current_hover = 3;
        return true;
    } else if (selectCheck.up) {
        current_hover = 4;
        return true;
    } else if (selectCheck.right) {
        current_hover = 5;
        return true;
    } else if (selectCheck.down) {
        current_hover = 6;
        return true;
    } else if (selectCheck.left) {
        current_hover = 7;
        return true;
    } else if (selectCheck.on) {
        current_hover = 8;
        return true;
    }

    current_hover = -1;
    return false;
}


const onMouseUp = (e) => {
    isMouseButtonDown = false;

    if(last_mouse_button == 2){
        changeCursor(beforeGrab);
    }

    if (currentPenType == 4 && current_hover >= 0) {
        const mess = currentPenType +
            "|" +
            current_selected_object_index + // Object Number
            "|" +
            selectedObject.position.x + // x
            "|" +
            selectedObject.position.y + // y
            "|" +
            selectedObject.width + // width
            "|" +
            selectedObject.height;// height
        conn.send(
            mess
        );
        history += mess + "\n";
    }

    if (pointCount > 0) {
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
        const control3 = transformPoint(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);

        curve_sprite.moveTo(control0.x, control0.y);
        curve_sprite.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, control3.x, control3.y);

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
            conn.send(
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

            conn.send(
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
    if (writing_on_board) {
        const alphanumericKey = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(event.key);
        //console.log(event.key);
        if (event.key.localeCompare("Enter") === 0) {
            //Send Text
            sendTextToConn();
            changeCursor('text-cursor');


            writing_on_board = false;
        }
        else if (alphanumericKey && event.key.length === 1) {
            if (cursor_added) {
                removeCursor();
            }
            p_text.text += event.key;
        } else if (event.key.localeCompare(" ") === 0) {
            if (cursor_added) {
                removeCursor();
            }
            p_text.text += " ";
        }
    }

});


function minimizeLoss(points) {
    let P0 = points[0];
    let P3 = points[points.length - 1];
    let X = [];
    let Yx = [];
    let Yy = [];
    let delta = 1 / points.length;
    let t = delta;
    for (let i = 1; i < points.length - 1; i++) {
        X.push(t / (1 - t));
        Yx.push((points[i].x - (1 - t) * (1 - t) * (1 - t) * P0.x - t * t * t * P3.x) / (3 * (1 - t) * (1 - t) * t));
        Yy.push((points[i].y - (1 - t) * (1 - t) * (1 - t) * P0.y - t * t * t * P3.y) / (3 * (1 - t) * (1 - t) * t));
        t += delta;
    }

    let Xlsq = {};
    let Ylsq = {};

    lsq(X, Yx, true, Xlsq);
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


//Mouse Cursor Change

let past_cursor = "default-cursor";

canvas.classList.remove(past_cursor);
canvas.classList.add('pen-cursor');


//PDF Share

/*IMPORTANT NOTES!!!!!!!!!!!!!!!!!!!
    Make pdfs fit to page
*/

let pdf; // to store pdf data 
let pdf_canvas; // to render pdf
let isPageRendering; // to check if the pdf is currently rendering
let pageRenderingQueue = null; // to store next page number to render
let canvasContext; // context of canvas
let totalPages; // total  pages of pdf
let currentPageNum = 1;




export function receivePdf(decodedMess) {
    isPageRendering = false;
    pageRenderingQueue = null;
    pdf_canvas = document.getElementById('pdf_canvas');
    canvasContext = pdf_canvas.getContext('2d');

    initEvents(); //Add events
    initPDFRendererReceive(decodedMess);
}

document.getElementById('pdf-input').addEventListener('change', function (event) {

    isPageRendering = false;
    pageRenderingQueue = null;
    pdf_canvas = document.getElementById('pdf_canvas');
    canvasContext = pdf_canvas.getContext('2d');

    initEvents(); //Add events
    initPDFRenderer(event); // render first page

});

function initPDFRendererReceive(decodedMess) {

    let temp_pdf = decodedMess;

    const arr = temp_pdf.split(",").map(Number);
    const fileArrayBuffer = new Uint8Array(arr);


    //console.log(fileArrayBuffer);

    pdfjsLib.getDocument(fileArrayBuffer)
        .promise
        .then( pdfData => {
                totalPages = pdfData.numPages; // total number of pages 
                // assigning read pdfContent to global variable
                pdf = pdfData;
                console.log(pdfData);
                renderPage(currentPageNum);
        });




}

function initPDFRenderer(event) {

    const file = event.target.files[0];

    console.log(file);

    // Create a new FileReader instance
    const reader = new FileReader();

    reader.onload = function () {
        const fileArrayBuffer = reader.result;

        var typedarray = new Uint8Array(reader.result);

        conn.send(
            "-1" +
            "|" +
            typedarray);

        //console.log(fileArrayBuffer);

        pdfjsLib.getDocument(fileArrayBuffer)
            .promise
            .then( pdfData => {
                    totalPages = pdfData.numPages; // total number of pages 
                    // assigning read pdfContent to global variable
                    pdf = pdfData;
                    console.log(pdfData);
                    renderPage(currentPageNum);
            });

    };

    reader.readAsArrayBuffer(file);


}

function initEvents() {
    let prevPageBtn = document.getElementById('prev_page');
    let nextPageBtn = document.getElementById('next_page');
    let goToPage = document.getElementById('page_input_text');
    prevPageBtn.addEventListener('click', renderPreviousPage);
    nextPageBtn.addEventListener('click',renderNextPage);
    goToPage.addEventListener('change', goToPageNum);
}

function renderPage(pageNumToRender = 1) {
    isPageRendering = true; 
    document.getElementById('page_input_text').placeholder  = pageNumToRender + "/" + totalPages;
    // use getPage method

    pdf
        .getPage(pageNumToRender)
        .then(page => {
            const viewport = page.getViewport({ scale: 1 });
            pdf_canvas.height = viewport.height;
            pdf_canvas.width = viewport.width;
            let renderCtx = { canvasContext, viewport };

            page
                .render(renderCtx)
                .promise
                .then(() => {
                    isPageRendering = false;
                    // this is to check if there is next page to be rendered in the queue
                    if (pageRenderingQueue !== null) {
                        renderPage(pageRenderingQueue);
                        pageRenderingQueue = null;
                    }
                });
        });
}

function renderPageQueue(pageNum) {
    if (pageRenderingQueue != null) {
        pageRenderingQueue = pageNum;
    } else {
        renderPage(pageNum);
    }
}

function renderNextPage(ev) {

    if (currentPageNum >= totalPages) {
        alert("This is the last page");
        return;
    }
    currentPageNum++;

    //Send Page info
    const mess = "-2" +
        "|" +
        currentPageNum;
    conn.send(
        mess
    );

    renderPageQueue(currentPageNum);
}
function renderPreviousPage(ev) {
    if (currentPageNum <= 1) {
        alert("This is the first page");
        return;
    }
    currentPageNum--;

    //Send Page info
    const mess = "-2" +
        "|" +
        currentPageNum;
    conn.send(
        mess
    );

    renderPageQueue(currentPageNum);
}

function goToPageNum(ev) {
    let numberInput = document.getElementById('page_input_text');
    let pageNumber = parseInt(numberInput.value);

    //Send Page info
    const mess = "-2" +
        "|" +
        pageNumber;
    conn.send(
        mess
    );

    goToPageHelper(pageNumber);
}

export function goToPageHelper(pageNumber){
    let numberInput = document.getElementById('page_input_text');
    if(pageNumber) {
        if(pageNumber <= totalPages && pageNumber >= 1){
            currentPageNum = pageNumber;
            numberInput.value = "";
            renderPageQueue(pageNumber);
            return;
        }
    }
    alert("Enter a valide page numer");
}


const shotImage = () => {
    // Get the iframe element
    current_image = pdf_canvas.toDataURL();
    console.log(current_image);
    changePenType(3);
    have_file = true;
    changeCursor("image-add-cursor");
    whiteboardClicked();

}

document.shotImage = shotImage;

//Reset Whiteboard
const resetWhiteboard = () => {
    removeSelect();
    stage.removeChildren();
    const mess = "-3" +
        "|" +
        "0";
    conn.send(mess);
}

document.resetWhiteboard = resetWhiteboard;

//Select Check
function SelectCheck(mouseX, mouseY, leftUpX, leftUpY, rightDownX, rightDownY) {
    //console.log(mouseX + " " + mouseY+ " " + leftUpX+ " " + leftUpY+ " " + rightDownX+ " " + rightDownY)

    if (mouseX <= rightDownX && mouseX >= leftUpX && mouseY >= leftUpY && mouseY <= rightDownY) {
        return true;
    }
    return false;
}

let cursor_added = false;

// Add '|' character at the end of text
function addCursor() {
    cursor_added = true;
    p_text.text += "|";
}

// Remove '|' character from text
function removeCursor() {
    cursor_added = false;
    p_text.text = p_text.text.slice(0, -1);
}

let curTime = 0;
const CURSOR_TICK_TIME = 250;


// Use PIXI's ticker to update the text every frame
app.ticker.add(() => {
    curTime += PIXI.Ticker.shared.elapsedMS;
    if (curTime < CURSOR_TICK_TIME) {
        return;
    }
    curTime -= CURSOR_TICK_TIME;

    if (writing_on_board || cursor_added) {
        if (!cursor_added) {

            // Add '|' character
            addCursor();

        }
        else {

            // Add '|' character
            removeCursor();

        }
    }
});

// whiteboard related data handling
export function handleWhiteboardData(data) {

    let splittedMessage = data.split("|");

    let tempPenType = parseInt(splittedMessage[0]);
    setCurrentZIndex(parseInt(splittedMessage[1]));

    if (tempPenType >= 0) {

        setHistory(history + data + "\n");
    }

    if (tempPenType == 0) { // Pen
        let initX = parseFloat(splittedMessage[2]);
        let initY = parseFloat(splittedMessage[3]);
        let control1x = parseFloat(splittedMessage[4]);
        let control1y = parseFloat(splittedMessage[5]);
        let control2x = parseFloat(splittedMessage[6]);
        let control2y = parseFloat(splittedMessage[7]);
        let finalX = parseFloat(splittedMessage[8]);
        let finalY = parseFloat(splittedMessage[9]);
        let tempPenSize = parseInt(splittedMessage[10]);
        let tempPenColor = parseInt(splittedMessage[11]);

        let tempSprite = new PIXI.Graphics();

        tempSprite.lineStyle(tempPenSize, tempPenColor, 1);

        tempSprite.zIndex = currentZIndex;
        tempSprite.moveTo(initX, initY);
        tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);

        stage.addChild(tempSprite);
    } else if (tempPenType == 1) { // Eraser
        let initX = parseFloat(splittedMessage[2]);
        let initY = parseFloat(splittedMessage[3]);
        let control1x = parseFloat(splittedMessage[4]);
        let control1y = parseFloat(splittedMessage[5]);
        let control2x = parseFloat(splittedMessage[6]);
        let control2y = parseFloat(splittedMessage[7]);
        let finalX = parseFloat(splittedMessage[8]);
        let finalY = parseFloat(splittedMessage[9]);
        let tempEraserSize = parseInt(splittedMessage[10]);

        let tempSprite = new PIXI.Graphics();

        tempSprite.lineStyle(tempEraserSize, 0xffffff, 1);

        tempSprite.zIndex = currentZIndex;
        tempSprite.moveTo(initX, initY);
        tempSprite.bezierCurveTo(control1x, control1y, control2x, control2y, finalX, finalY);

        stage.addChild(tempSprite);
    } else if (tempPenType == 2) { // Typing
        let tempTextSize = parseInt(splittedMessage[2]);
        let tempTextColor = parseInt(splittedMessage[3]);
        let tempText = splittedMessage[4];
        let tempX = parseFloat(splittedMessage[5]);
        let tempY = parseFloat(splittedMessage[6]);

        let tempStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: tempTextSize,
            fill: tempTextColor,
        });

        let tempPText = new PIXI.Text(tempText, tempStyle);
        tempPText.zIndex = currentZIndex;
        tempPText.x = tempX;
        tempPText.y = tempY;

        interactibleObjects.push(tempPText);
        stage.addChild(tempPText);
    } else if (tempPenType == 3) {
        let temp_image = splittedMessage[2];
        let tempX = parseFloat(splittedMessage[3]);
        let tempY = parseFloat(splittedMessage[4]);

        const image_texture = PIXI.Texture.from(temp_image);
        const sprite = new PIXI.Sprite(image_texture);

        sprite.x = tempX;
        sprite.y = tempY;

        interactibleObjects.push(sprite);
        stage.addChild(sprite);
    } else if (tempPenType == 4) {
        let temp_obj_index = parseInt(splittedMessage[1]);
        let tempX = parseFloat(splittedMessage[2]);
        let tempY = parseFloat(splittedMessage[3]);
        let tempWidth = parseFloat(splittedMessage[4]);
        let tempHeight = parseFloat(splittedMessage[5]);

        interactibleObjects[temp_obj_index].position.x = tempX;
        interactibleObjects[temp_obj_index].position.y = tempY;
        interactibleObjects[temp_obj_index].width = tempWidth;
        interactibleObjects[temp_obj_index].height = tempHeight;

    } else if (tempPenType == -1) {
        pdfviewClicked();

        receivePdf(splittedMessage[1]);

    } else if (tempPenType == -2) {
        //While not looking pdf rendering does not work correctly
        goToPageHelper(parseInt(splittedMessage[1]));
    } else if (tempPenType == -3) {
        stage.removeChildren();
    } else if(tempPenType == -4){
        const curInteractiveTool = parseInt(splittedMessage[1]);
        switch(curInteractiveTool){
            case -1:
                chatView();
                break;
            case 0:
                whiteboardClicked();
                break;
            case 1:
                pdfviewClicked();
                break;
            case 2:
                screenShareClicked();
                break;
            default:
                break;
        }
    }

}