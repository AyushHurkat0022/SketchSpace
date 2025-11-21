import React, { useCallback, useReducer, useEffect } from "react";

import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import {
  createElement,
  getSvgPathFromStroke,
  isPointNearElement,
} from "../utils/element";
import getStroke from "perfect-freehand";

const normalizeTimestamp = (value) => {
  if (!value) return 0;
  if (value instanceof Date) {
    return value.getTime();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const hydrateElement = (element) => {
  if (!element) return null;

  const elementCreatedAt = element.createdAt || Date.now();
  const elementUpdatedAt = element.updatedAt || elementCreatedAt;

  if (element.type === TOOL_ITEMS.BRUSH) {
    const points = element.points || [];
    const strokePoints = getStroke(points);
    const path = new Path2D(getSvgPathFromStroke(strokePoints));
    return {
      ...element,
      points,
      path,
      createdAt: elementCreatedAt,
      updatedAt: elementUpdatedAt,
    };
  }

  if (
    element.type === TOOL_ITEMS.LINE ||
    element.type === TOOL_ITEMS.RECTANGLE ||
    element.type === TOOL_ITEMS.CIRCLE ||
    element.type === TOOL_ITEMS.ARROW
  ) {
    const hydrated = createElement(
      element.id,
      element.x1,
      element.y1,
      element.x2,
      element.y2,
      {
        type: element.type,
        stroke: element.stroke,
        fill: element.fill,
        size: element.size,
        createdAt: elementCreatedAt,
      }
    );

    return {
      ...hydrated,
      ...element,
      createdAt: elementCreatedAt,
      updatedAt: elementUpdatedAt,
      roughEle: hydrated.roughEle,
    };
  }

  if (element.type === TOOL_ITEMS.TEXT) {
    return {
      ...element,
      text: element.text || "",
      stroke: element.stroke || "#000000",
      size: element.size || 20,
      fill: element.fill || "transparent",
      createdAt: elementCreatedAt,
      updatedAt: elementUpdatedAt,
    };
  }

  return {
    ...element,
    createdAt: elementCreatedAt,
    updatedAt: elementUpdatedAt,
  };
};

const hydrateElements = (elements = []) =>
  elements
    .map((element) => hydrateElement(element))
    .filter((element) => element && element.id);

const mergeElementLists = (current = [], incoming = []) => {
  const map = new Map();

  current.forEach((element) => {
    if (element?.id) {
      map.set(element.id, element);
    }
  });

  incoming.forEach((element) => {
    if (!element || !element.id) {
      return;
    }

    if (element.isDeleted) {
      map.delete(element.id);
      return;
    }

    const existing = map.get(element.id);
    if (!existing) {
      map.set(element.id, element);
      return;
    }

    const existingUpdatedAt =
      normalizeTimestamp(existing.updatedAt) ||
      normalizeTimestamp(existing.createdAt);
    const incomingUpdatedAt =
      normalizeTimestamp(element.updatedAt) ||
      normalizeTimestamp(element.createdAt);

    if (incomingUpdatedAt >= existingUpdatedAt) {
      map.set(element.id, {
        ...existing,
        ...element,
        updatedAt: element.updatedAt || existing.updatedAt,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aCreated = normalizeTimestamp(a.createdAt);
    const bCreated = normalizeTimestamp(b.createdAt);
    if (aCreated === bCreated) {
      return (a.id || "").localeCompare(b.id || "");
    }
    return aCreated - bCreated;
  });
};

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL: {
      return {
        ...state,
        activeToolItem: action.payload.tool,
      };
    }
    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return {
        ...state,
        toolActionType: action.payload.actionType,
      };
    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;
      const newElement = createElement(
        undefined,
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size }
      );
      const prevElements = state.elements;
      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...prevElements, newElement],
      };
    }
    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const newElements = [...state.elements];
      const index = state.elements.length - 1;
      const currentElement = newElements[index];
      if (!currentElement) {
        return state;
      }
      const { type } = currentElement;
      switch (type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          const { x1, y1, stroke, fill, size, createdAt, id } = currentElement;
          const newElement = createElement(id, x1, y1, clientX, clientY, {
            type: state.activeToolItem,
            stroke,
            fill,
            size,
            createdAt,
          });
          newElements[index] = newElement;
          return {
            ...state,
            elements: newElements,
          };
        case TOOL_ITEMS.BRUSH:
          newElements[index].points = [
            ...newElements[index].points,
            { x: clientX, y: clientY },
          ];
          newElements[index].path = new Path2D(
            getSvgPathFromStroke(getStroke(newElements[index].points))
          );
          newElements[index].updatedAt = Date.now();
          return {
            ...state,
            elements: newElements,
          };
        default:
          throw new Error("Type not recognized");
      }
    }
    case BOARD_ACTIONS.DRAW_UP: {
      const elementsCopy = [...state.elements];
      // Remove any history after current index (for redo scenarios)
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;
      let newElements = [...state.elements];
      newElements = newElements.filter((element) => {
        return !isPointNearElement(element, clientX, clientY);
      });
      
      // Don't update history during erasing, only update elements
      return {
        ...state,
        elements: newElements,
      };
    }
    case BOARD_ACTIONS.ERASE_COMPLETE: {
      // Update history when erasing is complete
      const elementsCopy = [...state.elements];
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(elementsCopy);
      
      return {
        ...state,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.CHANGE_TEXT: {
      const index = state.elements.length - 1;
      const newElements = [...state.elements];
      newElements[index].text = action.payload.text;
      newElements[index].updatedAt = Date.now();
      
      // Remove any history after current index
      const newHistory = state.history.slice(0, state.index + 1);
      newHistory.push(newElements);
      
      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: newElements,
        history: newHistory,
        index: state.index + 1,
      };
    }
    case BOARD_ACTIONS.UNDO: {
      if (state.index <= 0) return state;
      
      const newIndex = state.index - 1;
      const newElements = state.history[newIndex];
      
      console.log(`Undo: Moving from index ${state.index} to ${newIndex}`);
      console.log(`Elements count: ${newElements.length}`);
      
      return {
        ...state,
        elements: newElements,
        index: newIndex,
      };
    }
    case BOARD_ACTIONS.REDO: {
      if (state.index >= state.history.length - 1) return state;
      
      const newIndex = state.index + 1;
      const newElements = state.history[newIndex];
      
      console.log(`Redo: Moving from index ${state.index} to ${newIndex}`);
      console.log(`Elements count: ${newElements.length}`);
      
      return {
        ...state,
        elements: newElements,
        index: newIndex,
      };
    }
    case BOARD_ACTIONS.SET_ELEMENTS: {
      const { elements = [], resetHistory = true } = action.payload || {};
      const processedElements = hydrateElements(elements);

      return {
        ...state,
        elements: processedElements,
        history: resetHistory ? [processedElements] : state.history,
        index: resetHistory ? 0 : state.index,
      };
    }
    case BOARD_ACTIONS.MERGE_ELEMENTS: {
      const incoming = hydrateElements(action.payload?.elements || []);
      const mergedElements = mergeElementLists(state.elements, incoming);
      const shouldResetHistory = action.payload?.resetHistory || false;

      return {
        ...state,
        elements: mergedElements,
        history: shouldResetHistory ? [mergedElements] : state.history,
        index: shouldResetHistory ? 0 : state.index,
      };
    }
    default:
      return state;
  }
};

