import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import UserSearch from './UserSearch';

function Groups() {
  const { 
    fetchUserGroups, createGroup, createGroupPost, 
    addGroupMembers, updateGroupMemberRole, transferGroupOwnership, removeGroupMember,
    loggedInUser 
  } = useAuth();

  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [activeTab, setActiveTab] = useState('posts'); 
  const [groupPosts, setGroupPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMemberEmails, setSelectedMemberEmails] = useState([]);

  const [activeMemberMenu, setActiveMemberMenu] = useState(null); 

  useEffect(() => {
    if (loggedInUser) loadGroups();
  }, [loggedInUser]);

  const loadGroups = async () => {
    setIsLoading(true);
    const data = await fetchUserGroups(loggedInUser.uid);
    setMyGroups(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!selectedGroup) return;
    const postsRef = collection(db, "groups", selectedGroup.id, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroupPosts(posts);
    });
    return () => unsubscribe();
  }, [selectedGroup]);

  const refreshSelectedGroup = async () => {
    if (!selectedGroup) return;
    const groupRef = doc(db, "groups", selectedGroup.id);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      setSelectedGroup({ id: groupSnap.id, ...groupSnap.data() });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    const success = await createGroup({
      name: newGroupName,
      description: newGroupDesc,
      links: [] 
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

  const handleAddMembers = async () => {
    if (selectedMemberEmails.length === 0) return;
    const success = await addGroupMembers(selectedGroup.id, selectedMemberEmails);
    if (success) {
      alert("Members added!");
      setShowAddMember(false);
      setSelectedMemberEmails([]);
      refreshSelectedGroup(); 
    }
  };

  const handlePromote = async (memberUid) => {
    const success = await updateGroupMemberRole(selectedGroup.id, memberUid, 'admin', selectedGroup.memberDetails);
    if (success) {
      setActiveMemberMenu(null); 
      refreshSelectedGroup();
    }
  };

  const handleDemote = async (memberUid) => {
    const success = await updateGroupMemberRole(selectedGroup.id, memberUid, 'member', selectedGroup.memberDetails);
    if (success) {
      setActiveMemberMenu(null);
      refreshSelectedGroup();
    }
  };

  const handleTransferOwnership = async (memberUid) => {
    if (window.confirm("Are you sure you want to transfer ownership? You will become an Admin. This cannot be undone by you.")) {
      const success = await transferGroupOwnership(selectedGroup.id, memberUid, selectedGroup.memberDetails);
      if (success) {
        setActiveMemberMenu(null);
        refreshSelectedGroup();
      }
    }
  };

  const handleRemoveMember = async (memberUid) => {
    if (window.confirm("Are you sure you want to remove this member from the group?")) {
      const success = await removeGroupMember(selectedGroup.id, memberUid, selectedGroup.memberDetails, selectedGroup.members);
      if (success) {
        setActiveMemberMenu(null);
        refreshSelectedGroup();
      }
    }
  };

  const getMyGroupRole = () => {
    if (!selectedGroup || !selectedGroup.memberDetails) return 'member';
    const me = selectedGroup.memberDetails.find(m => m.uid === loggedInUser.uid);
    return me ? (me.role || 'member') : 'member';
  };

  const getMembersByRole = () => {
    if (!selectedGroup || !selectedGroup.memberDetails) return { owners: [], admins: [], members: [] };
    const owners = [];
    const admins = [];
    const members = [];
    selectedGroup.memberDetails.forEach(m => {
      const role = m.role || 'member'; 
      if (role === 'owner') owners.push(m);
      else if (role === 'admin') admins.push(m);
      else members.push(m);
    });
    return { owners, admins, members };
  };

  if (selectedGroup) {
    const myRole = getMyGroupRole();
    const { owners, admins, members } = getMembersByRole();
    const canManageMembers = myRole === 'owner' || myRole === 'admin';

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <button onClick={() => setSelectedGroup(null)} style={{ background: 'none', border: 'none', color: '#61dafb', cursor: 'pointer', marginBottom: '15px' }}>
          {/* RENAMED: Back to Community */}
          ← Back to Community
        </button>
        
        <div style={{ backgroundColor: '#282c34', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>{selectedGroup.name}</h2>
          <p style={{ color: '#ccc', marginTop: '5px' }}>{selectedGroup.description}</p>
        </div>

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

        {activeTab === 'posts' && (
          <div>
            <form onSubmit={handlePostSubmit} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="Share something..." value={newPostText} onChange={(e) => setNewPostText(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '20px', border: 'none', backgroundColor: '#3a3f4a', color: 'white' }} />
              <button type="submit" style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#61dafb', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Post</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {groupPosts.map(post => (
                <div key={post.id} style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#444', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {post.authorPhoto ? <img src={post.authorPhoto} alt={post.authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '10px', color: '#ccc' }}>{post.authorName?.charAt(0).toUpperCase()}</span>}
                    </div>
                    <strong>{post.authorName}</strong> • {post.createdAt?.toDate().toLocaleString()}
                  </div>
                  <div style={{ fontSize: '15px', marginLeft: '32px' }}>{post.text}</div>
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
            <p style={{ color: '#888', fontStyle: 'italic' }}>No links added yet.</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Members ({selectedGroup.memberDetails?.length || 0})</h3>
              {canManageMembers && (
                <button onClick={() => setShowAddMember(true)} style={{ padding: '8px 15px', backgroundColor: '#61dafb', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Member</button>
              )}
            </div>

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

            {['Owner', 'Admins', 'Members'].map(section => {
              let list = [];
              if (section === 'Owner') list = owners;
              if (section === 'Admins') list = admins;
              if (section === 'Members') list = members;

              if (list.length === 0) return null;

              return (
                <div key={section} style={{ marginBottom: '30px' }}>
                  <h4 style={{ borderBottom: '1px solid #666', paddingBottom: '5px', color: '#aaa', textTransform: 'uppercase', fontSize: '12px' }}>{section}</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {list.map(m => (
                      <li key={m.uid} style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid #61dafb' }}>
                            {m.photoURL ? <img src={m.photoURL} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '16px', color: '#ccc' }}>{m.name ? m.name.charAt(0).toUpperCase() : "?"}</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>{m.email}</div>
                          </div>
                        </div>

                        {/* Logic for showing ellipsis button */}
                        { (myRole === 'owner' && m.uid !== loggedInUser.uid) || 
                          (myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin' && m.uid !== loggedInUser.uid) ? (
                          <div style={{ position: 'relative' }}>
                            <button 
                              onClick={() => setActiveMemberMenu(activeMemberMenu === m.uid ? null : m.uid)}
                              style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer', padding: '0 10px' }}
                            >
                              ⋮
                            </button>
                            {activeMemberMenu === m.uid && (
                              <div style={{ 
                                position: 'absolute', right: 0, top: '100%', backgroundColor: '#222', 
                                border: '1px solid #555', borderRadius: '5px', zIndex: 10, width: '160px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
                              }}>
                                {myRole === 'owner' && m.role !== 'admin' && (
                                  <button onClick={() => handlePromote(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}>Promote to Admin</button>
                                )}
                                {myRole === 'owner' && m.role === 'admin' && (
                                  <button onClick={() => handleDemote(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}>Demote to Member</button>
                                )}
                                {myRole === 'owner' && (
                                  <button onClick={() => handleTransferOwnership(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderBottom: '1px solid #333' }}>Transfer Ownership</button>
                                )}
                                
                                {(myRole === 'owner' || (myRole === 'admin' && m.role !== 'admin' && m.role !== 'owner')) && (
                                  <button onClick={() => handleRemoveMember(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', borderBottom: '1px solid #333' }}>Remove from Group</button>
                                )}

                                <button onClick={() => setActiveMemberMenu(null)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>Cancel</button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        {/* RENAMED: My Communities */}
        <h2>My Communities</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '10px 15px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>{showCreateForm ? "Cancel" : "+ Create Group"}</button>
      </div>
      {showCreateForm && (
        <form onSubmit={handleCreateGroup} style={{ backgroundColor: '#3a3f4a', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3 style={{ marginTop: 0 }}>New Group</h3>
          <input type="text" placeholder="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} />
          <textarea placeholder="Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', minHeight: '60px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#61dafb', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Create</button>
        </form>
      )}
      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {myGroups.map(group => (
          <div key={group.id} onClick={() => setSelectedGroup(group)} style={{ backgroundColor: '#282c34', padding: '20px', borderRadius: '8px', border: '1px solid #444', cursor: 'pointer', transition: 'transform 0.2s' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>{group.name}</h3>
            <p style={{ margin: 0, color: '#ccc', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.description}</p>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>{group.memberDetails?.length || 0} Members</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Groups;