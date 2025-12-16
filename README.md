# `copycop`

```
npx -y copycop <path-to-file>.md
```

Copycop reads a markdown file and analyzes it for common composition issues. Copycop is different from a standard grammar checker because it focuses on document structure rather than sentence structure Copycop optimizes for simplicity and consistency.

These rules are heavily inspired by _The Elements of Style_ by William Strunk Jr and E. B. White.

## Rules

Here is some more information on the rules in the linter.

### Correlate parallel ideas

Strunk and White put it best in rule #15, "Express coordinate ideas in similar form":

> Expressions of similar content and function should be outwardly similar. The likeness of form enables the reader to recognize more readily the likeness of content and function.

In prose, this rule dictates the order of words. For example:

- A time not for words, but action
- A time not for words, but for action

The repeated preposition ("for") carries the meaning through the sentence.

In technical writing, this rule extends to structured data:
- Headings
- Menu items
- List items
- Buttons
- Rows

Each heading in a page section, link in a menu, button in a CTA, cell in a table column, or item in a list should follow the same structure; each should use the same tense, mood, and approximate length. If one has a conjunction ("Fruits and vegetables") then all should ("Meats and dairy"). If one is a gerund ("Cycling") then all should be ("Running").

### Define a subject

The passive voice omits a subject. A complete sentence is take the form of subject-predicate-object. ("The dog wags the tail.") A passive sentence is effectively object-predicate. ("The tail is wagged.") A passive sentence lacks vigor because it possesses no "main character."

The passive voice offers a convenient shortcut when the instigator of an action is unclear (e.g. who or what is invoking the subprocess command?). But the shortcut bypasses an opportunity to find more meaning for both writer and reader. Identify a subject and put them into the sentence.

Take it from Strunk and White, who say the passive is "less direct, less bold, and less concise."

Passive voice may be employed occasionally to soften a sentence, vary tone of voice, or generalize.

### Introduce each section

It's tempting to go from an H2 straight to a subordinate H3, but this calls the usefulness of the H2 into question. After an H2, introduce the section before continuing to an H3. If there is nothing to say, consider restructuring.

### Only use headings in multiples

When it comes to headings and subheadings, use none or at least two. Never use a single heading. Headings serve to subdivide content into useful categories. There is almost* never a reason to subdivide content into a single category. (*Except when dictated by convention, as sometimes happens in API documentation.)


## Advice

- Cover one topic per paragraph
- Define jargon
- Use the positive form
- Vary sentence length
- Introduce a list with an independent clause
- Avoid gerunds
