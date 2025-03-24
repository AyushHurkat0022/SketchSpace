/* eslint-disable react-hooks/exhaustive-deps */
// import { useParams } from "react-router-dom";
// import Board from "../Board";
// import Toolbar from "../Toolbar";
// import Toolbox from "../Toolbox";
// import BoardProvider from "../../store/BoardProvider";
// import ToolboxProvider from "../../store/ToolboxProvider";

// const CanvasPage = () => {
//   const { canvasid } = useParams(); // Extract canvas ID

//   return (
//     <BoardProvider>
//       <ToolboxProvider>
//         <Toolbar />
//         <Board canvasId={canvasid} />
//         <Toolbox />
//       </ToolboxProvider>
//     </BoardProvider>
//   );
// };

// export default CanvasPage;
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true); // Add loading state
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserEmail(decoded.email);
      } catch (error) {
        console.error("Invalid token:", error);
        navigate("/auth"); // Redirect if token is invalid
      }
    } else {
      navigate("/auth"); // Redirect if no token
    }
  }, [navigate]);

  useEffect(() => {
    if (userEmail) { // Only fetch when userEmail is set
      fetchCanvas();
    }
  }, [userEmail, canvasid]); // Add userEmail as dependency

  const fetchCanvas = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3030/canvases/${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch canvases: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const canvas = data.find(c => c._id === canvasid);
      if (canvas) {
        setCanvasData(canvas);
      } else {
        console.warn(`Canvas with ID ${canvasid} not found`);
      }
    } catch (error) {
      console.error("Error fetching canvas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (elements) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3030/canvases/${canvasid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: userEmail, canvasElements: elements }),
      });
      if (!response.ok) throw new Error("Failed to update canvas");
      const updatedCanvas = await response.json();
      setCanvasData(updatedCanvas);
    } catch (error) {
      console.error("Error updating canvas:", error);
    }
  };

  const handleShare = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3030/canvases/${canvasid}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shareWithEmail: shareEmail, ownerEmail: userEmail }),
      });
      if (!response.ok) throw new Error("Failed to share canvas");
      setShareEmail("");
      setIsSharePopupOpen(false);
      fetchCanvas();
    } catch (error) {
      console.error("Error sharing canvas:", error);
    }
  };

  return (
    <BoardProvider>
        <ToolboxProvider>
            <div className="relative min-h-screen bg-gray-100">
                <Toolbar />
                {/* Hamburger Menu */}
                <div className="absolute top-4 left-4 z-20">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 bg-white rounded-full shadow-md"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    {isMenuOpen && canvasData && (
                        <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Shared With:</h3>
                            <ul className="text-sm text-gray-600">
                                {canvasData.canvasSharedWith.length > 0 ? (
                                    canvasData.canvasSharedWith.map((email, index) => (
                                        <li key={index} className="py-1">{email}</li>
                                    ))
                                ) : (
                                    <li>Not shared with anyone</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Share Button and Popup */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setIsSharePopupOpen(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        Share
                    </button>
                    {isSharePopupOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Share Canvas</h3>
                                <button 
                                    onClick={() => setIsSharePopupOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="Enter email to share with"
                                className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleShare}
                                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                            >
                                Send Invite
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-screen">Loading...</div>
                ) : canvasData ? (
                    <Board 
                        canvasId={canvasid} 
                        initialElements={canvasData?.canvasElements || []}
                        onUpdate={handleUpdate}
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