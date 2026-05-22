import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Platform API",
      version: "1.0.0",
      description:
        "API documentation for the quiz backend.\n\n" +
        "**Test accounts** (password for both: `Secret123!`)\n\n" +
        "| Role | Email |\n|---|---|\n" +
        "| Admin | admin@example.com |\n" +
        "| Client | user@example.com |\n\n" +
        "Log in via `POST /auth/login`, copy the token, click **Authorize** at the top and paste it.",
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
          bearerFormat: "JWT",
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
        Course: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            title: { type: "string", example: "Welcome to Modulex Billund Academy" },
            description: {
              type: "string",
              example:
                "Your introduction to Modulex — our history, design philosophy, and the modular systems that help organisations navigate their world.",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CourseWithProgress: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            title: { type: "string", example: "Welcome to Modulex Billund Academy" },
            description: {
              type: "string",
              example:
                "Your introduction to Modulex — our history, design philosophy, and the modular systems that help organisations navigate their world.",
            },
            totalModules: { type: "number", example: 4 },
            completedModules: { type: "number", example: 1 },
            progressPct: { type: "number", example: 25 },
          },
        },
        CourseProgress: {
          type: "object",
          properties: {
            completed: { type: "number", example: 1 },
            total: { type: "number", example: 4 },
            percentage: { type: "number", example: 25 },
          },
        },
        Material: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["youtube", "pdf", "text"], example: "youtube" },
            title: { type: "string", example: "The Story of Modulex" },
            url: {
              type: "string",
              example: "https://www.youtube.com/embed/modulex-intro",
            },
            content: {
              type: "string",
              example:
                "Founded in 1963 as part of the LEGO Group, Modulex grew from a shared belief that well-designed environments help people feel oriented, informed, and at ease.",
            },
          },
        },
        ModuleListItem: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7c" },
            title: { type: "string", example: "Our History & Heritage" },
            description: {
              type: "string",
              example:
                "From the LEGO Group's vision in 1963 to a global leader in architectural signage and wayfinding.",
            },
            order: { type: "number", example: 1 },
            materialsCount: { type: "number", example: 3 },
          },
        },
        ModuleDetail: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7c" },
            title: { type: "string", example: "Our History & Heritage" },
            description: {
              type: "string",
              example:
                "From the LEGO Group's vision in 1963 to a global leader in architectural signage and wayfinding.",
            },
            order: { type: "number", example: 1 },
            materials: {
              type: "array",
              items: { $ref: "#/components/schemas/Material" },
            },
          },
        },
        CreateCourseRequest: {
          type: "object",
          required: ["title", "description"],
          properties: {
            title: { type: "string", example: "Wayfinding & Signage Systems" },
            description: {
              type: "string",
              example:
                "A practical introduction to Modulex product families and how they solve navigation challenges in hospitals, airports, universities, and corporate campuses.",
            },
          },
        },
        UpdateCourseRequest: {
          type: "object",
          properties: {
            title: { type: "string", example: "Wayfinding & Signage Systems" },
            description: {
              type: "string",
              example:
                "A practical introduction to Modulex product families and how they solve navigation challenges in hospitals, airports, universities, and corporate campuses.",
            },
          },
        },
        CreateModuleRequest: {
          type: "object",
          required: ["title", "order"],
          properties: {
            title: { type: "string", example: "The Modulex Design Philosophy" },
            description: {
              type: "string",
              example:
                "How modularity, precision, and Scandinavian functional design come together in every product we make.",
            },
            order: { type: "number", example: 2 },
            materials: {
              type: "array",
              items: { $ref: "#/components/schemas/Material" },
              example: [
                {
                  type: "pdf",
                  title: "Modulex Design Principles",
                  url: "https://academy.modulex.com/materials/design-principles.pdf",
                },
                {
                  type: "text",
                  title: "Why Modularity Matters",
                  content:
                    "Modular systems allow clients to adapt their signage environments over time without starting from scratch — a core principle since our founding.",
                },
              ],
            },
          },
        },
        UpdateModuleRequest: {
          type: "object",
          properties: {
            title: { type: "string", example: "The Modulex Design Philosophy" },
            description: {
              type: "string",
              example:
                "How modularity, precision, and Scandinavian functional design come together in every product we make.",
            },
            order: { type: "number", example: 2 },
            materials: {
              type: "array",
              items: { $ref: "#/components/schemas/Material" },
            },
          },
        },
        AssignCourseRequest: {
          type: "object",
          required: ["userId", "courseId"],
          properties: {
            userId: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            courseId: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7c" },
          },
        },
        CourseGrant: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7d" },
            userId: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7b" },
            courseId: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7c" },
            grantedBy: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7a" },
            grantedAt: { type: "string", format: "date-time" },
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
        Content: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7e" },
            type: {
              type: "string",
              enum: ["pdf", "youtube"],
              example: "pdf",
            },
            title: { type: "string", example: "Infinity Classic Panel" },
            url: {
              type: "string",
              example: "/uploads/pdfs/120_904682_Infinity_Classic_Panel.pdf",
            },
            description: {
              type: "string",
              example: "Product specification for Infinity Classic Panel system",
            },
            category: {
              type: "string",
              enum: ["product", "production", "company", "design", "technology"],
              example: "product",
            },
            uploadedBy: { type: "string", example: "664f1c2e8b1a2c3d4e5f6a7a" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateContentRequest: {
          type: "object",
          required: ["type", "title", "url"],
          properties: {
            type: {
              type: "string",
              enum: ["pdf", "youtube"],
              example: "youtube",
            },
            title: { type: "string", example: "#38 Aluminium Processing 2025" },
            url: {
              type: "string",
              example: "https://www.youtube.com/watch?v=VIDEO_ID",
            },
            description: {
              type: "string",
              example: "Production walkthrough of aluminium processing",
            },
            category: {
              type: "string",
              enum: ["product", "production", "company", "design", "technology"],
              example: "production",
            },
          },
        },
        UpdateContentRequest: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["pdf", "youtube"],
              example: "pdf",
            },
            title: { type: "string", example: "Infinity Classic Panel" },
            url: { type: "string" },
            description: { type: "string" },
            category: {
              type: "string",
              enum: ["product", "production", "company", "design", "technology"],
              example: "product",
            },
          },
        },
        BulkCreateContentRequest: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/CreateContentRequest" },
            },
          },
          example: {
            items: [
              { type: "pdf", title: "Infinity Classic Panel", url: "/uploads/pdfs/120_904682_Infinity_Classic_Panel.pdf", description: "Product specification for Infinity Classic Panel system", category: "product" },
              { type: "pdf", title: "Graphic Sample Collection 2020", url: "/uploads/pdfs/241_2020_Graphic_Sample_Collection.pdf", description: "Collection of graphic samples and design references", category: "design" },
              { type: "pdf", title: "Pacific Interior 36", url: "/uploads/pdfs/286_Pacific_Interior_36_2021.pdf", description: "Pacific Interior 36 product details (2021 edition)", category: "product" },
              { type: "pdf", title: "Modulex Sustainability Report 2024", url: "/uploads/pdfs/355_Modulex_Sustainability_Report_2024.pdf", description: "Annual sustainability report and ESG commitments", category: "company" },
              { type: "pdf", title: "Messenger Helios 39", url: "/uploads/pdfs/358_Messenger_Helios_39.2025.pdf", description: "Messenger Helios 39 product line (2025 edition)", category: "product" },
              { type: "pdf", title: "Basic Totem Brochure", url: "/uploads/pdfs/360_BasicTotem_Brochure.pdf", description: "Basic Totem product brochure", category: "product" },
              { type: "pdf", title: "Pacific Interior", url: "/uploads/pdfs/363_Pacific_interior.pdf", description: "Pacific Interior product family overview", category: "product" },
              { type: "pdf", title: "Infinity Classic", url: "/uploads/pdfs/371_Infinity_Classic.pdf", description: "Infinity Classic product family overview", category: "product" },
              { type: "pdf", title: "Luma Brochure", url: "/uploads/pdfs/372_Luma_Brochure.pdf", description: "Luma product line brochure", category: "product" },
              { type: "youtube", title: "#38 Aluminium Processing 2025", url: "https://www.youtube.com/results?search_query=modulex+aluminium+processing+2025", description: "Production walkthrough of aluminium processing", category: "production" },
              { type: "youtube", title: "#39 Aluminium Profiles and Stock", url: "https://www.youtube.com/results?search_query=modulex+aluminium+profiles+stock", description: "Overview of aluminium profiles and stock management", category: "production" },
              { type: "youtube", title: "#23 Painting General 2025", url: "https://www.youtube.com/results?search_query=modulex+painting+general+2025", description: "General painting process overview", category: "production" },
              { type: "youtube", title: "#22 Paint Process 2024", url: "https://www.youtube.com/results?search_query=modulex+paint+process+2024", description: "Detailed paint process walkthrough (2024)", category: "production" },
              { type: "youtube", title: "#01 Seiko m64s Process 2024", url: "https://www.youtube.com/results?search_query=modulex+seiko+m64s+process", description: "Seiko m64s printing process", category: "production" },
              { type: "youtube", title: "#03 Pop Printing", url: "https://www.youtube.com/results?search_query=modulex+pop+printing", description: "Pop printing technique demonstration", category: "production" },
              { type: "youtube", title: "#05 Vinyl Graphics 2024", url: "https://www.youtube.com/results?search_query=modulex+vinyl+graphics+2024", description: "Vinyl graphics production process", category: "production" },
              { type: "youtube", title: "#37 Finishing Department 2025", url: "https://www.youtube.com/results?search_query=modulex+finishing+department+2025", description: "Finishing department workflow", category: "production" },
              { type: "youtube", title: "#27 Shipping 2024", url: "https://www.youtube.com/results?search_query=modulex+shipping+2024", description: "Shipping and logistics overview", category: "production" },
              { type: "youtube", title: "#12 Infinity Classic 2024", url: "https://www.youtube.com/results?search_query=modulex+infinity+classic+2024", description: "Infinity Classic product showcase", category: "product" },
              { type: "youtube", title: "#10 Pacific Interior 2024", url: "https://www.youtube.com/results?search_query=modulex+pacific+interior+2024", description: "Pacific Interior product showcase", category: "product" },
              { type: "youtube", title: "#33 Pacific Exterior 2024", url: "https://www.youtube.com/results?search_query=modulex+pacific+exterior+2024", description: "Pacific Exterior product showcase", category: "product" },
              { type: "youtube", title: "#50 Basic Interior", url: "https://www.youtube.com/results?search_query=modulex+basic+interior", description: "Basic Interior product showcase", category: "product" },
              { type: "youtube", title: "#56 Via Interior 2024", url: "https://www.youtube.com/results?search_query=modulex+via+interior+2024", description: "Via Interior product showcase", category: "product" },
              { type: "youtube", title: "Verifind — Verified Wayfinding Through Eye Tracking", url: "https://www.youtube.com/results?search_query=modulex+verifind+wayfinding+eye+tracking", description: "Verifind technology — wayfinding validated through eye tracking", category: "technology" },
            ],
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.ts")],
};

export const swaggerSpec = swaggerJsdoc(options);
