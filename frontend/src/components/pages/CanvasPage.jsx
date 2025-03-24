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

const CanvasPage = () => {
    const { canvasid } = useParams();
    const navigate = useNavigate();
    const [canvasData, setCanvasData] = useState(null);
    const [userEmail, setUserEmail] = useState("");
    const [shareEmail, setShareEmail] = useState("");
    const [loading, setLoading] = useState(true); // Add loading state

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
      fetchCanvas(); // Refresh canvas data
    } catch (error) {
      console.error("Error sharing canvas:", error);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3030/canvases/${canvasid}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
      if (!response.ok) throw new Error("Failed to delete canvas");
      navigate("/profile");
    } catch (error) {
      console.error("Error deleting canvas:", error);
    }
  };

  return (
    <BoardProvider>
        <ToolboxProvider>
            <div className="relative min-h-screen">
                <Toolbar />
                {loading ? (
                    <div>Loading...</div>
                ) : canvasData ? (
                    <>
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="Share with email"
                                className="p-2 border rounded"
                            />
                            <button
                                onClick={handleShare}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Share
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                Delete
                            </button>
                        </div>
                        <Board 
                            canvasId={canvasid} 
                            initialElements={canvasData?.canvasElements || []}
                            onUpdate={handleUpdate}
                        />
                    </>
                ) : (
                    <div>Canvas not found</div>
                )}
                <Toolbox />
            </div>
        </ToolboxProvider>
    </BoardProvider>
);
};

export default CanvasPage;