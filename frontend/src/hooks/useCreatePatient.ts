"use client";

import { useState, useCallback } from "react";
import { usePatientService } from "@/services";
import type { CreatePatientRequest, PatientDetailDTO } from "@/types";

export interface UseCreatePatientResult {
  createPatient: (request: CreatePatientRequest) => Promise<PatientDetailDTO>;
  loading: boolean;
  error: Error | null;
}

export function useCreatePatient(): UseCreatePatientResult {
  const patientService = usePatientService();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPatient = useCallback(
    async (request: CreatePatientRequest): Promise<PatientDetailDTO> => {
      setLoading(true);
      setError(null);
      try {
        const result = await patientService.createPatient(request);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to create patient");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [patientService]
  );

  return { createPatient, loading, error };
}
