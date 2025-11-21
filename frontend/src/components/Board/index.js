import { useContext, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import { updateCanvas } from "../../utils/api";
import classes from "./index.module.css";
import cx from "classnames";

const MIN_SAVE_INTERVAL_MS = 250;
const STREAM_INTERVAL_MS = 75;

function Board({ canvasId, userEmail, initialElements = [], socket }) {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const lastStreamTimeRef = useRef(0);
  const elementsRef = useRef(initialElements);
  const toolActionTypeRef = useRef(TOOL_ACTION_TYPES.NONE);
  const removedElementIdsRef = useRef(new Set());
  const persistedElementIdsRef = useRef(new Set());
  const historyVersionTrackerRef = useRef(0);
  
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
    mergeElements,
    historyVersion,
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

  useEffect(() => {
    const previousElements = elementsRef.current || [];
    const nextElements = elements || [];
    const nextIds = new Set(nextElements.map((el) => el?.id).filter(Boolean));

    if (toolActionTypeRef.current === TOOL_ACTION_TYPES.ERASING) {
      previousElements.forEach((element) => {
        if (element?.id && !nextIds.has(element.id)) {
          removedElementIdsRef.current.add(element.id);
        }
      });
    }

    elementsRef.current = nextElements;
  }, [elements]);

  useEffect(() => {
    const seedIds = new Set(
      (initialElements || []).map((element) => element?.id).filter(Boolean)
    );
    persistedElementIdsRef.current = seedIds;
    removedElementIdsRef.current.clear();
  }, [canvasId, initialElements]);

  useEffect(() => {
    toolActionTypeRef.current = toolActionType;
  }, [toolActionType]);

  const serializeElement = useCallback((element) => {
    if (!element) return null;
    const { path, roughEle, ...rest } = element;
    if (Array.isArray(rest.points)) {
      rest.points = rest.points.map((point) => ({ ...point }));
    }
    return { ...rest };
  }, []);

  const serializeElements = useCallback(
    (currentElements = elementsRef.current) => {
      return currentElements
        .map((element) => serializeElement(element))
        .filter(Boolean);
    },
    [serializeElement]
  );

  const buildRemovalEntries = useCallback((currentIdSet) => {
    const removalIdSet = new Set(removedElementIdsRef.current);
    const previousIds = persistedElementIdsRef.current || new Set();

    if (previousIds.size > 0) {
      previousIds.forEach((id) => {
        if (!currentIdSet.has(id)) {
          removalIdSet.add(id);
        }
      });
    }

    return Array.from(removalIdSet).map((id) => ({
      id,
      isDeleted: true,
      updatedAt: Date.now(),
    }));
  }, []);

  const getSnapshotData = useCallback(() => {
    const serializedElements = serializeElements(elementsRef.current || []);
    const currentIdSet = new Set(
      serializedElements.map((element) => element?.id).filter(Boolean)
    );
    const removalEntries = buildRemovalEntries(currentIdSet);
    const removalIds = removalEntries.map((entry) => entry.id);
    return {
      serializedElements,
      currentIdSet,
      removalEntries,
      removalIds,
    };
  }, [serializeElements, buildRemovalEntries]);

  const clearRemovedElementIds = useCallback(() => {
    removedElementIdsRef.current.clear();
  }, []);

  // Debounced save function to prevent rapid API calls
  const saveCanvas = useCallback(async () => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log("Save already in progress, skipping...");
      return;
    }

    // Debounce: don't save more than once per second
    const now = Date.now();
    if (now - lastSaveTimeRef.current < MIN_SAVE_INTERVAL_MS) {
      console.log("Save debounced, too soon since last save");
      return;
    }

    isSavingRef.current = true;
    lastSaveTimeRef.current = now;

    try {
      const {
        serializedElements,
        currentIdSet,
        removalEntries,
        removalIds,
      } = getSnapshotData();
      const payloadElements = [...serializedElements, ...removalEntries];
      console.log(
        `Saving canvas ${canvasId} with ${serializedElements.length} elements`
      );

      if (socket) {
        console.log("Emitting canvas update to other users");
        socket.emit('updateCanvas', {
          canvasId,
          canvasElements: payloadElements,
          removedElementIds: removalIds,
        });
      }

      // Persist via REST as a fallback, but don't block real-time updates
      updateCanvas(canvasId, userEmail, payloadElements).catch((error) => {
        console.error("Failed to persist canvas via REST:", error);
      });

      persistedElementIdsRef.current = currentIdSet;
      clearRemovedElementIds();
    } catch (error) {
      console.error("Failed to save canvas:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [canvasId, userEmail, socket, getSnapshotData, clearRemovedElementIds]);

  const emitStreamPayload = useCallback(
    (payload) => {
      if (!socket) return;
      const now = Date.now();

      if (now - lastStreamTimeRef.current < STREAM_INTERVAL_MS) {
        return;
      }
      lastStreamTimeRef.current = now;

      socket.emit('streamCanvas', {
        canvasId,
        timestamp: now,
        ...payload,
      });
    },
    [socket, canvasId]
  );

  const streamActiveElement = useCallback(
    (modeOverride) => {
      const mode =
        modeOverride ||
        (toolActionTypeRef.current === TOOL_ACTION_TYPES.ERASING
          ? 'snapshot'
          : 'element');

      if (mode === 'snapshot') {
        const removalIds = Array.from(removedElementIdsRef.current);
        emitStreamPayload({
          mode: 'snapshot',
          elements: serializeElements(elementsRef.current),
          removedElementIds: removalIds,
        });
        return;
      }

      const activeElement =
        elementsRef.current[elementsRef.current.length - 1];
      const serialized = serializeElement(activeElement);
      if (!serialized) return;

      emitStreamPayload({
        mode: 'element',
        element: serialized,
      });
    },
    [emitStreamPayload, serializeElements, serializeElement]
  );

  // Listen for streaming updates from other collaborators
  useEffect(() => {
    if (!socket) return;

    const applyRemovals = (ids = [], timestamp) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      const removalEntries = ids.map((id) => ({
        id,
        isDeleted: true,
        updatedAt: timestamp || Date.now(),
      }));
      mergeElements(removalEntries);
    };

    const handleStream = (payload = {}) => {
      if (Array.isArray(payload.removedElementIds) && payload.removedElementIds.length) {
        applyRemovals(payload.removedElementIds, payload.timestamp);
      }

      if (payload.mode === 'element' && payload.element) {
        mergeElements([payload.element]);
        return;
      }

      const snapshot = payload.canvasElements || payload.elements;
      if (Array.isArray(snapshot)) {
        mergeElements(snapshot);
      }
    };

    const handleCanvasUpdated = ({ canvasElements, updatedBy }) => {
      const shouldResetHistory =
        updatedBy && updatedBy !== userEmail ? true : false;
      mergeElements(canvasElements || [], { resetHistory: shouldResetHistory });
    };

    socket.on('canvasStream', handleStream);
    socket.on('canvasUpdated', handleCanvasUpdated);

    return () => {
      socket.off('canvasStream', handleStream);
      socket.off('canvasUpdated', handleCanvasUpdated);
    };
  }, [socket, mergeElements, userEmail]);

  // Handle mouse up - save with debounce
  const handleMouseUp = useCallback(() => {
    boardMouseUpHandler();
    
    if (toolActionType === TOOL_ACTION_TYPES.DRAWING || 
        toolActionType === TOOL_ACTION_TYPES.ERASING) {
      saveCanvas();
    }
  }, [boardMouseUpHandler, toolActionType, saveCanvas]);

  useEffect(() => {
    if (historyVersion > historyVersionTrackerRef.current) {
      historyVersionTrackerRef.current = historyVersion;
      const snapshot = getSnapshotData();
      emitStreamPayload({
        mode: 'snapshot',
        elements: snapshot.serializedElements,
        removedElementIds: snapshot.removalIds,
      });
      saveCanvas();
    } else {
      historyVersionTrackerRef.current = historyVersion;
    }
  }, [historyVersion, saveCanvas, emitStreamPayload, getSnapshotData]);

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

    if (
      toolActionTypeRef.current === TOOL_ACTION_TYPES.DRAWING ||
      toolActionTypeRef.current === TOOL_ACTION_TYPES.ERASING
    ) {
      streamActiveElement(
        toolActionTypeRef.current === TOOL_ACTION_TYPES.ERASING
          ? 'snapshot'
          : 'element'
      );
    }
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