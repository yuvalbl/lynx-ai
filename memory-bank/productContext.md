# Product Context

Why this project exists, problems it solves, how it should work, user experience goals.

## Problem

Manually writing and maintaining end-to-end tests is time-consuming and requires specific technical knowledge. Existing tools may lack the flexibility to handle dynamic web applications or interpret high-level user intentions.

## Solution

This project aims to automate E2E test generation by:
1.  Accepting simple test scenarios (start URL, list of actions like "Click login button", "Enter 'user@test.com' into email field").
2.  Using AI (LLM with function calling) to understand the actions within the live browser context.
3.  Directly controlling a Playwright browser to execute these actions and capture DOM state.
4.  Producing a structured list of executable test steps.

## Goal

Reduce the effort required to create robust E2E tests, enabling faster development cycles and broader test coverage, even for users less familiar with specific test automation frameworks. 