import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Member } from '../types/Members';
import { mockMembers as initialMembers } from '../data/mockMembers';
import { resolveStatus } from '../utils/helper';

interface MembersContextType {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'joinDate' | 'status' | 'attendance' | 'totalVisitsThisMonth'>) => void;
  updateMember: (member: Member) => void;
  pauseMember: (id: string) => void;
  resumeMember: (id: string) => void;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const addMember = (newMemberData: Omit<Member, 'id' | 'joinDate' | 'status' | 'attendance' | 'totalVisitsThisMonth'>) => {
    // Generate unique numeric ID
    const nextId = (Math.max(0, ...members.map(m => parseInt(m.id, 10) || 0)) + 1).toString();
    const today = new Date().toISOString().split('T')[0];
    
    // Resolve status based on end date
    const status = resolveStatus(newMemberData.planEndDate);

    const fullMember: Member = {
      ...newMemberData,
      id: nextId,
      joinDate: today,
      status,
      totalVisitsThisMonth: 0,
      attendance: [],
    };

    setMembers(prev => [fullMember, ...prev]);
  };

  const updateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const pauseMember = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: 'paused' as const,
        };
      }
      return m;
    }));
  };

  const resumeMember = (id: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const resolved = resolveStatus(m.planEndDate, false);
        return {
          ...m,
          status: resolved,
        };
      }
      return m;
    }));
  };

  return (
    <MembersContext.Provider value={{ members, addMember, updateMember, pauseMember, resumeMember }}>
      {children}
    </MembersContext.Provider>
  );
}

export function useMembers() {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error('useMembers must be used within a MembersProvider');
  }
  return context;
}
