// utils/api.js
import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL || "http://localhost:3030"}/canvases`;

export const updateCanvas = async (canvasId, email, elements) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${canvasId}`,
      {
        email,
        canvasElements: elements
      },
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