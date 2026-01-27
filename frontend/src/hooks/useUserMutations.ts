"use client";

import { useState, useCallback } from "react";
import { useUserManagementService } from "@/services";
import type {
  KeycloakUserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  AssignRolesRequestDTO,
  KeycloakRoleDTO,
} from "@/types/dto/user-management.dto";

interface MutationState {
  loading: boolean;
  error: Error | null;
}

export function useUserMutations() {
  const service = useUserManagementService();
  const [state, setState] = useState<MutationState>({ loading: false, error: null });

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setState({ loading: true, error: null });
      try {
        const result = await fn();
        setState({ loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Operation failed");
        setState({ loading: false, error });
        return null;
      }
    },
    []
  );

  const createUser = useCallback(
    (request: CreateUserRequestDTO) =>
      execute<KeycloakUserDTO>(() => service.createUser(request)),
    [service, execute]
  );

  const updateUser = useCallback(
    (id: string, request: UpdateUserRequestDTO) =>
      execute<KeycloakUserDTO>(() => service.updateUser(id, request)),
    [service, execute]
  );

  const deactivateUser = useCallback(
    (id: string) => execute<void>(() => service.deactivateUser(id)),
    [service, execute]
  );

  const reactivateUser = useCallback(
    (id: string) => execute<void>(() => service.reactivateUser(id)),
    [service, execute]
  );

  const sendPasswordReset = useCallback(
    (id: string) => execute<void>(() => service.sendPasswordReset(id)),
    [service, execute]
  );

  const assignRoles = useCallback(
    (id: string, request: AssignRolesRequestDTO) =>
      execute<KeycloakRoleDTO[]>(() => service.assignRoles(id, request)),
    [service, execute]
  );

  const terminateUserSessions = useCallback(
    (id: string) => execute<void>(() => service.terminateUserSessions(id)),
    [service, execute]
  );

  const requireMfa = useCallback(
    (id: string) => execute<void>(() => service.requireMfa(id)),
    [service, execute]
  );

  return {
    ...state,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    sendPasswordReset,
    assignRoles,
    terminateUserSessions,
    requireMfa,
  };
}
