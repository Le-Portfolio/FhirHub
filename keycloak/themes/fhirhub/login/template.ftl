<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html<#if locale??> lang="${locale.currentLanguageTag}"</#if>>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>${msg("loginTitle",(realm.displayName!'FHIRHub'))}</title>
    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
</head>
<body>
    <div id="kc-login">
        <div class="fhirhub-card">
            <!-- Branding -->
            <div class="fhirhub-branding">
                <div class="fhirhub-brand-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                </div>
                <h1 class="fhirhub-brand-title">FHIRHub Premium</h1>
                <p class="fhirhub-brand-subtitle">Integration Engine</p>
            </div>

            <!-- Card -->
            <div class="fhirhub-card-inner">
                <div class="fhirhub-accent-bar"></div>
                <div class="fhirhub-card-body">

                    <#-- Page header -->
                    <#nested "header">

                    <#-- Alert messages -->
                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="alert alert-${message.type}">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <#-- Form content -->
                    <#nested "form">

                    <#-- Info section (registration link, etc.) -->
                    <#if displayInfo>
                        <#nested "info">
                    </#if>

                </div>
            </div>

            <!-- Footer -->
            <div class="fhirhub-footer">
                HIPAA Compliant &middot; SOC 2 &middot; HL7v2.5.1 &middot; FHIR R4
            </div>
        </div>
    </div>
</body>
</html>
</#macro>
