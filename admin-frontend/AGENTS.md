<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep TanStack file-based routes as thin wrappers around modular pages; the host requires TanStack rather than React Router.
- Reuse typed resource configurations for CRUD screens so validation, filters and dialogs remain consistent.
- Default to labeled frontend demo mode; call the existing backend only when VITE_DEMO_MODE=false.
- Use Headless UI for modal and popover accessibility and the existing Button for commands.
