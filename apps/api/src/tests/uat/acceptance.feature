Feature: Stratify production acceptance
  Scenario: Organization user signs in with enterprise identity and generates framework
    Given an enterprise user authenticated through OIDC or SAML
    When the user uploads data and requests recommendations
    Then a signed framework export artifact is produced

  Scenario: Personal user manages personal strategy workspace
    Given a personal user registered via /auth/register/personal
    When the user ingests personal KPI files
    Then analysis and framework planning are available without org setup
