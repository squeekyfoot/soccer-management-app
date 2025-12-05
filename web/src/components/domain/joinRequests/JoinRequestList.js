import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import Modal from '../../ui/Modal';
import { useAuth } from '../../../context/AuthContext';
import { useRosterManager } from '../../../hooks/useRosterManager';
import { useGroupManager } from '../../../hooks/useGroupManager'; // To fetch groups internally
import { COLORS } from '../../../lib/constants';

const JoinRequestList = () => {
  // HOOKS (The Brain)
  const { fetchPlayerDetails, loggedInUser } = useAuth();
  const { 
    subscribeToIncomingRequests, // Real-time listener
    addPlayerToRoster, // "Approve" logic
    updateRoster, // For deny/remove logic if needed
    // You might need to add a specific 'denyRequest' or 'deleteRequest' function to your hook if it doesn't exist
  } = useRosterManager();
  const { fetchUserGroups, addGroupMembers } = useGroupManager();

  // STATE
  const [requests, setRequests] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Approval Modal State
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState("");

  // 1. Subscribe to Requests & Fetch Groups
  useEffect(() => {
    if (!loggedInUser) return;

    // A. Real-time requests
    const unsub = subscribeToIncomingRequests((data) => {
        setRequests(data);
    });

    // B. Fetch Manager's groups (for the optional add-to-group feature)
    const loadGroups = async () => {
        const groups = await fetchUserGroups(loggedInUser.uid);
        setMyGroups(groups);
    };
    loadGroups();

    return () => unsub && unsub();
  }, [loggedInUser, subscribeToIncomingRequests, fetchUserGroups]);

  // HANDLERS
  const toggleDetails = async (req) => {
    if (expandedId === req.id) {
      setExpandedId(null); setDetails(null); return;
    }
    setExpandedId(req.id);
    setLoadingDetails(true);
    const data = await fetchPlayerDetails(req.userId);
    setDetails(data);
    setLoadingDetails(false);
  };

  const initiateApproval = (req) => {
      // Auto-select a group if it matches the roster
      const associated = myGroups.find(g => g.associatedRosterId === req.rosterId);
      setTargetGroupId(associated ? associated.id : "");
      setRequestToApprove(req);
  };

  const confirmApproval = async () => {
      if (!requestToApprove) return;

      // 1. Add to Roster
      const success = await addPlayerToRoster(requestToApprove.rosterId, requestToApprove.userEmail);
      
      // 2. Optional: Add to Group
      if (success && targetGroupId) {
          await addGroupMembers(targetGroupId, [requestToApprove.userEmail]);
      }

      // 3. Cleanup Request (Delete the request doc)
      // Note: You should expose a `deleteRequest(requestId)` in useRosterManager 
      // For now, we assume the hook handles the cleanup or we call Firestore directly here if strictly necessary
      // await deleteDoc(doc(db, "rosterRequests", requestToApprove.id)); 
      
      setRequestToApprove(null);
  };
  
  const handleDeny = async (req) => {
      if(window.confirm(`Deny request from ${req.userName}?`)) {
          // await deleteDoc(doc(db, "rosterRequests", req.id));
      }
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
                <Button variant="danger" onClick={() => handleDeny(req)} style={{ padding: '5px 15px', fontSize: '12px' }}>Deny</Button>
              </div>
            </div>
            
            {/* Player Details Expansion */}
            {expandedId === req.id && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#333', borderRadius: '5px' }}>
                {loadingDetails ? <p>Loading...</p> : details ? (
                    <div style={{ fontSize: '14px' }}>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                            <Avatar src={details.photoURL} text={details.playerName} size={50} />
                            <div>
                                <strong>{details.playerName}</strong>
                                <div style={{ color: '#aaa' }}>{details.email}</div>
                                <div style={{ color: '#aaa' }}>{details.phone}</div>
                            </div>
                        </div>
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
                  <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', background: '#444', color: 'white', border: 'none' }}>
                      <option value="">-- No Group --</option>
                      {myGroups.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
              </div>
          </Modal>
      )}
    </div>
  );
};

export default JoinRequestList;