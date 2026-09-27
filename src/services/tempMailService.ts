import { EmailMessage, SavedMailbox } from '../types';

export const GUERRILLA_DOMAINS = [
  'guerrillamailblock.com',
  'guerrillamail.com',
  'sharklasers.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'pokemail.net',
  'spam4.me',
  'grr.la',
];

export const ONESEC_DOMAINS = [
  '1secmail.com',
  '1secmail.org',
  '1secmail.net',
  'kzcvv.com',
  'qiott.com',
  'wuuvo.com',
];

/**
 * Call Guerrilla Mail API
 * Replicates the PHP api_call function with session and sid_token support
 */
async function callGuerrillaMail(func: string, params: Record<string, any> = {}): Promise<any> {
  const queryParams = new URLSearchParams();
  queryParams.set('f', func);

  for (const [key, val] of Object.entries(params)) {
    // Note: Guerrilla Mail API set_email_user breaks if 'site' is passed. Never pass 'site'.
    if (key === 'site') continue;
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        val.forEach((item) => queryParams.append(`${key}[]`, String(item)));
      } else {
        queryParams.set(key, String(val));
      }
    }
  }

  const queryStr = queryParams.toString();

  // Try proxy endpoint first
  try {
    const res = await fetch(`/api/guerrilla?${queryStr}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        // If not valid JSON, try direct API
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy request failed, attempting direct API:', proxyErr);
  }

  // Fallback directly to Guerrilla Mail API (supports Access-Control-Allow-Origin: *)
  try {
    const directRes = await fetch(`https://api.guerrillamail.com/ajax.php?${queryStr}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (directRes.ok) {
      const text = await directRes.text();
      return JSON.parse(text);
    }
    throw new Error(`Direct API returned ${directRes.status}`);
  } catch (directErr) {
    // Ultimate fallback: JSONP via dynamic script tag
    return await guerrillaMailJsonp(func, params);
  }
}

function guerrillaMailJsonp(func: string, params: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'gm_cb_' + Math.random().toString(36).substring(2, 9);
    const script = document.createElement('script');

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Guerrilla Mail JSONP request timed out'));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Guerrilla Mail JSONP script failed to load'));
    };

    const query = new URLSearchParams();
    query.set('f', func);
    query.set('callback', callbackName);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        if (Array.isArray(v)) {
          v.forEach((item) => query.append(`${k}[]`, String(item)));
        } else {
          query.set(k, String(v));
        }
      }
    }

    script.src = `https://api.guerrillamail.com/ajax.php?${query.toString()}`;
    document.head.appendChild(script);
  });
}

/**
 * Call 1SecMail API with proxy and direct fallback
 */
async function call1SecMail(action: string, params: Record<string, string>): Promise<any> {
  const query = new URLSearchParams();
  query.set('action', action);
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v);
  }
  const queryStr = query.toString();

  // 1. Try local proxy first
  try {
    const res = await fetch(`/api/1secmail?${queryStr}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (proxyErr) {
    console.warn('1secmail proxy error:', proxyErr);
  }

  // 2. Try direct API
  try {
    const directRes = await fetch(`https://www.1secmail.com/api/v1/?${queryStr}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch (directErr) {
    console.warn('1secmail direct API unreachable:', directErr);
  }

  // Safe fallback if upstream is down
  if (action === 'getMessages') {
    return [];
  }
  return null;
}

