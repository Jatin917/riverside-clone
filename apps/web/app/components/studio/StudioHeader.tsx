"use client"
// Header Component

import { MessageCircle, Settings, Users } from 'lucide-react'

const StudioHeader = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-white font-medium">RIVERSIDE</span>
        </div>
        <div className="text-gray-400 text-sm">
          Jatin Chandel's Studio | Untitled Recording
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span>Live stream</span>
        </button>
        <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Users className="w-5 h-5" />
        </button>
        <span className="text-white bg-purple-600 px-3 py-1 rounded-lg">Invite</span>
      </div>
    </header>
  )
}

export default StudioHeader