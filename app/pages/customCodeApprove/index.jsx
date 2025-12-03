import React, { useState, useEffect } from 'react';
import './styles.css'; // We'll create this for basic styling
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000' //|| 'https://backend.mukhtaser.sa';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backend.mukhtaser.sa';

const formatDate = (ts) => {
  try {
    if (!ts) return '-';
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
    total: 0,
  });
  const [selectedApproveRequest, setSelectedApproveRequest] = useState(null);
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    leaderApproved: '',
    leaderReview: '',
    dataEntryApproved: '',
    dataEntryReview: '',
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
      const data = await apiCall(
        `${BACKEND_URL}/api/v1/custom-code-approves?page=${page}&take=${take}`
      );
      console.log(data);
      setRequests(data.data.requests);
      setPagination({
        page: data.data.page ?? 1,
        take: data.data.take ?? 10,
        total: data.data.numOfRequests,
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
      const data = await apiCall(
        `${BACKEND_URL}/api/v1/custom-code-approves/${id}`
      );
      console.log(data);
      const org = data?.data?.request || data?.data || data;
      setSelectedApproveRequest(org || null);
      setOrgModalVisible(true);
    } catch (error) {
      console.error(
        'Error fetching custom code approve request details',
        error
      );
      setOrgError(
        error.message || 'Error fetching custom code approve request details'
      );
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
        Object.entries(payload).filter(
          ([_, v]) => v !== undefined && v !== null && v.length !== 0
        )
      );

      const data = await apiCall(
        `${BACKEND_URL}/api/v1/custom-code-approves/${selectedRequest.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(cleanedData),
        }
      );

      alert('Request updated successfully');
      setActionModalVisible(false);
      setFormData({
        leaderApproved: '',
        leaderReview: '',
        dataEntryApproved: '',
        dataEntryReview: '',
      });
      fetchApprovalRequests(pagination.page, pagination.take);
    } catch (error) {
      console.log(error);
      alert('Error updating request');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        case 'ACCEPTED':
          return '#52c41a';
        case 'REJECTED':
          return '#ff4d4f';
        case 'PENDING':
          return '#faad14';
        default:
          return '#d9d9d9';
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
          fontWeight: 'bold',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="custom-code-approval-requests-container" width="100%">
      <div className="page-header">
        <h1>طلبات المختصر المخصص</h1>
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
                  <th>اسم الشركة</th>
                  <th>الرمز المخصص المطلوب</th>
                  <th>رابط ملف إثبات المُـخْتَصِر المخصص</th>
                  <th>السبب</th>
                  <th>حالة الطلب</th>
                  <th>موافقة موظف الاعتماد أو المراجع</th>
                  <th>ملاحظات موظف الاعتماد أو المراجع</th>
                  <th>موافقة مدخل البيانات</th>
                  <th>ملاحظات مدخل البيانات</th>
                </tr>
              </thead>
              {!requests.length ? (
                <p className="no-data">لا يوجد طلبات فى الوقت الحالى</p>
              ) : (
                <tbody>
                  {requests.map((request) => (
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
                            onClick={() =>
                              fetchCustomCodeApproveDetails(request.id)
                            }
                          >
                            رؤية التفاصيل
                          </button>
                          <button
                            className="btn btn-action"
                            onClick={() => handleActionClick(request)}
                          >
                            اتخذ إجراء
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="btn-pagination"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                السابق
              </button>

              <span className="page-info">
                صفحة رقم {pagination.page} من أصل{' '}
                {Math.ceil(pagination.total / pagination.take)}
              </span>

              <button
                className="btn-pagination"
                disabled={
                  pagination.page >=
                  Math.ceil(pagination.total / pagination.take)
                }
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                التالى
              </button>
            </div>
          </>
        )}
      </div>

      {/* Organization Details Modal */}
      {orgModalVisible && selectedApproveRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>تفاصيل الطلب</h2>
              <button
                className="btn-close"
                onClick={() => setOrgModalVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="info-section">
                <h3>المعلومات الاساسية</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>اسم المنشأة:</label>
                    <span>
                      {selectedApproveRequest?.customCode?.organization?.name ??
                        '-'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>مراجعة موظف الاعتماد:</label>
                    <span>
                      {selectedApproveRequest.leaderApproved === true ? (
                        <span className="text-green-600 font-semibold">
                          مقبول
                        </span>
                      ) : selectedApproveRequest.leaderApproved === false ? (
                        <span className="text-red-500 font-semibold">
                          مرفوض
                        </span>
                      ) : (
                        '--'
                      )}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>موافقة مدخل البيانات:</label>
                    <span>
                      {selectedApproveRequest.dataEntryApproved === true ? (
                        <span className="text-green-600 font-semibold">
                          مقبول
                        </span>
                      ) : selectedApproveRequest.dataEntryApproved === false ? (
                        <span className="text-red-500 font-semibold">
                          مرفوض
                        </span>
                      ) : (
                        '--'
                      )}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>ملاحظة موظف الاعتماد او المراجع: </label>
                    <span>{selectedApproveRequest.leaderNote ?? '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>ملاحظة مدخل البيانات:</label>
                    <span>{selectedApproveRequest.dataEntryNote ?? '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>رمز مُـخْتَصِر المخصص:</label>
                    <span>
                      {selectedApproveRequest.customCode?.code ?? '-'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>سبب الاختيار:</label>
                    <span>
                      {selectedApproveRequest.customCode?.reason ?? '-'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>رابط الملف:</label>
                    <span>
                      {selectedApproveRequest.crnUrl ? (
                        <a
                          href={selectedApproveRequest.customCode?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          معاينة الملف
                        </a>
                      ) : (
                        'لا يوجد'
                      )}
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
                اغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModalVisible && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>تحديث الطلب</h2>
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
                  <label htmlFor="leaderApproved">مراجعة موظف الاعتماد</label>
                  <select
                    id="leaderApproved"
                    name="leaderApproved"
                    value={formData.leaderApproved}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      يرجى اتخاذ قرار
                    </option>
                    <option value="true">قبول</option>
                    <option value="false">رفض</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dataEntryApproved">
                    مراجعة مدخل البيانات
                  </label>
                  <select
                    id="dataEntryApproved"
                    name="dataEntryApproved"
                    value={formData.dataEntryApproved}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      يرجى اتخاذ قرار
                    </option>
                    <option value="true">قبول</option>
                    <option value="false">رفض</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="note">مراجعة موظف الاعتماد</label>
                  <textarea
                    id="note"
                    name="leaderReview"
                    value={formData.leaderReview}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="أضف أي ملاحظات أو تعليقات..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="note">مراجعة مدخل البيانات</label>
                  <textarea
                    id="note"
                    name="dataEntryReview"
                    value={formData.dataEntryReview}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="اضف أي ملاحظات أو تعليقات..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActionModalVisible(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  تحديث الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalRequestsPage;
