import { Check, ChevronDown, Copy, Link, Mail, X } from "lucide-react";
import { useState } from "react";

interface InviteModalProps {
  setIsInviteModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  link: string;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  email: string;
  setEmail: (email: string) => void;
}

const InviteModal = ({
  setIsInviteModalOpen,
  isInviteModalOpen,
  link,
  selectedRole,
  setSelectedRole,
  email,
  setEmail,
}: InviteModalProps) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link as string);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSendInvite = () => {
    // Handle email invite logic here
    console.log('Sending invite to:', email, 'as', selectedRole);
    setEmail('');
  };

  const handleCloseModal = () => {
    setIsInviteModalOpen(false);
    setLinkCopied(false);
    setEmail('');
  };
  return (
    // Invite Modal
    isInviteModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#222222] rounded-lg p-4 sm:p-6 w-full max-w-xl mx-2 sm:mx-4 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg sm:text-xl font-semibold">Invite people</h2>
            <button 
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-300 text-sm mb-1">
              Invite people to join you for a recording session.{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">About studio roles</a>
            </p>
          </div>

          {/* Share a link section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-3">
              <Link className="w-5 h-5 text-gray-300" />
              <h3 className="text-white font-medium">Share a link</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">Copy the link below and share with others.</p>
            <div className="flex w-full">
              <div className="flex-1 bg-gray-700 rounded-md px-3 py-2 text-gray-300 text-sm font-mono flex items-center min-w-0 border border-gray-700 mr-2 truncate overflow-hidden" title={link}>
                <span className="whitespace-pre truncate">{link}</span>
              </div>
              <div className="relative mr-2">
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 appearance-none pr-8 border-t border-b border-gray-700 h-full min-h-[40px] rounded-md focus:outline-none focus:ring-0 focus:border-transparent"
                >
                  <option>Guest</option>
                  <option>Host</option>
                  <option>Producer</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              <button 
                onClick={handleCopyLink}
                className="bg-[#7c3aed] text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 border border-[#7c3aed] border-l-0 h-full min-h-[40px] focus:outline-none focus:ring-0 focus:border-transparent"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Or divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-3 text-gray-400 text-sm">Or</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Invite via email section */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Mail className="w-5 h-5 text-gray-300" />
              <h3 className="text-white font-medium">Invite via email</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              An email with instructions on how to join will be sent to all invitees.
            </p>
            <div className="flex w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md placeholder-gray-400 border border-gray-700 min-w-0 h-full min-h-[40px] mr-2 focus:outline-none focus:ring-0 focus:border-transparent"
              />
              <div className="relative mr-2">
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 appearance-none pr-8 border-t border-b border-gray-700 h-full min-h-[40px] rounded-md focus:outline-none focus:ring-0 focus:border-transparent"
                >
                  <option>Guest</option>
                  <option>Host</option>
                  <option>Producer</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              <button 
                onClick={handleSendInvite}
                disabled={!email.trim()}
                className="bg-[#7c3aed]  disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors border border-[#7c3aed] border-l-0 h-full min-h-[40px] focus:outline-none focus:ring-0 focus:border-transparent"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
export default InviteModal;