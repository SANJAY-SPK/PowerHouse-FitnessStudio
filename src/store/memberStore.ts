import { create } from 'zustand';
import { Member } from '../types/Members';
import { memberService } from '@/services/memberService';

interface MemberState {
  members: Member[];
  selectedMember: Member | null;
  isLoading: boolean;
  error: string | null;

  fetchMembers: (status?: string) => Promise<void>;
  fetchMemberById: (id: number) => Promise<void>;
  addMember: (data: any) => Promise<void>;
  updateMember: (id: number, data: any) => Promise<void>;
  renewMember: (id: number, data: any) => Promise<void>;
  checkIn: (id: number) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  clearSelected: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  selectedMember: null,
  isLoading: false,
  error: null,

  fetchMembers: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const data = await memberService.getAll(status);
      set({ members: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMemberById: async (id) => {
  set({ isLoading: true, error: null, selectedMember: null }); // clear stale member
  try {
    const data = await memberService.getById(id);
    set({ selectedMember: data, isLoading: false });
  } catch (err: any) {
    set({ error: err.message, isLoading: false });
    // Don't leave isLoading: true — that's why you see spinner forever
  }
},

  addMember: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newMember = await memberService.create(data);
      set((state) => ({
        members: [newMember, ...state.members],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateMember: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      let updated: Member;
      // If only a status field is being changed, use the lightweight PATCH endpoint
      if (data.status && Object.keys(data).length === 1) {
        updated = await memberService.patchStatus(id, data.status);
      } else {
        updated = await memberService.update(id, data);
      }
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? updated : m)),
        selectedMember: updated,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  renewMember: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await memberService.renew(id, data);
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? updated : m)),
        selectedMember: updated,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  checkIn: async (id) => {
    try {
      const updated = await memberService.checkIn(id);
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? updated : m)),
        selectedMember: updated,
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteMember: async (id) => {
    try {
      await memberService.remove(id);
      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  clearSelected: () => set({ selectedMember: null }),
}));