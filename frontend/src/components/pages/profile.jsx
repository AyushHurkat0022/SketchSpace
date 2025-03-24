import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "" });
  const [canvases, setCanvases] = useState([]);
  const [canvasName, setCanvasName] = useState("");
  const [error, setError] = useState("");
  const [sharedEmails, setSharedEmails] = useState(null); // State to track which canvas's shared emails to show

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUser({
        name: decoded.username || "John Doe",
        email: decoded.email || "johndoe@example.com",
      });
      fetchCanvases(decoded.email);
    } catch (error) {
      console.error("Invalid token", error);
      navigate("/auth");
    }
  }, [navigate]);

  const fetchCanvases = async (email) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3030/canvases/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch canvases");
      const data = await response.json();
      setCanvases(data);
    } catch (error) {
      console.error("Error fetching canvases:", error);
    }
  };

  const handleCreateCanvas = async () => {
    if (!canvasName.trim()) {
      setError("Canvas name is required");
      return;
    }

    setError("");
    const token = localStorage.getItem("token");
    try {
      const requestBody = {
        email: user.email,
        canvasElements: [],
        canvasSharedWith: [],
        name: canvasName,
      };
      const response = await fetch("http://localhost:3030/canvases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Failed to create canvas: ${response.status} - ${
            data.error || data.message || "Unknown error"
          }`
        );
      }

      setCanvases((prev) => [...prev, data]);
      setCanvasName("");
    } catch (error) {
      console.error("Error creating canvas:", error);
    }
  };

  const handleCanvasClick = (canvasId) => {
    navigate(`/canvas/${canvasId}`);
  };

  const handleDeleteCanvas = async (canvasId, isOwner) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3030/canvases/${canvasId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      if (!response.ok) throw new Error("Failed to delete canvas");
      setCanvases((prev) => prev.filter((canvas) => canvas._id !== canvasId));
    } catch (error) {
      console.error("Error deleting canvas:", error);
    }
  };

  const handleShareCanvas = (canvasId) => {
    console.log(`Sharing canvas with ID: ${canvasId}`);
  };

  const handleShowSharedWith = (canvasId, sharedWith) => {
    // Toggle shared emails display
    if (sharedEmails === canvasId) {
      setSharedEmails(null); // Hide if already showing
    } else {
      setSharedEmails(canvasId); // Show for this canvas
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-8 flex flex-col bg-gray-100">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl">
              SketchSpace
            </h1>
            <p className="text-green-600 italic mb-6 lg:text-xl">
              Draw Your Vision, Share Your Story.
            </p>
          </div>
          <button
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-all cursor-pointer"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-yellow-600">
            Welcome Back, {user.name}! 👋
          </h2>
          <p className="text-gray-600 mt-2">Manage and create your canvas projects</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-col gap-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center gap-4">
              <input
                type="text"
                className={`p-3 border ${
                  error ? "border-red-500" : "border-gray-300"
                } rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter canvas name"
                value={canvasName}
                onChange={(e) => {
                  setCanvasName(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
              />
              <button
                className="px-4 py-3 bg-yellow-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all"
                onClick={handleCreateCanvas}
              >
                <span className="text-lg">+</span> Create New Canvas
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-yellow-600 mb-4">Your Canvases</h3>
          {canvases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {canvases.map((canvas) => (
                <div
                  key={canvas._id}
                  className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
                >
                  <div
                    onClick={() => handleCanvasClick(canvas._id)}
                    className="flex items-center justify-center h-24 bg-gray-100 rounded-lg mb-4 cursor-pointer hover:bg-gray-200 transition-all"
                  >
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 text-center">
                    {canvas.name || `${user.name}'s Canvas`}
                  </h4>
                  <div className="text-sm text-gray-600 mt-2">
                    Created by: {canvas.email === user.email ? user.name : canvas.email}
                  </div>
                  <div className="text-sm text-gray-600">
                    Last updated by: {canvas.lastUpdatedBy || canvas.email === user.email ? user.name : canvas.email}
                  </div>
                  {sharedEmails === canvas._id && (
                    <div className="text-sm text-gray-600 mt-2">
                      Shared with: {canvas.canvasSharedWith.length > 0 
                        ? canvas.canvasSharedWith.join(", ") 
                        : "None"}
                    </div>
                  )}
                  <div className="flex justify-between mt-4 gap-2">
                    <button
                      onClick={() => handleShareCanvas(canvas._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleShowSharedWith(canvas._id, canvas.canvasSharedWith)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                    >
                      Shared With
                    </button>
                    <button
                      onClick={() => handleDeleteCanvas(canvas._id, canvas.email === user.email)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                    >
                      {canvas.email === user.email ? "Delete" : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No canvases found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;