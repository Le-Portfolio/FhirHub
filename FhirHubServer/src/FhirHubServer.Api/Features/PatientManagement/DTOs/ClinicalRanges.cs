namespace FhirHubServer.Api.Features.PatientManagement.DTOs;

/// <summary>
/// Clinical reference ranges for vital signs validation.
/// Ranges are based on standard adult clinical guidelines.
/// </summary>
public static class ClinicalRanges
{
    public static class Systolic
    {
        public const decimal Min = 40;
        public const decimal Max = 250;
        public const decimal WarningLow = 90;
        public const decimal WarningHigh = 140;
        public const decimal CriticalLow = 70;
        public const decimal CriticalHigh = 180;
        public const string Unit = "mmHg";
        public const string NormalRange = "90-140 mmHg";
    }

    public static class Diastolic
    {
        public const decimal Min = 20;
        public const decimal Max = 150;
        public const decimal WarningLow = 60;
        public const decimal WarningHigh = 90;
        public const decimal CriticalLow = 40;
        public const decimal CriticalHigh = 120;
        public const string Unit = "mmHg";
        public const string NormalRange = "60-90 mmHg";
    }

    public static class HeartRate
    {
        public const decimal Min = 30;
        public const decimal Max = 250;
        public const decimal WarningLow = 60;
        public const decimal WarningHigh = 100;
        public const decimal CriticalLow = 40;
        public const decimal CriticalHigh = 150;
        public const string Unit = "bpm";
        public const string NormalRange = "60-100 bpm";
    }

    public static class Temperature
    {
        public const decimal Min = 90;
        public const decimal Max = 110;
        public const decimal WarningLow = 97;
        public const decimal WarningHigh = 99.5m;
        public const decimal CriticalLow = 95;
        public const decimal CriticalHigh = 104;
        public const string Unit = "°F";
        public const string NormalRange = "97-99.5 °F";
    }

    public static class RespiratoryRate
    {
        public const decimal Min = 4;
        public const decimal Max = 60;
        public const decimal WarningLow = 12;
        public const decimal WarningHigh = 20;
        public const decimal CriticalLow = 8;
        public const decimal CriticalHigh = 30;
        public const string Unit = "/min";
        public const string NormalRange = "12-20 /min";
    }

    public static class OxygenSaturation
    {
        public const decimal Min = 50;
        public const decimal Max = 100;
        public const decimal WarningLow = 95;
        public const decimal WarningHigh = 100;
        public const decimal CriticalLow = 90;
        public const decimal CriticalHigh = 100;
        public const string Unit = "%";
        public const string NormalRange = "95-100%";
    }

    public static class Weight
    {
        public const decimal Min = 1;
        public const decimal Max = 1000;
        public const string Unit = "lbs";
    }

    /// <summary>
    /// Evaluates a vital sign value and returns the warning level.
    /// </summary>
    public static WarningLevel EvaluateVital(string vitalType, decimal value)
    {
        return vitalType.ToLowerInvariant() switch
        {
            "systolic" => EvaluateRange(value, Systolic.CriticalLow, Systolic.CriticalHigh, Systolic.WarningLow, Systolic.WarningHigh),
            "diastolic" => EvaluateRange(value, Diastolic.CriticalLow, Diastolic.CriticalHigh, Diastolic.WarningLow, Diastolic.WarningHigh),
            "heartrate" => EvaluateRange(value, HeartRate.CriticalLow, HeartRate.CriticalHigh, HeartRate.WarningLow, HeartRate.WarningHigh),
            "temperature" => EvaluateRange(value, Temperature.CriticalLow, Temperature.CriticalHigh, Temperature.WarningLow, Temperature.WarningHigh),
            "respiratoryrate" => EvaluateRange(value, RespiratoryRate.CriticalLow, RespiratoryRate.CriticalHigh, RespiratoryRate.WarningLow, RespiratoryRate.WarningHigh),
            "oxygensaturation" => EvaluateLowOnly(value, OxygenSaturation.CriticalLow, OxygenSaturation.WarningLow),
            _ => WarningLevel.Normal
        };
    }

    private static WarningLevel EvaluateRange(decimal value, decimal criticalLow, decimal criticalHigh, decimal warningLow, decimal warningHigh)
    {
        if (value < criticalLow || value > criticalHigh)
            return WarningLevel.Critical;
        if (value < warningLow || value > warningHigh)
            return WarningLevel.Warning;
        return WarningLevel.Normal;
    }

    private static WarningLevel EvaluateLowOnly(decimal value, decimal criticalLow, decimal warningLow)
    {
        if (value < criticalLow)
            return WarningLevel.Critical;
        if (value < warningLow)
            return WarningLevel.Warning;
        return WarningLevel.Normal;
    }
}

public enum WarningLevel
{
    Normal,
    Warning,
    Critical
}
