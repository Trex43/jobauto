import { logger } from '../utils/logger';

interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills: string[];
  experiences: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }[];
  educations: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    gpa?: string;
  }[];
  yearsOfExperience?: number;
  linkedInUrl?: string;
  githubUrl?: string;
}

// Common skill keywords
const COMMON_SKILLS = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'scala', 'r',
  // Web Technologies
  'html', 'css', 'react', 'vue', 'angular', 'node.js', 'express', 'next.js', 'tailwind', 'sass',
  // Databases
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase',
  // Cloud & DevOps
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'git', 'github',
  // Data & ML
  'machine learning', 'deep learning', 'data analysis', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch',
  // Frameworks & Tools
  'rest api', 'graphql', 'microservices', 'agile', 'scrum', 'jira', 'figma',
  // Soft Skills
  'leadership', 'communication', 'problem solving', 'team management', 'project management',
];

// Education keywords
const EDUCATION_KEYWORDS = ['university', 'college', 'bachelor', 'master', 'phd', 'mba', 'degree', 'diploma', 'certification'];

// Month patterns
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Extract email from text
 */
function extractEmail(text: string): string | undefined {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const match = text.match(emailRegex);
  return match ? match[0] : undefined;
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): string | undefined {
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  const match = text.match(phoneRegex);
  return match ? match[0] : undefined;
}

/**
 * Extract LinkedIn URL from text
 */
function extractLinkedIn(text: string): string | undefined {
  const linkedInRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/gi;
  const match = text.match(linkedInRegex);
  return match ? `https://${match[0]}` : undefined;
}

/**
 * Extract GitHub URL from text
 */
function extractGitHub(text: string): string | undefined {
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/gi;
  const match = text.match(githubRegex);
  return match ? `https://${match[0]}` : undefined;
}

/**
 * Extract skills from text
 */
function extractSkills(text: string): string[] {
  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const skill of COMMON_SKILLS) {
    if (lowerText.includes(skill.toLowerCase())) {
      // Capitalize properly
      const formattedSkill = skill.split(' ').map(word => 
        word === 'javascript' ? 'JavaScript' :
        word === 'typescript' ? 'TypeScript' :
        word === 'python' ? 'Python' :
        word === 'java' ? 'Java' :
        word === 'c++' ? 'C++' :
        word === 'c#' ? 'C#' :
        word === 'react' ? 'React' :
        word === 'vue' ? 'Vue' :
        word === 'angular' ? 'Angular' :
        word === 'node.js' ? 'Node.js' :
        word === 'express' ? 'Express' :
        word === 'next.js' ? 'Next.js' :
        word === 'sql' ? 'SQL' :
        word === 'mysql' ? 'MySQL' :
        word === 'postgresql' ? 'PostgreSQL' :
        word === 'mongodb' ? 'MongoDB' :
        word === 'redis' ? 'Redis' :
        word === 'aws' ? 'AWS' :
        word === 'azure' ? 'Azure' :
        word === 'gcp' ? 'GCP' :
        word === 'docker' ? 'Docker' :
        word === 'kubernetes' ? 'Kubernetes' :
        word === 'rest api' ? 'REST API' :
        word === 'graphql' ? 'GraphQL' :
        word === 'ci/cd' ? 'CI/CD' :
        word === 'machine learning' ? 'Machine Learning' :
        word === 'deep learning' ? 'Deep Learning' :
        word === 'data analysis' ? 'Data Analysis' :
        word === 'data science' ? 'Data Science' :
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      if (!foundSkills.includes(formattedSkill)) {
        foundSkills.push(formattedSkill);
      }
    }
  }
  
  return foundSkills;
}

/**
 * Extract name from resume (usually first substantial line)
 */
function extractName(lines: string[]): string | undefined {
  // Skip lines that look like headers or contact info
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    // Skip if it looks like email, phone, or a header
    if (trimmed.length > 2 && 
        trimmed.length < 50 && 
        !trimmed.includes('@') && 
        !trimmed.match(/^\d/) &&
        !trimmed.toLowerCase().includes('resume') &&
        !trimmed.toLowerCase().includes('cv')) {
      // Capitalize properly
      return trimmed.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  return undefined;
}

/**
 * Extract location
 */
function extractLocation(text: string): string | undefined {
  // Common location patterns
  const locationRegex = /(?:located in|location|city)[:\s]+([a-zA-Z\s,]+(?:,\s?[A-Z]{2})?)/i;
  const match = text.match(locationRegex);
  if (match) return match[1].trim();
  
  // Try to find city, state zip pattern
  const cityStateZip = /([a-zA-Z]+),\s+([A-Z]{2})\s+\d{5}/;
  const match2 = text.match(cityStateZip);
  if (match2) return `${match2[1]}, ${match2[2]}`;
  
  return undefined;
}

/**
 * Parse date from resume format
 */
function parseDate(dateStr: string): { year: number; month: number } | null {
  const lower = dateStr.toLowerCase();
  
  for (let i = 0; i < MONTHS.length; i++) {
    if (lower.includes(MONTHS[i])) {
      const yearMatch = lower.match(/\d{4}/);
      if (yearMatch) {
        return { year: parseInt(yearMatch[0]), month: i + 1 };
      }
    }
  }
  
  // Try just year
  const yearMatch = lower.match(/\d{4}/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[0]), month: 1 };
  }
  
  return null;
}

