import { useEffect, useState } from "react";

export default function HomeImageUploader() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lang, setLang] = useState("ar"); // default lang
  const [uploading, setUploading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch image URL for current lang
  const fetchCurrentImage = async (language) => {
    try {
      setLoadingPreview(true);
      const res = await fetch(`/api/homepage/image?lang=${language}`);
      if (!res.ok) {
        setPreview(null);
        return;
      }

      const data = await res.json();
      // Expecting response: { url: "https://..." }
      if (data?.url) {
        setPreview(data.url);
      } else {
        setPreview(null);
      }
    } catch (err) {
      console.error("Failed to fetch current image:", err);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchCurrentImage(lang);
  }, [lang]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file)); // local preview before upload
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please select an image");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("lang", lang);

    try {
      setUploading(true);
      const res = await fetch("/api/homepage/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      // Assuming API returns new image link in { url: "https://..." }
      if (data.url) setPreview(data.url);

      alert("Uploaded successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="flex justify-center items-start min-h-screen bg-gray-50"
      style={{ paddingLeft: "260px", paddingTop: "40px" }}
    >
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Upload Homepage Image
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language Selector */}
          <div>
            <label className="block mb-2 font-semibold">Select Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="border rounded-lg p-2 w-full focus:outline-none focus:ring focus:ring-blue-300"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block mb-2 font-semibold">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="border rounded-lg p-2 w-full focus:outline-none focus:ring focus:ring-blue-300"
            />

            {loadingPreview ? (
              <p className="text-gray-500 mt-4 text-center">Loading image...</p>
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mt-4 rounded-lg shadow-md max-h-64 object-contain mx-auto"
              />
            ) : (
              <p className="text-gray-400 mt-4 text-center">
                No image uploaded for this language
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg w-full hover:bg-blue-700 transition"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
}
