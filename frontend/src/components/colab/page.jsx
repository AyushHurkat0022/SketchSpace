import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import Confetti from "react-confetti";

const CollaborationPanel = ({ onClose, onShare, canvasid, userEmail }) => {
  const [shareEmail, setShareEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!shareEmail.trim()) return;
    console.log(`Sharing canvas ${canvasid} as ${userEmail} with ${shareEmail}`);

    try {
      const result = await onShare(shareEmail);

      if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose(); 
        }, 2000); 
      }
    } catch (err) {
      console.error("Failed to share inside CollaborationPanel:", err);
    }

    setShareEmail("");
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex items-center justify-center z-50">
      {success && <Confetti recycle={false} numberOfPieces={5000} />}

      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        >
          <FaTimes size={20} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-4">Collaboration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Invite others to collaborate by entering their email:
        </p>

        {/* Email input */}
        <input
          type="email"
          value={shareEmail}
          onChange={(e) => setShareEmail(e.target.value)}
          placeholder="Enter email"
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Share button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white mt-3 p-2 rounded hover:bg-blue-700 transition"
        >
          Send Invite
        </button>

        {/* Success message */}
        {success && (
          <p className="mt-3 text-green-600 font-semibold">
            🎉 Invite sent successfully!
          </p>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;
