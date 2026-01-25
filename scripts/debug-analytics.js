const { initDatabase, analyticsDb, qrDb } = require('../server/db/database');

async function run() {
    console.log('Initializing database...');
    // We cannot easily get dbPath from outside unless exported, but we can verify file existence here
    const fs = require('fs');
    const path = require('path');
    const intendedPath = path.join(__dirname, '../qrdinamico.db');
    console.log(`Checking DB at: ${intendedPath}`);
    console.log(`Exists? ${fs.existsSync(intendedPath)}`);
    if (fs.existsSync(intendedPath)) {
        console.log(`Size: ${fs.statSync(intendedPath).size} bytes`);
    }

    await initDatabase();

    // List tables
    const { analyticsDb, qrDb, userDb } = require('../server/db/database');
    // ... rest of script

    // Check total clicks
    const initialTotal = analyticsDb.getTotalClicks();
    console.log(`Initial Total Clicks: ${initialTotal}`);

    // Get a valid QR to test with (or creating a fake visiting log requires a qr_id)
    // Let's list all QRs
    const qrs = qrDb.findAll();
    if (qrs.length === 0) {
        console.log('No QRs found. Cannot test analytics insertion properly without a QR.');
        // Create one? No, let's assume valid state.
        return;
    }

    const testQr = qrs[0];
    console.log(`Testing with QR: ${testQr.short_id} (ID: ${testQr.id})`);
    console.log(`Current Visits for this QR (from QRCodes table): ${testQr.visits_count}`);

    // Check analytics table for this QR
    const initialQrStats = analyticsDb.getStats(testQr.id);
    console.log(`Initial Analytics Count for this QR: ${initialQrStats.total_visits}`);

    // Simulate a visit
    console.log('Simulating visit...');
    analyticsDb.logVisit(testQr.id, '127.0.0.1', 'Debug Script Agent', 'http://debug');

    // Also increment visits in qrcodes table (redirect.js does this manually too via qrDb.incrementVisits)
    qrDb.incrementVisits(testQr.id);

    console.log('Visit logged. Verifying...');

    // Verify
    const newTotal = analyticsDb.getTotalClicks();
    const newQrStats = analyticsDb.getStats(testQr.id);
    const updatedQr = qrDb.findById(testQr.id);

    console.log(`New Total Clicks: ${newTotal}`);
    console.log(`New Analytics Count for this QR: ${newQrStats.total_visits}`);
    console.log(`New Visits Count in QR Table: ${updatedQr.visits_count}`);

    if (newTotal > initialTotal && newQrStats.total_visits > initialQrStats.total_visits && updatedQr.visits_count > testQr.visits_count) {
        console.log('SUCCESS: Analytics updated correctly in memory.');
    } else {
        console.error('FAILURE: Analytics did not update.');
    }
}

run().catch(console.error);
