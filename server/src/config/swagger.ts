import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Platform API",
      version: "1.0.0",
      description: "API documentation for the quiz backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "UUID",
        },
      },
      schemas: {
        QuizListItem: {
          type: "object",
          properties: {
            id: { type: "string", example: "quiz_datastructures_001" },
            title: { type: "string", example: "Datastrukturer" },
            link: {
              type: "string",
              example: "/quizzes/quiz_datastructures_001",
            },
          },
        },
        QuizListResponse: {
          type: "object",
          properties: {
            quizzes: {
              type: "array",
              items: { $ref: "#/components/schemas/QuizListItem" },
            },
          },
        },
        ChoiceOption: {
          type: "object",
          properties: {
            id: { type: "string", example: "a" },
            text: { type: "string", example: "Queue" },
          },
        },
        PublicSingleChoiceQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q01" },
            type: { type: "string", example: "single_choice" },
            questionText: {
              type: "string",
              example:
                "Hvilken datastruktur arbejder typisk efter princippet <strong>FIFO</strong>?",
            },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/ChoiceOption" },
            },
          },
        },
        PublicMultipleChoiceQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q03" },
            type: { type: "string", example: "multiple_choice" },
            questionText: {
              type: "string",
              example:
                "Hvilke udsagn om et <strong>array</strong> er korrekte?",
            },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/ChoiceOption" },
            },
          },
        },
        PublicClozeQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q07" },
            type: { type: "string", example: "cloze" },
            questionText: {
              type: "string",
              example:
                "En datastruktur der lagrer data som nøgle-værdi-par, kaldes ofte en <strong>____</strong>.",
            },
            caseSensitive: { type: "boolean", example: false },
            trimWhitespace: { type: "boolean", example: true },
          },
        },
        PublicQuiz: {
          type: "object",
          properties: {
            id: { type: "string", example: "quiz_datastructures_001" },
            title: { type: "string", example: "Datastrukturer" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" },
            language: { type: "string" },
            shuffleQuestions: { type: "boolean" },
            shuffleOptions: { type: "boolean" },
            allowedHtmlTags: {
              type: "array",
              items: { type: "string" },
            },
            allowedHtmlStyles: {
              type: "array",
              items: { type: "string" },
            },
            rules: {
              type: "object",
              additionalProperties: true,
            },
            questions: {
              type: "array",
              items: {
                oneOf: [
                  { $ref: "#/components/schemas/PublicSingleChoiceQuestion" },
                  { $ref: "#/components/schemas/PublicMultipleChoiceQuestion" },
                  { $ref: "#/components/schemas/PublicClozeQuestion" },
                ],
              },
            },
          },
        },
        CustomerResponse: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            email: { type: "string", example: "user@example.com" },
            companyName: { type: "string", example: "Acme Corp" },
            contactPerson: { type: "string", example: "Jane Doe" },
            phone: { type: "string", example: "+45 12 34 56 78" },
            role: { type: "string", example: "client" },
            status: { type: "string", example: "active" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Quiz blev ikke fundet." },
          },
        },
        SignupRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: { type: "string", minLength: 6, example: "Secret123!" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: { type: "string", example: "Secret123!" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
          },
        },
        Answer: {
          type: "object",
          required: ["questionId", "answer"],
          properties: {
            questionId: { type: "string", example: "q1" },
            answer: {
              oneOf: [
                { type: "string", example: "Option A" },
                {
                  type: "array",
                  items: { type: "string" },
                  example: ["Option A", "Option B"],
                },
              ],
            },
          },
        },
        SurveySubmitRequest: {
          type: "object",
          required: ["email", "answers"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "company@example.com",
            },
            companyName: { type: "string", example: "Acme Corp" },
            contactPerson: { type: "string", example: "Jane Doe" },
            phone: { type: "string", example: "+45 12 34 56 78" },
            answers: {
              type: "array",
              items: { $ref: "#/components/schemas/Answer" },
            },
          },
        },
        SurveySubmitResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Survey submitted - awaiting approval",
            },
            user: {
              type: "object",
              properties: {
                id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
                email: { type: "string", example: "company@example.com" },
                status: { type: "string", example: "pending_approval" },
              },
            },
          },
        },
        SurveyResponseObject: {
          type: "object",
          properties: {
            userId: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            userEmail: { type: "string", example: "company@example.com" },
            answers: {
              type: "array",
              items: { $ref: "#/components/schemas/Answer" },
            },
            submittedAt: {
              type: "string",
              format: "date-time",
              example: "2024-05-19T10:00:00.000Z",
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
