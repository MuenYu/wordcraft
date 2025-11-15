# Agent Coding Guidelines

## Project Context

Project Name: **WordCraft** - An Language Learning platform

### Core Features

1. **Vocabulary Import**: Users import word/phrase lists with optional contextual sentences
2. **AI Analysis**: AI analyzes context and vocabulary, outputs:
   - Word meanings and definitions
   - Part of speech identification
   - Usage patterns and examples
3. **Interactive Review**: Users create sentences with target words
4. **AI Validation**: System checks grammar and usage correctness
5. **Flashcard System**: Contextual learning with spaced repetition

### Technical Stack

- **Framework**: Next.js with App Router
- **Database**: Cloudflare D1 with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Cloudflare Pages (configured with Wrangler)
- **Package Manager**: Bun
- **Runtime**: Bun (local development), Cloudflare Workers (production)

## Coding Standards

### Code Organization

- Follow module-based structure in `/src/modules/`
- Separate concerns: components, actions, models, schemas, utils
- Use consistent naming conventions
- Group related functionality in feature modules

### React/Next.js Patterns

- Use server components by default
- Mark client components with `'use client'` directive
- Implement proper error boundaries
- Use Next.js App Router patterns

### Database & ORM

- Use Drizzle for all database operations
- Define schemas in `/src/db/schema.ts`
- Generate migration files with meaningful name
- Follow established query patterns

### State Management

- Use React hooks for local state
- Implement proper form handling
- Use server actions for mutations
- Handle loading and error states

### UI/UX Guidelines

- Use shadcn/ui components consistently
- Follow responsive design
- Implement proper accessibility features
- Use consistent spacing and typography
- TODO: Design guide is on the roadmap

## Task-Specific Guidelines

### Bug Fixes

1. Reproduce the issue
2. Identify root cause
3. Implement minimal fix
4. Add regression test
5. Run full test suite

### Feature Development

1. Understand requirements
2. Design solution architecture
3. Implement incrementally
4. Add appropriate tests
5. Update documentation

### Code Reviews

1. Check for security vulnerabilities
2. Verify code style consistency
3. Ensure proper error handling
4. Validate performance implications
5. Confirm test coverage

## Security Best Practices

- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Sanitize user inputs
- Follow principle of least privilege

## Performance Guidelines

- Optimize database queries
- Implement proper caching strategies
- Use React.memo for expensive components
- Minimize bundle size
- Implement proper image optimization

## Development Workflow

1. Create feature branch
2. Implement changes incrementally
3. Run tests and linting
4. Commit with descriptive messages
5. Create pull request for review

## Troubleshooting

- Check browser console for errors
- Verify environment variables
- Review database connection
- Check API route functionality
- Validate component props and state

## Common Patterns

### Form Handling

```typescript
// Use server actions for form submissions
async function createTodo(formData: FormData) {
	'use server';
	// Implementation
}
```

### Database Queries

```typescript
// Use Drizzle patterns
const todos = await db.select().from(todosTable).where(eq(todosTable.userId, userId));
```

### Error Handling

```typescript
// Consistent error patterns
try {
	// Operation
} catch (error) {
	throw new Error(`Operation failed: ${error.message}`);
}
```

## Testing Strategy

- Unit tests for utilities and helpers
- Integration tests for API routes
- Component tests for UI interactions
- End-to-end tests for critical flows

## Documentation

- Update README for significant changes
- Comment complex logic
- Document API endpoints
- Maintain code examples

## Deployment

- Test locally before deployment
- Verify environment configuration
- Check database migrations
- Monitor deployment logs
- Validate post-deployment functionality
