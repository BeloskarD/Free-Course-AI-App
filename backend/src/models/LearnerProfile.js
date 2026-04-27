import mongoose from 'mongoose';

/**
 * LEARNER PROFILE MODEL - Phase 1 Personalization Brain
 * Stores unified learner preferences, goals, skills, and weekly plans
 */
const learnerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // 🎯 Learning Goals
    goals: {
        targetRole: { type: String, default: '' },           // e.g., "Full Stack Developer"
        targetField: { type: String, default: '' },          // e.g., "AI/ML", "Web Development"
        experienceLevel: { 
            type: String, 
            enum: ['student', 'junior', 'mid', 'senior', 'lead', 'expert', ''], 
            default: '' 
        },
        targetSalary: { type: String, default: '' },         // e.g., "₹15-20 LPA"
        targetTimeline: { type: String, default: '6 months' },
        motivation: { type: String, default: '' },           // career-switch, promotion, passion, startup
        motivations: [{ type: String }],                     // e.g., ["Career switch", "Promotion"]
        isOnboarded: { type: Boolean, default: false },      // Has completed onboarding
    },

    // 🧠 Learning Preferences
    preferences: {
        format: {
            type: String,
            enum: ['video', 'text', 'projects', 'mixed'],
            default: 'mixed'
        },
        sessionLength: { type: Number, default: 30 },        // minutes
        difficultyComfort: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        learningStyle: {
            type: String,
            enum: ['visual', 'reading', 'hands-on'],
            default: 'hands-on'
        },
        preferredTime: { type: String, default: 'evening' },
        language: { type: String, default: 'English' },
    },

    // 📊 Skill Mastery (Living Data - Updated by interactions)
    masteredSkills: [{
        name: { type: String, required: true },
        level: { type: Number, min: 0, max: 100, default: 0 },

        // 🏥 Skill Health Tracking (NEW - Live Skill Health System)
        health: {
            score: { type: Number, min: 0, max: 100, default: 100 },
            lastAssessed: { type: Date, default: Date.now },
            streak: { type: Number, default: 0 },           // consecutive days maintained
            status: {
                type: String,
                enum: ['healthy', 'warning', 'critical', 'dormant'],
                default: 'healthy'
            }
        },

        // 🎯 Challenge History
        challenges: [{
            date: { type: Date, default: Date.now },
            type: { type: String, enum: ['quiz', 'code', 'explain'] },
            score: { type: Number, min: 0, max: 100 },
            timeSpent: { type: Number, default: 0 }         // seconds
        }],

        // 🏆 Proof of Competency Badge
        proof: {
            isVerified: { type: Boolean, default: false },
            verifiedAt: { type: Date },
            badgeLevel: {
                type: String,
                enum: ['bronze', 'silver', 'gold', 'platinum'],
                default: null
            },
            sustainedDays: { type: Number, default: 0 }     // days above 80% health
        },

        // Existing fields
        confidence: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        lastPracticed: { type: Date },
        sources: [{ type: String }],  // ["course", "quiz", "project"]
    }],

    // 📈 Adaptive Velocity (Auto-calculated)
    adaptiveVelocity: {
        current: { type: Number, default: 0 },               // hours/week
        trend: {
            type: String,
            enum: ['accelerating', 'stable', 'slowing'],
            default: 'stable'
        },
        weeklyTarget: { type: Number, default: 5 },          // hours
        actualThisWeek: { type: Number, default: 0 },
        lastCalculated: { type: Date },
    },

    // 🗓️ Current Weekly Plan (AI Generated - ENHANCED)
    currentPlan: {
        weekStartDate: { type: Date },
        tasks: [{
            id: { type: String, required: true },
            title: { type: String, required: true },
            type: {
                type: String,
                enum: ['course', 'quiz', 'project', 'practice', 'reading'],
                default: 'course'
            },
            estimatedMinutes: { type: Number, default: 30 },
            difficulty: { type: String, default: 'medium' },
            skill: { type: String },
            resourceUrl: { type: String },
            reason: { type: String },              // Why this task matters
            isRollover: { type: Boolean, default: false }, // Carried from previous week
            missionId: { type: String },           // Linked Phase 4 Mission ID
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'skipped'],
                default: 'pending'
            },
            completedAt: { type: Date },
        }],
        etaToJobReady: { type: String },                     // "14 weeks"
        weeklyFocus: { type: String },                       // Theme for the week
        skillsTargeted: [{ type: String }],                  // Skills being developed
        previousCompletionRate: { type: Number, default: 0 }, // Last week's %
        adaptedDifficulty: { type: String },                 // Auto-adjusted difficulty
        generatedAt: { type: Date },
    },


    // 🔄 Session History (for pattern analysis)
    recentSessions: [{
        date: { type: Date, default: Date.now },
        duration: { type: Number, default: 0 },              // minutes
        type: { type: String },
        skillsPracticed: [{ type: String }],
        performance: { type: Number, min: 0, max: 100 },
        feedback: { type: String },                          // User's optional feedback
    }],

    // 📊 Career Readiness Score
    careerReadiness: {
        score: { type: Number, min: 0, max: 100, default: 0 },
        breakdown: {
            skills: { type: Number, default: 0 },
            projects: { type: Number, default: 0 },
            experience: { type: Number, default: 0 },
        },
        lastUpdated: { type: Date },
    },

    // 🧘 WELLBEING & BURNOUT PREVENTION (NEW)
    wellbeing: {
        // Burnout risk score (0-100, calculated from patterns)
        burnoutRisk: { type: Number, min: 0, max: 100, default: 0 },
        lastAssessed: { type: Date },

        // Rest day configuration
        restDayEnabled: { type: Boolean, default: true },
        restDayOfWeek: { type: Number, min: 0, max: 6, default: 0 }, // 0 = Sunday

        // Streak pause credits (planned rest days that don't break streak)
        streakPauses: [{
            date: { type: Date, required: true },
            reason: { type: String, default: 'Planned rest' },
            createdAt: { type: Date, default: Date.now }
        }],
        streakPausesUsedThisMonth: { type: Number, default: 0 },
        streakPausesLimit: { type: Number, default: 2 }, // 2 per month

        // Mood history (weekly check-ins)
        moodHistory: [{
            date: { type: Date, default: Date.now },
            score: { type: Number, min: 1, max: 5 }, // 1=struggling, 5=great
            notes: { type: String },
            emotion: { type: String } // detected emotion that day
        }],

        // Break tracking
        lastBreakReminder: { type: Date },
        breaksTaken: { type: Number, default: 0 },
        averageSessionLength: { type: Number, default: 30 }, // minutes
        longestSessionWithoutBreak: { type: Number, default: 0 },

        // Healthy learning streak (days with breaks taken)
        wellnessStreak: { type: Number, default: 0 },

        // Energy pattern detection
        peakProductivityHours: [{ type: Number }], // e.g., [9, 10, 14, 15] for 9-10am and 2-3pm

        // Last wellbeing interaction
        lastCheckIn: { type: Date },
        dismissedBreakReminders: { type: Number, default: 0 }
    },

    // 📁 ENTERPRISE PORTFOLIO SYSTEM - Pro AI Resume Builder
    portfolio: {
        // ========== CORE IDENTITY ==========
        professionalSummary: { type: String, default: '' },
        headline: { type: String, default: '' }, // One-liner like "Full Stack Engineer | AI Enthusiast"

        // ========== CONTACT INFO ==========
        contactInfo: {
            email: { type: String, default: '' },
            phone: { type: String, default: '' },
            location: { type: String, default: '' },         // City, Country
            availability: {
                type: String,
                enum: ['immediately', '2_weeks', '1_month', '3_months', 'not_looking'],
                default: 'not_looking'
            },
            preferredContact: {
                type: String,
                enum: ['email', 'phone', 'linkedin'],
                default: 'email'
            }
        },

        // ========== CAREER OBJECTIVES ==========
        careerObjective: {
            shortTerm: { type: String, default: '' },        // 1-2 year goal
            longTerm: { type: String, default: '' },         // 5-year vision
            targetIndustries: [{ type: String }],
            preferredWorkType: {
                type: String,
                enum: ['remote', 'hybrid', 'onsite', 'flexible'],
                default: 'flexible'
            },
            salaryExpectation: { type: String, default: '' },
            willingToRelocate: { type: Boolean, default: false }
        },

        // ========== PROFESSIONAL EXPERIENCE ==========
        experience: [{
            role: { type: String, required: true },
            company: { type: String },
            companyLogo: { type: String },                   // URL to company logo
            location: { type: String },
            startDate: { type: String },
            endDate: { type: String },
            isCurrent: { type: Boolean, default: false },
            duration: { type: String },                      // Auto-calculated or manual
            description: { type: String },
            accomplishments: [{                              // STAR format achievements
                statement: { type: String },
                impact: { type: String },                    // Quantified result
                isHighlighted: { type: Boolean, default: false }
            }],
            technologies: [{ type: String }],
            employmentType: {
                type: String,
                enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship'],
                default: 'full_time'
            }
        }],

        // ========== EDUCATION ==========
        education: [{
            degree: { type: String },
            fieldOfStudy: { type: String },
            institution: { type: String },
            institutionLogo: { type: String },
            location: { type: String },
            startYear: { type: String },
            endYear: { type: String },
            gpa: { type: String },
            achievements: [{ type: String }],                // Dean's List, Honors, etc.
            coursework: [{ type: String }],                  // Relevant courses
            isOngoing: { type: Boolean, default: false }
        }],

        // ========== CERTIFICATIONS ==========
        certificates: [{
            title: { type: String, required: true },
            issuer: { type: String },
            issuerLogo: { type: String },
            issueDate: { type: String },
            expiryDate: { type: String },
            credentialId: { type: String },
            link: { type: String },
            isVerified: { type: Boolean, default: false },
            skills: [{ type: String }]                       // Skills this cert validates
        }],

        // ========== PROJECTS SHOWCASE ==========
        customProjects: [{
            title: { type: String, required: true },
            tagline: { type: String },                       // Short one-liner
            description: { type: String },
            problemSolved: { type: String },                 // What problem it addresses
            impact: { type: String },                        // Quantified results
            link: { type: String },
            githubLink: { type: String },
            demoVideo: { type: String },                     // Video demo URL
            thumbnail: { type: String },                     // Project image
            technologies: [{ type: String }],
            category: {
                type: String,
                enum: ['web', 'mobile', 'ai_ml', 'devops', 'data', 'blockchain', 'iot', 'other'],
                default: 'other'
            },
            role: { type: String },                          // Your role in the project
            teamSize: { type: Number },
            startDate: { type: String },
            endDate: { type: String },
            isHighlighted: { type: Boolean, default: false },
            isOpenSource: { type: Boolean, default: false }
        }],

        // ========== LANGUAGES ==========
        languages: [{
            name: { type: String, required: true },
            proficiency: {
                type: String,
                enum: ['native', 'fluent', 'professional', 'intermediate', 'basic'],
                default: 'intermediate'
            },
            certifications: [{ type: String }]               // IELTS, TOEFL, etc.
        }],

        // ========== SOFT SKILLS ==========
        softSkills: [{
            name: { type: String, required: true },
            endorsements: { type: Number, default: 0 },
            examples: [{ type: String }]                     // Concrete examples demonstrating skill
        }],

        // ========== VOLUNTEERING & COMMUNITY ==========
        volunteering: [{
            role: { type: String, required: true },
            organization: { type: String },
            organizationLogo: { type: String },
            cause: { type: String },                         // Education, Environment, etc.
            startDate: { type: String },
            endDate: { type: String },
            isCurrent: { type: Boolean, default: false },
            description: { type: String },
            impact: { type: String }                         // Quantified impact
        }],

        // ========== AWARDS & RECOGNITION ==========
        awards: [{
            title: { type: String, required: true },
            issuer: { type: String },
            date: { type: String },
            description: { type: String },
            link: { type: String },
            category: {
                type: String,
                enum: ['academic', 'professional', 'competition', 'community', 'other'],
                default: 'other'
            }
        }],

        // ========== PUBLICATIONS ==========
        publications: [{
            title: { type: String, required: true },
            publisher: { type: String },
            publicationType: {
                type: String,
                enum: ['research_paper', 'article', 'blog', 'book', 'case_study', 'whitepaper'],
                default: 'article'
            },
            date: { type: String },
            link: { type: String },
            doi: { type: String },                           // For academic papers
            coAuthors: [{ type: String }],
            abstract: { type: String }
        }],

        // ========== SPEAKING ENGAGEMENTS ==========
        speakingEngagements: [{
            title: { type: String, required: true },
            event: { type: String },
            eventType: {
                type: String,
                enum: ['conference', 'meetup', 'webinar', 'podcast', 'workshop', 'panel'],
                default: 'meetup'
            },
            date: { type: String },
            location: { type: String },
            audienceSize: { type: Number },
            link: { type: String },                          // Recording or slides
            topics: [{ type: String }]
        }],

        // ========== PROFESSIONAL REFERENCES ==========
        references: [{
            name: { type: String, required: true },
            title: { type: String },
            company: { type: String },
            relationship: {
                type: String,
                enum: ['manager', 'colleague', 'mentor', 'client', 'professor'],
                default: 'colleague'
            },
            email: { type: String },
            phone: { type: String },
            linkedin: { type: String },
            testimonial: { type: String },                   // Quote from reference
            isVisible: { type: Boolean, default: false }
        }],

        // ========== CUSTOM SECTIONS ==========
        customSections: [{
            sectionId: { type: String },
            sectionTitle: { type: String, required: true },
            sectionIcon: { type: String },                   // Icon name from lucide
            displayOrder: { type: Number, default: 0 },
            items: [{
                title: { type: String },
                subtitle: { type: String },
                description: { type: String },
                date: { type: String },
                link: { type: String }
            }]
        }],

        // ========== SOCIAL LINKS ==========
        socialLinks: {
            linkedin: { type: String },
            github: { type: String },
            twitter: { type: String },
            website: { type: String },
            youtube: { type: String },
            medium: { type: String },
            devto: { type: String },
            stackoverflow: { type: String },
            dribbble: { type: String },
            behance: { type: String },
            kaggle: { type: String }
        },

        // ========== SKILL SHOWCASE ==========
        featuredSkills: [{ type: String }],
        skillCategories: [{                                  // Group skills by category
            categoryName: { type: String },
            skills: [{ type: String }]
        }],

        // ========== ATS OPTIMIZATION ==========
        atsScore: {
            overall: { type: Number, min: 0, max: 100, default: 0 },
            keywords: { type: Number, min: 0, max: 100, default: 0 },
            formatting: { type: Number, min: 0, max: 100, default: 0 },
            completeness: { type: Number, min: 0, max: 100, default: 0 },
            suggestions: [{ type: String }],
            lastAnalyzed: { type: Date }
        },

        // ========== THEME & DISPLAY ==========
        portfolioTheme: {
            type: String,
            enum: ['professional', 'creative', 'minimalist', 'tech', 'executive'],
            default: 'professional'
        },
        accentColor: { type: String, default: '#4f46e5' },    // Custom accent color
        showZeeklectBadge: { type: Boolean, default: true },

        // ========== PRIVACY CONTROLS ==========
        privacySettings: {
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false },
            showLocation: { type: Boolean, default: true },
            showSalary: { type: Boolean, default: false },
            showReferences: { type: Boolean, default: false },
            showAge: { type: Boolean, default: false },
            isPublic: { type: Boolean, default: true },
            allowIndexing: { type: Boolean, default: true }   // For SEO crawlers
        },

        // ========== PORTFOLIO ANALYTICS ==========
        analytics: {
            totalViews: { type: Number, default: 0 },
            uniqueViews: { type: Number, default: 0 },
            lastViewed: { type: Date },
            viewHistory: [{
                date: { type: Date },
                source: { type: String }                      // Where traffic came from
            }]
        },

        // ========== META INFO ==========
        lastUpdated: { type: Date, default: Date.now },
        version: { type: Number, default: 1 },
        completionPercentage: { type: Number, min: 0, max: 100, default: 0 }
    },

    lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexing for performance is handled within the schema definition or via unique constraints.
// Removed duplicate index definition for 'goals.targetRole'.

// Auto-update lastUpdated on save (Preferred async pattern)
learnerProfileSchema.pre('save', async function () {
    if (process.env.NODE_ENV === "development") {
        console.log("[DEBUG] LearnerProfile hook executed");
    }
    this.lastUpdated = new Date();
});

export default mongoose.model('LearnerProfile', learnerProfileSchema);
