import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"; // Added getDoc to refresh group data
import { db } from "../firebase";
// NEW: Import UserSearch
import UserSearch from './UserSearch';

function Groups() {
  // NEW: Import addGroupMembers
  const { fetchUserGroups, createGroup, createGroupPost, uploadImage, addGroupMembers, loggedInUser } = useAuth();

  // View State
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Group Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // Group Detail View State
  const [activeTab, setActiveTab] = useState('posts'); // 'about', 'posts', 'members'
  const [groupPosts, setGroupPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");

  // NEW: Add Member Modal State
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMemberEmails, setSelectedMemberEmails] = useState([]);

  // Initial Load
  useEffect(() => {
    if (loggedInUser) loadGroups();
  }, [loggedInUser]);

  const loadGroups = async () => {
    setIsLoading(true);
    const data = await fetchUserGroups(loggedInUser.uid);
    setMyGroups(data);
    setIsLoading(false);
  };

  // Real-time listener for posts when a group is selected
  useEffect(() => {
    if (!selectedGroup) return;

    const postsRef = collection(db, "groups", selectedGroup.id, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroupPosts(posts);
    });

    return () => unsubscribe();
  }, [selectedGroup]);

  // NEW: Refresh selected group data (member list)
  const refreshSelectedGroup = async () => {
    if (!selectedGroup) return;
    const groupRef = doc(db, "groups", selectedGroup.id);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      setSelectedGroup({ id: groupSnap.id, ...groupSnap.data() });
    }
  };


  // --- Actions ---

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;

    const success = await createGroup({
      name: newGroupName,
      description: newGroupDesc,
      links: [] // Start with no links
    });

    if (success) {
      alert("Group created!");
      setShowCreateForm(false);
      setNewGroupName("");
      setNewGroupDesc("");
      loadGroups();
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostText) return;
    
    await createGroupPost(selectedGroup.id, newPostText, null);
    setNewPostText("");
  };

  // NEW: Handle adding members
  const handleAddMembers = async () => {
    if (selectedMemberEmails.length === 0) return;

    const success = await addGroupMembers(selectedGroup.id, selectedMemberEmails);
    if (success) {
      alert("Members added!");
      setShowAddMember(false);
      setSelectedMemberEmails([]);
      refreshSelectedGroup(); // Refresh to show new members
    }
  };

  // --- Render ---

  if (selectedGroup) {
    /* --- GROUP DETAIL VIEW --- */
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', marginBottom: '15px' }}>
          ← Back to Groups
        </button>
        
        <div style={{ backgroundColor: '#282c34', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{selectedGroup.name}</h2>
          <p style={{ color: '#ccc', marginTop: '5px' }}>{selectedGroup.description}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: '20px' }}>
          {['posts', 'about', 'members'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#61dafb' : '#888',
                borderBottom: activeTab === tab ? '2px solid #61dafb' : 'none',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div>
            {/* Post Input */}
            <form onSubmit={handlePostSubmit} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Share something with the group..." 
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', backgroundColor: '#3a3f4a', color: 'white' }}
              />
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#61dafb', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                Post
              </button>
            </form>

            {/* Post Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {groupPosts.map(post => (
                <div key={post.id} style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                    <strong>{post.authorName}</strong> • {post.createdAt?.toDate().toLocaleString()}
                  </div>
                  <div style={{ fontSize: '15px' }}>{post.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div>
            <h3>About this Group</h3>
            <p>{selectedGroup.description || "No description."}</p>
            <h4>Group Links</h4>
            {/* Placeholder for links list */}
            <p style={{ color: '#888', fontStyle: 'italic' }}>No links added yet.</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Members ({selectedGroup.memberDetails?.length || 0})</h3>
              {/* NEW: Add Member Button */}
              <button 
                onClick={() => setShowAddMember(true)}
                style={{ padding: '8px 15px', backgroundColor: '#61dafb', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Add Member
              </button>
            </div>

            {/* NEW: Add Member Modal (Inline) */}
            {showAddMember && (
              <div style={{ backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #61dafb' }}>
                <h4 style={{ marginTop: 0 }}>Add Members to Group</h4>
                <UserSearch onSelectionChange={setSelectedMemberEmails} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button onClick={handleAddMembers} style={{ flex: 1, padding: '8px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Add Selected</button>
                  <button onClick={() => { setShowAddMember(false); setSelectedMemberEmails([]); }} style={{ flex: 1, padding: '8px', backgroundColor: '#555', border: 'none', cursor: 'pointer', color: 'white' }}>Cancel</button>
                </div>
              </div>
            )}

            <ul style={{ listStyle: 'none', padding: 0 }}>
              {selectedGroup.memberDetails?.map(m => (
                <li key={m.uid} style={{ padding: '10px', borderBottom: '1px solid #333' }}>
                  <strong>{m.name}</strong> <span style={{ color: '#888' }}>({m.email})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    );
  }

  /* --- GROUP LIST VIEW --- */
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>My Groups</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ padding: '10px 15px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}
        >
          {showCreateForm ? "Cancel" : "+ Create Group"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} style={{ backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>New Group</h3>
          <input 
            type="text" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <textarea 
            placeholder="Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', minHeight: '60px', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {myGroups.map(group => (
          <div 
            key={group.id} 
            onClick={() => setSelectedGroup(group)}
            style={{ 
              backgroundColor: '#282c34', padding: '20px', borderRadius: '8px', border: '1px solid #444', cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>{group.name}</h3>
            <p style={{ margin: 0, color: '#ccc', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {group.description}
            </p>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
              {group.memberDetails?.length || 0} Members
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Groups;