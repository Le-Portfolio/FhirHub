<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>

    <#if section = "header">
        <h2 class="fhirhub-card-heading">Create account</h2>
        <p class="fhirhub-card-description">Register for a FHIRHub account</p>
    </#if>

    <#if section = "form">
        <form id="kc-register-form" action="${url.registrationAction}" method="post"
              style="display: flex; flex-direction: column; gap: 0.75rem;">

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="fhirhub-form-group">
                    <label for="firstName">${msg("firstName")}</label>
                    <input id="firstName" name="firstName" type="text"
                           value="${(register.formData.firstName!'')}"
                           aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>" />
                    <#if messagesPerField.existsError('firstName')>
                        <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                    </#if>
                </div>

                <div class="fhirhub-form-group">
                    <label for="lastName">${msg("lastName")}</label>
                    <input id="lastName" name="lastName" type="text"
                           value="${(register.formData.lastName!'')}"
                           aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>" />
                    <#if messagesPerField.existsError('lastName')>
                        <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                    </#if>
                </div>
            </div>

            <div class="fhirhub-form-group">
                <label for="email">${msg("email")}</label>
                <input id="email" name="email" type="email"
                       value="${(register.formData.email!'')}"
                       autocomplete="email"
                       aria-invalid="<#if messagesPerField.existsError('email')>true</#if>" />
                <#if messagesPerField.existsError('email')>
                    <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                </#if>
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div class="fhirhub-form-group">
                    <label for="username">${msg("username")}</label>
                    <input id="username" name="username" type="text"
                           value="${(register.formData.username!'')}"
                           autocomplete="username"
                           aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" />
                    <#if messagesPerField.existsError('username')>
                        <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                    </#if>
                </div>
            </#if>

            <#if passwordRequired??>
                <div class="fhirhub-form-group">
                    <label for="password">${msg("password")}</label>
                    <input id="password" name="password" type="password"
                           autocomplete="new-password"
                           aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
                    <#if messagesPerField.existsError('password')>
                        <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                    </#if>
                </div>

                <div class="fhirhub-form-group">
                    <label for="password-confirm">${msg("passwordConfirm")}</label>
                    <input id="password-confirm" name="password-confirm" type="password"
                           autocomplete="new-password"
                           aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                    <#if messagesPerField.existsError('password-confirm')>
                        <span class="fhirhub-field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                    </#if>
                </div>
            </#if>

            <button type="submit" class="fhirhub-btn-primary">${msg("doRegister")}</button>

            <div class="fhirhub-registration-link" style="border-top: none; margin-top: 0; padding-top: 0;">
                <span>Already have an account?</span>
                <a href="${url.loginUrl}">${msg("backToLogin")}</a>
            </div>
        </form>
    </#if>

</@layout.registrationLayout>
