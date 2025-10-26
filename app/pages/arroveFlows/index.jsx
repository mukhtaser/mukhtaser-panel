// import { TablePage, Page, useCallProcedure } from '@kottster/react';

// // Learn more about building custom pages:
// // https://kottster.app/docs/custom-pages/introduction

// export default () => {
//   // const callProcedure = useCallProcedure();

//   return (
//     <TablePage>
//       <div>Loading...</div>;

//     </TablePage>
//   );
// };
// pages/approval-requests.tsx
// pages/approval-requests/index.jsx
import React, { useState, useEffect } from 'react';
import './styles.css'; // We'll create this for basic styling

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
      const data = await apiCall(`http://localhost:3000/api/v1/approve-requests?page=${page}&take=${take}`);
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
  const fetchOrganizationDetails = async (organizationId) => {
    try {
      const data = await apiCall(`http://localhost:3000/api/v1/orgs/${organizationId}`);

        setSelectedOrg(data.data.organization);
        setOrgModalVisible(true);
      
    } catch (error) {
      alert('Error fetching organization details');
    }
  };

  // Update approval request status
  const updateApprovalRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const data = await apiCall(`/api/approval-requests/${selectedRequest.id}`, {
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
    console.log(requests, 'REQUESTS')
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'APPROVED': return '#52c41a';
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
                  <th>Status</th>
                  <th>Note</th>
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
                        <td>
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="note-cell">
                          {request.note || '-'}
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
                      <label>Status:</label>
                      <span><StatusBadge status={selectedOrg.status} /></span>
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
                        {selectedOrg.addressUrl ? (
                          <a href={selectedOrg.addressUrl} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        ) : 'Not provided'}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Tax Account:</label>
                      <span>
                        {selectedOrg.taxAccUrl ? (
                          <a href={selectedOrg.taxAccUrl} target="_blank" rel="noopener noreferrer">
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
                      <option value="APPROVED">Approved</option>
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
    </div >
  );
};

export default ApprovalRequestsPage;