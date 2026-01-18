**7 Design System and UX Directive for the MargenKalkulator Enterprise Financial Platform**  
**Design System and UX Directive for the MargenKalkulator Enterprise Financial Platform**  
**The Financial Trust Protocol and Visual Identity**  
The MargenKalkulator is engineered as a high-security environment for institutional financial modeling, demanding a visual language that communicates absolute reliability, technical rigor, and mathematical certainty. This foundational requirement is codified as the Financial Trust Protocol. At the core of this protocol is the mandatory use of "Serious Blue" (\#0F172A) as the primary base color. This specific hex code represents a deep, muted navy that embodies a sense of calmness and security.\[1\] Within the financial sector, this cold undertone is essential for creating an atmosphere that demands a serious professional presence, evoking feelings of loyalty and responsibility while maintaining a sense of administrative control.\[1\]  
The application of \#0F172A is not merely an aesthetic choice but a psychological imperative. In enterprise environments, visual clutter and high-vibrancy colors contribute to cognitive fatigue; conversely, the deep azure base provides a stable, low-energy background that allows critical data points to occupy the foreground with maximum contrast.\[1, 2, 3, 4\] This color serves as the anchor for the system's global CSS variables, particularly for the background, sidebar, and primary header elements, establishing a high-contrast foundation for all functional components.\[1, 3, 5\]  
Semantic Color Legislation  
The Financial Trust Protocol prohibits the use of color for decorative purposes. Every hue utilized within the system must serve a semantic role, informing the user of the system's current state, the nature of the data presented, or the gravity of an intended action.

| Functional Role | Hex Code | Tailwind Implementation | Behavioral Logic |
| ----- | ----- | ----- | ----- |
| Primary Base | \#0F172A | bg-slate-950 | Establishes the core environment of trust and security.\[1, 3\] |
| Global Text | \#F8FAFC | text-slate-50 | Ensures maximum readability against the deep base.\[3, 4\] |
| Primary Action | \#2563EB | bg-blue-600 | High-visibility blue for primary calls to action.\[4, 6\] |
| Critical Danger | \#EF4444 | bg-red-500 | Signals irreversible actions or negative financial outcomes.\[3, 7, 8\] |
| System Warning | \#F59E0B | bg-amber-500 | Alerts users to thresholds or non-destructive errors.\[3, 9\] |
| Success / Gain | \#10B981 | text-emerald-500 | Communicates positive margins or successful operations.\[3, 4, 8\] |
| Neutral Border | \#1E293B | border-slate-800 | Defines structure without adding unnecessary visual weight.\[4, 10\] |

The primary action color, a focused blue (\#2563EB), is reserved for "Call to Action" elements such as calculation triggers, data submissions, and primary navigation links.\[4, 6\] In financial software, blue is traditionally associated with stability and institutional competence, reinforcing the user's confidence in the system's output.\[3, 7, 11\] Critical actions, such as clearing a calculator or deleting a saved scenario, must utilize the "Danger" red (\#EF4444) to trigger an immediate biological and psychological response of caution.\[3, 9, 12, 13\]  
Accessibility and Contrast Standards  
For a tool used in high-stakes financial environments, inclusivity and compliance with the Web Content Accessibility Guidelines (WCAG) are non-negotiable legal requirements of the design system. All text-on-background combinations must meet a minimum contrast ratio of 4.5:1 for standard text and 3:1 for large-scale text to ensure legibility for users with moderate low vision.\[14, 15, 16, 17\]

| Context | Contrast Ratio Goal | Accessibility Rationale |
| ----- | ----- | ----- |
| Primary UI Text | 7:1 (AAA) | Critical for reading small numbers in dense tables.\[14, 16\] |
| Secondary Labels | 4.5:1 (AA) | Standard requirement for non-critical UI descriptive text.\[14, 16\] |
| Interactive Icons | 3:1 | Icons must remain distinct from the background for non-text navigation.\[16\] |

The Financial Trust Protocol explicitly forbids the use of color as the sole method for conveying critical information.\[16, 18, 19\] In the context of margin calculations, positive trends should be paired with a green hue and a specific icon (e.g., a plus sign or an upward arrow), while negative trends must use red and a corresponding downward indicator.\[7, 8, 18\] This redundancy ensures that the application remains fully functional for the estimated 8% of male users who experience some form of color vision deficiency.\[3, 17\]  
**Typography and Numeric Readability**  
Typography in financial software is a technical utility rather than a stylistic choice. The MargenKalkulator mandates a dual-font strategy, utilizing Inter for interface prose and Geist Sans for numerical data and technical outputs. This hierarchy ensures that textual instructions are approachable while ensuring that mathematical values are presented with absolute geometric clarity.\[20, 21, 22, 23\]  
Inter for Global Interface Text  
Inter is the legislated typeface for all headings, labels, instructions, and standard UI elements. Specifically designed for computer screens by Rasmus Andersson, Inter features a tall x-height and generous counters that maintain legibility even at exceptionally small sizes.\[20, 21, 22, 24\]

| Weight | Usage | Implementation Note |
| ----- | ----- | ----- |
| 600 (SemiBold) | Section Headers | Provides sufficient emphasis without becoming "heavy".\[21, 22\] |
| 500 (Medium) | Labels and Buttons | Standard weight for interactive elements to ensure visibility.\[20, 22\] |
| 400 (Regular) | Body Text | Used for general instructions and descriptions to minimize ink density.\[20, 22\] |

Inter’s neutral, "grotesk" style provides a modern, clean, and professional tone that aligns with enterprise standards.\[20, 21\] It is optimized for high-DPI displays while remaining crisp on lower-resolution mobile screens, a critical requirement for cross-platform financial tools.\[20, 22\]  
Geist Sans for Numerical Calculations  
For the core functionality of the MargenKalkulator—the display of prices, percentages, and results—Geist Sans is the mandatory standard. Developed by Vercel for technical environments, Geist Sans offers unparalleled precision for numerical typography.\[21, 23, 25\]  
The primary technical requirement for Geist Sans in this application is the activation of the tabular-nums OpenType feature. In standard proportional fonts, the digit "1" is narrower than the digit "8," which causes decimal points to stagger and makes it impossible to vertically compare magnitude across rows in a table.\[26, 27, 28\] Geist Sans ensures every digit occupies an identical horizontal width, creating a stable, mathematically sound grid.\[26, 29, 30\]

| CSS Feature | Tailwind Class | Functional Purpose |
| ----- | ----- | ----- |
| Tabular Numbers | tabular-nums | Ensures vertical alignment of decimal points in columns.\[26, 30, 31\] |
| Slashed Zero | slashed-zero | Prevents the misreading of "0" as "O" in financial codes.\[26, 30, 31\] |
| Lining Figures | lining-nums | All numbers align to the baseline and cap height for UI consistency.\[26, 31\] |

The system uses LaTeX for the rendering of complex mathematical notation to ensure that the logic underlying the margin calculations is presented with academic precision:  
**Gross Margin=(**

| Revenue Revenue−COGS |  |
| ----- | :---- |
|  |  |

**)×100**  
This ensures that the "noob-proof" objective is met not just through simple design, but through clear, unambiguous mathematical communication.  
**The Component Library: Shadcn UI Rules of Engagement**  
The MargenKalkulator utilizes Shadcn UI as its core component framework.\[32, 33\] Shadcn UI is not a traditional library but a collection of reusable components that are copied directly into the project codebase, allowing for full ownership and the ability to implement strict styling rules without the overhead of external dependencies.\[10, 33, 34\]  
Professional Rounding vs. Playful Rounding  
The "toy-like" appearance of many modern consumer apps is often a result of excessively high border-radius values. The MargenKalkulator prohibits "pill-shaped" buttons and large radii in favor of a "Subtle Professional Scale." Sharp corners create tension and formality, while moderate rounding evokes approachability.\[35, 36, 37\]

|  |
| :---- |

| Component Type | Radius Value | Rationale |
| ----- | ----- | ----- |
| Buttons & Inputs | 4px (rounded-md) | Communicates precision and a "business-oriented" tone.\[35, 36\] |
| Cards & Modals | 6px (rounded-lg) | Provides subtle softness for larger structural elements.\[36, 38\] |
| Table Headers | 0px (rounded-none) | Sharp corners emphasize the grid-like nature of data.\[39\] |
| Badges | 2px (rounded-sm) | Compact elements require minimal rounding to maintain structure.\[35, 36\] |

| Dashboard Zone | Column Span | Primary Content |
| ----- | ----- | ----- |
| **Left Sidebar** | 2 Columns | Navigation, Workspace Switcher, User Profile.\[60, 61\] |
| **Center Workspace** | 7 Columns | The Calculator, Data Tables, Primary Input Fields.\[2, 62\] |
| **Right Side Panel** | 3 Columns | Summary Results, Margin Gauges, Historical Benchmarks.\[7, 63\] |

