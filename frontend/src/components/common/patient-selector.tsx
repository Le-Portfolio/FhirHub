"use client";

import { useState, useCallback } from "react";
import { Search, X, User } from "@/components/ui/icons";
import { usePatients } from "@/hooks";

interface PatientSelectorProps {
  onSelect: (patient: { id: string; name: string; mrn: string; birthDate: string }) => void;
  selectedPatient?: { id: string; name: string; mrn: string; birthDate: string } | null;
  onClear?: () => void;
}

export function PatientSelector({ onSelect, selectedPatient, onClear }: PatientSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: patients, loading } = usePatients({
    query: query.length >= 2 ? query : undefined,
    pageSize: 8,
    immediate: query.length >= 2,
  });

  const handleSelect = useCallback(
    (patient: { id: string; name: string; mrn: string; birthDate: string }) => {
      onSelect(patient);
      setQuery("");
      setIsOpen(false);
    },
    [onSelect]
  );

  if (selectedPatient) {
    return (
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-primary/10 text-primary rounded-full w-10">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="font-semibold">{selectedPatient.name}</p>
                <p className="text-sm text-base-content/60">
                  MRN: {selectedPatient.mrn} | DOB: {selectedPatient.birthDate}
                </p>
              </div>
            </div>
            {onClear && (
              <button
                onClick={onClear}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Change patient"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="text-sm font-medium mb-2 block">
        Select Patient <span className="text-error">*</span>
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
        <input
          type="text"
          placeholder="Search patients by name or MRN..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          className="input input-bordered w-full pl-10"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-base-content/60">
              <span className="loading loading-spinner loading-sm mr-2" />
              Searching...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-4 text-center text-base-content/60">
              No patients found
            </div>
          ) : (
            patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() =>
                  handleSelect({
                    id: patient.id,
                    name: patient.name,
                    mrn: patient.mrn,
                    birthDate: patient.birthDate,
                  })
                }
                className="w-full flex items-center gap-3 p-3 hover:bg-base-200 transition-colors text-left"
              >
                <div className="avatar placeholder">
                  <div className="bg-primary/10 text-primary rounded-full w-8">
                    <User className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patient.name}</p>
                  <p className="text-xs text-base-content/60">
                    MRN: {patient.mrn} | {patient.gender} | DOB: {patient.birthDate}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
