const PROMPT = `You are an expert in Palantir Foundry. Generate exactly 10 multiple-choice questions from Palantir Foundry documentation.

    For each question, provide:
    1. A clear, specific question
    2. Four options (A, B, C, D)
    3. The correct answer (letter only)
    4. A brief explanation of why the answer is correct
    5. A URL to relevant Palantir Foundry documentation (if available)

    Format your response as a JSON object with this exact structure:
    {
    "questions": [
        {
        "id": 1,
        "question": "Question text here?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        "correct_answer": "A",
        "explanation": "Explanation text here",
        "category": "Category name",
        "url": "https://www.palantir.com/docs/foundry/..."
        }
    ]
    }

    Ensure the questions test real knowledge of Foundry concepts like:
    - Ontology (objects, properties, links, actions)
    - Security (organizations, spaces, markings, restricted views)
    - Data pipelines (transforms, Code Repositories, Pipeline Builder)
    - Platform features (branching, version control, roles)

    Return ONLY the JSON object, no additional text.`;

export default PROMPT;