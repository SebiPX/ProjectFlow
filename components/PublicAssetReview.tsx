import React, { useEffect, useState } from 'react';
import { getPublicAsset, submitAssetReview } from '../services/api/assets';
import { Icon } from './ui/Icon';
import { FileIcon } from './ui/FileIcon';

interface PublicAssetReviewProps {
  assetId: string;
}

export const PublicAssetReview: React.FC<PublicAssetReviewProps> = ({ assetId }) => {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getPublicAsset(assetId)
      .then(data => {
        setAsset(data);
        setFeedback('');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load asset');
        setLoading(false);
      });
  }, [assetId]);

  const handleSubmit = async (status: string) => {
    if (!feedback.trim() && status === 'changes_requested') {
      alert('Please provide feedback on what needs to be changed.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAssetReview(assetId, status, feedback);
      // Don't overwrite the full asset feedback note on frontend to avoid appending twice if they hit buttons rapidly,
      // but to show it immediately we could append locally. Let's just setSuccess(true).
      setSuccess(true);
    } catch (err: any) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">Asset Not Available</h1>
          <p className="text-gray-500">{error || 'This link may have expired or you lack permissions.'}</p>
        </div>
      </div>
    );
  }

  // Use file_url from our new backend endpoint which fetches a presigned url if possible
  const previewUrl = asset.file_url || asset.storage_path;
  const isImage = asset.file_type?.startsWith('image/') || asset.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = asset.file_type?.startsWith('video/') || asset.name?.match(/\.(mp4|webm|mov)$/i);
  const isPdf = asset.file_type === 'application/pdf' || asset.name?.endsWith('.pdf');

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center">
      {/* Header with Branding */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Schickeria</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">Project Review</p>
          <p className="font-bold text-gray-900">{asset.project_name || 'Project Name'}</p>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Asset Preview */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <FileIcon fileType={asset.file_type} fileName={asset.name} className="w-8 h-8" />
              <div>
                <h2 className="font-semibold text-gray-900 line-clamp-1" title={asset.name}>{asset.name}</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{asset.category?.replace('_', ' ')}</p>
              </div>
            </div>
            {asset.status === 'approved' && (
              <span className="px-3 py-1 bg-green-100 text-green-700 font-medium text-xs rounded-full flex items-center gap-1">
                <Icon path="M5 13l4 4L19 7" className="w-3 h-3" /> Approved
              </span>
            )}
            {asset.status === 'changes_requested' && (
              <span className="px-3 py-1 bg-red-100 text-red-700 font-medium text-xs rounded-full flex items-center gap-1">
                <Icon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-3 h-3" /> Changes Requested
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-[#f8fafc] flex items-center justify-center p-4 relative min-h-[500px]">
            {isImage ? (
              <img src={previewUrl} alt={asset.name} className="max-w-full max-h-[700px] object-contain rounded shadow-sm" />
            ) : isVideo ? (
              <video src={previewUrl} controls className="max-w-full max-h-[700px] w-full rounded shadow-sm" />
            ) : isPdf ? (
              <iframe src={previewUrl} className="w-full h-[700px] rounded shadow-sm" title={asset.name} />
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center">
                <FileIcon fileType={asset.file_type} fileName={asset.name} className="w-24 h-24 mb-4 opacity-50" />
                <p>Preview not available for this file type.</p>
                <a href={previewUrl} download className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition">
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Review Controls */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Review Status</h3>
            <p className="text-gray-500 text-sm mb-6">
              Please review the asset and let us know if it's approved or if you need changes.
            </p>

            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon path="M5 13l4 4L19 7" className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-bold text-green-900 mb-1">Feedback Submitted</h4>
                <p className="text-green-700 text-sm">Thank you! Your feedback has been sent to the team.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="E.g., Looks great! / Please change the color of the text..."
                    className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleSubmit('changes_requested')}
                    disabled={submitting}
                    className="flex flex-col items-center justify-center p-4 border border-red-200 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" className="w-6 h-6 mb-2" />
                    <span className="font-semibold text-sm text-center">Request<br/>Changes</span>
                  </button>

                  <button
                    onClick={() => handleSubmit('approved')}
                    disabled={submitting}
                    className="flex flex-col items-center justify-center p-4 border border-green-200 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition disabled:opacity-50 shadow-sm"
                  >
                    <Icon path="M5 13l4 4L19 7" className="w-6 h-6 mb-2" />
                    <span className="font-semibold text-sm text-center">Approve<br/>Asset</span>
                  </button>
                </div>
              </div>
            )}

            {/* Existing Feedback History */}
            {asset.feedback_note && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 text-gray-400" />
                  Feedback History
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans leading-relaxed">
                    {asset.feedback_note}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
