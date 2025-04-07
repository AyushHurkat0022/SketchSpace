import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { updateCanvas } from "../../utils/api";
import classes from "./index.module.css";

function Board({ canvasId, userEmail, initialElements = [], socket }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const {
    elements,
    toolActionType,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
  } = useContext(boardContext);
  const { toolboxState } = useContext(toolboxContext);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === "z") {
        undo();
      } else if (event.ctrlKey && event.key === "y") {
        redo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  // Save function
  const saveCanvas = async () => {
    try {
      await updateCanvas(canvasId, userEmail, elements);
      if (socket) { // Use socket prop instead of socketRef
        socket.emit('updateCanvas', {
          canvasId,
          canvasElements: elements
        });
      }
    } catch (error) {
      console.error("Failed to save canvas:", error);
    }
  };

  // Handle save after drawing ends
  const handleMouseUp = () => {
    boardMouseUpHandler();
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING || toolActionType === TOOL_ACTION_TYPES.ERASING) {
      saveCanvas();
    }
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.save();
  
    const roughCanvas = rough.canvas(canvas);
  
    console.group("Canvas Render - Elements");
    elements.forEach((element, index) => {
      console.groupCollapsed(`Element ${index} [${element.type}]`);
      console.log("Element details:", element);
  
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          console.log("Drawn using rough.js:", element.roughEle);
          break;
        case TOOL_ITEMS.BRUSH:
          context.fillStyle = element.stroke;
          context.fill(element.path);
          console.log("Drawn using brush path.");
          break;
        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          console.log("Text drawn:", element.text);
          break;
        default:
          console.warn("Unknown element type:", element.type);
      }
  
      console.groupEnd();
    });
    console.groupEnd();
  
    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);
  

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => {
        textarea.focus();
      }, 0);
    }
  }, [toolActionType]);

  const handleMouseMove = (event) => {
    boardMouseMoveHandler(event);
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1]?.size}px`,
            color: elements[elements.length - 1]?.stroke,
          }}
          onBlur={(event) => textAreaBlurHandler(event.target.value)}
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={(event) => boardMouseDownHandler(event, toolboxState)} // Use directly, no need for handleMouseDown
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <button
        onClick={saveCanvas}
        className={classes.saveButton}
      >
        Save
      </button>
    </>
  );
}

export default Board;