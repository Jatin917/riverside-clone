

// components/ProductDropdown.tsx
export default function ProductDropdown() {
    return (
      <div className="absolute top-10 left-0 bg-white text-black p-6 shadow-lg rounded-lg w-[1000px] flex gap-10 transition-transform transform scale-95 hover:scale-100 duration-200">
        <div className="w-1/3">
          <h4 className="font-bold mb-2">Products</h4>
          {[
            ["Recording", "4K video and audio recorder."],
            ["Editing", "AI, text-based video editor."],
            ["Live Streaming", "For livestreams in full HD."],
            ["Webinars", "Host, record, and repurpose."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="py-2 group transition duration-200"
            >
              <div className="flex items-center gap-2">
                <span className="text-purple-500">⬆</span>
                <div className="group-hover:translate-y-1 transition-transform duration-200">
                  <strong>{title}</strong>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-6">{desc}</p>
            </div>
          ))}
        </div>
        <div className="w-1/3">
          <h4 className="font-bold mb-2">Features</h4>
          {["Transcribing", "Magic Clips", "Captions", "Magic Audio", "AI Show Notes", "Async Recording"].map(
            (feature) => (
              <div key={feature} className="py-1 group">
                <span className="text-purple-500">⬆</span>
                <span className="group-hover:translate-y-1 inline-block ml-1 transition-transform duration-200">
                  {feature}
                </span>
              </div>
            )
          )}
        </div>
        <div className="w-1/3">
          <h4 className="font-bold mb-2">Apps</h4>
          {["Mac App", "Mobile Apps"].map((app) => (
            <div key={app} className="py-1 group">
              <span className="text-purple-500">⬆</span>
              <span className="group-hover:translate-y-1 inline-block ml-1 transition-transform duration-200">
                {app}
              </span>
            </div>
          ))}
          <div className="mt-4">
            <img
              src="/sample-product.png"
              alt="product"
              className="rounded-xl shadow-md"
            />
          </div>
        </div>
      </div>
    );
  }