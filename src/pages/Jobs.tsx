import { Link } from 'react-router-dom';
import { Briefcase, ArrowLeft } from 'lucide-react';

export default function Jobs() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c39f6] to-[#a855f7] flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Jobs</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          Browse and apply to jobs across 50+ platforms. This feature is coming soon.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

