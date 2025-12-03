import { useEffect, useState } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend.mukhtaser.sa';

const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};


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
      const data = await apiCall(`${BACKEND_URL}/api/v1/assets`, { headers: { lng: language } });


      if (data?.data.image) {
        setPreview(data?.data.image.content);
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

    try {
      setUploading(true);
      const data = await fetch(`${BACKEND_URL}/api/v1/assets`, {
        method: "POST",
        body: formData,
        headers: {
          lng: lang
        }
      });

      if (data.data) setPreview(data.data.image.content);

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
      style={{marginLeft:"20px",marginRight:"25px", paddingRight: "260px", paddingTop: "40px" }}
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
          </div>
          {/* Submit Button — moved above preview */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className={`w-full py-3 px-6 rounded-lg font-semibold border transition text-center ${uploading
                ? "bg-gray-300 border-gray-400 !text-gray-700 cursor-not-allowed"
                : "bg-blue-600 border-blue-700 !text-white hover:bg-blue-700 hover:border-blue-800"
                }`}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {/* Image Preview */}
          <div className="mt-4">
            {loadingPreview ? (
              <p className="text-gray-500 text-center">Loading image...</p>
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                className="rounded-lg shadow-md max-h-64 object-contain mx-auto border border-gray-200"
              />
            ) : (
              <p className="text-gray-400 text-center">
                No image uploaded for this language
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );


}
