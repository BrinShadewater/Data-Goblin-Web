# Security

## Reporting

Report security issues privately through the maintainer's GitHub profile. Do not include exploit details in public issues.

## Scope

This project is mostly static/generated content plus a React reader app. Main concerns:

- Build and deployment configuration
- Contribution/contact form behavior
- Third-party links in receipts and sources
- Generated content integrity
- Local storage behavior for notes, bookmarks, and reading state

## Maintenance

Run the project verification command before deployment:

```shell
cd app
npm run verify
```

Keep source and receipt links reviewable. The verification trail is part of the product.
