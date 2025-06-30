// components/Hero.tsx
import React from "react";
import ContentTypeSelector from "./ContentTypeSelector";

const Hero = () => (
  <div className="relative w-full h-screen overflow-hidden">
    {/* Video Background */}
    <video
      className="fixed top-0 left-0 w-full h-full object-cover z-0"
      src="/bg-desktop.mp4"
      autoPlay
      loop
      muted
      playsInline
    />

    {/* Overlay for darkening video (optional) */}
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 z-10"></div>

    {/* Content */}
    <div className="relative z-20 flex flex-col items-start justify-center h-screen px-12">
      <h1 className="text-white text-7xl font-extrabold mb-6 leading-tight">
        Create your<br />best content yet.
      </h1>
      <p className="text-white text-xl mb-8 max-w-2xl">
        Your online studio to record in high quality, edit in a flash, and go live with a bang. Not necessarily in that order.
      </p>
      <div className="flex flex-wrap gap-3 mb-8">
       <ContentTypeSelector />
      </div>
      <button className="bg-[#7c3aed] text-white font-semibold px-8 py-4 rounded-lg text-lg mb-2 hover:bg-[#6d28d9] transition">
        Start for Free
      </button>
      <span className="text-gray-300 text-xs">* No credit card needed. Free plan available.</span>
    </div>
  </div>
);

export default Hero;