export function extractOtpCode(subject: string, text: string = '', html: string = ''): string | null {
  const combined = `${subject}\n${text}\n${html.replace(/<[^>]*>/g, ' ')}`;

  const brandedPattern = /\b(FB|G|GH|DISCORD|TW|MS|TG|UBER)-([0-9]{4,8})\b/i;
  const brandedMatch = combined.match(brandedPattern);
  if (brandedMatch) return brandedMatch[0];

  const phrasePattern = /(?:verification|security|confirm(?:ation)?|activation|auth(?:entication)?|one-time|login|passcode|code(?:\s+is)?)\s*[:#-]?\s*([0-9]{4,8})\b/i;
  const phraseMatch = combined.match(phrasePattern);
  if (phraseMatch && phraseMatch[1]) return phraseMatch[1];

  const tagPattern = /<(?:strong|b|span|h[1-6]|div)[^>]*class="[^"]*(?:code|otp|token|pin)[^"]*"[^>]*>\s*([A-Za-z0-9]{4,8})\s*<\//i;
  const tagMatch = html.match(tagPattern);
  if (tagMatch && tagMatch[1]) return tagMatch[1];

  const digitPattern = /\b([0-9]{5,8})\b/;
  const digitMatch = combined.match(digitPattern);
  if (digitMatch && digitMatch[1]) return digitMatch[1];

  return null;
}

export function getCompanyLogoUrl(
  senderEmail: string,
  senderName: string = '',
  subject: string = ''
): { logoUrl?: string; initials: string; brandColor: string } {
  const text = `${senderEmail} ${senderName} ${subject}`.toLowerCase();

  const brands: Array<{ match: string[]; domain: string; color: string }> = [
    { match: ['guerrilla', 'guerrillamail'], domain: 'guerrillamail.com', color: '#16A34A' },
    { match: ['google', 'youtube', 'gmail'], domain: 'google.com', color: '#4285F4' },
    { match: ['facebook', 'meta', 'instagram'], domain: 'meta.com', color: '#0668E1' },
    { match: ['twitter', 'x.com'], domain: 'x.com', color: '#000000' },
    { match: ['discord'], domain: 'discord.com', color: '#5865F2' },
    { match: ['github'], domain: 'github.com', color: '#24292F' },
    { match: ['netflix'], domain: 'netflix.com', color: '#E50914' },
    { match: ['spotify'], domain: 'spotify.com', color: '#1DB954' },
    { match: ['apple'], domain: 'apple.com', color: '#000000' },
    { match: ['amazon', 'aws'], domain: 'amazon.com', color: '#FF9900' },
    { match: ['microsoft', 'xbox', 'outlook'], domain: 'microsoft.com', color: '#00A4EF' },
    { match: ['paypal'], domain: 'paypal.com', color: '#003087' },
    { match: ['steam', 'valvesoftware'], domain: 'steampowered.com', color: '#171A21' },
    { match: ['epic games'], domain: 'epicgames.com', color: '#313131' },
    { match: ['linkedin'], domain: 'linkedin.com', color: '#0A66C2' },
    { match: ['openai', 'chatgpt'], domain: 'openai.com', color: '#10A37F' },
    { match: ['roblox'], domain: 'roblox.com', color: '#E2231A' },
    { match: ['uber'], domain: 'uber.com', color: '#000000' },
    { match: ['tiktok'], domain: 'tiktok.com', color: '#000000' },
    { match: ['telegram'], domain: 'telegram.org', color: '#26A5E4' },
    { match: ['stripe'], domain: 'stripe.com', color: '#635BFF' },
  ];

  for (const b of brands) {
    if (b.match.some((m) => text.includes(m))) {
      return {
        logoUrl: `https://www.google.com/s2/favicons?domain=${b.domain}&sz=128`,
        initials: (senderName || b.match[0]).substring(0, 2).toUpperCase(),
        brandColor: b.color,
      };
    }
  }

  const parts = senderEmail.split('@');
  if (parts.length === 2) {
    const domain = parts[1].toLowerCase();
    if (!domain.includes('mail') && !domain.includes('bounce') && !domain.includes('reply')) {
      return {
        logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        initials: (senderName || parts[0]).substring(0, 2).toUpperCase(),
        brandColor: '#3B82F6',
      };
    }
  }

  const initials = (senderName || parts[0] || 'EM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'EM';
  return {
    initials,
    brandColor: '#6366F1',
  };
}

export async function fetchAvailableDomains(provider: 'guerrilla' | '1sec' = 'guerrilla'): Promise<string[]> {
  if (provider === 'guerrilla') {
    return GUERRILLA_DOMAINS;
  }
  return ONESEC_DOMAINS;
}

export const FIRST_NAMES = [
  'james', 'olivia', 'liam', 'emma', 'noah', 'amelia', 'oliver', 'sophia',
  'lucas', 'charlotte', 'alexander', 'isabella', 'benjamin', 'mia', 'henry', 'evelyn',
  'william', 'harper', 'elijah', 'camila', 'daniel', 'gianna', 'matthew', 'abigail',
  'jackson', 'luna', 'sebastian', 'ella', 'david', 'elizabeth', 'carter', 'sofia',
  'wyatt', 'emily', 'jayden', 'avery', 'john', 'mila', 'owen', 'scarlett',
  'dylan', 'eleanor', 'luke', 'madison', 'gabriel', 'layla', 'anthony', 'penelope',
  'isaac', 'chloe', 'grayson', 'victoria', 'julian', 'grace', 'christopher', 'zoey',
  'joshua', 'nora', 'andrew', 'riley', 'samuel', 'hazel', 'dominic', 'violet',
  'nathan', 'aurora', 'caleb', 'savannah', 'ryan', 'audrey', 'adrian', 'brooklyn',
  'miles', 'bella', 'eli', 'claire', 'nolan', 'skylar', 'christian', 'lucy',
  'aaron', 'paisley', 'cameron', 'everly', 'ezra', 'anna', 'thomas', 'caroline',
  'connor', 'nova', 'jeremiah', 'genesis', 'landon', 'emilia', 'kennedy', 'asher',
  'samantha', 'leo', 'maya', 'hudson', 'willow', 'hunter', 'kinsley', 'colton',
  'naomi', 'austin', 'aaliyah', 'colin', 'elena', 'ian', 'sarah', 'adam',
  'allison', 'jordan', 'gabriella', 'cooper', 'alice', 'easton', 'madelyn', 'roman',
  'cora', 'axel', 'ruby', 'angel', 'eva', 'jose', 'serenity', 'dominick',
  'autumn', 'xavier', 'adeline', 'tyler', 'hailey', 'leonardo', 'kevin', 'valentina',
  'brandon', 'isla', 'jason', 'eliana', 'parker', 'quinn', 'marcus', 'delilah',
  'clara', 'arthur', 'vivian', 'elias', 'clara', 'maxwell', 'lydia', 'vincent',
  'josephine', 'tristan', 'reese', 'harrison', 'sadie', 'nicolas', 'ivy', 'grant',
  'jade', 'silas', 'maria', 'weston', 'piper', 'george', 'ruby', 'victor',
  'brielle', 'brayden', 'rose', 'simon', 'melody', 'declan', 'iris', 'theo',
  'kendall', 'rowan', 'elise', 'jasper', 'eden', 'preston', 'laila', 'marina',
  'alina', 'felix', 'marley', 'edward', 'sienna', 'oscar', 'daisy', 'jonathan',
  'fiona', 'colin', 'teagan', 'brady', 'genevieve', 'kenneth', 'jocelyn', 'richard',
  'lucia', 'kaden', 'alivia', 'damon', 'harley', 'dante', 'arabella', 'patrick',
  'rebecca', 'brian', 'faith', 'kyle', 'esther', 'sean', 'georgia', 'stephen',
  'amber', 'bryce', 'callie', 'spencer', 'alyssa', 'travis', 'leila', 'derek',
  'hope', 'erik', 'tessa', 'shane', 'bianca', 'jeffrey', 'norah', 'colt',
  'valerie', 'alan', 'ruth', 'bradley', 'mckenna', 'trent', 'camilla', 'brendan'
];

export const LAST_NAMES = [
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis',
  'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas',
  'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'thompson', 'white',
  'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker', 'young',
  'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores',
  'green', 'adams', 'nelson', 'baker', 'hall', 'rivera', 'campbell', 'mitchell',
  'carter', 'roberts', 'gomez', 'phillips', 'evans', 'turner', 'diaz', 'parker',
  'cruz', 'edwards', 'collins', 'reyes', 'stewart', 'morris', 'morales', 'murphy',
  'cook', 'rogers', 'gutierrez', 'ortiz', 'morgan', 'cooper', 'peterson', 'bailey',
  'reed', 'kelly', 'howard', 'ramos', 'kim', 'cox', 'ward', 'richardson',
  'watson', 'brooks', 'chavez', 'wood', 'james', 'bennett', 'gray', 'mendoza',
  'ruiz', 'hughes', 'price', 'alvarez', 'castillo', 'sanders', 'patel', 'myers',
  'long', 'ross', 'foster', 'jimenez', 'powell', 'jenkins', 'perry', 'russell',
  'sullivan', 'bell', 'coleman', 'butler', 'henderson', 'barnes', 'gonzales', 'fisher',
  'vasquez', 'simmons', 'romero', 'jordan', 'patterson', 'alexander', 'hamilton', 'graham',
  'reynolds', 'griffin', 'wallace', 'moreno', 'west', 'cole', 'hayes', 'bryant',
  'herrera', 'gibson', 'ellis', 'tran', 'medina', 'aguilar', 'stevens', 'murray',
  'ford', 'castro', 'marshall', 'owens', 'harrison', 'fernandez', 'mcdonald', 'woods',
  'kennedy', 'wells', 'crawford', 'olson', 'webb', 'freeman', 'warren', 'black',
  'simpson', 'boyd', 'shaw', 'mason', 'burns', 'gordon', 'hunt', 'spencer',
  'hicks', 'holmes', 'palmer', 'stone', 'fox', 'perkins', 'carpenter', 'hart',
  'fleming', 'armstrong', 'weaver', 'berry', 'porter', 'gardner', 'lane', 'riley',
  'andrews', 'harper', 'chambers', 'griffin', 'bowman', 'curtis', 'hardy', 'elliott',
  'garrett', 'carr', 'burton', 'franklin', 'holloway', 'fowler', 'becker', 'mccarthy',
  'lynch', 'schmidt', 'wagner', 'maldonado', 'barker', 'cunningham', 'walsh', 'blake'
];

const MIDDLE_INITIALS = ['a', 'b', 'c', 'd', 'e', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w'];

export function generateRealisticHumanName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const num2 = Math.floor(Math.random() * 90 + 10); // 10 to 99
  const num3 = Math.floor(Math.random() * 900 + 100); // 100 to 999
  const num1 = Math.floor(Math.random() * 9 + 1); // 1 to 9
  const mid = MIDDLE_INITIALS[Math.floor(Math.random() * MIDDLE_INITIALS.length)];
  const recentYear = Math.floor(Math.random() * 25 + 1985); // 1985 to 2010

  const style = Math.floor(Math.random() * 9);
  switch (style) {
    case 0:
      // e.g. james.miller
      return `${first}.${last}`;
    case 1:
      // e.g. olivia.davis24
      return `${first}.${last}${num2}`;
    case 2:
      // e.g. liam_walker
      return `${first}_${last}`;
    case 3:
      // e.g. emmajohnson7
      return `${first}${last}${num1}`;
    case 4:
      // e.g. noah.m85
      return `${first}.${last.charAt(0)}${num2}`;
    case 5:
      // e.g. a.martinez73
      return `${first.charAt(0)}.${last}${num2}`;
    case 6:
      // e.g. charlotte-taylor
      return `${first}-${last}`;
    case 7:
      // e.g. lucas.r.clark
      return `${first}.${mid}.${last}`;
    case 8:
    default:
      // e.g. sophia.anderson98 or daniel.brown320
      return Math.random() > 0.5 ? `${first}.${last}${num3}` : `${first}.${last}.${recentYear % 100}`;
  }
}

export function generateRandomUsername(length: number = 8): string {
  return generateRealisticHumanName();
}

/**
 * Generate a new mailbox using Guerrilla Mail or 1secmail with real human names
 * Auto-detects and respects the chosen domain without broken site parameters
 */
export async function generateNewMailbox(
  provider: 'guerrilla' | '1sec' = 'guerrilla',
  customUsername?: string,
  customDomain?: string,
  existingSidToken?: string
): Promise<SavedMailbox> {
  const preferredDomain = customDomain && customDomain.trim() !== ''
    ? customDomain.trim().toLowerCase()
    : (provider === 'guerrilla' ? 'guerrillamailblock.com' : '1secmail.com');

  if (provider === 'guerrilla') {
    try {
      const humanUsername = customUsername
        ? customUsername.toLowerCase().replace(/[^a-z0-9._-]/g, '')
        : generateRealisticHumanName();

      const params: Record<string, any> = {
        email_user: humanUsername,
      };

      // Only pass sid_token when updating an existing session with a custom username
      if (customUsername && existingSidToken) {
        params.sid_token = existingSidToken;
      }

      const res = await callGuerrillaMail('set_email_user', params);

      if (res && (res.email_addr || res.auth?.success || res.sid_token)) {
        const userPart = res.email_addr ? res.email_addr.split('@')[0] : humanUsername;
        const fullAddress = `${userPart}@${preferredDomain}`;
        const sidToken = res.sid_token || existingSidToken;

        // Proactively delete default welcome message if present
        if (sidToken) {
          callGuerrillaMail('del_email', {
            'email_ids[]': ['1'],
            sid_token: sidToken,
          }).catch(() => {});
        }

        return {
          address: fullAddress,
          login: userPart,
          domain: preferredDomain,
          alias: res.alias,
          sidToken,
          provider: 'guerrilla',
          createdAt: Date.now(),
          lastUsedAt: Date.now(),
          messageCount: 0,
        };
      }
    } catch (gmError) {
      console.warn('Guerrilla Mail generation API hiccup, using resilient direct instance:', gmError);
    }

    // Direct fallback for Guerrilla Mail
    const fallbackLogin = customUsername
      ? customUsername.toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : generateRealisticHumanName();
    return {
      address: `${fallbackLogin}@${preferredDomain}`,
      login: fallbackLogin,
      domain: preferredDomain,
      provider: 'guerrilla',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      messageCount: 0,
    };
  }

  // 1secmail Fallback
  try {
    const domains = ONESEC_DOMAINS;
    const domain = customDomain && domains.includes(customDomain) ? customDomain : domains[0];
    const login = customUsername
      ? customUsername.toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : generateRealisticHumanName();

    const address = `${login}@${domain}`;
    return {
      address,
      login,
      domain,
      provider: '1sec',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      messageCount: 0,
    };
  } catch (err) {
    const fallbackLogin = generateRealisticHumanName();
    const fallbackDomain = preferredDomain || '1secmail.com';
    return {
      address: `${fallbackLogin}@${fallbackDomain}`,
      login: fallbackLogin,
      domain: fallbackDomain,
      provider: '1sec',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      messageCount: 0,
    };
  }
}

/**
 * Helper to identify automated welcome messages from provider defaults
 */
function isSystemWelcomeMessage(fromAddr: string, subject: string): boolean {
  const from = (fromAddr || '').toLowerCase();
  const subj = (subject || '').toLowerCase();
  return (
    from.includes('guerrillamail') ||
    subj.includes('welcome to guerrilla') ||
    subj.includes('welcome to guerrillamail') ||
    subj.includes('welcome to tamlid') ||
    (from.includes('no-reply') && (subj.includes('welcome') || subj.includes('guerrilla')))
  );
}

/**
 * Fetch incoming messages for active mailbox
 */
export async function fetchInboxMessages(mailbox: SavedMailbox): Promise<EmailMessage[]> {
  if (mailbox.provider === 'guerrilla') {
    try {
      const res = await callGuerrillaMail('check_email', {
        seq: 0,
        sid_token: mailbox.sidToken,
      });

      if (!res || !Array.isArray(res.list)) return [];

      const welcomeIdsToDelete: string[] = [];
      const userList = res.list.filter((item: any) => {
        const fromAddr = item.mail_from || 'Unknown';
        const subject = item.mail_subject || '(No Subject)';
        if (isSystemWelcomeMessage(fromAddr, subject)) {
          if (item.mail_id) {
            welcomeIdsToDelete.push(String(item.mail_id));
          }
          return false;
        }
        return true;
      });

      // Silently purge default welcome email from the server
      if (welcomeIdsToDelete.length > 0 && mailbox.sidToken) {
        callGuerrillaMail('del_email', {
          'email_ids[]': welcomeIdsToDelete,
          sid_token: mailbox.sidToken,
        }).catch(() => {});
      }

      return userList.map((item: any) => {
        const fromAddr = item.mail_from || 'Unknown';
        const subject = item.mail_subject || '(No Subject)';
        const { logoUrl } = getCompanyLogoUrl(fromAddr, '', subject);
        const timestamp = Number(item.mail_timestamp) ? Number(item.mail_timestamp) * 1000 : Date.now();
        const dateStr = item.mail_date || new Date(timestamp).toLocaleString();
        const detectedOtp = extractOtpCode(subject, item.mail_excerpt || '', item.mail_body || '');

        return {
          id: String(item.mail_id),
          from: {
            address: fromAddr,
            name: fromAddr.split('@')[0],
          },
          subject,
          date: dateStr,
          timestamp,
          excerpt: item.mail_excerpt || '',
          htmlBody: item.mail_body || undefined,
          textBody: item.mail_body || undefined,
          isRead: Number(item.mail_read) === 1,
          detectedOtp,
          serviceLogoUrl: logoUrl,
          size: item.size,
        };
      });
    } catch (err) {
      console.warn('Guerrilla Mail check_email error:', err);
    }
  }

  // 1secmail
  if (mailbox.provider === '1sec') {
    try {
      const data = await call1SecMail('getMessages', {
        login: mailbox.login,
        domain: mailbox.domain,
      });

      if (!Array.isArray(data)) return [];

      const userList = data.filter((item: any) => {
        const fromAddr = item.from || '';
        const subject = item.subject || '(No Subject)';
        return !isSystemWelcomeMessage(fromAddr, subject);
      });

      return userList.map((item: any) => {
        const fromAddr = item.from || '';
        const subject = item.subject || '(No Subject)';
        const { logoUrl } = getCompanyLogoUrl(fromAddr, '', subject);
        const parsedDate = new Date(item.date);
        const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
        const detectedOtp = extractOtpCode(subject);

        return {
          id: String(item.id),
          from: {
            address: fromAddr,
            name: fromAddr.split('@')[0],
          },
          subject,
          date: item.date,
          timestamp,
          isRead: false,
          detectedOtp,
          serviceLogoUrl: logoUrl,
        };
      });
    } catch (err) {
      console.warn('1SecMail fetch messages error:', err);
      return [];
    }
  }

  return [];
}

/**
 * Fetch full body of an email
 */
export async function fetchFullMessage(mailbox: SavedMailbox, messageId: string): Promise<EmailMessage> {
  if (mailbox.provider === 'guerrilla') {
    const res = await callGuerrillaMail('fetch_email', {
      email_id: messageId,
      sid_token: mailbox.sidToken,
    });

    if (!res) throw new Error('Failed to fetch Guerrilla Mail message');

    const fromAddr = res.mail_from || 'Unknown';
    const subject = res.mail_subject || '(No Subject)';
    const body = res.mail_body || '';
    const { logoUrl } = getCompanyLogoUrl(fromAddr, '', subject);
    const timestamp = Number(res.mail_timestamp) ? Number(res.mail_timestamp) * 1000 : Date.now();
    const dateStr = res.mail_date || new Date(timestamp).toLocaleString();
    const detectedOtp = extractOtpCode(subject, body, body);

    // Guerrilla Mail provides HTML body when formatted or plain text
    const isHtml = /<[a-z][\s\S]*>/i.test(body);

    return {
      id: String(res.mail_id),
      from: {
        address: fromAddr,
        name: fromAddr.split('@')[0],
      },
      subject,
      date: dateStr,
      timestamp,
      htmlBody: isHtml ? body : undefined,
      textBody: body,
      excerpt: res.mail_excerpt,
      isRead: true,
      detectedOtp,
      serviceLogoUrl: logoUrl,
      size: res.size,
    };
  }

  if (mailbox.provider === '1sec') {
    try {
      const data = await call1SecMail('readMessage', {
        login: mailbox.login,
        domain: mailbox.domain,
        id: messageId,
      });

      if (data && (data.id || data.from || data.subject)) {
        const fromAddr = data.from || '';
        const subject = data.subject || '(No Subject)';
        const htmlBody = data.htmlBody || '';
        const textBody = data.textBody || '';
        const { logoUrl } = getCompanyLogoUrl(fromAddr, '', subject);
        const parsedDate = new Date(data.date);
        const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
        const detectedOtp = extractOtpCode(subject, textBody, htmlBody);

        return {
          id: String(data.id || messageId),
          from: {
            address: fromAddr,
            name: fromAddr.split('@')[0],
          },
          subject,
          date: data.date || new Date().toLocaleString(),
          timestamp,
          htmlBody,
          textBody,
          isRead: true,
          detectedOtp,
          serviceLogoUrl: logoUrl,
        };
      }
    } catch (err) {
      console.warn('1SecMail read message error:', err);
    }
    throw new Error(`Failed to read message ${messageId}`);
  }

  throw new Error('Unsupported provider');
}

/**
 * Delete email message using Guerrilla Mail del_email
 */
export async function deleteEmailMessage(mailbox: SavedMailbox, messageId: string): Promise<boolean> {
  if (mailbox.provider === 'guerrilla' && mailbox.sidToken) {
    try {
      const res = await callGuerrillaMail('del_email', {
        'email_ids[]': [messageId],
        sid_token: mailbox.sidToken,
      });
      return res && Array.isArray(res.deleted_ids);
    } catch (e) {
      console.warn('Failed to delete on Guerrilla Mail server:', e);
    }
  }
  return true;
}

// Audio notification using Web Audio API
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}
