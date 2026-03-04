- Do not use system modals for confirmation. Always use custom modal.
- After each code change run `npm run build` and resolve errors and warnings. Do not disable linter rules.
- Languages other than english do not use ; as a sentence delimiter. Use , or . instead.

## Context management

Context is your most important resource. Proactively use subagents (Task tool)to keep exploration, research, and verbose
operations of the main conversation.

### Default to spawning agents for:
- Codebase exploration - reading 3+ files to answer a question
- Research tasks - web searches, doc lookup, investigating how something work
- Code review or analysis (produces verbose output)
- Any investigation where only the summary matters

### Stay in main context for:
- Direct file edits the user requested
- Short, targeted reads (1-2 files)
- Conversations requiring back-and-forth
- Tasks where user needs intermediate steps

### Rule of thumb
If a task will read more than ~3 files or produce output the user doesn't need to see verbatim,
delegate it to a subagent and return a summary.