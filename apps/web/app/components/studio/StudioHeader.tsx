import React, { useState } from 'react';
import { ChevronLeft, Plus, MessageCircle, Settings, Users, X, Link, Mail, ChevronDown, Copy, Check } from 'lucide-react';
import InviteModal from './InviteModal';

interface StudioHeaderProps {
  link: string | null;
  onInvite?: () => void;
}

const StudioHeader = ({ link, onInvite }: StudioHeaderProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Guest');
  const [email, setEmail] = useState('');


  return (
    <>
      <header className="bg-[#0d0d0d] border-none border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="text-[#232323] hover:bg-[#3d3d3d] hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs">R</span>
            </div>
            <span className="text-white font-medium">RIVERSIDE</span>
          </div>
          
          <div className="text-gray-400 text-sm">
            <span className="text-gray-300">Jatin Chandel's Studio</span>
            <span className="mx-2">|</span>
            <span className="text-white font-medium">Untitled Recording</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-[#232323] hover:bg-[#3d3d3d] cursor-pointer text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Live stream</span>
          </button>
          
          <button className="text-gray-400 cursor-pointer hover:text-white p-2 rounded-md bg-[#232323] hover:bg-[#3d3d3d] transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
          
          <button className="text-gray-400 cursor-pointer hover:text-white p-2 rounded-md bg-[#232323] hover:bg-[#3d3d3d] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onInvite ? onInvite : () => setIsInviteModalOpen(true)}
            className="bg-[#232323] hover:bg-[#3d3d3d] cursor-pointer text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Invite</span>
          </button>
        </div>
      </header>
      {!onInvite && (
        <InviteModal setIsInviteModalOpen={setIsInviteModalOpen} isInviteModalOpen={isInviteModalOpen} link={link as string} selectedRole={selectedRole} setSelectedRole={setSelectedRole} email={email} setEmail={setEmail} />
      )}
    </>
  );
};

export default StudioHeader;