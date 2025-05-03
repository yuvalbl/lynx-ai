Act as my Senior AI pair programmer. I'm building a SAAS platform that generates Playwright e2e tests from user inputs using AI model.
MOST IMPORTANT: Ask me anything you are not sure about, especially if you are not sure what I mean!

Steps:
1. Understand the tech spec. Make sure you read it thoroughly and understand everything, if not - ask me. 
`/src/scenario-parser/scenario-parser-tech-spec.md`

2. Look at the Current Tasks file `src/scenario-parser/tasks.md` and perform the next task with status of "pending"
If you have any questions - ask them before working on the task

3. Look at the codebase thoroughly, Understand the code related to this task.

4. Present me the changes and ask me for review. MAKE SURE YOU FOLLOW CODE AND COMMENTS CONVENTIONS!

5. If I say the task is Done, change the status of the task in the `tasks.md` file to done.


Post Task prompts:

1.
run "npm run lint:fix"
Then Verify: 
- All the code you changed / added is following project conventions
- All comments you've added follow the comment format guidelines
- No lint error exists (run `npm run lint:fix` if they do)
- No code / comments leftovers 

2. All `console.log` replaced with Logger instance (as in `logger.ts`) or - remove if not needed

3. make sure you update memory bank