import React, { useState, useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaUndoAlt,
  FaRedoAlt,
  FaFont,
  FaDownload,
  FaHandshake
} from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import { TOOL_ITEMS } from "../../constants";
import boardContext from "../../store/board-context";
import CollaborationPanel from "../colab/page";

const Toolbar = () => {
  const { activeToolItem, changeToolHandler, undo, redo } = useContext(boardContext);
  const [isCollabOpen, setIsCollabOpen] = useState(false);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    if (canvas) {
      const data = canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = data;
      anchor.download = "board.png";
      anchor.click();
    }
  };

  const handleColab = () => {
    setIsCollabOpen(true);
  };

  return (
    <>
      <div className={classes.container}>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.BRUSH)}
          title="Brush"
        >
          <FaPaintBrush />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.LINE })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.LINE)}
          title="Line"
        >
          <FaSlash />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.RECTANGLE)}
          title="Rectangle"
        >
          <LuRectangleHorizontal />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.CIRCLE)}
          title="Circle"
        >
          <FaRegCircle />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ARROW })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.ARROW)}
          title="Arrow"
        >
          <FaArrowRight />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ERASER })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.ERASER)}
          title="Eraser"
        >
          <FaEraser />
        </div>
        <div 
          className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.TEXT })} 
          onClick={() => changeToolHandler(TOOL_ITEMS.TEXT)}
          title="Text"
        >
          <FaFont />
        </div>
        <div className={classes.toolItem} onClick={undo} title="Undo">
          <FaUndoAlt />
        </div>
        <div className={classes.toolItem} onClick={redo} title="Redo">
          <FaRedoAlt />
        </div>
        <div className={classes.toolItem} onClick={handleDownloadClick} title="Download">
          <FaDownload />
        </div>
        <div className={classes.toolItem} onClick={handleColab} title="Collaborate">
          <FaHandshake />
        </div>
      </div>
      {isCollabOpen && <CollaborationPanel onClose={() => setIsCollabOpen(false)} />}
    </>
  );
};

export default Toolbar;