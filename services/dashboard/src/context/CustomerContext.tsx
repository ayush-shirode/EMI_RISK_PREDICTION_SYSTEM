'use client';
import { createContext, useContext, useState } from 'react';
import { CUSTOMERS, Customer } from '@/lib/customers';

interface CustomerContextType {
  selectedCustomer: Customer;
  setSelectedCustomer: (c: Customer) => void;
  allCustomers: Customer[];
}

const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(CUSTOMERS[0]);
  return (
    <CustomerContext.Provider value={{ selectedCustomer, setSelectedCustomer, allCustomers: CUSTOMERS }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
}
