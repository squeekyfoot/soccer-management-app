import React from 'react';
import { useActionItems } from '../../../hooks/useActionItems';
import ActionItemRow from './ActionItemRow';
import Loading from '../../ui/Loading';
import EmptyState from '../../ui/EmptyState';

const ActionItemList = () => {
  const { items, loading, dismissItem } = useActionItems();

  if (loading) {
    return <Loading message="Checking your inbox..." />;
  }

  if (items.length === 0) {
    return (
      <EmptyState 
        message="You're all caught up!" 
        subMessage="No pending actions or invites."
      />
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Actions Needed</h3>
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
          {items.length}
        </span>
      </div>
      
      <div className="flex flex-col">
        {items.map((item) => (
          <ActionItemRow 
            key={item.id} 
            item={item} 
            onDismiss={dismissItem} 
          />
        ))}
      </div>
    </div>
  );
};

export default ActionItemList;