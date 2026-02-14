using Hl7.Fhir.Model;
using NHapi.Model.V251.Segment;

namespace FhirHubServer.Api.Features.Hl7Ingestion.Converters;

public static class PatientConverter
{
    public static Patient FromPid(PID pid)
    {
        var patient = new Patient();

        // MRN identifier
        var patientIds = pid.GetPatientIdentifierList();
        if (patientIds.Length > 0)
        {
            var mrn = patientIds[0];
            patient.Identifier.Add(new Identifier
            {
                System = "http://hospital.example.org/mrn",
                Value = mrn.IDNumber.Value
            });
        }

        // Name
        var patientNames = pid.GetPatientName();
        if (patientNames.Length > 0)
        {
            var hl7Name = patientNames[0];
            var humanName = new HumanName
            {
                Family = hl7Name.FamilyName.Surname.Value
            };
            if (!string.IsNullOrEmpty(hl7Name.GivenName.Value))
                humanName.GivenElement.Add(new FhirString(hl7Name.GivenName.Value));
            patient.Name.Add(humanName);
        }

        // Date of birth
        var dob = pid.DateTimeOfBirth;
        if (!string.IsNullOrEmpty(dob?.Time?.Value))
        {
            patient.BirthDate = FormatHl7Date(dob.Time.Value);
        }

        // Gender
        var gender = pid.AdministrativeSex?.Value;
        patient.Gender = gender?.ToUpperInvariant() switch
        {
            "M" => AdministrativeGender.Male,
            "F" => AdministrativeGender.Female,
            "O" => AdministrativeGender.Other,
            _ => AdministrativeGender.Unknown
        };

        // Address
        var addresses = pid.GetPatientAddress();
        if (addresses.Length > 0)
        {
            var hl7Addr = addresses[0];
            var address = new Address();
            if (!string.IsNullOrEmpty(hl7Addr.StreetAddress?.StreetOrMailingAddress?.Value))
                address.LineElement.Add(new FhirString(hl7Addr.StreetAddress.StreetOrMailingAddress.Value));
            if (!string.IsNullOrEmpty(hl7Addr.City?.Value))
                address.City = hl7Addr.City.Value;
            if (!string.IsNullOrEmpty(hl7Addr.StateOrProvince?.Value))
                address.State = hl7Addr.StateOrProvince.Value;
            if (!string.IsNullOrEmpty(hl7Addr.ZipOrPostalCode?.Value))
                address.PostalCode = hl7Addr.ZipOrPostalCode.Value;
            patient.Address.Add(address);
        }

        // Phone
        var phones = pid.GetPhoneNumberHome();
        if (phones.Length > 0 && !string.IsNullOrEmpty(phones[0].TelephoneNumber?.Value))
        {
            patient.Telecom.Add(new ContactPoint
            {
                System = ContactPoint.ContactPointSystem.Phone,
                Value = phones[0].TelephoneNumber.Value,
                Use = ContactPoint.ContactPointUse.Home
            });
        }

        return patient;
    }

    private static string FormatHl7Date(string hl7Date)
    {
        // HL7 dates are YYYYMMDD or YYYYMMDDHHmmss — FHIR wants YYYY-MM-DD
        if (hl7Date.Length >= 8)
            return $"{hl7Date[..4]}-{hl7Date[4..6]}-{hl7Date[6..8]}";
        return hl7Date;
    }
}
