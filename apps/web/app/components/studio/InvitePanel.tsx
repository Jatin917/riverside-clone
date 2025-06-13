"use client"
import { Copy, Mail } from "lucide-react";
import { useState } from "react";
// Invite Panel Component
const InvitePanel = ({ link, isOpen, onClose }: { isOpen: boolean; onClose: () => void, link:URL }) => {
  const [inviteLink] = useState<URL>(link)
  
  const copyLink = () => {
    navigator.clipboard.writeText(String(inviteLink))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Invite people</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Share this link to invite people to your studio.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={String(inviteLink)}
              readOnly
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
            />
            <select className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600">
              <option>Guest</option>
              <option>Producer</option>
            </select>
            <button
              onClick={copyLink}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy link</span>
            </button>
          </div>
          
          <div className="text-center text-gray-400">or</div>
          
          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Invite by email</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvitePanel