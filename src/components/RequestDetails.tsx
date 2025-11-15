import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, MaintenanceRequest, RequestComment } from '../lib/supabase';
import { ArrowLeft, Send, Clock, User } from 'lucide-react';

interface RequestDetailsProps {
  request: MaintenanceRequest;
  onClose: () => void;
  isLandlord?: boolean;
}

export default function RequestDetails({ request, onClose, isLandlord }: RequestDetailsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assigned_to || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [request.id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('request_comments')
        .select('*, profiles(full_name)')
        .eq('request_id', request.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('request_comments')
        .insert({
          request_id: request.id,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({
          status,
          assigned_to: assignedTo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;
      alert('Request updated successfully');
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="capitalize">{request.category}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    request.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.priority} priority
                  </span>
                  <span>•</span>
                  <span>{new Date(request.created_at).toLocaleString()}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                request.status === 'completed' ? 'bg-green-100 text-green-800' :
                request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{request.description}</p>

            {request.photo_url && (
              <img
                src={request.photo_url}
                alt="Request photo"
                className="w-full max-w-2xl h-auto rounded-lg mb-4"
              />
            )}

            {isLandlord && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Update Request</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <input
                      type="text"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Staff name"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateRequest}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Request'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>

            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {comment.profiles?.full_name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
