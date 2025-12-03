import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Plus } from "lucide-react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend.mukhtaser.sa';

export default function AdsManagementPage() {
  const [ads, setAds] = useState([]);
  const [page, setPage] = useState(1);
  const [take] = useState(10);
  const [filters, setFilters] = useState({ lang: "", audience: "", active: "" });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [formData, setFormData] = useState({
    image: null,
    redirectUrl: "",
    lng: "ar",
    isActive: false,
    targetAudience: "all",
  });
  const [preview, setPreview] = useState(null);
  const [detailAd, setDetailAd] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const renderPortal = (node) => {
    try {
      if (typeof document !== "undefined" && document.body) {
        return ReactDOM.createPortal(node, document.body);
      }
    } catch (e) {
      // fallthrough to return node inline
    }
    return node;
  };

  const API_URL = `${BACKEND_URL}/api/v1/ads`;

  const fetchAds = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: String(page),
        take: String(take),
      };
      
      if (filters.lang) queryParams.lng = filters.lang;
      if (filters.audience) queryParams.targetAudience = filters.audience.toUpperCase();
      if (filters.active) queryParams.isActive = filters.active;
      
      const query = new URLSearchParams(queryParams).toString();
      const res = await fetch(`${API_URL}?${query}`);
      const data = await res.json();
      setAds(data.data.ads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [page, filters]);

  const openAddModal = () => {
    setEditingAd(null);
    setFormData({
      image: null,
      redirectUrl: "",
      lng: "ar",
      isActive: false,
      targetAudience: "ALL",
    });
    setPreview(null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) fd.append(key, value);
    });
    try {
      const method = editingAd ? "PUT" : "POST";
      const url = editingAd ? `${API_URL}/${editingAd.id}` : API_URL;
      await fetch(url, {
        method,
        body: fd,
      });
      setShowModal(false);
      fetchAds();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (ts) => {
    try {
      if (!ts) return "-";
      const d = new Date(ts);
      return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
    } catch (e) {
      return String(ts);
    }
  };

  // close modals on Escape
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDetailAd(null);
        setShowModal(false);
      }
    };
    if (detailAd || showModal) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailAd, showModal]);

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50"
      style={{ marginRight: "260px", paddingTop: "40px", width: "calc(100% - 260px)" }}
    >
      <div className="p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Ads Management</h2>
          <button
            onClick={openAddModal}
            className="flex items-center !bg-blue-600 !text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Ad
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={filters.lang}
            onChange={(e) => setFilters({ ...filters, lang: e.target.value })}
            className="border p-2 rounded-lg"
          >
            <option value="">All Languages</option>
            <option value="ar">Arabic</option>
            <option value="en">English</option>
            <option value="ur">Urdu</option>
          </select>
          <select
            value={filters.audience}
            onChange={(e) => setFilters({ ...filters, audience: e.target.value })}
            className="border p-2 rounded-lg"
          >
            <option value="">All Audiences</option>
            <option value="all">All</option>
            <option value="individuals">Individuals</option>
            <option value="companies">Companies</option>
            <option value="paid_companies">Paid Companies</option>
          </select>
          <select
            value={filters.active}
            onChange={(e) => setFilters({ ...filters, active: e.target.value })}
            className="border p-2 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "80px" }}>Image</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "200px" }}>Redirect URL</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "100px" }}>Language</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "80px" }}>Active</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "120px" }}>Audience</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "160px" }}>Updated At</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "160px" }}>Created At</th>
                <th className="py-2 px-4 border whitespace-nowrap" style={{ minWidth: "140px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : ads.length > 0 ? (
                ads.map((ad) => (
                  <tr key={ad.id} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <img
                        src={ad.imageUrl}
                        alt="ad"
                        className="h-12 w-12 object-cover rounded mx-auto"
                      />
                    </td>
                    <td className="py-2 px-4 truncate max-w-xs">{ad.redirectUrl}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">{ad.lng}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      {ad.isActive ? (
                        <span className="text-green-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-red-500 font-semibold">No</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">{ad.targetAudience}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">{formatDate(ad.updatedAt)}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">{formatDate(ad.createdAt)}</td>
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2" style={{ overflow: "visible" }}>
                        <button
                          onClick={() => setDetailAd(ad)}
                          title="Show details"
                          style={{
                            display: "inline-block",
                            backgroundColor: "#2563eb",
                            color: "#fff",
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: "0.875rem",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            position: "relative",
                            zIndex: 9999,
                          }}
                        >
                          Show
                        </button>
                        <button
                          onClick={() => {
                            setEditingAd(ad);
                            setFormData({
                              image: null,
                              redirectUrl: ad.redirectUrl,
                              lng: ad.lng,
                              isActive: ad.isActive,
                              targetAudience: ad.targetAudience,
                            });
                            setPreview(ad.imageUrl);
                            setShowModal(true);
                          }}
                          title="Edit ad"
                          style={{
                            display: "inline-block",
                            backgroundColor: "#d97706",
                            color: "#fff",
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: "0.875rem",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            position: "relative",
                            zIndex: 9999,
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    No ads found
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded-l-lg bg-gray-100 hover:bg-gray-200"
          >
            Prev
          </button>
          <span className="px-4 py-2 border-t border-b">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-r-lg bg-gray-100 hover:bg-gray-200"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && renderPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ left: 0, right: 0, top: 0, bottom: 0, zIndex: 2147483647 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col relative"
            style={{ height: 'min(600px, 80vh)', zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
              <h3 className="text-xl font-bold">
                {editingAd ? "Edit Ad" : "Add New Ad"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - Split Layout */}
            <div className="flex-1 flex">
              {/* Left side - Fixed Image */}
              <div className="w-64 border-r bg-gray-50 flex flex-col">
                <div className="p-5 space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <label className="block font-semibold text-sm mb-2">Upload Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="w-full border p-2 rounded-lg bg-white text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-center pt-2">
                    {preview ? (
                      <div className="bg-white rounded-lg p-3 shadow-sm border" style={{ width: '200px', height: '140px' }}>
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300" style={{ width: '200px', height: '140px' }}>
                        <span className="text-gray-400 text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Scrollable Form */}
              <div className="flex-1 overflow-y-auto p-6" style={{ marginBottom: "60px" }}>
                <form id="adForm" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block font-semibold mb-2">Redirect URL</label>
                    <input
                      type="text"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      className="border p-4 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      className="border p-4 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
                    >
                      <option value="ar">Arabic</option>
                      <option value="en">English</option>
                      <option value="ur">Urdu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Target Audience</label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="border p-4 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
                    >
                      <option value="ALL">All</option>
                      <option value="INIVIDUALS">Individuals</option>
                      <option value="COMPANIES">Companies</option>
                      <option value="PAID_COMPANIES">Paid Companies</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="font-semibold">Active</label>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 !bg-blue sticky bottom-0 left-0 right-0">
              <button
                type="submit"
                form="adForm"
                className="w-full !bg-blue-600 !text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
                style={{ zIndex: 100 }}
              >
                {editingAd ? "Save Changes" : "Add Ad"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail (Show) Modal */}
  {detailAd && renderPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-auto"
          onClick={() => setDetailAd(null)}
          style={{ left: 0, right: 0, top: 0, bottom: 0, zIndex: 2147483647 }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-4 w-full max-w-4xl relative mx-auto"
            style={{ maxHeight: "90vh", overflow: "auto", margin: '0 16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg md:text-2xl font-bold">Ad Details</h3>
                <span className="text-sm text-gray-500">(ID: {detailAd.id})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(detailAd.redirectUrl || "");
                    } catch (e) {
                      // ignore
                    }
                  }}
                  title="Copy redirect URL"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 text-sm"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => window.open(detailAd.imageUrl || "", "_blank")}
                  title="Open image in new tab"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 text-sm"
                >
                  Open Image
                </button>
                <button
                  onClick={() => setDetailAd(null)}
                  title="Close"
                  aria-label="Close details modal"
                  className="inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-full">
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
                    <a href={detailAd.imageUrl} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={detailAd.imageUrl}
                        alt={`Ad ${detailAd.id}`}
                        className="w-80 max-w-full max-h-64 object-contain rounded-md mx-auto"
                      />
                    </a>
                  </div>
                  {detailAd.imageUrl && (
                    <p className="mt-2 text-xs text-gray-500 text-center break-all">{detailAd.imageUrl}</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Redirect URL</label>
                    <div className="mt-1 text-sm break-words text-gray-800 bg-white p-2 border rounded">{detailAd.redirectUrl || "-"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Language</label>
                      <div className="mt-1 text-sm text-gray-800">{detailAd.lng || "-"}</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Active</label>
                      <div className="mt-1 text-sm text-gray-800">{detailAd.isActive ? "Yes" : "No"}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Audience</label>
                    <div className="mt-1 text-sm text-gray-800">{detailAd.targetAudience || "-"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Created At</label>
                      <div className="mt-1 text-sm text-gray-800">{formatDate(detailAd.createdAt)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Updated At</label>
                      <div className="mt-1 text-sm text-gray-800">{formatDate(detailAd.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
