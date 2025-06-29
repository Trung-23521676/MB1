import React, { createContext, useState, useContext, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu cho Context
interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

// Tạo Context với một giá trị mặc định
const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

// Tạo Provider component
export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

// Tạo một custom hook để sử dụng Context dễ dàng hơn
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};