import React from 'react';
import Skeleton from './Skeleton.jsx';

export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 py-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Row 1: Core Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="pro-card p-5 bg-surface space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Row 2: Bilan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="pro-card p-5 bg-surface space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>

      {/* Big Chart Area */}
      <div className="pro-card p-6 bg-surface h-64 flex flex-col justify-between">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    </div>
  );
}
