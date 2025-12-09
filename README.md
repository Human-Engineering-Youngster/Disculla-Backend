# Disculla Backend

This is the backend application for the Disculla project, built with [NestJS](https://nestjs.com/).

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Jest](https://jestjs.io/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Prerequisites

- Node.js (v20 or later recommended)
- pnpm

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Documentation

For more detailed documentation, please refer to the `docs` directory:

- [Architecture](docs/architecture.md)
- [URI Definitions](docs/URI.md)
- [Database Tables](docs/table.md)

## License

This project is [UNLICENSED](LICENSE).
