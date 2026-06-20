/**
 * Category tree — main categories with their subcategories.
 * The final stored value in the DB is: "MainCategory > Subcategory"
 * e.g. "Hosting > Web Hosting"
 *
 * To add a new category: add an entry to CATEGORIES.
 * To add a subcategory: add to the subs array of the parent.
 */

export const CATEGORIES = [
  {
    id: 'hosting',
    label: 'Hosting',
    icon: '🌐',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    subs: [
      'Web Hosting', 'VPS Hosting', 'Cloud Hosting',
      'Dedicated Server', 'Shared Hosting', 'Reseller Hosting',
    ],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    icon: '🤖',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    subs: [
      'Text Generation', 'Image Generation', 'Code Assistant',
      'Voice AI', 'Video AI', 'Data Analysis', 'Chatbot',
    ],
  },
  {
    id: 'software',
    label: 'Software',
    icon: '💻',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    subs: [
      'Desktop App', 'Mobile App', 'Browser Extension',
      'CLI Tool', 'SaaS', 'Open Source',
    ],
  },
  {
    id: 'database',
    label: 'Database',
    icon: '🗄️',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    subs: [
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'SQLite', 'Firebase', 'Supabase', 'PlanetScale',
    ],
  },
  {
    id: 'deploy',
    label: 'Deployment',
    icon: '🚀',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    subs: [
      'Docker', 'Kubernetes', 'CI/CD', 'Nginx',
      'AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Railway',
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    icon: '🎨',
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    subs: [
      'React', 'Vue', 'Angular', 'Next.js',
      'Svelte', 'HTML/CSS', 'Tailwind CSS', 'TypeScript',
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    icon: '⚙️',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    subs: [
      'FastAPI', 'Node.js', 'Django', 'Laravel',
      'Spring Boot', 'Express', 'NestJS', 'Go',
    ],
  },
  {
    id: 'media',
    label: 'Media',
    icon: '🎬',
    color: 'bg-red-50 text-red-700 border-red-200',
    subs: [
      'Movies', 'Anime', 'Music', 'Streaming',
      'Podcast', 'Video Editing', 'Image Tools',
    ],
  },
  {
    id: 'download',
    label: 'Downloads',
    icon: '📦',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    subs: [
      'Games', 'Apps', 'Scripts', 'Templates',
      'Fonts', 'Icons', 'Themes', 'Plugins',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    icon: '✨',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    subs: [
      'Tutorial', 'Documentation', 'API', 'Library',
      'Framework', 'Boilerplate', 'Starter Kit',
    ],
  },
];

/** Get main category object by label */
export function getCategoryByLabel(label) {
  return CATEGORIES.find(c => c.label === label);
}

/** Get main category from a stored subCategory string like "Frontend > React" */
export function parseSubCategory(value) {
  if (!value) return { main: null, sub: null };
  if (value.includes(' > ')) {
    const [main, sub] = value.split(' > ');
    return { main: main.trim(), sub: sub.trim() };
  }
  // Check if the plain string matches a known main category label
  const matchedCat = CATEGORIES.find(c => c.label.toLowerCase() === value.trim().toLowerCase());
  if (matchedCat) return { main: matchedCat.label, sub: null };
  // Check if it matches a subcategory of any known category (e.g. "React" → Frontend > React)
  for (const cat of CATEGORIES) {
    if (cat.subs?.some(s => s.toLowerCase() === value.trim().toLowerCase())) {
      return { main: cat.label, sub: value.trim() };
    }
  }
  // Unknown — treat as main category "Other" with the value as sub
  return { main: 'Other', sub: value.trim() };
}

/** Build the stored string from main + sub */
export function buildSubCategory(main, sub) {
  if (!main && !sub) return '';
  if (!sub) return main;
  return `${main} > ${sub}`;
}

/** Get all unique main categories from a list of projects */
export function getMainCategories(projects) {
  const mains = new Set();
  projects.forEach(p => {
    const { main } = parseSubCategory(p.subCategory);
    if (main) mains.add(main);
    else if (p.subCategory) mains.add(p.subCategory);
  });
  return [...mains].sort();
}
