import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function StoreSelector() {
  const { currentStore, availableStores, setCurrentStore, isOrgAdmin, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Show selector for org admins (even with 1 store, to show current context)
  // For non-org admins, show current store name if available
  if (!isOrgAdmin) {
    if (currentStore) {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white">
          {user?.organization.logo_url && (
            <img
              src={user.organization.logo_url}
              alt={user.organization.name}
              className="w-6 h-6 object-contain"
            />
          )}
          <span className="text-sm font-medium text-gray-700">{currentStore.name}</span>
        </div>
      );
    }
    return null;
  }

  useEffect(() => {
    if (availableStores.length > 0 && !currentStore) {
      // Set first store as default
      setCurrentStore(availableStores[0]);
    }
  }, [availableStores, currentStore, setCurrentStore]);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between space-x-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {user?.organization.logo_url && (
            <img
              src={user.organization.logo_url}
              alt={user.organization.name}
              className="w-5 h-5 object-contain flex-shrink-0"
            />
          )}
          <span className="text-sm font-medium text-gray-700 truncate">
            {currentStore?.name || 'Select Store'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            {availableStores.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  setCurrentStore(store);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${
                  currentStore?.id === store.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.code}</div>
                </div>
                {currentStore?.id === store.id && (
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

