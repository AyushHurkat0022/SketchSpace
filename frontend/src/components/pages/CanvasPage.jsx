// src/components/pages/CanvasPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import Board from "../Board";
import Toolbar from "../Toolbar";
import Toolbox from "../Toolbox";
import BoardProvider from "../../store/BoardProvider";
import ToolboxProvider from "../../store/ToolboxProvider";
import { jwtDecode } from "jwt-decode";
import { Menu, X } from "lucide-react";

const CanvasPage = () => {
  const { canvasid } = useParams();
  const navigate = useNavigate();
  const [canvasData, setCanvasData] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log(`CanvasPage component initialized for canvas ID: ${canvasid}`);
    return () => {
      console.log(`CanvasPage component unmounted for canvas ID: ${canvasid}`);
    };
  }, [canvasid]);

  useEffect(() => {
    console.log("Starting token verification...");
    const token = localStorage.getItem("token");
    if (token) {
      try {
        console.log("Token found, attempting to decode...");
        const decoded = jwtDecode(token);
        console.log(`Token decoded successfully for user: ${decoded.email}`);
        setUserEmail(decoded.email);
      } catch (error) {
        console.error("Invalid token:", error);
        console.log("Redirecting to auth page due to invalid token");
        navigate("/auth");
      }
    } else {
      console.log("No token found, redirecting to auth page");
      navigate("/auth");
    }
  }, [navigate]);

  const fetchCanvas = useCallback(async () => {
    console.log(`Fetching canvas data for canvas ID: ${canvasid}`);
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3030/canvases/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch canvases: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch canvases: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.length} canvases for user ${userEmail}`);

      const canvas = data.find((c) => c._id === canvasid);
      if (canvas) {
        console.log(`Found canvas with ID ${canvasid}, setting canvas data`);
        setCanvasData(canvas);
      } else {
        console.warn(`Canvas with ID ${canvasid} not found in user's canvases`);
      }
    } catch (error) {
      console.error("Error fetching canvas:", error);
    } finally {
      console.log("Finished canvas fetch operation");
      setLoading(false);
    }
  }, [userEmail, canvasid]);

  const setupWebSocket = useCallback(() => {
    console.log("Setting up WebSocket connection...");
    socketRef.current = io("http://localhost:3030", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socketRef.current.on("connect", () => {
      console.log(`Connected to WebSocket server with socket ID: ${socketRef.current.id}`);
      console.log(`Joining canvas ${canvasid} as user ${userEmail}`);
      socketRef.current.emit("joinCanvas", {
        canvasId: canvasid,
        userEmail: userEmail,
      });
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log(`Disconnected from WebSocket server. Reason: ${reason}`);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("WebSocket connection error:", err.message);
    });

    socketRef.current.on('canvasUpdated', ({ canvasElements, updatedBy, timestamp }) => {
      console.log(`Received real-time update from ${updatedBy} at ${timestamp}`);
      setCanvasData(prev => ({
        ...prev,
        canvasElements,
        updatedAt: timestamp,
        lastUpdatedBy: updatedBy
      }));
    });

    socketRef.current.on("userJoined", (data) => {
      console.log(`User ${data.userEmail} joined the canvas ${data.canvasId}`);
    });

    socketRef.current.on("user left", (data) => {
      console.log(`User ${data.userEmail} left the canvas ${data.canvasId}`);
    });

    socketRef.current.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    return () => {
      console.log("Cleaning up WebSocket listeners");
      socketRef.current.off("connect");
      socketRef.current.off("disconnect");
      socketRef.current.off("connect_error");
      socketRef.current.off("canvasUpdated");
      socketRef.current.off("userJoined");
      socketRef.current.off("user left");
      socketRef.current.off("error");
    };
  }, [canvasid, userEmail]);

  useEffect(() => {
    if (!userEmail) {
      console.log("User email not set, skipping WebSocket setup and canvas fetch");
      return;
    }

    console.log(`User email set to ${userEmail}, initializing canvas...`);
    fetchCanvas();
    setupWebSocket();

    return () => {
      console.log("Cleaning up WebSocket connection on component unmount");
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userEmail, fetchCanvas, setupWebSocket]);

  const handleShare = useCallback(async () => {
    console.log(`Attempting to share canvas with ${shareEmail}`);
    if (!shareEmail.trim()) {
      setShareMessage("Please enter an email.");
      return;
    }

    try {
      setShareMessage("");
      const response = await fetch(`http://localhost:3030/canvases/${canvasid}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ shareWithEmail: shareEmail, ownerEmail: userEmail }),
      });

      if (!response.ok) {
        console.error("Failed to share canvas on server");
        throw new Error("Failed to share canvas");
      }

      console.log(`Successfully shared canvas with ${shareEmail}`);
      setShareMessage("Canvas shared successfully!");
      setShareEmail("");
      setIsSharePopupOpen(false);
      fetchCanvas();
      setTimeout(() => setShareMessage(""), 5000);
    } catch (error) {
      console.error("Error sharing canvas:", error);
      setShareMessage(error.message || "Failed to share canvas.");
      setTimeout(() => setShareMessage(""), 5000);
    }
  }, [canvasid, shareEmail, userEmail, fetchCanvas]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  useEffect(() => {
    if (canvasData) {
      console.log(`Canvas data updated. Shared with ${canvasData.canvasSharedWith.length} users.`);
    }
  }, [canvasData]);

  useEffect(() => {
    console.log(`Share popup is now ${isSharePopupOpen ? 'open' : 'closed'}`);
  }, [isSharePopupOpen]);

  useEffect(() => {
    console.log(`Menu is now ${isMenuOpen ? 'open' : 'closed'}`);
  }, [isMenuOpen]);

  return (
    <BoardProvider initialElements={canvasData?.canvasElements || []}>
      <ToolboxProvider>
        <div className="relative min-h-screen bg-gray-100">
          <Toolbar />
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={() => {
                console.log(`Toggling menu to ${!isMenuOpen}`);
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 bg-white rounded-full shadow-md"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            {isMenuOpen && canvasData && (
              <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Shared With:</h3>
                <ul className="text-sm text-gray-600 mb-4">
                  {canvasData.canvasSharedWith.length > 0 ? (
                    canvasData.canvasSharedWith.map((email, index) => (
                      <li key={index} className="py-1">
                        {email}
                      </li>
                    ))
                  ) : (
                    <li>Not shared with anyone</li>
                  )}
                </ul>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => {
                console.log("Opening share popup");
                setIsSharePopupOpen(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Share
            </button>
            {isSharePopupOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Share Canvas</h3>
                  <button
                    onClick={() => {
                      console.log("Closing share popup");
                      setIsSharePopupOpen(false);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => {
                    console.log(`Share email input changed to: ${e.target.value}`);
                    setShareEmail(e.target.value);
                  }}
                  placeholder="Enter email to share with"
                  className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleShare}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Send Invite
                </button>
                {shareMessage && (
                  <p className={`mt-2 text-sm ${shareMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                    {shareMessage}
                  </p>
                )}
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-screen">Loading...</div>
          ) : canvasData ? (
            <Board
              canvasId={canvasid}
              userEmail={userEmail}
              initialElements={canvasData?.canvasElements || []}
              socket={socketRef.current}
            />
          ) : (
            <div className="flex items-center justify-center h-screen">Canvas not found</div>
          )}
          <Toolbox />
        </div>
      </ToolboxProvider>
    </BoardProvider>
  );
};

export default CanvasPage;