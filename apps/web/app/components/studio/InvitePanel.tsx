"use client"
import { Copy, Mail, X } from "lucide-react";
import { useState } from "react";
// Invite Panel Component
const InvitePanel = ({ 
  onClose, 
  studioLink,
  hostName = "Jatin Chandel",
  isRecording = false
}: {
  onClose: () => void;
  studioLink: string | null;
  hostName?: string;
  isRecording?: boolean;
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  if(!studioLink) return;
  const handleCopyLink = () => {
    if(!studioLink) return;
    navigator.clipboard.writeText(studioLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-white text-2xl font-semibold mb-2">Invite people</h2>
          <p className="text-gray-400 text-sm">Share this link to invite people to your studio.</p>
        </div>

        {/* Invite Link Section */}
        <div className="mb-6">
          <div className="flex items-center bg-gray-700 rounded-lg p-3 mb-3">
            <input
              type="text"
              value={studioLink}
              readOnly
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
            <select className="bg-gray-600 text-white text-sm rounded px-2 py-1 ml-2 outline-none">
              <option>Guest</option>
              <option>Host</option>
            </select>
          </div>
          
          <button
            onClick={handleCopyLink}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              linkCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {linkCopied ? 'Link Copied!' : 'Copy link'}
          </button>
        </div>

        {/* Divider */}
        <div className="text-center text-gray-500 text-sm mb-6">or</div>

        {/* Email Invite */}
        <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
          Invite by email
        </button>
      </div>
    </div>
  );
};

export default InvitePanel