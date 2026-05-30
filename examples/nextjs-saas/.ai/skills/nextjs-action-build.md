# Skill: React Server Actions secure implementation

Use this skill when implementing a secure React Server Action in Next.js:

1. **State Isolation:** Ensure actions include `"use server"` at the top of the file or module.
2. **Parameters validation:** Validate all input parameters via Zod schema parsers.
3. **Connection safety:** Ensure Prisma queries inside the Action execute within try-catch blocks:
   ```typescript
   try {
     const data = await prisma.user.update({...});
     return { success: true, data };
   } catch (e) {
     return { success: false, error: e.message };
   }
   ```
4. **No secret exposure:** Never return raw sensitive fields (like password hashes or API private keys) to the UI client layer.
