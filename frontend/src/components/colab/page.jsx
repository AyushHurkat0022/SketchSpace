
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaCopy, FaTimes } from "react-icons/fa";

const CollaborationPanel = ({ onClose, onJoinMeeting }) => {
  const [meetingId] = useState(uuidv4());
  const [inputMeetingId, setInputMeetingId] = useState("");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingId);
    alert("Meeting ID copied!");
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
        <h2 className="text-xl font-bold mb-4">Collaboration Meeting</h2>
        <p className="text-sm text-gray-600">Share this Meeting ID to invite others:</p>
        <div className="flex items-center justify-between bg-gray-200 p-2 rounded mt-2">
          <span className="truncate text-gray-800">{meetingId}</span>
          <button onClick={copyToClipboard} className="ml-2 text-blue-500">
            <FaCopy />
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-600">Or join an existing meeting:</p>
        <input
          type="text"
          placeholder="Enter Meeting ID"
          value={inputMeetingId}
          onChange={(e) => setInputMeetingId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-2"
        />
        <button
          onClick={() => onJoinMeeting(inputMeetingId || meetingId)}
          className="bg-blue-600 text-white w-full mt-3 p-2 rounded"
        >
          Join Meeting
        </button>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600">
          <FaTimes size={20} />
        </button>
      </div>
    </div>
  );
};

export default CollaborationPanel;


