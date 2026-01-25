const { initDatabase, qrDb, analyticsDb } = require('../server/db/database');

async function checkStats() {
    await initDatabase();

    const shortId = process.argv[2];
    if (!shortId) {
        console.log('Please provide a shortId');
        return;
    }

    const qr = qrDb.findByShortId(shortId);
    if (!qr) {
        console.log(`QR code not found for ${shortId}`);
        return;
    }

    console.log(`Checking stats for QR ${shortId} (ID: ${qr.id})...`);
    console.log('Current Visits Count (QR table):', qr.visits_count);

    const stats = analyticsDb.getStats(qr.id);
    console.log('Analytics Table Count:', stats.total_visits);

    const recent = analyticsDb.getRecentVisits(qr.id, 5);
    console.log('Recent Visits:', JSON.stringify(recent, null, 2));

    const allVisits = analyticsDb.getVisitsByDate(qr.id, 30);
    console.log('Visits by Date:', JSON.stringify(allVisits, null, 2));
}

checkStats().catch(console.error);
