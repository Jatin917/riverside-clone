// components/ContentTypeSelector.tsx
const types = [
    "Podcasts",
    "Video interviews",
    "Social media clips",
    "Transcriptions",
    "Webinars",
    "Video marketing",
    "AI show notes",
    "Captions",
  ];
  
  export default function ContentTypeSelector() {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map((type) => (
          <button
            key={type}
            className="border border-white rounded-full px-4 py-2 text-sm hover:bg-white hover:text-black transition"
          >
            {type}
          </button>
        ))}
      </div>
    );
  }
  