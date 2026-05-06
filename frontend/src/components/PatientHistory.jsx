import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming the backend supports filtering by patientId via query param
        const response = await axios.get(`http://localhost:8080/api/medical-records?patientId=${patientId}`);
        setHistory(response.data);
      } catch (err) {
        console.error("Error fetching patient history:", err);
        setError("Failed to load patient history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  if (!patientId) {
    return <div>Please select a patient to view history.</div>;
  }

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (history.length === 0) {
    return <div>No history available for this patient.</div>;
  }

  return (
    <div className="patient-history">
      <h3>Patient History</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {history.map((record) => (
          <div 
            key={record.id} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
              <strong>Date: </strong> 
              {record.createdAt ? format(new Date(record.createdAt), 'PPP p') : 'Unknown Date'}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Assessment:</strong>
              <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{record.assessment || 'N/A'}</p>
            </div>
            
            <div>
              <strong>Plan:</strong>
              <p style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>{record.plan || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientHistory;
