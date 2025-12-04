import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useFeedback } from '../../../hooks/useFeedback'; // NEW HOOK

import Header from '../../ui/Header';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';
import { ThumbsUp, MessageSquare, CheckCircle, AlertCircle, Clock, Plus, Trash2, ShieldAlert, Edit3, PlusCircle } from 'lucide-react';

function Feedback() {
  const { loggedInUser, isDeveloper } = useAuth();
  
  // Use new hook logic
  const { 
      feedbackItems, // Live data from hook
      createFeedback, 
      voteForFeedback, 
      addDeveloperNote, 
      deleteFeedback 
  } = useFeedback();

  // --- State ---
  const [filteredList, setFilteredList] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // --- Filter State ---
  const [activeFilter, setActiveFilter] = useState('Active'); // Active, Completed, Rejected
  const [counts, setCounts] = useState({ Active: 0, Completed: 0, Rejected: 0 });

  // --- Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    type: "Suggestion",
    description: ""
  });

  // --- Developer Edit State ---
  const [newNoteText, setNewNoteText] = useState("");
  const [devStatus, setDevStatus] = useState("");
  const [devOverrideMode, setDevOverrideMode] = useState(false);
  const [overrideData, setOverrideData] = useState({
      title: "",
      type: "",
      description: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Data Sync ---
  // The hook handles subscription, we just react to changes
  useEffect(() => {
      // Calculate Counts
      const active = feedbackItems.filter(i => i.status !== 'Completed' && i.status !== 'Rejected').length;
      const completed = feedbackItems.filter(i => i.status === 'Completed').length;
      const rejected = feedbackItems.filter(i => i.status === 'Rejected').length;
      setCounts({ Active: active, Completed: completed, Rejected: rejected });

      // Keep detail view fresh
      if (selectedFeedback) {
          const updated = feedbackItems.find(i => i.id === selectedFeedback.id);
          if (updated) setSelectedFeedback(updated);
      }
  }, [feedbackItems, selectedFeedback]);

  // --- Filtering & Sorting Logic ---
  useEffect(() => {
    let filtered = [];
    
    if (activeFilter === 'Active') {
        filtered = feedbackItems.filter(item => 
            item.status !== 'Completed' && item.status !== 'Rejected'
        );
        // Sort Active: Highest Votes -> Newest
        filtered.sort((a, b) => {
            if (b.votes !== a.votes) return b.votes - a.votes;
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        });
    } else {
        // Completed or Rejected
        filtered = feedbackItems.filter(item => item.status === activeFilter);
        // Sort Completed/Rejected: Newest Status Update -> Newest Creation
        filtered.sort((a, b) => {
             const timeA = a.statusUpdatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
             const timeB = b.statusUpdatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
             return timeB - timeA;
        });
    }
    setFilteredList(filtered);
  }, [feedbackItems, activeFilter]);

  // --- Handlers ---
  const handleVote = async (e, feedback) => {
    e.stopPropagation(); 
    await voteForFeedback(feedback.id);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newFeedback.title || !newFeedback.description) return;
    
    const success = await createFeedback(newFeedback);
    if (success) {
      setShowAddModal(false);
      setNewFeedback({ title: "", type: "Suggestion", description: "" });
    }
  };

  // Generic Update (Implemented locally as the hook only has status update)
  const handleUpdateFeedback = async (id, updates) => {
      try {
          const ref = doc(db, "feedback", id);
          await updateDoc(ref, updates);
          return true;
      } catch (e) {
          console.error("Update failed", e);
          return false;
      }
  };

  // Developer Actions
  const handleDevSaveStatus = async () => {
    if (!selectedFeedback) return;
    // We update timestamp manually here since we are using the local generic updater
    const success = await handleUpdateFeedback(selectedFeedback.id, { 
        status: devStatus,
        statusUpdatedAt: new Date() 
    });
    if (success) alert("Status updated.");
  };

  const handleAddNote = async () => {
      if (!selectedFeedback || !newNoteText.trim()) return;
      const success = await addDeveloperNote(selectedFeedback.id, newNoteText);
      if (success) {
          setNewNoteText("");
          alert("Note added.");
      }
  };

  const handleDevOverrideSave = async () => {
      if (!selectedFeedback) return;
      const success = await handleUpdateFeedback(selectedFeedback.id, {
          title: overrideData.title,
          type: overrideData.type,
          description: overrideData.description
      });
      if (success) {
          alert("Feedback details updated.");
          setDevOverrideMode(false);
      }
  };

  const handleDevDelete = async () => {
      if (!selectedFeedback) return;
      if (window.confirm("Are you sure you want to DELETE this feedback item? This cannot be undone.")) {
          const success = await deleteFeedback(selectedFeedback.id);
          if (success) {
              setSelectedFeedback(null);
              setCurrentView('list');
          }
      }
  };

  // --- Helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return COLORS.success;
      case 'In Progress': return '#ffc107'; 
      case 'Completed': return '#00bcd4';   
      case 'Rejected': return COLORS.danger;
      default: return '#888'; 
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bug': return <AlertCircle size={16} color={COLORS.danger} />;
      case 'Suggestion': return <MessageSquare size={16} color={COLORS.primary} />;
      default: return <CheckCircle size={16} color="#888" />;
    }
  };

  const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown date';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCardClick = (item) => {
      setSelectedFeedback(item);
      setDevStatus(item.status || 'Proposed');
      setOverrideData({
          title: item.title,
          type: item.type,
          description: item.description
      });
      setCurrentView('detail');
  };

  // --- RENDER: Detail View ---
  if (currentView === 'detail' && selectedFeedback) {
    const hasVoted = selectedFeedback.voters?.includes(loggedInUser.uid);
    const isClosed = selectedFeedback.status === 'Completed' || selectedFeedback.status === 'Rejected';
    
    const sortedNotes = (Array.isArray(selectedFeedback.developerNotes) ? selectedFeedback.developerNotes : [])
        .sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="view-container">
        <Header 
          title="Feedback Details" 
          style={{ maxWidth: '1000px', margin: '0 auto' }}
          onBack={() => setCurrentView('list')}
        />
        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            
            <Card style={{ padding: '25px' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>{selectedFeedback.title}</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '14px', color: '#ccc' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getTypeIcon(selectedFeedback.type)} {selectedFeedback.type}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: getStatusColor(selectedFeedback.status) }}>
                      <Clock size={16} /> {selectedFeedback.status}
                    </span>
                    <span style={{ color: '#888' }}>
                       Created: {formatDate(selectedFeedback.createdAt)}
                    </span>
                    {isClosed && selectedFeedback.statusUpdatedAt && (
                        <span style={{ color: getStatusColor(selectedFeedback.status) }}>
                            {selectedFeedback.status === 'Completed' ? 'Completed' : 'Rejected'}: {formatDate(selectedFeedback.statusUpdatedAt)}
                        </span>
                    )}
                  </div>
                </div>
                
                {/* Vote Button */}
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                   <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px', color: isClosed ? '#666' : COLORS.primary }}>
                     {selectedFeedback.votes}
                   </div>
                   <Button 
                     onClick={(e) => handleVote(e, selectedFeedback)} 
                     disabled={isClosed}
                     style={{ 
                       backgroundColor: hasVoted ? COLORS.primary : (isClosed ? '#333' : '#555'),
                       color: hasVoted ? '#000' : (isClosed ? '#666' : 'white'),
                       border: hasVoted ? 'none' : (isClosed ? '1px solid #444' : 'none'),
                       cursor: isClosed ? 'not-allowed' : 'pointer',
                       padding: '5px 15px',
                       fontSize: '12px'
                     }}
                   >
                     {hasVoted ? 'Voted' : (isClosed ? 'Closed' : 'Vote')}
                   </Button>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '20px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, color: COLORS.primary }}>Description</h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#ddd' }}>{selectedFeedback.description}</p>
              </div>

              {/* Developer Notes List */}
              {(sortedNotes.length > 0) && (
                <div style={{ marginTop: '30px' }}>
                    <h4 style={{ color: COLORS.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <CheckCircle size={16} /> Developer Notes
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {sortedNotes.map((note, idx) => (
                            <div key={idx} style={{ backgroundColor: 'rgba(97, 218, 251, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: `3px solid ${COLORS.primary}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px', color: '#888' }}>
                                    <span>{note.author || 'Developer'}</span>
                                    <span>{formatDateTime(note.createdAt)}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', color: 'white', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                Submitted by {selectedFeedback.authorName}
              </div>
            </Card>

            {/* --- DEVELOPER CONTROLS --- */}
            {isDeveloper() && (
                <Card style={{ padding: '25px', border: `1px solid ${COLORS.primary}`, backgroundColor: '#2a2a2a', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: COLORS.primary }}>
                            <ShieldAlert size={24} />
                            <h3 style={{ margin: 0 }}>Developer Controls</h3>
                        </div>
                        <button 
                           onClick={() => setDevOverrideMode(!devOverrideMode)}
                           style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', gap: '5px', fontSize: '12px' }}
                        >
                           <Edit3 size={14} /> {devOverrideMode ? "Cancel Override" : "Override Details"}
                        </button>
                    </div>
                    
                    {/* Override Section */}
                    {devOverrideMode && (
                        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #444' }}>
                            <h4 style={{ color: 'white', marginTop: 0 }}>Override Original Details</h4>
                            <Input label="Title" value={overrideData.title} onChange={(e) => setOverrideData({...overrideData, title: e.target.value})} />
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Type</label>
                                <select 
                                    value={overrideData.type} 
                                    onChange={(e) => setOverrideData({...overrideData, type: e.target.value})}
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#3a3f4a', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white' }}
                                >
                                    <option value="Suggestion">Suggestion</option>
                                    <option value="Bug">Bug Issue</option>
                                    <option value="General">General Feedback</option>
                                </select>
                            </div>

                            <Input label="Description" multiline value={overrideData.description} onChange={(e) => setOverrideData({...overrideData, description: e.target.value})} />
                            <Button onClick={handleDevOverrideSave} style={{ width: '100%' }}>Update Content</Button>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Status Update */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                             <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Update Status</label>
                                <select 
                                    value={devStatus} 
                                    onChange={(e) => setDevStatus(e.target.value)}
                                    style={{ 
                                        width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
                                        border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' 
                                    }}
                                >
                                    <option value="Proposed">Proposed</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                             </div>
                             <Button onClick={handleDevSaveStatus} style={{ height: '42px' }}>Update</Button>
                        </div>

                        {/* Add Note */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Add Developer Note (Public)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <textarea 
                                    value={newNoteText} 
                                    onChange={(e) => setNewNoteText(e.target.value)}
                                    placeholder="Add a new update..."
                                    style={{ 
                                        flex: 1, padding: '10px', backgroundColor: '#3a3f4a', 
                                        border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px', minHeight: '60px' 
                                    }} 
                                />
                                <Button onClick={handleAddNote} style={{ height: 'auto' }}>
                                   <PlusCircle size={20} />
                                </Button>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '5px' }}>
                            <Button variant="danger" onClick={handleDevDelete} style={{ width: '100%' }}>
                                <Trash2 size={16} style={{ marginRight: '8px' }} /> Delete Feedback Item
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: List View ---
  return (
    <div className="view-container">
      <Header 
        title="Feedback" 
        style={{ maxWidth: '1000px', margin: '0 auto' }}
        actions={
            <Button 
                onClick={() => setShowAddModal(true)} 
                style={{ 
                  padding: 0, 
                  width: '32px', height: '32px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  borderRadius: '50%' 
                }}
            >
                <Plus size={18} />
            </Button>
        }
      />
      
      <div className="view-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          
          {/* Filter Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: '20px' }}>
             {['Active', 'Completed', 'Rejected'].map(tab => (
                <button
                   key={tab}
                   onClick={() => setActiveFilter(tab)}
                   style={{
                       flex: 1,
                       padding: '12px 5px',
                       background: 'none',
                       border: 'none',
                       borderBottom: activeFilter === tab ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                       color: activeFilter === tab ? 'white' : '#888',
                       fontWeight: activeFilter === tab ? 'bold' : 'normal',
                       cursor: 'pointer',
                       transition: 'all 0.2s',
                       display: 'flex',
                       justifyContent: 'center',
                       alignItems: 'center',
                       gap: '6px'
                   }}
                >
                   {tab}
                   <span style={{ 
                       fontSize: '10px', backgroundColor: activeFilter === tab ? COLORS.primary : '#444', 
                       color: activeFilter === tab ? '#000' : '#ccc', padding: '1px 6px', borderRadius: '10px' 
                   }}>
                       {counts[tab]}
                   </span>
                </button>
             ))}
          </div>

          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
              <p>No items in {activeFilter}.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '15px', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))' 
            }}>
              {filteredList.map(item => {
                const hasVoted = item.voters?.includes(loggedInUser.uid);
                const isClosed = item.status === 'Completed' || item.status === 'Rejected';

                return (
                  <Card 
                    key={item.id} 
                    onClick={() => handleCardClick(item)}
                    hoverable
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ 
                        fontSize: '10px', padding: '2px 6px', borderRadius: '4px', 
                        backgroundColor: 'rgba(255,255,255,0.1)', color: getStatusColor(item.status),
                        border: `1px solid ${getStatusColor(item.status)}`
                      }}>
                        {item.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getTypeIcon(item.type)} {item.type}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: COLORS.primary }}>{item.title}</h3>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>{formatDate(item.createdAt)}</div>
                    
                    <p style={{ 
                      margin: '0 0 15px 0', fontSize: '13px', color: '#ccc', flex: 1,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                    }}>
                      {item.description}
                    </p>

                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      marginTop: 'auto', borderTop: '1px solid #444', paddingTop: '10px' 
                    }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>by {item.authorName}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: isClosed ? '#666' : 'white' }}>{item.votes}</span>
                        <button 
                          onClick={(e) => handleVote(e, item)}
                          disabled={isClosed}
                          style={{
                            background: 'none', border: 'none', cursor: isClosed ? 'default' : 'pointer',
                            color: hasVoted ? COLORS.primary : '#888', display: 'flex', alignItems: 'center'
                          }}
                        >
                          <ThumbsUp size={18} fill={hasVoted ? COLORS.primary : "none"} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <Modal 
          title="Submit Feedback" 
          onClose={() => setShowAddModal(false)}
          actions={<Button onClick={handleAddSubmit}>Submit</Button>}
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <Input 
              label="Title" 
              placeholder="Short summary..." 
              value={newFeedback.title} 
              onChange={(e) => setNewFeedback({...newFeedback, title: e.target.value})} 
            />
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Type</label>
              <select 
                value={newFeedback.type} 
                onChange={(e) => setNewFeedback({...newFeedback, type: e.target.value})}
                style={{ 
                  width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
                  border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px' 
                }}
              >
                <option value="Suggestion">Suggestion</option>
                <option value="Bug">Bug Issue</option>
                <option value="General">General Feedback</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Description</label>
              <textarea 
                value={newFeedback.description} 
                onChange={(e) => setNewFeedback({...newFeedback, description: e.target.value})}
                placeholder="Describe your feedback in detail..."
                style={{ 
                  width: '100%', padding: '10px', backgroundColor: '#3a3f4a', 
                  border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: 'white', fontSize: '16px', minHeight: '100px' 
                }} 
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Feedback;