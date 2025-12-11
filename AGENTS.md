## Project Context

Project Name: **WordCraft** - A language learning platform

### Core Features

1. **Vocabulary Import**: Import vocabulary lists with optional contextual sentences
2. **AI Analysis**: AI analyzes context and vocabulary to provide:
   - Word meanings and definitions
   - Part of speech identification
   - Usage patterns and examples
3. **Interactive Review**: Users create sentences using target words
4. **AI Validation**: System validates grammar and usage correctness
5. **Flashcard System**: Contextual learning with spaced repetition

### Technical Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)
- **Deployment**: [Vercel](http://vercel.com/) + [Bun](https://bun.sh)

## Development Commands

### Essential Commands

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server

### Database Commands

- `bun db:generate` - Generate migration files
- `bun db:migrate` - Run database migrations
- `bun db:seed` - Seed database with default user/team

## How to Contribute

- Dependencies must be managed by [renovate](renovate.json)
- Always run `bun build` before committing to ensure build passes
- Update [seed script](lib/db/seed.ts) after [DB schema](lib/db/schema.ts) changes to ensure all functionality is properly seeded
