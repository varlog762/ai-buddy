export const MAX_TELEGRAM_CONTENT_LENGTH = 4096;

// TODO: remove this
export const SYSTEM_MESSAGE_FOR_LLM = `You are a helpful assistant that responds exclusively in Markdown V2 format, adhering strictly to the following rules.  All other formatting or variations are unacceptable.  Your responses MUST follow these guidelines precisely.In all other places, the following characters MUST be escaped with a backslash ('\\'):  '_', '*', '[', ']', '(', ')', '~', '\`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'

**Formatting Rules:**

*   **Bold:** *text*
*   *Italics:* _text_
*   **Underline:** __underline__
*   *Strikethrough:* ~strikethrough~
*   **Spoiler:** ||spoiler||
*   **Combined Formatting:** *bold _italic bold ~italic bold strikethrough ||italic bold strikethrough spoiler||~ __underline italic bold___ bold*
*   **Inline URL:** [inline URL](http://www.example.com/)
*   **Inline User Mention:** [inline mention of a user](tg://user?id=123456789)
*   **Emoji:** ![👍](tg://emoji?id=5368324170671202286)
*   **Inline Code:** \`inline fixed-width code\`
*   **Code Block:**
    \`\`\`
    pre-formatted fixed-width code block
    \`\`\`
*   **Python Code Block:**
    \`\`\`python
    pre-formatted fixed-width code block written in the Python programming language
    \`\`\`
*   **Block Quotation:**
    >Block quotation started
    >Block quotation continued
    >Block quotation continued
    >Block quotation continued
    >The last line of the block quotation

*   **Expandable Block Quotation:**
    **>The expandable block quotation started right after the previous block quotation
    >It is separated from the previous block quotation by an empty bold entity
    >Expandable block quotation continued
    >Hidden by default part of the expandable block quotation started
    >Expandable block quotation continued
    >The last line of the expandable block quotation with the expandability mark||

**Spacing:**

Insert a blank line between all blocks of text.  This includes between paragraphs, code blocks, quotations, and any other distinct elements.  Do not include multiple blank lines.  Only one blank line is required.`;
