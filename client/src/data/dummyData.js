export const dummyCourses = [
    {
        _id: "665000000000000000000101",
        title: "Intro til Modulex Systemer",
        description:
            "En grundlæggende introduktion til Modulex, systemerne og partnerportalen.",
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000102",
        title: "Konfiguration & Bestilling",
        description:
            "Lær hvordan du konfigurerer produkter og bruger bestillingsflowet.",
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000103",
        title: "Brand Guidelines",
        description:
            "Sikr at din virksomhed repræsenterer Modulex korrekt i salg og kommunikation.",
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
];

export const dummyModules = [
    // COURSE 1: Intro til Modulex Systemer
    {
        _id: "665000000000000000000201",
        courseId: "665000000000000000000101",
        title: "Velkommen til Modulex",
        description: "En kort videointroduktion til Modulex og partnerprogrammet.",
        order: 1,
        materials: [
            {
                type: "video",
                title: "Intro video",
                url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: "8 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000204",
        courseId: "665000000000000000000101",
        title: "Hvad er Modulex?",
        description: "Gennemgang af Modulex som brand, virksomhed og partnernetværk.",
        order: 2,
        materials: [
            {
                type: "pdf",
                title: "Introduktion til Modulex",
                fileUrl: "/files/introduktion-til-modulex.pdf",
                size: "1.8 MB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000205",
        courseId: "665000000000000000000101",
        title: "Partnerportalens opbygning",
        description: "Lær hvordan partnerportalen er opbygget, og hvor du finder de vigtigste funktioner.",
        order: 3,
        materials: [
            {
                type: "video",
                title: "Rundtur i partnerportalen",
                url: "https://www.youtube.com/embed/ysz5S6PUM-U",
                duration: "10 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000206",
        courseId: "665000000000000000000101",
        title: "Afslutning og næste skridt",
        description: "Opsamling på introduktionskurset og hvad du skal gøre bagefter.",
        order: 4,
        materials: [
            {
                type: "pdf",
                title: "Næste skridt som Modulex partner",
                fileUrl: "/files/naeste-skridt.pdf",
                size: "950 KB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },

    // COURSE 2: Konfiguration & Bestilling
    {
        _id: "665000000000000000000202",
        courseId: "665000000000000000000102",
        title: "Sådan bruger du bestillingsportalen",
        description: "PDF-guide til opsætning og bestilling af produkter.",
        order: 1,
        materials: [
            {
                type: "pdf",
                title: "Bestillingsguide",
                fileUrl: "/files/bestillingsguide.pdf",
                size: "2.4 MB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000207",
        courseId: "665000000000000000000102",
        title: "Opret en produktkonfiguration",
        description: "Lær hvordan du vælger produkter og opsætter en konfiguration.",
        order: 2,
        materials: [
            {
                type: "video",
                title: "Produktkonfiguration trin for trin",
                url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: "14 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000208",
        courseId: "665000000000000000000102",
        title: "Tilpasning af materialer og farver",
        description: "Gennemgang af valg af materialer, farver og visuelle indstillinger.",
        order: 3,
        materials: [
            {
                type: "video",
                title: "Materialer og farver",
                url: "https://www.youtube.com/embed/ysz5S6PUM-U",
                duration: "11 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000209",
        courseId: "665000000000000000000102",
        title: "Send bestilling til Modulex",
        description: "Lær hvordan du kontrollerer og sender en færdig bestilling.",
        order: 4,
        materials: [
            {
                type: "pdf",
                title: "Tjekliste før bestilling",
                fileUrl: "/files/tjekliste-bestilling.pdf",
                size: "1.1 MB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000210",
        courseId: "665000000000000000000102",
        title: "Typiske fejl i bestillingsflowet",
        description: "Se de mest almindelige fejl og hvordan du undgår dem.",
        order: 5,
        materials: [
            {
                type: "video",
                title: "Undgå fejl i bestillingen",
                url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                duration: "9 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },

    // COURSE 3: Brand Guidelines
    {
        _id: "665000000000000000000203",
        courseId: "665000000000000000000103",
        title: "Brand og visuel identitet",
        description: "Video om brug af Modulex-logo, farver og tone of voice.",
        order: 1,
        materials: [
            {
                type: "video",
                title: "Brand guidelines video",
                url: "https://www.youtube.com/embed/ysz5S6PUM-U",
                duration: "12 min",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000211",
        courseId: "665000000000000000000103",
        title: "Logo og korrekt brug",
        description: "Gennemgang af hvordan Modulex-logoet må bruges i materialer.",
        order: 2,
        materials: [
            {
                type: "pdf",
                title: "Logo guidelines",
                fileUrl: "/files/logo-guidelines.pdf",
                size: "1.5 MB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000212",
        courseId: "665000000000000000000103",
        title: "Farver og typografi",
        description: "Introduktion til Modulex farver, typografi og grafiske principper.",
        order: 3,
        materials: [
            {
                type: "pdf",
                title: "Farver og typografi",
                fileUrl: "/files/farver-og-typografi.pdf",
                size: "1.2 MB",
            },
        ],
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
];

export const dummyUserProgresses = [
    {
        _id: "665000000000000000000501",
        userId: "665000000000000000000002",
        courseId: "665000000000000000000101",
        completedModules: [],
        progress: 45,
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000502",
        userId: "665000000000000000000002",
        courseId: "665000000000000000000102",
        completedModules: [],
        progress: 0,
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
    {
        _id: "665000000000000000000503",
        userId: "665000000000000000000002",
        courseId: "665000000000000000000103",
        completedModules: ["665000000000000000000203"],
        progress: 100,
        createdAt: "2026-05-20T10:00:00.000Z",
        updatedAt: "2026-05-20T10:00:00.000Z",
    },
];

export const dummySurvey = {
    _id: "665000000000000000000301",
    title: "Intro survey",
    description:
        "Bruges til at forstå partnerens behov før kursusforløbet starter.",
    questions: [
        {
            id: "q1",
            label: "Hvilken type virksomhed har I?",
            type: "select",
            options: ["Skiltefirma", "Designbureau", "Forhandler", "Andet"],
            required: true,
        },
        {
            id: "q2",
            label: "Hvor meget erfaring har I med Modulex produkter?",
            type: "select",
            options: ["Ingen erfaring", "Lidt erfaring", "Meget erfaring"],
            required: true,
        },
        {
            id: "q3",
            label: "Hvad vil I helst lære først?",
            type: "textarea",
            required: false,
        },
    ],
};