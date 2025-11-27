import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"; 
import { db } from "../firebase";
import UserSearch from './UserSearch';
import { COLORS, MOBILE_BREAKPOINT } from '../constants';
import { Users, Search, UserPlus, Globe } from 'lucide-react';
import Header from './common/Header'; 
import Button from './common/Button'; 
import Input from './common/Input';
import Card from './common/Card';
import Avatar from './common/Avatar';

function Groups() {
  const { 
    fetchUserGroups, createGroup, createGroupPost, 
    addGroupMembers, updateGroupMemberRole, transferGroupOwnership, removeGroupMember,
    submitJoinRequest,
    subscribeToUserRequests, subscribeToDiscoverableRosters,
    loggedInUser 
  } = useAuth();

  const [currentView, setCurrentView] = useState('hub');
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const [discoverableTeams, setDiscoverableTeams] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

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
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadGroups = useCallback(async () => {
    if (!loggedInUser) return;
    setIsLoading(true);
    const data = await fetchUserGroups(loggedInUser.uid);
    setMyGroups(data);
    setIsLoading(false);
  }, [loggedInUser, fetchUserGroups]);

  useEffect(() => { if (loggedInUser) loadGroups(); }, [loggedInUser, loadGroups]);

  useEffect(() => {
    if (!selectedGroup) return;
    setCurrentView('detail');
    const postsRef = collection(db, "groups", selectedGroup.id, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroupPosts(posts);
    });
    return () => unsubscribe();
  }, [selectedGroup]);

  useEffect(() => {
      if (currentView === 'findTeams') {
          setIsLoading(true);
          const unsubRosters = subscribeToDiscoverableRosters((data) => { setDiscoverableTeams(data); setIsLoading(false); });
          const unsubRequests = subscribeToUserRequests((data) => { setMyRequests(data); });
          return () => { unsubRosters(); unsubRequests(); };
      }
  }, [currentView, subscribeToDiscoverableRosters, subscribeToUserRequests]); 

  const refreshSelectedGroup = async () => {
    if (!selectedGroup) return;
    const groupRef = doc(db, "groups", selectedGroup.id);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) setSelectedGroup({ id: groupSnap.id, ...groupSnap.data() });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    const success = await createGroup({ name: newGroupName, description: newGroupDesc, links: [] });
    if (success) { alert("Group created!"); setShowCreateForm(false); setNewGroupName(""); setNewGroupDesc(""); loadGroups(); }
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
    if (success) { alert("Members added!"); setShowAddMember(false); setSelectedMemberEmails([]); refreshSelectedGroup(); }
  };

  const handleJoinRequest = async (team) => { await submitJoinRequest(team.id, team.name, team.createdBy); };
  const getRequestStatus = (teamId) => { const req = myRequests.find(r => r.rosterId === teamId); return req ? req.status : null; };

  const handlePromote = async (uid) => { const success = await updateGroupMemberRole(selectedGroup.id, uid, 'admin', selectedGroup.memberDetails); if(success) { setActiveMemberMenu(null); refreshSelectedGroup(); }};
  const handleDemote = async (uid) => { const success = await updateGroupMemberRole(selectedGroup.id, uid, 'member', selectedGroup.memberDetails); if(success) { setActiveMemberMenu(null); refreshSelectedGroup(); }};
  const handleTransfer = async (uid) => { if (window.confirm("Transfer ownership?")) { const success = await transferGroupOwnership(selectedGroup.id, uid, selectedGroup.memberDetails); if(success) { setActiveMemberMenu(null); refreshSelectedGroup(); }}};
  const handleRemove = async (uid) => { if (window.confirm("Remove member?")) { const success = await removeGroupMember(selectedGroup.id, uid, selectedGroup.memberDetails, selectedGroup.members); if(success) { setActiveMemberMenu(null); refreshSelectedGroup(); }}};

  const getMyGroupRole = () => {
    if (!selectedGroup || !selectedGroup.memberDetails) return 'member';
    const me = selectedGroup.memberDetails.find(m => m.uid === loggedInUser.uid);
    return me ? (me.role || 'member') : 'member';
  };

  // --- FIX: Removed fixed height and added box-sizing to prevent overlap ---
  const HubButton = ({ title, desc, icon: Icon, onClick, color = COLORS.primary }) => (
    <Card 
        onClick={onClick} 
        hoverable 
        style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column', 
            alignItems: 'center', 
            justifyContent: isMobile ? 'flex-start' : 'center', 
            textAlign: isMobile ? 'left' : 'center',
            
            // Desktop: Enforce min-height. Grid will stretch this automatically.
            minHeight: isMobile ? 'auto' : '220px', 
            
            // FIX: Removed height: '100%' to prevent overflow issues
            // The Grid container's 'stretch' behavior will handle the height.
            
            marginBottom: 0,
            padding: '20px',
            
            // FIX: Ensures padding is calculated inside the dimensions
            boxSizing: 'border-box' 
        }}
    >
      <Icon 
        size={isMobile ? 32 : 40} 
        color={color} 
        style={{ 
            marginBottom: isMobile ? 0 : '15px', 
            marginRight: isMobile ? '15px' : 0,
            flexShrink: 0 
        }} 
      />
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>{desc}</div>
      </div>
    </Card>
  );

  if (currentView === 'hub') {
    return (
      <div className="view-container">
        <Header title="Community" style={{ maxWidth: '1000px', margin: '0 auto' }} />
        <div className="view-content">
          <div style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            width: '100%', 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            // Desktop rows are at least 220px. Cards will stretch to fill this.
            gridAutoRows: isMobile ? 'auto' : 'minmax(220px, auto)',
            gap: '20px', 
            minHeight: 0 
          }}>
            <HubButton title="Explore Communities" desc="Discover new groups and communities" icon={Globe} onClick={() => alert("Feature coming soon!")} />
            <HubButton title="Find Teams" desc="Search for local teams to join" icon={Search} onClick={() => setCurrentView('findTeams')} />
            <HubButton title="Find Players" desc="Connect with other players (Coming Soon)" icon={UserPlus} color="#888" onClick={() => alert("Feature coming soon!")} />
            <HubButton title="My Groups" desc="Teams, groups and communities that I've already joined" icon={Users} onClick={() => setCurrentView('myGroups')} />
          </div>
        </div>
      </div>
    );
  }

  // ... (Rest of the file remains unchanged: myGroups, findTeams, detail)
  if (currentView === 'myGroups') {
    return (
      <div className="view-container">
        <Header title="My Groups" style={{ maxWidth: '1000px', margin: '0 auto' }} actions={<><Button onClick={() => setCurrentView('hub')} variant="secondary" style={{ padding: '5px 10px', fontSize: '14px' }}>Back</Button><Button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '5px 10px', fontSize: '14px' }}>{showCreateForm ? "Cancel" : "+ Create"}</Button></>} />
        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {showCreateForm && (
              <Card style={{ marginBottom: '30px', padding: '20px' }}>
                <h3 style={{ marginTop: 0 }}>New Group</h3>
                <form onSubmit={handleCreateGroup}>
                    <Input label="Group Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                    <Input label="Description" multiline value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                    <Button type="submit">Create</Button>
                </form>
              </Card>
            )}
            {isLoading ? <p>Loading...</p> : myGroups.length === 0 ? <p style={{ color: '#888', fontStyle: 'italic' }}>You haven't joined any groups yet.</p> : (
              <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {myGroups.map(group => (
                  <Card key={group.id} onClick={() => setSelectedGroup(group)} hoverable>
                    <h3 style={{ margin: '0 0 10px 0', color: COLORS.primary }}>{group.name}</h3>
                    <p style={{ margin: 0, color: '#ccc', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.description}</p>
                    <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>{group.memberDetails?.length || 0} Members</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'findTeams') {
      return (
        <div className="view-container">
            <Header title="Find Teams" style={{ maxWidth: '1000px', margin: '0 auto' }} actions={<Button onClick={() => setCurrentView('hub')} variant="secondary" style={{ padding: '5px 10px', fontSize: '14px' }}>Back</Button>} />
            <div className="view-content">
              <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                {isLoading ? <p>Loading teams...</p> : discoverableTeams.length === 0 ? <p style={{ color: '#888' }}>No teams found.</p> : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {discoverableTeams.map(team => {
                            const status = getRequestStatus(team.id);
                            const alreadyJoined = team.playerIDs?.includes(loggedInUser.uid);
                            return (
                                <Card key={team.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: 'white' }}>{team.name}</h3>
                                        <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>{team.season} • {team.players?.length || 0}/{team.maxCapacity} Players</p>
                                    </div>
                                    <div>
                                        {alreadyJoined ? <span style={{ color: COLORS.success, fontSize: '14px', fontWeight: 'bold' }}>Joined</span> : status === 'pending' ? <span style={{ color: '#ffc107', fontSize: '14px', fontWeight: 'bold' }}>Pending</span> : <Button onClick={() => handleJoinRequest(team)}>Request to Join</Button>}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
              </div>
            </div>
        </div>
      );
  }

  if (currentView === 'detail' && selectedGroup) {
       const myRole = getMyGroupRole();
       const renderMembers = () => {
            const owners = []; const admins = []; const members = [];
            selectedGroup.memberDetails?.forEach(m => {
                if (m.role === 'owner') owners.push(m);
                else if (m.role === 'admin') admins.push(m);
                else members.push(m);
            });
            return ['Owner', 'Admins', 'Members'].map(section => {
                let list = (section === 'Owner' ? owners : section === 'Admins' ? admins : members);
                if (list.length === 0) return null;
                return (
                    <div key={section} style={{ marginBottom: '30px' }}>
                      <h4 style={{ borderBottom: '1px solid #666', paddingBottom: '5px', color: '#aaa', textTransform: 'uppercase', fontSize: '12px' }}>{section}</h4>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {list.map(m => (
                          <li key={m.uid} style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <Avatar src={m.photoURL} text={m.name} size={40} style={{ border: `1px solid ${COLORS.primary}` }} />
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>{m.email}</div>
                              </div>
                            </div>
                            { (myRole === 'owner' && m.uid !== loggedInUser.uid) || (myRole === 'admin' && m.role !== 'owner' && m.role !== 'admin' && m.uid !== loggedInUser.uid) ? (
                              <div style={{ position: 'relative' }}>
                                <button onClick={() => setActiveMemberMenu(activeMemberMenu === m.uid ? null : m.uid)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer', padding: '0 10px' }}>⋮</button>
                                {activeMemberMenu === m.uid && (
                                  <div style={{ position: 'absolute', right: 0, top: '100%', backgroundColor: '#222', border: '1px solid #555', borderRadius: '5px', zIndex: 10, width: '160px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                    {myRole === 'owner' && m.role !== 'admin' && <button onClick={() => handlePromote(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}>Promote to Admin</button>}
                                    {myRole === 'owner' && m.role === 'admin' && <button onClick={() => handleDemote(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid #333' }}>Demote to Member</button>}
                                    {myRole === 'owner' && <button onClick={() => handleTransfer(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', borderBottom: '1px solid #333' }}>Transfer Ownership</button>}
                                    <button onClick={() => handleRemove(m.uid)} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', borderBottom: '1px solid #333' }}>Remove</button>
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
            });
        };

      return (
      <div className="view-container">
        <Header title={selectedGroup.name} style={{ maxWidth: '1000px', margin: '0 auto' }} actions={<Button onClick={() => { setSelectedGroup(null); setCurrentView('myGroups'); }} variant="secondary" style={{ padding: '5px 10px', fontSize: '14px' }}>Back</Button>} />
        <div className="view-content">
          <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <p style={{ color: '#ccc', marginTop: '5px' }}>{selectedGroup.description}</p>
            <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: '20px' }}>
              {['posts', 'about', 'members'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === tab ? COLORS.primary : '#888', borderBottom: activeTab === tab ? `2px solid ${COLORS.primary}` : 'none', fontWeight: activeTab === tab ? 'bold' : 'normal' }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
              ))}
            </div>
            {activeTab === 'posts' && (
              <div>
                <form onSubmit={handlePostSubmit} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                     <Input placeholder="Share something..." value={newPostText} onChange={(e) => setNewPostText(e.target.value)} style={{ marginBottom: 0, borderRadius: '20px' }} />
                  </div>
                  <Button type="submit" style={{ borderRadius: '20px', height: '42px' }}>Post</Button>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {groupPosts.map(post => (
                    <Card key={post.id}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar src={post.authorPhoto} text={post.authorName} size={24} />
                        <strong>{post.authorName}</strong> • {post.createdAt?.toDate().toLocaleString()}
                      </div>
                      <div style={{ fontSize: '15px', marginLeft: '32px' }}>{post.text}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'about' && (<div><h3>About this Group</h3><p>{selectedGroup.description || "No description."}</p></div>)}
            {activeTab === 'members' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3>Members ({selectedGroup.memberDetails?.length || 0})</h3>
                  {(myRole === 'owner' || myRole === 'admin') && <Button onClick={() => setShowAddMember(true)}>+ Add Member</Button>}
                </div>
                {showAddMember && (
                  <Card style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginTop: 0 }}>Add Members to Group</h4>
                    <UserSearch onSelectionChange={setSelectedMemberEmails} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <Button onClick={handleAddMembers} style={{ flex: 1 }}>Add Selected</Button>
                      <Button onClick={() => { setShowAddMember(false); setSelectedMemberEmails([]); }} variant="secondary" style={{ flex: 1 }}>Cancel</Button>
                    </div>
                  </Card>
                )}
                {renderMembers()}
              </div>
            )}
          </div>
        </div>
      </div>
      );
  }

  return <div>Error: View state unknown</div>;
}

export default Groups;