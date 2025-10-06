// Music AI assistant - Uses local knowledge base with API fallback

import fetch from 'node-fetch';

// Simple music knowledge base for common queries
function getMusicKnowledge(query: string): string | null {
  const q = query.toLowerCase();
  
  // Artist info
  if (q.includes('taylor swift')) {
    return "Taylor Swift is an American singer-songwriter known for narrative songs about her personal life. She's one of the best-selling music artists of all time with albums like '1989', 'Folklore', and 'Midnights'.";
  }
  if (q.includes('beatles')) {
    return "The Beatles were an English rock band formed in Liverpool in 1960. Members John Lennon, Paul McCartney, George Harrison, and Ringo Starr are regarded as the most influential band of all time.";
  }
  if (q.includes('beyoncé') || q.includes('beyonce')) {
    return "Beyoncé is an American singer, songwriter, and actress. She rose to fame in the late 1990s as part of Destiny's Child and has since become one of the world's best-selling music artists with hits like 'Crazy in Love' and 'Halo'.";
  }
  if (q.includes('drake')) {
    return "Drake is a Canadian rapper, singer, and actor. He's one of the best-selling music artists with hits like 'God's Plan', 'One Dance', and 'Hotline Bling'.";
  }
  
  // Genre info
  if (q.includes('what is jazz') || q.includes('jazz music')) {
    return "Jazz is a music genre that originated in African-American communities in New Orleans in the late 19th and early 20th centuries. It's characterized by swing, blue notes, complex chords, and improvisation.";
  }
  if (q.includes('what is rock') || q.includes('rock music')) {
    return "Rock music is a broad genre that originated in the 1950s. It's characterized by a strong beat, simple chord progressions, and often centers on the electric guitar, bass guitar, and drums.";
  }
  if (q.includes('what is hip hop') || q.includes('hip-hop')) {
    return "Hip hop is a cultural movement that includes rapping, DJing, breakdancing, and graffiti. The music typically consists of rhythmic music with rapping over beats.";
  }
  
  return null;
}

const FALLBACK_ENDPOINTS = [
  {
    url: 'https://ai-wtsg.onrender.com/chat/',
    method: 'POST',
    buildUrl: (query: string) => 'https://ai-wtsg.onrender.com/chat/',
    buildBody: (query: string) => ({ message: query }),
    extractResponse: (data: any) => data.response || data.answer || data.reply || data.message
  }
];

export async function freegptChat({ messages, model = 'gpt-3.5-turbo', max_tokens = 400, temperature = 0.7 }) {
  const userMessage = messages[messages.length - 1]?.content || '';
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  
  const query = systemMessage ? `${systemMessage}\n\nUser: ${userMessage}` : userMessage;
  
  // Try local knowledge base first
  const localAnswer = getMusicKnowledge(query);
  if (localAnswer) {
    return localAnswer;
  }
  
  // Try API endpoints
  for (const endpoint of FALLBACK_ENDPOINTS) {
    try {
      const fetchOptions: any = {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      };
      
      if (endpoint.method === 'POST' && endpoint.buildBody) {
        fetchOptions.body = JSON.stringify(endpoint.buildBody(query));
      }
      
      const res = await fetch(endpoint.buildUrl(query), fetchOptions);
      
      if (!res.ok) {
        continue;
      }
      
      const data = await res.json();
      const response = endpoint.extractResponse(data);
      if (response && typeof response === 'string' && response.trim()) {
        return response;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback response
  return "I'm a music assistant! I can help you learn about popular artists like Taylor Swift, The Beatles, Beyoncé, and Drake, or explain music genres like jazz, rock, and hip-hop. Try searching for music or asking me about your favorite artists!";
}
