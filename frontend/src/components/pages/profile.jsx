// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";

// const Profile = () => {
//   const navigate = useNavigate();
//   const [user, setUser] = useState({ name: "", email: "", image: "" });
//   const [canvases, setCanvases] = useState([]);
//   const [canvasName, setCanvasName] = useState("");

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           name: decoded.name || decoded.username || "John Doe",
//           email: decoded.email || "johndoe@example.com",
//           image:
//             decoded.image ||
//             "https://connectkaro.org/wp-content/uploads/2019/03/placeholder-profile-male-500x500.png",
//         });
//       } catch (error) {
//         console.error("Invalid token", error);
//       }
//     }
//     fetchCanvases();
//   }, []);

//   const fetchCanvases = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) return;

//     try {
//       const decoded = jwtDecode(token);
//       const email = decoded.email;

//       const response = await fetch(`http://localhost:3030/canvases/${email}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) throw new Error("Failed to fetch canvases");
//       const data = await response.json();
//       setCanvases(data);
//     } catch (error) {
//       console.error("Error fetching canvases:", error);
//     }
//   };

//   const handleCreateCanvas = async () => {
//     console.log("Create Canvas Button Clicked!");
  
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found");
//       return;
//     }
  
//     const requestBody = {
//       email: user.email,  // Fix key name from 'createdBy' to 'email'
//       canvasElements: [], // Default empty array
//       canvasSharedWith: [], // Default empty array
//     };
  
//     console.log("Request Body:", JSON.stringify(requestBody));
  
//     try {
//       const response = await fetch("http://localhost:3030/canvases", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`, // Ensure the correct token is used
//         },
//         body: JSON.stringify(requestBody),
//       });
  
//       console.log("Response Status:", response.status);
  
//       if (!response.ok) {
//         const errorMessage = await response.text();
//         throw new Error(`Failed to create canvas: ${errorMessage}`);
//       }
  
//       const newCanvas = await response.json();
//       console.log("Canvas Created:", newCanvas);
  
//       setCanvases((prevCanvases) => [...prevCanvases, newCanvas]);
//     } catch (error) {
//       console.error("Error creating canvas:", error);
//     }
//   };

//   const handleCanvasClick = (canvasId) => {
//     if (!canvasId) {
//       console.error("Canvas ID is undefined!");
//       return;
//     }
//     navigate(`/canvas/${canvasId}`);
//   };

//   return (
//     <div className="min-h-screen p-8 flex flex-col items-center bg-starry relative">
//       <div className="absolute top-0 left-0 right-0 p-8 text-left z-20">
//         <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl">
//           SketchSpace
//         </h1>
//         <p className="text-green-600 italic mb-6 lg:text-xl">
//           Draw Your Vision, Share Your Story.
//         </p>
//       </div>

//       <div className="absolute top-8 right-8 flex gap-4">
//         <button
//           className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-all cursor-pointer"
//           onClick={() => navigate("/auth")}
//         >
//           Logout
//         </button>
//       </div>

//       <div className="w-full max-w-4xl p-6 mt-20 lg:mt-32 bg-white rounded-lg shadow-xl flex items-center gap-6 border border-gray-200">
//         <img
//           className="w-20 h-20 rounded-full border-2 border-yellow-500"
//           src={user.image}
//           alt="User Avatar"
//           onError={(e) => {
//             e.target.onerror = null;
//             e.target.src =
//               "https://connectkaro.org/wp-content/uploads/2019/03/placeholder-profile-male-500x500.png";
//           }}
//         />
//         <div>
//           <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
//           <p className="text-gray-600">{user.email}</p>
//         </div>
//       </div>

//       <div className="w-full max-w-4xl mt-8">
//         <h3 className="text-lg font-bold text-gray-900 mb-4">Create a New Canvas</h3>
//         <div className="flex gap-4">
//           <input
//             type="text"
//             className="p-2 border rounded-md w-full"
//             placeholder="Enter Canvas Name"
//             value={canvasName}
//             onChange={(e) => setCanvasName(e.target.value)}
//           />
//           <button
//             className="px-4 py-2 bg-green-500 text-white rounded-md cursor-pointer"
//             onClick={handleCreateCanvas}
//           >
//             Create
//           </button>
//         </div>
//       </div>

//       <div className="w-full max-w-4xl mt-8">
//       <h3 className="text-lg font-bold text-gray-900 mb-4">Your Canvases</h3>
//       <div className="grid grid-cols-2 gap-6">
//         {canvases.length > 0 ? (
//           canvases.map((canvas, index) => (
//             <div
//               key={index}
//               onClick={() => handleCanvasClick(canvas._id)}
//               className="p-6 border border-yellow-500 hover:bg-yellow-100 transition text-center rounded-lg shadow-md font-medium cursor-pointer"
//             >
//               {canvas.name || `${user.name}'s Canvas ${index + 1}`}
//             </div>
//           ))
//         ) : (
//           <p className="text-gray-600">No canvases found</p>
//         )}
//       </div>
//     </div>
//     </div>
//   );
// };

// export default Profile;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "" });
  const [canvases, setCanvases] = useState([]);
  const [canvasName, setCanvasName] = useState("");

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
    const token = localStorage.getItem("token");
    try {
        const requestBody = {
            email: user.email,
            canvasElements: [],
            canvasSharedWith: [],
            name: canvasName || undefined,
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
            throw new Error(`Failed to create canvas: ${response.status} - ${data.error || data.message || 'Unknown error'}`);
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
      setCanvases((prev) => prev.filter(canvas => canvas._id !== canvasId));
    } catch (error) {
      console.error("Error deleting canvas:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-starry relative">
      <div className="absolute top-0 left-0 right-0 p-8 text-left z-20">
        <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl">
          SketchSpace
        </h1>
        <p className="text-green-600 italic mb-6 lg:text-xl">
          Draw Your Vision, Share Your Story.
        </p>
      </div>

      <div className="absolute top-8 right-8 flex gap-4">
        <button
          className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-yellow-600 transition-all cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="w-full max-w-4xl p-6 mt-20 lg:mt-32 bg-white rounded-lg shadow-xl flex items-center gap-6 border border-gray-200">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Create a New Canvas</h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="p-2 border rounded-md w-full"
            placeholder="Enter Canvas Name"
            value={canvasName}
            onChange={(e) => setCanvasName(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-md cursor-pointer"
            onClick={handleCreateCanvas}
          >
            Create
          </button>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Canvases</h3>
        <div className="grid grid-cols-2 gap-6">
          {canvases.length > 0 ? (
            canvases.map((canvas) => (
              <div
                key={canvas._id}
                className="p-6 border border-yellow-500 rounded-lg shadow-md"
              >
                <div
                  onClick={() => handleCanvasClick(canvas._id)}
                  className="hover:bg-yellow-100 transition text-center font-medium cursor-pointer mb-2"
                >
                  {canvas.name || `${user.name}'s Canvas`}
                </div>
                <div className="text-sm text-gray-600">
                  Last updated by: {canvas.lastUpdatedBy || "Unknown"}
                </div>
                <div className="text-sm text-gray-600">
                  Shared with: {canvas.canvasSharedWith.join(", ") || "None"}
                </div>
                <button
                  onClick={() => handleDeleteCanvas(canvas._id, canvas.email === user.email)}
                  className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  {canvas.email === user.email ? "Delete" : "Remove"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No canvases found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;