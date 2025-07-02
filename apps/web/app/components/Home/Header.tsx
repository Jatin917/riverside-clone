// components/Header.tsx
'use client';

import { useState } from "react";
import ProductDropdown from "./ProductDropdown";
import { signIn } from "next-auth/react";

const Header = () => (
  <header className="fixed top-0 left-0 w-full z-30 flex items-center justify-between px-8 py-4 bg-transparent">
    {/* Left: Logo and nav */}
    <div className="flex items-center gap-8">
      <div className="font-bold text-lg flex items-center text-white">
        {/* <img src="/logo.svg" alt="Riverside Logo" className="h-8 mr-2" /> */}
        RIVERSIDE
      </div>
      <nav className="flex items-center gap-6 text-white">
        <a href="#">Product</a>
        <a href="#">Solutions</a>
        <a href="#">Resources</a>
        <a href="#">For Business</a>
        <a href="#">Pricing</a>
      </nav>
    </div>
    {/* Right: Actions */}
    <div className="flex items-center gap-4">
      <a href="#" className="text-white">Contact Sales</a>
      <a onClick={()=>signIn()} className="text-white cursor-pointer">Login</a>
      <button className="px-4 py-2 border border-white rounded text-white font-semibold hover:bg-white hover:text-black transition">
        Start for Free
      </button>
    </div>
  </header>
);

export default Header;