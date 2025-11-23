
import React, { useState, useEffect } from 'react';
import './styles.css'; // We'll create this for basic styling
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000' //|| 'https://backend.mukhtaser.sa';
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend.mukhtaser.sa';


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
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    leaderApproved: "",
    leaderReview: "",
    dataEntryApproved: "",
    dataEntryReview: "",
  });

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
      const data = await apiCall(`${BACKEND_URL}/api/v1/custom-code-approves?page=${page}&take=${take}`);
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

  // Fetch organization details
  const fetchCustomCodeApproveDetails = async (organizationId) => {
    const id = organizationId || null;
    if (!id) {
      alert('Organization id is missing');
      return;
    }
    setOrgLoading(true);
    setOrgError(null);
    setSelectedApproveRequest(null);
    try {
      const data = await apiCall(`${BACKEND_URL}/api/v1/custom-code-approves/${id}`);
      console.log(data)
      const org = data?.data?.request || data?.data || data;
      setSelectedApproveRequest(org || null);
      setOrgModalVisible(true);
    } catch (error) {
      console.error('Error fetching custom code approve request details', error);
      setOrgError(error.message || 'Error fetching custom code approve request details');
      // still open modal to show error message
      setOrgModalVisible(true);
    } finally {
      setOrgLoading(false);
    }
  };

  // Update approval request status
  const updateApprovalRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {

      const payload = {
        leaderApproved: formData.leaderApproved,
        leaderReview: formData.leaderReview,
        dataEntryApproved: formData.dataEntryApproved,
        dataEntryReview: formData.leaderReview,
      };

      const cleanedData = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && v.length !== 0)
      );

      console.log(cleanedData, 'cleanedData ', selectedRequest)
      const data = await apiCall(`${BACKEND_URL}/api/v1/custom-code-approves/${selectedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanedData)
      });

      alert('Request updated successfully');
      setActionModalVisible(false);
      setFormData({
        leaderApproved: "",
        leaderReview: "",
        dataEntryApproved: "",
        dataEntryReview: "",
      });
      fetchApprovalRequests(pagination.page, pagination.take);

    } catch (error) {
      console.log(error)
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

  // Handle action button click
  const handleActionClick = (request) => {
    setSelectedRequest(request);
    setFormData({
      leaderApproved: request.leaderApproved,
      leaderReview: request.leaderReview,
      dataEntryApproved: request.dataEntryApproved,
      dataEntryReview: request.dataEntryReview,
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
        <h1>Custom Code Approval Requests</h1>
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
                  <th>Code</th>
                  <th>Url</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Leader Approve</th>
                  <th>Leader Note</th>
                  <th>Data Entry Approve</th>
                  <th>Data Entry Note</th>
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
                        <td>{request.customCode.organization?.name}</td>
                        <td>{request.customCode?.code || '-'}</td>
                        <td>{request.customCode?.url || '-'}</td>
                        <td>{request.customCode?.reason || '-'}</td>
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="note-cell">
                          <span>{
                            request.leaderApproved === true
                              ? (<span className="text-green-600 font-semibold">Yes</span>)
                              : request.leaderApproved === false
                                ? (<span className="text-red-500 font-semibold">No</span>)
                                : "--"
                          }</span>
                        </td>
                        <td className="note-cell">
                          {request.leaderReview || '-'}
                        </td>
                        <td className="note-cell">
                          <span>{
                            request.dataEntryApproved === true
                              ? (<span className="text-green-600 font-semibold">Yes</span>)
                              : request.dataEntryApproved === false
                                ? (<span className="text-red-500 font-semibold">No</span>)
                                : "--"
                          }</span>
                        </td>
                        <td className="note-cell">
                          {request.dataEntryReview || '-'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn-view"
                              onClick={() => fetchCustomCodeApproveDetails(request.id)}
                            >
                              View Details
                            </button>
                            <button
                              className="btn btn-action"
                              onClick={() => handleActionClick(request)}
                            >
                              Take Action
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
        orgModalVisible && selectedApproveRequest && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Custom Code Details</h2>
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
                      <label>Organization Name:</label>
                      <span>{selectedApproveRequest?.customCode?.organization?.name ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>leader approve:</label>
                      <span>{
                        selectedApproveRequest.leaderApproved === true
                          ? (<span className="text-green-600 font-semibold">Yes</span>)
                          : selectedApproveRequest.leaderApproved === false
                            ? (<span className="text-red-500 font-semibold">No</span>)
                            : "--"
                      }</span>
                    </div>
                    <div className="info-item">
                      <label>Data entry approve:</label>
                      <span>{
                        selectedApproveRequest.dataEntryApproved === true
                          ? (<span className="text-green-600 font-semibold">Yes</span>)
                          : selectedApproveRequest.dataEntryApproved === false
                            ? (<span className="text-red-500 font-semibold">No</span>)
                            : "--"
                      }</span>
                    </div>
                    <div className="info-item">
                      <label>Leader note: </label>
                      <span>{selectedApproveRequest.leaderNote ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Data entry note:</label>
                      <span>{selectedApproveRequest.dataEntryNote ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Code:</label>
                      <span>{selectedApproveRequest.customCode?.code ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Reason:</label>
                      <span>{selectedApproveRequest.customCode?.reason ?? '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>file url:</label>
                      <span>
                        {selectedApproveRequest.crnUrl ? (
                          <a href={selectedApproveRequest.customCode?.url} target="_blank" rel="noopener noreferrer">
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
                    <label htmlFor="leaderApproved">leader approved</label>
                    <select
                      id="leaderApproved"
                      name="leaderApproved"
                      value={formData.leaderApproved}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" selected disabled>Approved</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dataEntryApproved">Data entry approved</label>
                    <select
                      id="dataEntryApproved"
                      name="dataEntryApproved"
                      value={formData.dataEntryApproved}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" selected disabled>Approved</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="note">Leader Review</label>
                    <textarea
                      id="note"
                      name="leaderReview"
                      value={formData.leaderReview}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Add any notes or comments..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="note">Data entry Review</label>
                    <textarea
                      id="note"
                      name="dataEntryReview"
                      value={formData.dataEntryReview}
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
    </div >
  );
};

export default ApprovalRequestsPage;