
import React, { useState, useEffect } from 'react';
import './styles.css'; // We'll create this for basic styling
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000' //|| 'https://backend.mukhtaser.sa';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend.mukhtaser.sa';


const formatDate = (ts) => {
  try {
    if (!ts) return "-";
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString();
  } catch (e) {
    return String(ts);
  }
};

const ApprovalRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    take: 10,
    total: 0
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    note: ''
  });
  // Edit Org modal state
  const [editOrgModalVisible, setEditOrgModalVisible] = useState(false);
  const [editOrgData, setEditOrgData] = useState(null);
  const [editOrgLoading, setEditOrgLoading] = useState(false);
  const [editOrgError, setEditOrgError] = useState(null);

  // API call function
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

  // Fetch approval requests
  const fetchApprovalRequests = async (page = 1, take = 10) => {
    setLoading(true);
    try {
      const data = await apiCall(`${BACKEND_URL}/api/v1/approve-requests?page=${page}&take=${take}`);
      console.log(data)
      setRequests(data.data.requests);
      setPagination({
        page: data.data.page ?? 1,
        take: data.data.take ?? 10,
        total: data.data.numOfRequests
      });
    } catch (error) {
      alert('Error fetching approval requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch organization details (for both view and edit)
  const fetchOrganizationDetails = async (organizationId, forEdit = false) => {
    try {
      const data = await apiCall(`${BACKEND_URL}/api/v1/orgs/${organizationId}`);
      if (forEdit) {
        setEditOrgData(data.data.organization);
        setEditOrgModalVisible(true);
        setEditOrgError(null);
      } else {
        setSelectedOrg(data.data.organization);
        setOrgModalVisible(true);
      }
    } catch (error) {
      if (forEdit) {
        setEditOrgError('Error fetching organization details');
      } else {
        alert('Error fetching organization details');
      }
    }
  };

  // Update approval request status
  const updateApprovalRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const data = await apiCall(`${BACKEND_URL}/api/v1/approve-requests/${selectedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: formData.status,
          note: formData.note
        })
      });

      alert('Request updated successfully');
      setActionModalVisible(false);
      setFormData({ status: '', note: '' });
      fetchApprovalRequests(pagination.page, pagagination.take);

    } catch (error) {
      alert('Error updating request');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Edit Org form input changes
  const handleEditOrgInputChange = (e) => {
    const { name, value } = e.target;
    setEditOrgData(prev => {
      // Nested fields: address, taxAccount, organizationSupport
      if (name.startsWith('address.')) {
        const key = name.replace('address.', '');
        return {
          ...prev,
          address: {
            ...prev.address,
            [key]: value
          }
        };
      } else if (name.startsWith('taxAccount.')) {
        const key = name.replace('taxAccount.', '');
        return {
          ...prev,
          taxAccount: {
            ...prev.taxAccount,
            [key]: value
          }
        };
      } else if (name.startsWith('organizationSupport.')) {
        const key = name.replace('organizationSupport.', '');
        return {
          ...prev,
          organizationSupport: {
            ...prev.organizationSupport,
            [key]: value
          }
        };
      } else {
        return {
          ...prev,
          [name]: value
        };
      }
    });
  };

  // Handle Edit Org button click
  const handleEditOrgClick = (organizationId) => {
    setEditOrgLoading(true);
    fetchOrganizationDetails(organizationId, true).finally(() => setEditOrgLoading(false));
  };

  // Handle Edit Org form submit
  const handleEditOrgSubmit = async (e) => {
    e.preventDefault();
    if (!editOrgData) return;
    setEditOrgLoading(true);
    setEditOrgError(null);
    try {
      // Compose payload
      const payload = {
        name: editOrgData.name,
        email: editOrgData.email,
        phoneNumber: editOrgData.phoneNumber,
        unifiedNationalNumber: editOrgData.unifiedNationalNumber,
        address: {
          address: editOrgData.address?.address,
          city: editOrgData.address?.city,
          district: editOrgData.address?.district,
          street: editOrgData.address?.street,
          postalCode: editOrgData.address?.postalCode,
          subNumber: editOrgData.address?.subNumber,
          secondaryNumber: editOrgData.address?.secondaryNumber,
        },
        taxAccount: {
          taxNumber: editOrgData.taxAccount?.taxNumber,
          expiresAt: editOrgData.taxAccount?.expiresAt,
        },
        organizationSupport: {
          fullName: editOrgData.organizationSupport?.fullName,
          phoneNumber: editOrgData.organizationSupport?.phoneNumber,
          title: editOrgData.organizationSupport?.title,
        }
      };
      await apiCall(`${BACKEND_URL}/api/v1/orgs/${editOrgData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      alert('Organization updated successfully');
      setEditOrgModalVisible(false);
      setEditOrgData(null);
      // Optionally refresh table/org modal if needed
    } catch (error) {
      setEditOrgError('Error updating organization');
    } finally {
      setEditOrgLoading(false);
    }
    <div className="info-section">
      <h3>Organization Support</h3>
      <div className="info-grid">
        <div className="info-item">
          <label>Full Name:</label>
          <input name="organizationSupport.fullName" value={editOrgData.organizationSupport?.fullName || ''} onChange={handleEditOrgInputChange} />
        </div>
        <div className="info-item">
          <label>Phone Number:</label>
          <input name="organizationSupport.phoneNumber" value={editOrgData.organizationSupport?.phoneNumber || ''} onChange={handleEditOrgInputChange} />
        </div>
        <div className="info-item">
          <label>Title:</label>
          <input name="organizationSupport.title" value={editOrgData.organizationSupport?.title || ''} onChange={handleEditOrgInputChange} />
        </div>
      </div>
    </div>
  };

  // Handle action button click
  const handleActionClick = (request) => {
    setSelectedRequest(request);
    setFormData({
      status: request.status,
      note: request.note || ''
    });
    setActionModalVisible(true);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchApprovalRequests(newPage, pagination.take);
  };

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'ACCEPTED': return '#52c41a';
        case 'REJECTED': return '#ff4d4f';
        case 'PENDING': return '#faad14';
        default: return '#d9d9d9';
      }
    };

    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: getStatusColor(),
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="approval-requests-container">
      <div className="page-header">
        <h1>Organization Approval Requests</h1>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organization Name</th>
                  <th>Email</th>
                  <th>LeaderApprove</th>
                  <th>LeaderNote</th>
                  <th>DataEntryApprove</th>
                  <th>DataEntryNote</th>
                  <th>Actions</th>
                </tr>
              </thead>
              {
                !requests.length ?
                  (<p className="no-data">No approval requests found</p>)
                  :
                  < tbody >
                    {requests.map(request => (
                      <tr key={request.id}>
                        <td>{request.id}</td>
                        <td>{request.organization?.name}</td>
                        <td>{request.organization?.email}</td>

                        <td className="note-cell">
                          <span>
                            {request.leaderApproved === true ? (
                              <span className="text-green-600 font-semibold">
                                مقبول
                              </span>
                            ) : request.leaderApproved === false ? (
                              <span className="text-red-500 font-semibold">
                                مرفوض
                              </span>
                            ) : (
                              '--'
                            )}
                          </span>
                        </td>
                        <td className="note-cell">
                          {request.leaderReview || '-'}
                        </td>
                        <td className="note-cell">
                          <span>
                            {request.dataEntryApproved === true ? (
                              <span className="text-green-600 font-semibold">
                                مقبول{' '}
                              </span>
                            ) : request.dataEntryApproved === false ? (
                              <span className="text-red-500 font-semibold">
                                مرفوض{' '}
                              </span>
                            ) : (
                              '--'
                            )}
                          </span>
                        </td>
                        <td className="note-cell">
                          {request.dataEntryReview || '-'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-view"
                              onClick={() => fetchOrganizationDetails(request.organizationId)}
                            >
                              View Org
                            </button>
                            <button
                              className="btn btn-action"
                              onClick={() => handleActionClick(request)}
                            >
                              Take Action
                            </button>
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEditOrgClick(request.organizationId)}
                            >
                              Edit Org
                            </button>
                          </div>

                        </td>
                      </tr>
                    ))
                    }
                  </tbody>
              }
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="btn-pagination"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>

              <span className="page-info">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.take)}
              </span>

              <button
                className="btn-pagination"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.take)}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Organization Details Modal */}
      {
        orgModalVisible && selectedOrg && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Organization Details</h2>
                <button
                  className="btn-close"
                  onClick={() => setOrgModalVisible(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="info-section">
                  <h3>Basic Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Name:</label>
                      <span>{selectedOrg.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{selectedOrg.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone:</label>
                      <span>{selectedOrg.phoneNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>Unified National Number: </label>
                      <span>{selectedOrg.unifiedNationalNumber ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span><StatusBadge status={selectedOrg.status} /></span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h3>Tax Account</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Tax Number:</label>
                      <span>{selectedOrg.taxAccount?.taxNumber ?? '-'}</span>
                    </div>

                    <div className="info-item">
                      <label>Tax Number:</label>
                      <span>{selectedOrg.taxAccount?.expiresAt ? formatDate(selectedOrg.taxAccount.expiresAt) : '-'}</span>
                    </div>

                  </div>
                </div>

                <div className="info-section">
                  <h3>Address</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Short Address:</label>
                      <span>{selectedOrg.address?.address ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>City:</label>
                      <span>{selectedOrg.address?.city ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>District:</label>
                      <span>{selectedOrg.address?.district ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Street:</label>
                      <span>{selectedOrg.address?.street ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Postal Code:</label>
                      <span>{selectedOrg.address?.postalCode ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Sub Number:</label>
                      <span>{selectedOrg.address?.subNumber ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Secondary Number:</label>
                      <span>{selectedOrg.address?.secondaryNumber ?? '-'}</span>
                    </div>

                  </div>
                </div>

                <div className="info-section">
                  <h3>Organization Support</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Full Name:</label>
                      <span>{selectedOrg.organizationSupport?.fullName ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone Number:</label>
                      <span>{selectedOrg.organizationSupport?.phoneNumber ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Title:</label>
                      <span>{selectedOrg.organizationSupport?.title ?? '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="info-section">
                  <h3>Documents</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>CRN URL:</label>
                      <span>
                        {selectedOrg.crnUrl ? (
                          <a href={selectedOrg.crnUrl} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        ) : 'Not provided'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Address Proof:</label>
                      <span>
                        {selectedOrg.nationalAddressUrl ? (
                          <a href={selectedOrg.nationalAddressUrl} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        ) : 'Not provided'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Tax Account:</label>
                      <span>
                        {selectedOrg.vatUrl ? (
                          <a href={selectedOrg.vatUrl} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        ) : 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => setOrgModalVisible(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Action Modal */}
      {
        actionModalVisible && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Update Approval Request</h2>
                <button
                  className="btn-close"
                  onClick={() => setActionModalVisible(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={updateApprovalRequest}>
                <div className="modal-content">
                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select status</option>
                      <option value="PENDING">Pending</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="note">Note</label>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Add any notes or comments..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActionModalVisible(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Update Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Edit Organization Modal */}
      {
        editOrgModalVisible && editOrgData && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Edit Organization</h2>
                <button
                  className="btn-close"
                  onClick={() => setEditOrgModalVisible(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditOrgSubmit}>
                <div className="modal-content">
                  <div className="info-section">
                    <h3>Basic Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Name:</label>
                        <input name="name" value={editOrgData.name || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <input name="email" value={editOrgData.email || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Phone:</label>
                        <input name="phoneNumber" value={editOrgData.phoneNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Unified National Number:</label>
                        <input name="unifiedNationalNumber" value={editOrgData.unifiedNationalNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h3>Address</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Address:</label>
                        <input name="address.address" value={editOrgData.address?.address || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>City:</label>
                        <input name="address.city" value={editOrgData.address?.city || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>District:</label>
                        <input name="address.district" value={editOrgData.address?.district || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Street:</label>
                        <input name="address.street" value={editOrgData.address?.street || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Postal Code:</label>
                        <input name="address.postalCode" value={editOrgData.address?.postalCode || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Sub Number:</label>
                        <input name="address.subNumber" value={editOrgData.address?.subNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Secondary Number:</label>
                        <input name="address.secondaryNumber" value={editOrgData.address?.secondaryNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h3>Tax Account</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Tax Number:</label>
                        <input name="taxAccount.taxNumber" value={editOrgData.taxAccount?.taxNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Expires At:</label>
                        <input name="taxAccount.expiresAt" value={editOrgData.taxAccount?.expiresAt || ''} onChange={handleEditOrgInputChange} type="datetime-local" />
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h3>Organization Support</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Full Name:</label>
                        <input name="organizationSupport.fullName" value={editOrgData.organizationSupport?.fullName || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Phone Number:</label>
                        <input name="organizationSupport.phoneNumber" value={editOrgData.organizationSupport?.phoneNumber || ''} onChange={handleEditOrgInputChange} />
                      </div>
                      <div className="info-item">
                        <label>Title:</label>
                        <input name="organizationSupport.title" value={editOrgData.organizationSupport?.title || ''} onChange={handleEditOrgInputChange} />
                      </div>
                    </div>
                  </div>
                  {editOrgError && <div className="error-message">{editOrgError}</div>}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditOrgModalVisible(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editOrgLoading}
                  >
                    {editOrgLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ApprovalRequestsPage;