const BoardProvider = ({ children, initialElements = [] }) => {
  const initialBoardState = {
    activeToolItem: TOOL_ITEMS.BRUSH,
    toolActionType: TOOL_ACTION_TYPES.NONE,
    elements: initialElements,
    history: [initialElements],
    index: 0,
  };
  const [boardState, dispatchBoardAction] = useReducer(
    boardReducer,
    initialBoardState
  );

  useEffect(() => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_ELEMENTS,
      payload: { elements: initialElements },
    });
  }, [initialElements]);

  const setElements = (elements) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.SET_ELEMENTS,
      payload: { elements, resetHistory: false },
    });
  };

  const mergeElements = (elements, options = {}) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.MERGE_ELEMENTS,
      payload: {
        elements,
        resetHistory: options.resetHistory ?? false,
      },
    });
  };

  const changeToolHandler = (tool) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TOOL,
      payload: {
        tool,
      },
    });
  };

  const boardMouseDownHandler = (event, toolboxState) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: {
          actionType: TOOL_ACTION_TYPES.ERASING,
        },
      });
      return;
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[boardState.activeToolItem]?.stroke,
        fill: toolboxState[boardState.activeToolItem]?.fill,
        size: toolboxState[boardState.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (event) => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    const { clientX, clientY } = event;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_MOVE,
        payload: {
          clientX,
          clientY,
        },
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE,
        payload: {
          clientX,
          clientY,
        },
      });
    }
  };

  const boardMouseUpHandler = () => {
    if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
    if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatchBoardAction({
        type: BOARD_ACTIONS.DRAW_UP,
      });
    } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
      // Complete the erase action and update history
      dispatchBoardAction({
        type: BOARD_ACTIONS.ERASE_COMPLETE,
      });
    }
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: {
        actionType: TOOL_ACTION_TYPES.NONE,
      },
    });
  };

  const textAreaBlurHandler = (text) => {
    dispatchBoardAction({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: {
        text,
      },
    });
  };

  const boardUndoHandler = useCallback(() => {
    console.log(`Undo clicked. Current index: ${boardState.index}, History length: ${boardState.history.length}`);
    dispatchBoardAction({
      type: BOARD_ACTIONS.UNDO,
    });
  }, [boardState.index, boardState.history.length]);

  const boardRedoHandler = useCallback(() => {
    console.log(`Redo clicked. Current index: ${boardState.index}, History length: ${boardState.history.length}`);
    dispatchBoardAction({
      type: BOARD_ACTIONS.REDO,
    });
  }, [boardState.index, boardState.history.length]);

  const boardContextValue = {
    activeToolItem: boardState.activeToolItem,
    elements: boardState.elements,
    toolActionType: boardState.toolActionType,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo: boardUndoHandler,
    redo: boardRedoHandler,
    setElements,
    mergeElements,
  };

  return (
    <boardContext.Provider value={boardContextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;