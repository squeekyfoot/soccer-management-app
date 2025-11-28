import React, { useState } from 'react';
import Card from '../../../common/Card';
import Button from '../../../common/Button';
import Avatar from '../../../common/Avatar';
import Modal from '../../../common/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { COLORS } from '../../../../config/constants';

const IncomingRequests = ({ requests, onApprove, onDeny, myGroups }) => {
  const { fetchPlayerDetails } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Approval Modal State
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState("");

  const toggleDetails = async (req) => {
    if (expandedId === req.id) {
      setExpandedId(null); setDetails(null); return;
    }
    setExpandedId(req.id);
    setLoading(true);
    const data = await fetchPlayerDetails(req.userId);
    setDetails(data);
    setLoading(false);
  };

  const initiateApproval = (req) => {
      const associated = myGroups.find(g => g.associatedRosterId === req.rosterId);
      setTargetGroupId(associated ? associated.id : "");
      setRequestToApprove(req);
  };

  const confirmApproval = () => {
      onApprove(requestToApprove, targetGroupId || null);
      setRequestToApprove(null);
  };

  if (!requests.length) return null;

  return (
    <div style={{ marginTop: '10px', marginBottom: '40px' }}>
      <h3 style={{ color: COLORS.primary }}>Incoming Join Requests</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {requests.map(req => (
          <Card key={req.id} style={{ border: `1px solid ${COLORS.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>{req.userName}</span>
                <span style={{ color: '#aaa', margin: '0 10px' }}>wants to join</span>
                <span style={{ fontWeight: 'bold', color: 'white' }}>{req.rosterName}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="secondary" onClick={() => toggleDetails(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>
                    {expandedId === req.id ? "Hide" : "Profile"}
                </Button>
                <Button onClick={() => initiateApproval(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Approve</Button>
                <Button variant="danger" onClick={() => onDeny(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Deny</Button>
              </div>
            </div>
            {expandedId === req.id && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
                {loading ? <p>Loading...</p> : details ? (
                    <div style={{ fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <Avatar src={details.photoURL} text={details.playerName} size={50} />
                            <div>
                                <strong>{details.playerName}</strong>
                                <div style={{ color: '#aaa' }}>{details.email}</div>
                                <div style={{ color: '#aaa' }}>{details.phone}</div>
                            </div>
                        </div>
                        {/* Add more details here if needed */}
                    </div>
                ) : <p style={{ color: COLORS.danger }}>Failed to load.</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {requestToApprove && (
          <Modal title="Confirm Approval" onClose={() => setRequestToApprove(null)} actions={<Button onClick={confirmApproval}>Confirm</Button>}>
              <p style={{ color: '#ccc' }}>Approve <strong>{requestToApprove.userName}</strong> for <strong>{requestToApprove.rosterName}</strong>?</p>
              <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px' }}>Add to Community Group (Optional):</label>
                  <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px' }}>
                      <option value="">-- No Group --</option>
                      {myGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
              </div>
          </Modal>
      )}
    </div>
  );
};

export default IncomingRequests;