# Security Policy

## Supported Versions

We actively support the following versions of Beyond Foundry:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Beyond Foundry, please report it responsibly:

### How to Report

1. **DO NOT** open a public issue for security vulnerabilities
2. Email us directly at: [security@beyond-foundry.dev](mailto:security@beyond-foundry.dev)
3. Or use GitHub's private vulnerability reporting feature

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes or mitigations
- Your contact information

### Response Timeline

- **Initial Response**: Within 24 hours
- **Status Update**: Within 72 hours
- **Resolution Timeline**: Varies based on severity, but typically within 7-14 days

### Disclosure Policy

- We will work with you to understand and resolve the issue promptly
- We will keep you informed throughout the investigation and resolution process
- We will publicly disclose the vulnerability only after a fix is available
- We will credit you in our security advisories (unless you prefer to remain anonymous)

## Security Considerations

### Authentication

Beyond Foundry handles D&D Beyond authentication through:

- Secure token management
- No storage of user credentials
- Proper session handling

### Data Handling

- User data is processed locally within FoundryVTT
- No user data is transmitted to third-party services (except D&D Beyond API)
- All D&D Beyond API communications use HTTPS

### Module Security

- All code is open source and auditable
- Dependencies are regularly updated
- Automated security scanning is enabled

## Best Practices for Users

1. **Keep Updated**: Always use the latest version of Beyond Foundry
2. **Secure Your Instance**: Ensure your FoundryVTT instance is properly secured
3. **Monitor Access**: Regularly review who has access to your FoundryVTT world
4. **Report Issues**: Report any suspicious behavior immediately

## Dependencies

We monitor our dependencies for security vulnerabilities using:

- GitHub Dependabot
- npm audit
- Automated CI/CD security checks

## Contact

For security-related questions or concerns:

- Security Email: [security@beyond-foundry.dev](mailto:security@beyond-foundry.dev)
- General Contact: [Open an Issue](https://github.com/beyond-foundry/beyond-foundry/issues)

Thank you for helping keep Beyond Foundry secure!
