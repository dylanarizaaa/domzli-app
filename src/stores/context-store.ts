import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ContextState = {
  /** Organización con la que navega el usuario; se valida contra my_contexts() en cada arranque. */
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
  /** Invitación abierta antes de iniciar sesión; se retoma después de autenticarse. */
  pendingInviteToken: string | null;
  setPendingInviteToken: (token: string | null) => void;
};

export const useContextStore = create<ContextState>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
      pendingInviteToken: null,
      setPendingInviteToken: (token) => set({ pendingInviteToken: token }),
    }),
    { name: 'domzli.context', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
