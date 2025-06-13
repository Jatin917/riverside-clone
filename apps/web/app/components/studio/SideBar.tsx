import { Users, MessageCircle, Settings, FileText, Music, Grid3X3 } from "lucide-react"

// Sidebar Component
const Sidebar = () => {
  return (
    <aside className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
      {/* Recording Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Recording info</h3>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Participants */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">J</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">Jatin Chandel</span>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Host</span>
                <span className="text-gray-400">720p</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Echo cancellation</span>
              <div className="w-6 h-3 bg-purple-600 rounded-full relative">
                <div className="w-3 h-3 bg-white rounded-full absolute right-0 top-0"></div>
              </div>
            </div>
            <button className="text-purple-400 hover:text-purple-300 text-sm">Hide</button>
          </div>
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <button className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
          <Settings className="w-4 h-4" />
          <span>Brand</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
          <FileText className="w-4 h-4" />
          <span>Text</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
          <Music className="w-4 h-4" />
          <span>Media</span>
        </button>
        <button className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white">
          <Grid3X3 className="w-4 h-4" />
          <span>Layout</span>
        </button>
      </div>
    </aside>
  )
}
export default Sidebar