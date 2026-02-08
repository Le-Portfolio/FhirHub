<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
        <h2 class="fhirhub-card-heading">Sign in</h2>
        <p class="fhirhub-card-description">Enter your credentials to access the dashboard</p>
    </#if>

    <#if section = "form">
        <#if realm.password>
            <form id="kc-form-login" action="${url.loginAction}" method="post">
                <div class="fhirhub-form-group">
                    <label for="username">
                        <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                    </label>
                    <input id="username" name="username" type="text"
                           value="${(login.username!'')}"
                           autofocus autocomplete="username"
                           aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />
                    <#if messagesPerField.existsError('username','password')>
                        <span class="fhirhub-field-error">
                            ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                        </span>
                    </#if>
                </div>

                <div class="fhirhub-form-group">
                    <label for="password">${msg("password")}</label>
                    <input id="password" name="password" type="password"
                           autocomplete="current-password"
                           aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />
                </div>

                <div class="fhirhub-form-options">
                    <#if realm.rememberMe && !usernameHidden??>
                        <div class="checkbox-wrapper">
                            <input id="rememberMe" name="rememberMe" type="checkbox"
                                   <#if login.rememberMe??>checked</#if> />
                            <label for="rememberMe">${msg("rememberMe")}</label>
                        </div>
                    <#else>
                        <div></div>
                    </#if>

                    <#if realm.resetPasswordAllowed>
                        <a href="${url.loginResetCredentialsUrl}" class="fhirhub-link-small">
                            ${msg("doForgotPassword")}
                        </a>
                    </#if>
                </div>

                <input name="credentialId" type="hidden" value="${(auth.selectedCredential!'')}">
                <button type="submit" class="fhirhub-btn-primary">${msg("doLogIn")}</button>
            </form>
        </#if>
    </#if>

    <#if section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="fhirhub-registration-link">
                <span>${msg("noAccount")}</span>
                <a href="${url.registrationUrl}">${msg("doRegister")}</a>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>
