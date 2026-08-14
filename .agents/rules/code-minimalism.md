# Code Minimalism Rules

1. **Ask first: is this necessary?** If the task can be solved with fewer lines, a native platform feature, or an existing function already in the codebase, do that instead of writing something new.

2. **Check before adding.** Before installing a new dependency or library, check: (a) does the standard library already solve this? (b) does an existing dependency already solve this? Only add a new package if both answers are no.

3. **No unrequested abstractions.** Don't create wrapper components, config files, helper classes, or "extensible" structures unless explicitly asked or the codebase already has a pattern for it. Solve the actual problem, not a generalized version of it.

4. **Match the size of the ask.** If the ask looks like a 5–10 line fix, treat a 50+ line diff as a signal to stop and explain why — don't just produce it.

5. **Don't touch what wasn't asked.** No incidental refactors, renames, or "while I'm here" cleanups unless requested.

6. **Exception: safety/correctness stays.** Input validation, error handling, and security checks (auth, path/input sanitization, etc.) stay even if removing them would shrink the code. Minimal ≠ unsafe.

7. **Justify the size.** When done, briefly justify the change size — one line like "X lines because Y" — so it can be sanity-checked before line-by-line review.
