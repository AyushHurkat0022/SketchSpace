// src/utils/api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3030/canvases";

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

export const createCanvas = async (email, canvasName) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${API_BASE_URL}`,
      {
        email,
        canvasElements: [],
        canvasSharedWith: [],
        name: canvasName
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Canvas created successfully!", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating canvas:", error);
    throw error;
  }
};

export const deleteCanvas = async (canvasId, email) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/${canvasId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { email }
      }
    );
    console.log("Canvas deleted successfully!", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting canvas:", error);
    throw error;
  }
};

export const shareCanvas = async (canvasId, ownerEmail, shareWithEmail) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${API_BASE_URL}/${canvasId}/share`,
      {
        ownerEmail,
        shareWithEmail
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("Canvas shared successfully!", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sharing canvas:", error);
    throw error;
  }
};