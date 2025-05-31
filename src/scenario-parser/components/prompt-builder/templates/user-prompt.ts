export default `INSTRUCTION: {{userAction}}

{{historyContext}}

---

[Task history memory ends]

[Current state starts here]

> The following is one-time information - if you need to remember it write it to memory:

{{formattedDom}}

---

Current step: {{currentStep}}/{{totalSteps}}  
Current date and time: {{currentDateTime}}

## Task
Please analyze the page and determine what action to take to: {{userAction}}
`;
