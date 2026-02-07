"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/layout/app-layout";
import { UserPlus, AlertCircle, ArrowLeft } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { useCreatePatient } from "@/hooks";
import Link from "next/link";
import type { CreatePatientRequest } from "@/types";

interface FormData {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  mrn: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "male",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  mrn: "",
};

interface FieldError {
  field: keyof FormData;
  message: string;
}

function validateForm(data: FormData): FieldError[] {
  const errors: FieldError[] = [];
  if (!data.firstName.trim())
    errors.push({ field: "firstName", message: "First name is required" });
  if (!data.lastName.trim())
    errors.push({ field: "lastName", message: "Last name is required" });
  if (!data.birthDate)
    errors.push({ field: "birthDate", message: "Birth date is required" });
  else if (new Date(data.birthDate) > new Date())
    errors.push({ field: "birthDate", message: "Birth date cannot be in the future" });
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.push({ field: "email", message: "Invalid email address" });
  return errors;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Unknown" },
];

export default function NewPatientPage() {
  const router = useRouter();
  const { createPatient, loading: isSubmitting } = useCreatePatient();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());

  const errors = useMemo(() => validateForm(formData), [formData]);
  const errorMap = useMemo(() => {
    const map: Partial<Record<keyof FormData, string>> = {};
    errors.forEach((e) => { map[e.field] = e.message; });
    return map;
  }, [errors]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const showFieldError = (field: keyof FormData) =>
    touched.has(field) && errorMap[field];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(new Set(Object.keys(formData) as (keyof FormData)[]));
    if (errors.length > 0) {
      showError(errors[0].message);
      return;
    }

    try {
      const request: CreatePatientRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        addressLine: formData.addressLine.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        mrn: formData.mrn.trim() || undefined,
      };

      const result = await createPatient(request);
      success(`Patient "${formData.firstName} ${formData.lastName}" created successfully`);
      router.push(`/patients/${result.id}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create patient");
    }
  };

  const getTodayString = () => new Date().toISOString().split("T")[0];

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Add New Patient"
        description="Register a new patient in the system"
        icon={UserPlus}
        actions={
          <Link href="/patients" className="btn btn-ghost gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="animate-fade-in-up">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body space-y-6">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  First Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  className={`input input-bordered w-full ${showFieldError("firstName") ? "input-error" : ""}`}
                  disabled={isSubmitting}
                />
                {showFieldError("firstName") && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-error">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMap.firstName}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Last Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  className={`input input-bordered w-full ${showFieldError("lastName") ? "input-error" : ""}`}
                  disabled={isSubmitting}
                />
                {showFieldError("lastName") && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-error">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMap.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* DOB, Gender, MRN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Date of Birth <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  onBlur={() => handleBlur("birthDate")}
                  max={getTodayString()}
                  className={`input input-bordered w-full ${showFieldError("birthDate") ? "input-error" : ""}`}
                  disabled={isSubmitting}
                />
                {showFieldError("birthDate") && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-error">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMap.birthDate}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Gender <span className="text-error">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="select select-bordered w-full"
                  disabled={isSubmitting}
                >
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">MRN</label>
                <input
                  type="text"
                  placeholder="Medical Record Number"
                  value={formData.mrn}
                  onChange={(e) => handleChange("mrn", e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`input input-bordered w-full ${showFieldError("email") ? "input-error" : ""}`}
                  disabled={isSubmitting}
                />
                {showFieldError("email") && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-error">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errorMap.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-medium mb-2 block">Address</label>
              <input
                type="text"
                placeholder="Street Address"
                value={formData.addressLine}
                onChange={(e) => handleChange("addressLine", e.target.value)}
                className="input input-bordered w-full mb-3"
                disabled={isSubmitting}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="card-body pt-0">
            <div className="flex gap-3 justify-end">
              <Link href="/patients" className="btn btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.birthDate}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isSubmitting ? "Creating..." : "Create Patient"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </PageContainer>
  );
}
