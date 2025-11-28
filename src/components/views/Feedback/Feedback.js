import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../common/Header';
import Button from '../../common/Button';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import { COLORS, MOBILE_BREAKPOINT } from '../../../lib/constants';
import { ThumbsUp, MessageSquare, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';

function Feedback() {
  const { subscribeToFeedback, createFeedback, voteForFeedback, loggedInUser } = useAuth();

  // --- State ---
  const [feedbackList, setFeedbackList] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  
  // --- Modal State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    title: "",
    type: "Suggestion",
    description: ""
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Data Subscription ---
  useEffect(() => {
    const unsubscribe = subscribeToFeedback((data) => {
      // Filter out 'Completed' and 'Rejected' items
      const filtered = data.filter(item => 
        item.status !== 'Completed' && item.status !== 'Rejected'
      );
      setFeedbackList(filtered);
    });
    return () => unsubscribe();
  }, [subscribeToFeedback]);

  // --- Handlers ---
  const handleVote = async (e, feedback) => {
    e.stopPropagation(); // Prevent card click
    if (feedback.voters?.includes(loggedInUser.uid)) return;
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

  // --- Helpers ---
  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return COLORS.success;
      case 'In Progress': return '#ffc107'; // Yellow/Gold
      default: return '#888'; // Grey for Proposed
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bug': return <AlertCircle size={16} color={COLORS.danger} />;
      case 'Suggestion': return <MessageSquare size={16} color={COLORS.primary} />;
      default: return <CheckCircle size={16} color="#888" />;
    }
  };

  const handleCardClick = (item) => {
      // Refresh selected feedback item to ensure vote count is latest
      const updatedItem = feedbackList.find(f => f.id === item.id) || item;
      setSelectedFeedback(updatedItem);
      setCurrentView('detail');
  };

  // --- RENDER: Detail View ---
  if (currentView === 'detail' && selectedFeedback) {
    const hasVoted = selectedFeedback.voters?.includes(loggedInUser.uid);
    
    return (
      <div className="view-container">
        <Header 
          title="Feedback Details" 
          style={{ maxWidth: '1000px', margin: '0 auto' }}
          onBack={() => setCurrentView('list')}
        />
        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            
            {/* Main Content Card */}
            <Card style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>{selectedFeedback.title}</h2>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#ccc' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getTypeIcon(selectedFeedback.type)} {selectedFeedback.type}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: getStatusColor(selectedFeedback.status) }}>
                      <Clock size={16} /> {selectedFeedback.status}
                    </span>
                  </div>
                </div>
                
                {/* Big Vote Button */}
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px', color: COLORS.primary }}>
                     {selectedFeedback.votes}
                   </div>
                   <Button 
                     onClick={(e) => handleVote(e, selectedFeedback)} 
                     disabled={hasVoted}
                     style={{ 
                       opacity: hasVoted ? 0.8 : 1, 
                       cursor: hasVoted ? 'default' : 'pointer',
                       padding: '5px 15px',
                       fontSize: '12px'
                     }}
                   >
                     {hasVoted ? 'Voted' : 'Vote'}
                   </Button>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: '20px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0, color: COLORS.primary }}>Description</h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#ddd' }}>{selectedFeedback.description}</p>
              </div>

              {selectedFeedback.developerNotes && (
                <div style={{ backgroundColor: 'rgba(97, 218, 251, 0.1)', padding: '15px', borderRadius: '8px', border: `1px solid ${COLORS.primary}` }}>
                  <h4 style={{ marginTop: 0, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} /> Developer Notes
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>{selectedFeedback.developerNotes}</p>
                </div>
              )}

              <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                Submitted by {selectedFeedback.authorName}
              </div>
            </Card>
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
          
          {feedbackList.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
              <p>No active feedback found.</p>
              <p>Be the first to suggest something!</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '15px', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))' 
            }}>
              {feedbackList.map(item => {
                const hasVoted = item.voters?.includes(loggedInUser.uid);
                return (
                  <Card 
                    key={item.id} 
                    onClick={() => handleCardClick(item)}
                    hoverable
                    style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
                  >
                    {/* Header: Status & Type */}
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

                    {/* Title & Description Snippet */}
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: COLORS.primary }}>{item.title}</h3>
                    <p style={{ 
                      margin: '0 0 15px 0', fontSize: '13px', color: '#ccc', flex: 1,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                    }}>
                      {item.description}
                    </p>

                    {/* Footer: Vote Count & Button */}
                    <div style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      marginTop: 'auto', borderTop: '1px solid #444', paddingTop: '10px' 
                    }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>by {item.authorName}</span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>{item.votes}</span>
                        <button 
                          onClick={(e) => handleVote(e, item)}
                          disabled={hasVoted}
                          style={{
                            background: 'none', border: 'none', cursor: hasVoted ? 'default' : 'pointer',
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

      {/* --- Add Feedback Modal --- */}
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