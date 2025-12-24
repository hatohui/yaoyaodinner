# Yaoyao-functions

[![Deployment](https://github.com/hatohui/yaoyao-functions/actions/workflows/deploy-lambda-code.yml/badge.svg)](https://github.com/hatohui/yaoyao-functions/actions/workflows/deploy-lambda-code.yml)

## General details

- API for [yaoyao-dinner]()
- Runs on: Lambda serverless with gin http adapter
- Region: `ap-southeast-1`

## Prerequisites

Required for development:

- Go 1.20+ (GOPATH/GOBIN configured)
- Docker (You can also directly use this without go installed)

Optional (Production):

- AWS CLI v2 configured with credentials and region (`ap-southeast-1`)
- Git and access to the repository on GitHub
- Terraform 1.5+ for infrastructure provisioning
