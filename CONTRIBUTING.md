# Contributing to GymFuel

## Development Setup

1. Copy `.env.example` to `.env`
2. Install dependencies: `pnpm install`
3. Start the database containers: `docker-compose up -d gymfuel-mongo gymfuel-redis`
4. Run the seed script: `pnpm --filter gymfuel-server run db:init && pnpm --filter gymfuel-server run db:seed`
5. Start development servers: `pnpm run dev:all`

## Commit Messages

We use Conventional Commits. A pre-commit hook will enforce this.

Format:
`<type>[optional scope]: <description>`

Examples:

- `feat(auth): add google sign-in`
- `fix(server): resolve race condition in seed script`
- `chore: update dependencies`

## Pull Requests

1. Create a feature branch from `main`
2. Ensure `pnpm run test:all` and `pnpm run typecheck:all` pass
3. Open a PR using the provided template
4. CI will run on your PR. All checks must pass before merging.
