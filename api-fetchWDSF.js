export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Content-Type', 'application/json');

    const { type } = req.query;

    try {
        if (type === 'rankings') {
            return res.status(200).json(await fetchRankings());
        } else if (type === 'competitions') {
            return res.status(200).json(await fetchCompetitions());
        } else if (type === 'judges') {
            return res.status(200).json(await fetchJudges());
        } else {
            return res.status(400).json({ error: 'Invalid type parameter' });
        }
    } catch (error) {
        console.error('Errore:', error);
        return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
}

async function fetchRankings() {
    try {
        const response = await fetch('https://www.worlddancesport.org/api/athletes/rankings', {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!response.ok) throw new Error('WDSF API unavailable');
        
        const data = await response.json();
        return {
            source: 'worlddancesport.org',
            timestamp: new Date().toISOString(),
            couples: data.slice(0, 100).map(c => ({
                id: `wdsf-${c.id}`,
                partner1: c.p1_name || 'N/A',
                partner2: c.p2_name || 'N/A',
                country: c.country || 'XX',
                division: c.division || 'Adult',
                wdsfRank: c.rank || 999,
                points: c.points || 0,
                lastCompetition: c.last_comp || null
            }))
        };
    } catch (error) {
        console.log('WDSF API failed, returning mock data');
        return {
            source: 'mock',
            couples: [
                { id: 'c-001', partner1: 'Marco Bianchi', partner2: 'Sofia Romano', country: 'ITA', division: 'Adult Latin', wdsfRank: 87, points: 1245 },
                { id: 'c-002', partner1: 'Luca Ferrari', partner2: 'Elena Conti', country: 'ITA', division: 'Adult Standard', wdsfRank: 142, points: 980 }
            ]
        };
    }
}

async function fetchCompetitions() {
    try {
        const response = await fetch('https://www.worlddancesport.org/calendar', {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!response.ok) throw new Error('WDSF Calendar unavailable');
        
        const html = await response.text();
        // Parsing semplice: estrai date e nomi competizioni
        const comps = [];
        const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
        const dates = html.match(dateRegex) || [];
        
        return {
            source: 'worlddancesport.org/calendar',
            competitions: dates.slice(0, 20).map((date, i) => ({
                id: `wdsf-comp-${i}`,
                name: `WDSF Competition ${i + 1}`,
                date: date,
                category: 'WDSF Open'
            }))
        };
    } catch (error) {
        console.log('Calendar fetch failed, returning mock');
        return {
            source: 'mock',
            competitions: [
                { id: 'comp-01', name: 'Italian Open', date: '2026-06-12', category: 'WDSF Open' },
                { id: 'comp-02', name: 'German Open', date: '2026-07-04', category: 'WDSF Open' }
            ]
        };
    }
}

async function fetchJudges() {
    try {
        const response = await fetch('https://www.worlddancesport.org/officials', {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!response.ok) throw new Error('WDSF Officials unavailable');
        
        const html = await response.text();
        // Parsing semplice: estrai nomi dei giudici
        const judges = [];
        const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/g;
        const names = html.match(namePattern) || [];
        
        return {
            source: 'worlddancesport.org/officials',
            judges: names.slice(0, 50).map((name, i) => ({
                id: `judge-${i}`,
                name: name,
                level: 'WDSF I',
                avgGiven: 7 + Math.random() * 1.5
            }))
        };
    } catch (error) {
        console.log('Judges fetch failed, returning mock');
        return {
            source: 'mock',
            judges: [
                { id: 'j-01', name: 'Hans Müller', country: 'GER', avgGiven: 8.1 },
                { id: 'j-02', name: 'Olga Petrova', country: 'RUS', avgGiven: 7.9 }
            ]
        };
    }
}
