import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';


interface SubscriptionData {
  tier: string;
  status: string;
  autoAppliesLimit: number;
  currentPeriodEnd: string | null;
}

export default function PricingSuccessPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Fetch updated subscription data
    api.get('/subscriptions/current')
      .then(res => {
        if (res.success && (res.data as any)?.subscription) {
          setSubscription((res.data as any).subscription);
        }
      })
      .catch(err => {
        console.error('Failed to fetch subscription:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c39f6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Welcome to {subscription?.tier || 'Professional'}!</h1>
        
        <p className="text-gray-400 mb-8">
          Your subscription has been activated successfully. You now have access to unlimited auto-applies and all premium features.
        </p>

        <div className="bg-[#13131f] border border-green-500/20 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Your New Features</h3>
          <ul className="space-y-3 text-left">
            {[
              'Unlimited auto-applies',
              'All 50+ job portals',
              'Advanced AI matching',
              'Priority support',
              'Resume optimization',
              'Salary insights'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {subscription?.currentPeriodEnd && (
          <p className="text-sm text-gray-500 mb-6">
            Your subscription renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link 
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c39f6] to-[#a855f7] text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(124,57,246,0.4)] transition-all"
          >
            <Sparkles className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            to="/jobs"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
