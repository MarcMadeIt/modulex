export const dummyQuestions = [
    {
        id: "business_type",
        question: "Hvilken type virksomhed driver I?",
        type: "single",
        options: [
            { value: "sign_maker", label: "Skiltemager" },
            { value: "reseller", label: "Forhandler" },
            { value: "agency", label: "Bureau" },
            { value: "other", label: "Andet" },
        ],
    },
    {
        id: "company_size",
        question: "Hvor mange medarbejdere er I?",
        type: "single",
        options: [
            { value: "1-5", label: "1-5" },
            { value: "6-20", label: "6-20" },
            { value: "21-50", label: "21-50" },
            { value: "50+", label: "50+" },
        ],
    },
    {
        id: "product_interest",
        question: "Hvilke produktområder er I interesserede i?",
        type: "multi",
        options: [
            { value: "interior", label: "Interior signs" },
            { value: "exterior", label: "Exterior signs" },
            { value: "safety", label: "Safety signs" },
            { value: "wayfinding", label: "Wayfinding systems" },
        ],
    },
    {
        id: "experience_level",
        question: "Hvor meget erfaring har I med modulære skiltesystemer?",
        type: "single",
        options: [
            { value: "none", label: "Ingen" },
            { value: "some", label: "Lidt" },
            { value: "experienced", label: "Erfaren" },
        ],
    },
    {
        id: "expected_volume",
        question: "Forventet årligt salgsvolumen?",
        type: "single",
        options: [
            { value: "small", label: "Under 100k EUR" },
            { value: "medium", label: "100k - 500k EUR" },
            { value: "large", label: "Over 500k EUR" },
        ],
    },
];