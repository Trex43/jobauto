import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Subscription Canceled</h1>
        
        <p className="text-gray-400 mb-8">
          Your subscription was canceled. You won't be charged and your access will continue until the end of your current billing period.
        </p>

        <div className="bg-[#13131f] border border-gray-800 rounded-2xl p-6 mb-8">
          <p className="text-gray-400 mb-4">
            No worries! You can upgrade to Professional or Enterprise anytime to unlock unlimited auto-applies and premium features.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#13131f] border border-gray-700 text-white font-semibold rounded-xl hover:border-[#7c39f6] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          
          <Link 
            to="/preferences"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all"
          >
            <CreditCard className="w-5 h-5" />
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
