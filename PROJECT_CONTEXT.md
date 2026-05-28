# IoT Miaw Project - Master Context & AI Instructions

## 1. Project Philosophy
This is an endless, continuously evolving project. There is no "final version." It is a Smart Home ecosystem fused with an AI Assistant (named "Miaw"). The system bridges physical hardware (ESP32) with a modern web interface and an LLM brain (Groq API).

## 2. Core Architecture
- **Hardware (ESP32)**: Handles physical sensors (DHT11, LDR), actuators (LEDs as smart lamps), and runs a local HTTP web server. 
- **Frontend / Middleware (Next.js)**: The central hub. It serves as the UI, handles user input (text/voice), manages the AI character state, and securely communicates with the LLM API and the local ESP32 hardware.
- **LLM Brain (Groq API)**: Processes NLP, analyzes intent, and returns structured JSON responses to dictate hardware actions and AI dialogues.

## 3. UI/UX Design System: Neobrutalism
The web interface MUST strictly adhere to the **Neobrutalism UI** design trend.
- **Borders**: Thick, solid black borders on components (e.g., `border-2 border-black` or `border-4 border-black`).
- **Shadows**: Hard, solid, offset shadows without blur (e.g., `box-shadow: 4px 4px 0px #000000`).
- **Colors**: High contrast. Use stark whites, bold blacks, and bright/vibrant flat background colors (e.g., brutalist yellow, pastel pink, raw blue).
- **Typography**: Bold, readable, sans-serif fonts.
- **Transitions**: Sharp and snappy. Hover states should visually translate the component (e.g., pushing the button down to flatten the shadow).

## 4. Strict Vibe Coding Rules (For AI Agents)
Any AI agent (Claude Code, Antigravity, etc.) writing code for this project MUST follow these absolute rules:
1. **NO EMOJIS IN CODE**: Absolutely zero emojis in the UI text, strings, console logs, or comments. Use icon libraries (like `lucide-react`) if visual indicators are needed.
2. **HUMAN-LIKE, MINIMAL COMMENTS**: Do not write overly descriptive AI-style comments (e.g., avoid `// This function fetches data`). Write clean, self-explanatory code. Only use comments for complex business logic or hardware-specific quirks.
3. **TECH STACK**: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI (modified for Neobrutalism).
4. **SVG COMPATIBILITY**: The project uses complex React SVG components for the "Miaw" character. Ensure any wrapper containers respect the `viewBox` scaling.

## 5. Current State vs. Future Roadmap
- **Currently Completed**: ESP32 is running a local web server (IP based). It handles DHT11 (temp/humidity), LDR (light sensor with debounced auto-mode), 3 LEDs, and an I2C OLED display (showing real-time status).
- **Current Sprint**: Building the Next.js web dashboard, integrating the SVG character animation, and wiring up the Groq LLM API to process text commands into JSON actions.
- **Future Backlog**: Integrating I2S microphones and MAX98357A speakers directly to the ESP32 for standalone voice interaction.