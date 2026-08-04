const BASE_URL = 'http://localhost:3005';

async function runTest() {
  let pravnoLiceId = null;

  try {
    console.log('1. Kreiranje Pravnog Lica...');
    const createRes = await fetch(`${BASE_URL}/api/pravno-lice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naziv: 'TEST NEON PRAVNO LICE',
        pib: '999999992',
        maticni_broj: '88888882'
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Greška pri kreiranju: ${JSON.stringify(createData)}`);
    pravnoLiceId = createData.pravnoLiceId;
    const procenaId = createData.procenaId;
    console.log(`✅ Pravno lice kreirano. ID: ${pravnoLiceId}, Procena ID: ${procenaId}`);

    console.log('\n2. Organizacija Procene (GET auto-create)...');
    const orgRes = await fetch(`${BASE_URL}/api/pravno-lice/${pravnoLiceId}/organizacija-procene`);
    const orgData = await orgRes.json();
    if (!orgRes.ok) throw new Error(`Greška organizacija: ${JSON.stringify(orgData)}`);
    console.log('✅ Organizacija OK. ID:', orgData.organizacija?.id);

    console.log('\n3. Risk Selection (POST sa integer danger_level)...');
    const riskRes = await fetch(`${BASE_URL}/api/procena/${procenaId}/risk-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk_id: '1.1', danger_level: 2, description: 'Test' })
    });
    const riskData = await riskRes.json();
    if (!riskRes.ok) throw new Error(`Greška risk: ${JSON.stringify(riskData)}`);
    console.log('✅ Risk Selection sačuvan (NOW() radi!).');

    console.log('\n4. Financial Data (POST - NOW() test)...');
    const finRes = await fetch(`${BASE_URL}/api/procena/${procenaId}/financial-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poslovniPrihodi: 1000000, vrednostImovine: 5000000, delatnost: 'Test', stvarnaSteta: 50000 })
    });
    const finData = await finRes.json();
    if (!finRes.ok) throw new Error(`Greška financial: ${JSON.stringify(finData)}`);
    console.log('✅ Financial Data sačuvan.');

    console.log('\n5. Brisanje (CASCADE DELETE test)...');
    const delRes = await fetch(`${BASE_URL}/api/pravno-lice?id=${pravnoLiceId}`, { method: 'DELETE' });
    const delData = await delRes.json();
    if (!delRes.ok) throw new Error(`Greška brisanje: ${JSON.stringify(delData)}`);
    console.log('✅ Pravno lice obrisano (Cascade OK).');

    console.log('\n🎉 SVI TESTOVI PROŠLI - NEON RADI!');
  } catch (error) {
    console.error('\n❌ TEST NIJE PROŠAO:', error.message);
    // Cleanup
    if (pravnoLiceId) {
      await fetch(`${BASE_URL}/api/pravno-lice?id=${pravnoLiceId}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

runTest();
