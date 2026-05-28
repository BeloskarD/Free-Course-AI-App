import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LearnerProfile from './src/models/LearnerProfile.js';

// Load environment variables from backend directory
dotenv.config({ path: 'd:/backup/FreeCourseApp/ai-learning-platform/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://beloskardinesh_db_user:cg5AyS4ELvfzcijN@freecourseappcluster.odkhwt0.mongodb.net/test';

async function seed() {
    try {
        console.log("Connecting to MongoDB for seeding...", MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully!");

        const targetUserId = '696ea3e2597eb28b8af1c17f';
        console.log(`Searching for LearnerProfile with userId: ${targetUserId}...`);

        let profile = await LearnerProfile.findOne({ userId: new mongoose.Types.ObjectId(targetUserId) });
        if (!profile) {
            console.log("No profile found. Creating a new LearnerProfile for user ID...");
            profile = new LearnerProfile({
                userId: new mongoose.Types.ObjectId(targetUserId),
                goals: {
                    targetRole: 'Big Data Engineer',
                    targetTimeline: '6 months',
                    isOnboarded: true
                }
            });
        }

        // Populate beautiful high-fidelity portfolio data
        profile.portfolio = {
            professionalSummary: "Elite Big Data Engineer specializing in architecting high-throughput, low-latency distributed data systems and real-time streaming architectures. Proven track record in orchestrating multi-terabyte data pipelines with Apache Spark, Kafka, and Scala, driving cost-efficiency and performance enhancements. Passionate about software craftsmanship, micro-optimizations, and building highly reliable, fault-tolerant infrastructure.",
            headline: "Senior Big Data Engineer | Streaming Systems & Distributed Infrastructure",
            contactInfo: {
                email: "rakesh.data@zeeklect.com",
                phone: "+91 98765 43210",
                location: "Bangalore, India",
                availability: "immediately",
                preferredContact: "email"
            },
            careerObjective: {
                shortTerm: "Architect high-performance distributed architectures that process complex stream joins with sub-second latency.",
                longTerm: "Drive technology strategy and engineering excellence as a Principal Distributed Systems Architect at a global scale.",
                targetIndustries: ["Technology", "FinTech", "E-commerce"],
                preferredWorkType: "flexible",
                salaryExpectation: "₹35-45 LPA",
                willingToRelocate: true
            },
            experience: [
                {
                    role: "Senior Data Engineer",
                    company: "Quantum Stream Analytics",
                    location: "Bangalore, India (Remote)",
                    startDate: "Jan 2024",
                    endDate: "Present",
                    isCurrent: true,
                    duration: "1 yr 5 mos",
                    description: "Architected and managed high-throughput real-time data pipelines using Kafka, Apache Spark, and Scala on AWS EMR to ingest and process over 10TB of event streaming data daily. Optimized Snowflake storage and processing costs, leading to a 35% reduction in cloud infrastructure spending.",
                    accomplishments: [
                        {
                            statement: "Designed and implemented an automated real-time fraud detection pipeline using Spark Streaming, processing 15,000 events per second.",
                            impact: "Reduced fraudulent activity by 28% and saved the firm $1.2M annually.",
                            isHighlighted: true
                        },
                        {
                            statement: "Led the migration of legacy Hadoop clusters to a modern cloud-native Lakehouse architecture on AWS and Snowflake.",
                            impact: "Improved query performance by 4.5x and accelerated data availability from 4 hours to 2 minutes.",
                            isHighlighted: true
                        }
                    ],
                    technologies: ["Scala", "Apache Spark", "Apache Kafka", "AWS EMR", "Snowflake", "Databricks", "S3", "Athena"],
                    employmentType: "full_time"
                },
                {
                    role: "Data Engineer",
                    company: "DataVantage Solutions",
                    location: "Mumbai, India",
                    startDate: "Mar 2022",
                    endDate: "Dec 2023",
                    isCurrent: false,
                    duration: "1 yr 10 mos",
                    description: "Developed and optimized batch ETL/ELT pipelines using Python, SQL, and Apache Airflow to orchestrate data flows between relational databases and data warehouse systems. Worked closely with data science teams to prepare clean feature stores for ML modeling.",
                    accomplishments: [
                        {
                            statement: "Engineered robust, parallelized ETL workflows using Airflow and dbt to process structured and semi-structured user interaction logs.",
                            impact: "Achieved 99.9% data pipeline uptime and cut downstream dashboard load times by 50%.",
                            isHighlighted: true
                        }
                    ],
                    technologies: ["Python", "SQL", "Apache Airflow", "dbt", "PostgreSQL", "Google Cloud Platform", "Docker"],
                    employmentType: "full_time"
                }
            ],
            education: [
                {
                    degree: "M.S. in Computer Engineering",
                    fieldOfStudy: "Data Specialization",
                    institution: "Tech Institute of Technology",
                    location: "Pune, India",
                    startYear: "2020",
                    endYear: "2022",
                    gpa: "3.9/4.0",
                    achievements: ["Graduated with Distinction", "Published research paper on distributed stream joins in dynamic network environments"],
                    coursework: ["Distributed Systems", "Advanced Database Systems", "Big Data Analytics", "Machine Learning"]
                },
                {
                    degree: "B.Tech in Computer Science & Engineering",
                    fieldOfStudy: "Computer Science",
                    institution: "Apex University",
                    location: "Jaipur, India",
                    startYear: "2016",
                    endYear: "2020",
                    gpa: "8.8/10",
                    achievements: ["First Class with Distinction", "Won Gold Medal in Apex University Hackathon 2019"],
                    coursework: ["Data Structures", "Algorithms", "Database Management Systems", "Operating Systems"]
                }
            ],
            certificates: [
                {
                    title: "AWS Certified Data Engineer - Specialty",
                    issuer: "Amazon Web Services",
                    issueDate: "Feb 2024",
                    expiryDate: "Feb 2027",
                    credentialId: "AWS-DCE-89304",
                    link: "https://aws.amazon.com/verification",
                    isVerified: true,
                    skills: ["AWS", "Redshift", "EMR", "Glue", "Kinesis"]
                },
                {
                    title: "Databricks Certified Professional Spark Engineer",
                    issuer: "Databricks",
                    issueDate: "Nov 2023",
                    expiryDate: "Nov 2025",
                    credentialId: "DB-SPARK-72049",
                    link: "https://credentials.databricks.com/verify",
                    isVerified: true,
                    skills: ["Apache Spark", "Scala", "Data Lakehouse", "Delta Lake"]
                }
            ],
            customProjects: [
                {
                    title: "Zephyr-DB: Distributed Analytics Engine",
                    tagline: "High-performance columnar analytics engine built from scratch in Scala",
                    description: "Zephyr-DB is an in-memory columnar database engine optimized for analytical queries on large-scale datasets. It implements custom memory management, vectorized query execution, and compression algorithms (RLE, Dictionary encoding) to achieve near-instantaneous aggregations.",
                    problemSolved: "Existing analytical engines had huge memory overhead and slow cold start times on large datasets.",
                    impact: "Processes 100M+ rows under 80ms, outperforming standard Postgres aggregations by 25x.",
                    link: "https://zephyr-db.rakesh.dev",
                    githubLink: "https://github.com/rakesh-data/zephyr-db",
                    technologies: ["Scala", "Akka", "Netty", "Protobuf", "Docker"],
                    category: "data",
                    role: "Solo Architect",
                    teamSize: 1,
                    startDate: "Jan 2024",
                    endDate: "Apr 2024",
                    isHighlighted: true,
                    isOpenSource: true
                },
                {
                    title: "Aether-Flow: Real-time Ingestion Gateway",
                    tagline: "Ultra-low-latency event ingestion proxy written in Rust",
                    description: "Aether-Flow acts as a high-throughput gateway that receives, validates, and routes telemetry events from mobile and web applications to Kafka brokers. Built using actix-web and rdkafka, it utilizes zero-copy parsing and ring buffers to maximize throughput.",
                    problemSolved: "Standard Node.js proxies suffered from garbage collection pauses and CPU bottlenecks at peak traffic.",
                    impact: "Handled 1.2M concurrent connections with sub-millisecond response times at 15% less CPU utilization.",
                    link: "https://aether-flow.rakesh.dev",
                    githubLink: "https://github.com/rakesh-data/aether-flow",
                    technologies: ["Rust", "Actix", "Apache Kafka", "Prometheus", "Kubernetes"],
                    category: "ai_ml",
                    role: "Core Contributor",
                    teamSize: 2,
                    startDate: "Sep 2023",
                    endDate: "Dec 2023",
                    isHighlighted: false,
                    isOpenSource: true
                }
            ],
            languages: [
                { name: "English", proficiency: "fluent" },
                { name: "Hindi", proficiency: "native" }
            ],
            softSkills: [
                { name: "Distributed Systems Design", endorsements: 12, examples: ["Architected Kafka-based multi-region telemetry pipeline at Quantum Stream Analytics."] },
                { name: "Agile Team Leadership", endorsements: 8, examples: ["Mentored 4 junior data engineers and facilitated technical alignment sessions."] }
            ],
            awards: [
                {
                    title: "Outstanding Engineering Achievement Award",
                    issuer: "Quantum Stream Analytics",
                    date: "Dec 2024",
                    description: "Awarded for exceptional execution and performance optimization of the core streaming analytics pipeline.",
                    category: "professional"
                }
            ],
            socialLinks: {
                linkedin: "https://linkedin.com/in/rakesh-bigdata",
                github: "https://github.com/rakesh-data",
                twitter: "https://twitter.com/rakesh_bigdata",
                website: "https://rakesh-data.dev"
            },
            portfolioTheme: "professional",
            accentColor: "#4f46e5",
            showZeeklectBadge: true,
            privacySettings: {
                showEmail: false,
                showPhone: false,
                showLocation: true,
                showSalary: false,
                showReferences: false,
                showAge: false,
                isPublic: true,
                allowIndexing: true
            },
            completionPercentage: 95
        };

        // Also update goals.targetRole if needed
        profile.goals.targetRole = 'Big Data Engineer';

        await profile.save();
        console.log("Database update successful! Rakesh's portfolio is now fully populated.");

    } catch (err) {
        console.error("Seeding failed with error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

seed();
