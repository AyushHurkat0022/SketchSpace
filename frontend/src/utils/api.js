// utils/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3030/canvases";

export const updateCanvas = async (canvasId, elements) => {
  const token = localStorage.getItem("token"); // or 'whiteboard_user_token' if that’s your key
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${canvasId}`,
      { canvasElements: elements },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Canvas updated successfully!", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating canvas:", error);
    throw error;
  }
};
