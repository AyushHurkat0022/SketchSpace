import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "" });
  const [canvases, setCanvases] = useState([]);
  const [canvasName, setCanvasName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharedEmails, setSharedEmails] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3030";

  const fetchCanvases = useCallback(async (email) => {
    if (!email) return;
    
    const token = localStorage.getItem("token");
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/canvases/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch canvases");
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} canvases`);
      setCanvases(data);
    } catch (error) {
      console.error("Error fetching canvases:", error);
      setError("Failed to load canvases. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    
    try {
      const decoded = jwtDecode(token);
      setUser({
        name: decoded.username || "User",
        email: decoded.email || "",
      });
      fetchCanvases(decoded.email);
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.removeItem("token");
      navigate("/auth");
    }
  }, [navigate, fetchCanvases]);

  const handleCreateCanvas = async () => {
    if (!canvasName.trim()) {
      setError("Canvas name is required");
      return;
    }

    setError("");
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const requestBody = {
        email: user.email,
        canvasElements: [],
        canvasSharedWith: [],
        name: canvasName,
      };
      
      const response = await fetch(`${API_URL}/canvases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create canvas");
      }

      console.log("Canvas created:", data);
      setCanvases((prev) => [...prev, data]);
      setCanvasName("");
    } catch (error) {
      console.error("Error creating canvas:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (canvasId) => {
    navigate(`/canvas/${canvasId}`);
  };

  const handleDeleteCanvas = async (canvasId, isOwner) => {
    if (!window.confirm(isOwner ? "Delete this canvas permanently?" : "Remove this canvas from your list?")) {
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/canvases/${canvasId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete canvas");
      }
      
      setCanvases((prev) => prev.filter((canvas) => canvas._id !== canvasId));
    } catch (error) {
      console.error("Error deleting canvas:", error);
      setError("Failed to delete canvas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShowSharedWith = (canvasId) => {
    setSharedEmails((prev) => (prev === canvasId ? null : canvasId));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const getCanvasPreview = (canvas) => {
    const elementCount = canvas.canvasElements?.length || 0;
    return elementCount > 0 ? `${elementCount} elements` : "Empty canvas";
  };

  return (
    <div className="min-h-screen p-8 flex flex-col bg-gray-100">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
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

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-yellow-600">
            Welcome Back, {user.name}! 👋
          </h2>
          <p className="text-gray-600 mt-2">
            Manage and create your canvas projects
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Create Canvas */}
        <div className="mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <input
                type="text"
                className={`p-3 border ${
                  error && !canvasName.trim() ? "border-red-500" : "border-gray-300"
                } rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                placeholder="Enter canvas name"
                value={canvasName}
                onChange={(e) => {
                  setCanvasName(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleCreateCanvas();
                  }
                }}
                disabled={loading}
              />
              <button
                className={`px-6 py-3 bg-yellow-600 text-white rounded-lg flex items-center gap-2 hover:bg-yellow-700 transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleCreateCanvas}
                disabled={loading}
              >
                <span className="text-lg">+</span> 
                {loading ? "Creating..." : "Create Canvas"}
              </button>
            </div>
          </div>
        </div>

        {/* Canvas List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-yellow-600">
              Your Canvases ({canvases.length})
            </h3>
            {loading && (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
            )}
          </div>
          
          {canvases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {canvases.map((canvas) => {
                const isOwner = canvas.email === user.email;
                
                return (
                  <div
                    key={canvas._id}
                    className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div
                      onClick={() => handleCanvasClick(canvas._id)}
                      className="flex flex-col items-center justify-center h-32 bg-gradient-to-br from-yellow-50 to-green-50 rounded-lg mb-4 cursor-pointer hover:from-yellow-100 hover:to-green-100 transition-all"
                    >
                      <span className="text-4xl mb-2">🎨</span>
                      <span className="text-xs text-gray-500">
                        {getCanvasPreview(canvas)}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-800 text-center mb-2">
                      {canvas.name || `${user.name}'s Canvas`}
                    </h4>
                    
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <div className="flex items-center justify-between">
                        <span>Owner:</span>
                        <span className="font-medium">
                          {isOwner ? "You" : canvas.email}
                        </span>
                      </div>
                      {canvas.lastUpdatedBy && (
                        <div className="flex items-center justify-between">
                          <span>Last edited:</span>
                          <span className="font-medium">
                            {canvas.lastUpdatedBy === user.email ? "You" : canvas.lastUpdatedBy}
                          </span>
                        </div>
                      )}
                      {canvas.updatedAt && (
                        <div className="text-center text-gray-400">
                          {new Date(canvas.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {sharedEmails === canvas._id && (
                      <div className="text-xs bg-blue-50 p-2 rounded mb-3">
                        <div className="font-semibold text-gray-700 mb-1">Shared with:</div>
                        {canvas.canvasSharedWith.length > 0 ? (
                          <ul className="space-y-1">
                            {canvas.canvasSharedWith.map((email, index) => (
                              <li key={index} className="text-gray-600">
                                • {email}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-gray-400 italic">Not shared</div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between gap-2">
                      <button
                        onClick={() => handleShowSharedWith(canvas._id)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                      >
                        {sharedEmails === canvas._id ? "Hide" : "Shared"}
                      </button>
                      <button
                        onClick={() => handleDeleteCanvas(canvas._id, isOwner)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                        disabled={loading}
                      >
                        {isOwner ? "Delete" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-gray-600 mb-4">No canvases yet</p>
              <p className="text-sm text-gray-500">Create your first canvas to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;