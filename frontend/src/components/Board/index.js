import { useContext, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { updateCanvas } from "../../utils/api";
import classes from "./index.module.css";
import cx from "classnames";

function Board({ canvasId, userEmail, initialElements = [], socket }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  
  const {
    elements,
    toolActionType,
    activeToolItem,
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
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        undo();
      } else if (event.ctrlKey && event.key === "y") {
        event.preventDefault();
        redo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  // Debounced save function to prevent rapid API calls
  const saveCanvas = useCallback(async (skipWebSocket = false) => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log("Save already in progress, skipping...");
      return;
    }

    // Debounce: don't save more than once per second
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) {
      console.log("Save debounced, too soon since last save");
      return;
    }

    isSavingRef.current = true;
    lastSaveTimeRef.current = now;

    try {
      console.log(`Saving canvas ${canvasId} with ${elements.length} elements`);
      await updateCanvas(canvasId, userEmail, elements);
      
      // Only emit to WebSocket if this is a local change (not from incoming WebSocket update)
      if (!skipWebSocket && socket) {
        console.log("Emitting canvas update to other users");
        socket.emit('updateCanvas', {
          canvasId,
          canvasElements: elements
        });
      }
    } catch (error) {
      console.error("Failed to save canvas:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [canvasId, userEmail, elements, socket]);

  // Handle mouse up - save with debounce
  const handleMouseUp = useCallback(() => {
    boardMouseUpHandler();
    
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING || 
        toolActionType === TOOL_ACTION_TYPES.ERASING) {
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Schedule save after 500ms of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas();
      }, 500);
    }
  }, [boardMouseUpHandler, toolActionType, saveCanvas]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    
    // Clear and fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
  
    const roughCanvas = rough.canvas(canvas);
  
    elements.forEach((element) => {
      try {
        switch (element.type) {
          case TOOL_ITEMS.LINE:
          case TOOL_ITEMS.RECTANGLE:
          case TOOL_ITEMS.CIRCLE:
          case TOOL_ITEMS.ARROW:
            if (element.roughEle) {
              roughCanvas.draw(element.roughEle);
            }
            break;
          case TOOL_ITEMS.BRUSH:
            if (element.path && element.stroke) {
              context.fillStyle = element.stroke;
              context.fill(element.path);
            }
            break;
          case TOOL_ITEMS.TEXT:
            context.textBaseline = "top";
            context.font = `${element.size || 20}px Caveat`;
            context.fillStyle = element.stroke || "#000000";
            context.fillText(element.text || "", element.x1, element.y1);
            break;
          default:
            console.warn("Unknown element type:", element.type);
        }
      } catch (error) {
        console.error("Error rendering element:", element, error);
      }
    });
  
    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [elements]);
  

  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.select();
        }
      }, 0);
    }
  }, [toolActionType]);

  const handleMouseMove = (event) => {
    boardMouseMoveHandler(event);
  };

  const handleTextBlur = (text) => {
    textAreaBlurHandler(text);
    // Save after text is added
    setTimeout(() => {
      saveCanvas();
    }, 100);
  };

  // Manual save button
  const handleManualSave = () => {
    console.log("Manual save triggered");
    saveCanvas();
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && (
        <textarea
          type="text"
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1]?.y1 || 0,
            left: elements[elements.length - 1]?.x1 || 0,
            fontSize: `${elements[elements.length - 1]?.size || 20}px`,
            color: elements[elements.length - 1]?.stroke || "#000000",
          }}
          onBlur={(event) => handleTextBlur(event.target.value)}
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        className={cx(classes.canvas, {
          [classes.eraser]: activeToolItem === TOOL_ITEMS.ERASER,
          [classes.text]: activeToolItem === TOOL_ITEMS.TEXT,
        })}
        onMouseDown={(event) => boardMouseDownHandler(event, toolboxState)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <button
        onClick={handleManualSave}
        className={classes.saveButton}
        disabled={isSavingRef.current}
      >
        {isSavingRef.current ? "Saving..." : "Save"}
      </button>
    </>
  );
}

export default Board;