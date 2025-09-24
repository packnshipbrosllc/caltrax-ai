import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Download, 
  Trash2, 
  Eye, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { hasAdminAccess } from '../../lib/security';

export default function AdminDashboard({ onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = getAllUsers();
    const userStats = getUserStats();
    const activity = getActivityLog();
    
    setUsers(allUsers);
    setStats(userStats);
    setActivityLog(activity);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'trial': return 'text-blue-400';
      case 'monthly': return 'text-green-400';
      case 'yearly': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (subscribed) => {
    return subscribed ? 'text-green-400' : 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={exportUserData}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={() => setShowConfirmClear(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Trial Users</p>
                <p className="text-2xl font-bold text-blue-400">{stats.trial}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Paid Users</p>
                <p className="text-2xl font-bold text-green-400">{stats.subscribed}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Monthly</p>
                <p className="text-2xl font-bold text-green-400">{stats.monthly}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-zinc-800/50 border-zinc-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 text-zinc-300">Email</th>
                  <th className="text-left py-3 px-4 text-zinc-300">Plan</th>
                  <th className="text-left py-3 px-4 text-zinc-300">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-300">Signup Date</th>
                  <th className="text-left py-3 px-4 text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-zinc-700/50 hover:bg-zinc-800/30"
                  >
                    <td className="py-3 px-4 text-white">{user.email}</td>
                    <td className={`py-3 px-4 font-medium ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </td>
                    <td className={`py-3 px-4 ${getStatusColor(user.subscribed)}`}>
                      {user.subscribed ? 'Active' : 'Trial'}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => setSelectedUser(user)}
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <Button
                onClick={() => setSelectedUser(null)}
                variant="outline"
                size="sm"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-sm">Email</label>
                <p className="text-white">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Plan</label>
                <p className={`font-medium ${getPlanColor(selectedUser.plan)}`}>
                  {selectedUser.plan}
                </p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Status</label>
                <p className={getStatusColor(selectedUser.subscribed)}>
                  {selectedUser.subscribed ? 'Active Subscription' : 'Free Trial'}
                </p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Signup Date</label>
                <p className="text-white">{formatDate(selectedUser.createdAt)}</p>
              </div>
              {selectedUser.trialEnds && (
                <div>
                  <label className="text-zinc-400 text-sm">Trial Ends</label>
                  <p className="text-yellow-400">{formatDate(selectedUser.trialEnds)}</p>
                </div>
              )}
              <div>
                <label className="text-zinc-400 text-sm">Customer ID</label>
                <p className="text-white font-mono text-sm">{selectedUser.customerId || 'N/A'}</p>
              </div>
              <div>
                <label className="text-zinc-400 text-sm">Subscription ID</label>
                <p className="text-white font-mono text-sm">{selectedUser.subscriptionId || 'N/A'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-800 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
              <h3 className="text-xl font-bold text-white">Clear All User Data</h3>
            </div>
            <p className="text-zinc-300 mb-6">
              This will permanently delete all user data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  clearAllUserData();
                  loadData();
                  setShowConfirmClear(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Yes, Clear All
              </Button>
              <Button
                onClick={() => setShowConfirmClear(false)}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
