import { 
    LayoutDashboard, 
    FileText, 
    Rocket, 
    Zap, 
    Heart, 
    BarChart3, 
    Briefcase, 
    Brain, 
    BookOpen, 
    Wrench, 
    Settings,
    Search,
    Youtube,
    Sparkles
} from 'lucide-react';

export const commandMap = [
    // --- Evolution Hub ---
    { name: 'Dashboard', keywords: ['dash', 'home', 'overview'], href: '/dashboard', icon: LayoutDashboard, category: 'Evolution' },
    { name: 'Missions', keywords: ['missions', 'tasks', 'evolution', 'quests'], href: '/missions', icon: Rocket, category: 'Evolution' },
    { name: 'Course Library', keywords: ['courses', 'library', 'learn'], href: '/courses', icon: BookOpen, category: 'Evolution' },
    
    // --- Growth Hub ---
    { name: 'Performance', keywords: ['performance', 'growth', 'stats', 'progress'], href: '/growth', icon: Zap, category: 'Growth' },
    { name: 'Momentum', keywords: ['momentum', 'consistency', 'streak'], href: '/momentum', icon: BarChart3, category: 'Growth' },
    { name: 'Wellbeing', keywords: ['wellbeing', 'health', 'mind'], href: '/wellbeing', icon: Heart, category: 'Growth' },
    
    // --- Intelligence Hub ---
    { name: 'Career Radar', keywords: ['career', 'radar', 'acceleration', 'job'], href: '/career-acceleration', icon: Briefcase, category: 'Intelligence' },
    { name: 'AI Resume', keywords: ['resume', 'cv', 'builder'], href: '/ai-resume', icon: FileText, category: 'Intelligence' },
    { name: 'Skill Graph', keywords: ['graph', 'skills', 'visualization'], href: '/skill-graph', icon: Brain, category: 'Intelligence' },
    { name: 'Gap Analysis', keywords: ['gap', 'skills', 'analysis'], href: '/skill-analysis', icon: BarChart3, category: 'Intelligence' },
    { name: 'AI Intel', keywords: ['intel', 'intelligence', 'ai insights'], href: '/ai-intelligence', icon: Sparkles, category: 'Intelligence' },
    
    // --- Resources Hub ---
    { name: 'AI Tools', keywords: ['tools', 'productivity', 'apps'], href: '/ai-tools', icon: Wrench, category: 'Resources' },
    { name: 'Youtube Mentors', keywords: ['mentors', 'youtube', 'expert'], href: '/youtube', icon: Youtube, category: 'Resources' },
    { name: 'Portfolio', keywords: ['portfolio', 'projects', 'work'], href: '/dashboard?tab=portfolio', icon: Rocket, category: 'Resources' },
];

export const getSmartResults = (query) => {
    const lowerQuery = query?.toLowerCase() || '';
    
    // Default core tabs for empty or short queries
    if (lowerQuery.length < 2) {
        return commandMap.slice(0, 8); // Top 8 core apps
    }
    
    // 1. Filter Command Map (Quick Jumps)
    const matchedCommands = commandMap.filter(cmd => 
        cmd.name.toLowerCase().includes(lowerQuery) || 
        cmd.keywords.some(k => k.includes(lowerQuery)) ||
        cmd.category.toLowerCase().includes(lowerQuery)
    ).slice(0, 6);

    // 2. Add "AI Architect" results (Goal-oriented)
    const aiResult = {
        name: `Architect: "${query}"`,
        keywords: ['ai', 'generate'],
        href: `/ai-intelligence?q=${encodeURIComponent(query)}&autoSearch=true`,
        icon: Sparkles,
        category: 'AI Architect',
        isAi: true
    };

    return [...matchedCommands, aiResult];
};
