import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, LogOut, BarChart3, FileText, User, Calendar, MapPin, DollarSign, TrendingUp, Activity, Package } from 'lucide-react';

const API_URL = 'https://backend-c4ud.onrender.com';

export default function ManagerPanel() {
  const [token, setToken] = useState(localStorage.getItem('managerToken'));
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [actionForm, setActionForm] = useState({ notes: '', trackingId: '', courierName: '', trackingInfo: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      
      if (res.ok && (data.user.role === 'manager' || data.user.role === 'admin')) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('managerToken', data.token);
      } else {
        alert('❌ Manager/Admin access only!');
      }
    } catch (error) {
      alert('❌ Login failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('managerToken');
  };

 const fetchData = async () => {
  try {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // ✅ FIXED ENDPOINT
    const invoicesUrl = `${API_URL}/invoices/status/${activeTab}`;
    
    console.log('📥 Fetching invoices from:', invoicesUrl);
    
    const [invoicesRes, statsRes] = await Promise.all([
      fetch(invoicesUrl, { headers }),
      fetch(`${API_URL}/manager/dashboard/stats`, { headers })
    ]);

    const invoicesData = await invoicesRes.json();
    const statsData = await statsRes.json();
    
    console.log('✅ Invoices received:', invoicesData.length);
    console.log('✅ Stats received:', statsData);
    
    setInvoices(invoicesData);
    setStats(statsData);
    setLoading(false);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    setLoading(false);
  }
};

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, activeTab]);

 const handleApprove = async (invoiceId) => {
  if (!window.confirm('✅ Approve this invoice?')) return;
  
  setLoading(true);
  try {
    // ✅ FIXED ENDPOINT
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        status: 'approved',
        managerNotes: actionForm.notes 
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('✅ Invoice approved successfully!');
      setShowDetails(false);
      setActionForm({ notes: '', trackingId: '', courierName: '', trackingInfo: '' });
      fetchData();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
  setLoading(false);
};

const handleReject = async (invoiceId) => {
  const reason = prompt('❌ Enter rejection reason:');
  if (!reason) return;

  setLoading(true);
  try {
    // ✅ FIXED ENDPOINT
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        status: 'rejected',
        managerNotes: reason 
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert('❌ Invoice rejected');
      setShowDetails(false);
      fetchData();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
  setLoading(false);
};

const handleStatusUpdate = async (invoiceId, newStatus) => {
  setLoading(true);
  try {
    // ✅ FIXED ENDPOINT
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/order-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        orderStatus: newStatus,
        trackingId: actionForm.trackingId,
        courierName: actionForm.courierName,
        trackingInfo: actionForm.trackingInfo
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      let message = `✅ Status updated: ${newStatus.toUpperCase()}`;
      
      if (data.commissionAwarded && data.commissionAwarded > 0) {
        message += `\n\n💰 Agent Commission: PKR ${data.commissionAwarded.toFixed(2)}`;
      }
      
      alert(message);
      setActionForm({ notes: '', trackingId: '', courierName: '', trackingInfo: '' });
      fetchData();
    } else {
      alert('❌ Error: ' + data.message);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
  setLoading(false);
};
  const getStatusColor = (status) => {
    return {
      pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
      approved: { bg: '#D1FAE5', text: '#065F46', border: '#34D399' },
      rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' }
    }[status] || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
  };

  const getOrderColor = (status) => {
    return {
      pending: { bg: '#F3F4F6', text: '#6B7280' },
      confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
      processing: { bg: '#E0E7FF', text: '#4338CA' },
      dispatched: { bg: '#FEF3C7', text: '#92400E' },
      delivered: { bg: '#D1FAE5', text: '#065F46' },
      cancelled: { bg: '#FEE2E2', text: '#991B1B' }
    }[status] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  // LOGIN SCREEN
  if (!token) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px'
      }}>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        
        <div className="card shadow-lg" style={{ maxWidth: '440px', width: '100%', borderRadius: '20px' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <BarChart3 size={40} color="white" />
              </div>
              <h2 className="fw-bold mb-2">Manager Panel</h2>
              <p className="text-muted">Invoice & Order Management</p>
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control form-control-lg"
                style={{ borderRadius: '12px', padding: '12px 16px' }}
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                placeholder="manager@test.com"
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className="form-control form-control-lg"
                style={{ borderRadius: '12px', padding: '12px 16px' }}
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              onClick={handleLogin}
              className="btn btn-lg w-100 text-white fw-semibold"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '14px',
                border: 'none'
              }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <div className="text-center mt-4">
              <small className="text-muted">Demo: manager@test.com / manager123</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD - MODERN DESIGN
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      
      {/* Modern Gradient Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)',
        marginBottom: '30px'
      }}>
        <div className="container-fluid px-4 py-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <BarChart3 size={32} color="white" />
              </div>
              <div>
                <h3 className="text-white mb-0 fw-bold">Manager Dashboard</h3>
                <p className="text-white mb-0 opacity-75" style={{ fontSize: '14px' }}>
                  <User size={14} style={{ marginBottom: '2px' }} /> {user?.name}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="btn btn-light d-flex align-items-center gap-2 fw-semibold"
              style={{ borderRadius: '12px', padding: '12px 24px' }}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards - MODERN */}
      {stats && (
        <div className="container-fluid px-4 mb-4">
          <div className="row g-4">
            {/* Pending Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                borderLeft: '4px solid #F59E0B'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Clock size={26} color="#F59E0B" />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: '#92400E', fontSize: '40px' }}>{stats.pendingInvoices}</h2>
                  <p className="mb-0" style={{ color: '#92400E', fontSize: '15px', fontWeight: '600' }}>Pending Review</p>
                </div>
              </div>
            </div>

            {/* Approved Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                borderLeft: '4px solid #10B981'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle size={26} color="#10B981" />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: '#065F46', fontSize: '40px' }}>{stats.approvedInvoices}</h2>
                  <p className="mb-0" style={{ color: '#065F46', fontSize: '15px', fontWeight: '600' }}>Approved Orders</p>
                </div>
              </div>
            </div>

            {/* Rejected Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                borderLeft: '4px solid #EF4444'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <XCircle size={26} color="#EF4444" />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: '#991B1B', fontSize: '40px' }}>{stats.rejectedInvoices}</h2>
                  <p className="mb-0" style={{ color: '#991B1B', fontSize: '15px', fontWeight: '600' }}>Rejected</p>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
                borderLeft: '4px solid #6366F1'
              }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TrendingUp size={26} color="#6366F1" />
                    </div>
                  </div>
                  <h2 className="fw-bold mb-1" style={{ color: '#3730A3', fontSize: '32px' }}>
                    PKR {(stats.totalRevenue / 1000).toFixed(0)}K
                  </h2>
                  <p className="mb-0" style={{ color: '#3730A3', fontSize: '15px', fontWeight: '600' }}>Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - MODERN */}
      <div className="container-fluid px-4 mb-4">
        <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="d-flex" style={{ borderBottom: '2px solid #E2E8F0' }}>
            {[
              { key: 'pending', label: 'Pending', icon: <Clock size={18} />, count: stats?.pendingInvoices || 0 },
              { key: 'approved', label: 'Approved', icon: <CheckCircle size={18} />, count: stats?.approvedInvoices || 0 },
              { key: 'rejected', label: 'Rejected', icon: <XCircle size={18} />, count: stats?.rejectedInvoices || 0 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="btn border-0 flex-fill d-flex align-items-center justify-content-center gap-2"
                style={{
                  padding: '18px 24px',
                  borderRadius: '0',
                  fontWeight: '600',
                  fontSize: '15px',
                  color: activeTab === tab.key ? '#667eea' : '#64748B',
                  borderBottom: activeTab === tab.key ? '3px solid #667eea' : 'none',
                  background: activeTab === tab.key ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="badge" style={{
                  background: activeTab === tab.key ? '#667eea' : '#E2E8F0',
                  color: activeTab === tab.key ? 'white' : '#64748B',
                  padding: '4px 10px',
                  fontSize: '13px',
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List - MODERN CARDS */}
      <div className="container-fluid px-4 pb-5">
        {invoices.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: '16px' }}>
            <FileText size={80} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
            <h4 className="fw-bold mb-2" style={{ color: '#475569' }}>No {activeTab} invoices</h4>
            <p className="mb-0" style={{ color: '#94A3B8' }}>Invoices will appear here when agents create them</p>
          </div>
        ) : (
          <div className="row g-4">
            {invoices.map((invoice) => {
              const statusStyle = getStatusColor(invoice.status);
              const orderStyle = invoice.orderStatus ? getOrderColor(invoice.orderStatus) : null;
              
              return (
                <div key={invoice._id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100 position-relative" style={{ 
                    borderRadius: '16px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}>
                    <div className="card-body p-4">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="fw-bold mb-1" style={{ color: '#1E293B' }}>{invoice.invoiceNumber}</h5>
                          <p className="mb-0 d-flex align-items-center gap-1" style={{ fontSize: '13px', color: '#64748B' }}>
                            <Calendar size={14} />
                            {new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `2px solid ${statusStyle.border}`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {invoice.status}
                        </span>
                      </div>

                      {/* Details Box */}
                      <div className="mb-3" style={{ 
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        padding: '14px'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <User size={15} style={{ color: '#667eea', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Customer:</span>
                          <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '700', marginLeft: 'auto', textAlign: 'right' }}>
                            {invoice.customer?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <MapPin size={15} style={{ color: '#667eea', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>City:</span>
                          <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '700', marginLeft: 'auto', textAlign: 'right' }}>
                            {invoice.customer?.city || 'N/A'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Activity size={15} style={{ color: '#667eea', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Agent:</span>
                          <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: '700', marginLeft: 'auto', textAlign: 'right' }}>
                            {invoice.createdBy?.name || 'Unknown'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <DollarSign size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>Amount:</span>
                          <span style={{ fontSize: '16px', color: '#10B981', fontWeight: '800', marginLeft: 'auto', textAlign: 'right' }}>
                            PKR {invoice.grandTotal?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>

                      {/* Order Status Badge */}
                      {orderStyle && (
                        <div className="mb-3">
                          <span style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            background: orderStyle.bg,
                            color: orderStyle.text,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            <Package size={13} />
                            {invoice.orderStatus}
                          </span>
                        </div>
                      )}

                      {/* View Button */}
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowDetails(true);
                        }}
                        className="btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          borderRadius: '12px',
                          padding: '14px',
                          border: 'none',
                          fontSize: '15px'
                        }}
                      >
                        <Eye size={19} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Details Modal - CONTINUE IN NEXT MESSAGE */}
      {showDetails && selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          overflowY: 'auto',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="card border-0 shadow-lg" style={{ 
            maxWidth: '900px', 
            width: '100%', 
            borderRadius: '20px', 
            maxHeight: '90vh', 
            overflowY: 'auto' 
          }}>
            {/* Modal Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px 20px 0 0',
              padding: '24px'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="text-white mb-1 fw-bold d-flex align-items-center gap-2">
                    <FileText size={28} />
                    Invoice #{selectedInvoice.invoiceNumber}
                  </h4>
                  <p className="text-white mb-0 opacity-90" style={{ fontSize: '14px' }}>
                    Created by: <strong>{selectedInvoice.createdBy?.name || 'Unknown Agent'}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="btn btn-light fw-semibold"
                  style={{ borderRadius: '10px', padding: '10px 20px' }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Customer Info */}
              <div className="card border-0 mb-4" style={{ 
                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
borderRadius: '12px'
}}>
<div className="card-body p-4">
<h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0369A1' }}>
<User size={18} />
Customer Information
</h6>
<div className="row g-3">
<div className="col-md-6">
<small className="text-muted d-block mb-1">Name</small>
<strong style={{ color: '#0C4A6E' }}>{selectedInvoice.customer?.name}</strong>
</div>
<div className="col-md-6">
<small className="text-muted d-block mb-1">Phone</small>
<strong style={{ color: '#0C4A6E' }}>{selectedInvoice.customer?.phone}</strong>
</div>
<div className="col-md-6">
<small className="text-muted d-block mb-1">City</small>
<strong style={{ color: '#0C4A6E' }}>{selectedInvoice.customer?.city || 'N/A'}</strong>
</div>
<div className="col-md-6">
<small className="text-muted d-block mb-1">Invoice Date</small>
<strong style={{ color: '#0C4A6E' }}>
{new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB')}
</strong>
</div>
</div>
</div>
</div>
{/* Items Table */}
          <div className="mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#1E293B' }}>
              <Package size={18} />
              Order Items
            </h6>
            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    <th style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Item Name</th>
                    <th style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Quantity</th>
                    <th style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Price</th>
                    <th style={{ fontWeight: '600', fontSize: '13px', color: '#475569' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '14px', color: '#1E293B' }}>{item.itemName}</td>
                      <td style={{ fontSize: '14px', color: '#64748B' }}>{item.quantity}</td>
                      <td style={{ fontSize: '14px', color: '#64748B' }}>PKR {item.sellingPrice?.toLocaleString()}</td>
                      <td style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
                        PKR {item.totalPrice?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#D1FAE5' }}>
                  <tr>
                    <td colSpan="3" className="text-end fw-bold" style={{ color: '#065F46', fontSize: '15px' }}>
                      Grand Total:
                    </td>
                    <td className="fw-bold" style={{ color: '#10B981', fontSize: '18px' }}>
                      PKR {selectedInvoice.grandTotal?.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Current Status */}
          {selectedInvoice.status === 'approved' && (
            <div className="alert" style={{ 
              background: getOrderColor(selectedInvoice.orderStatus).bg, 
              border: 'none',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="d-block mb-1" style={{ color: getOrderColor(selectedInvoice.orderStatus).text, fontWeight: '500' }}>
                    Current Order Status
                  </small>
                  <span className="fw-bold" style={{ 
                    color: getOrderColor(selectedInvoice.orderStatus).text,
                    fontSize: '18px',
                    textTransform: 'uppercase'
                  }}>
                    {selectedInvoice.orderStatus}
                  </span>
                </div>
                {selectedInvoice.trackingId && (
                  <div className="text-end">
                    <small className="d-block mb-1" style={{ color: getOrderColor(selectedInvoice.orderStatus).text }}>
                      Tracking ID
                    </small>
                    <strong style={{ color: getOrderColor(selectedInvoice.orderStatus).text }}>
                      {selectedInvoice.trackingId}
                    </strong>
                    {selectedInvoice.courierName && (
                      <small className="d-block" style={{ color: getOrderColor(selectedInvoice.orderStatus).text }}>
                        via {selectedInvoice.courierName}
                      </small>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions for Pending Invoices */}
          {selectedInvoice.status === 'pending' && (
            <div>
              <h6 className="fw-bold mb-3">Manager Actions</h6>
              
              <div className="mb-3">
                <label className="form-label fw-semibold">Manager Notes (Optional)</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: '10px' }}
                  rows="3"
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({...actionForm, notes: e.target.value})}
                  placeholder="Add notes about this invoice..."
                />
              </div>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <button
                    onClick={() => handleApprove(selectedInvoice._id)}
                    disabled={loading}
                    className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{ borderRadius: '10px', padding: '14px' }}
                  >
                    <CheckCircle size={20} />
                    {loading ? 'Processing...' : 'Approve Invoice'}
                  </button>
                </div>
                <div className="col-md-6">
                  <button
                    onClick={() => handleReject(selectedInvoice._id)}
                    disabled={loading}
                    className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{ borderRadius: '10px', padding: '14px' }}
                  >
                    <XCircle size={20} />
                    {loading ? 'Processing...' : 'Reject Invoice'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Status Update for Approved Invoices */}
          {selectedInvoice.status === 'approved' && (
            <div>
              <h6 className="fw-bold mb-3">Update Order Status & Tracking</h6>
              
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Tracking ID</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    placeholder="e.g., TCS123456789"
                    value={actionForm.trackingId}
                    onChange={(e) => setActionForm({...actionForm, trackingId: e.target.value})}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Courier Name</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    placeholder="e.g., TCS, Leopards"
                    value={actionForm.courierName}
                    onChange={(e) => setActionForm({...actionForm, courierName: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Additional Info</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: '10px' }}
                  rows="2"
                  placeholder="Tracking notes..."
                  value={actionForm.trackingInfo}
                  onChange={(e) => setActionForm({...actionForm, trackingInfo: e.target.value})}
                />
              </div>
              
              <div className="row g-2">
                {['confirmed', 'processing', 'dispatched', 'delivered'].map(status => (
                  <div className="col-6 col-md-3" key={status}>
                    <button
                      onClick={() => handleStatusUpdate(selectedInvoice._id, status)}
                      disabled={loading || selectedInvoice.orderStatus === status}
                      className={`btn w-100 fw-semibold text-capitalize ${
                        selectedInvoice.orderStatus === status ? 'btn-secondary' : 'btn-outline-primary'
                      }`}
                      style={{ borderRadius: '10px', padding: '12px', fontSize: '13px' }}
                    >
                      {status}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manager Notes Display */}
          {selectedInvoice.managerNotes && (
            <div className="alert alert-warning mt-3" style={{ borderRadius: '10px' }}>
              <small className="fw-semibold d-block mb-1">Manager Notes:</small>
              <p className="mb-0">{selectedInvoice.managerNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
);
}