/**
 * Estimate years of experience from employment dates
 */
function calculateYearsOfExperience(experiences: { startDate: string; endDate?: string; isCurrent: boolean }[]): number {
  if (experiences.length === 0) return 0;
  
  const currentYear = new Date().getFullYear();
  let earliestYear = currentYear;
  
  for (const exp of experiences) {
    const start = parseDate(exp.startDate);
    if (start) {
      earliestYear = Math.min(earliestYear, start.year);
    }
  }
  
  const years = currentYear - earliestYear;
  return Math.max(0, Math.min(years, 30)); // Cap at 30 years
}

/**
 * Parse resume text and extract structured information
 */
export function parseResume(text: string): ParsedResume {
  logger.info('Parsing resume text...');
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const fullText = text.toLowerCase();
  
  // Extract basic info
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkedInUrl = extractLinkedIn(text);
  const githubUrl = extractGitHub(text);
  const skills = extractSkills(text);
  const name = extractName(lines);
  const location = extractLocation(text);
  
  // Extract headline (usually after name, before contact info)
  let headline: string | undefined;
  for (let i = 1; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].toLowerCase();
    if (!line.includes('@') && !line.match(/^\d/) && line.length > 10 && line.length < 100) {
      // This might be a headline
      if (line.includes('engineer') || line.includes('developer') || line.includes('manager') || 
          line.includes('designer') || line.includes('analyst') || line.includes('consultant')) {
        headline = lines[i];
        break;
      }
    }
  }
  
  // Extract experiences (looking for company patterns)
  const experiences: ParsedResume['experiences'] = [];
  const expPatterns = [
    /(?:experience|work history|employment)[:\s]*/i,
    /^(?:company|employer)[:\s]*/i,
  ];
  
  // Try to find job entries (title at company from - to)
  const jobEntryRegex = /(.+?)\s+(?:at|from)\s+(.+?)\s+(\w+\s+\d{4}|(?:\d{4}))\s*[-–]\s*(?:present|current|(\w+\s+\d{4})|(\d{4}))?/gi;
  let match;
  while ((match = jobEntryRegex.exec(text)) !== null) {
    if (match[1] && match[2] && match[1].length < 100) {
      experiences.push({
        title: match[1].trim(),
        company: match[2].trim(),
        startDate: match[3] || '',
        endDate: match[4] || match[5] || undefined,
        isCurrent: !match[4] && !match[5] && (match[0].toLowerCase().includes('present') || match[0].toLowerCase().includes('current')),
      });
    }
  }
  
  // Extract educations
  const educations: ParsedResume['educations'] = [];
  const eduRegex = /([a-zA-Z\s,]+?)\s*[-–]\s*(?:bachelor|master|phd|mba|diploma|certificate)/gi;
  while ((match = eduRegex.exec(text)) !== null) {
    const degree = match[2]?.toLowerCase() || 'Bachelor';
    const degreeFormatted = degree.charAt(0).toUpperCase() + degree.slice(1);
    educations.push({
      institution: match[1].trim(),
      degree: degreeFormatted,
      startDate: '',
      isCurrent: false,
    });
  }
  
  // Calculate years of experience
  const yearsOfExperience = calculateYearsOfExperience(experiences);
  
  const result: ParsedResume = {
    skills,
    experiences: experiences.slice(0, 5), // Limit to 5 experiences
    educations: educations.slice(0, 3), // Limit to 3 educations
  };
  
  // Add optional fields if found
  if (name) result.name = name;
  if (email) result.email = email;
  if (phone) result.phone = phone;
  if (location) result.location = location;
  if (headline) result.headline = headline;
  if (yearsOfExperience > 0) result.yearsOfExperience = yearsOfExperience;
  if (linkedInUrl) result.linkedInUrl = linkedInUrl;
  if (githubUrl) result.githubUrl = githubUrl;
  
  logger.info(`Resume parsed: found ${skills.length} skills, ${experiences.length} experiences`);
  
  return result;
}

/**
 * Clean and normalize resume text from various formats
 */
export function cleanResumeText(rawText: string): string {
  // Remove excessive whitespace
  let cleaned = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}
