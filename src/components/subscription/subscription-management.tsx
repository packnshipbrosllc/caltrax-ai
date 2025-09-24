'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end?: number;
  plan: {
    nickname: string;
    amount: number;
    interval: string;
  };
}

export default function SubscriptionManagement() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/get-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user?.id, // Using Clerk user ID as customer identifier
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCancelling(true);
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Reload subscription data
      await loadSubscription();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trialing':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading subscription...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-error">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
          <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
          <p className="text-base-content/70 mb-4">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <Button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{subscription.plan.nickname}</h3>
            <p className="text-sm text-base-content/70">
              {formatPrice(subscription.plan.amount)} per {subscription.plan.interval}
            </p>
          </div>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-base-content/70">Current Period</p>
            <p className="font-medium">
              {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
            </p>
          </div>
          {subscription.trial_end && (
            <div>
              <p className="text-base-content/70">Trial Ends</p>
              <p className="font-medium">{formatDate(subscription.trial_end)}</p>
            </div>
          )}
        </div>

        {subscription.cancel_at_period_end ? (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Your subscription will be cancelled at the end of the current period.</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="flex-1"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/pricing'}
              className="flex-1"
            >
              Change Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
