import React, { useEffect, useState } from "react";

/**
 * Ads Management Page for Kottster
 * - Uses endpoints under http://localhost:3000/api/v1/ads
 * - Pagination with `take` and `page` query params
 * - Endpoints used:
 *    GET    /api/v1/ads                -> list (query: take, page, language, target_audience, is_active)
 *    GET    /api/v1/ads/:id            -> single
 *    POST   /api/v1/ads                -> create (FormData: image, redirect_url, language, is_active, target_audience)
 *    PUT    /api/v1/ads/:id            -> update (FormData allowed)
 *
 * Notes:
 * - Backend expected to return JSON for list: { data: Ad[], total: number }
 * - For single/create/update, expected object with the ad or { url } for image. Code is defensive.
 */


const API_BASE = "http://localhost:3000/api/v1/ads";

export default function AdsManagementPage() {
  // table state
  const [ads, setAds] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [loading, setLoading] = useState(false);

  // filters
  const [filterLang, setFilterLang] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeAd, setActiveAd] = useState(null);

  // form state (used for add/edit)
  const emptyForm = {
    imageFile: null ,
    imagePreview: null ,
    redirect_url: "",
    language: "ar",
    is_active: false,
    target_audience: "all" ,
  };

  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  // fetch list
  const fetchAds = async (pageParam = page, takeParam = take) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pageParam);
      params.set("take", takeParam);
      if (filterLang) params.set("language", filterLang);
      if (filterTarget) params.set("target_audience", filterTarget);
      if (filterActive) params.set("is_active", filterActive);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ads");
      const json = await res.json();
      // expect { data, total }
      setAds(json.data || []);
      setTotal(typeof json.total === "number" ? json.total : (json.data || []).length);
    } catch (err) {
      console.error(err);
      setAds([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds(1, take);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLang, filterTarget, filterActive, take]);

  useEffect(() => {
    fetchAds(page, take);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // helpers
  const openAdd = () => {
    setForm({ ...emptyForm });
    setShowAddModal(true);
  };

  const openEdit = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch ad");
      const json = await res.json();
      const ad = json.data || json;
      setActiveAd(ad);
      setForm({
        ...emptyForm,
        imageFile: null,
        imagePreview: ad.image_url || null,
        redirect_url: ad.redirect_url || "",
        language: ad.language,
        is_active: !!ad.is_active,
        target_audience: ad.target_audience,
      });
      setShowEditModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load ad");
    }
  };

  const openView = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch ad");
      const json = await res.json();
      const ad = json.data || json;
      setActiveAd(ad);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load ad");
    }
  };

  // form handlers
  const onFileChange = (f) => {
    if (!f) return setForm((s) => ({ ...s, imageFile: null, imagePreview: null }));
    const url = URL.createObjectURL(f);
    setForm((s) => ({ ...s, imageFile: f, imagePreview: url }));
  };

  const handleCreateOrUpdate = async (isUpdate = false) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.imageFile) fd.append("image", form.imageFile);
      fd.append("redirect_url", form.redirect_url || "");
      fd.append("language", form.language);
      fd.append("is_active", `${form.is_active}`);
      fd.append("target_audience", form.target_audience);

      const url = isUpdate && activeAd ? `${API_BASE}/${activeAd.id}` : API_BASE;
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save ad");

      // refresh list and close modal
      await fetchAds(1, take);
      setPage(1);
      setShowAddModal(false);
      setShowEditModal(false);
      alert("Saved successfully");
    } catch (err) {
      console.error(err);
      alert(err.message || "Save error");
    } finally {
      setSubmitting(false);
    }
  };

  // pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ paddingLeft: "260px", paddingTop: "24px", paddingBottom: "40px" }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Ads Management</h1>

          <div className="flex items-center gap-3">
            {/* Filters */}
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="border rounded p-2"
            >
              <option value="">All languages</option>
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>

            <select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value)}
              className="border rounded p-2"
            >
              <option value="">All audiences</option>
              <option value="individuals">Individuals</option>
              <option value="companies">Companies</option>
              <option value="paid_companies">Paid companies</option>
              <option value="all">All users</option>
            </select>

            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="border rounded p-2"
            >
              <option value="">Any</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              onClick={() => {
                setFilterLang("");
                setFilterTarget("");
                setFilterActive("");
              }}
              className="px-3 py-2 border rounded"
            >
              Reset
            </button>

            <button
              onClick={openAdd}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Add Ad
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Image</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Redirect URL</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Language</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Active</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Target Audience</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Updated</th>
                <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                    No ads found
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-4 py-3 text-sm">{ad.id}</td>
                    <td className="px-4 py-3 text-sm">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={`ad-${ad.id}`}
                          className="w-28 h-16 object-cover rounded border"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs break-words">{ad.redirect_url || "-"}</td>
                    <td className="px-4 py-3 text-sm">{ad.language}</td>
                    <td className="px-4 py-3 text-sm">{ad.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-sm">{ad.target_audience}</td>
                    <td className="px-4 py-3 text-sm">{ad.created_at ? new Date(ad.created_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 text-sm">{ad.updated_at ? new Date(ad.updated_at).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openView(ad.id)}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEdit(ad.id)}
                          className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * take + 1} - {Math.min(page * take, total)} of {total}
            </div>

            <div className="flex items-center gap-2">
              <select value={take} onChange={(e) => setTake(Number(e.target.value))} className="border rounded p-1">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-2 py-1 rounded text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : 'border'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- View Modal --- */}
      {showViewModal && activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ad Details</h3>
            <div className="mb-4">
              {activeAd.image_url ? (
                <img src={activeAd.image_url} alt="preview" className="w-full h-48 object-contain rounded border" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded">No image</div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div><strong>Redirect:</strong> {activeAd.redirect_url || '-'}</div>
              <div><strong>Language:</strong> {activeAd.language}</div>
              <div><strong>Active:</strong> {activeAd.is_active ? 'Yes' : 'No'}</div>
              <div><strong>Target:</strong> {activeAd.target_audience}</div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowViewModal(false)} className="px-3 py-1 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Add Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Ad</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
                />
                {form.imagePreview && (
                  <img src={form.imagePreview} className="mt-3 w-full h-40 object-contain rounded border" alt="preview" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Redirect URL</label>
                <input
                  value={form.redirect_url}
                  onChange={(e) => setForm((s) => ({ ...s, redirect_url: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select value={form.language} onChange={(e) => setForm((s) => ({ ...s, language: e.target.value  }))} className="w-full border rounded p-2">
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Target Audience</label>
                  <select value={form.target_audience} onChange={(e) => setForm((s) => ({ ...s, target_audience: e.target.value  }))} className="w-full border rounded p-2">
                    <option value="individuals">Individuals</option>
                    <option value="companies">Companies</option>
                    <option value="paid_companies">Paid companies</option>
                    <option value="all">All users</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))} />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowAddModal(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={() => handleCreateOrUpdate(false)} disabled={submitting} className={`px-4 py-2 rounded ${submitting ? 'bg-gray-300 border-gray-400' : 'bg-blue-600 text-white'}`}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {showEditModal && activeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Ad #{activeAd.id}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
                />
                {form.imagePreview && (
                  <img src={form.imagePreview} className="mt-3 w-full h-40 object-contain rounded border" alt="preview" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Redirect URL</label>
                <input
                  value={form.redirect_url}
                  onChange={(e) => setForm((s) => ({ ...s, redirect_url: e.target.value }))}
                  className="w-full border rounded p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Language</label>
                  <select value={form.language} onChange={(e) => setForm((s) => ({ ...s, language: e.target.value  }))} className="w-full border rounded p-2">
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                    <option value="ur">Urdu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Target Audience</label>
                  <select value={form.target_audience} onChange={(e) => setForm((s) => ({ ...s, target_audience: e.target.value  }))} className="w-full border rounded p-2">
                    <option value="individuals">Individuals</option>
                    <option value="companies">Companies</option>
                    <option value="paid_companies">Paid companies</option>
                    <option value="all">All users</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))} />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowEditModal(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={() => handleCreateOrUpdate(true)} disabled={submitting} className={`px-4 py-2 rounded ${submitting ? 'bg-gray-300 border-gray-400' : 'bg-blue-600 text-white'}`}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
